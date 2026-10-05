"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

type BankRow = {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  emailid: string;
  pincode: string;
  ifsc: string;
};

const emptyForm = {
  name: "",
  contact_person: "",
  phone: "",
  emailid: "",
  pincode: "",
  ifsc: "",
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
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

export function BanksMasterPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const listQuery = useQuery({
    queryKey: ["masters-banks"],
    queryFn: async () => {
      const json = await apiJson<{ data: BankRow[] }>("/api/v2/masters/banks");
      return json.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return apiJson("/api/v2/masters/banks", {
          method: "PUT",
          body: JSON.stringify({ id: editingId, ...form }),
        });
      }
      return apiJson("/api/v2/masters/banks", {
        method: "POST",
        body: JSON.stringify(form),
      });
    },
    onSuccess: async () => {
      toast.success(editingId ? "Bank updated" : "Bank created");
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["masters-banks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiJson("/api/v2/masters/banks", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: async () => {
      toast.success("Bank deleted");
      await queryClient.invalidateQueries({ queryKey: ["masters-banks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        title="Banks"
        description="Master list of banks"
        actions={
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            Add bank
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Bank list</CardTitle>
          <CardDescription>Create, edit, and delete banks.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">
              {(listQuery.error as Error).message}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IFSC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.contact_person}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.emailid}</TableCell>
                    <TableCell>{row.ifsc}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(row.id);
                          setForm({
                            name: row.name,
                            contact_person: row.contact_person,
                            phone: row.phone,
                            emailid: row.emailid,
                            pincode: row.pincode,
                            ifsc: row.ifsc,
                          });
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setDeleteTarget({ id: row.id, name: row.name })
                        }
                      >
                        Delete
                      </Button>
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
            <DialogTitle>{editingId ? "Edit bank" : "Add bank"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Bank name"],
                ["contact_person", "Contact person"],
                ["phone", "Phone"],
                ["emailid", "Email"],
                ["pincode", "Pincode"],
                ["ifsc", "IFSC"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="danger"
        title="Delete bank?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
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
