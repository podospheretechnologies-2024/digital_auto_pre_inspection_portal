/** Queue names for Pre-Inspection background work (Phase 7). */
export const QUEUE_NAMES = {
  /** Laravel cron:ImportVahanHistoryData — RC history used by PI lookups */
  VAHAN_IMPORT: "vahan-import",
  /** Laravel cron:ARC…WRC / RC2 — pending RC pulls for PI vehicle detail */
  RC_BATCH: "rc-batch",
  /** On-demand: Laravel yourbulksms on PI assign (and optional case-submitted) */
  SMS_NOTIFY: "sms-notify",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
