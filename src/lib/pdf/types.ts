/**
 * Pre-Inspection PDF templates only (Phase 6).
 * Out of scope: valuation_* / office_print / FI.
 */

export type VehiclePdfType = "2w" | "3w" | "4w";

export type PdfKind = "inspection";

/** Laravel PI PDF views: twoPDF / threePDF / fourPDF */
export type PdfTemplateId = "twoPDF" | "threePDF" | "fourPDF";

export type PdfFieldValue = string | number | boolean | null | undefined;

export type PdfPrintData = Record<string, PdfFieldValue>;

export type PdfImage = {
  url: string;
  caption?: string;
};

export type PdfDocumentData = {
  title?: string;
  date?: string;
  reportTitle: string;
  subtitle?: string;
  insurerRefNo?: string;
  dtiNo?: string;
  bankRefNo?: string;
  printdata: PdfPrintData;
  images?: PdfImage[];
  firstImage?: PdfImage | null;
  sections?: PdfSection[];
};

export type PdfField = {
  label: string;
  key: string;
  value?: PdfFieldValue;
  /** Value already contains safe HTML (e.g. printVehicleStatus). */
  html?: boolean;
  /** Span full row when rendering. */
  fullWidth?: boolean;
  /** Optional colspan (Blade half-width rows). Defaults to columns when fullWidth. */
  colSpan?: number;
};

export type PdfSection = {
  heading: string;
  /** Blue banner subsection (FRONT / LEFT / …) — no separate h5. */
  banner?: boolean;
  /** Section title only (e.g. INSPECTION DETAILS). */
  titleOnly?: boolean;
  columns?: 2 | 3 | 4;
  fields: PdfField[];
};

export type PdfRenderOptions = {
  format?: "A4";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
};

export type PdfRenderResult = {
  buffer: Buffer;
  contentType: "application/pdf";
  filename: string;
  templateId: PdfTemplateId;
};

export type PdfTemplateMeta = {
  id: PdfTemplateId;
  laravelView: string;
  laravelMethod: string;
  label: string;
  kind: PdfKind;
  vehicleType: VehiclePdfType;
};
