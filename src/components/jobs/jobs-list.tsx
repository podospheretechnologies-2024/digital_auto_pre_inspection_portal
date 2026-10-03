"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { JobsNav } from "@/components/jobs/jobs-nav";
import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  status: string | null;
  vehicle_type: string | null;
  bank_id: number | null;
  agent_id: number | null;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
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
      const res = await fetch(`/api/v2/jobs?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load jobs");
      return (json.data ?? []) as JobRow[];
    },
  });

  return (
    <>
      <PageHeader
        title="Pre-Inspection"
        description="Intimation → assign → inspect → QC → complete · Valuation & FI out of scope"
      />
      <JobsNav active="/jobs" />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>All jobs</CardTitle>
            <CardDescription>
              Search by DTI, vehicle, customer or bank reference
            </CardDescription>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
            }}
          >
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-48"
            />
            <Button type="submit" variant="outline" size="sm">
              Go
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading jobs…</p>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">
              {(listQuery.error as Error).message}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>DTI</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      No jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  (listQuery.data ?? []).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                        #{job.id}
                      </TableCell>
                      <TableCell>{job.dti_no ?? "—"}</TableCell>
                      <TableCell
                        className="max-w-[180px] truncate"
                        title={job.cname ?? undefined}
                      >
                        {job.cname ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RegPlate value={job.vehicleno} />
                      </TableCell>
                      <TableCell>{job.vehicle_type ?? "—"}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-muted-foreground"
                        title={job.bankname ?? undefined}
                      >
                        {job.bankname ?? job.bank_id ?? "—"}
                      </TableCell>
                      <TableCell
                        className="max-w-[150px] truncate"
                        title={job.agent_name ?? undefined}
                      >
                        {job.agent_name ?? job.agent_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const pill = jobStatusPill(job.status);
                          return pill ? (
                            <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                          ) : (
                            "—"
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <LinkButton
                          href={inspectPathForJob(job.id, job.vehicle_type)}
                          size="sm"
                          variant="outline"
                        >
                          Open
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
