"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { RegPlate } from "@/components/atlas/reg-plate";
import {
  JobActionButton,
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
import { formatDeskDate } from "@/lib/jobs/helpers";

type Row = {
  id: number;
  status: string;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  bankname?: string;
  agent_name?: string;
  cancelled_at?: string | null;
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
        description="Cancelled cases. Restore a case if it should return to the active workflow."
        eyebrow="Workflow"
        badge="Cancelled"
      />

      <JobsListingCard
        title="Cancelled cases"
        description="Restore a case to send it back into the active workflow"
        count={rows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty="No cancelled cases"
      >
        {rows.length > 0 ? (
          <JobsTable>
            <JobsTableHeader>
              <JobsTableRow>
                <JobSerialHead />
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Bank</JobsTableHead>
                <JobsTableHead>Agent</JobsTableHead>
                <JobsTableHead>Date</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {rows.map((row, index) => (
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
                  <JobsTableCell>
                    <div
                      className="max-w-[140px] truncate"
                      title={row.bankname}
                    >
                      {row.bankname ?? "—"}
                    </div>
                  </JobsTableCell>
                  <JobsTableCell>{row.agent_name ?? "—"}</JobsTableCell>
                  <JobsTableCell className="tabular-nums text-muted-foreground">
                    {formatDeskDate(row.cancelled_at ?? row.updated_at)}
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      <JobActionButton
                        tone="success"
                        icon={RotateCcw}
                        label="Restore"
                        disabled={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate(row.id)}
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
