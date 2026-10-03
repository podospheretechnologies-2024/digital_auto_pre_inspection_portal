# Phase 4 — External API mapping (Pre-Inspection only)

Laravel `routes/api.php` → Next.js Route Handlers in `digitalauto-next`.

**Scope:** APIs needed for Pre-Inspection RC/Vahan cache. FI and Valuation surfaces stay on Laravel.

Nginx strangler should send migrated paths to Next; leave dropped paths on Laravel (or hit Next `501` stubs intentionally).

## Done (Laravel → Next)

| Laravel | Next.js | Auth | Notes |
|---------|---------|------|-------|
| `ANY /api/vehicle-rc` | `/api/vehicle-rc` (+ `/api/legacy/vehicle-rc`) | `rc_api_users.uuid` as `access_token`; success cap ~445 | `{ status, data\|message }` parity |
| `GET /api/vehicle-info` | `/api/vehicle-info` (+ `/api/legacy/vehicle-info`) | none | RC row + `history_*` collections; 24h refresh via Vahan proxy |
| `POST /api/store-vahan-data` | `/api/store-vahan-data` (+ `/api/legacy/store-vahan-data`) | none (scraper) | Plain text `success` / `Error:…` body |
| `POST /api/store-vahan-details` | `/api/store-vahan-details` | none (scraper) | History table inserts |
| `POST /api/delete_rc_history_data` | `/api/delete_rc_history_data` | none | Deletes by `rc_history` label |
| `POST /api/update_rc_mask_data` | `/api/update_rc_mask_data` | `RC_INTERNAL_UPDATE_TOKEN` | Chassis/engine/owner mask |
| `POST /api/update_rc_f_h_data` | `/api/update_rc_f_h_data` | `RC_INTERNAL_UPDATE_TOKEN` | Father/husband name |
| `POST /api/update_old_rc_data` | `/api/update_old_rc_data` | `RC_INTERNAL_UPDATE_TOKEN` | Old registration no |

Shared clients: `src/lib/integrations/` (`vahan.ts`, `idfy.ts`, `http.ts`, `api-auth.ts`, `handlers-pi.ts`, `vahan-history.ts`).

Env: `VAHAN_PROXY_URL`, `IDFY_*` (plus/basic write-back into `rc_details`), `RC_INTERNAL_UPDATE_TOKEN` (defaults to legacy hardcoded token if unset).

## Dropped (out of Pre-Inspection scope)

| Laravel | Reason | Next behavior |
|---------|--------|---------------|
| `ANY /api/valuation-vehicle-rc` | Valuation-only domain cache bypass | `501` stub |
| `GET /api/search/vrn-to-rc` | Alias of valuation RC | `501` stub |
| `GET /api/search/vrn-to-rc-and-mmv-master` | External RestAPI + MMV (broker) | `501` stub |
| `GET /api/search/mobile-to-vrn` | External RestAPI | Stay on Laravel |
| `GET /api/search/vrn-to-mobile` | External RestAPI | Stay on Laravel |
| `GET /api/mobile-to-vrn` | Not used by PI job flow | `/api/legacy/mobile-to-vrn` → `501` |
| `GET /api/vrn-to-mobile` | Not used by PI job flow | `/api/legacy/vrn-to-mobile` → `501` |
| `GET /api/vehicle-challan-info` | Optional; not required for PI cutover | Stay on Laravel |
| `GET /api/FASTag-info` | Optional; not required for PI cutover | Stay on Laravel |

## Pending / blockers

- Live contract tests vs Laravel snapshots (needs staging DB + `VAHAN_PROXY_URL`)
- Full `history_*` / `rc_details` column parity: prefer `npm run db:pull` against production MySQL
- Digital Dekho bulk import remains Phase 7 worker (`lib/integrations/digital-dekho.ts` + `vahan-import`)

## IDfy parity (done)

`src/lib/integrations/idfy.ts` mirrors Laravel helpers:

| Helper | Behavior |
|--------|----------|
| `apiVehicleDetailIdfy` / plus | Skip if chassis already on `rc_details`; async `ind_rc_plus` → sleep → poll → upsert full extraction |
| `apiVehicleBasicDetailIdfy` / basic | Async `ind_rc_basic` → sleep → poll → upsert mask fields (`rc_chasi_no`, `rc_eng_no`, `rc_owner_name`) |
| Vahan `apiVehicleDetailGovt(..., maskData)` | After proxy upsert, calls basic mask when `IDFY_API_KEY` + `IDFY_ACCOUNT_ID` set |

Poll delay defaults: 20s plus / 10s basic (`IDFY_POLL_DELAY_MS` overrides both).
