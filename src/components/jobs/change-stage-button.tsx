"use client";

import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { JobActionButton } from "@/components/jobs/jobs-listing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ChangeStageTarget } from "@/lib/jobs/schemas";
import { cn } from "@/lib/utils";

/** Desk where the Change Stage control is shown */
export type ChangeStageFrom = "assigned" | "qc" | "complete";

type StageOption = {
  value: ChangeStageTarget;
  label: string;
};

const OPTIONS_BY_FROM: Record<ChangeStageFrom, StageOption[]> = {
  complete: [
    { value: "qc_pending", label: "Quality Check" },
    { value: "assigned", label: "Assign Case" },
    { value: "fresh", label: "Fresh Case" },
  ],
  qc: [
    { value: "assigned", label: "Assign Case" },
    { value: "fresh", label: "Fresh Case" },
  ],
  assigned: [{ value: "fresh", label: "Fresh Case" }],
};

export function ChangeStageButton({
  from,
  jobId,
  dtiNo,
  disabled,
  onSuccess,
}: {
  from: ChangeStageFrom;
  jobId: number | null | undefined;
  dtiNo?: string | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => OPTIONS_BY_FROM[from], [from]);
  const refLabel = dtiNo?.trim() || (jobId != null ? String(jobId) : "—");

  if (jobId == null || jobId <= 0) return null;

  function close() {
    if (busy) return;
    setOpen(false);
    setStage("");
  }

  async function submit() {
    if (!stage) {
      toast.error("Please select a stage");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/v2/jobs/${jobId}/change-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Change stage failed");
      const label =
        options.find((o) => o.value === stage)?.label ?? "selected stage";
      toast.success(`Moved to ${label}`);
      setOpen(false);
      setStage("");
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Change stage failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <JobActionButton
        tone="warning"
        icon={ArrowLeftRight}
        label="Change Stage"
        disabled={disabled || busy}
        onClick={() => {
          setStage("");
          setOpen(true);
        }}
      />

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[24rem]" showCloseButton={!busy}>
          <DialogHeader className="mb-3">
            <DialogTitle className="flex items-center gap-2 text-[1.05rem]">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ArrowLeftRight className="size-4" />
              </span>
              Change Stage
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Reference number:{" "}
              <span className="font-medium text-foreground">{refLabel}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Update stage
            </Label>
            <select
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              )}
              value={stage}
              disabled={busy}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="">Select stage</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 shadow-none"
              disabled={busy}
              onClick={close}
            >
              Close
            </Button>
            <Button
              type="button"
              className="h-9 min-w-[6.5rem] shadow-none"
              disabled={busy || !stage}
              onClick={() => void submit()}
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
