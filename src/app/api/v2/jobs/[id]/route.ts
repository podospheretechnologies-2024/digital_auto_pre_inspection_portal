import { NextResponse } from "next/server";

import { denyUnlessButtonPermission, denyUnlessPagePermission, requireBothWithPermission, requireSessionUser, zodErrorResponse } from "@/lib/api";
import { canAccessJob } from "@/lib/jobs/access";
import { jobActionError } from "@/lib/jobs/http";
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
  const denied = denyUnlessPagePermission(user, "jobs_view");
  if (denied) return denied;

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
    if (!(await canAccessJob(user, data))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
  const user = await requireBothWithPermission("jobs_edit");
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = updateJobSchema.safeParse({ ...body, id });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await getJobById(id);
  if (!existing) {
    return NextResponse.json({ message: "Job not found" }, { status: 404 });
  }
  if (!(await canAccessJob(user, existing))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await updateJob(parsed.data, Number(user.id));
    return NextResponse.json({ data });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs/[id] PUT]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireBothWithPermission("cancel_delete");
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const existing = await getJobById(id);
  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (!(await canAccessJob(user, existing))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteJob(id, Number(user.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs/[id] DELETE]");
  }
}