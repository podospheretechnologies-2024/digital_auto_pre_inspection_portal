export type CaseListFilterState = {
  q: string;
  vehicleType: string;
  bank: string;
  surveyor: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_CASE_FILTERS: CaseListFilterState = {
  q: "",
  vehicleType: "all",
  bank: "all",
  surveyor: "all",
  dateFrom: "",
  dateTo: "",
};

/** Loose row shape shared by workflow case tables */
export type CaseFilterRow = {
  dti_no?: string | null;
  cname?: string | null;
  mobileno?: string | null;
  vehicleno?: string | null;
  bank_ref_no?: string | null;
  bankname?: string | null;
  agent_name?: string | null;
  vehicle_type?: string | null;
  cdate?: string | null;
  created_at?: string | null;
  assigned_at?: string | null;
  hold_at?: string | null;
  cancelled_at?: string | null;
  qc_datetime?: string | null;
  updated_at?: string | null;
  inspection_at?: string | null;
};

export type CaseDateField =
  | "created"
  | "assigned"
  | "hold"
  | "cancelled"
  | "qc"
  | "updated";

function normalizeVehicleType(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/wheeler$/, "wheeler");
}

function rowDate(row: CaseFilterRow, field: CaseDateField): string | null {
  switch (field) {
    case "assigned":
      return row.assigned_at ?? row.created_at ?? row.cdate ?? null;
    case "hold":
      return row.hold_at ?? row.updated_at ?? row.created_at ?? null;
    case "cancelled":
      return row.cancelled_at ?? row.updated_at ?? row.created_at ?? null;
    case "qc":
      return row.qc_datetime ?? row.created_at ?? null;
    case "updated":
      return row.updated_at ?? row.created_at ?? null;
    case "created":
    default:
      return row.created_at ?? row.cdate ?? null;
  }
}

function dayKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return m?.[1] ?? null;
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function uniqueSorted(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .map((v) => String(v ?? "").trim())
        .filter((v) => v.length > 0),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export function filterCaseRows<T extends CaseFilterRow>(
  rows: T[],
  filters: CaseListFilterState,
  dateField: CaseDateField = "created",
): T[] {
  const q = filters.q.trim().toLowerCase();
  const typeNorm =
    filters.vehicleType === "all"
      ? null
      : normalizeVehicleType(filters.vehicleType);

  return rows.filter((row) => {
    if (typeNorm) {
      const rowType = normalizeVehicleType(row.vehicle_type);
      if (!rowType.includes(typeNorm) && typeNorm !== rowType) return false;
    }

    if (filters.bank !== "all") {
      if (String(row.bankname ?? "").trim() !== filters.bank) return false;
    }

    if (filters.surveyor !== "all") {
      if (String(row.agent_name ?? "").trim() !== filters.surveyor) {
        return false;
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      const key = dayKey(rowDate(row, dateField));
      if (!key) return false;
      if (filters.dateFrom && key < filters.dateFrom) return false;
      if (filters.dateTo && key > filters.dateTo) return false;
    }

    if (!q) return true;

    const hay = [
      row.dti_no,
      row.cname,
      row.mobileno,
      row.vehicleno,
      row.bank_ref_no,
      row.bankname,
      row.agent_name,
      row.vehicle_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

export function caseFiltersActive(filters: CaseListFilterState) {
  return (
    filters.q.trim() !== "" ||
    filters.vehicleType !== "all" ||
    filters.bank !== "all" ||
    filters.surveyor !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== ""
  );
}
