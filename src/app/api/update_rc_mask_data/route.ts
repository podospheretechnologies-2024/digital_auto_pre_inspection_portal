import {
  handleUpdateRcMaskData,
} from "@/lib/integrations/handlers-pi";
import { readRequestParams } from "@/lib/integrations/route-helpers";

/** Laravel POST `/api/update_rc_mask_data`. */
export async function POST(request: Request) {
  const params = await readRequestParams(request);
  return handleUpdateRcMaskData(params);
}
