"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type StaffOpt = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type?: string | null;
};

type MenuItem = {
  id: number;
  name: string;
  short_code: string;
  view: boolean;
  entry: boolean;
  edit: boolean;
  delete: boolean;
};

type ModuleBlock = { module: string; items: MenuItem[] };

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

const ACTIONS = ["view", "entry", "edit", "delete"] as const;

export function StaffPermissionsPage() {
  const queryClient = useQueryClient();
  const [staffId, setStaffId] = useState<number | "">("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const baseQuery = useQuery({
    queryKey: ["staff-permissions", staffId || "list"],
    queryFn: () =>
      apiJson<{
        data: {
          staff: StaffOpt[];
          modules?: ModuleBlock[];
          permissions?: string[];
        };
      }>(
        staffId
          ? `/api/v2/account/staff-permissions?staff_id=${staffId}`
          : "/api/v2/account/staff-permissions",
      ),
  });

  const staff = baseQuery.data?.data.staff ?? [];
  const modules = baseQuery.data?.data.modules ?? [];

  useEffect(() => {
    if (!modules.length) return;
    const next: Record<string, boolean> = {};
    for (const block of modules) {
      for (const item of block.items) {
        for (const action of ACTIONS) {
          next[`${item.short_code}_${action}`] = item[action];
        }
      }
    }
    setChecks(next);
  }, [modules, staffId]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const permissions = Object.entries(checks)
        .filter(([, on]) => on)
        .map(([key]) => key);
      return apiJson("/api/v2/account/staff-permissions", {
        method: "PUT",
        body: JSON.stringify({ staff_id: staffId, permissions }),
      });
    },
    onSuccess: () => {
      toast.success("Permissions saved");
      void queryClient.invalidateQueries({
        queryKey: ["staff-permissions", staffId],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Staff permissions"
        description="Assign menu permissions for HO, RO, and Surveyor (view / entry / edit / delete)"
      />
      <div className="mb-4 max-w-md space-y-1.5">
        <Label>Staff member</Label>
        <select
          className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={staffId}
          onChange={(e) =>
            setStaffId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">Select staff…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              [{s.type || "Staff"}] {s.first_name} {s.last_name} — {s.email}
            </option>
          ))}
        </select>
      </div>

      {staffId && baseQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading matrix…</p>
      ) : null}

      {staffId && modules.length > 0 ? (
        <div className="space-y-6">
          {modules.map((block) => (
            <div key={block.module} className="overflow-hidden rounded-xl border">
              <div className="bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                {block.module}
              </div>
              <div className="overflow-x-auto bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2 font-medium">Menu</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className="p-2 font-medium capitalize">
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-2 pl-6">{item.name}</td>
                        {ACTIONS.map((action) => {
                          const key = `${item.short_code}_${action}`;
                          return (
                            <td key={action} className="p-2">
                              <input
                                type="checkbox"
                                checked={!!checks[key]}
                                onChange={(e) =>
                                  setChecks((c) => ({
                                    ...c,
                                    [key]: e.target.checked,
                                  }))
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
          ))}
          <Button
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save permissions
          </Button>
        </div>
      ) : null}
    </>
  );
}
