import { outOfScopeResponse } from "@/lib/integrations/handlers-pi";

/** Dropped — valuation-only (`valuation-vehicle-rc` / domain bypass). */
export async function GET() {
  return outOfScopeResponse("/api/valuation-vehicle-rc");
}

export async function POST() {
  return outOfScopeResponse("/api/valuation-vehicle-rc");
}
