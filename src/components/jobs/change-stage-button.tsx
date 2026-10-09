"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { toast as notice } from "@/lib/toast";

import { JobActionButton } from "@/components/jobs/jobs-listing";
import { refreshJobSheets } from "@/lib/jobs/refresh-sheets";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Desk where the Change Stage control is shown */
export type ChangeStageFrom = "assigned" | "qc" | "complete";

type StageOption = {
  value: ChangeStageTarget;
  label: string;
  detail: string;
};

const STAGE_DETAIL: Record<ChangeStageTarget, string> = {
  qc_pending: "The inspection stays, and quality check opens again.",
  assigned: "The inspection and photos are removed. The surveyor stays assigned.",
  fresh: "The inspection is removed, and the surveyor is cleared.",
};

const FROM_LABEL: Record<ChangeStageFrom, string> = {
  complete: "Completed",
  qc: "Quality Check",
  assigned: "Assign Case",
};

const OPTIONS_BY_FROM: Record<ChangeStageFrom, StageOption[]> = {
  complete: [
    { value: "qc_pending", label: "Quality Check", detail: STAGE_DETAIL.qc_pending },
    { value: "assigned", label: "Assign Case", detail: STAGE_DETAIL.assigned },
    { value: "fresh", label: "Fresh Case", detail: STAGE_DETAIL.fresh },
  ],
  qc: [
    { value: "assigned", label: "Assign Case", detail: STAGE_DETAIL.assigned },
    { value: "fresh", label: "Fresh Case", detail: STAGE_DETAIL.fresh },
  ],
  assigned: [{ value: "fresh", label: "Fresh Case", detail: STAGE_DETAIL.fresh }],
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
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<"stage" | "reason" | null>(null);

  const options = useMemo(() => OPTIONS_BY_FROM[from], [from]);
  const refLabel = dtiNo?.trim() || (jobId != null ? String(jobId) : "—");
  const chosen = options.find((o) => o.value === stage);

  if (jobId == null || jobId <= 0) return null;

  function close() {
    if (busy) return;
    setOpen(false);
    setStage("");
    setReason("");
    setFieldError(null);
  }

  async function submit() {
    if (!stage) {
      setFieldError("stage");
      return;
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      setFieldError("reason");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/v2/jobs/${jobId}/change-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, reason: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Change stage failed");
      const label =
        options.find((o) => o.value === stage)?.label ?? "selected stage";
      notice.success(`Moved to ${label}`);
      setStage("");
      setReason("");
      setFieldError(null);
      setOpen(false);
      onSuccess?.();
      await refreshJobSheets(queryClient);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Change stage failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <JobActionButton
        tone="stage"
        icon={ArrowLeftRight}
        label="Change Stage"
        disabled={disabled || busy}
        onClick={() => {
          setStage("");
          setReason("");
          setFieldError(null);
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
        <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
          <DialogHeader className="mb-3">
            <DialogTitle className="flex items-center gap-2 text-[1.05rem]">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ArrowLeftRight className="size-4" />
              </span>
              Change Stage
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              <span className="font-semibold text-primary">{refLabel}</span>
              <span className="text-muted-foreground">
                {" "}
                · Now in {FROM_LABEL[from]}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Move this case to
            </Label>
            <div className="space-y-2" id="change-stage-target">
              {options.map((o) => {
                const selected = stage === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setStage(o.value);
                      if (fieldError === "stage") setFieldError(null);
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border/80 bg-background hover:bg-muted/40",
                      fieldError === "stage" && !selected && "border-red-500",
                    )}
                  >
                    <div className="text-[13px] font-semibold text-foreground">
                      {o.label}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                      {o.detail}
                    </p>
                  </button>
                );
              })}
            </div>
            {fieldError === "stage" ? (
              <p className="text-[11px] font-medium text-red-600">
                Select a stage
              </p>
            ) : null}
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] text-muted-foreground">
                Reason <span className="text-red-600">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {reason.trim().length}/500
              </span>
            </div>
            <Textarea
              value={reason}
              disabled={busy}
              required
              rows={3}
              maxLength={500}
              placeholder="Why is this stage changing?"
              className={cn(fieldError === "reason" && "border-red-500")}
              onChange={(e) => {
                setReason(e.target.value);
                if (fieldError === "reason" && e.target.value.trim()) {
                  setFieldError(null);
                }
              }}
            />
            {fieldError === "reason" ? (
              <p className="text-[11px] font-medium text-red-600">
                Fill the reason
              </p>
            ) : null}
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
              disabled={busy}
              onClick={() => {
                if (!stage) {
                  setFieldError("stage");
                  return;
                }
                if (!reason.trim()) {
                  setFieldError("reason");
                  return;
                }
                setConfirmSubmit(true);
              }}
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

      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit this stage change?"
        description={
          chosen
            ? `${refLabel} will move from ${FROM_LABEL[from]} to ${chosen.label}. ${chosen.detail}`
            : "The case will move to the selected stage after you confirm."
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={() => {
          setConfirmSubmit(false);
          void submit();
        }}
      />
    </>
  );
}
