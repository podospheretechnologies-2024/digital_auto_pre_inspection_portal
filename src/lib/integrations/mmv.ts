/**
 * Laravel RestAPI MMV fulltext match + RC search helpers.
 */

import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import {
  apiVehicleDetailGovt,
  findRcDetail,
} from "@/lib/integrations/vahan";
import { normalizeRegn } from "@/lib/integrations/normalize";

function buildBooleanQuery(maker: string, model: string, fuel: string): string {
  const searchString = [maker, model, fuel].filter(Boolean).join(" ");
  const words = searchString.match(/[a-zA-Z0-9]+/g) ?? [];
  return words.map((w) => `+${w}*`).join(" ");
}

export async function findMmvMasterForRc(rc: {
  rc_maker_desc?: string | null;
  rc_maker_model?: string | null;
  rc_fuel_desc?: string | null;
}): Promise<Record<string, unknown> | null> {
  const maker = (rc.rc_maker_desc ?? "").trim();
  const model = (rc.rc_maker_model ?? "").trim();
  const fuel = (rc.rc_fuel_desc ?? "").trim();
  const booleanQuery = buildBooleanQuery(maker, model, fuel);
  if (!booleanQuery) return null;

  try {
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT vahan_id, make_old, make, type, type2, modal, variant, seating_capacity,
              cubic_capacity, gvw, fuel_type, Veh_Type_Name, Carrying_Capacity, SubClass,
              MATCH(make_old, make, modal, variant, fuel_type) AGAINST (? IN BOOLEAN MODE) as score
       FROM mmv_masters
       WHERE MATCH(make_old, make, modal, variant, fuel_type) AGAINST (? IN BOOLEAN MODE)
          ${maker ? "OR make LIKE ?" : ""}
          ${model ? "OR modal LIKE ?" : ""}
       ORDER BY score DESC
       LIMIT 1`,
      booleanQuery,
      booleanQuery,
      ...(maker ? [`%${maker}%`] : []),
      ...(model ? [`%${model}%`] : []),
    );
    return rows[0] ?? null;
  } catch {
    // Fulltext index may be missing on local scaffolds
    return null;
  }
}

export async function loadRcWithOptionalRefresh(
  vehicleRegistrationNumber: string,
  opts?: { maskData?: boolean },
): Promise<Prisma.rc_detailsGetPayload<object> | null> {
  const vrn = normalizeRegn(vehicleRegistrationNumber);
  let rc = await findRcDetail(vrn, { maxAgeHours: 24 });
  if (!rc) {
    try {
      await apiVehicleDetailGovt(vrn, opts?.maskData ?? false);
    } catch {
      // fall through to stale/any row
    }
    rc = await findRcDetail(vrn);
  }
  if (!rc) {
    rc = await findRcDetail(vrn);
  }
  return rc;
}
