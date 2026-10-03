import { outOfScopeResponse } from "@/lib/integrations/handlers-pi";

/** Dropped — RestAPI / MMV broker search; not Pre-Inspection. */
export async function GET() {
  return outOfScopeResponse("/api/search/vrn-to-rc-and-mmv-master");
}
