import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/api";
import { resolveJobScope } from "@/lib/jobs/access";
import { getJobStageCounts } from "@/lib/jobs/stage-counts";

export async function GET() {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  try {
    const scope = await resolveJobScope(user);
    const data = await getJobStageCounts(scope);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs/stage-counts]", error);
    return NextResponse.json(
      { message: "Failed to load workflow counts" },
      { status: 500 },
    );
  }
}
