"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3, History, Loader2, UserRound } from "lucide-react";
import { useState } from "react";

import { JobActionButton } from "@/components/jobs/jobs-listing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Which workflow desk is viewing history — kept for call-site compatibility. */
export type JobHistoryStage =
  | "fresh"
  | "assigned"
  | "qc"
  | "complete"
  | "hold"
  | "cancel";

export type JobHistorySource = {
  id: number;
  dti_no?: string | null;
  cname?: string | null;
  mobileno?: string | null;
  address?: string | null;
  vehicleno?: string | null;
  vehicle_type?: string | null;
  bankname?: string | null;
  bank_ref_no?: string | null;
  company?: string | null;
  model?: string | null;
  variant?: string | null;
  agent_name?: string | null;
  mode?: string | null;
  remark?: string | null;
  remarks?: string | null;
  valuation_price?: number | string | null;
  ownership_name?: string | null;
  created_at?: string | Date | null;
  cdate?: string | Date | null;
  job_created_at?: string | Date | null;
  assigned_at?: string | Date | null;
  inspection_at?: string | Date | null;
  created_at_inspection?: string | Date | null;
  qc_datetime?: string | Date | null;
  hold_at?: string | Date | null;
  cancelled_at?: string | Date | null;
};

type HistoryRow = {
  id: number;
  event: string;
  remark: string | null;
  created_at: string | Date | null;
  user_name: string | null;
  user_email: string | null;
  user_role?: string | null;
};

function parseWhen(value: Date | string | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function eventKey(event: string): string {
  const e = event.toLowerCase();
  if (e.includes("create") || e.includes("intimation")) return "create";
  if (e.includes("fresh")) return "fresh";
  if (e.includes("assign ro")) return "assign_ro";
  if (e.includes("assign")) return "assign";
  if (e.includes("inspect")) return "inspect";
  if (e.includes("quality") || e.includes("qc")) return "qc";
  if (e.includes("hold") && !e.includes("resume")) return "hold";
  if (e.includes("cancel")) return "cancel";
  if (e.includes("resume")) return "resume";
  if (e.includes("restore")) return "restore";
  if (e.includes("change stage")) return "change_stage";
  return e.trim() || "other";
}

/**
 * Per desk: show only prior stages (not the current desk itself).
 * Cancel is terminal — include Cancel as the last line ("cancel tk").
 */
function allowedKeysForStage(stage: JobHistoryStage): string[] {
  switch (stage) {
    case "fresh":
      return ["create"];
    case "assigned":
      return ["create", "fresh"];
    case "qc":
      return ["create", "fresh", "assign_ro", "assign", "inspect"];
    case "complete":
      return ["create", "fresh", "assign_ro", "assign", "inspect", "qc"];
    case "hold":
      return ["create", "fresh", "assign_ro", "assign", "inspect", "qc"];
    case "cancel":
      return [
        "create",
        "fresh",
        "assign_ro",
        "assign",
        "inspect",
        "qc",
        "hold",
        "cancel",
      ];
  }
}

const KEY_ORDER = [
  "create",
  "fresh",
  "assign_ro",
  "assign",
  "inspect",
  "qc",
  "hold",
  "cancel",
] as const;

function keyRank(key: string): number {
  const i = KEY_ORDER.indexOf(key as (typeof KEY_ORDER)[number]);
  return i === -1 ? 99 : i;
}

/** Build timeline from job timestamps for stages missing from the history table. */
function synthesizeRows(job: JobHistorySource): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const push = (
    event: string,
    remark: string,
    at: string | Date | null | undefined,
  ) => {
    if (!at) return;
    rows.push({
      id: -(rows.length + 1),
      event,
      remark,
      created_at: at,
      user_name: null,
      user_email: null,
      user_role: "System",
    });
  };

  const createAt = job.job_created_at ?? job.created_at ?? job.cdate;

  push("Create Intimation", "Created the case intimation", createAt);
  // Fresh Case sits after create in the workflow line
  push("Fresh Case", "Case was in Fresh Case", createAt);
  push(
    "Assign Agent",
    job.agent_name
      ? `Assigned surveyor ${job.agent_name} to this case`
      : "Assigned a surveyor to this case",
    job.assigned_at,
  );
  push(
    "Inspection submitted",
    "Inspection submitted to Quality Check",
    job.inspection_at ?? job.created_at_inspection,
  );
  push(
    "Quality Check",
    "Quality check completed for this case",
    job.qc_datetime,
  );
  push("Hold", "Case was put on Hold", job.hold_at);
  push("Cancel", "Case was cancelled", job.cancelled_at);

  return rows;
}

/**
 * Merge logged + synthesized rows, then keep only stages allowed for this desk.
 * Order: Create Intimation on top → later stages below (oldest first).
 */
function buildStageHistory(
  logged: HistoryRow[],
  job: JobHistorySource,
  stage: JobHistoryStage,
): HistoryRow[] {
  const allowed = new Set(allowedKeysForStage(stage));
  const present = new Set(logged.map((r) => eventKey(r.event)));
  const extras = synthesizeRows(job).filter(
    (r) => !present.has(eventKey(r.event)),
  );

  return [...logged, ...extras]
    .filter((r) => allowed.has(eventKey(r.event)))
    .sort((a, b) => {
      const ka = eventKey(a.event);
      const kb = eventKey(b.event);
      const rank = keyRank(ka) - keyRank(kb);
      if (rank !== 0) return rank;
      const ta = parseWhen(a.created_at)?.getTime() ?? 0;
      const tb = parseWhen(b.created_at)?.getTime() ?? 0;
      return ta - tb;
    });
}

export function JobHistoryButton({
  job,
  stage,
}: {
  job: JobHistorySource;
  stage: JobHistoryStage;
}) {
  const [open, setOpen] = useState(false);
  const refLabel = job.dti_no?.trim() || `Job #${job.id}`;

  const historyQuery = useQuery({
    queryKey: ["job-history", job.id],
    enabled: open && job.id > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v2/jobs/${job.id}/history`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load history");
      return (json.data ?? []) as HistoryRow[];
    },
  });

  const rows = buildStageHistory(historyQuery.data ?? [], job, stage);

  return (
    <>
      <JobActionButton
        tone="history"
        icon={History}
        label="History"
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
          <div className="border-b border-primary/25 px-5 pt-5 pb-4 sm:px-6">
            <DialogHeader className="mb-0 pr-8">
              <DialogTitle className="flex items-center gap-2.5 text-[1.15rem]">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Clock3 className="size-4" />
                </span>
                Case History
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                <span className="font-semibold text-primary">{refLabel}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · Who did what on this case
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-5 py-3 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {historyQuery.isLoading ? "…" : `${rows.length} events`}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Oldest first
              </span>
            </div>

            <div className="max-h-[min(52vh,28rem)] overflow-auto rounded-lg border border-border/70">
              {historyQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading history…
                </div>
              ) : rows.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No history available yet.
                </div>
              ) : (
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead className="sticky top-0 z-[1] bg-muted/80 backdrop-blur">
                    <tr className="border-b border-border/70">
                      {(
                        [
                          "DATE / TIME",
                          "USER",
                          "EVENT",
                          "ACTIVITY / REMARK",
                        ] as const
                      ).map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const when = parseWhen(row.created_at);
                      return (
                        <tr
                          key={`${row.id}-${index}`}
                          className="border-b border-border/50 last:border-b-0"
                        >
                          <td className="px-3 py-3 align-top">
                            {when ? (
                              <>
                                <div className="text-[13px] font-semibold text-foreground">
                                  {formatDate(when)}
                                </div>
                                <div className="text-[12px] font-semibold text-primary">
                                  {formatTime(when)}
                                </div>
                              </>
                            ) : (
                              <span className="text-[13px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserRound className="size-3.5" />
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-semibold text-foreground">
                                  {row.user_name?.trim() || "System"}
                                </div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                  role :{" "}
                                  {row.user_role?.trim() ||
                                    (row.user_name?.trim() ? "User" : "System")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <span
                              className={cn(
                                "inline-flex max-w-[11rem] truncate rounded-md border border-border/80",
                                "bg-muted/40 px-2 py-1 text-[11px] font-semibold text-foreground",
                              )}
                            >
                              {row.event}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <p className="text-[13px] font-medium leading-snug text-foreground">
                              {row.remark?.trim() || "—"}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <DialogFooter className="mt-0">
            <Button
              type="button"
              className="h-9 min-w-[5.5rem] shadow-none"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
