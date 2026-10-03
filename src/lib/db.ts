import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/** Bump when pool options change so HMR does not keep a stale MariaDB pool. */
const POOL_VERSION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPoolVersion: number | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const parsed = new URL(databaseUrl);

  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    // URL may omit password (mysql://root@host/db) — pass empty string, not "undefined"
    password: parsed.password ? decodeURIComponent(parsed.password) : "",
    database: parsed.pathname.replace(/^\//, ""),
    // mariadb timeouts are milliseconds (default acquireTimeout is 10000)
    connectionLimit: 15,
    connectTimeout: 10_000,
    acquireTimeout: 30_000,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaPoolVersion !== POOL_VERSION
) {
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaPoolVersion = POOL_VERSION;
}
