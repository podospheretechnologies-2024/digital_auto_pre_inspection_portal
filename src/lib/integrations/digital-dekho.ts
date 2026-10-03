/**
 * Digital Dekho static-data API (Laravel ImportVahanHistoryData upstream).
 */

import { fetchJson } from "@/lib/integrations/http";

export type DigitalDekhoStaticData = {
  blacklist_history?: Record<string, unknown>[];
  ownership_history?: Record<string, unknown>[];
  challan_history?: Record<string, unknown>[];
  changed_vehicle_history_by_admins?: Record<string, unknown>[];
  fitness_history?: Record<string, unknown>[];
  hypothecation_history?: Record<string, unknown>[];
  insurance_history?: Record<string, unknown>[];
  noc_history?: Record<string, unknown>[];
  paid_fees_history?: Record<string, unknown>[];
  permit_history?: Record<string, unknown>[];
  rc_print_history?: Record<string, unknown>[];
  road_tax_history?: Record<string, unknown>[];
  tax_clear_history?: Record<string, unknown>[];
  old_registration_history?: Record<string, unknown>[];
  [key: string]: unknown;
};

function dekhoBaseUrl(): string {
  return (
    process.env.DIGITAL_DEKHO_API_URL ??
    "https://dekhoapi.digital-dekho.in/api/vehicle/static-data/all"
  ).replace(/\/+$/, "");
}

function dekhoApiKey(): string {
  return process.env.DIGITAL_DEKHO_API_KEY ?? "";
}

/**
 * GET Digital Dekho static-data/all (Laravel curl in ImportVahanHistoryData).
 */
export async function fetchDigitalDekhoStaticData(): Promise<DigitalDekhoStaticData> {
  const apiKey = dekhoApiKey();
  if (!apiKey) {
    throw new Error(
      "DIGITAL_DEKHO_API_KEY is not set. Cannot run Vahan history import.",
    );
  }

  const data = (await fetchJson(dekhoBaseUrl(), {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  })) as { data?: DigitalDekhoStaticData };

  if (!data?.data) {
    return {};
  }
  return data.data;
}
