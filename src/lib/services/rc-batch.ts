/**
 * Port of Laravel state RC batch commands (`cron:ARC` … `WRC`, `RC2`).
 * Used by Pre-Inspection vehicle RC detail pulls.
 */

import { db } from "@/lib/db";
import { apiVehicleDetailGovt } from "@/lib/integrations/vahan";

export type RcBatchJobData = {
  prefix: string;
  limit?: number;
  dryRun?: boolean;
};

export type RcBatchResult = {
  ok: true;
  prefix: string;
  processed: number;
  failures: Array<{ id: number; vrn: string; error: string }>;
  dryRun: boolean;
};

export async function processRcBatch(
  data: RcBatchJobData,
): Promise<RcBatchResult> {
  const limit = data.limit ?? 50;
  const dryRun = data.dryRun ?? false;
  const prefix = data.prefix.toUpperCase();

  let rows: Array<{ id: number; vehicle_registration_number: string }>;

  if (prefix === "2" || prefix === "RC2") {
    rows = await db.$queryRaw`
      SELECT id, vehicle_registration_number
      FROM search_vrn_to_rc_details
      WHERE pulled_at IS NULL
      ORDER BY id ASC
      LIMIT ${limit}
    `;
  } else {
    const like = `${prefix}%`;
    rows = await db.$queryRaw`
      SELECT id, vehicle_registration_number
      FROM search_vrn_to_rc_details
      WHERE vehicle_registration_number LIKE ${like}
        AND pulled_at IS NULL
      ORDER BY id ASC
      LIMIT ${limit}
    `;
  }

  const failures: RcBatchResult["failures"] = [];
  let processed = 0;

  for (const row of rows) {
    const vrn = String(row.vehicle_registration_number ?? "").trim();
    if (!vrn) continue;
    try {
      if (!dryRun) {
        await apiVehicleDetailGovt(vrn);
        const pulledAt = new Date();
        await db.$executeRaw`
          UPDATE search_vrn_to_rc_details
          SET pulled_at = ${pulledAt}
          WHERE id = ${row.id}
        `;
      }
      processed += 1;
    } catch (err) {
      failures.push({
        id: row.id,
        vrn,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { ok: true, prefix, processed, failures, dryRun };
}
