import { NextResponse } from "next/server";

import { requireBothUser, zodErrorResponse } from "@/lib/api";
import { workflowActionSchema } from "@/lib/jobs/schemas";
import { applyWorkflowAction } from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/v2/jobs/[id]/workflow — { action: hold|resume|cancel|restore } */
export async function POST(request: Request, context: RouteContext) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = workflowActionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await applyWorkflowAction(jobId, parsed.data.action);
    return NextResponse.json({ data, ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "CANCELLED") {
      return NextResponse.json(
        { message: "Job is cancelled — restore first" },
        { status: 422 },
      );
    }
    console.error("[api/v2/jobs/workflow]", error);
    return NextResponse.json({ message: "Workflow action failed" }, { status: 500 });
  }
}
