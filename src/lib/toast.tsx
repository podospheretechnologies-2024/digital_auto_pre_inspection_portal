import type { ReactNode } from "react";
import { CircleCheck, Info, OctagonX, TriangleAlert } from "lucide-react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastKind = "success" | "error" | "info" | "warning" | "message";
type ToastOptions = ExternalToast | undefined;

const TOAST_MS = 1600;

const toastStyles: Record<
  ToastKind,
  {
    icon: typeof CircleCheck;
    kicker: string;
    iconClass: string;
    washClass: string;
    barClass: string;
    kickerClass: string;
  }
> = {
  success: {
    icon: CircleCheck,
    kicker: "Confirmed",
    iconClass: "bg-emerald-600 text-white shadow-[0_8px_16px_-8px_rgba(5,150,105,0.9)]",
    washClass: "from-emerald-50 via-white to-white",
    barClass: "bg-emerald-500",
    kickerClass: "text-emerald-700",
  },
  error: {
    icon: OctagonX,
    kicker: "Could not complete",
    iconClass: "bg-red-600 text-white shadow-[0_8px_16px_-8px_rgba(220,38,38,0.85)]",
    washClass: "from-red-50 via-white to-white",
    barClass: "bg-red-500",
    kickerClass: "text-red-700",
  },
  info: {
    icon: Info,
    kicker: "Notice",
    iconClass: "bg-sky-600 text-white shadow-[0_8px_16px_-8px_rgba(2,132,199,0.85)]",
    washClass: "from-sky-50 via-white to-white",
    barClass: "bg-sky-500",
    kickerClass: "text-sky-700",
  },
  warning: {
    icon: TriangleAlert,
    kicker: "Please check",
    iconClass: "bg-amber-500 text-white shadow-[0_8px_16px_-8px_rgba(245,158,11,0.9)]",
    washClass: "from-amber-50 via-white to-white",
    barClass: "bg-amber-500",
    kickerClass: "text-amber-700",
  },
  message: {
    icon: Info,
    kicker: "Notice",
    iconClass: "bg-slate-700 text-white shadow-[0_8px_16px_-8px_rgba(15,23,42,0.7)]",
    washClass: "from-slate-50 via-white to-white",
    barClass: "bg-slate-500",
    kickerClass: "text-slate-600",
  },
};

function showWithOk(
  kind: ToastKind,
  message: ReactNode,
  options?: ToastOptions,
) {
  const { icon: Icon, kicker, iconClass, washClass, barClass, kickerClass } =
    toastStyles[kind];
  const duration = options?.duration ?? TOAST_MS;
  sonnerToast.dismiss();

  return sonnerToast.custom(
    () => (
      <div
        role={kind === "error" || kind === "warning" ? "alert" : "status"}
        className={`relative box-border h-[5.5rem] w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br ${washClass} text-slate-900 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100`}
      >
        <div className="flex h-full items-center gap-3.5 px-4 pb-1">
          <span
            aria-hidden="true"
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
          >
            <Icon className="size-5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1 pt-0.5">
            <span className={`block text-[11px] font-semibold tracking-[0.14em] uppercase ${kickerClass}`}>
              {kicker}
            </span>
            <span className="mt-1 block text-sm leading-snug font-semibold text-slate-900 dark:text-slate-50">
              {message}
            </span>
          </span>
        </div>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 block h-1 bg-black/5 dark:bg-white/10">
          <span
            className={`block h-full origin-left ${barClass}`}
            style={{ animation: `da-toast-life ${duration}ms linear forwards` }}
          />
        </span>
        <style>{`@keyframes da-toast-life{from{transform:scaleX(1)}to{transform:scaleX(0)}}`}</style>
      </div>
    ),
    {
      ...options,
      closeButton: false,
      duration,
      unstyled: true,
      className: "!h-[5.5rem] !w-[min(28rem,calc(100vw-2rem))]",
    },
  );
}

export const toast = {
  success: (message: ReactNode, options?: ToastOptions) =>
    showWithOk("success", message, options),
  error: (message: ReactNode, options?: ToastOptions) =>
    showWithOk("error", message, options),
  info: (message: ReactNode, options?: ToastOptions) =>
    showWithOk("info", message, options),
  warning: (message: ReactNode, options?: ToastOptions) =>
    showWithOk("warning", message, options),
  message: (message: ReactNode, options?: ToastOptions) =>
    showWithOk("message", message, options),
};
