import { NextResponse } from "next/server";

import { requireBothWithPermission, zodErrorResponse } from "@/lib/api";
import { jobActionError } from "@/lib/jobs/http";
import { resolveWheelKind, type WheelKind } from "@/lib/jobs/helpers";
import { qcSubmitSchema } from "@/lib/jobs/schemas";
import { listQcDone, listQcQueue, submitQc } from "@/lib/services/qc";

/**
 * GET /api/v2/jobs/qc?vehicle_type=2wheeler|3wheeler|4wheeler|all&done=1
 * POST /api/v2/jobs/qc — submit QC
 */
export async function GET(request: Request) {
  const user = await requireBothWithPermission("qc_view");
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const rawType = url.searchParams.get("vehicle_type") ?? "all";
  const done = url.searchParams.get("done") === "1";
  const agentId = url.searchParams.get("agent_id");

  try {
    if (done) {
      const kind =
        rawType === "all"
          ? undefined
          : (resolveWheelKind(rawType) as WheelKind);
      if (kind) {
        const data = await listQcDone({ vehicle_type: kind });
        return NextResponse.json({ data });
      }
      const [a, b, c] = await Promise.all([
        listQcDone({ vehicle_type: "2wheeler" }),
        listQcDone({ vehicle_type: "3wheeler" }),
        listQcDone({ vehicle_type: "4wheeler" }),
      ]);
      return NextResponse.json({ data: [...a, ...b, ...c] });
    }

    const vehicle_type =
      rawType === "all"
        ? ("all" as const)
        : resolveWheelKind(rawType);

    const data = await listQcQueue({
      vehicle_type,
      agent_id: agentId ? Number(agentId) : undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs/qc GET]", error);
    return NextResponse.json({ data: [], message: "QC unavailable" });
  }
}

export async function POST(request: Request) {
  const user = await requireBothWithPermission("qc_edit");
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = qcSubmitSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await submitQc(user, parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    return jobActionError(error, "[api/v2/jobs/qc POST]");
  }
}
