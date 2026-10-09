import { NextResponse } from "next/server";

import { requireBothWithPermission, zodErrorResponse } from "@/lib/api";
import { canAccessJob } from "@/lib/jobs/access";
import { jobActionError } from "@/lib/jobs/http";
import { workflowActionSchema } from "@/lib/jobs/schemas";
import { applyWorkflowAction, getJobById } from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/v2/jobs/[id]/workflow — { action: hold|resume|cancel|restore } */
export async function POST(request: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = workflowActionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const permission =
    parsed.data.action === "hold" || parsed.data.action === "resume"
      ? "hold_edit"
      : parsed.data.action === "restore"
        ? "cancel_edit"
        : "cancel_delete";
  const user = await requireBothWithPermission(permission);
  if (user instanceof NextResponse) return user;

  const existing = await getJobById(jobId);
  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (!(await canAccessJob(user, existing))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await applyWorkflowAction(
      jobId,
      parsed.data.action,
      Number(user.id),
    );
    return NextResponse.json({ data, ok: true });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs/workflow]");
  }
}
