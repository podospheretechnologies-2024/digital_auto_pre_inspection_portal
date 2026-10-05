"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Pencil, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RegPlate } from "@/components/atlas/reg-plate";
import {
  JobActionButton,
  JobActionLink,
  JobActions,
  JobDtiCell,
  JobMetaLine,
  JobSerialCell,
  JobSerialHead,
  JobsListingCard,
  JobsTable,
  JobsTableCell,
  JobsTableHead,
  JobsTableHeader,
  JobsTableRow,
  TableBody,
} from "@/components/jobs/jobs-listing";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  inspectPathForJob,
  pdfPathForInspection,
  formatDeskDate,
  type WheelKind,
} from "@/lib/jobs/helpers";

type QcRow = {
  id: number;
  job_id: number | null;
  vehicle_type: WheelKind;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  bankname: string;
  company: string;
  model: string;
  agent_name: string;
  remarks: string | null;
  valuation_price: number | null;
  ownership_name: string | null;
  created_at: string | null;
  qc_datetime?: string | null;
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

export function QcJobsPage() {
  const queryClient = useQueryClient();
  const [vehicleType, setVehicleType] = useState<string>("all");
  const [active, setActive] = useState<QcRow | null>(null);
  const [form, setForm] = useState({
    remarks: "",
    valuation_price: "",
    ownership_name: "",
  });

  const listQuery = useQuery({
    queryKey: ["jobs-qc", vehicleType],
    queryFn: async () => {
      const json = await apiJson<{ data: QcRow[] }>(
        `/api/v2/jobs/qc?vehicle_type=${vehicleType}`,
      );
      return json.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("No row selected");
      return apiJson("/api/v2/jobs/qc", {
        method: "POST",
        body: JSON.stringify({
          inspection_id: active.id,
          vehicle_type: active.vehicle_type,
          remarks: form.remarks,
          valuation_price: Number(form.valuation_price),
          ownership_name: form.ownership_name,
        }),
      });
    },
    onSuccess: () => {
      toast.success("QC submitted");
      setActive(null);
      void queryClient.invalidateQueries({ queryKey: ["jobs-qc"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = listQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Quality Check"
        description="Review submitted inspections. Mark complete, put on hold, or send back if needed."
        eyebrow="Workflow"
        badge="QC queue"
      />

      <JobsListingCard
        className="mb-6"
        title="QC queue"
        description="Inspections waiting for quality check"
        count={rows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty="No pending QC cases"
        toolbar={
          <select
            className="h-8 rounded-md border border-border bg-background px-2.5 text-[12px]"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="2wheeler">2 Wheeler</option>
            <option value="3wheeler">3 Wheeler</option>
            <option value="4wheeler">4 Wheeler</option>
          </select>
        }
      >
        {rows.length > 0 ? (
          <JobsTable>
            <JobsTableHeader>
              <JobsTableRow>
                <JobSerialHead />
                <JobsTableHead>Type</JobsTableHead>
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Agent</JobsTableHead>
                <JobsTableHead>Date</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <JobsTableRow key={`${row.vehicle_type}-${row.id}`}>
                  <JobSerialCell index={index} />
                  <JobsTableCell>
                    <Badge variant="outline" className="font-normal">
                      {row.vehicle_type}
                    </Badge>
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobDtiCell value={row.dti_no} />
                  </JobsTableCell>
                  <JobsTableCell className="font-medium">
                    {row.cname ?? "—"}
                  </JobsTableCell>
                  <JobsTableCell>
                    <RegPlate value={row.vehicleno} />
                    <JobMetaLine>
                      {[row.company, row.model, row.bankname]
                        .filter(Boolean)
                        .join(" · ")}
                    </JobMetaLine>
                  </JobsTableCell>
                  <JobsTableCell>{row.agent_name}</JobsTableCell>
                  <JobsTableCell className="tabular-nums text-muted-foreground">
                    {formatDeskDate(row.created_at)}
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      {row.job_id ? (
                        <>
                          <JobActionLink
                            href={inspectPathForJob(
                              row.job_id,
                              row.vehicle_type,
                              { mode: "view" },
                            )}
                            tone="outline"
                            icon={Eye}
                            label="Open"
                          />
                          <JobActionLink
                            href={inspectPathForJob(
                              row.job_id,
                              row.vehicle_type,
                              { mode: "edit" },
                            )}
                            tone="muted"
                            icon={Pencil}
                            label="Edit"
                          />
                          <JobActionLink
                            href={pdfPathForInspection(
                              row.vehicle_type,
                              row.id,
                            )}
                            tone="muted"
                            icon={FileText}
                            label="PDF"
                          />
                        </>
                      ) : null}
                      <JobActionButton
                        tone="primary"
                        icon={ShieldCheck}
                        label="QC"
                        onClick={() => {
                          setActive(row);
                          setForm({
                            remarks: row.remarks ?? "",
                            valuation_price: String(
                              row.valuation_price ?? "",
                            ),
                            ownership_name: row.ownership_name ?? "",
                          });
                        }}
                      />
                    </JobActions>
                  </JobsTableCell>
                </JobsTableRow>
              ))}
            </TableBody>
          </JobsTable>
        ) : null}
      </JobsListingCard>

      {active ? (
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="border-b border-border/70 bg-muted/20 px-4 py-3">
            <CardTitle className="text-[15px]">
              Submit QC — {active.vehicle_type} #{active.id}
            </CardTitle>
            <CardDescription className="text-[12px]">
              Approve QC with remarks, valuation price, and ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-xl gap-3 p-4">
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remarks: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valuation price</Label>
              <Input
                type="number"
                value={form.valuation_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valuation_price: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ownership name</Label>
              <Input
                value={form.ownership_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ownership_name: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="h-9 shadow-none"
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? "Saving…" : "Approve QC"}
              </Button>
              <Button
                variant="outline"
                className="h-9 shadow-none"
                onClick={() => setActive(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
