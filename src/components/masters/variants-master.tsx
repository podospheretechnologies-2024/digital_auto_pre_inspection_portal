"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { vehicleTypes } from "@/lib/masters/schemas";

type Company = { id: number; name: string };
type ModelOption = { id: number; name: string };
type VariantRow = {
  id: number;
  name: string;
  company_id: number;
  model_id: number;
  vehicle_type: string;
  company_name?: string;
  model_name?: string;
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

export function VariantsMasterPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [modelId, setModelId] = useState("");
  const [vehicleType, setVehicleType] = useState<(typeof vehicleTypes)[number]>(
    "4 Wheeler",
  );
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

  const modelsQuery = useQuery({
    queryKey: ["masters-models-by-company", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const json = await apiJson<{ data: ModelOption[] }>(
        `/api/v2/masters/models?company_id=${companyId}`,
      );
      return json.data;
    },
  });

  useEffect(() => {
    if (!open) return;
    // keep model if still valid when company changes
  }, [companyId, open]);

  const listQuery = useQuery({
    queryKey: ["masters-variants"],
    queryFn: async () => {
      const json = await apiJson<{ data: VariantRow[] }>(
        "/api/v2/masters/variants",
      );
      return json.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        company_id: Number(companyId),
        model_id: Number(modelId),
        vehicle_type: vehicleType,
        ...(editingId ? { id: editingId } : {}),
      };
      return apiJson("/api/v2/masters/variants", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      notice.success(editingId ? "Variant updated" : "Variant created");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["masters-variants"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiJson("/api/v2/masters/variants", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: async () => {
      notice.success("Variant deleted");
      await queryClient.invalidateQueries({ queryKey: ["masters-variants"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        title="Variants"
        description="Company → Model → Variant (m_variant)"
        actions={
          <Button
            onClick={() => {
              setEditingId(null);
              setName("");
              setCompanyId("");
              setModelId("");
              setVehicleType("4 Wheeler");
              setOpen(true);
            }}
          >
            Add variant
          </Button>
        }
      />

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Variant list</CardTitle>
          <CardDescription>Includes vehicle type</CardDescription>
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
                  <TableHead>Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.company_name}</TableCell>
                    <TableCell>{row.model_name}</TableCell>
                    <TableCell>{row.vehicle_type}</TableCell>
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
                            setModelId(String(row.model_id));
                            setVehicleType(
                              row.vehicle_type as (typeof vehicleTypes)[number],
                            );
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
            <DialogTitle>
              {editingId ? "Edit variant" : "Add variant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <select
                id="company"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setModelId("");
                }}
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
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                disabled={!companyId}
              >
                <option value="">Select model</option>
                {(modelsQuery.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_type">Vehicle type</Label>
              <select
                id="vehicle_type"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={vehicleType}
                onChange={(e) =>
                  setVehicleType(e.target.value as (typeof vehicleTypes)[number])
                }
              >
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Variant name</Label>
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
              disabled={
                !name.trim() ||
                !companyId ||
                !modelId ||
                saveMutation.isPending
              }
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
        title={editingId ? "Save this variant?" : "Save new variant?"}
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
        title="Delete variant?"
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
