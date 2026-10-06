"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  CrudActionButton,
  CrudActionGroup,
} from "@/components/ui/crud-action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type BankUserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  city_id: number | null;
  bank_id: number | null;
  city: string;
  bank: string;
  phone: string | null;
};

type Lookup = { id: number; name: string };

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  bank: "",
  email: "",
  password: "",
  password_confirmation: "",
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export function BankUsersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const listQuery = useQuery({
    queryKey: ["account-bank-users"],
    queryFn: async () => {
      const json = await apiJson<{
        data: BankUserRow[];
        lookups: { banks: Lookup[]; cities: Lookup[] };
      }>("/api/v2/account/bank-users");
      return json;
    },
  });

  const banks = listQuery.data?.lookups.banks ?? [];
  const cities = listQuery.data?.lookups.cities ?? [];

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: BankUserRow) {
    setEditingId(row.id);
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone ?? "",
      city: row.city_id != null ? String(row.city_id) : "",
      bank: row.bank_id != null ? String(row.bank_id) : "",
      email: row.email,
      password: "",
      password_confirmation: "",
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return apiJson("/api/v2/account/bank-users", {
          method: "PUT",
          body: JSON.stringify({
            id: editingId,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            city: Number(form.city),
            bank: Number(form.bank),
            email: form.email,
          }),
        });
      }
      return apiJson("/api/v2/account/bank-users", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          city: Number(form.city),
          bank: Number(form.bank),
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
        }),
      });
    },
    onSuccess: async () => {
      toast.success(editingId ? "Bank user updated" : "Bank user created");
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({
        queryKey: ["account-bank-users"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiJson("/api/v2/account/bank-users", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: async () => {
      toast.success("Bank user deleted");
      await queryClient.invalidateQueries({
        queryKey: ["account-bank-users"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.phone.trim() &&
    form.city &&
    form.bank &&
    form.email.trim() &&
    (editingId ||
      (form.password &&
        form.password_confirmation &&
        form.password === form.password_confirmation)) &&
    !saveMutation.isPending;

  return (
    <>
      <PageHeader
        title="Bank users"
        description="HO admin management of bank users"
        actions={<Button onClick={openCreate}>Add bank user</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Requires bank_user_view permission (admins always allowed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">
              {(listQuery.error as Error).message}
            </p>
          ) : (listQuery.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No bank users.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data?.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.first_name} {row.last_name}
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phone || "—"}</TableCell>
                    <TableCell>{row.bank}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell className="text-right">
                      <CrudActionGroup>
                        <CrudActionButton
                          tone="edit"
                          icon={Pencil}
                          label="Edit"
                          onClick={() => openEdit(row)}
                        />
                        <CrudActionButton
                          tone="delete"
                          icon={Trash2}
                          label="Delete"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete ${row.first_name} ${row.last_name}?`,
                              )
                            ) {
                              deleteMutation.mutate(row.id);
                            }
                          }}
                        />
                      </CrudActionGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit bank user" : "Add bank user"}
            </DialogTitle>
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
              <Label>Bank</Label>
              <select
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.bank}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bank: e.target.value }))
                }
              >
                <option value="">Select</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>City</Label>
              <select
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
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
    </>
  );
}
