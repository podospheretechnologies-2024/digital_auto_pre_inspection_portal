import { NextResponse } from "next/server";

import { requireBothUser } from "@/lib/api";
import { listJobHistory } from "@/lib/services/job-history";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/v2/jobs/[id]/history — case activity rows (newest first) */
export async function GET(_request: Request, context: RouteContext) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const { id: idParam } = await context.params;
  const jobId = Number(idParam);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ message: "Invalid job id" }, { status: 422 });
  }

  try {
    const data = await listJobHistory(jobId);
    return NextResponse.json({ data, ok: true });
  } catch (error) {
    console.error("[api/v2/jobs/history]", error);
    return NextResponse.json(
      { data: [], message: "History unavailable" },
      { status: 500 },
    );
  }
}
