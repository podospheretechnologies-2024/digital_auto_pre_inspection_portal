import type { NextAuthConfig } from "next-auth";

import { routeDenied } from "@/lib/route-access";
import { roleFromSession } from "@/lib/rbac";
import type { UserType } from "@/types/next-auth";

function isCrossSiteIntegration(pathname: string): boolean {
  return (
    pathname.startsWith("/api/legacy/") ||
    pathname.startsWith("/api/search/") ||
    pathname === "/api/vehicle-rc" ||
    pathname === "/api/vehicle-info" ||
    pathname === "/api/store-vahan-data" ||
    pathname === "/api/store-vahan-details" ||
    pathname === "/api/delete_rc_history_data" ||
    pathname === "/api/update_rc_mask_data" ||
    pathname === "/api/update_rc_f_h_data" ||
    pathname === "/api/update_old_rc_data" ||
    pathname === "/api/valuation-vehicle-rc"
  );
}

function isSameOriginMutation(request: {
  headers: Headers;
  nextUrl: URL;
}): boolean {
  const origin = request.headers.get("origin");
  if (origin && origin === request.nextUrl.origin) return true;
  const site = request.headers.get("sec-fetch-site");
  return !origin && (site === "same-origin" || site === "none");
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.id ?? ""),
        firstName: String(token.firstName ?? ""),
        lastName: String(token.lastName ?? ""),
        email: String(token.email ?? session.user?.email ?? ""),
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
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const method = request.method.toUpperCase();

      if (
        method !== "GET" &&
        method !== "HEAD" &&
        method !== "OPTIONS" &&
        pathname.startsWith("/api/") &&
        !isCrossSiteIntegration(pathname) &&
        !isSameOriginMutation(request)
      ) {
        return Response.json(
          { message: "Cross-site request blocked" },
          { status: 403 },
        );
      }

      // Phase 4 external/legacy APIs use their own tokens (not Auth.js session)
      const isPublicApi =
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/api/v2/auth/") ||
        pathname.startsWith("/api/legacy/") ||
        pathname === "/api/vehicle-rc" ||
        pathname === "/api/vehicle-info" ||
        pathname === "/api/store-vahan-data" ||
        pathname === "/api/store-vahan-details" ||
        pathname === "/api/delete_rc_history_data" ||
        pathname === "/api/update_rc_mask_data" ||
        pathname === "/api/update_rc_f_h_data" ||
        pathname === "/api/update_old_rc_data" ||
        pathname === "/api/valuation-vehicle-rc" ||
        pathname.startsWith("/api/search/");

      const isPublic =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password" ||
        isPublicApi;

      if (isPublic) {
        if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
          const role = roleFromSession(auth?.user);
          if (!role) return true;
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) return false;

      const role = roleFromSession(auth?.user);
      if (!role) {
        if (pathname.startsWith("/api/")) {
          return Response.json({ message: "Forbidden" }, { status: 403 });
        }
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      if (
        routeDenied(pathname, role, {
          type: auth?.user?.type,
          isAdmin: auth?.user?.isAdmin,
          permissions: auth?.user?.permissions,
        })
      ) {
        if (pathname.startsWith("/api/")) {
          return Response.json({ message: "Forbidden" }, { status: 403 });
        }
        if (pathname !== "/account/settings") {
          return Response.redirect(new URL("/account/settings", request.nextUrl));
        }
        return Response.json({ message: "Forbidden" }, { status: 403 });
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
