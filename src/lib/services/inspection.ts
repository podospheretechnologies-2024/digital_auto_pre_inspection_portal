import { db } from "@/lib/db";
import { enqueueCaseSubmittedSms } from "@/lib/jobs/enqueue-sms";
import {
  conditionFieldsFor,
  resolveWheelKind,
  type WheelKind,
} from "@/lib/jobs/helpers";
import type { InspectionCoreInput } from "@/lib/jobs/schemas";
import {
  appendInspectionPhotos,
  listInspectionPhotos,
} from "@/lib/services/inspection-media";
import type { SessionUser } from "@/types/next-auth";

export type VehicleType = WheelKind | string;

function amPm(): string {
  return new Date().getHours() >= 12 ? "PM" : "AM";
}

function pickConditions(
  kind: WheelKind,
  conditions: Record<string, string> | undefined,
): Record<string, string> {
  const allowed = new Set(conditionFieldsFor(kind));
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(conditions ?? {})) {
    if (allowed.has(key) && value != null && value !== "") {
      out[key] = value;
    }
  }
  return out;
}

function basenameFromKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[/\\]/);
  return parts[parts.length - 1] || trimmed;
}

export async function getInspectionByJobId(
  jobId: number,
  vehicleType: VehicleType,
) {
  const kind = resolveWheelKind(String(vehicleType));
  if (kind === "2wheeler") {
    return db.tbl_2wheeler.findFirst({
      where: { job_id: jobId },
      orderBy: { id: "desc" },
    });
  }
  if (kind === "3wheeler") {
    return db.tbl_3wheeler.findFirst({
      where: { job_id: jobId },
      orderBy: { id: "desc" },
    });
  }
  return db.tbl_4wheeler.findFirst({
    where: { job_id: jobId },
    orderBy: { id: "desc" },
  });
}

export async function getInspectionById(id: number, kind: WheelKind) {
  if (kind === "2wheeler") return db.tbl_2wheeler.findUnique({ where: { id } });
  if (kind === "3wheeler") return db.tbl_3wheeler.findUnique({ where: { id } });
  return db.tbl_4wheeler.findUnique({ where: { id } });
}

function buildPayloadFields(
  user: SessionUser,
  kind: WheelKind,
  payload: InspectionCoreInput,
  opts: { create: boolean },
) {
  const now = new Date();
  const conditions = pickConditions(kind, payload.conditions);
  const chassisphoto = basenameFromKey(payload.chassisphoto);
  const video = basenameFromKey(payload.video);
  const skipQc = Boolean(payload.skip_qc);

  const qcFields = skipQc
    ? {
        qc: 1,
        qc_checked_by: String(user.id),
        qc_datetime: now,
        ownership_name: payload.ownership_name ?? null,
        valuation_price:
          payload.valuation_price != null
            ? Number(payload.valuation_price)
            : null,
      }
    : opts.create
      ? { qc: 0 }
      : {};

  const extras3w4w =
    kind === "3wheeler" || kind === "4wheeler"
      ? {
          colour: payload.colour ?? null,
          fuel_used: payload.fuel_used ?? null,
          stereo_make: payload.stereo_make ?? null,
        }
      : {};

  const extras3w =
    kind === "3wheeler"
      ? {
          tyre_of_body: payload.tyre_of_body ?? null,
          chassis_production_no: payload.chassis_production_no ?? null,
          market_value: payload.market_value ?? null,
        }
      : {};

  const extras4w =
    kind === "4wheeler"
      ? {
          stepney_make_dot_no: payload.stepney_make_dot_no ?? null,
          rh_front_tyre_dot_no: payload.rh_front_tyre_dot_no ?? null,
          lh_front_tyre_dot_no: payload.lh_front_tyre_dot_no ?? null,
          lh_rear_tyre_dot_no: payload.lh_rear_tyre_dot_no ?? null,
          rh_rear_tyre_dot_no: payload.rh_rear_tyre_dot_no ?? null,
          cd_charger_make: payload.cd_charger_make ?? null,
          other_electrical: payload.other_electrical ?? null,
          seat_cover: payload.seat_cover ?? null,
          center_lock: payload.center_lock ?? null,
          gear_locking: payload.gear_locking ?? null,
          other_non_electrical: payload.other_non_electrical ?? null,
        }
      : {};

  const media: Record<string, string | null> = {};
  if (chassisphoto != null) media.chassisphoto = chassisphoto;
  if (video != null) media.video = video;
  if (payload.s3video_url) media.s3video_url = payload.s3video_url;

  const cmv: Record<string, number | null> = {};
  if (payload.company_id != null) cmv.company_id = payload.company_id;
  if (payload.model_id != null) cmv.model_id = payload.model_id;
  if (payload.variant_id != null) cmv.variant_id = payload.variant_id;

  const ctimeField =
    payload.ctime === "AM" || payload.ctime === "PM"
      ? { ctime: payload.ctime }
      : opts.create
        ? { ctime: amPm() }
        : {};

  return {
    proposer: payload.proposer,
    insurer_broker: payload.insurer_broker,
    vehicleno: payload.vehicleno,
    chassisno: payload.chassisno,
    engineno: payload.engineno,
    year_of_manufacture: payload.year_of_manufacture,
    odometer_reading: payload.odometer_reading,
    rc_verified: payload.rc_verified,
    inspection_place: payload.inspection_place ?? null,
    insurer_ref_no: payload.insurer_ref_no ?? null,
    ins_broker_name: payload.ins_broker_name ?? null,
    ins_broker_mobileno: payload.ins_broker_mobileno ?? null,
    ins_broker_mailid: payload.ins_broker_mailid ?? null,
    ins_broker_agentcode: payload.ins_broker_agentcode ?? null,
    inspection_case: payload.inspection_case ?? null,
    inspection_type: payload.inspection_type ?? null,
    inspection_status: payload.inspection_status ?? null,
    remarks: payload.remarks ?? null,
    updated_at: now,
    ...cmv,
    ...ctimeField,
    ...(opts.create
      ? {
          job_id: payload.job_id,
          inspect_by: Number(user.id),
          created_at: now,
        }
      : {}),
    ...extras3w4w,
    ...extras3w,
    ...extras4w,
    ...media,
    ...qcFields,
    ...conditions,
  };
}

/**
 * Create inspection row (core + conditions + media).
 * skip_qc mirrors Laravel *-add-direct (QC=1 on insert).
 */
export async function saveInspection(
  user: SessionUser,
  vehicleType: VehicleType,
  payload: InspectionCoreInput,
) {
  const kind = resolveWheelKind(String(vehicleType));
  const data = buildPayloadFields(user, kind, payload, { create: true });

  let row;
  if (kind === "2wheeler") {
    row = await db.tbl_2wheeler.create({ data: data as never });
  } else if (kind === "3wheeler") {
    row = await db.tbl_3wheeler.create({ data: data as never });
  } else {
    row = await db.tbl_4wheeler.create({ data: data as never });
  }

  if (payload.photos?.length) {
    await appendInspectionPhotos(kind, row.id, payload.photos);
  }

  await enqueueCaseSubmittedSms({ jobId: payload.job_id });

  const photos = await listInspectionPhotos(kind, row.id);
  return { ...row, photos };
}

export async function updateInspection(
  user: SessionUser,
  kind: WheelKind,
  inspectionId: number,
  payload: InspectionCoreInput,
) {
  const data = buildPayloadFields(user, kind, payload, { create: false });

  let row;
  if (kind === "2wheeler") {
    row = await db.tbl_2wheeler.update({
      where: { id: inspectionId },
      data: data as never,
    });
  } else if (kind === "3wheeler") {
    row = await db.tbl_3wheeler.update({
      where: { id: inspectionId },
      data: data as never,
    });
  } else {
    row = await db.tbl_4wheeler.update({
      where: { id: inspectionId },
      data: data as never,
    });
  }

  if (payload.photos?.length) {
    await appendInspectionPhotos(kind, inspectionId, payload.photos);
  }

  const photos = await listInspectionPhotos(kind, inspectionId);
  return { ...row, photos };
}
