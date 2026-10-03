/**
 * Vahan / govt proxy integrations (Laravel `apiVehicleDetailGovt`, mobile↔VRN, FASTag, eChallan).
 * Base URL: `VAHAN_PROXY_URL` (no hardcoded ngrok hosts).
 */

import { Prisma } from "@/generated/prisma/client";

import { apiVehicleBasicDetailIdfy } from "@/lib/integrations/idfy";
import { requireEnv } from "@/lib/integrations/errors";
import { fetchJsonSoft, joinUrl } from "@/lib/integrations/http";
import {
  normalizeMobile,
  normalizeRegn,
  scalarOrNull,
} from "@/lib/integrations/normalize";
import { db } from "@/lib/db";

function vahanProxyBase(): string {
  return requireEnv("VAHAN_PROXY_URL").replace(/\/+$/, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

async function upsertRcDetails(
  data: Prisma.rc_detailsUncheckedCreateInput,
): Promise<void> {
  const regn = data.rc_regn_no;
  if (!regn) return;

  const existing = await db.rc_details.findFirst({
    where: { rc_regn_no: regn, is_deleted: 0 },
    select: { id: true },
  });

  const { id: _ignoredId, ...payload } = data as typeof data & {
    id?: number;
  };
  void _ignoredId;

  if (!existing) {
    await db.rc_details.create({
      data: {
        ...payload,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
  } else {
    await db.rc_details.update({
      where: { id: existing.id },
      data: {
        ...payload,
        updated_at: new Date(),
      },
    });
  }
}

/**
 * Laravel `apiVehicleDetailGovt` — fetch proxy + upsert `rc_details`.
 * Optionally calls IDfy basic mask (`maskData`).
 */
export async function apiVehicleDetailGovt(
  rcRegnNo: string,
  maskData = true,
): Promise<void> {
  const regn = normalizeRegn(rcRegnNo);
  if (!regn) return;

  const url = `${joinUrl(vahanProxyBase(), "/get_vahan_info.php")}?vehicleNumber=${encodeURIComponent(regn)}`;
  const { data: result } = await fetchJsonSoft(url, { method: "GET" });
  const root = asRecord(result);
  const rcInfo = asRecord(root?.rc_info);
  if (!rcInfo || !rcInfo.rc_regn_no) return;

  const registrationDetails = asRecord(rcInfo.registration_details);

  const row: Prisma.rc_detailsUncheckedCreateInput = {
    rc_status: scalarOrNull(rcInfo.rc_status),
    rc_regn_dt: scalarOrNull(rcInfo.rc_regn_dt),
    rc_blacklist_status: scalarOrNull(rcInfo.rc_blacklist_status),
    rc_body_type_desc: scalarOrNull(rcInfo.rc_body_type_desc),
    rc_chasi_no: scalarOrNull(rcInfo.rc_chasi_no),
    rc_color: scalarOrNull(rcInfo.rc_color),
    rc_cubic_cap: scalarOrNull(rcInfo.rc_cubic_cap),
    rc_eng_no: scalarOrNull(rcInfo.rc_eng_no),
    rc_f_name: scalarOrNull(rcInfo.father_name),
    rc_financer: scalarOrNull(rcInfo.rc_financer),
    rc_fit_upto: scalarOrNull(rcInfo.rc_fit_upto),
    rc_fuel_desc: scalarOrNull(rcInfo.rc_fuel_desc),
    rc_gvw: scalarOrNull(rcInfo.rc_gvw),
    rc_insurance_type: scalarOrNull(rcInfo.type),
    rc_insurance_comp: scalarOrNull(rcInfo.rc_insurance_comp),
    rc_insurance_policy_no: scalarOrNull(rcInfo.rc_insurance_policy_no),
    rc_insurance_from: scalarOrNull(rcInfo.from),
    rc_insurance_upto: scalarOrNull(rcInfo.rc_insurance_upto),
    rc_maker_desc: scalarOrNull(rcInfo.rc_maker_desc),
    rc_maker_model: scalarOrNull(rcInfo.rc_maker_model),
    rc_manu_month_yr: scalarOrNull(rcInfo.rc_manu_month_yr),
    rc_mobile_no: scalarOrNull(rcInfo.owner_mobile_no),
    rc_no_cyl: scalarOrNull(rcInfo.rc_no_cyl),
    rc_norms_desc: scalarOrNull(rcInfo.rc_norms_desc),
    rc_owner_name: scalarOrNull(rcInfo.rc_owner_name),
    rc_owner_sr: scalarOrNull(rcInfo.rc_owner_sr),
    rc_permanent_address: scalarOrNull(rcInfo.rc_permanent_address),
    rc_present_address: scalarOrNull(rcInfo.rc_present_address),
    rc_pucc_no: scalarOrNull(rcInfo.rc_pucc_no),
    rc_pucc_from: scalarOrNull(rcInfo.from),
    rc_pucc_upto: scalarOrNull(rcInfo.rc_pucc_upto),
    rc_regn_no: String(rcInfo.rc_regn_no),
    rc_registered_at: scalarOrNull(rcInfo.rc_registered_at),
    rc_seat_cap: scalarOrNull(rcInfo.rc_seat_cap),
    rc_sleeper_cap: scalarOrNull(rcInfo.rc_sleeper_cap),
    rc_stand_cap: scalarOrNull(rcInfo.rc_stand_cap),
    rc_unld_wt: scalarOrNull(rcInfo.rc_unld_wt),
    rc_vch_catg: scalarOrNull(rcInfo.rc_vch_catg),
    rc_vh_class_desc: scalarOrNull(rcInfo.rc_vh_class_desc),
    rc_wheelbase: scalarOrNull(rcInfo.rc_wheelbase),
    rc_permit_issue_dt: scalarOrNull(rcInfo.rc_permit_issue_dt),
    rc_permit_no: scalarOrNull(rcInfo.rc_permit_no),
    rc_permit_type: scalarOrNull(rcInfo.rc_permit_type),
    rc_permit_valid_from: scalarOrNull(rcInfo.rc_permit_valid_from),
    rc_permit_valid_upto: scalarOrNull(rcInfo.rc_permit_valid_upto),
    rc_noc_date: scalarOrNull(rcInfo.noc_issue_date),
    rc_noc_details: scalarOrNull(rcInfo.rc_noc_details),
    rc_noc_to: scalarOrNull(rcInfo.noc_valid_upto),
    rc_tax_type: scalarOrNull(rcInfo.tax_type),
    rc_tax_amount: scalarOrNull(rcInfo.total_amount),
    rc_tax_paid_date: scalarOrNull(rcInfo.tax_from),
    rc_tax_upto: scalarOrNull(rcInfo.rc_tax_upto),
    rc_old_regn_no: scalarOrNull(registrationDetails?.old_registration_no),
    rc_regn_valid_upto: scalarOrNull(rcInfo.rc_regn_upto),
    rc_status_as_on: scalarOrNull(rcInfo.rc_status_as_on),
    state_cd: scalarOrNull(rcInfo.state_cd),
    rc_model_cd: scalarOrNull(rcInfo.rc_model_cd),
  };

  await upsertRcDetails(row);

  // Laravel: if ($mask_data) { apiVehicleBasicDetailIDFY(...) }
  if (maskData && process.env.IDFY_API_KEY?.trim() && process.env.IDFY_ACCOUNT_ID?.trim()) {
    try {
      await apiVehicleBasicDetailIdfy(String(rcInfo.rc_regn_no));
    } catch {
      // Laravel continues even if IDfy mask fails
    }
  }
}

/** Laravel `apiMobileToVRN` */
export async function apiMobileToVrn(mobileNumber: string): Promise<void> {
  const mobile = normalizeMobile(mobileNumber);
  if (!mobile) return;

  const url = `${joinUrl(vahanProxyBase(), "/get_mobile_to_vrn.php")}?mobile_number=${encodeURIComponent(mobile)}`;
  const { data: result } = await fetchJsonSoft(url, { method: "GET" });
  const root = asRecord(result);
  const data = asRecord(root?.data);
  const vehicleNos = data?.vehicleNo;
  if (!Array.isArray(vehicleNos)) return;

  for (const vehicleNo of vehicleNos) {
    const vrn = normalizeRegn(String(vehicleNo ?? ""));
    if (!vrn) continue;
    const existing = await db.vrn_and_mobile_numbers.findFirst({
      where: { vehicle_registration_number: vrn, is_deleted: 0 },
      select: { id: true },
    });
    if (!existing) {
      await db.vrn_and_mobile_numbers.create({
        data: {
          vehicle_registration_number: vrn,
          mobile_number: mobile,
          is_deleted: 0,
        },
      });
    } else {
      await db.vrn_and_mobile_numbers.update({
        where: { id: existing.id },
        data: { mobile_number: mobile },
      });
    }
  }
}

/** Laravel `apiVRNToMobile` */
export async function apiVrnToMobile(
  vehicleRegistrationNumber: string,
): Promise<void> {
  const vrn = normalizeRegn(vehicleRegistrationNumber);
  if (!vrn) return;

  const url = `${joinUrl(vahanProxyBase(), "/get_vrn_to_mobile.php")}?rc_regn_no=${encodeURIComponent(vrn)}`;
  const { data: result } = await fetchJsonSoft(url, { method: "GET" });
  const root = asRecord(result);
  const data = asRecord(root?.data);
  const mobileNo = data?.mobileNo;
  if (mobileNo == null || mobileNo === "") return;

  const mobile = String(mobileNo);
  const existing = await db.vrn_and_mobile_numbers.findFirst({
    where: { vehicle_registration_number: vrn, is_deleted: 0 },
    select: { id: true },
  });
  if (!existing) {
    await db.vrn_and_mobile_numbers.create({
      data: {
        vehicle_registration_number: vrn,
        mobile_number: mobile,
        is_deleted: 0,
      },
    });
  } else {
    await db.vrn_and_mobile_numbers.update({
      where: { id: existing.id },
      data: { mobile_number: mobile },
    });
  }
}

/** Laravel `apiFASTagGovt` — returns raw upstream body. */
export async function apiFastagGovt(rcRegnNo: string): Promise<string> {
  const regn = normalizeRegn(rcRegnNo);
  if (!regn) return "";
  const url = `${joinUrl(vahanProxyBase(), "/get_FASTag_info.php")}?vehicleNumber=${encodeURIComponent(regn)}`;
  const { text } = await fetchJsonSoft(url, { method: "GET" });
  return text;
}

/** Laravel `apiEChallanGovt` — fetch + insert pending challans. */
export async function apiEChallanGovt(rcRegnNo: string): Promise<void> {
  const regn = normalizeRegn(rcRegnNo);
  if (!regn) return;

  const url = `${joinUrl(vahanProxyBase(), "/get_vahan_echallan_info.php")}?vehicleNumber=${encodeURIComponent(regn)}`;
  const { data: result } = await fetchJsonSoft(url, { method: "GET" });
  const root = asRecord(result);
  const challanList = asRecord(root?.challan_list);
  const pending = challanList?.Pending_data;
  if (!Array.isArray(pending)) return;

  let serial = 1;
  for (const item of pending) {
    const row = asRecord(item);
    if (!row) continue;

    let offenceDetails: string | null = scalarOrNull(row.offence_details);
    if (Array.isArray(row.offence_details)) {
      offenceDetails = row.offence_details
        .map((od) => {
          const o = asRecord(od);
          return o
            ? `Act: ${String(o.act ?? "")}, Description: ${String(o.name ?? "")}`
            : "";
        })
        .filter(Boolean)
        .join(".");
    }

    await db.$executeRaw`
      INSERT INTO history_of_challans
        (Registration_No, Serial_No, Challan_No, Offense_Details, Challan_Place,
         Challan_Date_Time, State, RTO, Accused_Name, Amount, Challan_Status,
         Payment_Source, Payment_Date, Receipt_Number, updated_at)
      VALUES
        (${regn}, ${serial}, ${scalarOrNull(row.challan_no)}, ${offenceDetails},
         ${scalarOrNull(row.challan_place)}, ${scalarOrNull(row.challan_date_time)},
         ${scalarOrNull(row.state)}, ${scalarOrNull(row.rto)},
         ${scalarOrNull(row.accused_name)}, ${scalarOrNull(row.amount)},
         ${scalarOrNull(row.challan_status)}, ${scalarOrNull(row.payment_source)},
         ${scalarOrNull(row.payment_date)}, ${scalarOrNull(row.receipt_number)},
         NOW())
    `;
    serial += 1;
  }
}

/** Freshness window helper. */
export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function findRcDetail(
  rcRegnNo: string,
  opts?: { maxAgeHours?: number },
) {
  const regn = normalizeRegn(rcRegnNo);
  const where: Prisma.rc_detailsWhereInput = {
    rc_regn_no: regn,
    is_deleted: 0,
  };
  if (opts?.maxAgeHours != null) {
    where.updated_at = { gte: hoursAgo(opts.maxAgeHours) };
  }
  return db.rc_details.findFirst({ where });
}

/**
 * Accept Vahan scraper payload (Laravel `VahanController::storeVahanData`).
 */
export async function storeVahanData(
  vahan: Record<string, unknown>,
): Promise<"success" | string> {
  try {
    const vehicle = asRecord(vahan.vehicle_information);
    const owner = asRecord(vahan.owner_information);
    const pucc = asRecord(vahan.pucc_details);
    if (!vehicle || !owner || !pucc) {
      return "Error: missing vehicle/owner/pucc blocks";
    }

    const permanent = asRecord(owner.permanent_address) ?? {};
    const current = asRecord(owner.current_address) ?? {};
    const ownerPermanentAddress = [
      permanent.house_street,
      permanent.landmark,
      permanent.city,
      permanent.district,
      permanent.state,
      permanent.pin,
    ]
      .filter((x) => x != null && String(x).length)
      .join(", ");
    const ownerCurrentAddress = [
      current.house_street,
      current.landmark,
      current.city,
      current.district,
      current.state,
      current.pin,
    ]
      .filter((x) => x != null && String(x).length)
      .join(", ");

    const hypothecations = Array.isArray(vahan.hypothecation_details)
      ? vahan.hypothecation_details
      : [];
    const hypothecationDetail =
      hypothecations.length > 0
        ? asRecord(hypothecations[hypothecations.length - 1])
        : null;

    const insurance = asRecord(vahan.insurance_details) ?? {};
    const taxHistory = Array.isArray(vahan.tax_payment_history)
      ? vahan.tax_payment_history
      : [];
    const taxPayment =
      taxHistory.length > 0
        ? asRecord(taxHistory[taxHistory.length - 1])
        : null;

    const month = String(vehicle.manufacture_month ?? "").padStart(2, "0");
    const year = String(vehicle.manufacture_year ?? "");

    const permit = asRecord(vahan.permit_details) ?? {};
    const noc = asRecord(vahan.noc_details) ?? {};
    const registrationDetails = asRecord(vahan.registration_details);
    const temporaryRegistration = asRecord(vahan.temporary_registration);

    let rcRegnDt = scalarOrNull(vahan.registration_date);
    let rcRegnValidUpto = scalarOrNull(vahan.registration_valid_upto);
    if (registrationDetails) {
      rcRegnDt = scalarOrNull(registrationDetails.first_registration_date);
      rcRegnValidUpto = scalarOrNull(
        registrationDetails.registration_valid_upto,
      );
    } else if (temporaryRegistration) {
      rcRegnDt = scalarOrNull(temporaryRegistration.reg_date);
    }

    const regn = normalizeRegn(String(vahan.registration_no ?? ""));
    if (!regn) return "Error: registration_no required";

    await upsertRcDetails({
      rc_body_type_desc: scalarOrNull(vehicle.body_type),
      rc_chasi_no: scalarOrNull(vehicle.chassis_no),
      rc_color: scalarOrNull(vehicle.color),
      rc_cubic_cap: scalarOrNull(vehicle.cubic_capacity),
      rc_eng_no: scalarOrNull(vehicle.engine_no),
      rc_f_name: scalarOrNull(owner.swd_of),
      rc_financer: scalarOrNull(hypothecationDetail?.financer),
      rc_fit_upto: scalarOrNull(owner.fitness_valid_upto),
      rc_fuel_desc: scalarOrNull(vehicle.fuel),
      rc_gvw: scalarOrNull(vehicle.laden_weight),
      rc_insurance_type: scalarOrNull(insurance.type),
      rc_insurance_comp: scalarOrNull(insurance.company),
      rc_insurance_policy_no: scalarOrNull(insurance.policy_no),
      rc_insurance_from: scalarOrNull(insurance.from),
      rc_insurance_upto: scalarOrNull(insurance.upto),
      rc_maker_desc: scalarOrNull(vehicle.maker),
      rc_maker_model: scalarOrNull(vehicle.model),
      rc_manu_month_yr: `${month}/${year}`,
      rc_mobile_no: scalarOrNull(owner.mobile_no),
      rc_no_cyl: scalarOrNull(vehicle.no_of_cylinders),
      rc_norms_desc: scalarOrNull(vehicle.emission_norms),
      rc_owner_name: scalarOrNull(owner.owner_name),
      rc_owner_sr: scalarOrNull(owner.ownership_serial),
      rc_permanent_address: ownerPermanentAddress || null,
      rc_present_address: ownerCurrentAddress || null,
      rc_pucc_no: scalarOrNull(pucc.pucc_no),
      rc_pucc_from: scalarOrNull(pucc.from),
      rc_pucc_upto: scalarOrNull(pucc.upto),
      rc_regn_no: regn,
      rc_registered_at: scalarOrNull(vahan.office),
      rc_seat_cap: scalarOrNull(vehicle.seating_capacity),
      rc_sleeper_cap: scalarOrNull(vehicle.sleeper_capacity),
      rc_stand_cap: scalarOrNull(vehicle.standing_capacity),
      rc_unld_wt: scalarOrNull(vehicle.unladen_weight),
      rc_vch_catg: scalarOrNull(vehicle.vehicle_category),
      rc_vh_class_desc: scalarOrNull(vehicle.vehicle_class),
      rc_wheelbase: scalarOrNull(vehicle.wheelbase),
      rc_permit_no: scalarOrNull(permit.permit_no),
      rc_permit_type: scalarOrNull(permit.permit_type),
      rc_permit_valid_from: scalarOrNull(permit.valid_from),
      rc_permit_valid_upto: scalarOrNull(permit.valid_upto),
      rc_noc_date: scalarOrNull(noc.noc_issue_date),
      rc_noc_details: scalarOrNull(noc.noc_no),
      rc_tax_type: scalarOrNull(taxPayment?.tax_type),
      rc_tax_amount: scalarOrNull(taxPayment?.total_amount),
      rc_tax_paid_date: scalarOrNull(taxPayment?.tax_from),
      rc_tax_upto: scalarOrNull(taxPayment?.tax_upto),
      rc_old_regn_no: scalarOrNull(registrationDetails?.old_registration_no),
      rc_regn_dt: rcRegnDt,
      rc_regn_valid_upto: rcRegnValidUpto,
      state_cd: scalarOrNull(vahan.state),
    });

    return "success";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error: ${message}`;
  }
}

/** History table map for `delete_rc_history_data`. */
export const RC_HISTORY_TABLES: Record<string, string> = {
  "History of Transfer of Ownership": "history_of_transfer_ownerships",
  "History of Challan": "history_of_challans",
  "History of Insurance of Vehicle": "history_of_insurances",
  "History of Hypothecation of Vehicle": "history_of_hypothecations",
  "History of Paid Fees": "history_of_paid_fees",
  "History of Paid Road Tax": "history_of_road_taxes",
  "History of Blacklist": "history_of_blacklists",
  "History of Permit": "history_of_permits",
  "History of Tax Clear": "history_of_tax_clears",
  "History of Fitness": "history_of_fitnesses",
  "History of Changed Vehicle Record by Admin":
    "history_of_changed_vehicle_record_by_admins",
  "History of RC Print": "history_of_rc_print_details",
  "History of NOC": "history_of_noc",
};

const ALLOWED_HISTORY_TABLES = new Set(Object.values(RC_HISTORY_TABLES));

export async function deleteRcHistoryData(input: {
  rc_regn_no: string;
  rc_history: string;
}): Promise<"success" | string> {
  try {
    const regn = normalizeRegn(input.rc_regn_no);
    const table = RC_HISTORY_TABLES[input.rc_history];
    if (!regn || !table || !ALLOWED_HISTORY_TABLES.has(table)) {
      return "success";
    }
    await db.$executeRawUnsafe(
      `DELETE FROM \`${table}\` WHERE \`Registration_No\` = ?`,
      regn,
    );
    return "success";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error: ${message}`;
  }
}

/** Attach history_* collections for vehicle-info (Laravel getVehicleInfo). */
export async function attachRcHistories(
  rcRegnNo: string,
  rcDetail: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const regn = normalizeRegn(rcRegnNo);

  const [
    history_of_challans,
    history_of_hypothecations,
    history_of_insurances,
    history_of_paid_fees,
    history_of_road_taxes,
    history_of_transfer_ownerships,
    history_of_blacklists,
    history_of_changed_vehicle_record_by_admins,
    history_of_fitnesses,
    history_of_permits,
    history_of_rc_print_details,
    history_of_tax_clears,
    history_of_noc_list,
  ] = await Promise.all([
    db.$queryRawUnsafe(`SELECT * FROM history_of_challans WHERE Registration_No = ? ORDER BY Serial_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_hypothecations WHERE Registration_No = ? ORDER BY From_Date ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_insurances WHERE Registration_No = ? ORDER BY Sr_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_paid_fees WHERE Registration_No = ? ORDER BY Receipt_Date ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_road_taxes WHERE Registration_No = ? ORDER BY Tax_From ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_transfer_ownerships WHERE Registration_No = ? ORDER BY Ownership_Serial ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_blacklists WHERE Registration_No = ? ORDER BY Complain_File_Number ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_changed_vehicle_record_by_admins WHERE Registration_No = ? ORDER BY Sr_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_fitnesses WHERE Registration_No = ? ORDER BY Application_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_permits WHERE Registration_No = ? ORDER BY Application_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_rc_print_details WHERE Registration_No = ? ORDER BY Application_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_tax_clears WHERE Registration_No = ? ORDER BY Sr_No ASC`, regn),
    db.$queryRawUnsafe(`SELECT * FROM history_of_noc WHERE Registration_No = ? ORDER BY Application_No ASC`, regn),
  ]);

  return {
    ...rcDetail,
    history_of_challans,
    history_of_hypothecations,
    history_of_insurances,
    history_of_paid_fees,
    history_of_road_taxes,
    history_of_transfer_ownerships,
    history_of_blacklists,
    history_of_changed_vehicle_record_by_admins,
    history_of_fitnesses,
    history_of_permits,
    history_of_rc_print_details,
    history_of_tax_clears,
    history_of_noc_list,
  };
}
