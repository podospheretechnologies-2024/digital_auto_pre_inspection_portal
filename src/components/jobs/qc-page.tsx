"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { WorkflowStrip } from "@/components/jobs/workflow-strip";
import { RegPlate } from "@/components/atlas/reg-plate";
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
import { LinkButton } from "@/components/ui/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  inspectPathForJob,
  pdfPathForInspection,
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

  return (
    <>
      <PageHeader
        title="Quality Check"
        description="status: qc_pending — review, complete → completed, or Hold"
      />
      <WorkflowStrip active="qc_pending" />

      <Card className="mb-6">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>QC queue</CardTitle>
            <CardDescription>
              Inspections waiting for quality check
            </CardDescription>
          </div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="2wheeler">2 Wheeler</option>
            <option value="3wheeler">3 Wheeler</option>
            <option value="4wheeler">4 Wheeler</option>
          </select>
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
                  <TableHead>Type</TableHead>
                  <TableHead>DTI</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No pending QC
                    </TableCell>
                  </TableRow>
                ) : (
                  (listQuery.data ?? []).map((row) => (
                    <TableRow key={`${row.vehicle_type}-${row.id}`}>
                      <TableCell>
                        <Badge variant="outline">{row.vehicle_type}</Badge>
                      </TableCell>
                      <TableCell>{row.dti_no ?? "—"}</TableCell>
                      <TableCell>{row.cname ?? "—"}</TableCell>
                      <TableCell>
                        <RegPlate value={row.vehicleno} />
                        <div className="text-xs text-muted-foreground">
                          {[row.company, row.model, row.bankname]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="space-x-2">
                        {row.job_id ? (
                          <>
                            <LinkButton
                              href={inspectPathForJob(
                                row.job_id,
                                row.vehicle_type,
                                { mode: "edit" },
                              )}
                              size="sm"
                              variant="outline"
                            >
                              Edit
                            </LinkButton>
                            <LinkButton
                              href={pdfPathForInspection(
                                row.vehicle_type,
                                row.id,
                              )}
                              size="sm"
                              variant="outline"
                            >
                              PDF
                            </LinkButton>
                          </>
                        ) : null}
                        <Button
                          size="sm"
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
                        >
                          QC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {active ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Submit QC — {active.vehicle_type} #{active.id}
            </CardTitle>
            <CardDescription>
              Sets qc=1, stores remarks / price / ownership (PI inspection row)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-xl gap-3">
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
              <Label>Valuation price (on inspection)</Label>
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
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? "Saving…" : "Approve QC"}
              </Button>
              <Button variant="outline" onClick={() => setActive(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
