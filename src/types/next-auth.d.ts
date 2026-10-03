import type { DefaultSession } from "next-auth";

export type UserType = "" | "HO" | "RO" | "Surveyor" | "Bank";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: UserType;
  isAdmin: boolean;
  bankId: number | null;
  cityId: number | null;
  permissions: string[];
};

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: UserType;
    isAdmin: boolean;
    bankId: number | null;
    cityId: number | null;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: UserType;
    isAdmin: boolean;
    bankId: number | null;
    cityId: number | null;
    permissions: string[];
  }
}
