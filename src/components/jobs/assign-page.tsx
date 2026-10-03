"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { WorkflowStrip } from "@/components/jobs/workflow-strip";
import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentModes, vehicleTypes } from "@/lib/jobs/schemas";
import { inspectPathForJob } from "@/lib/jobs/helpers";
import { LinkButton } from "@/components/ui/link-button";

type LookupItem = { id: number; name: string };
type VariantItem = LookupItem & {
  vehicle_type?: string;
  model_id: number;
  company_id: number;
};
type ModelItem = LookupItem & { company_id: number };

type JobRow = {
  id: number;
  status: string;
  dti_no: string | null;
  cname: string | null;
  mobileno: string | null;
  vehicleno: string | null;
  vehicle_type: string | null;
  bankname?: string;
  company?: string;
  model?: string;
  variant?: string;
  agent_name?: string;
  agent_id: number | null;
  bank_ref_no: string | null;
  cdate: string | null;
};

const emptyForm = {
  cdate: new Date().toISOString().slice(0, 10),
  cname: "",
  mobileno: "",
  address: "",
  mode: "Company" as (typeof paymentModes)[number],
  bank_id: "",
  bank_ref_no: "",
  vehicle_type: "4 Wheeler" as (typeof vehicleTypes)[number],
  vehicleno: "",
  company_id: "",
  model_id: "",
  variant_id: "",
  agent_id: "",
  remark: "",
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

type AssignPageProps = {
  /** fresh = unassigned list; schedule = assigned not inspected; assign = both + create */
  mode?: "assign" | "fresh" | "schedule";
};

export function AssignJobsPage({ mode = "assign" }: AssignPageProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [assignAgentId, setAssignAgentId] = useState<Record<number, string>>(
    {},
  );

  const listKey =
    mode === "fresh" ? "fresh" : mode === "schedule" ? "schedule" : "fresh";

  const listQuery = useQuery({
    queryKey: ["jobs", listKey],
    queryFn: async () => {
      const json = await apiJson<{ data: JobRow[] }>(
        `/api/v2/jobs?list=${listKey}&limit=100`,
      );
      return json.data;
    },
  });

  const scheduleQuery = useQuery({
    queryKey: ["jobs", "schedule"],
    queryFn: async () => {
      const json = await apiJson<{ data: JobRow[] }>(
        "/api/v2/jobs?list=schedule&limit=100",
      );
      return json.data;
    },
    enabled: mode === "assign",
  });

  const lookupsQuery = useQuery({
    queryKey: ["jobs-lookups", form.company_id, form.model_id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (form.company_id) params.set("company_id", form.company_id);
      if (form.model_id) params.set("model_id", form.model_id);
      const qs = params.toString();
      const json = await apiJson<{
        data: {
          banks: LookupItem[];
          companies: LookupItem[];
          models: ModelItem[];
          variants: VariantItem[];
          agents: LookupItem[];
        };
      }>(`/api/v2/jobs/lookups${qs ? `?${qs}` : ""}`);
      return json.data;
    },
  });

  const banks = lookupsQuery.data?.banks ?? [];
  const companies = lookupsQuery.data?.companies ?? [];
  const models = useMemo(
    () => lookupsQuery.data?.models ?? [],
    [lookupsQuery.data?.models],
  );
  const variants = useMemo(
    () => lookupsQuery.data?.variants ?? [],
    [lookupsQuery.data?.variants],
  );
  const agents = lookupsQuery.data?.agents ?? [];

  const createMutation = useMutation({
    mutationFn: async () =>
      apiJson("/api/v2/jobs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          bank_id: Number(form.bank_id),
          company_id: Number(form.company_id),
          model_id: Number(form.model_id),
          variant_id: Number(form.variant_id),
          agent_id: form.agent_id ? Number(form.agent_id) : null,
        }),
      }),
    onSuccess: () => {
      toast.success("Intimation created");
      setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      jobId,
      agentId,
    }: {
      jobId: number;
      agentId: number;
    }) =>
      apiJson(`/api/v2/jobs/${jobId}/assign`, {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId }),
      }),
    onSuccess: () => {
      toast.success("Status → assigned");
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const workflowMutation = useMutation({
    mutationFn: ({
      jobId,
      action,
    }: {
      jobId: number;
      action: "hold" | "cancel";
    }) =>
      apiJson(`/api/v2/jobs/${jobId}/workflow`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: (_d, vars) => {
      toast.success(vars.action === "hold" ? "Moved to Hold" : "Cancelled");
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const title =
    mode === "fresh"
      ? "Fresh Case"
      : mode === "schedule"
        ? "Assign Case"
        : "Create Intimation";

  const description =
    mode === "fresh"
      ? "status: fresh — assign a surveyor to move to assigned"
      : mode === "schedule"
        ? "status: assigned — upload images & submit inspection → qc_pending"
        : "Creates a case (status: fresh). Optionally assign surveyor now.";

  function renderTable(rows: JobRow[] | undefined, showAssign: boolean) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DTI</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No jobs
              </TableCell>
            </TableRow>
          ) : (
            (rows ?? []).map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.dti_no ?? job.id}</TableCell>
                <TableCell>
                  {job.cname}
                  <div className="text-xs text-muted-foreground">
                    {job.mobileno}
                  </div>
                </TableCell>
                <TableCell>
                  <RegPlate value={job.vehicleno} />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[job.company, job.model, job.variant]
                      .filter(Boolean)
                      .join(" / ")}
                  </div>
                </TableCell>
                <TableCell>{job.vehicle_type ?? "—"}</TableCell>
                <TableCell>
                  {job.bankname}
                  <div className="text-xs text-muted-foreground">
                    {job.bank_ref_no}
                  </div>
                </TableCell>
                <TableCell>{job.agent_name ?? "—"}</TableCell>
                <TableCell>
                  {(() => {
                    const pill = jobStatusPill(job.status);
                    return pill ? <StatusPill tone={pill.tone}>{pill.label}</StatusPill> : "—";
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    {showAssign && !job.agent_id ? (
                      <>
                        <select
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                          value={assignAgentId[job.id] ?? ""}
                          onChange={(e) =>
                            setAssignAgentId((s) => ({
                              ...s,
                              [job.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Agent…</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={
                            !assignAgentId[job.id] || assignMutation.isPending
                          }
                          onClick={() =>
                            assignMutation.mutate({
                              jobId: job.id,
                              agentId: Number(assignAgentId[job.id]),
                            })
                          }
                        >
                          Assign
                        </Button>
                      </>
                    ) : null}
                    <LinkButton
                      href={inspectPathForJob(job.id, job.vehicle_type)}
                      size="sm"
                      variant="outline"
                    >
                      {job.agent_id ? "Upload / Inspect" : "Inspect"}
                    </LinkButton>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={workflowMutation.isPending}
                      onClick={() =>
                        workflowMutation.mutate({
                          jobId: job.id,
                          action: "hold",
                        })
                      }
                    >
                      Hold
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={workflowMutation.isPending}
                      onClick={() => {
                        if (confirm("Cancel this case?")) {
                          workflowMutation.mutate({
                            jobId: job.id,
                            action: "cancel",
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    {job.agent_id ? (
                      <LinkButton
                        href={inspectPathForJob(job.id, job.vehicle_type, {
                          skipQc: true,
                        })}
                        size="sm"
                        variant="outline"
                      >
                        Skip QC
                      </LinkButton>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      <WorkflowStrip
        active={
          mode === "fresh"
            ? "fresh"
            : mode === "schedule"
              ? "assigned"
              : "fresh"
        }
      />

      {mode === "assign" ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New intimation</CardTitle>
            <CardDescription>
              Create a case and assign a surveyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.cdate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cdate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Customer name</Label>
                <Input
                  value={form.cname}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cname: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile</Label>
                <Input
                  value={form.mobileno}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mobileno: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bank</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.bank_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bank_id: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Bank ref no</Label>
                <Input
                  value={form.bank_ref_no}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bank_ref_no: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.mode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      mode: e.target.value as (typeof paymentModes)[number],
                    }))
                  }
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.vehicle_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vehicle_type: e.target
                        .value as (typeof vehicleTypes)[number],
                    }))
                  }
                >
                  {vehicleTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle no</Label>
                <Input
                  value={form.vehicleno}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicleno: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.company_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      company_id: e.target.value,
                      model_id: "",
                      variant_id: "",
                    }))
                  }
                >
                  <option value="">Select…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.model_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      model_id: e.target.value,
                      variant_id: "",
                    }))
                  }
                >
                  <option value="">Select…</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Variant</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.variant_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, variant_id: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Agent (optional)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={form.agent_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agent_id: e.target.value }))
                  }
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>Remark</Label>
                <Textarea
                  value={form.remark}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remark: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button
              className="mt-4"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Saving…" : "Create intimation"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {mode === "schedule" ? "Pending inspection" : "Unassigned / Fresh"}
          </CardTitle>
          <CardDescription>
            {listQuery.isLoading ? "Loading…" : `${listQuery.data?.length ?? 0} rows`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isError ? (
            <p className="text-sm text-destructive">
              {(listQuery.error as Error).message}
            </p>
          ) : (
            renderTable(listQuery.data, mode !== "schedule")
          )}
        </CardContent>
      </Card>

      {mode === "assign" ? (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled (assigned, not inspected)</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTable(scheduleQuery.data, false)}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
