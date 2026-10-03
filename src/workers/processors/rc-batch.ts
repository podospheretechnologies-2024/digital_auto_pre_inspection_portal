import type { Job } from "bullmq";

import {
  processRcBatch,
  type RcBatchJobData,
} from "@/lib/services/rc-batch";

/** BullMQ — Laravel `cron:ARC` … `RC2` (PI vehicle RC pulls). */
export async function processRcBatchJob(job: Job): Promise<unknown> {
  const data = (job.data ?? {}) as RcBatchJobData;
  if (!data.prefix) {
    throw new Error('rc-batch job requires data.prefix (e.g. "A" or "2")');
  }
  console.log(`[rc-batch] start job id=${job.id} prefix=${data.prefix}`);
  const result = await processRcBatch(data);
  console.log(
    `[rc-batch] done prefix=${result.prefix} processed=${result.processed} failures=${result.failures.length}`,
  );
  return result;
}
