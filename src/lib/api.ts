import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission, isAdmin, isAdminOrBank, isAll, isBoth } from "@/lib/rbac";
import type { SessionUser } from "@/types/next-auth";

export async function requireSessionUser(): Promise<
  SessionUser | NextResponse
> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return session.user;
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

  if (!hasPermission(user, permission)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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

export function zodErrorResponse(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return NextResponse.json(
    { message: "Validation failed", errors: error.flatten().fieldErrors },
    { status: 422 },
  );
}
