/**
 * IDfy vehicle RC lookup (Laravel `apiVehicleDetailIDFY` / `apiVehicleBasicDetailIDFY`).
 * Submits async verify, waits, polls task result, and upserts into `rc_details`.
 * Credentials and base URL come from env — never hardcode secrets.
 */
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireEnv } from "@/lib/integrations/errors";
import { fetchJson, joinUrl } from "@/lib/integrations/http";
import { normalizeRegn, scalarOrNull } from "@/lib/integrations/normalize";
export type IdfyVehicleDetailInput = {
  rcRegnNo: string;
  /** Prefer plus (ind_rc_plus) or basic (ind_rc_basic). Default: plus */
  variant?: "plus" | "basic";
  /**
   * Persist extraction_output into `rc_details` (Laravel helper default).
   * Set false to submit/poll only.
   */
  writeBack?: boolean;
};
export type IdfyAsyncSubmitResult = {
  request_id?: string;
  [key: string]: unknown;
};
export type IdfyVehicleDetailResult = {
  requestId: string | null;
  task: unknown;
  /** Whether a row was inserted/updated in `rc_details`. */
  written: boolean;
  /** Insert vs update when written. */
  writeMode?: "insert" | "update";
  /** Count of non-null fields written. */
  fieldsWritten?: number;
  skipped?: string;
};
type ExtractionOutput = Record<string, unknown>;
function idfyHeaders(): HeadersInit {
  return {
    "api-key": requireEnv("IDFY_API_KEY"),
    "account-id": requireEnv("IDFY_ACCOUNT_ID"),
    "Content-Type": "application/json",
  };
}
function idfyBaseUrl(): string {
  return requireEnv("IDFY_BASE_URL").replace(/\/+$/, "");
}
function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/** Laravel: sleep(20) for plus, sleep(10) for basic. Override with IDFY_POLL_DELAY_MS. */
function pollDelayMs(variant: "plus" | "basic"): number {
  const override = process.env.IDFY_POLL_DELAY_MS?.trim();
  if (override && /^\d+$/.test(override)) {
    return Number(override);
  }
  return variant === "basic" ? 10_000 : 20_000;
}
function parseTaskList(task: unknown): Record<string, unknown>[] {
  if (Array.isArray(task)) {
    return task
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item != null);
  }
  const single = asRecord(task);
  return single ? [single] : [];
}
/**
 * Prefer completed extraction_output with registration_number.
 * Fall back to source_output / nested result shapes seen in IDfy responses.
 */
function extractOutput(task: unknown): ExtractionOutput | null {
  for (const item of parseTaskList(task)) {
    if (item.status && item.status !== "completed") continue;
    const result = asRecord(item.result);
    if (!result) continue;
    const candidates = [
      asRecord(result.extraction_output),
      asRecord(result.source_output),
      asRecord(asRecord(result.result)?.extraction_output),
    ];
    for (const output of candidates) {
      if (output && (output.registration_number != null || output.rc_number != null)) {
        return output;
      }
    }
  }
  return null;
}
/** First non-null scalar among alternate IDfy keys. */
function pickField(
  rcData: ExtractionOutput,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = scalarOrNull(rcData[key]);
    if (v != null && v !== "") return v;
  }
  return null;
}
/**
 * Drop null/undefined so Prisma updates do not wipe existing rc_details
 * columns when IDfy returns a thin extraction (esp. basic mask).
 */
function compactRcPayload(
  data: Prisma.rc_detailsUncheckedCreateInput,
): Prisma.rc_detailsUncheckedCreateInput {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      out[key] = value;
    }
  }
  return out as Prisma.rc_detailsUncheckedCreateInput;
}
async function upsertRcDetails(
  data: Prisma.rc_detailsUncheckedCreateInput,
): Promise<{ mode: "insert" | "update"; fieldsWritten: number }> {
  const compact = compactRcPayload(data);
  const regn = compact.rc_regn_no;
  if (!regn) {
    throw new Error("idfy_write_back_missing_regn");
  }
  const existing = await db.rc_details.findFirst({
    where: { rc_regn_no: regn, is_deleted: 0 },
    select: { id: true },
  });
  const { id: _ignoredId, ...payload } = compact as typeof compact & {
    id?: number;
  };
  void _ignoredId;
  const fieldsWritten = Object.keys(payload).length;
  if (!existing) {
    await db.rc_details.create({
      data: {
        ...payload,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
    return { mode: "insert", fieldsWritten };
  }
  // Laravel plus: update by id; basic: update by rc_regn_no — id is safer.
  await db.rc_details.update({
    where: { id: existing.id },
    data: {
      ...payload,
      updated_at: new Date(),
    },
  });
  return { mode: "update", fieldsWritten };
}
/**
 * Laravel `apiVehicleBasicDetailIDFY` — mask chassis / engine / owner only.
 * Used after govt Vahan pull (`mask_data=true`).
 */
function mapBasicExtraction(
  rcData: ExtractionOutput,
): Prisma.rc_detailsUncheckedCreateInput {
  const regn =
    pickField(rcData, "registration_number", "rc_number", "reg_no") ?? "";
  return {
    rc_regn_no: normalizeRegn(regn) || regn,
    rc_chasi_no: pickField(
      rcData,
      "chassis_number",
      "chassis_no",
      "chasi_no",
      "chassis",
    ),
    rc_eng_no: pickField(
      rcData,
      "engine_number",
      "engine_no",
      "eng_no",
      "engine",
    ),
    rc_owner_name: pickField(rcData, "owner_name", "owner", "registered_owner"),
  };
}
/** Laravel `apiVehicleDetailIDFY` full plus extraction → `rc_details`. */
function mapPlusExtraction(
  rcData: ExtractionOutput,
): Prisma.rc_detailsUncheckedCreateInput {
  const regn =
    pickField(rcData, "registration_number", "rc_number", "reg_no") ?? "";
  return {
    rc_status: pickField(rcData, "status_verification", "status", "rc_status"),
    rc_regn_dt: pickField(rcData, "registration_date", "regn_dt"),
    rc_blacklist_status: pickField(rcData, "blacklist_status"),
    rc_body_type_desc: pickField(rcData, "body_type", "body_type_desc"),
    rc_chasi_no: pickField(
      rcData,
      "chassis_number",
      "chassis_no",
      "chasi_no",
    ),
    rc_color: pickField(rcData, "colour", "color"),
    rc_cubic_cap: pickField(rcData, "cubic_capacity", "cubic_cap"),
    rc_eng_no: pickField(rcData, "engine_number", "engine_no", "eng_no"),
    rc_f_name: pickField(rcData, "father_name", "f_name"),
    rc_financer: pickField(rcData, "financer"),
    rc_fit_upto: pickField(rcData, "fitness_upto", "fit_upto"),
    rc_fuel_desc: pickField(rcData, "fuel_type", "fuel_desc"),
    rc_gvw: pickField(rcData, "gross_vehicle_weight", "gvw"),
    rc_insurance_comp: pickField(rcData, "insurance_name", "insurance_comp"),
    rc_insurance_policy_no: pickField(rcData, "insurance_policy_no"),
    rc_insurance_upto: pickField(rcData, "insurance_validity", "insurance_upto"),
    rc_maker_desc: pickField(rcData, "manufacturer", "maker_desc", "maker"),
    rc_maker_model: pickField(
      rcData,
      "manufacturer_model",
      "maker_model",
      "model",
    ),
    rc_manu_month_yr: pickField(
      rcData,
      "m_y_manufacturing",
      "manu_month_yr",
      "manufacturing_date",
    ),
    rc_mobile_no: pickField(rcData, "owner_mobile_no", "mobile_no"),
    rc_no_cyl: pickField(rcData, "number_of_cylinder", "no_cyl"),
    rc_norms_desc: pickField(rcData, "norms_type", "norms_desc"),
    rc_owner_name: pickField(rcData, "owner_name", "owner"),
    rc_owner_sr: pickField(rcData, "owner_serial_number", "owner_sr"),
    rc_permanent_address: pickField(rcData, "permanent_address"),
    rc_present_address: pickField(
      rcData,
      "current_address",
      "present_address",
    ),
    rc_pucc_no: pickField(rcData, "puc_number", "pucc_no"),
    rc_pucc_upto: pickField(rcData, "puc_valid_upto", "pucc_upto"),
    rc_regn_no: normalizeRegn(regn) || regn,
    rc_registered_at: pickField(rcData, "registered_place", "registered_at"),
    rc_seat_cap: pickField(rcData, "seating_capacity", "seat_cap"),
    rc_sleeper_cap: pickField(rcData, "sleeper_capacity", "sleeper_cap"),
    rc_stand_cap: pickField(rcData, "standing_capacity", "stand_cap"),
    rc_unld_wt: pickField(rcData, "unladden_weight", "unladen_weight", "unld_wt"),
    rc_vch_catg: pickField(rcData, "vehicle_category", "vch_catg"),
    rc_vh_class_desc: pickField(rcData, "vehicle_class", "vh_class_desc"),
    rc_wheelbase: pickField(rcData, "wheelbase"),
    rc_permit_issue_dt: pickField(rcData, "permit_issue_date"),
    rc_permit_no: pickField(rcData, "permit_no"),
    rc_permit_type: pickField(rcData, "permit_type"),
    rc_permit_valid_from: pickField(rcData, "permit_validity_from"),
    rc_permit_valid_upto: pickField(rcData, "permit_validity_upto"),
    rc_noc_date: pickField(rcData, "noc_issue_date", "noc_date"),
    rc_noc_details: pickField(rcData, "noc_details"),
    rc_noc_to: pickField(rcData, "noc_valid_upto", "noc_to"),
    rc_tax_upto: pickField(rcData, "mv_tax_upto", "tax_upto"),
    state_cd: pickField(rcData, "state", "state_cd"),
  };
}
async function pollIdfyTask(requestId: string): Promise<unknown> {
  const pollUrl = `${idfyBaseUrl()}/v3/tasks?request_id=${encodeURIComponent(requestId)}`;
  return fetchJson(pollUrl, {
    method: "GET",
    headers: idfyHeaders(),
  });
}
/**
 * Submit async RC verification, wait (Laravel sleep), poll once, optionally
 * write extraction_output into `rc_details`.
 */
export async function getVehicleDetailIdfy(
  input: IdfyVehicleDetailInput,
): Promise<IdfyVehicleDetailResult> {
  const rcNumber = normalizeRegn(input.rcRegnNo);
  if (!rcNumber) {
    return { requestId: null, task: null, written: false, skipped: "empty_regn" };
  }
  const variant = input.variant ?? "plus";
  const writeBack = input.writeBack !== false;
  // Laravel plus: skip when chassis already cached for this VRN.
  // Basic mask always runs (fills/overwrites chassis/engine/owner).
  if (variant === "plus") {
    const cached = await db.rc_details.findFirst({
      where: {
        rc_regn_no: rcNumber,
        is_deleted: 0,
        NOT: { rc_chasi_no: null },
      },
      select: { id: true },
    });
    if (cached) {
      return {
        requestId: null,
        task: null,
        written: false,
        skipped: "chassis_already_present",
      };
    }
  }
  const path =
    variant === "basic"
      ? "/v3/tasks/async/verify_with_source/ind_rc_basic"
      : "/v3/tasks/async/verify_with_source/ind_rc_plus";
  const taskId = process.env.IDFY_TASK_ID?.trim() || crypto.randomUUID();
  const groupId = process.env.IDFY_GROUP_ID?.trim() || crypto.randomUUID();
  const submitUrl = joinUrl(idfyBaseUrl(), path);
  const submitBody = {
    task_id: taskId,
    group_id: groupId,
    data: { rc_number: rcNumber },
  };
  console.info(`[idfy] submit ${variant} rc=${rcNumber}`);
  let submit: IdfyAsyncSubmitResult;
  try {
    submit = (await fetchJson(submitUrl, {
      method: "POST",
      headers: idfyHeaders(),
      body: JSON.stringify(submitBody),
    })) as IdfyAsyncSubmitResult;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[idfy] submit failed rc=${rcNumber}:`, msg);
    return {
      requestId: null,
      task: null,
      written: false,
      skipped: `submit_error:${msg.slice(0, 120)}`,
    };
  }
  const requestId =
    typeof submit?.request_id === "string" ? submit.request_id : null;
  if (!requestId) {
    console.warn(`[idfy] no request_id for rc=${rcNumber}`, submit);
    return { requestId: null, task: submit, written: false, skipped: "no_request_id" };
  }
  await sleep(pollDelayMs(variant));
  let task: unknown;
  try {
    task = await pollIdfyTask(requestId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[idfy] poll failed request_id=${requestId}:`, msg);
    return {
      requestId,
      task: null,
      written: false,
      skipped: `poll_error:${msg.slice(0, 120)}`,
    };
  }
  // One soft re-poll if still in progress (Laravel only polls once after sleep).
  const first = parseTaskList(task)[0];
  if (first?.status === "in_progress" || first?.status === "pending") {
    await sleep(Math.min(pollDelayMs(variant), 10_000));
    try {
      task = await pollIdfyTask(requestId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[idfy] re-poll failed request_id=${requestId}:`, msg);
      return {
        requestId,
        task,
        written: false,
        skipped: `repoll_error:${msg.slice(0, 120)}`,
      };
    }
  }
  if (!writeBack) {
    return { requestId, task, written: false };
  }
  const output = extractOutput(task);
  if (!output) {
    const status = parseTaskList(task)[0]?.status;
    console.warn(
      `[idfy] no extraction rc=${rcNumber} request_id=${requestId} status=${String(status ?? "n/a")}`,
    );
    return {
      requestId,
      task,
      written: false,
      skipped: "task_incomplete_or_no_extraction",
    };
  }
  const row =
    variant === "basic" ? mapBasicExtraction(output) : mapPlusExtraction(output);
  if (!row.rc_regn_no) {
    return {
      requestId,
      task,
      written: false,
      skipped: "extraction_missing_registration_number",
    };
  }
  // Basic mask without chassis/engine/owner is useless — skip empty write.
  if (
    variant === "basic" &&
    !row.rc_chasi_no &&
    !row.rc_eng_no &&
    !row.rc_owner_name
  ) {
    console.warn(`[idfy] basic mask empty for rc=${row.rc_regn_no}`);
    return {
      requestId,
      task,
      written: false,
      skipped: "basic_mask_empty",
    };
  }
  try {
    const { mode, fieldsWritten } = await upsertRcDetails(row);
    console.info(
      `[idfy] write-back ${variant} ${mode} rc=${row.rc_regn_no} fields=${fieldsWritten}`,
    );
    return {
      requestId,
      task,
      written: true,
      writeMode: mode,
      fieldsWritten,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[idfy] write-back failed rc=${row.rc_regn_no}:`, msg);
    return {
      requestId,
      task,
      written: false,
      skipped: `write_back_error:${msg.slice(0, 120)}`,
    };
  }
}
/** Laravel `apiVehicleDetailIDFY` — full plus + write-back (skip if chassis exists). */
export async function apiVehicleDetailIdfy(rcRegnNo: string): Promise<IdfyVehicleDetailResult> {
  return getVehicleDetailIdfy({ rcRegnNo, variant: "plus", writeBack: true });
}
/** Laravel `apiVehicleBasicDetailIDFY` — mask chassis/engine/owner into `rc_details`. */
export async function apiVehicleBasicDetailIdfy(
  rcRegnNo: string,
): Promise<IdfyVehicleDetailResult> {
  return getVehicleDetailIdfy({ rcRegnNo, variant: "basic", writeBack: true });
}
