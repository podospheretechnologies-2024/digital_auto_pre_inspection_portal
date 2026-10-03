import { NextResponse } from "next/server";

import { zodErrorResponse } from "@/lib/api";
import {
  registerSchema,
  registerSurveyor,
} from "@/lib/account/register";

/** Guest Surveyor self-signup (Laravel RegisteredUserController::store). */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await registerSurveyor(parsed.data);
    return NextResponse.json({
      ok: true,
      message:
        "Agent registration completed. Please wait for account verification.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        {
          message: "Email already in use",
          errors: { email: ["The email has already been taken."] },
        },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "INVALID_CITY") {
      return NextResponse.json(
        {
          message: "Invalid city",
          errors: { city_id: ["Select a valid city."] },
        },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Registration failed" }, { status: 500 });
  }
}
