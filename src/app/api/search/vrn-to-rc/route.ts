import { outOfScopeResponse } from "@/lib/integrations/handlers-pi";

/** Dropped — aliases valuation-vehicle-rc. */
export async function GET() {
  return outOfScopeResponse("/api/search/vrn-to-rc");
}
