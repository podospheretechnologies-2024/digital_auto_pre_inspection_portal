import { isBoth, type AppRole } from "@/lib/rbac";
import { surveyorPermissionCeiling } from "@/lib/account/permissions-policy";
import type { SessionUser } from "@/types/next-auth";

export type { AppRole };

type Rule = {
  prefix: string;
  roles: AppRole[];
  /** Page-open permission. Button permissions are checked on the API. */
  view?: string;
};

const PAGE_RULES: Rule[] = [
  { prefix: "/account/staff-permissions", roles: ["admin"], view: "staff_view" },
  { prefix: "/account/admins", roles: ["admin"], view: "admin_view" },
  { prefix: "/account/staff", roles: ["admin"], view: "staff_view" },
  { prefix: "/account/surveyors", roles: ["admin", "HO"], view: "surveyor_view" },
  { prefix: "/account/bank-users", roles: ["admin", "HO"], view: "bank_user_view" },
  { prefix: "/account/settings", roles: ["admin", "HO", "RO", "Surveyor", "Bank"] },
  { prefix: "/masters", roles: ["admin", "HO"], view: "masters_view" },
  { prefix: "/jobs/reports", roles: ["admin", "HO", "Bank"], view: "reports_view" },
  { prefix: "/jobs/assign", roles: ["admin", "HO"], view: "jobs_view" },
  { prefix: "/jobs/fresh", roles: ["admin", "HO"], view: "fresh_view" },
  { prefix: "/jobs/schedule", roles: ["admin", "HO"], view: "schedule_view" },
  { prefix: "/jobs/qc", roles: ["admin", "HO"], view: "qc_view" },
  { prefix: "/jobs/hold", roles: ["admin", "HO"], view: "hold_view" },
  { prefix: "/jobs/complete", roles: ["admin", "HO"], view: "complete_view" },
  { prefix: "/jobs/cancel", roles: ["admin", "HO"], view: "cancel_view" },
  { prefix: "/jobs/pending", roles: ["admin", "HO", "RO", "Surveyor"], view: "pending_view" },
  { prefix: "/jobs/inspect", roles: ["admin", "HO", "RO", "Surveyor"], view: "inspect_view" },
  { prefix: "/dashboard", roles: ["admin", "HO", "RO", "Surveyor", "Bank"], view: "dashboard_view" },
];

const API_RULES: Rule[] = [
  { prefix: "/api/v2/account/staff-permissions", roles: ["admin"] },
  { prefix: "/api/v2/account/admins", roles: ["admin"] },
  { prefix: "/api/v2/account/staff", roles: ["admin"] },
  { prefix: "/api/v2/account/surveyors", roles: ["admin", "HO"] },
  { prefix: "/api/v2/account/bank-users", roles: ["admin", "HO"] },
  { prefix: "/api/v2/masters", roles: ["admin", "HO"] },
  { prefix: "/api/v2/logs", roles: ["admin", "HO"] },
  { prefix: "/api/v2/jobs/qc", roles: ["admin", "HO"] },
  { prefix: "/api/v2/jobs/reports", roles: ["admin", "HO", "Bank"] },
  { prefix: "/api/v2/jobs", roles: ["admin", "HO", "RO", "Surveyor", "Bank"] },
  { prefix: "/api/v2/pdf", roles: ["admin", "HO", "RO", "Surveyor", "Bank"] },
  { prefix: "/api/v2/files", roles: ["admin", "HO", "RO", "Surveyor", "Bank"] },
];

function matchRule(pathname: string, rules: Rule[]): Rule | null {
  let found: Rule | null = null;
  for (const rule of rules) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (!found || rule.prefix.length > found.prefix.length) found = rule;
    }
  }
  return found;
}

export function listPagePermission(list: string): string {
  switch (list) {
    case "fresh":
    case "unassigned":
      return "fresh_view";
    case "schedule":
    case "assigned":
    case "old":
      return "schedule_view";
    case "pending":
      return "pending_view";
    case "qc_pending":
      return "qc_view";
    case "completed":
      return "complete_view";
    case "hold":
      return "hold_view";
    case "cancel":
    case "cancelled":
      return "cancel_view";
    default:
      return "jobs_view";
  }
}

type GateUser = {
  type?: string | null;
  isAdmin?: boolean;
  permissions?: string[];
};

/** Role allowlist, then page-view permission. Admin and HO skip the view tick. */
export function routeDenied(
  pathname: string,
  role: AppRole,
  user: GateUser,
): boolean {
  const rules = pathname.startsWith("/api/") ? API_RULES : PAGE_RULES;
  const rule = matchRule(pathname, rules);
  if (!rule) return false;
  if (!rule.roles.includes(role)) return true;
  if (!rule.view || isBoth(user as SessionUser) || role === "Bank") return false;
  if (role === "Surveyor" && !surveyorPermissionCeiling().has(rule.view)) {
    return true;
  }
  return !user.permissions?.includes(rule.view);
}
