import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/api";
import { listActivityLogs } from "@/lib/account/staff";
import { jsonSafe } from "@/lib/json-safe";

export async function GET(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");

  try {
    const data = await listActivityLogs(limit);
    return NextResponse.json({ data: jsonSafe(data) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load activity log" },
      { status: 500 },
    );
  }
}
