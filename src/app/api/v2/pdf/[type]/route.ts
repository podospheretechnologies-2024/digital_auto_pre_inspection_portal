import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { loadActiveSessionUser } from "@/lib/auth-users";
import { canAccessJob } from "@/lib/jobs/access";
import { isBoth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { buildSamplePdfData } from "@/lib/pdf/sample-data";
import {
  PdfDataNotFoundError,
  pdfRenderService,
  isPdfTemplateId,
  resolveTemplateId,
  type VehiclePdfType,
} from "@/lib/services/pdf";
import { loadInspectionPdfData } from "@/lib/pdf/load-data";
import { isStorageConfigured, uploadPdf } from "@/lib/services/files";

const VALID_TYPES: VehiclePdfType[] = ["2w", "3w", "4w"];

async function inspectionJobId(
  type: VehiclePdfType,
  inspectionId: number,
): Promise<number | null> {
  const row =
    type === "2w"
      ? await db.tbl_2wheeler.findUnique({
          where: { id: inspectionId },
          select: { job_id: true },
        })
      : type === "3w"
        ? await db.tbl_3wheeler.findUnique({
            where: { id: inspectionId },
            select: { job_id: true },
          })
        : await db.tbl_4wheeler.findUnique({
            where: { id: inspectionId },
            select: { job_id: true },
          });
  return row?.job_id ?? null;
}

function parseId(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

/**
 * Pre-Inspection PDF (Phase 6).
 *
 * GET /api/v2/pdf/2w|3w|4w
 *   ?inspectionId=123   — tbl_*wheeler.id (Laravel PDFController $id)
 *   ?jobId=456          — latest inspection for tbl_jobs.id
 *   ?sample=1           — smoke-test sample (default when no ids)
 *   &format=html        — HTML preview
 *   &store=1            — upload PDF to S3/MinIO, return JSON
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const user = await loadActiveSessionUser(Number(session.user.id));
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { type: rawType } = await context.params;
  const type = rawType.toLowerCase() as VehiclePdfType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      {
        error: "Invalid PDF type (Pre-Inspection only)",
        allowed: VALID_TYPES,
        outOfScope: ["valuation", "office", "fi"],
      },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const templateParam = searchParams.get("template");
  const templateId =
    templateParam && isPdfTemplateId(templateParam)
      ? templateParam
      : resolveTemplateId(type);
  const asHtml = searchParams.get("format") === "html";
  const store = searchParams.get("store") === "1";
  const sample =
    searchParams.get("sample") === "1" ||
    searchParams.get("sample") === "true";
  const inspectionId =
    parseId(searchParams.get("inspectionId")) ??
    parseId(searchParams.get("id"));
  const jobId = parseId(searchParams.get("jobId"));

  try {
    let data;
    let resolvedTemplateId = templateId;
    let source: "sample" | "db" = "sample";

    if (!sample && (inspectionId != null || jobId != null)) {
      const linkedJobId =
        jobId ??
        (inspectionId != null
          ? await inspectionJobId(type, inspectionId)
          : undefined);
      if (linkedJobId == null) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      const job = await db.tbl_jobs.findFirst({
        where: { id: linkedJobId },
        select: { agent_id: true, bank_id: true },
      });
      if (!job || !(await canAccessJob(user, job))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const loaded = await loadInspectionPdfData({
        type,
        inspectionId,
        jobId,
      });
      data = loaded.data;
      resolvedTemplateId = loaded.templateId;
      source = "db";
    } else {
      if (!isBoth(user)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      data = buildSamplePdfData(templateId);
    }

    if (asHtml) {
      const html = pdfRenderService.renderHtml(resolvedTemplateId, data);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-PDF-Source": source,
        },
      });
    }

    const result = await pdfRenderService.render(resolvedTemplateId, data);

    if (store) {
      if (!isStorageConfigured()) {
        return NextResponse.json(
          {
            error: "S3 storage not configured",
            hint: "Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY — or use LOCAL_UPLOAD_DIR",
          },
          { status: 503 },
        );
      }
      const uploaded = await uploadPdf(
        `pi/${type}/${result.filename}`,
        result.buffer,
      );
      return NextResponse.json({
        phase: 6,
        scope: "pre-inspection",
        source,
        filename: result.filename,
        templateId: resolvedTemplateId,
        inspectionId: inspectionId ?? null,
        jobId: jobId ?? null,
        stored: { key: uploaded.key, url: uploaded.url },
      });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-PDF-Source": source,
      },
    });
  } catch (err) {
    if (err instanceof PdfDataNotFoundError) {
      return NextResponse.json(
        {
          error: "Inspection not found",
          message: err.message,
          type,
          inspectionId: inspectionId ?? null,
          jobId: jobId ?? null,
          hint: "Pass ?inspectionId= or ?jobId=, or ?sample=1 for smoke test",
        },
        { status: 404 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "PDF render failed",
        message,
        templateId,
        type,
        phase: 6,
        scope: "pre-inspection",
      },
      { status: 500 },
    );
  }
}
