import { CredentialsSignin } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import {
  clearLoginFailures,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit";
import { authenticateUser } from "@/lib/auth-users";
import { isKnownRole } from "@/lib/rbac";
import type { UserType } from "@/types/next-auth";

class LoginRateLimitError extends CredentialsSignin {
  code = "rate_limit";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email;
        if (loginBlocked(email)) {
          throw new LoginRateLimitError();
        }

        if (!process.env.DATABASE_URL) {
          throw new Error("DATABASE_URL is not configured");
        }

        const user = await authenticateUser(email, parsed.data.password);

        if (!user || !isKnownRole(user)) {
          recordLoginFailure(email);
          return null;
        }

        clearLoginFailures(email);

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          type: user.type,
          isAdmin: user.isAdmin,
          bankId: user.bankId,
          cityId: user.cityId,
          permissions: user.permissions,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email!;
        token.type = user.type as UserType;
        token.isAdmin = user.isAdmin;
        token.bankId = user.bankId;
        token.cityId = user.cityId;
        token.permissions = user.permissions;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.id),
        firstName: String(token.firstName ?? ""),
        lastName: String(token.lastName ?? ""),
        email: String(token.email ?? ""),
        type: (token.type as UserType) ?? "",
        isAdmin: Boolean(token.isAdmin),
        bankId: (token.bankId as number | null) ?? null,
        cityId: (token.cityId as number | null) ?? null,
        permissions: Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : [],
      };

      return session;
    },
  },
});
