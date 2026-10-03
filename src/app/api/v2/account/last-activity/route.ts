import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/api";
import { pingLastActivity } from "@/lib/account/staff";

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  let online = true;
  try {
    const body = (await request.json()) as { online?: boolean };
    if (typeof body.online === "boolean") online = body.online;
  } catch {
    online = true;
  }

  try {
    await pingLastActivity(Number(user.id), online);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ping failed" }, { status: 500 });
  }
}
