import { NextResponse } from "next/server";

import { requireBothUser, requireSessionUser, zodErrorResponse } from "@/lib/api";
import { updateJobSchema } from "@/lib/jobs/schemas";
import {
  deleteJob,
  getJobById,
  updateJob,
} from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v2/jobs/[id]
 * PUT /api/v2/jobs/[id] — update intimation
 * DELETE /api/v2/jobs/[id] — soft delete
 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  try {
    const data = await getJobById(id);
    if (!data) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs/[id]]", error);
    return NextResponse.json(
      { message: "Failed to load job. Check DATABASE_URL / schema." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = updateJobSchema.safeParse({ ...body, id });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await updateJob(parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs/[id] PUT]", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  try {
    await deleteJob(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/jobs/[id] DELETE]", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
