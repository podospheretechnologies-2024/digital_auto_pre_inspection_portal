/** Shared string normalization for VRN / mobile params (Laravel helpers). */

export function normalizeRegn(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase().trim();
}

export function normalizeMobile(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

/** Coerce nested arrays from upstream JSON to null (Laravel `is_array(...) ? null`). */
export function scalarOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return null;
  if (typeof value === "object") return null;
  return String(value);
}
