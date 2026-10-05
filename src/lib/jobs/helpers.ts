/** Shared Phase 5 job helpers — vehicle type routing + derived workflow status. */

export type WheelKind = "2wheeler" | "3wheeler" | "4wheeler";

/**
 * Exact Pre-Inspection workflow (flowchart):
 * Create → fresh → Assign surveyor → assigned → Upload/submit → qc_pending
 * → QC complete → completed | Hold ↔ resume | Cancel → cancelled → restore
 */
export type WorkflowStatus =
  | "fresh"
  | "assigned"
  | "qc_pending"
  | "completed"
  | "hold"
  | "cancelled";

/** @deprecated use WorkflowStatus */
export type DerivedJobStatus =
  | WorkflowStatus
  | "unassigned"
  | "inspected"
  | "qc_done"
  | "unknown";

/** Map Laravel vehicle_type strings to inspection table kind. */
export function resolveWheelKind(
  vehicleType: string | null | undefined,
): WheelKind {
  const v = (vehicleType ?? "").toLowerCase();
  if (v.includes("2") || v.includes("two")) return "2wheeler";
  if (v.includes("3") || v.includes("three")) return "3wheeler";
  return "4wheeler";
}

export function inspectPathForJob(
  jobId: number,
  vehicleType: string | null | undefined,
  opts?: { mode?: "create" | "edit" | "view"; skipQc?: boolean },
): string {
  const kind = resolveWheelKind(vehicleType);
  const type =
    kind === "2wheeler" ? "2w" : kind === "3wheeler" ? "3w" : "4w";
  const params = new URLSearchParams({ type });
  if (opts?.mode) params.set("mode", opts.mode);
  if (opts?.skipQc) params.set("skip_qc", "1");
  return `/jobs/inspect/${jobId}?${params}`;
}

export function pdfPathForInspection(
  kind: WheelKind | string,
  inspectionId: number,
  opts?: { format?: "html"; store?: boolean },
): string {
  const wheel = resolveWheelKind(String(kind));
  const type =
    wheel === "2wheeler" ? "2w" : wheel === "3wheeler" ? "3w" : "4w";
  const params = new URLSearchParams({
    inspectionId: String(inspectionId),
  });
  if (opts?.format === "html") params.set("format", "html");
  if (opts?.store) params.set("store", "1");
  return `/api/v2/pdf/${type}?${params}`;
}

export function deriveWorkflowStatus(input: {
  agent_id: number | null | undefined;
  hasInspection?: boolean;
  qc?: number | null;
  on_hold?: number | null;
  is_deleted?: number | null;
}): WorkflowStatus {
  if (Number(input.is_deleted ?? 0) === 1) return "cancelled";
  if (Number(input.on_hold ?? 0) === 1) return "hold";
  if (input.agent_id == null) return "fresh";
  if (!input.hasInspection) return "assigned";
  if (Number(input.qc ?? 0) === 1) return "completed";
  return "qc_pending";
}

/** @deprecated prefer deriveWorkflowStatus */
export function deriveJobStatus(input: {
  agent_id: number | null | undefined;
  hasInspection?: boolean;
  qc?: number | null;
  on_hold?: number | null;
  is_deleted?: number | null;
}): WorkflowStatus {
  return deriveWorkflowStatus(input);
}

export const WORKFLOW_STEPS: Array<{
  key: Exclude<WorkflowStatus, "hold" | "cancelled">;
  label: string;
  href: string;
}> = [
  { key: "fresh", label: "Fresh Case", href: "/jobs/fresh" },
  { key: "assigned", label: "Assign Case", href: "/jobs/schedule" },
  { key: "qc_pending", label: "Quality Check", href: "/jobs/qc" },
  { key: "completed", label: "Completed", href: "/jobs/complete" },
];

export function parseJobDate(input: string): Date {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(input)) return new Date(`${input}T00:00:00`);

  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = input.match(dmy);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  }

  const fallback = new Date(input);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error("Invalid date");
  }
  return fallback;
}

/** Format desk-arrival date for workflow listings. */
export function formatDeskDate(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function resolveFinYear(db: {
  fin_year: {
    findFirst: (args: {
      orderBy: { id: "desc" };
    }) => Promise<{ fsession: string } | null>;
  };
}): Promise<string> {
  try {
    const row = await db.fin_year.findFirst({ orderBy: { id: "desc" } });
    if (row?.fsession) return row.fsession;
  } catch {
    // table may be empty
  }
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  }
  return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
}

export const CONDITION_FIELDS_2W = [
  "helmetbox",
  "laggage_carrier",
  "stepney",
  "leggaurd",
  "saree_gaurd",
  "fron_left_ind_light",
  "fron_right_ind_light",
  "front_mudgaurd",
  "front_hub_disc_drum",
  "front_wheel_rim",
  "from_shock_absorber",
  "speedometer_tachometer",
  "lever_clutch_hand_break",
  "chassis_frame",
  "crankCase_cylinder",
  "head_lamp_rim",
  "silencer",
  "chain_cover",
  "fork",
  "fairing",
  "fuel_tank",
  "kick_padal",
  "handel_bar",
  "rear_wheel_rim",
  "rear_shock_absorber",
  "rear_drum_disc",
  "rear_left_indicator_light",
  "rear_right_indicator_light",
  "rear_view_mirror_lt",
  "rear_view_mirror_rt",
  "rear_foot_rest",
  "rear_mudguard",
  "left_cover_shield",
  "right_cover_shield",
  "wisor",
  "tail_lamp",
  "tyres_front",
  "leg_side_right",
  "leg_shield_left",
  "rear_cowl_left_centre_right",
  "stepney_bracket",
] as const;

export const CONDITION_FIELDS_4W = [
  "front_bumper",
  "indicator_light_lt",
  "front_panel",
  "dicky",
  "grill",
  "indicator_light_rt",
  "bonnet",
  "reat_bumper",
  "head_lamp_lt",
  "fog_lamp_lt",
  "left_apron",
  "tail_lamp_lt",
  "head_lamp_rt",
  "fog_lamp_rt",
  "right_apron",
  "tail_lamp_rt",
  "lt_frontfender",
  "lt_pillar_door_a",
  "lt_frontdoor",
  "lt_pillar_center_b",
  "lt_reardoor",
  "lt_pillar_door_c",
  "lt_runningboard",
  "lt_qtr_panel",
  "rt_qtr_panel",
  "rt_pillar_door_b",
  "floor_silencer",
  "rt_rear_door",
  "rt_rear_pillar_c",
  "rear_view_mirror_lt",
  "rt_front_door",
  "rt_running_board",
  "rear_view_mirror_rt",
  "rt_front_pillar_a",
  "rt_front_fender",
  "tyres",
  "back_glass",
  "rim",
  "front_ws_glass_laminate",
  "rr_door_glass",
  "lr_door_glass",
  "under_carriage",
  "rf_door_glass",
  "lf_door_glass",
] as const;

export const CONDITION_FIELDS_3W = [
  "cowl",
  "cabin",
  "front_excavator",
  "boom",
  "chassis_frame",
  "stepney",
  "left_mudguard",
  "grill",
  "front_body",
  "bonnet",
  "ac",
  "fuel_tank",
  "head_light",
  "right_mudguard",
  "dashboard",
  "right_body",
  "cran_bucket",
  "fans",
  "seats",
  "indicator_light",
  "cabin_lt_door",
  "crane_hook",
  "hydraulic_system",
  "tyres",
  "rear_body",
  "bumper",
  "cabin_rt_door",
  "left_body",
  "ws_glasses",
  "excavator_cabin_glass",
  "left_window_glass",
  "crane_cabin_glass",
  "right_window_glasses",
  "rear_view_body",
  "back_glass",
  "tail_lamp",
  "extra_fittings",
] as const;

export function conditionFieldsFor(kind: WheelKind): readonly string[] {
  if (kind === "2wheeler") return CONDITION_FIELDS_2W;
  if (kind === "3wheeler") return CONDITION_FIELDS_3W;
  return CONDITION_FIELDS_4W;
}

export const CONDITION_OPTIONS = ["Safe", "Not Safe", "N/A"] as const;
