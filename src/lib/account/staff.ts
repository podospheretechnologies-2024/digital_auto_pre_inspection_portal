import { createHash, randomBytes } from "crypto";

import { hash } from "bcryptjs";
import { z } from "zod";

import type {
  PersonCreateInput,
  PersonRole,
  PersonUpdateInput,
} from "@/lib/account/schemas";
import { db } from "@/lib/db";

export const staffPasswordSchema = z
  .object({
    staff_id: z.coerce.number().int().positive(),
    password: z.string().min(6).max(72),
    password_confirmation: z.string().min(1),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export const agentApproveSchema = z.object({
  agent_id: z.coerce.number().int().positive(),
});

export const savePermissionsSchema = z.object({
  staff_id: z.coerce.number().int().positive(),
  permissions: z.array(z.string().min(1)).default([]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email(),
    token: z.string().min(1),
    password: z.string().min(8).max(72),
    password_confirmation: z.string().min(1),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

/** Laravel RegisteredUserController@store — guest Surveyor/RO self-register */
export const registerSurveyorSchema = z
  .object({
    first_name: z.string().trim().min(1).max(255),
    last_name: z.string().trim().min(1).max(255),
    email: z.string().trim().email().max(255),
    city_id: z.coerce.number().int().positive(),
    password: z.string().min(8).max(72),
    password_confirmation: z.string().min(1),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export type StaffPasswordInput = z.infer<typeof staffPasswordSchema>;
export type SavePermissionsInput = z.infer<typeof savePermissionsSchema>;
export type RegisterSurveyorInput = z.infer<typeof registerSurveyorSchema>;

export type PersonRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type: string | null;
  role: PersonRole;
  status: string | null;
  city_id: number | null;
  city: string | null;
  phone: string | null;
  verified_at: Date | null;
  last_activity: Date | null;
  is_online: number;
  is_admin: number;
};

function roleFromUser(type: string | null, isAdmin: number): PersonRole {
  if (Number(isAdmin) === 1 && (!type || type === "")) return "Admin";
  if (type === "HO") return "HO";
  if (type === "RO") return "RO";
  return "Surveyor";
}

function dbFieldsForRole(role: PersonRole): {
  type: string;
  is_admin: number;
} {
  switch (role) {
    case "Admin":
      return { type: "", is_admin: 1 };
    case "HO":
      return { type: "HO", is_admin: 1 };
    case "RO":
      return { type: "RO", is_admin: 0 };
    case "Surveyor":
      return { type: "Surveyor", is_admin: 0 };
  }
}

async function upsertPhone(userId: number, phone: string) {
  const now = new Date();
  const existing = await db.user_infos.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (existing) {
    await db.user_infos.update({
      where: { user_id: userId },
      data: { phone, updated_at: now },
    });
  } else {
    await db.user_infos.create({
      data: { user_id: userId, phone, created_at: now, updated_at: now },
    });
  }
}

async function listPeopleByRoles(roles: PersonRole[]): Promise<PersonRow[]> {
  const whereParts = roles.map((role) => {
    const f = dbFieldsForRole(role);
    if (role === "Admin") {
      return {
        is_admin: 1,
        is_deleted: 0,
        OR: [{ type: "" }, { type: null }],
      };
    }
    return { type: f.type, is_deleted: 0 };
  });

  const users = await db.users.findMany({
    where: { OR: whereParts },
    orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      type: true,
      status: true,
      city_id: true,
      verified_at: true,
      last_activity: true,
      is_online: true,
      is_admin: true,
    },
  });

  const cityIds = [
    ...new Set(
      users.map((u) => u.city_id).filter((id): id is number => id != null),
    ),
  ];
  const cities =
    cityIds.length > 0
      ? await db.m_city.findMany({
          where: { id: { in: cityIds } },
          select: { id: true, name: true },
        })
      : [];
  const cityMap = new Map(cities.map((c) => [c.id, c.name]));

  const userIds = users.map((u) => u.id);
  const infos =
    userIds.length > 0
      ? await db.user_infos.findMany({
          where: { user_id: { in: userIds } },
          select: { user_id: true, phone: true },
        })
      : [];
  const phoneMap = new Map(infos.map((i) => [i.user_id, i.phone]));

  return users.map((u) => ({
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    type: u.type,
    role: roleFromUser(u.type, u.is_admin),
    status: u.status,
    city_id: u.city_id,
    city: u.city_id != null ? (cityMap.get(u.city_id) ?? null) : null,
    phone: phoneMap.get(u.id) ?? null,
    verified_at: u.verified_at,
    last_activity: u.last_activity,
    is_online: u.is_online,
    is_admin: u.is_admin,
  }));
}

/** Laravel agentlist — RO + Surveyor */
export async function listSurveyors() {
  return listPeopleByRoles(["RO", "Surveyor"]);
}

/** Laravel stafflist — HO */
export async function listStaff() {
  return listPeopleByRoles(["HO"]);
}

export async function listAdmins() {
  return listPeopleByRoles(["Admin"]);
}

export async function getPersonLookups() {
  return db.m_city.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createPerson(input: PersonCreateInput) {
  const city = await db.m_city.findFirst({
    where: { id: input.city },
    select: { id: true },
  });
  if (!city) throw new Error("INVALID_CITY");

  const existing = await db.users.findFirst({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  const fields = dbFieldsForRole(input.role);
  const now = new Date();
  const passwordHash = await hash(input.password, 10);

  const user = await db.users.create({
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      city_id: input.city,
      password: passwordHash,
      type: fields.type,
      is_admin: fields.is_admin,
      verified_at: now,
      status: "Active",
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    },
    select: { id: true },
  });

  await upsertPhone(user.id, input.phone);
  return user;
}

export async function updatePerson(
  input: PersonUpdateInput,
  allowedRoles: PersonRole[],
) {
  if (!allowedRoles.includes(input.role)) {
    throw new Error("INVALID_ROLE");
  }

  const current = await db.users.findFirst({
    where: { id: input.id, is_deleted: 0 },
    select: { id: true, type: true, is_admin: true, email: true },
  });
  if (!current) throw new Error("NOT_FOUND");

  const currentRole = roleFromUser(current.type, current.is_admin);
  if (!allowedRoles.includes(currentRole)) throw new Error("NOT_FOUND");

  const emailTaken = await db.users.findFirst({
    where: { email: input.email, NOT: { id: input.id } },
    select: { id: true },
  });
  if (emailTaken) throw new Error("EMAIL_TAKEN");

  const fields = dbFieldsForRole(input.role);
  await db.users.update({
    where: { id: input.id },
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      city_id: input.city,
      type: fields.type,
      is_admin: fields.is_admin,
      updated_at: new Date(),
    },
  });
  await upsertPhone(input.id, input.phone);
}

export async function softDeletePerson(
  id: number,
  allowedRoles: PersonRole[],
  actorId: number,
) {
  if (id === actorId) throw new Error("CANNOT_DELETE_SELF");

  const current = await db.users.findFirst({
    where: { id, is_deleted: 0 },
    select: { id: true, type: true, is_admin: true },
  });
  if (!current) throw new Error("NOT_FOUND");

  const currentRole = roleFromUser(current.type, current.is_admin);
  if (!allowedRoles.includes(currentRole)) throw new Error("NOT_FOUND");

  await db.users.update({
    where: { id },
    data: { is_deleted: 1, updated_at: new Date() },
  });
}

/**
 * Guest self-register (Laravel RegisteredUserController@store).
 * Creates type Surveyor with verified_at null — HO must approve via surveyors UI.
 */
export async function registerSurveyor(input: RegisterSurveyorInput) {
  const city = await db.m_city.findFirst({
    where: { id: input.city_id },
    select: { id: true },
  });
  if (!city) throw new Error("INVALID_CITY");

  const existing = await db.users.findFirst({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  const now = new Date();
  const passwordHash = await hash(input.password, 10);

  return db.users.create({
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      city_id: input.city_id,
      password: passwordHash,
      type: "Surveyor",
      is_admin: 0,
      verified_at: null,
      status: "Active",
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      type: true,
      verified_at: true,
    },
  });
}

export async function listCitiesForRegister() {
  return getPersonLookups();
}

export async function approveSurveyor(agentId: number) {
  const updated = await db.users.updateMany({
    where: {
      id: agentId,
      type: { in: ["RO", "Surveyor"] },
      is_deleted: 0,
    },
    data: { verified_at: new Date(), updated_at: new Date() },
  });
  if (updated.count === 0) throw new Error("NOT_FOUND");
}

export async function changeStaffPassword(input: StaffPasswordInput) {
  const passwordHash = await hash(input.password, 10);
  const updated = await db.users.updateMany({
    where: { id: input.staff_id, type: "HO", is_deleted: 0 },
    data: { password: passwordHash, updated_at: new Date() },
  });
  if (updated.count === 0) throw new Error("NOT_FOUND");
}

export async function changePersonPassword(
  userId: number,
  password: string,
  allowedRoles: PersonRole[],
) {
  const current = await db.users.findFirst({
    where: { id: userId, is_deleted: 0 },
    select: { id: true, type: true, is_admin: true },
  });
  if (!current) throw new Error("NOT_FOUND");
  const role = roleFromUser(current.type, current.is_admin);
  if (!allowedRoles.includes(role)) throw new Error("NOT_FOUND");

  const passwordHash = await hash(password, 10);
  await db.users.update({
    where: { id: userId },
    data: { password: passwordHash, updated_at: new Date() },
  });
}

export async function listHoStaffForPermissions() {
  return db.users.findMany({
    where: { type: "HO", is_deleted: 0 },
    orderBy: [{ first_name: "asc" }, { last_name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      type: true,
    },
  });
}

export async function getPermissionMatrix(staffId: number) {
  const menus = await db.menus.findMany({
    where: { is_deleted: 0 },
    orderBy: [{ module: "asc" }, { id: "asc" }],
    select: { id: true, name: true, short_code: true, module: true },
  });

  const granted = await db.user_permissions.findMany({
    where: { user_id: staffId, is_deleted: 0 },
    select: { permission: true },
  });
  const grantedSet = new Set(granted.map((g) => g.permission));

  const byModule = new Map<
    string,
    Array<{
      id: number;
      name: string;
      short_code: string;
      view: boolean;
      entry: boolean;
      edit: boolean;
      delete: boolean;
    }>
  >();

  for (const menu of menus) {
    if (!menu.short_code) continue;
    const module = (menu.module ?? "Other").trim() || "Other";
    const row = {
      id: menu.id,
      name: menu.name ?? menu.short_code,
      short_code: menu.short_code,
      view: grantedSet.has(`${menu.short_code}_view`),
      entry: grantedSet.has(`${menu.short_code}_entry`),
      edit: grantedSet.has(`${menu.short_code}_edit`),
      delete: grantedSet.has(`${menu.short_code}_delete`),
    };
    const list = byModule.get(module) ?? [];
    list.push(row);
    byModule.set(module, list);
  }

  return {
    modules: [...byModule.entries()].map(([module, items]) => ({
      module,
      items,
    })),
    permissions: [...grantedSet],
  };
}

export async function saveStaffPermissions(
  input: SavePermissionsInput,
  actorId: number,
) {
  const now = new Date();
  await db.user_permissions.updateMany({
    where: { user_id: input.staff_id, is_deleted: 0 },
    data: {
      is_deleted: 1,
      updated_user_id: actorId,
      updated_at: now,
    },
  });

  if (input.permissions.length === 0) return;

  await db.user_permissions.createMany({
    data: input.permissions.map((permission) => ({
      user_id: input.staff_id,
      permission,
      is_deleted: 0,
      created_user_id: actorId,
      updated_user_id: actorId,
      created_at: now,
      updated_at: now,
    })),
  });
}

export async function pingLastActivity(userId: number, online: boolean) {
  await db.users.update({
    where: { id: userId },
    data: {
      is_online: online ? 1 : 0,
      last_activity: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function listActivityLogs(limit = 100) {
  return db.activity_log.findMany({
    orderBy: { id: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
    select: {
      id: true,
      log_name: true,
      description: true,
      event: true,
      subject_type: true,
      subject_id: true,
      causer_id: true,
      created_at: true,
    },
  });
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Create reset token (return plaintext once). Email delivery is env-dependent. */
export async function createPasswordResetToken(email: string) {
  const user = await db.users.findFirst({
    where: { email, is_deleted: 0 },
    select: { id: true, email: true },
  });
  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  await db.password_resets.deleteMany({ where: { email } });
  await db.password_resets.create({
    data: { email, token: tokenHash, created_at: new Date() },
  });
  return { email: user.email, token };
}

export async function resetPasswordWithToken(input: {
  email: string;
  token: string;
  password: string;
}) {
  const row = await db.password_resets.findUnique({
    where: { email: input.email },
  });
  if (!row?.token) throw new Error("INVALID_TOKEN");

  const tokenHash = hashResetToken(input.token);
  if (row.token !== tokenHash) throw new Error("INVALID_TOKEN");

  if (row.created_at) {
    const ageMs = Date.now() - row.created_at.getTime();
    if (ageMs > 60 * 60 * 1000) throw new Error("EXPIRED_TOKEN");
  }

  const passwordHash = await hash(input.password, 10);
  await db.users.updateMany({
    where: { email: input.email, is_deleted: 0 },
    data: { password: passwordHash, updated_at: new Date() },
  });
  await db.password_resets.deleteMany({ where: { email: input.email } });
}
