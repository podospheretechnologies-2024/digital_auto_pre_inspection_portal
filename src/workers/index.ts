/**
 * Pre-Inspection background worker (Phase 7).
 *
 * Prerequisites:
 *   docker compose up -d redis
 *   .env: REDIS_URL, DATABASE_URL, DIGITAL_DEKHO_API_KEY
 *   Optional SMS: SMS_ENABLED=true + SMS_AUTH_KEY
 *   Optional RC batch: WORKER_ENABLE_RC_BATCH=true
 *
 * Run (separate from Next.js):
 *   npm run worker
 *
 * Keep `npm run dev` / `npm start` running for the web app + assign enqueue.
 */

import { config } from "dotenv";
import { Worker, type Job } from "bullmq";

import { describeSmsLiveReadiness } from "@/lib/integrations/sms";
import { registerScheduledJobs } from "./register-schedules";
import { processRcBatchJob } from "./processors/rc-batch";
import { processSmsNotifyJob } from "./processors/sms-notify";
import { processVahanImport } from "./processors/vahan-import";
import {
  QUEUE_NAMES,
  getConnectionOptions,
  getRedisConnection,
} from "./queues";

config({ path: ".env" });

function summarizeJobData(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  const parts: string[] = [];
  if (d.kind != null) parts.push(`kind=${String(d.kind)}`);
  if (d.jobId != null) parts.push(`piJob=${String(d.jobId)}`);
  if (d.prefix != null) parts.push(`prefix=${String(d.prefix)}`);
  if (d.dryRun != null) parts.push(`dryRun=${String(d.dryRun)}`);
  return parts.length ? ` ${parts.join(" ")}` : "";
}

function attachWorkerLogging(worker: Worker): void {
  worker.on("ready", () => {
    console.log(`[worker] listening on queue "${worker.name}"`);
  });

  worker.on("active", (job: Job) => {
    console.log(
      `[worker] ${worker.name} job ${job.id} active${summarizeJobData(job.data)} attempt=${job.attemptsMade + 1}/${job.opts.attempts ?? 1}`,
    );
  });

  worker.on("completed", (job: Job) => {
    console.log(
      `[worker] ${worker.name} job ${job.id} completed${summarizeJobData(job.data)}`,
    );
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(
      `[worker] ${worker.name} job ${job?.id ?? "?"} FAILED${job ? summarizeJobData(job.data) : ""}:`,
      err.message,
    );
    if (err.stack) {
      console.error(err.stack);
    }
    if (job) {
      console.error(
        `[worker] attemptsMade=${job.attemptsMade} failedReason=${job.failedReason ?? err.message}`,
      );
    }
  });

  worker.on("error", (err: Error) => {
    console.error(`[worker] ${worker.name} error:`, err.message);
    if (err.stack) console.error(err.stack);
  });

  worker.on("stalled", (jobId: string) => {
    console.warn(`[worker] ${worker.name} job ${jobId} stalled`);
  });
}

async function main() {
  const connection = getConnectionOptions();
  const redis = getRedisConnection();
  await redis.ping();
  console.log("[worker] Redis connected (Pre-Inspection scope)");

  const smsReady = describeSmsLiveReadiness();
  console.log(`[worker] SMS: ${smsReady.detail}`);
  if (!smsReady.live && process.env.SMS_ENABLED && /true|1|yes|on/i.test(process.env.SMS_ENABLED)) {
    console.warn("[worker] Live SMS misconfigured — assign jobs will fail until SMS_AUTH_KEY is set");
  }
  console.log(
    `[worker] WORKER_ENABLE_RC_BATCH=${process.env.WORKER_ENABLE_RC_BATCH ?? "false"}`,
  );

  await registerScheduledJobs();

  const workers: Worker[] = [
    new Worker(QUEUE_NAMES.VAHAN_IMPORT, processVahanImport, {
      connection,
      concurrency: 1,
      lockDuration: 10 * 60 * 1000,
    }),
    new Worker(QUEUE_NAMES.RC_BATCH, processRcBatchJob, {
      connection,
      concurrency: 2,
      lockDuration: 10 * 60 * 1000,
    }),
    new Worker(QUEUE_NAMES.SMS_NOTIFY, processSmsNotifyJob, {
      connection,
      concurrency: 5,
      lockDuration: 60 * 1000,
    }),
  ];

  for (const worker of workers) {
    attachWorkerLogging(worker);
  }

  console.log(
    `[worker] queues: ${Object.values(QUEUE_NAMES).join(", ")}`,
  );
  console.log(
    "[worker] Schedules: vahan-import every 5m; RC batch if WORKER_ENABLE_RC_BATCH; sms-notify is on-demand from assign API",
  );

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} — closing…`);
    await Promise.all(workers.map((w) => w.close()));
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("uncaughtException", (err) => {
    console.error("[worker] uncaughtException:", err);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[worker] unhandledRejection:", reason);
  });
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
