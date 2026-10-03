import { cn } from "@/lib/utils";

/** Semantic tones — same roles as the Atlas design (ok / warn / bad / info / accent). */
export type Tone = "ok" | "warn" | "bad" | "info" | "accent" | "neutral";

const toneClass: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  accent: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
};

export const toneDotClass: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  info: "bg-info",
  accent: "bg-primary",
  neutral: "bg-muted-foreground/60",
};

export function StatusPill({
  tone = "neutral",
  dot = true,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-full", toneDotClass[tone])} />
      ) : null}
      {children}
    </span>
  );
}

const jobStatusMeta: Record<string, { tone: Tone; label: string }> = {
  fresh: { tone: "info", label: "Fresh" },
  unassigned: { tone: "info", label: "Fresh" },
  assigned: { tone: "accent", label: "Assigned" },
  qc_pending: { tone: "warn", label: "QC pending" },
  inspected: { tone: "warn", label: "QC pending" },
  completed: { tone: "ok", label: "Completed" },
  qc_done: { tone: "ok", label: "Completed" },
  hold: { tone: "warn", label: "Hold" },
  cancelled: { tone: "bad", label: "Cancelled" },
};

/** Tone + label for the derived workflow status (see lib/jobs/helpers.ts). */
export function jobStatusPill(status?: string | null): {
  tone: Tone;
  label: string;
} | null {
  if (!status) return null;
  return (
    jobStatusMeta[status] ?? { tone: toneForStatus(status), label: status }
  );
}

/** Best-effort tone for a free-text job status coming from the legacy data. */
export function toneForStatus(status?: string | null): Tone {
  const s = (status ?? "").toLowerCase();
  if (!s) return "neutral";
  if (/(cancel|reject|fail|overdue|breach|error|block)/.test(s)) return "bad";
  if (/(complete|done|approved|closed|success|verified|final)/.test(s))
    return "ok";
  if (/(qc|review|pending|hold|wait|progress|partial)/.test(s)) return "warn";
  if (/(schedul|assign|inspect)/.test(s)) return "accent";
  if (/(fresh|new|open|creat)/.test(s)) return "info";
  return "neutral";
}
