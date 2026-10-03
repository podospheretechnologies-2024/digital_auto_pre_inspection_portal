import type { PdfFieldValue } from "./types";

export function escapeHtml(value: PdfFieldValue): string {
  const raw = value == null ? "" : String(value);
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function displayValue(value: PdfFieldValue): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Laravel `printVehicleStatus` — Safe/Good/Average/No plain; others in red.
 * Returns safe HTML (status text is escaped).
 */
export function printVehicleStatus(value: PdfFieldValue): string {
  if (value == null || value === "") return "—";
  const s = String(value).trim();
  const upper = s.toUpperCase();
  const ok =
    upper === "NO" ||
    upper === "SAFE" ||
    upper === "GOOD" ||
    upper === "AVERAGE" ||
    upper === "OK" ||
    upper === "YES" ||
    upper === "N/A" ||
    s === "1";
  if (ok) return escapeHtml(s === "1" ? "OK" : s);
  if (s === "0") return escapeHtml("No");
  return `<span style="color:red">${escapeHtml(s)}</span>`;
}

export function formatDate(value: PdfFieldValue): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(value: PdfFieldValue): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}
