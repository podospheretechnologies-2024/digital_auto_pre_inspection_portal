"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toast as notice } from "@/lib/toast";

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

type Company = { id: number; name: string };
type ModelRow = {
  id: number;
  name: string;
  company_id: number;
  company_name?: string;
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

export function ModelsMasterPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["masters-companies"],
    queryFn: async () => {
      const json = await apiJson<{ data: Company[] }>(
        "/api/v2/masters/companies",
      );
      return json.data;
    },
  });

  const listQuery = useQuery({
    queryKey: ["masters-models"],
    queryFn: async () => {
      const json = await apiJson<{ data: ModelRow[] }>("/api/v2/masters/models");
      return json.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        company_id: Number(companyId),
        ...(editingId ? { id: editingId } : {}),
      };
      return apiJson("/api/v2/masters/models", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      notice.success(editingId ? "Model updated" : "Model created");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["masters-models"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiJson("/api/v2/masters/models", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: async () => {
      notice.success("Model deleted");
      await queryClient.invalidateQueries({ queryKey: ["masters-models"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        title="Models"
        description="Vehicle models linked to company (m_model)"
        actions={
          <Button
            onClick={() => {
              setEditingId(null);
              setName("");
              setCompanyId("");
              setOpen(true);
            }}
          >
            Add model
          </Button>
        }
      />

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Model list</CardTitle>
          <CardDescription>Company → Model hierarchy</CardDescription>
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
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.company_name}</TableCell>
                    <TableCell className="text-right">
                      <CrudActionGroup>
                        <CrudActionButton
                          tone="edit"
                          icon={Pencil}
                          label="Edit"
                          onClick={() => {
                            setEditingId(row.id);
                            setName(row.name);
                            setCompanyId(String(row.company_id));
                            setOpen(true);
                          }}
                        />
                        <CrudActionButton
                          tone="delete"
                          icon={Trash2}
                          label="Delete"
                          onClick={() =>
                            setDeleteTarget({ id: row.id, name: row.name })
                          }
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit model" : "Add model"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <select
                id="company"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Select company</option>
                {(companiesQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Model name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || !companyId || saveMutation.isPending}
              onClick={() => setConfirmSave(true)}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title={editingId ? "Save this model?" : "Save new model?"}
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
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="danger"
        title="Delete model?"
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
