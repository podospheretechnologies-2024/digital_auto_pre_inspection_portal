import { outOfScopeResponse } from "@/lib/integrations/handlers-pi";

/** Dropped — RestAPI / external search; not required for Pre-Inspection. */
export async function GET() {
  return outOfScopeResponse("/api/vrn-to-mobile");
}
