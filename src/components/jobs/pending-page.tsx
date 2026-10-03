"use client";

import { useQuery } from "@tanstack/react-query";

import { WorkflowStrip } from "@/components/jobs/workflow-strip";
import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inspectPathForJob } from "@/lib/jobs/helpers";

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

  return (
    <>
      <PageHeader
        title="Pending inspections"
        description="Assigned to you — upload images & submit → qc_pending"
      />
      <WorkflowStrip active="assigned" />
      <Card>
        <CardHeader>
          <CardTitle>My pending cases</CardTitle>
          <CardDescription>
            Inspect opens the 2W / 3W / 4W form
          </CardDescription>
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
                  <TableHead>DTI</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No pending jobs
                    </TableCell>
                  </TableRow>
                ) : (
                  (listQuery.data ?? []).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {job.dti_no ?? job.id}
                      </TableCell>
                      <TableCell>
                        {job.cdate
                          ? new Date(job.cdate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {job.cname}
                        <div className="text-xs text-muted-foreground">
                          {job.mobileno}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RegPlate value={job.vehicleno} />
                        <div className="text-xs text-muted-foreground">
                          {[job.company, job.model].filter(Boolean).join(" / ")}
                        </div>
                      </TableCell>
                      <TableCell>{job.vehicle_type ?? "—"}</TableCell>
                      <TableCell>{job.bankname ?? "—"}</TableCell>
                      <TableCell>
                        {(() => {
                          const pill = jobStatusPill(job.status);
                          return pill ? <StatusPill tone={pill.tone}>{pill.label}</StatusPill> : "—";
                        })()}
                      </TableCell>
                      <TableCell>
                        <LinkButton
                          href={inspectPathForJob(job.id, job.vehicle_type)}
                          size="sm"
                        >
                          Inspect
                        </LinkButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
