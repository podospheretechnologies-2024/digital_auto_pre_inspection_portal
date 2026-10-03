import { NextResponse } from "next/server";

export async function GET() {
  let database: "connected" | "not_configured" | "error" = "not_configured";

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      await db.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "error";
    }
  }

  return NextResponse.json({
    status: "ok",
    app: "digitalauto-next",
    phase: "0-scaffold",
    database,
    timestamp: new Date().toISOString(),
  });
}
