import { hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import type {
  BankUserCreateInput,
  BankUserUpdateInput,
  UpdateProfileInput,
} from "@/lib/account/schemas";
import { db } from "@/lib/db";
import { displayName, roleLabel } from "@/lib/rbac";
import type { SessionUser } from "@/types/next-auth";

export async function getAccountProfile(user: SessionUser) {
  const userId = Number(user.id);
  let info: {
    phone: string | null;
    company: string | null;
    website: string | null;
    country: string | null;
    language: string | null;
    timezone: string | null;
    currency: string | null;
    marketing: number | null;
    avatar: string | null;
  } | null = null;

  try {
    info = await db.user_infos.findUnique({
      where: { user_id: userId },
      select: {
        phone: true,
        company: true,
        website: true,
        country: true,
        language: true,
        timezone: true,
        currency: true,
        marketing: true,
        avatar: true,
      },
    });
  } catch {
    info = null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: displayName(user),
    email: user.email,
    type: user.type,
    role: roleLabel(user),
    isAdmin: user.isAdmin,
    bankId: user.bankId,
    cityId: user.cityId,
    info: info ?? {
      phone: null,
      company: null,
      website: null,
      country: null,
      language: null,
      timezone: null,
      currency: null,
      marketing: null,
      avatar: null,
    },
  };
}

export async function updateAccountProfile(
  userId: number,
  input: UpdateProfileInput,
) {
  const now = new Date();

  await db.users.update({
    where: { id: userId },
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      updated_at: now,
    },
  });

  const infoData = {
    phone: input.phone || null,
    company: input.company || null,
    website: input.website || null,
    country: input.country || null,
    language: input.language || null,
    timezone: input.timezone || null,
    currency: input.currency || null,
    marketing: input.marketing ?? null,
    updated_at: now,
  };

  const existing = await db.user_infos.findUnique({
    where: { user_id: userId },
  });

  if (existing) {
    await db.user_infos.update({
      where: { user_id: userId },
      data: infoData,
    });
  } else {
    await db.user_infos.create({
      data: {
        user_id: userId,
        ...infoData,
        created_at: now,
      },
    });
  }
}

export async function changeAccountEmail(userId: number, email: string) {
  await db.users.update({
    where: { id: userId },
    data: {
      email,
      updated_at: new Date(),
    },
  });
}

export async function listBankUsers() {
  const users = await db.users.findMany({
    where: { type: "Bank", is_deleted: 0 },
    orderBy: { first_name: "asc" },
  });

  const [cities, banks, infos] = await Promise.all([
    db.m_city.findMany({ select: { id: true, name: true } }),
    db.m_bank.findMany({ select: { id: true, name: true } }),
    db.user_infos.findMany({
      where: { user_id: { in: users.map((u) => u.id) } },
      select: { user_id: true, phone: true },
    }),
  ]);

  const cityMap = new Map(cities.map((c) => [c.id, c.name]));
  const bankMap = new Map(banks.map((b) => [b.id, b.name]));
  const phoneMap = new Map(infos.map((i) => [i.user_id, i.phone]));

  return users.map((u) => ({
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    city_id: u.city_id,
    bank_id: u.bank_id,
    city: u.city_id != null ? (cityMap.get(u.city_id) ?? "—") : "—",
    bank: u.bank_id != null ? (bankMap.get(u.bank_id) ?? "—") : "—",
    phone: phoneMap.get(u.id) ?? null,
  }));
}

export async function getBankUserLookups() {
  const [banks, cities] = await Promise.all([
    db.m_bank.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.m_city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { banks, cities };
}

export async function getBankUser(id: number) {
  const user = await db.users.findFirst({
    where: { id, type: "Bank", is_admin: 0, is_deleted: 0 },
  });
  if (!user) return null;

  const info = await db.user_infos.findUnique({
    where: { user_id: id },
    select: { phone: true },
  });

  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    city_id: user.city_id,
    bank_id: user.bank_id,
    phone: info?.phone ?? null,
  };
}

export async function createBankUser(input: BankUserCreateInput) {
  const now = new Date();
  const passwordHash = await hash(input.password, 10);

  try {
    const user = await db.users.create({
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        city_id: input.city,
        bank_id: input.bank,
        type: "Bank",
        is_admin: 0,
        is_deleted: 0,
        status: "Active",
        verified_at: now,
        password: passwordHash,
        created_at: now,
        updated_at: now,
      },
    });

    await db.user_infos.create({
      data: {
        user_id: user.id,
        phone: input.phone,
        created_at: now,
        updated_at: now,
      },
    });

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function updateBankUser(input: BankUserUpdateInput) {
  const now = new Date();

  try {
    const updated = await db.users.updateMany({
      where: { id: input.id, type: "Bank", is_admin: 0, is_deleted: 0 },
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        city_id: input.city,
        bank_id: input.bank,
        updated_at: now,
      },
    });

    if (updated.count === 0) {
      throw new Error("NOT_FOUND");
    }

    const existing = await db.user_infos.findUnique({
      where: { user_id: input.id },
    });

    if (existing) {
      await db.user_infos.update({
        where: { user_id: input.id },
        data: { phone: input.phone, updated_at: now },
      });
    } else {
      await db.user_infos.create({
        data: {
          user_id: input.id,
          phone: input.phone,
          created_at: now,
          updated_at: now,
        },
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function softDeleteBankUser(id: number) {
  const updated = await db.users.updateMany({
    where: { id, type: "Bank", is_admin: 0, is_deleted: 0 },
    data: { is_deleted: 1, updated_at: new Date() },
  });
  if (updated.count === 0) {
    throw new Error("NOT_FOUND");
  }
}
