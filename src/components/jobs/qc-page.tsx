"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CirclePause, ClipboardCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";

import { RegPlate } from "@/components/atlas/reg-plate";
import { CaseListToolbar } from "@/components/jobs/case-list-toolbar";
import { ChangeStageButton } from "@/components/jobs/change-stage-button";
import { refreshJobSheets } from "@/lib/jobs/refresh-sheets";
import { JobHistoryButton } from "@/components/jobs/job-history-button";
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
  SheetDateTime,
  SheetPager,
  SheetPerson,
  TableBody,
  useSheetPage,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_CASE_FILTERS,
  filterCaseRows,
  uniqueSorted,
  type CaseListFilterState,
} from "@/lib/jobs/case-list-filters";
import {
  inspectPathForJob,
  type WheelKind,
} from "@/lib/jobs/helpers";

type QcRow = {
  id: number;
  job_id: number | null;
  vehicle_type: WheelKind;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  mobileno?: string | null;
  bank_ref_no?: string | null;
  bankname: string;
  company: string;
  model: string;
  variant?: string;
  agent_name: string;
  remarks: string | null;
  valuation_price: number | null;
  ownership_name: string | null;
  created_at: string | null;
  job_created_at?: string | null;
  assigned_at?: string | null;
  qc_datetime?: string | null;
  stage_reason?: string | null;
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
  const [filters, setFilters] = useState<CaseListFilterState>(EMPTY_CASE_FILTERS);
  const [active, setActive] = useState<QcRow | null>(null);
  const [holdJobId, setHoldJobId] = useState<number | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [form, setForm] = useState({
    remarks: "",
    valuation_price: "",
    ownership_name: "",
  });

  const listQuery = useQuery({
    queryKey: ["jobs-qc"],
    queryFn: async () => {
      const json = await apiJson<{ data: QcRow[] }>(
        `/api/v2/jobs/qc?vehicle_type=all`,
        { cache: "no-store" },
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
    onSuccess: async () => {
      toast.success("QC submitted");
      setActive(null);
      await refreshJobSheets(queryClient);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const holdMutation = useMutation({
    mutationFn: async (jobId: number) =>
      apiJson(`/api/v2/jobs/${jobId}/workflow`, {
        method: "POST",
        body: JSON.stringify({ action: "hold" }),
      }),
    onSuccess: async (_data, jobId) => {
      toast.success("Moved to Hold");
      setHoldJobId(null);
      setActive((current) =>
        current?.job_id === jobId ? null : current,
      );
      await refreshJobSheets(queryClient);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allRows = listQuery.data ?? [];
  const banks = useMemo(
    () => uniqueSorted(allRows.map((r) => r.bankname)),
    [allRows],
  );
  const surveyors = useMemo(
    () => uniqueSorted(allRows.map((r) => r.agent_name)),
    [allRows],
  );
  const rows = useMemo(
    () => filterCaseRows(allRows, filters, "created"),
    [allRows, filters],
  );
  const sheet = useSheetPage(rows);

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
        title="Case list"
        description="Inspections waiting for quality check"
        count={rows.length}
        totalCount={allRows.length}
        mark="qc"
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty={
          allRows.length > 0
            ? "No cases match these filters"
            : "No pending QC cases"
        }
        filters={
          <CaseListToolbar
            value={filters}
            onChange={setFilters}
            banks={banks}
            surveyors={surveyors}
          />
        }
        footer={
          rows.length > 0 ? (
            <SheetPager
              page={sheet.page}
              pageCount={sheet.pageCount}
              onPage={sheet.setPage}
            />
          ) : null
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
                <JobsTableHead>Reason</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {sheet.pageItems.map((row, index) => (
                <JobsTableRow key={`${row.vehicle_type}-${row.id}`}>
                  <JobSerialCell index={sheet.start + index} />
                  <JobsTableCell>
                    <Badge variant="outline" className="font-normal">
                      {row.vehicle_type}
                    </Badge>
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobDtiCell value={row.dti_no} />
                  </JobsTableCell>
                  <JobsTableCell>
                    <SheetPerson name={row.cname} phone={row.mobileno} />
                  </JobsTableCell>
                  <JobsTableCell className="align-top">
                    <RegPlate value={row.vehicleno} className="-mt-0.5" />
                    <JobMetaLine full>
                      {[row.company, row.model, row.bankname]
                        .filter(Boolean)
                        .join(" · ")}
                    </JobMetaLine>
                  </JobsTableCell>
                  <JobsTableCell>
                    <SheetPerson name={row.agent_name} />
                  </JobsTableCell>
                  <JobsTableCell>
                    <SheetDateTime value={row.created_at} />
                  </JobsTableCell>
                  <JobsTableCell>
                    <div
                      className="max-w-[12rem] truncate text-[12px]"
                      title={row.stage_reason ?? undefined}
                    >
                      {row.stage_reason || "—"}
                    </div>
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      {row.job_id ? (
                        <>
                          <JobActionLink
                            href={inspectPathForJob(
                              row.job_id,
                              row.vehicle_type,
                              { mode: "edit" },
                            )}
                            tone="primary"
                            icon={ClipboardCheck}
                            label="Inspect"
                          />
                          <JobActionButton
                            tone="warning"
                            icon={CirclePause}
                            label="Hold"
                            disabled={holdMutation.isPending}
                            onClick={() => setHoldJobId(row.job_id)}
                          />
                        </>
                      ) : null}
                      <ChangeStageButton
                        from="qc"
                        jobId={row.job_id}
                        dtiNo={row.dti_no}
                        onSuccess={() => {
                          void queryClient.invalidateQueries({
                            queryKey: ["jobs-qc"],
                          });
                        }}
                      />
                      <JobHistoryButton
                        stage="qc"
                        job={{
                          id: row.job_id ?? row.id,
                          dti_no: row.dti_no,
                          cname: row.cname,
                          mobileno: row.mobileno,
                          vehicleno: row.vehicleno,
                          vehicle_type: row.vehicle_type,
                          bankname: row.bankname,
                          bank_ref_no: row.bank_ref_no,
                          company: row.company,
                          model: row.model,
                          variant: row.variant,
                          agent_name: row.agent_name,
                          remarks: row.remarks,
                          valuation_price: row.valuation_price,
                          ownership_name: row.ownership_name,
                          job_created_at: row.job_created_at,
                          assigned_at: row.assigned_at,
                          created_at_inspection: row.created_at,
                          qc_datetime: row.qc_datetime,
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
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
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
                onClick={() => setConfirmSubmit(true)}
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

      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit this quality check?"
        description="The case will be marked complete after you confirm."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={submitMutation.isPending}
        onConfirm={() => {
          setConfirmSubmit(false);
          submitMutation.mutate();
        }}
      />

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
        loading={holdMutation.isPending}
        onConfirm={() => {
          if (holdJobId == null) return;
          holdMutation.mutate(holdJobId);
        }}
      />
    </>
  );
}
