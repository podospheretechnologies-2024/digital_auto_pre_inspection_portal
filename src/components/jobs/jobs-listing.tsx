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
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md p-0 shadow-none transition-colors",
  {
    variants: {
      tone: {
        primary:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted",
        success:
          "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
        warning:
          "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        danger:
          "border-transparent bg-red-600 text-white hover:bg-red-700",
        muted:
          "border border-border/80 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
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
  toolbar,
  loading,
  error,
  empty,
  children,
  className,
}: {
  title: string;
  description?: string;
  count?: number;
  toolbar?: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border/70 shadow-sm", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border/70 bg-muted/15 px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[14px] leading-none font-semibold">
              {title}
            </CardTitle>
            {typeof count === "number" && !loading ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold tabular-nums text-primary">
                {count}
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
          children
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
    <TableHeader className="bg-slate-50/90 dark:bg-muted/40 [&_tr]:border-border/70">
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
    <div className="flex flex-nowrap items-center justify-end gap-1">
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
