import type { PdfDocumentData, PdfTemplateId, PdfTemplateMeta } from "./types";
import {
  renderFourPdf,
  renderThreePdf,
  renderTwoPdf,
} from "./templates";

/** Pre-Inspection templates only (valuation / FI out of scope). */
export const PDF_TEMPLATES: PdfTemplateMeta[] = [
  {
    id: "twoPDF",
    laravelView: "twoPDF",
    laravelMethod: "twowheelerview",
    label: "2W Pre-Inspection",
    kind: "inspection",
    vehicleType: "2w",
  },
  {
    id: "threePDF",
    laravelView: "threePDF",
    laravelMethod: "threewheelerview",
    label: "3W Pre-Inspection",
    kind: "inspection",
    vehicleType: "3w",
  },
  {
    id: "fourPDF",
    laravelView: "fourPDF",
    laravelMethod: "fourwheelerview",
    label: "4W Pre-Inspection",
    kind: "inspection",
    vehicleType: "4w",
  },
];

const RENDERERS: Record<PdfTemplateId, (data: PdfDocumentData) => string> = {
  twoPDF: renderTwoPdf,
  threePDF: renderThreePdf,
  fourPDF: renderFourPdf,
};

export function isPdfTemplateId(value: string): value is PdfTemplateId {
  return value in RENDERERS;
}

export function renderTemplateHtml(
  templateId: PdfTemplateId,
  data: PdfDocumentData,
): string {
  return RENDERERS[templateId](data);
}

export function resolveTemplateId(type: "2w" | "3w" | "4w"): PdfTemplateId {
  if (type === "2w") return "twoPDF";
  if (type === "3w") return "threePDF";
  return "fourPDF";
}
