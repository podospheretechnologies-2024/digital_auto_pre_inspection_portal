import { NextResponse } from "next/server";

import { requireBothUser, requireSessionUser, zodErrorResponse } from "@/lib/api";
import {
  createJobSchema,
  jobListFilterSchema,
} from "@/lib/jobs/schemas";
import { createJob, listJobs } from "@/lib/services/job-assignment";
import { isAll, isBoth } from "@/lib/rbac";

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

  const filter = { ...parsed.data };

  // Surveyor pending: force agent_id to self
  if (filter.list === "pending") {
    if (!isAll(user)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    filter.agent_id = Number(user.id);
  } else if (!isBoth(user) && filter.list !== "all") {
    // Non-HO users can only see their pending / assigned
    if (!isAll(user)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const data = await listJobs(filter);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs]", error);
    return NextResponse.json({ data: [], message: "Jobs unavailable" });
  }
}

export async function POST(request: Request) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await createJob(user, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/jobs POST]", error);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}
