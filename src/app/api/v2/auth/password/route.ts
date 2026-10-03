import { NextResponse } from "next/server";

import { zodErrorResponse } from "@/lib/api";
import {
  createPasswordResetToken,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordWithToken,
} from "@/lib/account/staff";
import {
  isSmtpConfigured,
  sendPasswordResetEmail,
} from "@/lib/mail/smtp";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createPasswordResetToken(parsed.data.email);

    if (result && isSmtpConfigured()) {
      const mail = await sendPasswordResetEmail({
        email: result.email,
        token: result.token,
      });
      if (!mail.ok && !mail.stubbed) {
        console.error("[auth/password] reset email failed:", mail.reason);
      }
    }

    // Always return ok to avoid email enumeration. In local/dev, include token when ALLOW_RESET_TOKEN_ECHO=true
    const echo =
      process.env.ALLOW_RESET_TOKEN_ECHO === "true" && result
        ? { reset_token: result.token, email: result.email }
        : {};

    const message = isSmtpConfigured()
      ? "If that email exists, a password reset link has been sent."
      : "If that email exists, a reset token was created. Set SMTP_HOST to send email, or ALLOW_RESET_TOKEN_ECHO=true locally to see the token.";

    return NextResponse.json({
      ok: true,
      message,
      ...echo,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Request failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await resetPasswordWithToken(parsed.data);
    return NextResponse.json({ ok: true, message: "Password updated" });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TOKEN") {
      return NextResponse.json({ message: "Invalid token" }, { status: 422 });
    }
    if (error instanceof Error && error.message === "EXPIRED_TOKEN") {
      return NextResponse.json({ message: "Token expired" }, { status: 422 });
    }
    console.error(error);
    return NextResponse.json({ message: "Reset failed" }, { status: 500 });
  }
}
