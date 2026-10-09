"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Inbox, Building2, Calendar, Clock, Phone, UserRound, Zap, UserPlus, ShieldCheck, CheckCircle2, CirclePause, Ban, ClipboardList } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ActionOverflow,
  useInActionMenu,
} from "@/components/ui/action-overflow";
import { cn } from "@/lib/utils";

const jobActionVariants = cva(
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent p-0 text-white shadow-none transition-colors disabled:opacity-50",
  {
    variants: {
      tone: {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "bg-slate-600 text-white hover:bg-slate-700",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        warning: "bg-amber-500 text-white hover:bg-amber-600",
        danger: "bg-red-600 text-white hover:bg-red-700",
        info: "bg-sky-600 text-white hover:bg-sky-700",
        edit: "bg-violet-600 text-white hover:bg-violet-700",
        history: "bg-teal-600 text-white hover:bg-teal-700",
        stage: "bg-orange-500 text-white hover:bg-orange-600",
        view: "bg-cyan-600 text-white hover:bg-cyan-700",
        pdf: "bg-fuchsia-600 text-white hover:bg-fuchsia-700",
        muted: "bg-slate-500 text-white hover:bg-slate-600",
      },
    },
    defaultVariants: {
      tone: "outline",
    },
  },
);

type JobActionTone = NonNullable<
  VariantProps<typeof jobActionVariants>["tone"]
>;

const jobActionToneClass: Record<JobActionTone, string> = {
  primary: "bg-blue-600",
  outline: "bg-slate-600",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
  info: "bg-sky-600",
  edit: "bg-violet-600",
  history: "bg-teal-600",
  stage: "bg-orange-500",
  view: "bg-cyan-600",
  pdf: "bg-fuchsia-600",
  muted: "bg-slate-500",
};

const actionMenuRow =
  "inline-flex h-9 w-full shrink-0 cursor-pointer items-center justify-start gap-2 rounded-lg border-0 bg-transparent px-2 text-left text-[13px] font-medium text-foreground shadow-none hover:bg-muted";

export type SectionMark =
  | "fresh"
  | "assigned"
  | "qc"
  | "hold"
  | "complete"
  | "cancel"
  | "pending"
  | "all";

const sectionMarks: Record<
  SectionMark,
  { label: string; icon: LucideIcon; tint: string; ink: string }
> = {
  fresh: {
    label: "Fresh cases",
    icon: Zap,
    tint: "bg-lightprimary",
    ink: "text-info",
  },
  assigned: {
    label: "Assigned",
    icon: UserPlus,
    tint: "bg-lightsecondary",
    ink: "text-info",
  },
  qc: {
    label: "Quality check",
    icon: ShieldCheck,
    tint: "bg-lightwarning",
    ink: "text-warn",
  },
  hold: {
    label: "Hold",
    icon: CirclePause,
    tint: "bg-amber-50 dark:bg-amber-500/15",
    ink: "text-amber-700 dark:text-amber-300",
  },
  complete: {
    label: "Completed",
    icon: CheckCircle2,
    tint: "bg-lightsuccess",
    ink: "text-ok",
  },
  cancel: {
    label: "Cancel",
    icon: Ban,
    tint: "bg-red-50 dark:bg-red-500/15",
    ink: "text-red-700 dark:text-red-300",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    tint: "bg-lightprimary",
    ink: "text-info",
  },
  all: {
    label: "All jobs",
    icon: ClipboardList,
    tint: "bg-lightsecondary",
    ink: "text-info",
  },
};

function SectionAnalytics({
  mark,
  value,
}: {
  mark: SectionMark;
  value: number;
}) {
  const item = sectionMarks[mark];
  const Icon = item.icon;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5",
        item.tint,
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full bg-background/80",
          item.ink,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block text-[11px] font-semibold", item.ink)}>
          {item.label}
        </span>
        <span
          className={cn(
            "block text-[15px] font-semibold tabular-nums leading-none",
            item.ink,
          )}
        >
          {value.toLocaleString()}
        </span>
      </span>
    </div>
  );
}

export function JobsListingCard({
  title,
  description,
  count,
  totalCount,
  mark,
  toolbar,
  filters,
  loading,
  error,
  empty,
  footer,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** Visible / filtered row count */
  count?: number;
  /** Unfiltered total (shows “Showing X of Y” when different) */
  totalCount?: number;
  /** Section analytics chip on the right of the list header */
  mark?: SectionMark;
  toolbar?: ReactNode;
  /** Filter bar rendered above the table */
  filters?: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const showingFiltered =
    typeof count === "number" &&
    typeof totalCount === "number" &&
    count !== totalCount;

  return (
    <Card className={cn("overflow-hidden rounded-2xl border-border/70 shadow-sm", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-[14px] leading-none font-semibold">
              {title}
            </CardTitle>
            {typeof count === "number" && !loading && !mark ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold tabular-nums text-primary">
                {count}
              </span>
            ) : null}
            {showingFiltered && !loading ? (
              <span className="text-[11px] text-muted-foreground">
                Showing {count} of {totalCount}
              </span>
            ) : null}
          </div>
          {description ? (
            <CardDescription className="mt-1 text-[12px]">
              {description}
            </CardDescription>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {toolbar}
          {mark && !loading && typeof (totalCount ?? count) === "number" ? (
            <SectionAnalytics mark={mark} value={(totalCount ?? count) as number} />
          ) : null}
        </div>
      </CardHeader>
      {filters}
      <CardContent className="p-0">
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading cases…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-sm text-destructive">
            {error}
          </div>
        ) : children ? (
          <div>{children}</div>
        ) : (
          <JobsEmptyState message={empty ?? "No cases found"} />
        )}
        {!loading && !error ? footer : null}
      </CardContent>
    </Card>
  );
}

export function JobsEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-4" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function JobsTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Table className={cn("text-[13px]", className)}>{children}</Table>;
}

export function JobsTableHeader({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm [&_tr]:border-border/70">
      {children}
    </TableHeader>
  );
}

export function JobsTableHead({
  className,
  children,
  ...props
}: ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        "h-8 px-2.5 text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </TableHead>
  );
}

export function JobsTableRow({
  className,
  ...props
}: ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn("border-border/50 hover:bg-muted/25", className)}
      {...props}
    />
  );
}

export function JobsTableCell({
  className,
  ...props
}: ComponentProps<typeof TableCell>) {
  return (
    <TableCell className={cn("px-2.5 py-2 align-middle", className)} {...props} />
  );
}

export function JobSerialHead({ className }: { className?: string }) {
  return (
    <JobsTableHead className={cn("w-12 text-center", className)}>
      S.No
    </JobsTableHead>
  );
}

export function JobSerialCell({ index }: { index: number }) {
  return (
    <JobsTableCell className="w-12 text-center tabular-nums text-[12px] font-medium text-muted-foreground">
      {String(index + 1).padStart(2, "0")}
    </JobsTableCell>
  );
}

export function JobDtiCell({ value }: { value?: string | number | null }) {
  return (
    <span className="font-semibold tracking-wide text-foreground">
      {value ?? "—"}
    </span>
  );
}

export function JobMetaLine({
  children,
  full = false,
}: {
  children?: ReactNode;
  full?: boolean;
}) {
  if (!children) return null;
  return (
    <div
      className={cn(
        "mt-0.5 text-[11px] leading-snug text-muted-foreground",
        full ? "whitespace-normal break-words" : "max-w-[12rem] truncate",
      )}
    >
      {children}
    </div>
  );
}

function deskParts(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function SheetDateTime({
  value,
}: {
  value?: Date | string | null;
}) {
  const date = deskParts(value);
  const dateLabel = date
    ? date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const timeLabel = date
    ? date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-[12px] text-foreground">
        <Calendar className="size-3.5 shrink-0 text-sky-600" />
        <span className="tabular-nums">{dateLabel}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="size-3.5 shrink-0 text-amber-600" />
        <span className="tabular-nums">{timeLabel}</span>
      </div>
    </div>
  );
}

export function SheetPerson({
  name,
  phone,
}: {
  name?: string | null;
  phone?: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <UserRound className="size-3.5 shrink-0 text-violet-600" />
        <span className="truncate">{name || "—"}</span>
      </div>
      {phone ? (
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Phone className="size-3 shrink-0 text-emerald-600" />
          <span className="truncate">{phone}</span>
        </div>
      ) : null}
    </div>
  );
}

export function SheetBank({
  name,
  meta,
}: {
  name?: string | null;
  meta?: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <Building2 className="size-3.5 shrink-0 text-orange-600" />
        <span className="max-w-[150px] truncate" title={name ?? undefined}>
          {name || "—"}
        </span>
      </div>
      {meta ? <JobMetaLine>{meta}</JobMetaLine> : null}
    </div>
  );
}

export function JobActions({ children }: { children: ReactNode }) {
  return <ActionOverflow>{children}</ActionOverflow>;
}

export const SHEET_PAGE_SIZE = 10;

export function useSheetPage<T extends { id?: number | string | null }>(
  items: T[],
) {
  const [page, setPage] = useState(1);
  const signature = items.map((item) => item.id ?? "").join(",");
  const pageCount = Math.max(1, Math.ceil(items.length / SHEET_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [signature]);

  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * SHEET_PAGE_SIZE;

  return {
    page: safePage,
    pageCount,
    start,
    pageItems: items.slice(start, start + SHEET_PAGE_SIZE),
    setPage: (next: number) =>
      setPage(Math.min(Math.max(1, next), pageCount)),
    total: items.length,
  };
}

export function SheetPager({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages: Array<number | "gap"> = [];
  if (pageCount <= 7) {
    for (let n = 1; n <= pageCount; n += 1) pages.push(n);
  } else {
    pages.push(1);
    const from = Math.max(2, page - 1);
    const to = Math.min(pageCount - 1, page + 1);
    if (from > 2) pages.push("gap");
    for (let n = from; n <= to; n += 1) pages.push(n);
    if (to < pageCount - 1) pages.push("gap");
    pages.push(pageCount);
  }

  const buttonClass =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border/70 px-3 py-2.5">
      <button
        type="button"
        className={buttonClass}
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-[12px] text-muted-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              buttonClass,
              item === page &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={buttonClass}
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

type JobActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "size" | "variant" | "children"
> & {
  tone?: JobActionTone;
  icon: LucideIcon;
  label: string;
};

export function JobActionButton({
  tone = "outline",
  icon: Icon,
  label,
  className,
  ...props
}: JobActionButtonProps) {
  const inMenu = useInActionMenu();
  if (inMenu) {
    return (
      <Button
        variant="ghost"
        aria-label={label}
        className={cn(actionMenuRow, className)}
        {...props}
      >
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-white",
            jobActionToneClass[tone],
          )}
        >
          <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
        </span>
        <span className="truncate">{label}</span>
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={label}
            className={cn(jobActionVariants({ tone }), className)}
            {...props}
          />
        }
      >
        <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="px-2 py-1 text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type JobActionLinkProps = Omit<ComponentProps<typeof Link>, "className" | "children"> & {
  tone?: JobActionTone;
  icon: LucideIcon;
  label: string;
  className?: string;
};

export function JobActionLink({
  tone = "outline",
  icon: Icon,
  label,
  className,
  ...props
}: JobActionLinkProps) {
  const inMenu = useInActionMenu();
  if (inMenu) {
    return (
      <Link
        aria-label={label}
        className={cn(actionMenuRow, className)}
        {...props}
      >
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-white",
            jobActionToneClass[tone],
          )}
        >
          <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
        </span>
        <span className="truncate">{label}</span>
      </Link>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            aria-label={label}
            className={cn(
              buttonVariants({ size: "icon-sm", variant: "ghost" }),
              jobActionVariants({ tone }),
              className,
            )}
            {...props}
          />
        }
      >
        <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="px-2 py-1 text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export { TableBody };
