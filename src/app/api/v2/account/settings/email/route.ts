import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { requireSessionUser, zodErrorResponse } from "@/lib/api";
import { changeEmailSchema } from "@/lib/account/schemas";
import { changeAccountEmail } from "@/lib/account/service";
import { db } from "@/lib/db";

/** Mirrors SettingsController::changeEmail */
export async function PUT(request: Request) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  if (user.email === "demo@demo.com") {
    return NextResponse.json(
      { message: "Email change disabled for demo account" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = changeEmailSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

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

  const taken = await db.users.findFirst({
    where: {
      email: parsed.data.email,
      NOT: { id: userId },
    },
  });
  if (taken) {
    return NextResponse.json(
      {
        message: "Email already in use",
        errors: { email: ["Taken"] },
      },
      { status: 422 },
    );
  }

  try {
    await changeAccountEmail(userId, parsed.data.email);
    return NextResponse.json({
      ok: true,
      message: "Email updated — sign in again with the new address",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update email" },
      { status: 500 },
    );
  }
}
