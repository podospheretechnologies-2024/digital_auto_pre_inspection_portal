import { NextResponse } from "next/server";

import { requireBothUser, zodErrorResponse } from "@/lib/api";
import { changeStageSchema } from "@/lib/jobs/schemas";
import { changeJobStage } from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/v2/jobs/[id]/change-stage — { stage: fresh|assigned|qc_pending } */
export async function POST(request: Request, context: RouteContext) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = changeStageSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await changeJobStage(
      jobId,
      parsed.data.stage,
      Number(user.id),
    );
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
    if (error instanceof Error && error.message === "INVALID_TRANSITION") {
      return NextResponse.json(
        { message: "That stage change is not allowed from here" },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "NO_INSPECTION") {
      return NextResponse.json(
        { message: "No inspection found for this case" },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "NO_AGENT") {
      return NextResponse.json(
        { message: "Case has no assigned surveyor" },
        { status: 422 },
      );
    }
    console.error("[api/v2/jobs/change-stage]", error);
    return NextResponse.json(
      { message: "Change stage failed" },
      { status: 500 },
    );
  }
}
