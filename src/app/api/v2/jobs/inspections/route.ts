import { NextResponse } from "next/server";

import { denyUnlessButtonPermission, denyUnlessPagePermission, requireAllUser, zodErrorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { canAccessJob, canWorkInspection } from "@/lib/jobs/access";
import { isBoth } from "@/lib/rbac";
import { resolveWheelKind } from "@/lib/jobs/helpers";
import { inspectionCoreSchema } from "@/lib/jobs/schemas";
import {
  getInspectionById,
  getInspectionByJobId,
  saveInspection,
  updateInspection,
} from "@/lib/services/inspection";
import { listInspectionPhotos } from "@/lib/services/inspection-media";
import { getJobById } from "@/lib/services/job-assignment";
import { resolveMediaUrl } from "@/lib/services/files";

async function jobRef(jobId: number) {
  return db.tbl_jobs.findFirst({
    where: { id: jobId },
    select: { agent_id: true, bank_id: true, is_deleted: true, on_hold: true },
  });
}

/**
 * GET /api/v2/jobs/inspections?job_id=&type=2wheeler|3wheeler|4wheeler
 *   or ?id=&type=
 * POST /api/v2/jobs/inspections — create inspection
 * PUT /api/v2/jobs/inspections — update ({ inspection_id, ... })
 */
export async function GET(request: Request) {
  const user = await requireAllUser();
  if (user instanceof NextResponse) return user;
  const denied = denyUnlessPagePermission(user, "inspect_view");
  if (denied) return denied;

  const url = new URL(request.url);
  const jobId = Number(url.searchParams.get("job_id"));
  const inspId = Number(url.searchParams.get("id"));
  const typeParam = url.searchParams.get("type");

  try {
    if (inspId > 0 && typeParam) {
      const kind = resolveWheelKind(typeParam);
      const data = await getInspectionById(inspId, kind);
      if (!data) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      const jobId = (data as { job_id?: number | null }).job_id;
      const job = jobId ? await jobRef(jobId) : null;
      if (!job || !(await canAccessJob(user, job))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const photos = await listInspectionPhotos(kind, inspId);
      return NextResponse.json({
        data: {
          ...data,
          photos,
          chassisphoto_url: resolveMediaUrl(
            (data as { chassisphoto?: string | null }).chassisphoto,
          ),
          video_url: resolveMediaUrl(
            (data as { video?: string | null }).video,
            {
              folder: "upload_videos",
              s3Url: (data as { s3video_url?: string | null }).s3video_url,
            },
          ),
        },
        wheel_kind: kind,
      });
    }

    if (jobId > 0) {
      const job = await getJobById(jobId);
      if (!job) {
        return NextResponse.json({ message: "Job not found" }, { status: 404 });
      }
      if (!(await canAccessJob(user, job))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const kind = typeParam
        ? resolveWheelKind(typeParam)
        : resolveWheelKind(job.vehicle_type);
      const data = await getInspectionByJobId(jobId, kind);
      if (!data) {
        return NextResponse.json({ data: null, job, wheel_kind: kind });
      }
      const photos = await listInspectionPhotos(kind, data.id);
      return NextResponse.json({
        data: {
          ...data,
          photos,
          chassisphoto_url: resolveMediaUrl(
            (data as { chassisphoto?: string | null }).chassisphoto,
          ),
          video_url: resolveMediaUrl(
            (data as { video?: string | null }).video,
            {
              folder: "upload_videos",
              s3Url: (data as { s3video_url?: string | null }).s3video_url,
            },
          ),
        },
        job,
        wheel_kind: kind,
      });
    }

    return NextResponse.json(
      { message: "job_id or id+type required" },
      { status: 422 },
    );
  } catch (error) {
    console.error("[api/v2/jobs/inspections GET]", error);
    return NextResponse.json({ message: "Load failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAllUser();
  if (user instanceof NextResponse) return user;
  const denied = denyUnlessButtonPermission(user, "inspect_edit");
  if (denied) return denied;

  const body = await request.json();
  const type = body.vehicle_type ?? body.type ?? "4wheeler";
  const parsed = inspectionCoreSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const job = await jobRef(parsed.data.job_id);
    if (!job || !(await canWorkInspection(user, job))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (job.on_hold === 1) {
      return NextResponse.json(
        { message: "That stage change is not allowed from here" },
        { status: 422 },
      );
    }
    if (parsed.data.skip_qc && !isBoth(user)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const existing = await getInspectionByJobId(parsed.data.job_id, type);
    if (existing) {
      return NextResponse.json(
        { message: "Inspection already exists for this job", data: existing },
        { status: 409 },
      );
    }
    const data = await saveInspection(user, type, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/jobs/inspections POST]", error);
    return NextResponse.json({ message: "Save failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await requireAllUser();
  if (user instanceof NextResponse) return user;
  const denied = denyUnlessButtonPermission(user, "inspect_edit");
  if (denied) return denied;

  const body = await request.json();
  const inspectionId = Number(body.inspection_id ?? body.id);
  const type = body.vehicle_type ?? body.type ?? "4wheeler";
  if (!inspectionId) {
    return NextResponse.json(
      { message: "inspection_id required" },
      { status: 422 },
    );
  }

  const parsed = inspectionCoreSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const kind = resolveWheelKind(String(type));
    const existing = await getInspectionById(inspectionId, kind);
    const existingJobId = (existing as { job_id?: number | null } | null)?.job_id;
    if (!existing || !existingJobId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const job = await jobRef(existingJobId);
    if (!job || !(await canWorkInspection(user, job))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (job.on_hold === 1) {
      return NextResponse.json(
        { message: "That stage change is not allowed from here" },
        { status: 422 },
      );
    }
    if (Number((existing as { qc?: number | null }).qc ?? 0) === 1 && !isBoth(user)) {
      return NextResponse.json(
        { message: "Completed inspection cannot be edited" },
        { status: 422 },
      );
    }
    if (parsed.data.skip_qc && !isBoth(user)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (parsed.data.job_id !== existingJobId) {
      return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
    }
    const data = await updateInspection(
      user,
      kind,
      inspectionId,
      parsed.data,
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs/inspections PUT]", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
