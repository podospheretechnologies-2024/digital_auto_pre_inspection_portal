/**
 * Phase 6 — Pre-Inspection PDF rendering (Puppeteer + HTML).
 *
 * Laravel parity: PDFController twowheelerview / threewheelerview / fourwheelerview
 * (twoPDF, threePDF, fourPDF). Valuation and FI/office PDFs are out of scope.
 */

import {
  loadInspectionPdfData,
  type LoadPdfDataOpts,
  PdfDataNotFoundError,
} from "@/lib/pdf/load-data";
import { htmlToPdf } from "@/lib/pdf/render";
import { buildSamplePdfData } from "@/lib/pdf/sample-data";
import {
  PDF_TEMPLATES,
  isPdfTemplateId,
  renderTemplateHtml,
  resolveTemplateId,
} from "@/lib/pdf/registry";
import type {
  PdfDocumentData,
  PdfRenderResult,
  PdfTemplateId,
  VehiclePdfType,
} from "@/lib/pdf/types";

export type { VehiclePdfType, PdfTemplateId, PdfDocumentData, PdfRenderResult };
export type { LoadPdfDataOpts };
export {
  PDF_TEMPLATES,
  resolveTemplateId,
  isPdfTemplateId,
  PdfDataNotFoundError,
};
export { buildPiPdfUrl, parseVehiclePdfType } from "@/lib/pdf/load-data";

function safeFilename(
  parts: Array<string | number | null | undefined>,
): string {
  const base = parts
    .filter((p) => p != null && String(p).trim() !== "")
    .map((p) => String(p).replace(/[^\w.\-]+/g, "_"))
    .join("_");
  return `${base || "pre_inspection_report"}.pdf`;
}

export class PdfRenderService {
  listTemplates() {
    return PDF_TEMPLATES;
  }

  renderHtml(templateId: PdfTemplateId, data: PdfDocumentData): string {
    return renderTemplateHtml(templateId, data);
  }

  async render(
    templateId: PdfTemplateId,
    data: PdfDocumentData,
  ): Promise<PdfRenderResult> {
    const html = this.renderHtml(templateId, data);
    const buffer = await htmlToPdf(html);
    const p = data.printdata;
    const filename = safeFilename([
      "Inspection_Report",
      p.bank_ref_no != null ? String(p.bank_ref_no) : null,
      p.company != null ? String(p.company) : null,
      p.model != null ? String(p.model) : null,
      p.variant != null ? String(p.variant) : null,
    ]);
    return {
      buffer,
      contentType: "application/pdf",
      filename,
      templateId,
    };
  }

  async renderSample(templateId: PdfTemplateId): Promise<PdfRenderResult> {
    return this.render(templateId, buildSamplePdfData(templateId));
  }

  /**
   * Load real job/inspection rows and render Pre-Inspection PDF.
   */
  async renderFromDb(opts: LoadPdfDataOpts): Promise<PdfRenderResult> {
    const { templateId, data } = await loadInspectionPdfData(opts);
    return this.render(templateId, data);
  }

  /**
   * Render Pre-Inspection PDF for 2w / 3w / 4w.
   * Pass inspectionId/jobId via `fromDb`, or `data`, or sample for smoke tests.
   */
  async renderInspectionPdf(
    type: VehiclePdfType,
    data?: PdfDocumentData,
    opts?: {
      useSample?: boolean;
      inspectionId?: number;
      jobId?: number;
    },
  ): Promise<PdfRenderResult> {
    const templateId = resolveTemplateId(type);
    if (opts?.inspectionId != null || opts?.jobId != null) {
      return this.renderFromDb({
        type,
        inspectionId: opts.inspectionId,
        jobId: opts.jobId,
      });
    }
    if (data) return this.render(templateId, data);
    if (opts?.useSample !== false) return this.renderSample(templateId);
    throw new Error(
      `renderInspectionPdf(${type}): pass inspectionId, jobId, or PdfDocumentData`,
    );
  }
}

export const pdfRenderService = new PdfRenderService();
