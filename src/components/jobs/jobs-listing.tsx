"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
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
import { cn } from "@/lib/utils";

const jobActionVariants = cva(
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border p-0 shadow-none transition-colors disabled:opacity-50",
  {
    variants: {
      tone: {
        primary:
          "border-primary/25 bg-primary/10 text-primary hover:border-primary/40 hover:bg-primary/15",
        outline:
          "border-border bg-background text-foreground hover:bg-muted",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900",
        danger:
          "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800",
        info:
          "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800",
        edit:
          "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800",
        history:
          "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800",
        muted:
          "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
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

export function JobsListingCard({
  title,
  description,
  count,
  totalCount,
  toolbar,
  filters,
  loading,
  error,
  empty,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** Visible / filtered row count */
  count?: number;
  /** Unfiltered total (shows “Showing X of Y” when different) */
  totalCount?: number;
  toolbar?: ReactNode;
  /** Filter bar rendered above the table */
  filters?: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: string;
  children?: ReactNode;
  className?: string;
}) {
  const showingFiltered =
    typeof count === "number" &&
    typeof totalCount === "number" &&
    count !== totalCount;

  return (
    <Card className={cn("overflow-hidden border-border/70 shadow-sm", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border/70 bg-muted/15 px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-[14px] leading-none font-semibold">
              {title}
            </CardTitle>
            {typeof count === "number" && !loading ? (
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
        {toolbar ? (
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        ) : null}
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
          <div className="max-h-[min(70vh,52rem)] overflow-auto">{children}</div>
        ) : (
          <JobsEmptyState message={empty ?? "No cases found"} />
        )}
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
    <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm dark:bg-muted/80 [&_tr]:border-border/70">
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

export function JobMetaLine({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mt-0.5 max-w-[12rem] truncate text-[11px] text-muted-foreground">
      {children}
    </div>
  );
}

export function JobActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1.5">
      {children}
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
