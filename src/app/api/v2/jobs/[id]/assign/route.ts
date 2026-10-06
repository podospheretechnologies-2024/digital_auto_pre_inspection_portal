import { NextResponse } from "next/server";

import { requireBothUser, zodErrorResponse } from "@/lib/api";
import { assignAgentSchema } from "@/lib/jobs/schemas";
import { assignJob } from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/v2/jobs/[id]/assign — { agent_id } */
export async function POST(request: Request, context: RouteContext) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  const body = await request.json();
  const parsed = assignAgentSchema.safeParse({
    job_id: jobId,
    agent_id: body.agent_id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await assignJob(
      parsed.data.job_id,
      parsed.data.agent_id,
      Number(user.id),
    );
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SURVEYOR") {
      return NextResponse.json(
        {
          message:
            "Assign only a verified Surveyor linked to an RO (parent_id)",
        },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "INVALID_PARENT_RO") {
      return NextResponse.json(
        { message: "Surveyor's parent RO is missing or not verified" },
        { status: 422 },
      );
    }
    console.error("[api/v2/jobs/assign]", error);
    return NextResponse.json({ message: "Assign failed" }, { status: 500 });
  }
}
