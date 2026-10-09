import { NextResponse } from "next/server";

import { denyUnlessButtonPermission, requireSessionUser, zodErrorResponse } from "@/lib/api";
import { canAccessJob } from "@/lib/jobs/access";
import { jobActionError } from "@/lib/jobs/http";
import { assignAgentSchema } from "@/lib/jobs/schemas";
import { isBoth } from "@/lib/rbac";
import { assignJob, getJobById } from "@/lib/services/job-assignment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/v2/jobs/[id]/assign — { agent_id } */
export async function POST(request: Request, context: RouteContext) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;
  const denied = denyUnlessButtonPermission(user, "assign_edit");
  if (denied) return denied;
  if (!isBoth(user) && user.type !== "RO") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  const body = await request.json();
  const parsed = assignAgentSchema.safeParse({
    job_id: jobId,
    agent_id: body.agent_id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await getJobById(parsed.data.job_id);
  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (!(await canAccessJob(user, existing))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await assignJob(
      parsed.data.job_id,
      parsed.data.agent_id,
      Number(user.id),
    );
    return NextResponse.json({ data });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs/assign]");
  }
}
