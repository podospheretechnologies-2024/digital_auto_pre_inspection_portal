import { handleUpdateOldRcData } from "@/lib/integrations/handlers-pi";
import { readRequestParams } from "@/lib/integrations/route-helpers";

/** Laravel POST `/api/update_old_rc_data`. */
export async function POST(request: Request) {
  const params = await readRequestParams(request);
  return handleUpdateOldRcData(params);
}
