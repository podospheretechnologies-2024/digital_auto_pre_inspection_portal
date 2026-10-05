"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Building2,
  CarFront,
  Check,
  CirclePause,
  ClipboardCheck,
  ClipboardPlus,
  FastForward,
  FileDigit,
  Loader2,
  RotateCcw,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { paymentModes, vehicleTypes } from "@/lib/jobs/schemas";
import { formatDeskDate, inspectPathForJob } from "@/lib/jobs/helpers";
import { cn } from "@/lib/utils";

type LookupItem = { id: number; name: string };
type AgentItem = LookupItem & {
  type?: string | null;
  email?: string | null;
  city_id?: number | null;
  parent_id?: number | null;
};
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
  created_at: string | null;
  assigned_at?: string | null;
  hold_at?: string | null;
  cancelled_at?: string | null;
};

/** Keep outside page component so inputs don't remount (and lose focus) on each keystroke. */
function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
        <Icon className="size-3.5 text-primary" />
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

const createEmptyForm = () => ({
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
  remark: "",
});

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as {
    message?: string;
    errors?: Record<string, string[] | undefined>;
  } & T;
  if (!res.ok) {
    const fieldErrors = json.errors
      ? Object.entries(json.errors)
          .flatMap(([key, msgs]) =>
            (msgs ?? []).map((m) => `${key}: ${m}`),
          )
          .join("; ")
      : "";
    throw new Error(fieldErrors || json.message || "Request failed");
  }
  return json as T;
}

type AssignPageProps = {
  /** fresh = unassigned list; schedule = assigned not inspected; assign = both + create */
  mode?: "assign" | "fresh" | "schedule";
};

export function AssignJobsPage({ mode = "assign" }: AssignPageProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(createEmptyForm);
  const [assignJob, setAssignJob] = useState<JobRow | null>(null);
  const [selectedRoId, setSelectedRoId] = useState("");
  const [selectedSurveyorId, setSelectedSurveyorId] = useState("");
  const [createdCase, setCreatedCase] = useState<{
    id: number;
    dti_no: string;
    cname: string | null;
    vehicleno: string;
  } | null>(null);
  const [cancelJobId, setCancelJobId] = useState<number | null>(null);
  const [holdJobId, setHoldJobId] = useState<number | null>(null);

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
    enabled: mode !== "assign",
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
          agents: AgentItem[];
        };
      }>(`/api/v2/jobs/lookups${qs ? `?${qs}` : ""}`);
      return json.data;
    },
    // Keep previous dropdown options while cascading — avoids flicker / focus jank
    placeholderData: (previous) => previous,
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
  const roAgents = useMemo(
    () => agents.filter((a) => a.type === "RO"),
    [agents],
  );
  const selectedRo = useMemo(
    () => roAgents.find((a) => String(a.id) === selectedRoId) ?? null,
    [roAgents, selectedRoId],
  );
  const surveyorsUnderRo = useMemo(() => {
    if (!selectedRo) return [];
    return agents.filter(
      (a) =>
        a.type === "Surveyor" &&
        a.parent_id != null &&
        a.parent_id === selectedRo.id,
    );
  }, [agents, selectedRo]);

  const closeAssignDialog = () => {
    setAssignJob(null);
    setSelectedRoId("");
    setSelectedSurveyorId("");
  };
  const createMutation = useMutation({
    mutationFn: async () => {
      const missing: string[] = [];
      if (!form.cdate) missing.push("Date");
      if (!form.cname.trim()) missing.push("Customer name");
      if (!form.mobileno.trim()) missing.push("Mobile");
      if (!form.address.trim()) missing.push("Address");
      if (!form.bank_id) missing.push("Bank");
      if (!form.bank_ref_no.trim()) missing.push("Bank ref no");
      if (!form.vehicleno.trim()) missing.push("Vehicle no");
      if (!form.company_id) missing.push("Company");
      if (!form.model_id) missing.push("Model");
      if (!form.variant_id) missing.push("Variant");

      if (missing.length > 0) {
        throw new Error(`Please fill: ${missing.join(", ")}`);
      }

      const mobile = form.mobileno.replace(/\D/g, "");
      if (mobile.length < 10) {
        throw new Error("Mobile must be at least 10 digits");
      }

      return apiJson<{ data: { id: number; dti_no: string; cname: string | null; vehicleno: string } }>(
        "/api/v2/jobs",
        {
          method: "POST",
          body: JSON.stringify({
            cdate: form.cdate,
            cname: form.cname.trim(),
            mobileno: mobile,
            address: form.address.trim(),
            mode: form.mode,
            bank_id: Number(form.bank_id),
            bank_ref_no: form.bank_ref_no.trim(),
            vehicle_type: form.vehicle_type,
            vehicleno: form.vehicleno.trim().toUpperCase(),
            company_id: Number(form.company_id),
            model_id: Number(form.model_id),
            variant_id: Number(form.variant_id),
            agent_id: null,
            remark: form.remark.trim() || null,
          }),
        },
      );
    },
    onSuccess: (res) => {
      setCreatedCase(res.data);
      setForm(createEmptyForm());
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
      toast.success("Case assigned — moved to Assign Case queue");
      closeAssignDialog();
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
      ? "Unassigned cases waiting for a surveyor. Assign an agent to move the case forward."
      : mode === "schedule"
        ? "Assigned cases pending inspection. Open the form to upload images and submit."
        : "Enter customer, bank and vehicle details to open a new pre-inspection case.";

  const badge =
    mode === "fresh"
      ? "Unassigned"
      : mode === "schedule"
        ? "Assigned"
        : "New case";

  const fieldClass = "min-w-0 space-y-1";
  const labelClass = "text-[11px] font-medium text-muted-foreground";
  const controlClass = "h-8 w-full text-[13px]";
  const gridClass =
    "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3";
  const selectClass = cn(
    "flex h-8 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-[13px] outline-none transition-colors",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

  function renderTable(rows: JobRow[] | undefined, showAssign: boolean) {
    if ((rows ?? []).length === 0) return null;
    const isFresh = showAssign;

    return (
      <JobsTable>
        <JobsTableHeader>
          <JobsTableRow>
            <JobSerialHead />
            <JobsTableHead>DTI</JobsTableHead>
            <JobsTableHead>Customer</JobsTableHead>
            <JobsTableHead>Vehicle</JobsTableHead>
            <JobsTableHead>Type</JobsTableHead>
            <JobsTableHead>Bank</JobsTableHead>
            {isFresh ? null : <JobsTableHead>Agent</JobsTableHead>}
            <JobsTableHead>Date</JobsTableHead>
            <JobsTableHead className="text-right">Actions</JobsTableHead>
          </JobsTableRow>
        </JobsTableHeader>
        <TableBody>
          {(rows ?? []).map((job, index) => (
            <JobsTableRow key={job.id}>
              <JobSerialCell index={index} />
              <JobsTableCell>
                <JobDtiCell value={job.dti_no ?? job.id} />
              </JobsTableCell>
              <JobsTableCell>
                <div className="font-medium text-foreground">
                  {job.cname ?? "—"}
                </div>
                <JobMetaLine>{job.mobileno}</JobMetaLine>
              </JobsTableCell>
              <JobsTableCell>
                <RegPlate value={job.vehicleno} />
                <JobMetaLine>
                  {[job.company, job.model, job.variant]
                    .filter(Boolean)
                    .join(" / ")}
                </JobMetaLine>
              </JobsTableCell>
              <JobsTableCell>
                <span className="inline-flex rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {job.vehicle_type ?? "—"}
                </span>
              </JobsTableCell>
              <JobsTableCell>
                <div
                  className="max-w-[150px] truncate font-medium"
                  title={job.bankname ?? undefined}
                >
                  {job.bankname ?? "—"}
                </div>
                <JobMetaLine>{job.bank_ref_no}</JobMetaLine>
              </JobsTableCell>
              {isFresh ? null : (
                <JobsTableCell>{job.agent_name ?? "—"}</JobsTableCell>
              )}
              <JobsTableCell className="tabular-nums text-muted-foreground">
                {formatDeskDate(
                  isFresh
                    ? (job.created_at ?? job.cdate)
                    : (job.assigned_at ?? job.created_at),
                )}
              </JobsTableCell>
              <JobsTableCell>
                <JobActions>
                  {isFresh && !job.agent_id ? (
                    <JobActionButton
                      tone="primary"
                      icon={UserPlus}
                      label="Assign Case"
                      onClick={() => {
                        setAssignJob(job);
                        setSelectedRoId("");
                        setSelectedSurveyorId("");
                      }}
                    />
                  ) : null}
                  {job.agent_id ? (
                    <JobActionLink
                      href={inspectPathForJob(job.id, job.vehicle_type)}
                      tone="primary"
                      icon={ClipboardCheck}
                      label="Inspect"
                    />
                  ) : null}
                  <JobActionButton
                    tone="warning"
                    icon={CirclePause}
                    label="Hold"
                    disabled={workflowMutation.isPending}
                    onClick={() => setHoldJobId(job.id)}
                  />
                  <JobActionButton
                    tone="danger"
                    icon={Ban}
                    label="Cancel"
                    disabled={workflowMutation.isPending}
                    onClick={() => setCancelJobId(job.id)}
                  />
                  {job.agent_id ? (
                    <JobActionLink
                      href={inspectPathForJob(job.id, job.vehicle_type, {
                        skipQc: true,
                      })}
                      tone="muted"
                      icon={FastForward}
                      label="Skip QC"
                    />
                  ) : null}
                </JobActions>
              </JobsTableCell>
            </JobsTableRow>
          ))}
        </TableBody>
      </JobsTable>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Workflow"
        badge={badge}
      />

      {mode === "assign" ? (
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border/70 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ClipboardPlus className="size-4" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[15px] leading-none">
                  New intimation
                </CardTitle>
                <CardDescription className="mt-1 text-[12px]">
                  Create case now · assign surveyor later from Fresh Case
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-4 py-3.5 sm:px-5">
            <FormSection icon={UserRound} title="Customer">
              <div className={gridClass}>
                <div className={fieldClass}>
                  <Label htmlFor="cdate" className={labelClass}>
                    Date
                  </Label>
                  <Input
                    id="cdate"
                    type="date"
                    className={controlClass}
                    value={form.cdate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cdate: e.target.value }))
                    }
                  />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="cname" className={labelClass}>
                    Customer name
                  </Label>
                  <Input
                    id="cname"
                    placeholder="Full name"
                    className={controlClass}
                    value={form.cname}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cname: e.target.value }))
                    }
                  />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="mobileno" className={labelClass}>
                    Mobile
                  </Label>
                  <Input
                    id="mobileno"
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    className={controlClass}
                    value={form.mobileno}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mobileno: e.target.value }))
                    }
                  />
                </div>
                <div className={cn(fieldClass, "sm:col-span-2 lg:col-span-3")}>
                  <Label htmlFor="address" className={labelClass}>
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    rows={2}
                    placeholder="Inspection / customer address"
                    className="field-sizing-fixed h-16 w-full resize-y py-2 text-[13px] leading-snug"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>
              </div>
            </FormSection>

            <FormSection icon={Building2} title="Bank">
              <div className={gridClass}>
                <div className={fieldClass}>
                  <Label htmlFor="bank_id" className={labelClass}>
                    Bank
                  </Label>
                  <select
                    id="bank_id"
                    className={selectClass}
                    value={form.bank_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bank_id: e.target.value }))
                    }
                  >
                    <option value="">Select bank…</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="bank_ref_no" className={labelClass}>
                    Bank ref no
                  </Label>
                  <Input
                    id="bank_ref_no"
                    placeholder="Reference number"
                    className={controlClass}
                    value={form.bank_ref_no}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bank_ref_no: e.target.value }))
                    }
                  />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="mode" className={labelClass}>
                    Payment mode
                  </Label>
                  <select
                    id="mode"
                    className={selectClass}
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
              </div>
            </FormSection>

            <FormSection icon={CarFront} title="Vehicle">
              <div className={gridClass}>
                <div className={fieldClass}>
                  <Label htmlFor="vehicle_type" className={labelClass}>
                    Vehicle type
                  </Label>
                  <select
                    id="vehicle_type"
                    className={selectClass}
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
                <div className={fieldClass}>
                  <Label htmlFor="vehicleno" className={labelClass}>
                    Vehicle no
                  </Label>
                  <Input
                    id="vehicleno"
                    placeholder="e.g. MH12AB1234"
                    className={controlClass}
                    value={form.vehicleno}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        vehicleno: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="company_id" className={labelClass}>
                    Company
                  </Label>
                  <select
                    id="company_id"
                    className={selectClass}
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
                    <option value="">Select company…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="model_id" className={labelClass}>
                    Model
                  </Label>
                  <select
                    id="model_id"
                    className={selectClass}
                    value={form.model_id}
                    disabled={!form.company_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        model_id: e.target.value,
                        variant_id: "",
                      }))
                    }
                  >
                    <option value="">Select model…</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="variant_id" className={labelClass}>
                    Variant
                  </Label>
                  <select
                    id="variant_id"
                    className={selectClass}
                    value={form.variant_id}
                    disabled={!form.model_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, variant_id: e.target.value }))
                    }
                  >
                    <option value="">Select variant…</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="remark" className={labelClass}>
                    Remark
                  </Label>
                  <Input
                    id="remark"
                    placeholder="Optional notes"
                    className={controlClass}
                    value={form.remark}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remark: e.target.value }))
                    }
                  />
                </div>
              </div>
            </FormSection>
          </CardContent>

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 bg-muted/25 px-4 py-3 sm:px-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => setForm(createEmptyForm())}
              className={cn(
                "h-9 min-w-[6.5rem] gap-2 rounded-md px-4 text-[13px] font-medium",
                "border-border bg-background transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-600",
                "hover:shadow-md hover:shadow-red-500/20",
                "active:translate-y-0 active:scale-[0.98]",
                "dark:hover:border-red-400 dark:hover:bg-red-500/15 dark:hover:text-red-400",
              )}
            >
              <RotateCcw className="size-3.5 transition-transform duration-200 group-hover/button:-rotate-180" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className={cn(
                "h-9 min-w-[10.5rem] gap-2 rounded-md px-4 text-[13px] font-medium",
                "transition-all duration-200",
                "hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30",
                "active:translate-y-0 active:scale-[0.98]",
                "disabled:translate-y-0 disabled:shadow-none",
              )}
            >
              {createMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ClipboardPlus className="size-3.5 transition-transform duration-200 group-hover/button:scale-110" />
              )}
              {createMutation.isPending ? "Saving…" : "Create intimation"}
            </Button>
          </div>
        </Card>
      ) : (
        <JobsListingCard
          title={
            mode === "schedule" ? "Pending inspection" : "Fresh cases"
          }
          description={
            mode === "schedule"
              ? "Assigned cases waiting for inspection"
              : "Unassigned cases ready for RO / Surveyor assignment"
          }
          count={listQuery.data?.length}
          loading={listQuery.isLoading}
          error={
            listQuery.isError
              ? (listQuery.error as Error).message
              : null
          }
          empty={
            mode === "schedule"
              ? "No pending inspection cases"
              : "No fresh cases waiting"
          }
        >
          {renderTable(listQuery.data, mode !== "schedule")}
        </JobsListingCard>
      )}

      <Dialog
        open={assignJob != null}
        onOpenChange={(open) => {
          if (!open) closeAssignDialog();
        }}
      >
        <DialogContent className="sm:max-w-[24rem]" showCloseButton={false}>
          <DialogHeader className="mb-3 pr-0">
            <DialogTitle className="flex items-center gap-2 text-[1.05rem]">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <UserPlus className="size-4" />
              </span>
              Assign Case
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              First select an RO, then choose a Surveyor under that RO. The case
              will move to Assign Case.
            </DialogDescription>
          </DialogHeader>

          {assignJob ? (
            <div className="mb-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2.5 text-left text-[12.5px]">
              <div className="flex justify-between gap-3 py-0.5">
                <span className="text-muted-foreground">DTI</span>
                <span className="font-semibold tracking-wide">
                  {assignJob.dti_no ?? assignJob.id}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border/50 py-0.5">
                <span className="text-muted-foreground">Customer</span>
                <span className="max-w-[12rem] truncate font-medium">
                  {assignJob.cname ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border/50 py-0.5">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-semibold tracking-wide">
                  {assignJob.vehicleno ?? "—"}
                </span>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                1. Select RO
              </Label>
              <select
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                )}
                value={selectedRoId}
                onChange={(e) => {
                  setSelectedRoId(e.target.value);
                  setSelectedSurveyorId("");
                }}
              >
                <option value="">Select RO…</option>
                {roAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {roAgents.length === 0 ? (
                <p className="text-[11px] text-amber-700">
                  No verified RO found. Add RO from Account → Surveyors.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                2. Select Surveyor (under RO)
              </Label>
              <select
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                value={selectedSurveyorId}
                disabled={!selectedRoId}
                onChange={(e) => setSelectedSurveyorId(e.target.value)}
              >
                <option value="">
                  {selectedRoId ? "Select Surveyor…" : "First select RO"}
                </option>
                {surveyorsUnderRo.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {selectedRoId && surveyorsUnderRo.length === 0 ? (
                <p className="text-[11px] text-amber-700">
                  No verified Surveyor linked to this RO. Create a Surveyor
                  under this RO (parent link) and Approve them first.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 shadow-none"
              disabled={assignMutation.isPending}
              onClick={closeAssignDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 min-w-[8.5rem] gap-1.5 shadow-none"
              disabled={
                !selectedRoId ||
                !selectedSurveyorId ||
                assignMutation.isPending
              }
              onClick={() => {
                if (!assignJob || !selectedSurveyorId) return;
                assignMutation.mutate({
                  jobId: assignJob.id,
                  agentId: Number(selectedSurveyorId),
                });
              }}
            >
              {assignMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserPlus className="size-3.5" />
              )}
              {assignMutation.isPending ? "Assigning…" : "Assign Case"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={holdJobId != null}
        onOpenChange={(open) => {
          if (!open) setHoldJobId(null);
        }}
        tone="hold"
        title="Put this case on Hold?"
        description="The case will move to the Hold queue. You can resume it anytime from there."
        confirmLabel="Hold case"
        cancelLabel="Keep working"
        loading={workflowMutation.isPending}
        onConfirm={() => {
          if (holdJobId == null) return;
          workflowMutation.mutate(
            { jobId: holdJobId, action: "hold" },
            { onSettled: () => setHoldJobId(null) },
          );
        }}
      />

      <ConfirmDialog
        open={cancelJobId != null}
        onOpenChange={(open) => {
          if (!open) setCancelJobId(null);
        }}
        tone="danger"
        title="Cancel this case?"
        description="The case will move to the Cancel queue. You can restore it later if needed."
        confirmLabel="Cancel case"
        cancelLabel="Keep case"
        loading={workflowMutation.isPending}
        onConfirm={() => {
          if (cancelJobId == null) return;
          workflowMutation.mutate(
            { jobId: cancelJobId, action: "cancel" },
            { onSettled: () => setCancelJobId(null) },
          );
        }}
      />

      <Dialog
        open={createdCase != null}
        onOpenChange={(open) => {
          if (!open) setCreatedCase(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[19rem]"
        >
          <div className="flex flex-col items-center text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="size-5" strokeWidth={3} />
            </span>

            <DialogHeader className="mb-3 items-center gap-1 pr-0 text-center">
              <DialogTitle className="text-[1.02rem] font-semibold tracking-tight">
                Case created successfully
              </DialogTitle>
              <DialogDescription className="max-w-[15.5rem] text-[12px] leading-snug">
                Intimation saved. Assign a surveyor from Fresh Case when ready.
              </DialogDescription>
            </DialogHeader>

            {createdCase ? (
              <dl className="w-full space-y-1.5 rounded-md border border-border/80 bg-muted/20 p-2.5 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <FileDigit className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      DTI no
                    </dt>
                    <dd className="truncate text-[12.5px] font-semibold tracking-wide">
                      {createdCase.dti_no}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <UserRound className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Customer
                    </dt>
                    <dd className="truncate text-[12.5px] font-semibold">
                      {createdCase.cname ?? "—"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <CarFront className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Vehicle
                    </dt>
                    <dd className="truncate text-[12.5px] font-semibold tracking-wide">
                      {createdCase.vehicleno}
                    </dd>
                  </div>
                </div>
              </dl>
            ) : null}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              className="h-9 min-w-[8rem] rounded-md bg-[#5d87ff] px-8 text-[13px] font-semibold text-white shadow-none hover:bg-[#4a73e8] hover:shadow-none"
              onClick={() => setCreatedCase(null)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
