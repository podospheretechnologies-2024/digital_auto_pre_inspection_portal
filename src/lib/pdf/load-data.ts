/**
 * Load Pre-Inspection PDF payload from Prisma (Laravel PDFController parity).
 *
 * Joins tbl_{2|3|4}wheeler + tbl_jobs + masters + agent + gallery images.
 */

import { db } from "@/lib/db";
import { resolveUploadImageUrl, resolveVideoUrl } from "@/lib/pdf/media-url";
import type {
  PdfDocumentData,
  PdfImage,
  PdfPrintData,
  PdfTemplateId,
  VehiclePdfType,
} from "@/lib/pdf/types";
import { resolveTemplateId } from "@/lib/pdf/registry";

export type LoadPdfDataOpts = {
  type: VehiclePdfType;
  /** tbl_*wheeler.id (Laravel PDFController $id) */
  inspectionId?: number;
  /** tbl_jobs.id — uses latest inspection for that job */
  jobId?: number;
};

export class PdfDataNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfDataNotFoundError";
  }
}

function reportTitleFor(
  type: VehiclePdfType,
  printdata: PdfPrintData,
): string {
  const price = Number(printdata.valuation_price ?? 0);
  const kind =
    price > 0 ? "INSPECTION REPORT" : "PRE INSPECTION REPORT";

  if (type === "2w") return `2-WHEELER ${kind}`;
  if (type === "3w") return `3-WHEELER ${kind}`;

  const vt = String(printdata.vehicle_type ?? "4 Wheeler");
  if (vt === "Commercial Vehicle") return `COMMERCIAL VEHICLE ${kind}`;
  if (vt === "4 Wheeler") return `4-WHEELER ${kind}`;
  // Blade fourPDF else branch
  return `AGRICULTURE TRACTOR ${kind}`;
}

function toPrintValue(v: unknown): string | number | boolean | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return v;
  }
  return String(v);
}

function rowToPrintData(row: Record<string, unknown>): PdfPrintData {
  const out: PdfPrintData = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = toPrintValue(v);
  }
  return out;
}

async function loadMastersAndAgent(job: {
  company_id: number | null;
  model_id: number | null;
  variant_id: number | null;
  bank_id: number | null;
  agent_id: number | null;
  cdate: Date;
  cname: string | null;
  mobileno: string | null;
  address: string | null;
  bank_ref_no: string | null;
  dti_no: string;
  created_at: Date | null;
  vehicle_type: string | null;
}) {
  const [company, model, variant, bank, agent] = await Promise.all([
    job.company_id
      ? db.m_company.findUnique({ where: { id: job.company_id } })
      : null,
    job.model_id ? db.m_model.findUnique({ where: { id: job.model_id } }) : null,
    job.variant_id
      ? db.m_variant.findUnique({ where: { id: job.variant_id } })
      : null,
    job.bank_id ? db.m_bank.findUnique({ where: { id: job.bank_id } }) : null,
    job.agent_id ? db.users.findUnique({ where: { id: job.agent_id } }) : null,
  ]);

  return {
    company: company?.name ?? null,
    model: model?.name ?? null,
    variant: variant?.name ?? null,
    bankname: bank?.name ?? null,
    fname: agent?.first_name ?? null,
    lname: agent?.last_name ?? null,
    vehicle_type: variant?.vehicle_type ?? job.vehicle_type ?? null,
    request_date: job.cdate,
    request_date1: job.created_at,
    cname: job.cname,
    mobileno: job.mobileno,
    address: job.address,
    bank_ref_no: job.bank_ref_no,
    dti_no: job.dti_no,
  };
}

async function loadImages(
  type: VehiclePdfType,
  parentId: number,
): Promise<{ images: PdfImage[]; firstImage: PdfImage | null }> {
  let rows: Array<{ image: string | null; s3_url?: string | null }> = [];

  if (type === "2w") {
    // Legacy 2W gallery has no s3_url column — public/upload_images only
    const list = await db.tbl_2wheeler_images.findMany({
      where: { parent_id: parentId },
      orderBy: { id: "asc" },
    });
    rows = list.map((r) => ({ image: r.image, s3_url: null as string | null }));
  } else if (type === "3w") {
    const list = await db.tbl_3wheeler_images.findMany({
      where: { parent_id: parentId },
      orderBy: { id: "asc" },
    });
    rows = list.map((r) => ({ image: r.image, s3_url: r.s3_url }));
  } else {
    const list = await db.tbl_4wheeler_images.findMany({
      where: { parent_id: parentId },
      orderBy: { id: "asc" },
    });
    rows = list.map((r) => ({ image: r.image, s3_url: r.s3_url }));
  }

  const images: PdfImage[] = [];
  for (const r of rows) {
    const url = resolveUploadImageUrl(r.image, r.s3_url);
    if (url) images.push({ url, caption: r.image ?? undefined });
  }
  return { images, firstImage: images[0] ?? null };
}

async function resolveInspectionId(
  type: VehiclePdfType,
  opts: LoadPdfDataOpts,
): Promise<number> {
  if (opts.inspectionId != null && Number.isFinite(opts.inspectionId)) {
    return opts.inspectionId;
  }
  if (opts.jobId == null || !Number.isFinite(opts.jobId)) {
    throw new PdfDataNotFoundError(
      "Provide inspectionId or jobId (or sample=1 for smoke test)",
    );
  }

  if (type === "2w") {
    const row = await db.tbl_2wheeler.findFirst({
      where: { job_id: opts.jobId },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    if (!row) throw new PdfDataNotFoundError(`No 2W inspection for job ${opts.jobId}`);
    return row.id;
  }
  if (type === "3w") {
    const row = await db.tbl_3wheeler.findFirst({
      where: { job_id: opts.jobId },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    if (!row) throw new PdfDataNotFoundError(`No 3W inspection for job ${opts.jobId}`);
    return row.id;
  }
  const row = await db.tbl_4wheeler.findFirst({
    where: { job_id: opts.jobId },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (!row) throw new PdfDataNotFoundError(`No 4W inspection for job ${opts.jobId}`);
  return row.id;
}

export async function loadInspectionPdfData(
  opts: LoadPdfDataOpts,
): Promise<{ templateId: PdfTemplateId; data: PdfDocumentData }> {
  const type = opts.type;
  const templateId = resolveTemplateId(type);
  const inspectionId = await resolveInspectionId(type, opts);

  let inspection: Record<string, unknown> | null = null;
  let jobId: number | null = null;

  if (type === "2w") {
    const row = await db.tbl_2wheeler.findUnique({ where: { id: inspectionId } });
    if (!row) throw new PdfDataNotFoundError(`2W inspection ${inspectionId} not found`);
    inspection = { ...row };
    jobId = row.job_id;
  } else if (type === "3w") {
    const row = await db.tbl_3wheeler.findUnique({ where: { id: inspectionId } });
    if (!row) throw new PdfDataNotFoundError(`3W inspection ${inspectionId} not found`);
    inspection = { ...row };
    jobId = row.job_id;
  } else {
    const row = await db.tbl_4wheeler.findUnique({ where: { id: inspectionId } });
    if (!row) throw new PdfDataNotFoundError(`4W inspection ${inspectionId} not found`);
    inspection = { ...row };
    jobId = row.job_id;
  }

  if (jobId == null) {
    throw new PdfDataNotFoundError(
      `Inspection ${inspectionId} has no job_id`,
    );
  }

  const job = await db.tbl_jobs.findUnique({ where: { id: jobId } });
  if (!job || job.is_deleted) {
    throw new PdfDataNotFoundError(`Job ${jobId} not found`);
  }

  const masters = await loadMastersAndAgent(job);
  const { images, firstImage } = await loadImages(type, inspectionId);

  const printdata = rowToPrintData({
    ...inspection,
    ...masters,
  });

  const videoUrl = resolveVideoUrl(
    printdata.video as string | null,
    printdata.s3video_url as string | null,
  );
  if (videoUrl) printdata.video_url = videoUrl;

  const chassisUrl = resolveUploadImageUrl(
    printdata.chassisphoto as string | null,
  );
  if (chassisUrl) printdata.chassisphoto_url = chassisUrl;

  const title = reportTitleFor(type, printdata);

  return {
    templateId,
    data: {
      title,
      date: new Date().toLocaleDateString("en-IN"),
      reportTitle: title,
      insurerRefNo: printdata.insurer_ref_no != null
        ? String(printdata.insurer_ref_no)
        : undefined,
      dtiNo: printdata.dti_no != null ? String(printdata.dti_no) : undefined,
      bankRefNo:
        printdata.bank_ref_no != null ? String(printdata.bank_ref_no) : undefined,
      printdata,
      images,
      firstImage,
    },
  };
}

/** Map Phase 5 WheelKind / vehicle_type strings → VehiclePdfType. */
export function parseVehiclePdfType(raw: string): VehiclePdfType | null {
  const s = raw.toLowerCase().trim();
  if (s === "2w" || s === "2wheeler" || s === "2-wheeler" || s === "2 wheeler") {
    return "2w";
  }
  if (s === "3w" || s === "3wheeler" || s === "3-wheeler" || s === "3 wheeler") {
    return "3w";
  }
  if (s === "4w" || s === "4wheeler" || s === "4-wheeler" || s === "4 wheeler") {
    return "4w";
  }
  return null;
}

/** Build the URL Phase 5 UI should open for a completed inspection. */
export function buildPiPdfUrl(opts: {
  type: VehiclePdfType | string;
  inspectionId: number;
  format?: "pdf" | "html";
  store?: boolean;
}): string {
  const type = parseVehiclePdfType(String(opts.type)) ?? "4w";
  const params = new URLSearchParams();
  params.set("inspectionId", String(opts.inspectionId));
  if (opts.format === "html") params.set("format", "html");
  if (opts.store) params.set("store", "1");
  return `/api/v2/pdf/${type}?${params.toString()}`;
}
