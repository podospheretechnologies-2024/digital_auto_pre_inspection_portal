/**
 * SMTP mail via Nodemailer — mirrors Laravel MAIL_* for password reset.
 * Configure SMTP_HOST (+ optional auth) to enable; otherwise send is skipped.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type MailSendResult = {
  ok: boolean;
  stubbed: boolean;
  messageId?: string;
  reason?: string;
};

let transporter: Transporter | null | undefined;

function flagEnabled(name: string): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return false;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export function getMailFrom(): string {
  const from = process.env.MAIL_FROM?.trim();
  if (from) return from;
  const user = process.env.SMTP_USER?.trim();
  if (user) return user;
  return "noreply@localhost";
}

function getAppBaseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!isSmtpConfigured()) {
    transporter = null;
    return null;
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";
  const secureEnv = process.env.SMTP_SECURE;
  const secure =
    secureEnv != null && secureEnv !== ""
      ? flagEnabled("SMTP_SECURE")
      : port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
  return transporter;
}

/** Reset cached transporter (tests / env changes). */
export function resetMailTransporter() {
  transporter = undefined;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailSendResult> {
  const transport = getTransporter();
  if (!transport) {
    console.info(
      "[mail] SMTP not configured (set SMTP_HOST); skipping send to",
      params.to,
    );
    return { ok: false, stubbed: true, reason: "smtp_not_configured" };
  }

  try {
    const info = await transport.sendMail({
      from: getMailFrom(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { ok: true, stubbed: false, messageId: info.messageId };
  } catch (error) {
    console.error("[mail] send failed", error);
    return {
      ok: false,
      stubbed: false,
      reason: error instanceof Error ? error.message : "send_failed",
    };
  }
}

export function buildPasswordResetUrl(email: string, token: string): string {
  const base = getAppBaseUrl();
  const qs = new URLSearchParams({ email, token });
  return `${base}/reset-password?${qs.toString()}`;
}

export async function sendPasswordResetEmail(params: {
  email: string;
  token: string;
}): Promise<MailSendResult> {
  const resetUrl = buildPasswordResetUrl(params.email, params.token);
  const subject = "Reset your DigitalAuto password";
  const text = [
    "You requested a password reset for your DigitalAuto account.",
    "",
    `Open this link to choose a new password (expires in 1 hour):`,
    resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>You requested a password reset for your DigitalAuto account.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p style="color:#666;font-size:12px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
  `.trim();

  return sendMail({
    to: params.email,
    subject,
    text,
    html,
  });
}
