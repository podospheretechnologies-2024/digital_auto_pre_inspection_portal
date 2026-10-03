"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
  phone: string | null;
  verified_at: string | null;
  is_online: number;
};

type Lookup = { id: number; name: string };

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  email: "",
  role: "" as "" | PersonRole,
  password: "",
  password_confirmation: "",
};

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
  addLabel: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [form, setForm] = useState(emptyForm);

  const listQuery = useQuery({
    queryKey: [queryKey],
    queryFn: () =>
      apiJson<{ data: Row[]; lookups: { cities: Lookup[] } }>(apiPath),
  });

  const cities = listQuery.data?.lookups.cities ?? [];
  const rows = listQuery.data?.data ?? [];

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
      password: "",
      password_confirmation: "",
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const role = form.role || defaultRole;
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
          }),
        });
      }
      return apiJson(apiPath, {
        method: "POST",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          city: Number(form.city),
          email: form.email,
          role,
          password: form.password,
          password_confirmation: form.password_confirmation,
        }),
      });
    },
    onSuccess: async () => {
      toast.success(editingId ? "Updated" : "Created");
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
      toast.success("Deleted");
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
    onSuccess: () => {
      toast.success("Password updated");
      setPwdId(null);
      setPassword("");
      setPasswordConfirmation("");
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
    (editingId ||
      (form.password &&
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
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.city ?? "—"}</TableCell>
                  <TableCell>{row.phone ?? "—"}</TableCell>
                  {showApprove ? (
                    <TableCell>
                      {row.verified_at ? (
                        <StatusPill tone="ok">Verified</StatusPill>
                      ) : (
                        <StatusPill tone="warn">Pending</StatusPill>
                      )}
                    </TableCell>
                  ) : null}
                  {showOnline ? (
                    <TableCell>{row.is_online ? "Yes" : "No"}</TableCell>
                  ) : null}
                  <TableCell className="space-x-1 text-right">
                    {showApprove && !row.verified_at ? (
                      <Button
                        size="sm"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(row.id)}
                      >
                        Approve
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </Button>
                    {defaultRole === "HO" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPwdId(row.id)}
                      >
                        Password
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            `Delete ${row.first_name} ${row.last_name}?`,
                          )
                        ) {
                          deleteMutation.mutate(row.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  value={form.role || defaultRole}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as PersonRole,
                    }))
                  }
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
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
              onClick={() => saveMutation.mutate()}
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
            <DialogTitle>Change password</DialogTitle>
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
    </>
  );
}
