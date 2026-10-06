"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Eye, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RegPlate } from "@/components/atlas/reg-plate";
import { CaseListToolbar } from "@/components/jobs/case-list-toolbar";
import { JobHistoryButton } from "@/components/jobs/job-history-button";
import {
  JobActionButton,
  JobActionLink,
  JobActions,
  JobDtiCell,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  EMPTY_CASE_FILTERS,
  filterCaseRows,
  uniqueSorted,
  type CaseListFilterState,
} from "@/lib/jobs/case-list-filters";
import { formatDeskDate, inspectPathForJob } from "@/lib/jobs/helpers";

type Row = {
  id: number;
  status: string;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  bankname?: string;
  agent_name?: string;
  vehicle_type: string | null;
  inspection_id?: number | null;
  created_at?: string | null;
  assigned_at?: string | null;
  inspection_at?: string | null;
  hold_at?: string | null;
  updated_at?: string | null;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

export function HoldCasesPage() {
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [filters, setFilters] = useState<CaseListFilterState>(EMPTY_CASE_FILTERS);
  const listQuery = useQuery({
    queryKey: ["jobs-hold"],
    queryFn: () =>
      apiJson<{ data: Row[] }>("/api/v2/jobs?list=hold&limit=100"),
  });

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number;
      action: "resume" | "cancel";
    }) =>
      apiJson(`/api/v2/jobs/${id}/workflow`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: async (_d, vars) => {
      toast.success(vars.action === "resume" ? "Resumed" : "Cancelled");
      await queryClient.invalidateQueries({ queryKey: ["jobs-hold"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allRows = listQuery.data?.data ?? [];
  const banks = useMemo(
    () => uniqueSorted(allRows.map((r) => r.bankname)),
    [allRows],
  );
  const surveyors = useMemo(
    () => uniqueSorted(allRows.map((r) => r.agent_name)),
    [allRows],
  );
  const rows = useMemo(
    () => filterCaseRows(allRows, filters, "hold"),
    [allRows, filters],
  );

  return (
    <>
      <PageHeader
        title="Hold"
        description="Paused cases. Resume to continue assign or QC, or cancel if no longer needed."
        eyebrow="Workflow"
        badge="On hold"
      />

      <JobsListingCard
        title="Case list"
        description="Resume work or cancel cases that are no longer required"
        count={rows.length}
        totalCount={allRows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty={
          allRows.length > 0
            ? "No cases match these filters"
            : "No cases on hold"
        }
        filters={
          <CaseListToolbar
            value={filters}
            onChange={setFilters}
            banks={banks}
            surveyors={surveyors}
          />
        }
      >
        {rows.length > 0 ? (
          <JobsTable>
            <JobsTableHeader>
              <JobsTableRow>
                <JobSerialHead />
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Agent</JobsTableHead>
                <JobsTableHead>Date</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {rows.map((row, index) => {
                return (
                  <JobsTableRow key={row.id}>
                    <JobSerialCell index={index} />
                    <JobsTableCell>
                      <JobDtiCell value={row.dti_no ?? row.id} />
                    </JobsTableCell>
                    <JobsTableCell>
                      {row.vehicleno ? (
                        <RegPlate value={row.vehicleno} />
                      ) : (
                        "—"
                      )}
                    </JobsTableCell>
                    <JobsTableCell className="font-medium">
                      {row.cname ?? "—"}
                    </JobsTableCell>
                    <JobsTableCell>{row.agent_name ?? "—"}</JobsTableCell>
                    <JobsTableCell className="tabular-nums text-muted-foreground">
                      {formatDeskDate(row.hold_at ?? row.updated_at)}
                    </JobsTableCell>
                    <JobsTableCell>
                      <JobActions>
                        <JobActionLink
                          href={inspectPathForJob(row.id, row.vehicle_type, {
                            mode: row.inspection_id ? "edit" : "create",
                          })}
                          tone="info"
                          icon={Eye}
                          label="Open"
                        />
                        <JobActionButton
                          tone="success"
                          icon={Play}
                          label="Resume"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({
                              id: row.id,
                              action: "resume",
                            })
                          }
                        />
                        <JobHistoryButton stage="hold" job={row} />
                        <JobActionButton
                          tone="danger"
                          icon={Ban}
                          label="Cancel"
                          disabled={actionMutation.isPending}
                          onClick={() => setCancelId(row.id)}
                        />
                      </JobActions>
                    </JobsTableCell>
                  </JobsTableRow>
                );
              })}
            </TableBody>
          </JobsTable>
        ) : null}
      </JobsListingCard>

      <ConfirmDialog
        open={cancelId != null}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
        tone="danger"
        title="Cancel this case?"
        description="The case will move to the Cancel queue. You can restore it later if needed."
        confirmLabel="Cancel case"
        cancelLabel="Keep case"
        loading={actionMutation.isPending}
        onConfirm={() => {
          if (cancelId == null) return;
          actionMutation.mutate(
            { id: cancelId, action: "cancel" },
            { onSettled: () => setCancelId(null) },
          );
        }}
      />
    </>
  );
}
