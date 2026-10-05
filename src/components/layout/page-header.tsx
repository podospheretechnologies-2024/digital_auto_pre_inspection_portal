"use client";

import {
  Ban,
  Building2,
  CheckCircle2,
  CirclePause,
  ClipboardCheck,
  ClipboardPlus,
  CloudDownload,
  LayoutGrid,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs";
import { cn } from "@/lib/utils";

function iconForPath(pathname: string): LucideIcon {
  if (pathname.startsWith("/jobs/assign")) return ClipboardPlus;
  if (pathname.startsWith("/jobs/fresh")) return Zap;
  if (pathname.startsWith("/jobs/schedule")) return UserPlus;
  if (pathname.startsWith("/jobs/pending")) return ClipboardCheck;
  if (pathname.startsWith("/jobs/qc")) return ShieldCheck;
  if (pathname.startsWith("/jobs/complete")) return CheckCircle2;
  if (pathname.startsWith("/jobs/hold")) return CirclePause;
  if (pathname.startsWith("/jobs/cancel")) return Ban;
  if (pathname.startsWith("/jobs/inspect")) return ClipboardCheck;
  if (pathname.startsWith("/jobs/reports")) return CloudDownload;
  if (pathname.startsWith("/jobs")) return LayoutGrid;
  if (pathname.startsWith("/masters")) return Building2;
  if (pathname.startsWith("/account/staff-permissions")) return ShieldCheck;
  if (pathname.startsWith("/account")) return Users;
  if (pathname.startsWith("/tools")) return Wrench;
  if (pathname.startsWith("/logs")) return Settings;
  return LayoutGrid;
}

/** Compact page title panel — used across admin / workflow screens. */
export function PageHeader({
  title,
  description,
  badge,
  eyebrow,
  actions,
  icon,
}: {
  title: string;
  description?: string;
  badge?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
}) {
  const pathname = usePathname();
  const Icon = icon ?? iconForPath(pathname);

  return (
    <header
      className={cn(
        "relative mb-4 overflow-hidden rounded-lg border border-border/70",
        "bg-[color-mix(in_oklab,var(--background)_90%,var(--primary)_10%)]",
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-primary" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 pl-5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              "border border-border/60 bg-background text-primary",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5">
              <PageBreadcrumbs />
              {eyebrow ? (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-[10px] font-semibold tracking-[0.12em] text-primary/75 uppercase">
                    {eyebrow}
                  </span>
                </>
              ) : null}
              {badge ? (
                <span className="rounded-full border border-border/70 bg-background/80 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h1 className="text-[1.05rem] leading-tight font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="truncate text-[12px] leading-tight text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
