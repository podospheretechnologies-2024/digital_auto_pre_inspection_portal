import type { SessionUser, UserType } from "@/types/next-auth";

function normalizeType(type: string | null | undefined): UserType {
  if (!type) return "";
  if (type === "HO" || type === "RO" || type === "Surveyor" || type === "Bank")
    return type;
  return "";
}

export function toSessionUser(input: {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  type?: string | null;
  is_admin?: number | null;
  bank_id?: number | null;
  city_id?: number | null;
  permissions?: string[];
}): SessionUser {
  return {
    id: String(input.id),
    firstName: input.first_name,
    lastName: input.last_name,
    email: input.email,
    type: normalizeType(input.type),
    isAdmin: Number(input.is_admin ?? 0) === 1,
    bankId: input.bank_id ?? null,
    cityId: input.city_id ?? null,
    permissions: input.permissions ?? [],
  };
}

/** Mirrors Laravel IsAdmin middleware */
export function isAdmin(user: SessionUser | null | undefined): boolean {
  return !!user && user.isAdmin && user.type === "";
}

/** Mirrors Laravel IsBoth (admin or HO) */
export function isBoth(user: SessionUser | null | undefined): boolean {
  return !!user && user.isAdmin && (user.type === "" || user.type === "HO");
}

/** Mirrors Laravel IsAll (admin, HO, or Surveyor) */
export function isAll(user: SessionUser | null | undefined): boolean {
  return (
    !!user &&
    (user.type === "" ||
      user.type === "HO" ||
      user.type === "RO" ||
      user.type === "Surveyor")
  );
}

/** Mirrors Laravel IsBank */
export function isBank(user: SessionUser | null | undefined): boolean {
  return !!user && user.type === "Bank";
}

/** Mirrors Laravel AdminOrBank */
export function isAdminOrBank(user: SessionUser | null | undefined): boolean {
  return isAdmin(user) || isBank(user);
}

export function hasPermission(
  user: SessionUser | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.permissions.includes(permission);
}

export function displayName(user: SessionUser | null | undefined): string {
  if (!user) return "Guest";
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

export function roleLabel(user: SessionUser | null | undefined): string {
  if (!user) return "Guest";
  if (isAdmin(user)) return "Admin";
  if (user.type === "HO") return "HO";
  if (user.type === "RO") return "RO";
  if (user.type === "Surveyor") return "Surveyor";
  if (user.type === "Bank") return "Bank";
  return "User";
}
