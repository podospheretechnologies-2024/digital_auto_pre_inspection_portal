/**
 * Permission policy:
 * - RO: soft — Admin can grant any menu permission via Staff permissions UI.
 * - Surveyor: hard ceiling — never more than this allowlist (and never above parent RO).
 */

/** Menu short_code bases Surveyors may ever receive (view/entry/edit/delete). */
export const SURVEYOR_PERMISSION_CEILING_BASES = [
  "dashboard",
  "jobs",
  "pending",
  "schedule",
  "fresh",
  "assign",
  "inspect",
  "qc",
  "complete",
  "hold",
  "cancel",
  "reports",
] as const;

const ACTIONS = ["view", "entry", "edit", "delete"] as const;

export function surveyorPermissionCeiling(): Set<string> {
  const set = new Set<string>();
  for (const base of SURVEYOR_PERMISSION_CEILING_BASES) {
    for (const action of ACTIONS) {
      set.add(`${base}_${action}`);
    }
  }
  return set;
}

export function clampSurveyorPermissions(permissions: string[]): string[] {
  const ceiling = surveyorPermissionCeiling();
  return permissions.filter((p) => ceiling.has(p));
}

export function permissionBase(permission: string): string {
  return permission.replace(/_(view|entry|edit|delete)$/, "");
}
