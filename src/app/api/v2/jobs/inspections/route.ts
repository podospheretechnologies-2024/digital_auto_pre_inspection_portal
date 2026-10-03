import { NextResponse } from "next/server";

import { requireAllUser, zodErrorResponse } from "@/lib/api";
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

/**
 * GET /api/v2/jobs/inspections?job_id=&type=2wheeler|3wheeler|4wheeler
 *   or ?id=&type=
 * POST /api/v2/jobs/inspections — create inspection
 * PUT /api/v2/jobs/inspections — update ({ inspection_id, ... })
 */
export async function GET(request: Request) {
  const user = await requireAllUser();
  if (user instanceof NextResponse) return user;

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

  const body = await request.json();
  const type = body.vehicle_type ?? body.type ?? "4wheeler";
  const parsed = inspectionCoreSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
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
