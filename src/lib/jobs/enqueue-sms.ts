/**
 * Best-effort enqueue for PI SMS (safe to call from Route Handlers).
 * Never throws to the caller — assign/create must succeed even if Redis is down.
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";

import { QUEUE_NAMES } from "@/lib/jobs/queue-names";
import type { SmsNotifyJobData } from "@/lib/services/sms-notify";

let enqueueConnection: IORedis | null = null;
let smsQueue: Queue | null = null;

function isSmsEnabled(): boolean {
  return (process.env.SMS_ENABLED ?? "false").toLowerCase() === "true";
}

function getEnqueueConnection(): IORedis {
  if (!enqueueConnection) {
    const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    enqueueConnection = new IORedis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 1500,
      retryStrategy: () => null,
    });
  }
  return enqueueConnection;
}

function getSmsQueue(): Queue {
  if (!smsQueue) {
    smsQueue = new Queue(QUEUE_NAMES.SMS_NOTIFY, {
      connection: getEnqueueConnection(),
    });
  }
  return smsQueue;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function enqueuePiSms(
  data: SmsNotifyJobData,
): Promise<{ enqueued: boolean; reason?: string }> {
  if (!isSmsEnabled()) {
    return { enqueued: false, reason: "SMS disabled" };
  }

  try {
    const redis = getEnqueueConnection();
    if (redis.status === "wait") {
      await withTimeout(redis.connect(), 1500, "Redis connect");
    }
    await withTimeout(
      getSmsQueue().add(data.kind, data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      }),
      2000,
      "SMS enqueue",
    );
    return { enqueued: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[enqueue-sms] skipped kind=${data.kind} jobId=${data.jobId}:`,
      message,
    );
    return { enqueued: false, reason: message };
  }
}

/** Convenience: SMS when a surveyor is assigned to a PI job. */
export async function enqueueAssignSms(params: {
  jobId: number;
  agentId: number;
  customerName?: string | null;
  customerMobile?: string | null;
}) {
  return enqueuePiSms({
    kind: "pi-assign",
    jobId: params.jobId,
    agentId: params.agentId,
    customerName: params.customerName,
    customerMobile: params.customerMobile,
  });
}

/** Convenience: SMS when inspection is first submitted (Laravel post*Wheeler). */
export async function enqueueCaseSubmittedSms(params: {
  jobId: number;
  agentName?: string | null;
}) {
  return enqueuePiSms({
    kind: "pi-case-submitted",
    jobId: params.jobId,
    agentName: params.agentName,
  });
}
