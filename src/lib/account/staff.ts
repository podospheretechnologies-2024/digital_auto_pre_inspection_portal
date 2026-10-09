import { createHash, randomBytes } from "crypto";

import { hash } from "bcryptjs";
import { z } from "zod";

import type {
  PersonCreateInput,
  PersonRole,
  PersonUpdateInput,
} from "@/lib/account/schemas";
import {
  clampSurveyorPermissions,
  surveyorPermissionCeiling,
} from "@/lib/account/permissions-policy";
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

/** Laravel RegisteredUserController@store — guest Surveyor self-register under RO */
export const registerSurveyorSchema = z
  .object({
    first_name: z.string().trim().min(1).max(255),
    last_name: z.string().trim().min(1).max(255),
    email: z.string().trim().email().max(255),
    city_id: z.coerce.number().int().positive(),
    parent_id: z.coerce.number().int().positive(),
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
  parent_id: number | null;
  parent_name: string | null;
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
      parent_id: true,
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

  const parentIds = [
    ...new Set(
      users.map((u) => u.parent_id).filter((id): id is number => id != null),
    ),
  ];
  const parents =
    parentIds.length > 0
      ? await db.users.findMany({
          where: { id: { in: parentIds } },
          select: { id: true, first_name: true, last_name: true },
        })
      : [];
  const parentMap = new Map(
    parents.map((p) => [
      p.id,
      `${p.first_name} ${p.last_name}`.trim() || `RO #${p.id}`,
    ]),
  );

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
    parent_id: u.parent_id,
    parent_name:
      u.parent_id != null ? (parentMap.get(u.parent_id) ?? null) : null,
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

export async function listVerifiedRos() {
  return db.users.findMany({
    where: {
      type: "RO",
      is_deleted: 0,
      is_admin: 0,
      verified_at: { not: null },
    },
    orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    select: {
      id: true,
      first_name: true,
      last_name: true,
      city_id: true,
      email: true,
    },
  });
}

export async function getPersonLookups() {
  const [cities, ros] = await Promise.all([
    db.m_city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listVerifiedRos(),
  ]);
  return {
    cities,
    ros: ros.map((r) => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`.trim(),
      city_id: r.city_id,
      email: r.email,
    })),
  };
}

async function assertValidRoParent(parentId: number) {
  const ro = await db.users.findFirst({
    where: {
      id: parentId,
      type: "RO",
      is_deleted: 0,
      verified_at: { not: null },
    },
    select: { id: true, city_id: true },
  });
  if (!ro) throw new Error("INVALID_PARENT_RO");
  return ro;
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

  let parentId: number | null = null;
  if (input.role === "Surveyor") {
    if (input.parent_id == null) throw new Error("PARENT_RO_REQUIRED");
    await assertValidRoParent(input.parent_id);
    parentId = input.parent_id;
  }

  // RO / Surveyor need HO approve before login. HO / Admin auto-verified.
  const needsApproval = input.role === "RO" || input.role === "Surveyor";

  const user = await db.users.create({
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      city_id: input.city,
      parent_id: parentId,
      password: passwordHash,
      type: fields.type,
      is_admin: fields.is_admin,
      verified_at: needsApproval ? null : now,
      status: "Active",
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    },
    select: { id: true, verified_at: true },
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

  let parentId: number | null = null;
  if (input.role === "Surveyor") {
    if (input.parent_id == null) throw new Error("PARENT_RO_REQUIRED");
    await assertValidRoParent(input.parent_id);
    parentId = input.parent_id;
  }

  const fields = dbFieldsForRole(input.role);
  await db.users.update({
    where: { id: input.id },
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      city_id: input.city,
      parent_id: parentId,
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

  await assertValidRoParent(input.parent_id);

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
      parent_id: input.parent_id,
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
      parent_id: true,
      verified_at: true,
    },
  });
}

export async function listCitiesForRegister() {
  const lookups = await getPersonLookups();
  return lookups.cities;
}

export async function approveSurveyor(agentId: number) {
  const user = await db.users.findFirst({
    where: {
      id: agentId,
      type: { in: ["RO", "Surveyor"] },
      is_deleted: 0,
    },
    select: { id: true, type: true, parent_id: true },
  });
  if (!user) throw new Error("NOT_FOUND");

  if (user.type === "Surveyor") {
    if (user.parent_id == null) throw new Error("PARENT_RO_REQUIRED");
    await assertValidRoParent(user.parent_id);
  }

  await db.users.update({
    where: { id: user.id },
    data: { verified_at: new Date(), updated_at: new Date() },
  });
}

export async function setPersonStatus(
  id: number,
  status: "Active" | "Inactive",
  allowedRoles: PersonRole[],
) {
  const current = await db.users.findFirst({
    where: { id, is_deleted: 0 },
    select: { id: true, type: true, is_admin: true },
  });
  if (!current) throw new Error("NOT_FOUND");

  const role = roleFromUser(current.type, current.is_admin);
  if (!allowedRoles.includes(role)) throw new Error("NOT_FOUND");

  await db.users.update({
    where: { id },
    data: { status, updated_at: new Date() },
  });
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

/** HO + RO + Surveyor for permission assignment by Admin. Surveyors use hard ceiling. */
export async function listHoStaffForPermissions() {
  return db.users.findMany({
    where: {
      is_deleted: 0,
      OR: [{ type: "HO" }, { type: "RO" }, { type: "Surveyor" }],
    },
    orderBy: [{ type: "asc" }, { first_name: "asc" }, { last_name: "asc" }],
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      type: true,
    },
  });
}

const PERMISSION_ACTIONS = ["view", "entry", "edit", "delete"] as const;

export async function getPermissionMatrix(staffId: number) {
  const staff = await db.users.findFirst({
    where: { id: staffId, is_deleted: 0 },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      type: true,
      parent_id: true,
    },
  });
  if (!staff || !["HO", "RO", "Surveyor"].includes(staff.type ?? "")) {
    throw new Error("NOT_FOUND");
  }

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

  let parentName: string | null = null;
  let parentSet: Set<string> | null = null;
  if (staff.type === "Surveyor") {
    if (staff.parent_id != null) {
      const parent = await db.users.findFirst({
        where: { id: staff.parent_id, is_deleted: 0 },
        select: { first_name: true, last_name: true },
      });
      parentName = parent
        ? `${parent.first_name} ${parent.last_name}`.trim()
        : null;
      const parentPerms = await db.user_permissions.findMany({
        where: { user_id: staff.parent_id, is_deleted: 0 },
        select: { permission: true },
      });
      parentSet = new Set(parentPerms.map((p) => p.permission));
    } else {
      parentSet = new Set();
    }
  }

  const ceiling = surveyorPermissionCeiling();
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
      lock: Partial<Record<(typeof PERMISSION_ACTIONS)[number], string>>;
    }>
  >();

  for (const menu of menus) {
    if (!menu.short_code) continue;
    const module = (menu.module ?? "Other").trim() || "Other";
    const lock: Partial<Record<(typeof PERMISSION_ACTIONS)[number], string>> =
      {};
    if (staff.type === "Surveyor") {
      for (const action of PERMISSION_ACTIONS) {
        const key = `${menu.short_code}_${action}`;
        if (!ceiling.has(key)) {
          lock[action] = "Surveyors cannot be given this menu.";
        } else if (staff.parent_id == null) {
          lock[action] = "Assign this surveyor to an RO first.";
        } else if (!parentSet?.has(key)) {
          lock[action] = parentName
            ? `${parentName} does not have this permission.`
            : "The parent RO does not have this permission.";
        }
      }
    }
    const row = {
      id: menu.id,
      name: menu.name ?? menu.short_code,
      short_code: menu.short_code,
      view: grantedSet.has(`${menu.short_code}_view`),
      entry: grantedSet.has(`${menu.short_code}_entry`),
      edit: grantedSet.has(`${menu.short_code}_edit`),
      delete: grantedSet.has(`${menu.short_code}_delete`),
      lock,
    };
    const list = byModule.get(module) ?? [];
    list.push(row);
    byModule.set(module, list);
  }

  return {
    member: {
      id: staff.id,
      name: `${staff.first_name} ${staff.last_name}`.trim(),
      email: staff.email,
      type: staff.type,
      parent_name: parentName,
    },
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
  const staff = await db.users.findFirst({
    where: { id: input.staff_id, is_deleted: 0 },
    select: { id: true, type: true, parent_id: true },
  });
  if (!staff) throw new Error("NOT_FOUND");

  if (!["HO", "RO", "Surveyor"].includes(staff.type ?? "")) {
    throw new Error("NOT_FOUND");
  }

  const menus = await db.menus.findMany({
    where: { is_deleted: 0, short_code: { not: null } },
    select: { short_code: true },
  });
  const known = new Set<string>();
  for (const menu of menus) {
    if (!menu.short_code) continue;
    for (const action of PERMISSION_ACTIONS) {
      known.add(`${menu.short_code}_${action}`);
    }
  }

  let permissions = [...new Set(input.permissions.filter((p) => known.has(p)))];
  if (staff.type === "Surveyor") {
    permissions = clampSurveyorPermissions(permissions);
    if (staff.parent_id == null) {
      permissions = [];
    } else {
      const parentPerms = await db.user_permissions.findMany({
        where: { user_id: staff.parent_id, is_deleted: 0 },
        select: { permission: true },
      });
      const parentSet = new Set(parentPerms.map((p) => p.permission));
      permissions = permissions.filter((p) => parentSet.has(p));
    }
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.user_permissions.updateMany({
      where: { user_id: input.staff_id, is_deleted: 0 },
      data: {
        is_deleted: 1,
        updated_user_id: actorId,
        updated_at: now,
      },
    });

    if (permissions.length === 0) return;

    const existing = await tx.user_permissions.findMany({
      where: { user_id: input.staff_id, permission: { in: permissions } },
      select: { id: true, permission: true },
      orderBy: { id: "desc" },
    });
    const revive = new Map<string, number>();
    for (const row of existing) {
      if (!revive.has(row.permission)) revive.set(row.permission, row.id);
    }
    const reviveIds = [...revive.values()];
    if (reviveIds.length > 0) {
      await tx.user_permissions.updateMany({
        where: { id: { in: reviveIds } },
        data: {
          is_deleted: 0,
          updated_user_id: actorId,
          updated_at: now,
        },
      });
    }
    const missing = permissions.filter((permission) => !revive.has(permission));
    if (missing.length > 0) {
      await tx.user_permissions.createMany({
        data: missing.map((permission) => ({
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
  });

  return { permissions };
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
