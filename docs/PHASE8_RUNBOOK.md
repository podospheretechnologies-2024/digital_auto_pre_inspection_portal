# Phase 8 — Cutover Runbook

Short ops steps for **partial** strangler cutover: Pre-Inspection + shared platform → Next.js; **FI + Valuation stay on Laravel**.

Companion docs: [DECOMMISSION_CHECKLIST.md](./DECOMMISSION_CHECKLIST.md) · [`deploy/nginx-strangler.conf.example`](../deploy/nginx-strangler.conf.example)

---

## 1. Before cutover day

1. Confirm Phases 0–7 accepted for PI + shared.
2. Run traffic audit ≥ 2 weeks (checklist §1). Migrated paths on Laravel should be ~0 **or** you are intentionally forcing cutover on staging first.
3. Deploy latest `digitalauto-next` to the Next host (`npm run build` + process manager).
4. Start / verify BullMQ worker (`npm run worker`).
5. Verify env: `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, storage (S3 or `LOCAL_UPLOAD_DIR`), integration keys as needed.
6. Keep Laravel running (FI/Valuation still need it).
7. Copy nginx example → site config; **do not reload yet** — review locations.

### Migrated prefixes (must hit Next)

| Area | Paths |
|------|--------|
| Auth | `/login`, `/logout`, `/forgot-password`, `/reset-password`, `/api/auth/` |
| App shell | `/dashboard`, `/tools/` |
| Masters | `/masters/` |
| Account | `/account/settings`, `/account/bank-users`, `/account/surveyors`, `/account/staff`, `/account/staff-permissions` |
| Logs | `/logs/activity` |
| PI jobs | `/jobs/assign`, `/jobs/fresh`, `/jobs/schedule`, `/jobs/pending`, `/jobs/inspect`, `/jobs/qc`, `/jobs/complete`, `/jobs/reports` |
| APIs | `/api/v2/`, `/api/health`, `/_next/` |

### Stay on Laravel

Anything under FI/office, valuation, bank valuation portal, and the catch-all `location /`.

---

## 2. Cutover steps (staging first, then prod)

1. **Backup** current nginx site file.
2. Enable Next `location` blocks from `nginx-strangler.conf.example` (auth, `/api/v2/`, `/api/health`, UI regex, `/_next/`).
3. `nginx -t && nginx -s reload`.
4. **Smoke (Next):**
   - Login / logout
   - Forgot-password page loads (reset email optional if SMTP not live)
   - Dashboard
   - Masters list (any one)
   - Account → Surveyors, Staff, Staff permissions, Settings
   - Logs → Activity
   - Jobs: assign → fresh/schedule → pending → inspect → QC → complete → PDF download
5. **Smoke (Laravel still):** open one FI office path + one Valuation path; confirm 200 and app shell.
6. Watch Next + Laravel error logs for 30–60 minutes.
7. If staging OK, repeat on production in a maintenance window.

---

## 3. Rollback (< 5 minutes)

1. Comment out or delete the Next `location` blocks (or restore backed-up site file).
2. `nginx -t && nginx -s reload`.
3. Confirm `/login` and `/jobs/assign` hit Laravel again if that was previous behaviour — or restore whatever pre-cutover routing you used.
4. Leave Next app running (no data loss); investigate before re-attempt.

---

## 4. After successful cutover

1. Complete checklist sign-off table.
2. Optionally comment Laravel PI/shared routes (keep FI/Valuation).
3. Continue monitoring Laravel logs for accidental hits on migrated paths.
4. Do **not** shut down Laravel until FI + Valuation are migrated or retired (future plan).

---

## 5. Quick reference commands

```bash
# Validate + reload
sudo nginx -t && sudo nginx -s reload

# Next process (example)
cd /path/to/digitalauto-next && npm run start   # or pm2/systemd
cd /path/to/digitalauto-next && npm run worker

# PDF smoke
curl -sI "https://<host>/api/v2/pdf/2w?sample=1"
```
