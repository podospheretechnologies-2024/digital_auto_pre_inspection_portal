import { handleVehicleInfo } from "@/lib/integrations/handlers-pi";
import { vehicleInfoSchema } from "@/lib/integrations/legacy-schemas";
import {
  parseWithZod,
  readRequestParams,
} from "@/lib/integrations/route-helpers";

/** Laravel GET `/api/vehicle-info` — RC + history (Pre-Inspection). */
export async function GET(request: Request) {
  const params = await readRequestParams(request);
  const parsed = parseWithZod(vehicleInfoSchema, params);
  if (!parsed.success) return parsed.response;
  return handleVehicleInfo(parsed.data);
}
