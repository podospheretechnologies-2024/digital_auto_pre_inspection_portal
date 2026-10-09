"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import { useState } from "react";

import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
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
  SheetDateTime,
  SheetPager,
  SheetPerson,
  TableBody,
  useSheetPage,
} from "@/components/jobs/jobs-listing";
import { JobsNav } from "@/components/jobs/jobs-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { inspectPathForJob } from "@/lib/jobs/helpers";

type JobRow = {
  id: number;
  status: string | null;
  vehicle_type: string | null;
  bank_id: number | null;
  agent_id: number | null;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  mobileno: string | null;
  bankname?: string;
  agent_name?: string;
  created_at: string | null;
};

export function JobsListPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");

  const listQuery = useQuery({
    queryKey: ["jobs", "all", search],
    queryFn: async () => {
      const params = new URLSearchParams({ list: "all", limit: "100" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/v2/jobs?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load jobs");
      return (json.data ?? []) as JobRow[];
    },
  });

  const rows = listQuery.data ?? [];
  const sheet = useSheetPage(rows);

  return (
    <>
      <PageHeader
        title="Pre-Inspection"
        description="Manage intimations through assign, inspect, QC and completion."
        eyebrow="Jobs"
      />
      <JobsNav active="/jobs" />

      <JobsListingCard
        title="All jobs"
        description="Search by DTI, vehicle, customer or bank reference"
        count={rows.length}
        mark="all"
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty="No jobs found"
        toolbar={
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
            }}
          >
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8 w-48 text-[13px]"
            />
            <JobActionButton type="submit" tone="outline" icon={Search} label="Search" />
          </form>
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
                <JobsTableHead>ID</JobsTableHead>
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Date</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Type</JobsTableHead>
                <JobsTableHead>Bank</JobsTableHead>
                <JobsTableHead>Agent</JobsTableHead>
                <JobsTableHead>Status</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {sheet.pageItems.map((job, index) => {
                const pill = jobStatusPill(job.status);
                return (
                  <JobsTableRow key={job.id}>
                    <JobSerialCell index={sheet.start + index} />
                    <JobsTableCell>#{job.id}</JobsTableCell>
                    <JobsTableCell>
                      <JobDtiCell value={job.dti_no} />
                    </JobsTableCell>
                    <JobsTableCell>
                      <SheetPerson name={job.cname} phone={job.mobileno} />
                    </JobsTableCell>
                    <JobsTableCell>
                      <SheetDateTime value={job.created_at} />
                    </JobsTableCell>
                    <JobsTableCell>
                      <RegPlate value={job.vehicleno} />
                    </JobsTableCell>
                    <JobsTableCell className="text-muted-foreground">
                      {job.vehicle_type ?? "—"}
                    </JobsTableCell>
                    <JobsTableCell
                      className="max-w-[150px] truncate text-muted-foreground"
                      title={job.bankname ?? undefined}
                    >
                      {job.bankname ?? job.bank_id ?? "—"}
                    </JobsTableCell>
                    <JobsTableCell
                      className="max-w-[120px] truncate"
                      title={job.agent_name ?? undefined}
                    >
                      {job.agent_name ?? job.agent_id ?? "—"}
                    </JobsTableCell>
                    <JobsTableCell>
                      {pill ? (
                        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                      ) : (
                        "—"
                      )}
                    </JobsTableCell>
                    <JobsTableCell>
                      <JobActions>
                        <JobActionLink
                          href={inspectPathForJob(job.id, job.vehicle_type)}
                          tone="primary"
                          icon={Eye}
                          label="Open"
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
    </>
  );
}
