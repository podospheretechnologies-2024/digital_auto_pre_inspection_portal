# Phase 8 — Partial Decommission Checklist

**Goal:** Stop proxying **migrated Pre-Inspection + shared** traffic to Laravel.  
**Non-goal:** Full Laravel shutdown. **FI and Valuation remain on Laravel.**

**Ops guide:** [PHASE8_RUNBOOK.md](./PHASE8_RUNBOOK.md)  
**Nginx example:** [`../deploy/nginx-strangler.conf.example`](../deploy/nginx-strangler.conf.example)

**Status:** Checklist + runbook **ops-ready** — execute only after traffic audit passes.

---

## 0. Preconditions

- [ ] Phases 0–7 accepted for PI + shared (see [MIGRATION.md](./MIGRATION.md))
- [ ] Staging mirrors production DB + uploads
- [ ] Rollback plan: re-point nginx location blocks to Laravel in under 5 minutes
- [ ] Stakeholders know FI/Valuation URLs still use Laravel
- [ ] Next + BullMQ worker healthy on staging (login → assign → inspect → QC → PDF)

---

## 1. Traffic audit (migrated paths only)

Collect ≥ **2 weeks** of access logs (or 1 week on low-traffic staging).

### Paths expected on Next (should go to zero on Laravel)

**Auth / public**

```
/login
/logout
/forgot-password
/reset-password
/api/auth/
```

**Dashboard + tools**

```
/dashboard
/tools/pdf
```

**Masters**

```
/masters/
/masters/bank
/masters/broker
/masters/city
/masters/company
/masters/model
/masters/variant
```

**Account / staff / surveyors / permissions**

```
/account/settings
/account/bank-users
/account/surveyors
/account/staff
/account/staff-permissions
```

**Activity logs**

```
/logs/activity
/api/v2/logs/activity
```

**Pre-Inspection jobs**

```
/jobs/assign
/jobs/fresh
/jobs/schedule
/jobs/pending
/jobs/inspect
/jobs/qc
/jobs/complete
/jobs/reports
```

**APIs (Next)**

```
/api/v2/
/api/health
```

### Example nginx log greps (Laravel upstream only)

```bash
# Count Laravel hits on PI/shared prefixes (should trend to 0 after Next cutover)
grep -E '"(GET|POST|PUT|PATCH|DELETE) /(login|logout|forgot-password|reset-password|dashboard|masters|account|logs|tools|jobs/(assign|fresh|schedule|pending|inspect|qc|complete|reports)|api/v2|api/auth)' access.log | wc -l

# Surveyors / staff / permissions / forgot-password specifically
grep -E '/(account/(surveyors|staff|staff-permissions)|logs/activity|forgot-password|reset-password)' access.log | head

# Confirm FI/Valuation still hit Laravel (expected > 0)
grep -E 'office|valuation|assign_office|price-valuation|create-intimation' access.log | head
```

### Pass criteria

- [ ] Laravel receives **~0** requests on migrated PI + shared prefixes for the audit window
- [ ] Next error rate acceptable (4xx/5xx) on those paths
- [ ] FI + Valuation still healthy on Laravel

---

## 2. Proxy cutover (partial)

Using [`../deploy/nginx-strangler.conf.example`](../deploy/nginx-strangler.conf.example):

1. [ ] Enable `location` blocks that send migrated prefixes to `next_upstream`
2. [ ] Keep catch-all / FI / Valuation on `laravel_upstream`
3. [ ] Reload nginx: `nginx -t && nginx -s reload`
4. [ ] Smoke test PI flow on production hostname (incl. surveyors, staff, permissions, forgot-password, activity logs, PDF)
5. [ ] Smoke test one FI + one Valuation flow still on Laravel

If issues: remove Next `location` blocks (or comment them out) and reload — see runbook rollback.

---

## 3. Feature flags & env

- [ ] Next `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL` set in prod
- [ ] Worker process supervised (`npm run worker` / systemd / PM2)
- [ ] SMS / Digital Dekho / Vahan / IDfy secrets only in env (not in repo)
- [ ] SMTP wired for password reset **or** documented local-only `ALLOW_RESET_TOKEN_ECHO`
- [ ] Confirm Laravel `/clear-cache` is disabled or auth-gated (security)

---

## 4. What NOT to do yet

- [ ] Do **not** delete the Laravel repo or stop the Laravel app
- [ ] Do **not** drop FI / Valuation tables
- [ ] Do **not** remove Spatie / Metronic packages from Laravel while FI/Valuation run there
- [ ] Do **not** strip Laravel `routes/web.php` PI routes until audit passes (optional: leave as dead code behind proxy)

---

## 5. Optional Laravel cleanup (after audit passes)

Only for **migrated** PI + shared routes:

- [ ] Comment or feature-flag Laravel PI route groups (keep FI/Valuation)
- [ ] Document remaining Laravel surface in inventory as **OUT** / Laravel-only
- [ ] Rotate any API keys that were hardcoded in old helpers once Next owns the integrations

---

## 6. Full decommission (future plan)

When FI + Valuation are migrated or retired:

- [ ] Repeat traffic audit for **all** remaining Laravel paths
- [ ] Remove Laravel from proxy entirely
- [ ] Archive `legacy/laravel-8` branch / tag
- [ ] Decommission Laravel hosts and Metronic assets

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Eng | | | Audit window / nginx change |
| Ops | | | Rollback verified |
| Product | | | FI/Valuation still Laravel |

**Phase 8 status:** Ops-ready (checklist + runbook + nginx example). Execute cutover only after traffic audit. Laravel remains for FI + Valuation.
