"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        const code =
          (error as { code?: string }).code ??
          (error.cause as { code?: string; err?: { code?: string } } | undefined)
            ?.code ??
          (error.cause as { err?: { code?: string } } | undefined)?.err?.code;
        if (code === "rate_limit") {
          return {
            error: "Too many login attempts. Try again in 15 minutes.",
          };
        }
        return {
          error:
            "Invalid email or password — or account pending HO approval.",
        };
      }

      // CallbackRouteError often wraps DB/pool failures; avoid Auth.js doc URL as UX
      if (error.type === "CallbackRouteError") {
        console.error("[login] CallbackRouteError", error.cause ?? error);
        return {
          error:
            "Sign-in failed (database unavailable or misconfigured). Check MySQL and DATABASE_URL.",
        };
      }

      return { error: error.message || "Unable to sign in." };
    }

    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}
