import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

import { QUEUE_NAMES, type QueueName } from "@/lib/jobs/queue-names";

export { QUEUE_NAMES, type QueueName };

let sharedConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!sharedConnection) {
    const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    sharedConnection = new IORedis(url, {
      maxRetriesPerRequest: null,
    });
  }
  return sharedConnection;
}

export function getConnectionOptions(): ConnectionOptions {
  return getRedisConnection();
}

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: getConnectionOptions() });
    queues.set(name, queue);
  }
  return queue;
}

export function getVahanImportQueue() {
  return getQueue(QUEUE_NAMES.VAHAN_IMPORT);
}

export function getRcBatchQueue() {
  return getQueue(QUEUE_NAMES.RC_BATCH);
}

export function getSmsNotifyQueue() {
  return getQueue(QUEUE_NAMES.SMS_NOTIFY);
}
