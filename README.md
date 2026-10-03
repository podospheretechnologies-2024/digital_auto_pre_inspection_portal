# DigitalAuto Next

Full-stack migration target for **DigitalAutoWeb** (Laravel 8 + Metronic).

**Scope: Pre-Inspection modules + shared platform (auth, masters, surveyor/staff/account).**

**This is a separate folder** from the Laravel app: `d:\sarthak\digitalauto-next`

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Auth.js (next-auth)** — credentials against existing `users` table
- **Prisma** (MySQL — same DB as Laravel during strangler migration)
- **TanStack Query / Table**, **react-hook-form**, **Zod**
- **Puppeteer** — Pre-Inspection PDFs (Phase 6)
- **S3 / MinIO** — PI image + PDF storage (Phase 6)
- **BullMQ + Redis** — PI background workers (Phase 7)

## Progress

**Last updated:** 2026-09-21 · Plan: Cursor `stack_migration_plan_f85b0195.plan.md`

| Phase | Status |
|-------|--------|
| 0 Scaffold | **Done** — [docs/MIGRATION_INVENTORY.md](docs/MIGRATION_INVENTORY.md) |
| 1 Auth / RBAC | **Done** |
| 2 Masters CRUD | **Done** |
| 3 Account (shared) | **Done** — settings, bank users, **surveyors**, **staff**, **staff permissions** |
| 4 External API (PI) | **Done** — [docs/PHASE4_API_MAPPING.md](docs/PHASE4_API_MAPPING.md) |
| 5 Pre-Inspection jobs | **Done (usable cutover)** — image delete + media upload |
| 6 PI PDF + file storage | **Done** — [docs/PHASE6_PDF.md](docs/PHASE6_PDF.md) |
| 7 PI BullMQ workers | **Done** — vahan-import, optional RC batch, SMS |
| 8 Partial decommission | **Ready** — [docs/DECOMMISSION_CHECKLIST.md](docs/DECOMMISSION_CHECKLIST.md); execute after traffic audit |

**Also:** forgot/reset password (`/forgot-password`, `/reset-password`) with optional SMTP reset email (`SMTP_HOST` + `MAIL_FROM`; link base `APP_URL` / `NEXTAUTH_URL` / `AUTH_URL`), **public Surveyor register** (`/register` → `verified_at` null until HO approve), activity log (`/logs/activity`), presence ping (`/api/v2/account/last-activity`). Without SMTP, the API still returns ok and can echo the token when `ALLOW_RESET_TOKEN_ECHO=true`.

Guide + strangler: **[docs/MIGRATION.md](docs/MIGRATION.md)** · Nginx: **[deploy/nginx-strangler.conf.example](deploy/nginx-strangler.conf.example)**

## Quick start

```bash
cd d:\sarthak\digitalauto-next
cp .env.example .env
# Set DATABASE_URL + AUTH_SECRET (match Laravel MySQL)

npm install
npm run db:pull      # introspect full schema from existing DB
npm run db:generate
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) — demo login: `demo@demo.com` / `demo`  
Laravel (legacy FI/Valuation): [http://127.0.0.1:8000](http://127.0.0.1:8000) — same creds

### Redis + optional MinIO

```bash
docker compose up -d redis
# Optional local object storage:
docker compose --profile storage up -d minio
```

### Background worker (Phase 7)

Run Redis **and** the worker process alongside the Next app. Assign SMS is enqueued from the API into BullMQ; without the worker, jobs sit in Redis until a worker picks them up.

```bash
# 1) Redis
docker compose up -d redis

# 2) .env (see .env.example)
#    Required: REDIS_URL, DATABASE_URL, DIGITAL_DEKHO_API_KEY
#    SMS stub (default): SMS_ENABLED=false
#    Live SMS:          SMS_ENABLED=true + SMS_AUTH_KEY=<yourbulksms key>
#    Optional:          SMS_DLT_TE_ID, SMS_TIMEOUT_MS=15000, SMS_FORMAT_JSON=true
#    Optional RC batch: WORKER_ENABLE_RC_BATCH=true

# 3) Worker (separate terminal from `npm run dev`)
npm run worker
```

What the worker does:

1. Pings Redis and registers schedulers
2. **`vahan-import`** — Laravel `cron:ImportVahanHistoryData` every **5 minutes**
3. **`rc-batch`** — listens always; schedules ARC…RC2 only if `WORKER_ENABLE_RC_BATCH=true`
4. **`sms-notify`** — on-demand jobs from assign / create-with-agent / first inspection save
5. Logs `active` / `completed` / `failed` (with stack) / `stalled` per queue

Keep `npm run dev` (or `start`) running separately for the web app. If Redis is down, assign still succeeds (SMS enqueue is best-effort).

## Phase 6 — Pre-Inspection PDF & storage

| Piece | Location |
|-------|----------|
| Templates | `twoPDF`, `threePDF`, `fourPDF` only |
| Data loader | `src/lib/pdf/load-data.ts` (Prisma ↔ Laravel PDFController joins) |
| Service | `src/lib/services/pdf.ts` |
| HTML builders | `src/lib/pdf/` |
| Storage | `src/lib/services/files.ts` (S3/MinIO or `LOCAL_UPLOAD_DIR`) |
| API | `GET /api/v2/pdf/2w\|3w\|4w` · `POST /api/v2/files/upload` |
| Tools UI | `/tools/pdf` |
| Docs | **[docs/PHASE6_PDF.md](docs/PHASE6_PDF.md)** |

**Out of scope:** valuation PDFs, office/FI print.

```text
# Real inspection (tbl_*wheeler.id) — Phase 5 complete/reports use this
GET /api/v2/pdf/2w?id=123
GET /api/v2/pdf/4w?jobId=456
# Sample smoke test
GET /api/v2/pdf/2w?sample=1
# HTML preview / store to S3
?format=html   ?store=1
```

UI helper: `pdfPathForInspection(vehicle_type, inspectionId)` in `src/lib/jobs/helpers.ts`.

## Phase 7 — Workers

| Laravel | BullMQ |
|---------|--------|
| `cron:ImportVahanHistoryData` (active in Kernel) | `vahan-import` every 5m |
| `cron:ARC` … `RC2` (commented) | `rc-batch` if `WORKER_ENABLE_RC_BATCH=true` |
| `assignupdate_agent` yourbulksms | `sms-notify` (`pi-assign`) from assign API |
| Inspect submit yourbulksms | `sms-notify` (`pi-case-submitted`) from first save |
| `ImportHistoryOf*` / VRN↔mobile | **Out of scope** (commented / not PI cutover) |

| Env | Purpose |
|-----|---------|
| `REDIS_URL` | BullMQ connection (default `redis://127.0.0.1:6379`) |
| `SMS_ENABLED` | `true` to call YourBulkSMS; else stub/log |
| `SMS_AUTH_KEY` | Provider auth key (**required** when enabled — live jobs fail without it) |
| `SMS_API_URL` / `SMS_SENDER` / `SMS_ROUTE` / `SMS_COUNTRY` | Provider defaults match Laravel |
| `SMS_DLT_TE_ID` | Optional DLT template id (`DLT_TE_ID` query param) |
| `SMS_TIMEOUT_MS` | Live HTTP timeout (default `15000`) |
| `SMS_FORMAT_JSON` | Default `true` — request JSON responses for clearer errors; set `false` for plain text |
| `WORKER_ENABLE_RC_BATCH` | Optional letter-prefix RC pull schedulers |
| `DIGITAL_DEKHO_API_KEY` | Vahan history import |
| `IDFY_API_KEY` / `IDFY_ACCOUNT_ID` / `IDFY_BASE_URL` | Optional IDfy plus/basic; mask write-back after Vahan |
| `IDFY_POLL_DELAY_MS` | Optional override of Laravel sleep before IDfy poll |

Live SMS notes:

- Worker boot logs readiness (`SMS: live → …` or the misconfig warning).
- Failed live sends throw so BullMQ retries; stub mode never throws.
- Auth key is never logged (URLs are redacted).

Code: `src/workers/` · enqueue: `src/lib/jobs/enqueue-sms.ts` · SMS client: `src/lib/integrations/sms.ts`  
Tools UI: `/tools/workers`

## Key routes

| URL | Purpose |
|-----|---------|
| `/` | Landing |
| `/login` | Auth.js credentials login |
| `/register` | Public Surveyor self-register (`verified_at` null → HO approve) |
| `/dashboard` | Protected admin dashboard |
| `/masters/banks` | Masters UI |
| `/tools/pdf` | PI PDF template list |
| `/tools/workers` | Worker / cron docs |
| `/jobs` | Pre-Inspection hub + search |
| `/jobs/assign` | Create intimation + assign agent |
| `/jobs/fresh` | Unassigned cases |
| `/jobs/schedule` | Assigned, not inspected |
| `/jobs/pending` | Surveyor pending list |
| `/jobs/inspect/[id]` | 2W/3W/4W inspect (`?mode=edit\|view`, `?skip_qc=1`) + media |
| `/jobs/qc` | QC queue + submit + PDF |
| `/jobs/complete` | QC-complete cases + PDF |
| `/jobs/reports` | Global PI search + PDF |
| `/api/v2/jobs` | List/create jobs |
| `/api/v2/jobs/[id]` | Get/update/delete |
| `/api/v2/jobs/[id]/assign` | Assign agent (+ SMS enqueue) |
| `/api/v2/jobs/inspections` | Load/save inspection (+ photos/media) |
| `/api/v2/jobs/qc` | QC list/submit |
| `/api/v2/jobs/reports` | PI report search |
| `/api/health` | Health check + DB status |
| `/api/vehicle-rc` | PI: RC lookup (`rc_api_users` token) |
| `/api/vehicle-info` | PI: RC + history |
| `/api/store-vahan-data` | Vahan scraper → `rc_details` |
| `/api/v2/pdf/{2w\|3w\|4w}` | Pre-Inspection PDF (`?inspectionId=` / `?jobId=` / `?sample=1`) |
| `/api/v2/files/upload` | PI file upload (S3 or LOCAL_UPLOAD_DIR) |

## Project layout (Phases 4–7)

```
src/
├── app/api/
│   ├── vehicle-rc|vehicle-info|store-vahan-*|update_rc_*|delete_rc_history_data
│   └── legacy/              # aliases for strangler
├── lib/
│   ├── integrations/        # Vahan, IDfy, SMS, PI handlers
│   ├── pdf/                 # PI HTML templates + Puppeteer render
│   ├── services/
│   │   ├── pdf.ts / files.ts / vahan-history-import.ts / rc-batch.ts
│   │   └── sms-notify.ts    # assign + case-submitted payloads
│   └── jobs/
│       ├── queue-names.ts
│       ├── enqueue-sms.ts   # best-effort BullMQ add from API
│       └── scheduler.ts     # cron catalog for /tools/workers
└── workers/
    ├── index.ts             # entry: npm run worker
    ├── register-schedules.ts
    └── processors/          # vahan-import, rc-batch, sms-notify
```

Docs: **[docs/PHASE4_API_MAPPING.md](docs/PHASE4_API_MAPPING.md)** — Laravel → Next external API map.

## Verify

```bash
npm run typecheck
npm run lint
```

## Migration plan

Laravel stays at `../DigitalAutoWeb` for **FI + Valuation**. This app migrates **Pre-Inspection** module by module.
