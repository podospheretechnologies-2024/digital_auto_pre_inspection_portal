import { displayValue, escapeHtml } from "./escape";
import type {
  PdfDocumentData,
  PdfField,
  PdfFieldValue,
  PdfSection,
} from "./types";

const LOGO_URL =
  process.env.PDF_LOGO_URL ??
  "https://digitalauto.in/public/demo1/media/logos/digital_auto_logo.jpg";
const STAMP_URL =
  process.env.PDF_STAMP_URL ??
  "https://digitalauto.in/public/digital_auto_stamp.png";
const SIGNATORY_URL =
  process.env.PDF_SIGNATORY_URL ??
  "https://digitalauto.in/public/AuthorizedSignatory.png";

export const PDF_BASE_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: "Gill Sans", "Segoe UI", sans-serif;
    font-size: 10px;
    color: #111;
    margin: 0;
    padding: 8px;
  }
  .bld { font-weight: bold; }
  .section-title {
    color: #5a88c0;
    padding-left: 12px;
    margin: 6px 0 2px;
    font-size: 12px;
  }
  .section-title .ownership { float: right; color: red; font-weight: bold; }
  .banner {
    width: 100%;
    padding: 7px 12px;
    background: #5a88c0;
    color: #fff;
    font-weight: bold;
    font-size: 12px;
  }
  .banner td { color: #fff; }
  .sub-banner {
    background: #5a88c0;
    color: #fff;
    font-weight: bold;
    padding: 4px;
    border: 1px solid grey;
  }
  table.grid { width: 100%; border-collapse: collapse; margin: 0 0 2px; padding: 0 12px; }
  table.grid td {
    border: 1px solid grey;
    padding: 4px;
    vertical-align: top;
    width: 25%;
  }
  table.grid.cols-3 td { width: 33.33%; }
  table.grid.cols-2 td { width: 50%; }
  table.grid td.full { width: 100%; }
  .price-red { color: red; font-size: 14px; text-decoration: underline; }
  .header-table { width: 100%; margin-bottom: 6px; }
  .company-name { font-size: 18px; color: #e72128; font-weight: bold; }
  .company-meta { font-size: 11px; }
  .page {
    border: 0.5px solid black;
    padding-bottom: 8px;
    page-break-after: always;
    position: relative;
    min-height: 90vh;
  }
  .page:last-child { page-break-after: auto; }
  /* Blade twoPDF: 2-column float photo grid */
  .photo-grid {
    width: 100%;
    border-collapse: collapse;
    padding: 0 12px;
  }
  .photo-grid td {
    width: 50%;
    vertical-align: top;
    padding: 4px 6px;
    border: none;
  }
  .photo-grid img {
    width: 90%;
    height: 200px;
    object-fit: contain;
    border: 1px solid grey;
    border-radius: 5px;
    padding: 3px;
  }
  .photo-caption {
    display: block;
    padding-left: 3px;
    margin: 2px 0 8px;
    clear: both;
  }
  .chassis-photo { width: 96%; height: 160px; object-fit: contain; }
  .declaration {
    width: 98%;
    margin: 20px auto;
    padding: 12px;
    border: 1px solid grey;
    background: #f2f2f2;
  }
  .declaration h3 { text-align: center; margin: 0 0 8px; font-size: 16px; }
  .declaration ul { font-size: 12px; margin: 0; padding-left: 20px; }
  .declaration li { margin-bottom: 4px; }
  footer.stamp {
    text-align: right;
    padding: 8px 12px;
  }
  footer.stamp img { height: 100px; width: 100px; }
  .surveyor { padding-left: 12px; }
  .signatory { float: right; text-align: center; padding-right: 20px; }
  .signatory img { width: 200px; height: 50px; }
  .vehicle-label { text-align: right; font-size: 14px; font-weight: bold; }
`;

export function renderHeader(data: PdfDocumentData): string {
  const p = data.printdata;
  return `
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:30%; text-align:left;">
          <img src="${escapeHtml(LOGO_URL)}" style="width:220px; height:88px;" alt="Digital Auto" />
        </td>
        <td style="width:70%; text-align:center;">
          <div class="company-name">Digital Auto Technical Pvt. Ltd.</div>
          <div class="company-meta">
            Address : 229 IInd floor Ganapti Plaza, M I road, Jaipur Rajasthan, 302001<br/>
            Email ID : customercare@digitalauto.in
          </div>
        </td>
      </tr>
    </table>
    <table class="banner" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:30%; text-align:left;">
          Insurer Ref No. ${escapeHtml(displayValue(data.insurerRefNo ?? p.insurer_ref_no))}
        </td>
        <td style="width:40%; text-align:center;">
          ${escapeHtml(data.reportTitle)}
          ${data.subtitle ? `<br/><span style="font-size:10px;">${escapeHtml(data.subtitle)}</span>` : ""}
        </td>
        <td style="width:30%; text-align:right;">
          Ref No. ${escapeHtml(displayValue(data.dtiNo ?? p.dti_no))}
        </td>
      </tr>
    </table>
  `;
}

function renderFieldCell(f: PdfField, cols: number): string {
  const valueHtml = f.html
    ? f.value == null || f.value === ""
      ? "—"
      : String(f.value)
    : escapeHtml(f.value !== undefined ? displayValue(f.value) : "—");
  const span =
    f.colSpan ?? (f.fullWidth ? cols : undefined);
  const style =
    f.fullWidth || (span != null && span >= cols)
      ? ` class="full" colspan="${span ?? cols}"`
      : span != null && span > 1
        ? ` colspan="${span}"`
        : "";
  const labelPart = f.label
    ? `<span class="bld">${escapeHtml(f.label)}</span>: `
    : "";
  return `<td${style}>${labelPart}${valueHtml}</td>`;
}

/**
 * Pack fields into rows honouring colSpan (Blade half-width DOT / status rows).
 */
function packFieldRows(fields: PdfField[], cols: number): string[] {
  const rows: string[] = [];
  let row: string[] = [];
  let used = 0;

  const flush = () => {
    if (!row.length) return;
    while (used < cols) {
      row.push("<td></td>");
      used += 1;
    }
    rows.push(`<tr>${row.join("")}</tr>`);
    row = [];
    used = 0;
  };

  for (const f of fields) {
    const span = Math.min(
      f.colSpan ?? (f.fullWidth ? cols : 1),
      cols,
    );
    if (used + span > cols) flush();
    row.push(renderFieldCell(f, cols));
    used += span;
    if (used >= cols) flush();
  }
  flush();
  return rows;
}

export function renderSection(section: PdfSection): string {
  if (section.titleOnly) {
    const ownership = section.fields.find((f) => f.key === "ownership_name");
    const ownHtml = ownership
      ? `<span class="ownership">Ownership : ${escapeHtml(displayValue(ownership.value))}</span>`
      : "";
    return `<h5 class="section-title">${escapeHtml(section.heading)}${ownHtml}</h5>`;
  }

  const cols = section.columns ?? 4;
  const bannerRow = section.banner
    ? `<tr><td class="sub-banner" colspan="${cols}">${escapeHtml(section.heading)}</td></tr>`
    : "";

  const rows = packFieldRows(section.fields, cols);

  const title =
    section.banner || !section.heading
      ? ""
      : `<h5 class="section-title">${escapeHtml(section.heading)}</h5>`;

  return `
    ${title}
    <table class="grid cols-${cols}" cellpadding="0" cellspacing="0">
      ${bannerRow}
      ${rows.join("")}
    </table>
  `;
}

/** Blade-style 2-column gallery with vehicle no. under each completed pair. */
export function renderImages(data: PdfDocumentData): string {
  const images = data.images?.length
    ? data.images
    : data.firstImage
      ? [data.firstImage]
      : [];
  if (!images.length) {
    return `<p class="surveyor">Surveyor Name : ${escapeHtml(displayValue(data.printdata.fname))} ${escapeHtml(displayValue(data.printdata.lname))}</p>`;
  }

  const p = data.printdata;
  const vehicleno = escapeHtml(displayValue(p.vehicleno));
  const cells: string[] = [];

  for (let i = 0; i < images.length; i += 2) {
    const left = images[i];
    const right = images[i + 1];
    cells.push(`
      <tr>
        <td><img src="${escapeHtml(left.url)}" alt="${escapeHtml(left.caption ?? "photo")}" /></td>
        <td>${
          right
            ? `<img src="${escapeHtml(right.url)}" alt="${escapeHtml(right.caption ?? "photo")}" />`
            : ""
        }</td>
      </tr>
      ${
        right
          ? `<tr><td colspan="2"><span class="photo-caption">${vehicleno}</span></td></tr>`
          : ""
      }
    `);
  }

  return `
    <table class="photo-grid" cellpadding="0" cellspacing="0">
      ${cells.join("")}
    </table>
    <p class="surveyor">Surveyor Name : ${escapeHtml(displayValue(p.fname))} ${escapeHtml(displayValue(p.lname))}</p>
  `;
}

export function renderPhotosPage(data: PdfDocumentData): string {
  const p = data.printdata;
  const label = [p.company, p.model, p.variant].filter(Boolean).join(" ");
  return `
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:30%;">
          <img src="${escapeHtml(LOGO_URL)}" style="width:220px; height:88px;" alt="Digital Auto" />
        </td>
        <td class="vehicle-label" style="width:70%;">${escapeHtml(label || "—")}</td>
      </tr>
    </table>
    ${renderImages(data)}
  `;
}

export function renderDeclarationPage(data: PdfDocumentData): string {
  const p = data.printdata;
  const label = [p.company, p.model, p.variant].filter(Boolean).join(" ");
  return `
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:30%;">
          <img src="${escapeHtml(LOGO_URL)}" style="width:220px; height:88px;" alt="Digital Auto" />
        </td>
        <td class="vehicle-label" style="width:70%;">${escapeHtml(label || "—")}</td>
      </tr>
    </table>
    <div class="declaration">
      <h3>DECLARATION</h3>
      <ul>
        <li>I/We hereby confirm that the vehicle has been inspected in presence of me/my/our representative.</li>
        <li>I/We hereby confirm that the identification details and damages of vehicle as noted / photographs taken by the inspecting officer are correct. Nothing has been hidden/undisclosed.</li>
        <li>I/We agreed that Repair/Replacement of dented/crack parts &amp; Repair Painting of dented/scratched panels as per this inspection photographs shall be excluded in event of any claim lodged during the policy period.</li>
        <li>I hereby certify that I have shown the same vehicle which I have to get insured and if later at the time of claim it is found that vehicle shown and accidental are different then no claim is payable to me.</li>
        <li>I hereby certify that I will not claim for damages existing in my vehicle whether same are mentioned in report or not if same are seen in photograph taken by the inspector.</li>
      </ul>
    </div>
    <span class="surveyor">Surveyor Name : ${escapeHtml(displayValue(p.fname))} ${escapeHtml(displayValue(p.lname))}</span>
    <span class="signatory">
      <img src="${escapeHtml(SIGNATORY_URL)}" alt="Authorized Signatory" /><br/>
      Authorized Signatory
    </span>
    <div style="clear:both;"></div>
  `;
}

export function wrapDocument(pages: string[]): string {
  const body = pages
    .map(
      (inner) => `
    <div class="page">
      ${inner}
      <footer class="stamp"><img src="${escapeHtml(STAMP_URL)}" alt="stamp" /></footer>
    </div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${PDF_BASE_CSS}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}

export function field(
  label: string,
  key: string,
  printdata: PdfDocumentData["printdata"],
  transform?: (v: PdfFieldValue) => string,
  opts?: { html?: boolean; fullWidth?: boolean; colSpan?: number },
): PdfField {
  const raw = printdata[key];
  const value = transform ? transform(raw) : raw;
  return {
    label,
    key,
    value,
    html: opts?.html ?? false,
    fullWidth: opts?.fullWidth,
    colSpan: opts?.colSpan,
  };
}

export function statusField(
  label: string,
  key: string,
  printdata: PdfDocumentData["printdata"],
  transform: (v: PdfFieldValue) => string,
  opts?: { fullWidth?: boolean; colSpan?: number },
): PdfField {
  return field(label, key, printdata, transform, {
    html: true,
    fullWidth: opts?.fullWidth,
    colSpan: opts?.colSpan,
  });
}

/** Status / remarks / video / chassis — appended inside last Blade section. */
export function closingFields(
  data: PdfDocumentData,
  opts?: {
    /** 2W: status sits in the last OTHERS row (3-col). */
    statusInline?: boolean;
    /** 4W: status + remarks side-by-side (colSpan 2). */
    statusRemarksSplit?: boolean;
    columns?: 2 | 3 | 4;
  },
): PdfField[] {
  const p = data.printdata;
  const cols = opts?.columns ?? 3;
  const fields: PdfField[] = [];

  if (opts?.statusRemarksSplit) {
    fields.push(
      field("Inspection Status", "inspection_status", p, undefined, {
        colSpan: 2,
      }),
      field("Remarks", "remarks", p, undefined, { colSpan: 2 }),
    );
  } else if (opts?.statusInline) {
    fields.push(field("Inspection Status", "inspection_status", p));
    fields.push(
      field("Remarks", "remarks", p, undefined, { fullWidth: true }),
    );
  } else {
    fields.push(
      field("Inspection Status", "inspection_status", p, undefined, {
        fullWidth: true,
      }),
      field("Remarks", "remarks", p, undefined, { fullWidth: true }),
    );
  }

  if (p.video_url || p.video) {
    const href = escapeHtml(String(p.video_url ?? ""));
    fields.push({
      label: "Video Link",
      key: "video",
      html: true,
      fullWidth: true,
      colSpan: cols,
      value: href
        ? `<a target="_blank" href="${href}">Click here to play video</a>`
        : "—",
    });
  }

  if (p.chassisphoto_url || p.chassisphoto) {
    const src = escapeHtml(
      String(p.chassisphoto_url ?? p.chassisphoto ?? ""),
    );
    fields.push({
      label: "",
      key: "chassisphoto",
      html: true,
      fullWidth: true,
      colSpan: cols,
      value: src
        ? `<img class="chassis-photo" src="${src}" alt="chassis" />`
        : "—",
    });
  }

  return fields;
}
