import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";

import {
  requireSessionUser,
  zodErrorResponse,
} from "@/lib/api";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/account/schemas";
import {
  getAccountProfile,
  updateAccountProfile,
} from "@/lib/account/service";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  try {
    const data = await getAccountProfile(user);
    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load profile" },
      { status: 500 },
    );
  }
}

/** Profile update — mirrors SettingsController::update */
export async function PATCH(request: Request) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await updateAccountProfile(Number(user.id), parsed.data);
    return NextResponse.json({ ok: true, message: "Profile updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 },
    );
  }
}

/** Password change — mirrors SettingsController::changePassword */
export async function PUT(request: Request) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.email === "demo@demo.com") {
    return NextResponse.json(
      { message: "Password change disabled for demo account" },
      { status: 403 },
    );
  }

  const userId = Number(user.id);
  const row = await db.users.findUnique({ where: { id: userId } });
  if (!row) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const matches = await compare(parsed.data.current_password, row.password);
  if (!matches) {
    return NextResponse.json(
      {
        message: "Current password is incorrect",
        errors: { current_password: ["Incorrect password"] },
      },
      { status: 422 },
    );
  }

  const passwordHash = await hash(parsed.data.password, 10);

  await db.users.update({
    where: { id: userId },
    data: {
      password: passwordHash,
      updated_at: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Password updated",
  });
}
