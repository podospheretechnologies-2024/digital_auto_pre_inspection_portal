import { NextResponse } from "next/server";

import { denyUnlessPagePermission, requireBothWithPermission, requireSessionUser, zodErrorResponse } from "@/lib/api";
import { resolveJobScope } from "@/lib/jobs/access";
import { jobActionError } from "@/lib/jobs/http";
import { listPagePermission } from "@/lib/route-access";
import {
  createJobSchema,
  jobListFilterSchema,
} from "@/lib/jobs/schemas";
import { createJob, listJobs } from "@/lib/services/job-assignment";
import { isBoth } from "@/lib/rbac";

/**
 * GET /api/v2/jobs?list=fresh|schedule|pending|all&q=&agent_id=&bank_id=
 * POST /api/v2/jobs — create intimation (is_both)
 */
export async function GET(request: Request) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const parsed = jobListFilterSchema.safeParse({
    list: url.searchParams.get("list") ?? "all",
    agent_id: url.searchParams.get("agent_id") ?? undefined,
    bank_id: url.searchParams.get("bank_id") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const denied = denyUnlessPagePermission(user, listPagePermission(parsed.data.list));
  if (denied) return denied;

  const filter = { ...parsed.data };
  const scope = await resolveJobScope(user);

  if (filter.list === "pending") {
    filter.agent_id = Number(user.id);
  } else if (!isBoth(user)) {
    filter.agent_id = undefined;
    filter.bank_id = undefined;
  }

  try {
    const data = await listJobs(filter, scope);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs]", error);
    return NextResponse.json({ data: [], message: "Jobs unavailable" });
  }
}

export async function POST(request: Request) {
  const user = await requireBothWithPermission("jobs_entry");
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await createJob(user, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs POST]");
  }
}
