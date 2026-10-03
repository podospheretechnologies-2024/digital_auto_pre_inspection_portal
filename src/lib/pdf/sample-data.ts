import type { PdfDocumentData, PdfTemplateId } from "./types";

/** Sample PI payload for smoke-testing without DB (Phase 5 data loader pending). */
export function buildSamplePdfData(
  templateId: PdfTemplateId,
): PdfDocumentData {
  const reportTitles: Record<PdfTemplateId, string> = {
    twoPDF: "2-WHEELER PRE INSPECTION REPORT",
    threePDF: "3-WHEELER PRE INSPECTION REPORT",
    fourPDF: "4-WHEELER PRE INSPECTION REPORT",
  };

  const printdata = {
    proposer: "Sample Proposer",
    insurer_broker: "Sample Insurer",
    insurer_ref_no: "INS-REF-001",
    valuation_price: 0,
    fname: "Ravi",
    lname: "Sharma",
    created_at: new Date().toISOString(),
    ctime: "10:30",
    request_date: new Date().toISOString(),
    inspection_place: "Jaipur",
    inspection_type: "Physical",
    inspection_case: "No",
    vehicleno: "RJ14AB1234",
    chassisno: "CHS123456789",
    engineno: "ENG987654321",
    company: "Honda",
    model: "Activa",
    variant: "6G",
    year_of_manufacture: "2022",
    odometer_reading: "12450",
    rc_verified: "Yes",
    ownership_name: "First Owner",
    bankname: "Sample Bank",
    bank_ref_no: "BR-1001",
    dti_no: "DTI/2025-26/001",
    colour: "Silver",
    helmetbox: "Yes",
    laggage_carrier: "No",
    stepney: "Yes",
    stepney_bracket: "1",
    leggaurd: "1",
    saree_gaurd: "1",
    music_system: "1",
    tool_kit: "1",
    jack: "1",
    cng_lpg: "0",
    alloy_wheels: "0",
    other_accessories: "None",
    front: "OK",
    rear: "OK",
    left_side: "OK",
    right_side: "OK",
    roof: "OK",
    bonnet: "OK",
    boot: "OK",
    bumper_front: "OK",
    bumper_rear: "OK",
    head_light: "OK",
    tail_light: "OK",
    remarks: "Sample Pre-Inspection — Phase 6 PDF smoke test",
    inspection_status: "Recommended",
    fron_left_ind_light: "SAFE",
    fron_right_ind_light: "Dent",
    front_mudgaurd: "OK",
    cowl: "SAFE",
    cabin: "GOOD",
    front_bumper: "SAFE",
    indicator_light_lt: "SAFE",
    market_value: "85000",
    extra_fittings: "None",
    ins_broker_name: "Broker Agent",
    stereo_make: "Sony",
    fuel_used: "Petrol",
  };

  const logo =
    process.env.PDF_LOGO_URL ??
    "https://digitalauto.in/public/demo1/media/logos/digital_auto_logo.jpg";

  return {
    title: reportTitles[templateId],
    date: new Date().toLocaleDateString("en-IN"),
    reportTitle: reportTitles[templateId],
    insurerRefNo: String(printdata.insurer_ref_no),
    dtiNo: String(printdata.dti_no),
    bankRefNo: String(printdata.bank_ref_no),
    printdata,
    // Two sample slots so photo page exercises the Blade 2-col grid + vehicleno caption
    images: [
      { url: logo, caption: "front" },
      { url: logo, caption: "rear" },
    ],
  };
}
