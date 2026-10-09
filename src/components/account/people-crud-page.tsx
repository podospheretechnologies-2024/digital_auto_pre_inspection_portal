"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  KeyRound,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toast as notice } from "@/lib/toast";

import { StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CrudActionButton,
  CrudActionGroup,
} from "@/components/ui/crud-action-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PersonRole } from "@/lib/account/schemas";

type Row = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: PersonRole;
  type: string | null;
  city: string | null;
  city_id: number | null;
  parent_id: number | null;
  parent_name: string | null;
  phone: string | null;
  verified_at: string | null;
  status: string | null;
  is_online: number;
};

function isInactiveStatus(status: string | null | undefined) {
  const value = String(status ?? "Active").trim().toLowerCase();
  return value === "inactive" || value === "0";
}

type Lookup = { id: number; name: string; city_id?: number | null };

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  email: "",
  role: "" as "" | PersonRole,
  parent_id: "",
  password: "",
  password_confirmation: "",
};

/** Theme-aware <select> styling (works in both light and dark mode) */
const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) {
    const firstError =
      json.errors &&
      Object.values(json.errors as Record<string, string[]>)
        .flat()
        .find(Boolean);
    throw new Error(firstError || json.message || "Request failed");
  }
  return json as T;
}

export function PeopleCrudPage({
  title,
  description,
  apiPath,
  queryKey,
  roleOptions,
  defaultRole,
  showApprove,
  showOnline,
  showResetPassword,
  showDeactivate,
  addLabel,
}: {
  title: string;
  description: string;
  apiPath: string;
  queryKey: string;
  roleOptions: PersonRole[];
  defaultRole: PersonRole;
  showApprove?: boolean;
  showOnline?: boolean;
  showResetPassword?: boolean;
  showDeactivate?: boolean;
  addLabel: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: number;
    name: string;
    next: "Active" | "Inactive";
  } | null>(null);
  const [approveTarget, setApproveTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const canResetPassword = Boolean(showResetPassword || defaultRole === "HO");
  const isHoStaff = defaultRole === "HO";
  /** Hide empty Parent RO column on HO Staff only */
  const showParentRoColumn = !isHoStaff;

  const listQuery = useQuery({
    queryKey: [queryKey],
    queryFn: () =>
      apiJson<{
        data: Row[];
        lookups: { cities: Lookup[]; ros?: Lookup[] };
      }>(apiPath),
  });

  const cities = listQuery.data?.lookups.cities ?? [];
  const ros = listQuery.data?.lookups.ros ?? [];
  const rows = listQuery.data?.data ?? [];
  const selectedRole = (form.role || defaultRole) as PersonRole;
  const needsParentRo =
    roleOptions.includes("Surveyor") && selectedRole === "Surveyor";

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, role: defaultRole });
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditingId(row.id);
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone ?? "",
      city: row.city_id != null ? String(row.city_id) : "",
      email: row.email,
      role: row.role,
      parent_id: row.parent_id != null ? String(row.parent_id) : "",
      password: "",
      password_confirmation: "",
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const role = form.role || defaultRole;
      const parentPayload =
        role === "Surveyor"
          ? { parent_id: form.parent_id ? Number(form.parent_id) : null }
          : { parent_id: null };
      if (editingId) {
        return apiJson(apiPath, {
          method: "PUT",
          body: JSON.stringify({
            id: editingId,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            city: Number(form.city),
            email: form.email,
            role,
            ...parentPayload,
          }),
        });
      }
      return apiJson<{ message?: string }>(apiPath, {
        method: "POST",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          city: Number(form.city),
          email: form.email,
          role,
          ...parentPayload,
          password: form.password,
          password_confirmation: form.password_confirmation,
        }),
      });
    },
    onSuccess: async (res) => {
      const msg = (res as { message?: string })?.message;
      notice.success(
        editingId
          ? "Updated"
          : msg ||
              (showApprove
                ? "Created — approve before login"
                : "Created"),
      );
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiJson(apiPath, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: async () => {
      notice.success("Deleted");
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMutation = useMutation({
    mutationFn: (agent_id: number) =>
      apiJson(apiPath, {
        method: "POST",
        body: JSON.stringify({ agent_id }),
      }),
    onSuccess: async () => {
      toast.success("Approved");
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pwdMutation = useMutation({
    mutationFn: () =>
      apiJson(apiPath, {
        method: "PUT",
        body: JSON.stringify({
          staff_id: pwdId,
          password,
          password_confirmation: passwordConfirmation,
        }),
      }),
    onSuccess: async () => {
      toast.success("Password updated");
      setPwdId(null);
      setPassword("");
      setPasswordConfirmation("");
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: "Active" | "Inactive" }) =>
      apiJson(apiPath, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: async (_res, vars) => {
      notice.success(
        vars.status === "Inactive" ? "Deactivated" : "Activated",
      );
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.phone.trim() &&
    form.city &&
    form.email.trim() &&
    (form.role || defaultRole) &&
    (!needsParentRo || form.parent_id) &&
    (editingId ||
      (form.password.length >= 8 &&
        form.password_confirmation &&
        form.password === form.password_confirmation)) &&
    !saveMutation.isPending;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={<Button onClick={openCreate}>{addLabel}</Button>}
      />

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : listQuery.isError ? (
        <p className="text-sm text-destructive">
          {(listQuery.error as Error).message}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {!isHoStaff ? <TableHead>Role</TableHead> : null}
                {showParentRoColumn ? <TableHead>Parent RO</TableHead> : null}
                <TableHead>City</TableHead>
                <TableHead>Phone</TableHead>
                {showApprove ? <TableHead>Status</TableHead> : null}
                {showOnline ? <TableHead>Online</TableHead> : null}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.first_name} {row.last_name}
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  {!isHoStaff ? <TableCell>{row.role}</TableCell> : null}
                  {showParentRoColumn ? (
                    <TableCell>
                      {row.role === "Surveyor"
                        ? (row.parent_name ?? "—")
                        : "—"}
                    </TableCell>
                  ) : null}
                  <TableCell>{row.city ?? "—"}</TableCell>
                  <TableCell>{row.phone ?? "—"}</TableCell>
                  {showApprove ? (
                    <TableCell>
                      {isInactiveStatus(row.status) ? (
                        <StatusPill tone="bad">Inactive</StatusPill>
                      ) : row.verified_at ? (
                        <StatusPill tone="ok">Verified</StatusPill>
                      ) : (
                        <StatusPill tone="warn">Pending</StatusPill>
                      )}
                    </TableCell>
                  ) : null}
                  {showOnline ? (
                    <TableCell>
                      {isHoStaff ? (
                        row.is_online ? (
                          <StatusPill tone="ok">Online</StatusPill>
                        ) : (
                          <StatusPill tone="neutral">Offline</StatusPill>
                        )
                      ) : row.is_online ? (
                        "Yes"
                      ) : (
                        "No"
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <CrudActionGroup>
                      {showApprove &&
                      !row.verified_at &&
                      !isInactiveStatus(row.status) ? (
                        <CrudActionButton
                          tone="approve"
                          icon={CheckCircle2}
                          label="Approve"
                          disabled={approveMutation.isPending}
                          onClick={() =>
                            setApproveTarget({
                              id: row.id,
                              name: `${row.first_name} ${row.last_name}`.trim(),
                            })
                          }
                        />
                      ) : null}
                      <CrudActionButton
                        tone="edit"
                        icon={Pencil}
                        label="Edit"
                        onClick={() => openEdit(row)}
                      />
                      {canResetPassword ? (
                        <CrudActionButton
                          tone="password"
                          icon={KeyRound}
                          label="Reset Password"
                          onClick={() => setPwdId(row.id)}
                        />
                      ) : null}
                      {showDeactivate ? (
                        <CrudActionButton
                          tone={
                            isInactiveStatus(row.status)
                              ? "activate"
                              : "deactivate"
                          }
                          icon={
                            isInactiveStatus(row.status) ? Power : Ban
                          }
                          label={
                            isInactiveStatus(row.status)
                              ? "Activate"
                              : "Deactivate"
                          }
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            setDeactivateTarget({
                              id: row.id,
                              name: `${row.first_name} ${row.last_name}`.trim(),
                              next: isInactiveStatus(row.status)
                                ? "Active"
                                : "Inactive",
                            })
                          }
                        />
                      ) : null}
                      <CrudActionButton
                        tone="delete"
                        icon={Trash2}
                        label="Delete"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          setDeleteTarget({
                            id: row.id,
                            name: `${row.first_name} ${row.last_name}`.trim(),
                          })
                        }
                      />
                    </CrudActionGroup>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      5 +
                      (isHoStaff ? 0 : 1) +
                      (showParentRoColumn ? 1 : 0) +
                      (showApprove ? 1 : 0) +
                      (showOnline ? 1 : 0)
                    }
                    className="text-center text-muted-foreground"
                  >
                    No records.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit user" : addLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <select
                className={selectClass}
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              >
                <option value="">Select</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {roleOptions.length > 1 ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Role</Label>
                <select
                  className={selectClass}
                  value={form.role || defaultRole}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as PersonRole,
                      parent_id:
                        e.target.value === "Surveyor" ? f.parent_id : "",
                    }))
                  }
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r === "RO" ? "1. RO (create first)" : "2. Surveyor (link to RO)"}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {needsParentRo ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Parent RO</Label>
                <select
                  className={selectClass}
                  value={form.parent_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parent_id: e.target.value }))
                  }
                >
                  <option value="">Select verified RO…</option>
                  {ros.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {ros.length === 0 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No verified RO found. Create and Approve an RO first.
                  </p>
                ) : null}
              </div>
            ) : null}
            {!editingId ? (
              <>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                  {isHoStaff ? (
                    <p className="text-[11px] text-muted-foreground">
                      At least 8 characters
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        password_confirmation: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => setConfirmSave(true)}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pwdId != null}
        onOpenChange={(v) => {
          if (!v) setPwdId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showResetPassword ? "Reset password" : "Change password"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm</Label>
              <Input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdId(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                !password ||
                password.length < 6 ||
                password !== passwordConfirmation ||
                pwdMutation.isPending
              }
              onClick={() => pwdMutation.mutate()}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title={editingId ? "Save these changes?" : "Save this user?"}
        description="The record will be saved after you confirm."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={saveMutation.isPending}
        onConfirm={() => {
          setConfirmSave(false);
          saveMutation.mutate();
        }}
      />

      <ConfirmDialog
        open={approveTarget != null}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
        tone="default"
        title="Approve user?"
        description={
          approveTarget
            ? `“${approveTarget.name}” will be approved and can log in.`
            : undefined
        }
        confirmLabel="Approve"
        loading={approveMutation.isPending}
        onConfirm={() => {
          if (!approveTarget) return;
          approveMutation.mutate(approveTarget.id, {
            onSettled: () => setApproveTarget(null),
          });
        }}
      />

      <ConfirmDialog
        open={deactivateTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        tone={deactivateTarget?.next === "Inactive" ? "danger" : "default"}
        title={
          deactivateTarget?.next === "Inactive"
            ? "Deactivate user?"
            : "Activate user?"
        }
        description={
          deactivateTarget
            ? deactivateTarget.next === "Inactive"
              ? `“${deactivateTarget.name}” will be deactivated and cannot log in.`
              : `“${deactivateTarget.name}” will be activated and can log in again (if verified).`
            : undefined
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={statusMutation.isPending}
        onConfirm={() => {
          if (!deactivateTarget) return;
          statusMutation.mutate(
            { id: deactivateTarget.id, status: deactivateTarget.next },
            { onSettled: () => setDeactivateTarget(null) },
          );
        }}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="danger"
        title="Delete user?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          });
        }}
      />
    </>
  );
}