import Link from "next/link";

import { cn } from "@/lib/utils";
import { WORKFLOW_STEPS, type WorkflowStatus } from "@/lib/jobs/helpers";

/** Visual strip matching Create → Fresh → Assign → QC → Completed */
export function WorkflowStrip({
  active,
  className,
}: {
  active?: WorkflowStatus | string;
  className?: string;
}) {
  const normalized =
    active === "unassigned"
      ? "fresh"
      : active === "inspected"
        ? "qc_pending"
        : active === "qc_done"
          ? "completed"
          : active;

  return (
    <nav
      aria-label="Case workflow"
      className={cn(
        "mb-5 flex flex-wrap items-center gap-1.5 text-[12px]",
        className,
      )}
    >
      <span className="mr-1 font-semibold text-muted-foreground">Flow:</span>
      <Link
        href="/jobs/assign"
        className="rounded-full border border-slate-200 px-2.5 py-1 text-slate-600 hover:border-primary hover:text-primary"
      >
        Create
      </Link>
      <span className="text-muted-foreground">→</span>
      {WORKFLOW_STEPS.map((step, i) => {
        const isActive = normalized === step.key;
        return (
          <span key={step.key} className="flex items-center gap-1.5">
            {i > 0 ? <span className="text-muted-foreground">→</span> : null}
            <Link
              href={step.href}
              className={cn(
                "rounded-full border px-2.5 py-1 font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary",
              )}
            >
              {step.label}
            </Link>
          </span>
        );
      })}
      <span className="mx-1 text-muted-foreground">|</span>
      <Link
        href="/jobs/hold"
        className={cn(
          "rounded-full border px-2.5 py-1",
          normalized === "hold"
            ? "border-amber-500 bg-amber-50 text-amber-800"
            : "border-slate-200 text-slate-600 hover:border-amber-400",
        )}
      >
        Hold
      </Link>
      <Link
        href="/jobs/cancel"
        className={cn(
          "rounded-full border px-2.5 py-1",
          normalized === "cancelled"
            ? "border-red-500 bg-red-50 text-red-800"
            : "border-slate-200 text-slate-600 hover:border-red-400",
        )}
      >
        Cancel
      </Link>
    </nav>
  );
}
