"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toast as notice } from "@/lib/toast";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";

type StaffOpt = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type?: string | null;
};

type Action = "view" | "entry" | "edit" | "delete";

type MenuItem = {
  id: number;
  name: string;
  short_code: string;
  view: boolean;
  entry: boolean;
  edit: boolean;
  delete: boolean;
  lock?: Partial<Record<Action, string>>;
};

type ModuleBlock = { module: string; items: MenuItem[] };

type Member = {
  id: number;
  name: string;
  email: string;
  type: string | null;
  parent_name: string | null;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

const ACTIONS: Action[] = ["view", "entry", "edit", "delete"];

function permissionKey(shortCode: string, action: Action) {
  return `${shortCode}_${action}`;
}

export function StaffPermissionsPage() {
  const queryClient = useQueryClient();
  const [staffId, setStaffId] = useState<number | "">("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [menuQuery, setMenuQuery] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);

  const listQuery = useQuery({
    queryKey: ["staff-permissions", "list"],
    queryFn: () =>
      apiJson<{ data: { staff: StaffOpt[] } }>(
        "/api/v2/account/staff-permissions",
      ),
  });

  const matrixQuery = useQuery({
    queryKey: ["staff-permissions", staffId],
    enabled: staffId !== "",
    queryFn: () =>
      apiJson<{
        data: {
          modules?: ModuleBlock[];
          member?: Member;
        };
      }>(`/api/v2/account/staff-permissions?staff_id=${staffId}`),
  });

  const staff = listQuery.data?.data.staff ?? [];
  const matrix = matrixQuery.data?.data;
  const modules = matrix?.modules ?? [];
  const member = matrix?.member;

  useEffect(() => {
    if (!matrix?.modules) return;
    const next: Record<string, boolean> = {};
    for (const block of matrix.modules) {
      for (const item of block.items) {
        for (const action of ACTIONS) {
          const locked = Boolean(item.lock?.[action]);
          next[permissionKey(item.short_code, action)] =
            !locked && item[action];
        }
      }
    }
    setChecks(next);
    setSaved(next);
  }, [matrix]);

  const filtered = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules
      .map((block) => ({
        ...block,
        items: block.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.short_code.toLowerCase().includes(q) ||
            block.module.toLowerCase().includes(q),
        ),
      }))
      .filter((block) => block.items.length > 0);
  }, [modules, menuQuery]);

  const grantedCount = Object.values(checks).filter(Boolean).length;
  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(checks), ...Object.keys(saved)]);
    for (const key of keys) {
      if (Boolean(checks[key]) !== Boolean(saved[key])) return true;
    }
    return false;
  }, [checks, saved]);

  const heldBack = useMemo(() => {
    let count = 0;
    for (const block of modules) {
      for (const item of block.items) {
        for (const action of ACTIONS) {
          if (item.lock?.[action] && item[action]) count += 1;
        }
      }
    }
    return count;
  }, [modules]);

  function applyCheck(item: MenuItem, action: Action, on: boolean) {
    setChecks((current) => {
      const next = { ...current };
      const setKey = (act: Action, value: boolean) => {
        if (item.lock?.[act]) return;
        next[permissionKey(item.short_code, act)] = value;
      };
      setKey(action, on);
      return next;
    });
  }

  function toggleColumn(items: MenuItem[], action: Action, on: boolean) {
    setChecks((current) => {
      const next = { ...current };
      for (const item of items) {
          if (item.lock?.[action]) continue;
          next[permissionKey(item.short_code, action)] = on;
        }
      return next;
    });
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const permissions = Object.entries(checks)
        .filter(([, on]) => on)
        .map(([key]) => key);
      return apiJson<{ data: { permissions: string[] } }>(
        "/api/v2/account/staff-permissions",
        {
          method: "PUT",
          body: JSON.stringify({ staff_id: staffId, permissions }),
        },
      );
    },
    onSuccess: (result) => {
      const kept = new Set(result.data.permissions);
      setChecks((current) => {
        const next: Record<string, boolean> = {};
        for (const key of Object.keys(current)) next[key] = kept.has(key);
        setSaved(next);
        return next;
      });
      setConfirmSave(false);
      notice.success("Permissions saved");
      void queryClient.invalidateQueries({
        queryKey: ["staff-permissions", staffId],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleNote =
    member?.type === "Surveyor"
      ? member.parent_name
        ? `Surveyor ticks stay inside ${member.parent_name}'s permissions.`
        : "This surveyor has no RO, so menu ticks stay off."
      : member?.type === "RO"
        ? "RO ticks apply on the next request. Surveyors under this RO cannot be given more."
        : member?.type === "HO"
          ? "HO ticks are stored for this account."
          : null;

  return (
    <>
      <PageHeader
        title="Staff permissions"
        description="Choose a person, then set view, entry, edit, and delete for each menu."
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label>Staff member</Label>
          <select
            className="flex h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-sm shadow-sm"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value ? Number(e.target.value) : "");
              setMenuQuery("");
            }}
          >
            <option value="">Select staff…</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.type || "Staff"}] {s.first_name} {s.last_name} — {s.email}
              </option>
            ))}
          </select>
        </div>
        {member ? (
          <div className="flex flex-col justify-end gap-1 text-sm">
            <p className="font-medium">
              {member.name}
              <span className="ml-2 text-muted-foreground">
                {member.type || "Staff"} · {member.email}
              </span>
            </p>
            {roleNote ? (
              <p className="text-[13px] text-muted-foreground">{roleNote}</p>
            ) : null}
            {heldBack > 0 ? (
              <p className="text-[13px] text-amber-700 dark:text-amber-400">
                {heldBack} saved tick{heldBack === 1 ? "" : "s"} cannot stay.
                Save to clear them.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {staffId && matrixQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      ) : null}

      {staffId && matrixQuery.isError ? (
        <p className="text-sm text-destructive">
          {(matrixQuery.error as Error).message}
        </p>
      ) : null}

      {staffId && modules.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              value={menuQuery}
              onChange={(e) => setMenuQuery(e.target.value)}
              placeholder="Search menus…"
              className="h-9 w-full max-w-xs rounded-lg border border-border/70 bg-background px-3 text-sm shadow-sm"
            />
            <p className="text-sm text-muted-foreground">
              {grantedCount} selected
              {dirty ? " · unsaved changes" : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No menus match.</p>
          ) : (
            filtered.map((block) => (
              <div
                key={block.module}
                className="overflow-hidden rounded-2xl border border-border/70 shadow-sm"
              >
                <div className="bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                  {block.module}
                </div>
                <div className="overflow-x-auto bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="p-2 font-medium">Menu</th>
                        {ACTIONS.map((action) => {
                          const open = block.items.filter(
                            (item) => !item.lock?.[action],
                          );
                          const allOn =
                            open.length > 0 &&
                            open.every((item) =>
                              checks[permissionKey(item.short_code, action)],
                            );
                          return (
                            <th key={action} className="p-2 font-medium">
                              <label className="inline-flex items-center gap-2 capitalize">
                                <input
                                  type="checkbox"
                                  checked={allOn}
                                  disabled={open.length === 0}
                                  onChange={(e) =>
                                    toggleColumn(
                                      block.items,
                                      action,
                                      e.target.checked,
                                    )
                                  }
                                />
                                {action}
                              </label>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {block.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="p-2 pl-6">{item.name}</td>
                          {ACTIONS.map((action) => {
                            const key = permissionKey(item.short_code, action);
                            const reason = item.lock?.[action];
                            return (
                              <td key={action} className="p-2">
                                <input
                                  type="checkbox"
                                  checked={!!checks[key]}
                                  disabled={Boolean(reason)}
                                  title={reason || action}
                                  onChange={(e) =>
                                    applyCheck(item, action, e.target.checked)
                                  }
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}

          <Button
            disabled={!dirty || saveMutation.isPending}
            onClick={() => setConfirmSave(true)}
          >
            Save permissions
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Save permissions?"
        description={
          member
            ? `${grantedCount} permission${grantedCount === 1 ? "" : "s"} will be saved for ${member.name}.`
            : "These permissions will be saved after you confirm."
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={saveMutation.isPending}
        onConfirm={() => saveMutation.mutate()}
      />
    </>
  );
}
