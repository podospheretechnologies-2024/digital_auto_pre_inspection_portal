import { z } from "zod";

import { vehicleTypes } from "@/lib/masters/schemas";

/** Payment modes shared by Pre-Inspection intimations (Laravel jobs forms). */
export const paymentModes = ["Company", "Cash"] as const;

export { vehicleTypes };

/** Pre-Inspection list filters — exact flowchart queues. */
export const jobListFilterSchema = z.object({
  list: z
    .enum([
      "all",
      "unassigned",
      "fresh",
      "assigned",
      "pending",
      "old",
      "schedule",
      "qc_pending",
      "completed",
      "hold",
      "cancel",
      "cancelled",
    ])
    .default("all"),
  agent_id: z.coerce.number().int().positive().optional(),
  bank_id: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/** Create pre-inspection intimation (Laravel JobsController::addJob → tbl_jobs). */
export const createJobSchema = z.object({
  bank_id: z.coerce.number().int().positive(),
  bank_ref_no: z.string().trim().min(1).max(190),
  agent_id: z.coerce.number().int().positive().nullable().optional(),
  company_id: z.coerce.number().int().positive(),
  model_id: z.coerce.number().int().positive(),
  variant_id: z.coerce.number().int().positive(),
  cdate: z.string().trim().min(1),
  cname: z.string().trim().min(1).max(190),
  mobileno: z.string().trim().min(1).max(190),
  address: z.string().trim().min(1),
  mode: z.enum(paymentModes),
  vehicle_type: z.enum(vehicleTypes),
  vehicleno: z.string().trim().min(1).max(50),
  remark: z.string().trim().max(2000).optional().nullable(),
});

export const updateJobSchema = createJobSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const assignAgentSchema = z.object({
  job_id: z.coerce.number().int().positive(),
  agent_id: z.coerce.number().int().positive(),
});

/** Core inspection save (2W/3W/4W) — Pre-Inspection only. */
export const inspectionCoreSchema = z.object({
  job_id: z.coerce.number().int().positive(),
  proposer: z.string().trim().min(1).max(200),
  insurer_broker: z.string().trim().min(1).max(200),
  vehicleno: z.string().trim().min(1).max(200),
  chassisno: z.string().trim().min(1).max(200),
  engineno: z.string().trim().min(1).max(200),
  year_of_manufacture: z.string().trim().min(1).max(200),
  odometer_reading: z.string().trim().min(1).max(200),
  rc_verified: z.string().trim().min(1).max(200),
  inspection_place: z.string().trim().max(500).optional().nullable(),
  insurer_ref_no: z.string().trim().max(200).optional().nullable(),
  ins_broker_name: z.string().trim().max(50).optional().nullable(),
  ins_broker_mobileno: z.string().trim().max(50).optional().nullable(),
  ins_broker_mailid: z.string().trim().max(50).optional().nullable(),
  ins_broker_agentcode: z.string().trim().max(50).optional().nullable(),
  inspection_case: z.string().trim().max(50).optional().nullable(),
  inspection_type: z.string().trim().max(50).optional().nullable(),
  inspection_status: z.string().trim().max(200).optional().nullable(),
  remarks: z.string().trim().max(5000).optional().nullable(),
  /** High-traffic Blade extras (3W/4W). */
  colour: z.string().trim().max(100).optional().nullable(),
  fuel_used: z.string().trim().max(100).optional().nullable(),
  stereo_make: z.string().trim().max(100).optional().nullable(),
  tyre_of_body: z.string().trim().max(100).optional().nullable(),
  chassis_production_no: z.string().trim().max(100).optional().nullable(),
  /** 3W inspect Blade `market_value` (PI row field — not Valuation module). */
  market_value: z.string().trim().max(100).optional().nullable(),
  stepney_make_dot_no: z.string().trim().max(100).optional().nullable(),
  rh_front_tyre_dot_no: z.string().trim().max(100).optional().nullable(),
  lh_front_tyre_dot_no: z.string().trim().max(100).optional().nullable(),
  lh_rear_tyre_dot_no: z.string().trim().max(100).optional().nullable(),
  rh_rear_tyre_dot_no: z.string().trim().max(100).optional().nullable(),
  /** 4W electrical & non-electrical accessories (Laravel fourwheeler.blade). */
  cd_charger_make: z.string().trim().max(100).optional().nullable(),
  other_electrical: z.string().trim().max(100).optional().nullable(),
  seat_cover: z.string().trim().max(100).optional().nullable(),
  center_lock: z.string().trim().max(100).optional().nullable(),
  gear_locking: z.string().trim().max(100).optional().nullable(),
  other_non_electrical: z.string().trim().max(100).optional().nullable(),
  /**
   * Make / model / variant IDs copied from tbl_jobs (Blade company/model/variant display).
   * Optional — when omitted, create still works; prefer sending from job for PDF/report parity.
   */
  company_id: z.coerce.number().int().positive().optional().nullable(),
  model_id: z.coerce.number().int().positive().optional().nullable(),
  variant_id: z.coerce.number().int().positive().optional().nullable(),
  /** Skip-QC Blade AM/PM (`ctime` column). Auto AM/PM when omitted. */
  ctime: z.enum(["AM", "PM"]).optional().nullable(),
  /** Media filenames / keys (uploaded via /api/v2/files/upload). */
  chassisphoto: z.string().trim().max(255).optional().nullable(),
  video: z.string().trim().max(255).optional().nullable(),
  s3video_url: z.string().trim().max(500).optional().nullable(),
  photos: z
    .array(
      z.object({
        image: z.string().trim().min(1).max(255),
        s3_url: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .max(30)
    .optional()
    .default([]),
  /**
   * Admin skip-QC (Laravel two/three/four-wheeler-add-direct):
   * create/update with QC=1 in one step.
   */
  skip_qc: z.boolean().optional().default(false),
  ownership_name: z.string().trim().max(191).optional().nullable(),
  valuation_price: z.coerce.number().optional().nullable(),
  /** Condition fields: Safe / Not Safe / N/A */
  conditions: z.record(z.string().max(100)).optional().default({}),
});

/**
 * PI QC submit (Laravel updateremark{2,3,4}wqc).
 * `valuation_price` here is a field on the inspection row after QC — not the Valuation module.
 */
export const qcSubmitSchema = z.object({
  inspection_id: z.coerce.number().int().positive(),
  vehicle_type: z.enum(["2wheeler", "3wheeler", "4wheeler"]),
  remarks: z.string().trim().min(1),
  valuation_price: z.coerce.number(),
  ownership_name: z.string().trim().min(1).max(191),
});

/** Hold / resume / cancel / restore transitions */
export const workflowActionSchema = z.object({
  action: z.enum(["hold", "resume", "cancel", "restore"]),
});

/** Move a case back to an earlier workflow desk */
export const changeStageSchema = z.object({
  stage: z.enum(["fresh", "assigned", "qc_pending"]),
  reason: z.string().trim().min(1, "Reason is required").max(500),
});

export type JobListFilter = z.infer<typeof jobListFilterSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type InspectionCoreInput = z.infer<typeof inspectionCoreSchema>;
export type QcSubmitInput = z.infer<typeof qcSubmitSchema>;
export type WorkflowAction = z.infer<typeof workflowActionSchema>["action"];
export type ChangeStageTarget = z.infer<typeof changeStageSchema>["stage"];
