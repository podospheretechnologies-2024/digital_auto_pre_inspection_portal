"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WaitingBars } from "@/components/atlas/waiting-bars";
import { CaseAnalyticsChart } from "@/components/dashboard/case-analytics-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardAnalytics } from "@/lib/jobs/dashboard-analytics";
import { cn } from "@/lib/utils";

export type DashboardCounts = {
  fresh: number;
  schedule: number;
  qc: number;
  complete: number;
};

// Pages that are not in the sidebar, so they stay one click away.
const quickLinks = [
  { label: "All jobs", href: "/jobs" },
  { label: "Surveyor pending list", href: "/jobs/pending" },
  { label: "Activity log", href: "/logs/activity" },
  { label: "PDF tools", href: "/tools/pdf" },
];

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "DA";
}

function TopCard({
  label,
  value,
  href,
  icon: Icon,
  tint,
  ink,
}: {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  tint: string;
  ink: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl p-5 shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        tint,
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm",
          ink,
        )}
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 text-left">
        <span className={cn("block text-[13px] font-medium", ink)}>{label}</span>
        <span
          className={cn(
            "mt-1 block text-3xl font-semibold tabular-nums leading-none tracking-tight",
            ink,
          )}
        >
          {value.toLocaleString()}
        </span>
      </span>
      <ArrowUpRight
        className={cn(
          "ml-auto size-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100",
          ink,
        )}
      />
    </Link>
  );
}

export function DashboardView({
  firstName,
  signedInAs,
  counts,
  countsError,
  analytics,
}: {
  firstName: string;
  signedInAs: string;
  counts: DashboardCounts;
  countsError: string | null;
  analytics: DashboardAnalytics;
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Welcome */}
      <div className="relative col-span-12 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#e7f0ff] via-[#f5f8ff] to-[#e8f7ff] p-6 shadow-sm ring-1 ring-sky-100">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-md shadow-primary/25">
            {initials(firstName)}
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              Pre-Inspection
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Welcome back! {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground">{signedInAs}</p>
          </div>
        </div>
        <div className="pointer-events-none absolute right-8 bottom-0 hidden sm:block">
          <Image
            src="/images/dashboard/customer-support-img.png"
            alt=""
            width={145}
            height={95}
          />
        </div>
      </div>

      {countsError ? (
        <p className="col-span-12 text-sm text-destructive">{countsError}</p>
      ) : null}

      <div className="col-span-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <TopCard
          label="Fresh cases"
          value={counts.fresh}
          href="/jobs/fresh"
          icon={Zap}
          tint="bg-lightprimary"
          ink="text-info"
        />
        <TopCard
          label="Assigned"
          value={counts.schedule}
          href="/jobs/schedule"
          icon={UserPlus}
          tint="bg-lightsecondary"
          ink="text-info"
        />
        <TopCard
          label="Quality check"
          value={counts.qc}
          href="/jobs/qc"
          icon={ShieldCheck}
          tint="bg-lightwarning"
          ink="text-warn"
        />
        <TopCard
          label="Completed"
          value={counts.complete}
          href="/jobs/complete"
          icon={CheckCircle2}
          tint="bg-lightsuccess"
          ink="text-ok"
        />
      </div>

      <Card className="col-span-12 gap-0 overflow-hidden rounded-2xl py-0 shadow-sm lg:col-span-8">
        <CaseAnalyticsChart data={analytics} />
      </Card>

      {/* Side panels */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Where cases are waiting</CardTitle>
            <CardDescription>Open work by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <WaitingBars
              rows={[
                { label: "Fresh", value: counts.fresh, href: "/jobs/fresh" },
                {
                  label: "Assigned",
                  value: counts.schedule,
                  href: "/jobs/schedule",
                },
                { label: "Quality check", value: counts.qc, href: "/jobs/qc" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="flex-1 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="-my-1 space-y-1 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-colors hover:bg-lightprimary hover:text-primary"
                  >
                    {l.label}
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="col-span-12 text-xs text-muted-foreground">
        This dashboard covers Pre-Inspection only.
      </p>
    </div>
  );
}
