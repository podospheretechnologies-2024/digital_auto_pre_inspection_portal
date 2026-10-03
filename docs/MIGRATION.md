# DigitalAuto Migration Guide

**Scope:** Pre-Inspection (PI) + shared platform only.  
**FI-Inspection and Valuation stay on Laravel** until a future plan.

**Apps**

| App | Path | Default URL |
|-----|------|-------------|
| Next.js (migrated) | `d:\sarthak\digitalauto-next` | http://localhost:3001 |
| Laravel (legacy) | `d:\sarthak\DigitalAutoWeb` | http://127.0.0.1:8000 |

Related docs: [MIGRATION_INVENTORY.md](./MIGRATION_INVENTORY.md) · [PHASE4_API_MAPPING.md](./PHASE4_API_MAPPING.md) · [PHASE6_PDF.md](./PHASE6_PDF.md) · [DECOMMISSION_CHECKLIST.md](./DECOMMISSION_CHECKLIST.md) · [PHASE8_RUNBOOK.md](./PHASE8_RUNBOOK.md)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|--------|
| 0 Scaffold / inventory | **Done** | Next app + Prisma + inventory |
| 1 Auth + RBAC | **Done** | Auth.js vs `users` / `user_permissions` |
| 2 Masters CRUD | **Done** | bank, broker, city, company, model, variant |
| 3 Shared account | **Done** | settings, bank users; surveyor/staff UI gaps noted in inventory |
| 4 External API (PI) | **Done** | RC / Vahan Route Handlers |
| 5 Pre-Inspection jobs | **Done (usable)** | assign → inspect → QC → complete → reports |
| 6 PI PDF + files | **Done** | templates + upload; see PHASE6_PDF.md |
| 7 BullMQ workers | **Done** | vahan-import, optional RC batch, SMS |
| 8 Partial decommission | **Ready** | [DECOMMISSION_CHECKLIST.md](./DECOMMISSION_CHECKLIST.md) + [PHASE8_RUNBOOK.md](./PHASE8_RUNBOOK.md); do **not** remove Laravel while FI/Valuation serve production |

---

## Strangler routing (nginx)

Run Next and Laravel behind one hostname. Route **migrated** PI + shared paths to Next; everything else (especially FI + Valuation) to Laravel.

Example config: [`../deploy/nginx-strangler.conf.example`](../deploy/nginx-strangler.conf.example)

### Paths that should hit Next.js (when cut over)

| Prefix / path | Module |
|---------------|--------|
| `/login`, `/dashboard` | Auth / home |
| `/masters/*` | Masters |
| `/account/*` | Shared account |
| `/jobs/*` | Pre-Inspection |
| `/tools/*` | PDF / workers UI |
| `/api/auth/*`, `/api/health`, `/api/v2/*` | Next APIs |
| `/api/vehicle-rc`, `/api/store-vahan-data`, … (PI) | Prefer Next legacy handlers when verified |

### Paths that must stay on Laravel

| Prefix | Reason |
|--------|--------|
| `/jobs/assign_office`, `/jobs/office_*`, `/jobs/oldcases_office` | FI |
| Valuation assign / QC / price / reports / bank valuation intimations | Valuation |
| Valuation PDF / office PDF routes | Out of scope |

Feature flags (optional env on Next or edge):

```bash
MIGRATE_MASTERS=true
MIGRATE_ACCOUNT=true
MIGRATE_PI_JOBS=true
MIGRATE_PI_PDF=true
# Keep false until traffic audit passes:
STRIP_LARAVEL_PI_PROXY=false
```

---

## Local dual-run

```bash
# Terminal 1 — Laravel (FI + Valuation + any not-yet-cutover)
cd d:\sarthak\DigitalAutoWeb
php artisan serve

# Terminal 2 — Next (PI + shared)
cd d:\sarthak\digitalauto-next
npm run dev

# Terminal 3 — Redis + worker
docker compose up -d redis
npm run worker
```

Demo login (both apps, when seeded): `demo@demo.com` / `demo`

---

## Data & dual-write rules

- Both stacks share the same MySQL during strangler.
- Do **not** dual-write the same PI screen from Laravel and Next at once — cut routes at the proxy.
- Run `npm run db:pull` periodically to keep Prisma aligned with production schema.

---

## Verification before Phase 8 cutover

1. Inventory statuses in [MIGRATION_INVENTORY.md](./MIGRATION_INVENTORY.md) are **DONE** for paths you will strip from Laravel.
2. Smoke: login → create/assign PI job → inspect 2W → QC → complete → PDF.
3. Worker healthy: `vahan-import` scheduled; SMS queue drains when enabled.
4. Follow [PHASE8_RUNBOOK.md](./PHASE8_RUNBOOK.md) and [DECOMMISSION_CHECKLIST.md](./DECOMMISSION_CHECKLIST.md) (nginx access logs ≥ 2 weeks preferred).
