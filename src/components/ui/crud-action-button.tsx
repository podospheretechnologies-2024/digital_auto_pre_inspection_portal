"use client";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

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

const toneClass: Record<CrudActionTone, string> = {
  approve:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800",
  edit: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800",
  password:
    "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800",
  deactivate:
    "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900",
  activate:
    "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800",
  delete:
    "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800",
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
  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      {children}
    </div>
  );
}
