import type { NextAuthConfig } from "next-auth";

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
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

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
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
