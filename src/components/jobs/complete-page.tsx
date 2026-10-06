"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { RegPlate } from "@/components/atlas/reg-plate";
import { CaseListToolbar } from "@/components/jobs/case-list-toolbar";
import { ChangeStageButton } from "@/components/jobs/change-stage-button";
import { JobHistoryButton } from "@/components/jobs/job-history-button";
import {
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
import {
  EMPTY_CASE_FILTERS,
  filterCaseRows,
  uniqueSorted,
  type CaseListFilterState,
} from "@/lib/jobs/case-list-filters";
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
  mobileno?: string | null;
  bank_ref_no?: string | null;
  bankname: string;
  company: string;
  model: string;
  variant?: string;
  agent_name: string;
  remarks?: string | null;
  valuation_price: number | null;
  ownership_name: string | null;
  created_at: string | null;
  job_created_at?: string | null;
  assigned_at?: string | null;
  qc_datetime?: string | null;
};

export function CompleteCasesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CaseListFilterState>(EMPTY_CASE_FILTERS);

  const listQuery = useQuery({
    queryKey: ["jobs-complete"],
    queryFn: async () => {
      const res = await fetch(`/api/v2/jobs/qc?done=1&vehicle_type=all`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      return (json.data ?? []) as QcRow[];
    },
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
    () => filterCaseRows(allRows, filters, "qc"),
    [allRows, filters],
  );

  return (
    <>
      <PageHeader
        title="Completed"
        description="QC-approved cases. Download or print the pre-inspection PDF."
        eyebrow="Workflow"
        badge="Done"
      />
      <JobsListingCard
        title="Case list"
        description="QC approved cases — view details or download the PDF report"
        count={rows.length}
        totalCount={allRows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty={
          allRows.length > 0
            ? "No cases match these filters"
            : "No completed cases"
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
                <JobsTableHead>Type</JobsTableHead>
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Price</JobsTableHead>
                <JobsTableHead>Ownership</JobsTableHead>
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
                  <JobsTableCell>{row.valuation_price ?? "—"}</JobsTableCell>
                  <JobsTableCell>{row.ownership_name ?? "—"}</JobsTableCell>
                  <JobsTableCell>{row.agent_name}</JobsTableCell>
                  <JobsTableCell className="tabular-nums text-muted-foreground">
                    {formatDeskDate(row.qc_datetime ?? row.created_at)}
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      {row.job_id ? (
                        <JobActionLink
                          href={inspectPathForJob(
                            row.job_id,
                            row.vehicle_type,
                            { mode: "edit" },
                          )}
                          tone="edit"
                          icon={Pencil}
                          label="Edit"
                        />
                      ) : null}
                      {row.job_id ? (
                        <JobActionLink
                          href={inspectPathForJob(
                            row.job_id,
                            row.vehicle_type,
                            { mode: "view" },
                          )}
                          tone="info"
                          icon={Eye}
                          label="View"
                        />
                      ) : null}
                      <JobActionLink
                        href={pdfPathForInspection(row.vehicle_type, row.id)}
                        tone="primary"
                        icon={FileText}
                        label="PDF"
                      />
                      <ChangeStageButton
                        from="complete"
                        jobId={row.job_id}
                        dtiNo={row.dti_no}
                        onSuccess={() => {
                          void queryClient.invalidateQueries({
                            queryKey: ["jobs-complete"],
                          });
                        }}
                      />
                      <JobHistoryButton
                        stage="complete"
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
    </>
  );
}
