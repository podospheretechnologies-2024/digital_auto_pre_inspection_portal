import { NextResponse } from "next/server";

import { handleStoreVahanData } from "@/lib/integrations/handlers-pi";
import { storeVahanDataSchema } from "@/lib/integrations/legacy-schemas";
import { parseWithZod } from "@/lib/integrations/route-helpers";

/** Laravel POST `/api/store-vahan-data` — scraper → rc_details. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Error: Invalid JSON body", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = parseWithZod(storeVahanDataSchema, body);
  if (!parsed.success) return parsed.response;
  return handleStoreVahanData(parsed.data as Record<string, unknown>);
}
