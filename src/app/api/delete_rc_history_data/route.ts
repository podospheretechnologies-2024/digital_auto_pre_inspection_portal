import { NextResponse } from "next/server";

import { handleDeleteRcHistoryData } from "@/lib/integrations/handlers-pi";

/** Laravel POST `/api/delete_rc_history_data`. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Error: Invalid JSON body", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return new NextResponse("success", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return handleDeleteRcHistoryData(body as Record<string, unknown>);
}
