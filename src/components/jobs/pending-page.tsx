"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";

import { RegPlate } from "@/components/atlas/reg-plate";
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
import { formatDeskDate, inspectPathForJob } from "@/lib/jobs/helpers";

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
  cdate: string | null;
  assigned_at?: string | null;
  created_at?: string | null;
};

export function PendingJobsPage() {
  const listQuery = useQuery({
    queryKey: ["jobs", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/v2/jobs?list=pending&limit=100");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load");
      return (json.data ?? []) as JobRow[];
    },
  });

  const rows = listQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Pending inspections"
        description="Cases assigned to you. Complete inspection and submit for quality check."
        eyebrow="Workflow"
        badge="My queue"
      />
      <JobsListingCard
        title="My pending cases"
        description="Open a case to fill the 2W / 3W / 4W inspection form"
        count={rows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty="No pending jobs in your queue"
      >
        {rows.length > 0 ? (
          <JobsTable>
            <JobsTableHeader>
              <JobsTableRow>
                <JobSerialHead />
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Date</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Type</JobsTableHead>
                <JobsTableHead>Bank</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {rows.map((job, index) => (
                <JobsTableRow key={job.id}>
                  <JobSerialCell index={index} />
                  <JobsTableCell>
                    <JobDtiCell value={job.dti_no ?? job.id} />
                  </JobsTableCell>
                  <JobsTableCell className="tabular-nums text-muted-foreground">
                    {formatDeskDate(
                      job.assigned_at ?? job.created_at ?? job.cdate,
                    )}
                  </JobsTableCell>
                  <JobsTableCell>
                    <div className="font-medium">{job.cname ?? "—"}</div>
                    <JobMetaLine>{job.mobileno}</JobMetaLine>
                  </JobsTableCell>
                  <JobsTableCell>
                    <RegPlate value={job.vehicleno} />
                    <JobMetaLine>
                      {[job.company, job.model].filter(Boolean).join(" / ")}
                    </JobMetaLine>
                  </JobsTableCell>
                  <JobsTableCell className="text-muted-foreground">
                    {job.vehicle_type ?? "—"}
                  </JobsTableCell>
                  <JobsTableCell>
                    <div
                      className="max-w-[140px] truncate"
                      title={job.bankname}
                    >
                      {job.bankname ?? "—"}
                    </div>
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      <JobActionLink
                        href={inspectPathForJob(job.id, job.vehicle_type)}
                        tone="primary"
                        icon={ClipboardCheck}
                        label="Inspect"
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
