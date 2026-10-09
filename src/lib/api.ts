import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { loadActiveSessionUser } from "@/lib/auth-users";
import {
  hasPermission,
  isAdmin,
  isAdminHoOrBank,
  isAdminOrBank,
  isAll,
  isBoth,
  isKnownRole,
} from "@/lib/rbac";
import type { SessionUser } from "@/types/next-auth";

/** Page permission (`*_view`). Separate from button entry/edit/delete. */
export function denyUnlessPagePermission(
  user: SessionUser,
  viewPermission: string,
): NextResponse | null {
  if (!isKnownRole(user) || !hasPermission(user, viewPermission)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Button permission (`*_entry` / `*_edit` / `*_delete`). */
export function denyUnlessButtonPermission(
  user: SessionUser,
  actionPermission: string,
): NextResponse | null {
  if (!isKnownRole(user) || !hasPermission(user, actionPermission)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function requireSessionUser(): Promise<
  SessionUser | NextResponse
> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await loadActiveSessionUser(Number(session.user.id));
    if (!user || !isKnownRole(user)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return user;
  } catch (error) {
    console.error("[api] session reload failed", error);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

/** Laravel IsAdmin middleware */
export async function requireAdminUser(): Promise<SessionUser | NextResponse> {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return user;
}

/** Laravel masters CRUD used `is_both` middleware */
export async function requireBothUser(): Promise<SessionUser | NextResponse> {
  const user = await requireSessionUser();

  if (user instanceof NextResponse) {
    return user;
  }

  if (!isBoth(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return user;
}

/** Laravel `is_both` + staff permission check (admins always pass). */
export async function requireBothWithPermission(
  permission: string,
): Promise<SessionUser | NextResponse> {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const denied = denyUnlessButtonPermission(user, permission);
  if (denied) return denied;

  return user;
}

/** Laravel IsAll — admin, HO, or Surveyor (pending / inspect). */
export async function requireAllUser(): Promise<SessionUser | NextResponse> {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  if (!isAll(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return user;
}

/** Laravel AdminOrBank — PI reports. */
export async function requireAdminOrBankUser(): Promise<
  SessionUser | NextResponse
> {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  if (!isAdminOrBank(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return user;
}

/** Admin / HO / Bank — Data Export manage tab. */
export async function requireAdminHoOrBankUser(): Promise<
  SessionUser | NextResponse
> {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  if (!isAdminHoOrBank(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return user;
}

export function zodErrorResponse(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return NextResponse.json(
    { message: "Validation failed", errors: error.flatten().fieldErrors },
    { status: 422 },
  );
}
