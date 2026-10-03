# Pre-Inspection Migration Inventory (Phase 0)

**Last updated:** 2026-09-19  
**Scope:** Pre-Inspection + shared platform only. **FI and Valuation stay on Laravel.**  
**Sources:** Laravel `routes/web.php`, `routes/api.php`, `routes/auth.php` · Next `src/app/**`  
**Related:** [PHASE4_API_MAPPING.md](./PHASE4_API_MAPPING.md) · Plan `stack_migration_plan_f85b0195.plan.md`

### Status legend

| Status | Meaning |
|--------|---------|
| **DONE** | Next UI and/or API live for strangler cutover |
| **PARTIAL** | Route exists; stubs or parity gaps remain |
| **TODO** | In scope; not migrated (or UI missing) |
| **OUT** | Explicitly out of scope — leave on Laravel |

---

## 1. In-scope Laravel web routes → Next.js

### 1.1 Auth & session (shared)

| Laravel | Method | Next.js | Status |
|---------|--------|---------|--------|
| `/login` | GET/POST | `/login` + Auth.js credentials | **DONE** |
| `/logout` | POST | Auth.js sign-out | **DONE** |
| `/register` | GET/POST | `/register` + `POST /api/v2/auth/register` | **DONE** (Surveyor, `verified_at` null) |
| `/forgot-password`, `/reset-password/*` | GET/POST | `/forgot-password`, `/reset-password` + `POST|PUT /api/v2/auth/password` (SMTP optional) | **DONE** |
| `/verify-email*`, `/confirm-password` | * | — | **TODO** (low priority) |
| `/auth/redirect/{provider}` | GET | — | **TODO** (Socialite; optional) |
| `/add-agent`, `/edit-agent`, `/update-agent` | POST/GET | — (surveyor CRUD) | **TODO** |
| `/last-activity`, `/last-activity-active` | GET | — | **TODO** (presence ping) |

### 1.2 Dashboard

| Laravel | Method | Next.js | Status |
|---------|--------|---------|--------|
| `/index` (Metronic dashboard; PI cards on `tbl_jobs` / wheelers) | GET | `/dashboard` | **PARTIAL** — PI cards usable; valuation cards must not be ported |

### 1.3 Account / settings / staff (shared platform)

| Laravel | Method | Next.js | Status |
|---------|--------|---------|--------|
| `/account/settings` | GET | `/account/settings` | **DONE** |
| `/account/settings` | PUT | `PUT /api/v2/account/settings` | **DONE** |
| `/account/settings/email` | PUT | `PUT /api/v2/account/settings/email` | **DONE** |
| `/account/settings/password` | PUT | via settings API | **DONE** / **PARTIAL** |
| `/account/agentlist` | GET | — | **TODO** (surveyor list UI) |
| `/account/agent-approve` | POST | — | **TODO** |
| `/account/stafflist` | GET | — | **TODO** (staff list UI) |
| `/account/staff-change-password` | POST | — | **TODO** |
| `/account/bank-users` | GET | `/account/bank-users` | **DONE** |
| `/account/add-bank-user` | POST | `POST /api/v2/account/bank-users` | **DONE** |
| `/account/edit-bank-user` | GET | bank-users UI | **DONE** |
| `/account/update-bank-user` | POST | `PATCH/PUT /api/v2/account/bank-users` | **DONE** |
| `/staff-permission` | GET | — | **TODO** |
| `/staff-permission-save` | POST | — | **TODO** |
| `/staff-wise-permission` | GET | — | **TODO** |
| `/users` (resource) | * | — | **TODO** / low priority |

### 1.4 Masters (shared)

| Laravel | Method | Next.js UI | Next API | Status |
|---------|--------|------------|----------|--------|
| `/masters/bank` (+ add/edit/update/delete) | GET/POST | `/masters/banks` | `/api/v2/masters/banks` | **DONE** |
| `/masters/broker` (+ CRUD) | GET/POST | `/masters/brokers` | `/api/v2/masters/brokers` | **DONE** |
| `/masters/city` (+ CRUD) | GET/POST | `/masters/cities` | `/api/v2/masters/cities` | **DONE** |
| `/masters/company` (+ CRUD) | GET/POST | `/masters/companies` | `/api/v2/masters/companies` | **DONE** |
| `/masters/model` (+ CRUD) | GET/POST | `/masters/models` | `/api/v2/masters/models` | **DONE** |
| `/masters/variant` (+ CRUD) | GET/POST | `/masters/variants` | `/api/v2/masters/variants` | **DONE** |
| `/masters/company-wise-models` | GET | used by jobs forms | `/api/v2/jobs/lookups` | **DONE** / **PARTIAL** |
| `/masters/company-models-wise-variant` | GET | used by jobs forms | `/api/v2/jobs/lookups` | **DONE** / **PARTIAL** |

### 1.5 Pre-Inspection jobs (core)

| Laravel | Method | Next.js | Status |
|---------|--------|---------|--------|
| `/jobs/assign` | GET | `/jobs/assign` | **DONE** |
| `/jobs/job-add` | POST | `POST /api/v2/jobs` | **DONE** |
| `/jobs/get-assign-by-id` | GET | `GET /api/v2/jobs/[id]` | **DONE** |
| `/jobs/assign-update` | POST | `PATCH /api/v2/jobs/[id]` | **DONE** |
| `/jobs/assign-update-agent` | POST | `POST /api/v2/jobs/[id]/assign` | **DONE** |
| `/jobs/assign-delete` | POST | `DELETE /api/v2/jobs/[id]` | **DONE** |
| `/jobs/freshassign` | GET | `/jobs/fresh` | **DONE** |
| `/jobs/oldcases` | GET | `/jobs/schedule` | **DONE** |
| `/jobs/pendinglist` | GET | `/jobs/pending` | **DONE** |
| `/jobs/inspect-job/{id}` | GET | `/jobs/inspect/[id]` (2W) | **DONE** |
| `/jobs/inspect-job-3w/{id}` | GET | `/jobs/inspect/[id]` (3W) | **DONE** |
| `/jobs/inspect-job-4w/{id}` | GET | `/jobs/inspect/[id]` (4W) | **DONE** |
| `/jobs/inspect-job-skip-qc/{id}` | GET | inspect flow + skip flag | **PARTIAL** |
| `/jobs/inspect-job-3w-skip-qc/{id}` | GET | same | **PARTIAL** |
| `/jobs/inspect-job-4w-skip-qc/{id}` | GET | same | **PARTIAL** |
| `/jobs/twowheeler` | GET | folded into inspect | **DONE** / N/A |
| `/jobs/two-wheeler-add` (+ `-direct`) | POST | `POST /api/v2/jobs/inspections` | **DONE** / **PARTIAL** |
| `/jobs/three-wheeler-add` (+ `-direct`) | POST | inspections API | **DONE** / **PARTIAL** |
| `/jobs/four-wheeler-add` (+ `-direct`) | POST | inspections API | **DONE** / **PARTIAL** |
| `/jobs/2wqc`, `3wqc`, `4wqc` | GET | `/jobs/qc` | **DONE** |
| `/jobs/update-inspct-remark-*-qc` | POST | `POST /api/v2/jobs/qc` | **DONE** / **PARTIAL** |
| `/jobs/edit-inspect-job{,-3w,-4w}/{id}` | GET | `/jobs/inspect/[id]` edit | **PARTIAL** |
| `/jobs/update-{two,three,four}-wheeler` | POST | inspections API | **PARTIAL** |
| `/jobs/img-delete-{2w,3w,4w}` | POST | — | **TODO** (image stubs) |
| `/jobs/edit-inspect-job-*-admin/{id}` | GET | inspect admin mode | **PARTIAL** |
| `/jobs/update-*-admin`, `upload-image-*-admin` | POST | files + inspections | **PARTIAL** / **TODO** |
| `/jobs/2wdone`, `3wdone`, `4wdone` | GET | `/jobs/complete` | **DONE** |
| `/jobs/remark-edit-*`, `update-inspct-remark-*` | GET/POST | complete / QC APIs | **PARTIAL** |
| `/jobs/get-detail-data` | GET | job detail API | **PARTIAL** |
| `/jobs/pre-inspection-report` | GET | `/jobs/reports` + `/api/v2/jobs/reports` | **DONE** |
| `/job-pre-inspection-history` | GET | reports / job history | **PARTIAL** |
| Hub | — | `/jobs` | **DONE** (Next-only hub) |

**Known stubs (Phase 5):** remaining low-traffic Blade inspect fields; optional PDF pixel-perfect polish.

### 1.6 PI PDF & files

| Laravel | Method | Next.js | Status |
|---------|--------|---------|--------|
| `/twowheelerview/{id}`, `/twowheelerviewprint/{id}` | GET | `GET /api/v2/pdf/2w` (+ tools UI `/tools/pdf`) | **PARTIAL** — sample/foundation; wire to real job rows |
| `/threewheelerview/{id}`, `/threewheelerviewprint/{id}` | GET | `GET /api/v2/pdf/3w` | **PARTIAL** |
| `/fourwheelerview/{id}`, `/fourwheelerviewprint/{id}` | GET | `GET /api/v2/pdf/4w` | **PARTIAL** |
| `/generate-pdf` | GET | via pdf service | **PARTIAL** |
| `/image-upload` | GET/POST | `POST /api/v2/files/upload` | **PARTIAL** |

### 1.7 Logs (shared, low priority)

| Laravel | Method | Next.js | Status |
|---------|--------|---------|--------|
| `/log/system`, `/log/audit` | resource | — | **TODO** |

### 1.8 Misc in-scope / deferred

| Laravel | Notes | Status |
|---------|-------|--------|
| `/` public website | Marketing; not blocking PI | deferred |
| `/privacy_policy` | Public | deferred |
| `/clear-cache` | Security debt — do not migrate | **OUT** (remove) |
| Metronic `/documentation/*` | Theme docs | **OUT** |

---

## 2. In-scope API routes → Next.js

See also [PHASE4_API_MAPPING.md](./PHASE4_API_MAPPING.md).

| Laravel (`routes/api.php`) | Next.js | Status |
|----------------------------|---------|--------|
| `ANY /api/vehicle-rc` | `/api/vehicle-rc` (+ `/api/legacy/vehicle-rc`) | **DONE** |
| `GET /api/vehicle-info` | `/api/vehicle-info` (+ legacy) | **DONE** |
| `POST /api/store-vahan-data` | `/api/store-vahan-data` (+ legacy) | **DONE** |
| `POST /api/store-vahan-details` | `/api/store-vahan-details` | **DONE** |
| `POST /api/delete_rc_history_data` | `/api/delete_rc_history_data` | **DONE** |
| `POST /api/update_rc_mask_data` | `/api/update_rc_mask_data` | **DONE** |
| `POST /api/update_rc_f_h_data` | `/api/update_rc_f_h_data` | **DONE** |
| `POST /api/update_old_rc_data` | `/api/update_old_rc_data` | **DONE** |
| `GET /api/health` | `/api/health` | **DONE** (Next-only) |
| Internal PI UI APIs | `/api/v2/jobs/*`, `/api/v2/masters/*`, `/api/v2/account/*`, `/api/v2/pdf/*`, `/api/v2/files/upload` | **DONE** / **PARTIAL** |
| Auth session | `/api/auth/[...nextauth]`, `/api/v2/auth/me` | **DONE** |

### Web aliases used by PI (same handlers)

| Laravel web | Next | Status |
|-------------|------|--------|
| `GET /get-vehicle-fop` | prefer `/api/vehicle-info` | **DONE** via API |

---

## 3. Explicit OUT OF SCOPE (do not migrate)

Leave on Laravel. Do **not** add Next nav, Route Handlers, or nginx cutover for these.

### 3.1 FI-Inspection / office

| Laravel paths (prefix `/jobs/` unless noted) |
|-----------------------------------------------|
| `assign_office`, `job-add-office`, `get-office-record-by-id`, `assign-office-update`, `oldcases_office` |
| `inspect-job-office/{id}`, `office-add`, `office_qc`, `edit-office-residence/{id}` |
| `img-delete-office`, `upload-image-office`, `office-form-update`, `office_complete` |
| PDF: `/office_residence_print/{id}`, `/office_residence_download/{id}`, `/office_residence_print1/{id}` |
| Controller: `OfficeController` |

### 3.2 Valuation modules

| Area | Laravel paths / controllers |
|------|----------------------------|
| Assign / lists | `valuation_assign`, `valuation-job-add`, `valuation-get-assign-by-id`, `valuation-assign-*`, `valuation_freshassign`, `valuation_oldcases` |
| 2W/3W/4W inspect & QC | `valuation_2w_*`, `2wqc_valuation`, `valuation_2wdone`, `valuation-inspect-job-3w/*`, `valuation_3w_*`, `3wqc_valuation`, `valuation_3wdone`, `valuation_inspect_job_4w*`, `4wqc_valuation`, `valuation_4wdone`, `imgDel*_valuation`, uploads |
| Admin val edit | `edit-inspect-job-*-admin-val/{id}`, `update-*-admin-val` |
| Price valuation | `2w-price-valuation`, `3w-price-valuation`, `4w-price-valuation`, `update-*-price-valuation` |
| Reports | `valuation-report`, `/job-valuation-history` |
| Controllers | `ValuationController`, `DirectValuationController`, `JobValuationController` |
| PDFs | `*valuation_pdf*`, `app_*valuation_pdf*` |

### 3.3 Bank portal (valuation)

| Laravel |
|---------|
| `/bank/create-intimation` (GET/POST) |
| `/bank/fresh-valuation-intimation` |
| `/bank/schedule-valuation-intimation` |
| `/bank/complete-case-report` |
| `/bank/valuation-intimation-by-id`, `update-valuation-intimation`, `delete-valuation-intimation` |

### 3.4 Valuation / non-PI APIs (stay Laravel or Next `501` stubs)

| Laravel API | Disposition |
|-------------|-------------|
| `/api/valuation-vehicle-rc` | **OUT** — Next may `501` |
| `/api/search/vrn-to-rc` | **OUT** |
| `/api/search/vrn-to-rc-and-mmv-master` | **OUT** |
| `/api/search/mobile-to-vrn`, `/api/search/vrn-to-mobile` | **OUT** (RestAPI) |
| `/api/mobile-to-vrn`, `/api/vrn-to-mobile` | **OUT** for PI cutover |
| `/api/vehicle-challan-info`, `/api/FASTag-info` | **OUT** (optional; not required) |
| `/api/profits` | sample — ignore |

### 3.5 Valuation dashboard cards

Fresh / Schedule / QC / Price / Complete on `tbl_valuation_*` — **OUT**. Dashboard Next UI must show PI metrics only.

---

## 4. Integrations inventory (PI)

| Integration | Laravel origin | Next location | Status |
|-------------|----------------|---------------|--------|
| Vahan / govt RC proxy | `app/helpers.php` | `src/lib/integrations/vahan.ts` | **DONE** (PI paths) |
| IDfy | helpers | `src/lib/integrations/idfy.ts` | **DONE** (plus + basic mask write-back) |
| Digital Dekho | helpers / cron | `digital-dekho.ts` + BullMQ `vahan-import` | **PARTIAL** (worker foundation) |
| SMS | Laravel notifications | `sms.ts` + `sms-notify` worker | **DONE** (stub by default; live via `SMS_ENABLED`) |

---

## 5. Nginx strangler — PI paths only

Route **migrated** UI + `/api/v2/*` + PI external APIs to Next. Keep **everything else** (FI, Valuation, bank portal, non-PI APIs) on Laravel.

### Suggested Next upstream locations (enable when traffic-ready)

```nginx
# Upstream (example)
# upstream next_app { server 127.0.0.1:3001; }
# upstream laravel_app { server 127.0.0.1:8000; }

# --- Auth / shell ---
location = /login { proxy_pass http://next_app; }
location /api/auth/ { proxy_pass http://next_app; }

# --- Shared masters + account (when Phase 2–3 cut over) ---
location /masters/ { proxy_pass http://next_app; }
location /account/settings { proxy_pass http://next_app; }
location /account/bank-users { proxy_pass http://next_app; }
# Keep Laravel until surveyor/staff UIs exist:
# location /account/agentlist { proxy_pass http://laravel_app; }
# location /account/stafflist { proxy_pass http://laravel_app; }

# --- Pre-Inspection UI ---
location = /dashboard { proxy_pass http://next_app; }   # after PI-only cards verified
location /jobs/ { proxy_pass http://next_app; }         # ONLY after FI/Valuation paths excluded below

# --- Internal Next APIs ---
location /api/v2/ { proxy_pass http://next_app; }
location = /api/health { proxy_pass http://next_app; }

# --- PI external APIs (Phase 4) ---
location = /api/vehicle-rc { proxy_pass http://next_app; }
location = /api/vehicle-info { proxy_pass http://next_app; }
location = /api/store-vahan-data { proxy_pass http://next_app; }
location = /api/store-vahan-details { proxy_pass http://next_app; }
location = /api/delete_rc_history_data { proxy_pass http://next_app; }
location = /api/update_rc_mask_data { proxy_pass http://next_app; }
location = /api/update_rc_f_h_data { proxy_pass http://next_app; }
location = /api/update_old_rc_data { proxy_pass http://next_app; }

# --- PI PDFs (after real job-row wiring) ---
# location ~ ^/(two|three|four)wheelerview(print)?/ { proxy_pass http://next_app; }
# Prefer new /api/v2/pdf/{2w|3w|4w} for clients during transition

# Default → Laravel
location / { proxy_pass http://laravel_app; }
```

### Must remain on Laravel (do not blanket `/jobs/`)

If using a broad `/jobs/` → Next rule, **carve out** FI + Valuation first (more specific locations → Laravel):

```nginx
# FI
location ~ ^/jobs/(assign_office|job-add-office|oldcases_office|inspect-job-office|office_) {
  proxy_pass http://laravel_app;
}
# Valuation
location ~ ^/jobs/(valuation_|.*valuation|.*-price-valuation|edit-inspect-job-.*-val) {
  proxy_pass http://laravel_app;
}
location ~ ^/bank/ { proxy_pass http://laravel_app; }
location ~ valuation_pdf { proxy_pass http://laravel_app; }
location ~ office_residence_ { proxy_pass http://laravel_app; }
```

**Safer approach:** list exact PI prefixes (`/jobs/assign`, `/jobs/freshassign` → rewrite or map to Next `/jobs/fresh`, etc.) rather than `/jobs/` catch-all until FI/Valuation are gone.

### Laravel → Next path renames (UI)

| Laravel path | Next path |
|--------------|-----------|
| `/jobs/freshassign` | `/jobs/fresh` |
| `/jobs/oldcases` | `/jobs/schedule` |
| `/jobs/pendinglist` | `/jobs/pending` |
| `/jobs/2wqc` / `3wqc` / `4wqc` | `/jobs/qc` |
| `/jobs/2wdone` / `3wdone` / `4wdone` | `/jobs/complete` |
| `/jobs/pre-inspection-report` | `/jobs/reports` |
| `/jobs/inspect-job{-3w,-4w}/:id` | `/jobs/inspect/:id` |

Add nginx `rewrite` or Next redirects for bookmarks during cutover.

### Feature-flag idea

```env
MIGRATE_AUTH=true
MIGRATE_MASTERS=true
MIGRATE_ACCOUNT=true   # settings + bank-users only until surveyor/staff done
MIGRATE_PI_JOBS=true
MIGRATE_PI_API=true
MIGRATE_PI_PDF=false   # enable after Phase 6 wiring
```

---

## 6. Cutover readiness summary

| Module | Ready to proxy to Next? | Blockers |
|--------|-------------------------|----------|
| Auth login | Yes | Password reset optional |
| Masters | Yes | — |
| Account settings + bank users | Yes | — |
| Surveyor / staff / permissions | **No** | UI **TODO** |
| PI jobs core lists + inspect/QC/complete/reports | **Mostly** | Image/video, PDF links, SMS stubs |
| PI PDF view/print | **No** (foundation only) | Wire to real `tbl_*` rows + Blade parity |
| PI external RC/Vahan APIs | Yes | Contract tests on staging |
| FI / Valuation / bank portal | **Never (this plan)** | Stay Laravel |

---

## 7. Background workers (PI)

| Laravel | Next (BullMQ) | Status |
|---------|---------------|--------|
| `ImportVahanHistoryData` | queue `vahan-import` | **DONE** (foundation) |
| `ARC`…`RC2` batches | queue `rc-batch` (optional flag) | **PARTIAL** |
| SMS / valuation/FI crons | — | **OUT** or deferred |

Tools UI: `/tools/workers`.
