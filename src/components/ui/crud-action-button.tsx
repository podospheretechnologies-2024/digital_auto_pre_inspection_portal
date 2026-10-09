"use client";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import {
  ActionOverflow,
  useInActionMenu,
} from "@/components/ui/action-overflow";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type CrudActionTone =
  | "approve"
  | "edit"
  | "password"
  | "deactivate"
  | "activate"
  | "delete";

const toneIconClass: Record<CrudActionTone, string> = {
  approve: "bg-emerald-600",
  edit: "bg-violet-600",
  password: "bg-indigo-600",
  deactivate: "bg-amber-500",
  activate: "bg-lime-600",
  delete: "bg-red-600",
};

const toneClass: Record<CrudActionTone, string> = {
  approve: "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
  edit: "border-transparent bg-violet-600 text-white hover:bg-violet-700",
  password: "border-transparent bg-indigo-600 text-white hover:bg-indigo-700",
  deactivate: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
  activate: "border-transparent bg-lime-600 text-white hover:bg-lime-700",
  delete: "border-transparent bg-red-600 text-white hover:bg-red-700",
};

type CrudActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "size" | "variant" | "children"
> & {
  tone: CrudActionTone;
  icon: LucideIcon;
  label: string;
};

export function CrudActionButton({
  tone,
  icon: Icon,
  label,
  className,
  ...props
}: CrudActionButtonProps) {
  const inMenu = useInActionMenu();
  if (inMenu) {
    return (
      <Button
        variant="ghost"
        aria-label={label}
        className={cn(
          "inline-flex h-9 w-full shrink-0 items-center justify-start gap-2 rounded-lg border-0 bg-transparent px-2 text-left text-[13px] font-medium text-foreground shadow-none hover:bg-muted",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-white",
            toneIconClass[tone],
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
            className={cn(
              "size-8 shrink-0 rounded-lg border shadow-none transition-colors disabled:opacity-50",
              toneClass[tone],
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

export function CrudActionGroup({ children }: { children: React.ReactNode }) {
  return <ActionOverflow>{children}</ActionOverflow>;
}
