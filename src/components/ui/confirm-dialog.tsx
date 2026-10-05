"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CirclePause,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmTone = "default" | "danger" | "warning" | "success" | "hold";

const toneStyles: Record<
  ConfirmTone,
  {
    icon: LucideIcon;
    iconWrap: string;
    confirmClass: string;
  }
> = {
  default: {
    icon: AlertTriangle,
    iconWrap: "bg-primary/10 text-primary ring-primary/15",
    confirmClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  hold: {
    icon: CirclePause,
    iconWrap: "bg-amber-500 text-white ring-amber-500/20",
    confirmClass:
      "bg-amber-500 text-white hover:bg-amber-600 shadow-none",
  },
  danger: {
    icon: Ban,
    iconWrap: "bg-red-600 text-white ring-red-600/20",
    confirmClass: "bg-red-600 text-white hover:bg-red-700 shadow-none",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-500 text-white ring-amber-500/20",
    confirmClass: "bg-amber-500 text-white hover:bg-amber-600 shadow-none",
  },
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-emerald-600 text-white ring-emerald-600/20",
    confirmClass: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-none",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Keep",
  tone = "default",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
}) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[22rem]">
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              "mb-3.5 flex size-12 items-center justify-center rounded-full ring-8",
              style.iconWrap,
            )}
          >
            <Icon className="size-5" strokeWidth={2.25} />
          </span>
          <DialogHeader className="items-center gap-1 pr-0 text-center">
            <DialogTitle className="text-[1.05rem] font-semibold tracking-tight">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="max-w-[18rem] text-[12.5px] leading-snug">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 min-w-[6.5rem] shadow-none"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={cn("h-9 min-w-[7.5rem]", style.confirmClass)}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
