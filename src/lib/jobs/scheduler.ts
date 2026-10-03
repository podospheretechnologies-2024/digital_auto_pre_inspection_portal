/**
 * Cron / job catalog for UI / docs (no BullMQ imports — safe for Next.js).
 * Registration lives in `src/workers/register-schedules.ts`.
 * On-demand SMS is enqueued from the assign API, not on a schedule.
 */

import { QUEUE_NAMES } from "@/lib/jobs/queue-names";

export type PlannedCronJob = {
  id: string;
  /** Human label shown in the UI. */
  title: string;
  laravelCommand: string;
  queue: string;
  interval: string;
  status: "scheduled" | "optional" | "on_demand" | "out_of_scope";
  notes?: string;
};

export const PLANNED_CRON_JOBS: PlannedCronJob[] = [
  {
    id: "import-vahan-history",
    title: "Import Vahan history",
    laravelCommand: "cron:ImportVahanHistoryData",
    queue: QUEUE_NAMES.VAHAN_IMPORT,
    interval: "every 5 minutes",
    status: "scheduled",
    notes: "RC history for vehicle lookups",
  },
  {
    id: "rc-batch-states",
    title: "State RC batch",
    laravelCommand: "cron:ARC … cron:WRC / cron:RC2",
    queue: QUEUE_NAMES.RC_BATCH,
    interval: "every 5 minutes",
    status: "optional",
    notes: "Off by default; enable with WORKER_ENABLE_RC_BATCH=true",
  },
  {
    id: "sms-pi-assign",
    title: "SMS on assign",
    laravelCommand: "JobsController::assignupdate_agent (yourbulksms)",
    queue: QUEUE_NAMES.SMS_NOTIFY,
    interval: "on assign",
    status: "on_demand",
    notes:
      "Enqueued from POST /api/v2/jobs/[id]/assign; stub unless SMS_ENABLED=true + SMS_AUTH_KEY",
  },
  {
    id: "import-history-pieces",
    title: "Import blacklist / challan history",
    laravelCommand: "cron:ImportHistoryOf* (blacklist, challan, …)",
    queue: "—",
    interval: "—",
    status: "out_of_scope",
    notes:
      "Superseded by the Vahan history import",
  },
  {
    id: "vrn-to-mobile",
    title: "VRN to mobile lookup",
    laravelCommand: "cron:SearchVRNToMobileNumbers(+DescByID)",
    queue: "—",
    interval: "—",
    status: "out_of_scope",
    notes: "Not part of Pre-Inspection",
  },
];
