"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowStrip } from "@/components/jobs/workflow-strip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = {
  id: number;
  status: string;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  bankname?: string;
  agent_name?: string;
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

export function CancelCasesPage() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: ["jobs-cancel"],
    queryFn: () =>
      apiJson<{ data: Row[] }>("/api/v2/jobs?list=cancelled&limit=100"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) =>
      apiJson(`/api/v2/jobs/${id}/workflow`, {
        method: "POST",
        body: JSON.stringify({ action: "restore" }),
      }),
    onSuccess: async () => {
      toast.success("Restored to active queue");
      await queryClient.invalidateQueries({ queryKey: ["jobs-cancel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = listQuery.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Cancel"
        description="Cancelled cases — restore optionally back to Fresh / Assign flow"
      />
      <WorkflowStrip active="cancelled" />

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
                <TableHead>Bank</TableHead>
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
                    <TableCell>{row.bankname ?? "—"}</TableCell>
                    <TableCell>{row.agent_name ?? "—"}</TableCell>
                    <TableCell>
                      {pill ? (
                        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                      ) : (
                        "Cancelled"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate(row.id)}
                      >
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No cancelled cases.
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
