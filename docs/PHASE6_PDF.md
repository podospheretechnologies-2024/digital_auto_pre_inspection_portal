# Phase 6 — Pre-Inspection PDF & files

Pre-Inspection only (`twoPDF` / `threePDF` / `fourPDF`). Valuation and FI/office PDFs stay on Laravel.

## Endpoints

### Download / preview PDF

```
GET /api/v2/pdf/{2w|3w|4w}
```

| Query | Meaning |
|-------|---------|
| `inspectionId` or `id` | `tbl_2wheeler` / `tbl_3wheeler` / `tbl_4wheeler` primary key (Laravel PDFController `$id`) |
| `jobId` | `tbl_jobs.id` — uses the latest inspection row for that job |
| `sample=1` | Smoke-test sample payload (also the default when no ids are passed) |
| `format=html` | Return HTML instead of PDF (Puppeteer input preview) |
| `store=1` | Upload PDF to S3/MinIO (or local) and return JSON `{ stored: { key, url } }` |

Auth: session cookie (same Auth.js session as the admin UI).

### Upload files

```
POST /api/v2/files/upload
Content-Type: multipart/form-data
file=<binary>
folder=upload_images   # default; or pdfs
```

## How Phase 5 UI should call PDFs

Use the helper already in `src/lib/jobs/helpers.ts`:

```ts
import { pdfPathForInspection } from "@/lib/jobs/helpers";

// Complete / reports rows: `row.id` is the inspection id, `row.vehicle_type` is WheelKind
<a href={pdfPathForInspection(row.vehicle_type, row.id)}>PDF</a>

// Optional HTML preview
pdfPathForInspection("2wheeler", 123, { format: "html" })
// → /api/v2/pdf/2w?id=123&format=html

// By job (when you only have tbl_jobs.id)
`/api/v2/pdf/2w?jobId=${jobId}`
```

Or `buildPiPdfUrl` from `@/lib/services/pdf` (same shape, uses `inspectionId=`).

**Already wired:** `/jobs/complete` and `/jobs/reports` PDF buttons.

Laravel mapping:

| Laravel | Next |
|---------|------|
| `GET /twowheelerview/{id}` | `GET /api/v2/pdf/2w?id={id}` |
| `GET /threewheelerview/{id}` | `GET /api/v2/pdf/3w?id={id}` |
| `GET /fourwheelerview/{id}` | `GET /api/v2/pdf/4w?id={id}` |

## Data loader

`src/lib/pdf/load-data.ts` joins:

- `tbl_{2\|3\|4}wheeler` + `tbl_jobs`
- `m_company` / `m_model` / `m_variant` / `m_bank` / `users` (agent)
- gallery: `tbl_{2\|3\|4}wheeler_images`
- photo URLs via `LEGACY_APP_URL/public/upload_images/…` or S3

## Storage

| Mode | Env |
|------|-----|
| S3 / MinIO (preferred) | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| Local Laravel parity | `LOCAL_UPLOAD_DIR=d:\sarthak\DigitalAutoWeb\public` — writes `upload_images/…` under that folder |

PDF HTML resolves legacy filenames with `LEGACY_APP_URL` when S3 is unavailable.

## Smoke tests

1. Sample: `GET /api/v2/pdf/2w?sample=1` (or `/tools/pdf`)
2. Real row: `GET /api/v2/pdf/2w?id=<tbl_2wheeler.id>`
3. HTML: add `&format=html`
4. By job: `GET /api/v2/pdf/4w?jobId=<tbl_jobs.id>`

## Blade structural parity (PI)

Next templates mirror Laravel `twoPDF` / `threePDF` / `fourPDF` page flow:

1. **Page 1** — logo + blue banner → case table (no CASE DETAILS h5) → VEHICLE DETAILS (+ ownership) → accessories / inspection banners → status/remarks/video/chassis **inside** the last section  
2. **Page 2** — logo + make/model/variant → **2-column** photo grid with vehicle no. under each pair → surveyor name  
3. **Page 3** — declaration box + surveyor + authorized signatory  
4. Stamp footer on every page (Blade fixed footer parity)

Section titles match Blade (`BODY PARTS`, `Glasses`, `GLASS/OTHERS`, `VEHICLE ELECTRICAL& NON-ELECTRICAL ACCESSORIES`). Pixel-perfect CSS is not required.

## Out of scope

Valuation PDFs, office/FI print. Phase 8 cutover: [PHASE8_RUNBOOK.md](./PHASE8_RUNBOOK.md).
