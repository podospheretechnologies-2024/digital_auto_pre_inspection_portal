/**
 * Public RC payload fields returned by Laravel vehicle-rc / valuation-vehicle-rc.
 */

export const RC_PUBLIC_FIELDS = [
  "rc_blacklist_status",
  "rc_body_type_desc",
  "rc_chasi_no",
  "rc_color",
  "rc_cubic_cap",
  "rc_eng_no",
  "rc_f_name",
  "rc_financer",
  "rc_fit_upto",
  "rc_fuel_desc",
  "rc_gvw",
  "rc_insurance_comp",
  "rc_insurance_policy_no",
  "rc_insurance_upto",
  "rc_maker_desc",
  "rc_maker_model",
  "rc_manu_month_yr",
  "rc_mobile_no",
  "rc_no_cyl",
  "rc_noc_date",
  "rc_noc_details",
  "rc_noc_to",
  "rc_norms_desc",
  "rc_owner_name",
  "rc_owner_sr",
  "rc_permanent_address",
  "rc_permit_issue_dt",
  "rc_permit_no",
  "rc_permit_type",
  "rc_permit_valid_from",
  "rc_permit_valid_upto",
  "rc_present_address",
  "rc_pucc_no",
  "rc_pucc_upto",
  "rc_registered_at",
  "rc_regn_dt",
  "rc_regn_no",
  "rc_rto_code",
  "rc_seat_cap",
  "rc_sleeper_cap",
  "rc_stand_cap",
  "rc_status",
  "rc_status_as_on",
  "rc_tax_amount",
  "rc_tax_paid_date",
  "rc_tax_upto",
  "rc_unld_wt",
  "rc_vch_catg",
  "rc_vh_class_desc",
  "rc_wheelbase",
  "state_cd",
  "crn",
  "status",
] as const;

export type RcPublicField = (typeof RC_PUBLIC_FIELDS)[number];

export type RcRow = Record<string, unknown> & {
  id?: number;
  rc_regn_dt?: string | null;
  MESSAGE?: string | null;
  rc_maker_desc?: string | null;
  rc_maker_model?: string | null;
  rc_fuel_desc?: string | null;
  rc_model_cd?: string | null;
};

export function toPublicRcData(row: RcRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of RC_PUBLIC_FIELDS) {
    out[key] = row[key] ?? null;
  }
  return out;
}
