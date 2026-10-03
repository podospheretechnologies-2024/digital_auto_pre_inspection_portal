import { compare } from "bcryptjs";

import { db } from "@/lib/db";
import { toSessionUser } from "@/lib/rbac";
import type { SessionUser } from "@/types/next-auth";

export async function findUserByEmail(email: string) {
  return db.users.findUnique({
    where: { email },
  });
}

export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const rows = await db.user_permissions.findMany({
      where: {
        user_id: userId,
        is_deleted: 0,
      },
      select: {
        permission: true,
      },
    });

    return rows.map((row) => row.permission);
  } catch {
    // Table may be missing until prisma db pull / migration parity
    return [];
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  // Laravel status enum Active|Inactive; scaffold Int 0/1 also accepted
  if (user.status != null) {
    const status = String(user.status).trim().toLowerCase();
    if (status === "inactive" || status === "0") {
      return null;
    }
  }
  if (user.is_deleted === 1) {
    return null;
  }

  // Laravel uses $2y$ bcrypt hashes; bcryptjs expects $2a$/$2b$
  const hash = user.password.replace(/^\$2y\$/, "$2a$");
  const passwordMatches = await compare(password, hash);

  if (!passwordMatches) {
    return null;
  }

  const permissions = await getUserPermissions(user.id);

  return toSessionUser({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    type: user.type,
    is_admin: user.is_admin,
    bank_id: user.bank_id,
    city_id: user.city_id,
    permissions,
  });
}
