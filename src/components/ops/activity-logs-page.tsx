"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LogRow = {
  id: string | number;
  log_name: string | null;
  description: string;
  event: string | null;
  subject_type: string | null;
  subject_id: string | number | null;
  causer_id: string | number | null;
  created_at: string | null;
};

export function ActivityLogsPage() {
  const q = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const res = await fetch("/api/v2/logs/activity?limit=100");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      return json.data as LogRow[];
    },
  });

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Recent events (read-only)"
      />
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : q.isError ? (
        <p className="text-sm text-destructive">{(q.error as Error).message}</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Causer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell>{String(row.id)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>{row.event ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {row.description}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.subject_type
                      ? `${row.subject_type.replace("App\\Models\\", "")}#${row.subject_id ?? ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>{row.causer_id ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
