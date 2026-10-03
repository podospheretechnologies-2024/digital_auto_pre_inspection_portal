import {
  handleVehicleRc,
} from "@/lib/integrations/handlers-pi";
import { vehicleRcSchema } from "@/lib/integrations/legacy-schemas";
import {
  parseWithZod,
  readRequestParams,
} from "@/lib/integrations/route-helpers";

/**
 * Laravel `/api/vehicle-rc` — POST preferred (Route::any).
 * Pre-Inspection Phase 4: rc_api_users uuid auth + RC cache parity.
 */
async function handle(request: Request) {
  const params = await readRequestParams(request);
  const parsed = parseWithZod(vehicleRcSchema, params);
  if (!parsed.success) {
    // Laravel returns Error JSON, not Zod 422 — keep token/regn errors via handler
    return handleVehicleRc(request, params);
  }
  return handleVehicleRc(request, parsed.data);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
