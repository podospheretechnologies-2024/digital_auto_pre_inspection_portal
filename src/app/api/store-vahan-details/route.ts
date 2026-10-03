import { NextResponse } from "next/server";

import { handleStoreVahanDetails } from "@/lib/integrations/handlers-pi";

/** Laravel POST `/api/store-vahan-details` — history tables importer. */
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
    return new NextResponse("Error: Invalid payload", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return handleStoreVahanDetails(body as Record<string, unknown>);
}
