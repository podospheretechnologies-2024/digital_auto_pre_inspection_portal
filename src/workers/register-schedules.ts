/**
 * Register BullMQ repeatable jobs (worker process only).
 * BullMQ v6+: use upsertJobScheduler (not queue.add with repeat).
 */

import { QUEUE_NAMES } from "@/lib/jobs/queue-names";
import { getRcBatchQueue, getVahanImportQueue } from "./queues";

const FIVE_MIN_MS = 5 * 60 * 1000;

const RC_PREFIXES = [
  "A",
  "B",
  "C",
  "D",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "W",
  "2",
] as const;

function flagEnabled(name: string): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return false;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export async function registerScheduledJobs(): Promise<void> {
  const vahan = getVahanImportQueue();
  await vahan.upsertJobScheduler(
    "import-vahan-history",
    { every: FIVE_MIN_MS },
    {
      name: "import-vahan-history",
      data: {},
      opts: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    },
  );
  console.log(
    "[scheduler] registered import-vahan-history every 5m on",
    QUEUE_NAMES.VAHAN_IMPORT,
  );

  if (flagEnabled("WORKER_ENABLE_RC_BATCH")) {
    const rc = getRcBatchQueue();
    for (const prefix of RC_PREFIXES) {
      await rc.upsertJobScheduler(
        `rc-batch-${prefix}`,
        { every: FIVE_MIN_MS },
        {
          name: `rc-batch-${prefix}`,
          data: { prefix },
          opts: {
            removeOnComplete: 20,
            removeOnFail: 50,
          },
        },
      );
    }
    console.log(
      `[scheduler] registered RC batch (${RC_PREFIXES.length} prefixes) every 5m`,
    );
  } else {
    console.log(
      "[scheduler] RC batch schedulers off (set WORKER_ENABLE_RC_BATCH=true to enable)",
    );
  }

  console.log(
    "[scheduler] sms-notify is on-demand (assign / inspection save) — no cron",
  );
}
