"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, UserPlus, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type { JobStageCounts } from "@/lib/jobs/stage-counts";
import { cn } from "@/lib/utils";

const stages: Array<{
  key: keyof JobStageCounts;
  label: string;
  href: string;
  icon: LucideIcon;
  tint: string;
  ink: string;
}> = [
  {
    key: "fresh",
    label: "Fresh cases",
    href: "/jobs/fresh",
    icon: Zap,
    tint: "bg-lightprimary",
    ink: "text-info",
  },
  {
    key: "schedule",
    label: "Assigned",
    href: "/jobs/schedule",
    icon: UserPlus,
    tint: "bg-lightsecondary",
    ink: "text-info",
  },
  {
    key: "qc",
    label: "Quality check",
    href: "/jobs/qc",
    icon: ShieldCheck,
    tint: "bg-lightwarning",
    ink: "text-warn",
  },
  {
    key: "complete",
    label: "Completed",
    href: "/jobs/complete",
    icon: CheckCircle2,
    tint: "bg-lightsuccess",
    ink: "text-ok",
  },
];

export function WorkflowStageCounts() {
  const query = useQuery({
    queryKey: ["job-stage-counts"],
    queryFn: async () => {
      const response = await fetch("/api/v2/jobs/stage-counts");
      const json = (await response.json()) as {
        data?: JobStageCounts;
        message?: string;
      };
      if (!response.ok || !json.data) {
        throw new Error(json.message ?? "Failed to load workflow counts");
      }
      return json.data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  if (query.isError) {
    return (
      <p className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        {query.error instanceof Error
          ? query.error.message
          : "Failed to load workflow counts"}
      </p>
    );
  }

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stages.map(({ key, label, href, icon: Icon, tint, ink }) => (
        <Link
          key={key}
          href={href}
          aria-label={`${label}: ${query.data?.[key] ?? "loading"}`}
          className={cn(
            "rounded-lg p-4 text-center transition-transform duration-200 ease-in-out hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5",
            tint,
          )}
        >
          <span
            className={cn(
              "mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-background/70",
              ink,
            )}
          >
            <Icon className="size-5" />
          </span>
          <p className={cn("mb-0.5 text-sm font-semibold", ink)}>{label}</p>
          <p className={cn("text-2xl font-semibold tabular-nums", ink)}>
            {query.isPending ? "—" : query.data?.[key].toLocaleString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
