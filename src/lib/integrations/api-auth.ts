/**
 * External API auth helpers mirroring Laravel RestAPI / vehicle-rc checks.
 */

import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";

export type ApiUser = {
  id: number;
  permissions: string | null;
};

export type RcApiUser = {
  id: number;
};

/** Laravel RestAPI: users.access_token + status Active + is_deleted 0 */
export async function findApiUserByAccessToken(
  accessToken: string,
): Promise<ApiUser | null> {
  const user = await db.users.findFirst({
    where: {
      access_token: accessToken,
      is_deleted: 0,
    },
    select: {
      id: true,
      permissions: true,
      status: true,
    },
  });

  if (!user) return null;

  const status = String(user.status ?? "").trim().toLowerCase();
  if (status && status !== "active" && status !== "1") {
    return null;
  }

  return { id: user.id, permissions: user.permissions };
}

export function userHasApiPermission(
  user: ApiUser,
  permission: string,
): boolean {
  const raw = user.permissions ?? "";
  // Laravel uses both explode(",") and Str::contains
  if (raw.includes(permission)) return true;
  return raw
    .split(",")
    .map((p) => p.trim())
    .includes(permission);
}

/** Laravel vehicle-rc: rc_api_users.uuid */
export async function findRcApiUserByUuid(
  uuid: string,
): Promise<RcApiUser | null> {
  const row = await db.rc_api_users.findFirst({
    where: { uuid, is_deleted: 0 },
    select: { id: true },
  });
  return row ? { id: row.id } : null;
}

/** Hardcoded Laravel internal token → env `RC_INTERNAL_UPDATE_TOKEN`. */
export function isInternalRcUpdateToken(accessToken: string): boolean {
  const expected =
    process.env.RC_INTERNAL_UPDATE_TOKEN?.trim() ||
    "26051991DigitalAuto15101994";
  return accessToken === expected;
}

export async function logUserApiRequest(input: {
  userId: number;
  permission: string;
  requestData: string;
  isSuccess: boolean;
  message?: string | null;
  ip?: string | null;
}): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await db.user_api_requests.create({
    data: {
      user_id: input.userId,
      permission: input.permission,
      request_data: input.requestData.slice(0, 255),
      is_success: input.isSuccess ? 1 : 0,
      message: input.message ?? null,
      request_date: today,
      created_ip: input.ip ?? null,
      updated_ip: input.ip ?? null,
    },
  });
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}
