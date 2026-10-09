import { NextResponse } from "next/server";

import { requireBothWithPermission, zodErrorResponse } from "@/lib/api";
import { canAccessJob } from "@/lib/jobs/access";
import { jobActionError } from "@/lib/jobs/http";
import { changeStageSchema } from "@/lib/jobs/schemas";
import { changeJobStage, getJobById } from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/v2/jobs/[id]/change-stage — { stage: fresh|assigned|qc_pending } */
export async function POST(request: Request, context: RouteContext) {
  const user = await requireBothWithPermission("jobs_edit");
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = changeStageSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await getJobById(jobId);
  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (!(await canAccessJob(user, existing))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await changeJobStage(
      jobId,
      parsed.data.stage,
      Number(user.id),
      parsed.data.reason,
    );
    return NextResponse.json({ data, ok: true });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs/change-stage]");
  }
}
