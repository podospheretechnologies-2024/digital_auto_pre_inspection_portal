"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowStrip } from "@/components/jobs/workflow-strip";
import { Button } from "@/components/ui/button";
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

  const rows = listQuery.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Hold"
        description="Paused cases — resume to continue QC / assign, or cancel"
      />
      <WorkflowStrip active="hold" />

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DTI</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const pill = jobStatusPill(row.status);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.dti_no ?? row.id}
                    </TableCell>
                    <TableCell>
                      {row.vehicleno ? (
                        <RegPlate value={row.vehicleno} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{row.cname ?? "—"}</TableCell>
                    <TableCell>{row.agent_name ?? "—"}</TableCell>
                    <TableCell>
                      {pill ? (
                        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                      ) : (
                        row.status
                      )}
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <LinkButton
                        href={inspectPathForJob(row.id, row.vehicle_type, {
                          mode: row.inspection_id ? "edit" : "create",
                        })}
                        size="sm"
                        variant="outline"
                      >
                        Open
                      </LinkButton>
                      <Button
                        size="sm"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({ id: row.id, action: "resume" })
                        }
                      >
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionMutation.isPending}
                        onClick={() => {
                          if (confirm("Cancel this case?")) {
                            actionMutation.mutate({
                              id: row.id,
                              action: "cancel",
                            });
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No cases on hold.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
