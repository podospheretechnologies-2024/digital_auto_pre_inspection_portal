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

import { RegPlate } from "@/components/atlas/reg-plate";
import { jobStatusPill, StatusPill } from "@/components/atlas/status-pill";
import { WaitingBars } from "@/components/atlas/waiting-bars";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

export type DashboardCounts = {
  fresh: number;
  schedule: number;
  qc: number;
  complete: number;
};

export type RecentCase = {
  id: number;
  vehicleno: string;
  vehicle_type: string | null;
  cname: string | null;
  bank: string | null;
  status: string;
  cdate: Date;
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

/** The template's coloured top card: soft tint, icon, label and figure, all centred. */
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
        "rounded-lg p-6 text-center transition-transform duration-200 ease-in-out hover:scale-[1.03]",
        tint,
      )}
    >
      <span
        className={cn(
          "mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-background/70",
          ink,
        )}
      >
        <Icon className="size-6" />
      </span>
      <p className={cn("mb-1 font-semibold", ink)}>{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", ink)}>
        {value.toLocaleString()}
      </p>
    </Link>
  );
}

export function DashboardView({
  firstName,
  signedInAs,
  counts,
  countsError,
  recent,
  showRoleNote,
}: {
  firstName: string;
  signedInAs: string;
  counts: DashboardCounts;
  countsError: string | null;
  recent: RecentCase[];
  showRoleNote: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Welcome */}
      <div className="relative col-span-12 flex items-center justify-between overflow-hidden rounded-lg bg-lightsecondary p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
            {initials(firstName)}
          </span>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold">
              Welcome back! {firstName} 👋
            </h1>
            <p className="text-muted-foreground">{signedInAs}</p>
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

      {/* Top cards */}
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
      {showRoleNote ? (
        <p className="col-span-12 -mt-3 text-xs text-muted-foreground">
          Counts cover all jobs. Your list pages may still filter by role.
        </p>
      ) : null}

      {/* Recent cases */}
      <Card className="col-span-12 lg:col-span-8">
        <CardHeader>
          <CardTitle>Recent cases</CardTitle>
          <CardDescription>The latest intimations, newest first</CardDescription>
          <CardAction>
            <LinkButton href="/jobs" variant="outline" size="sm">
              View all
              <ArrowUpRight className="size-3.5" />
            </LinkButton>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 text-sm font-semibold">Vehicle</TableHead>
                <TableHead className="text-sm font-semibold">Customer</TableHead>
                <TableHead className="text-sm font-semibold">Bank</TableHead>
                <TableHead className="text-sm font-semibold">Status</TableHead>
                <TableHead className="pr-6 text-right text-sm font-semibold">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No cases yet — new intimations appear here as soon as they
                    are created.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((job) => {
                  const pill = jobStatusPill(job.status);
                  return (
                    <TableRow key={job.id} className="border-b border-border">
                      <TableCell className="py-3 pl-6">
                        <Link
                          href={inspectPathForJob(job.id, job.vehicle_type)}
                          className="hover:underline"
                        >
                          <RegPlate value={job.vehicleno} />
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[170px] truncate font-medium">
                        {job.cname ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted-foreground">
                        {job.bank ?? "—"}
                      </TableCell>
                      <TableCell>
                        {pill ? (
                          <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right text-muted-foreground tabular-nums">
                        {job.cdate.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Side panels */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="-my-1 space-y-1 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center justify-between rounded-md px-3 py-2.5 font-medium transition-colors hover:bg-lightprimary hover:text-primary"
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
