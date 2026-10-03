import type { Job } from "bullmq";

import {
  processSmsNotify,
  type SmsNotifyJobData,
} from "@/lib/services/sms-notify";

/** BullMQ — Laravel PI SMS on assign (and optional case-submitted). */
export async function processSmsNotifyJob(job: Job): Promise<unknown> {
  const data = (job.data ?? {}) as SmsNotifyJobData;
  if (!data.kind || !data.jobId) {
    throw new Error("sms-notify job requires data.kind and data.jobId");
  }

  console.log(
    `[sms-notify] start job id=${job.id} kind=${data.kind} piJob=${data.jobId} attempt=${job.attemptsMade + 1}`,
  );

  const result = await processSmsNotify(data);

  if (result.skipped) {
    console.warn(
      `[sms-notify] skipped kind=${data.kind} piJob=${data.jobId}: ${result.skipped}`,
    );
  } else if (result.send?.stubbed) {
    console.info(
      `[sms-notify] stubbed kind=${data.kind} piJob=${data.jobId}: ${result.send.reason ?? "stub"}`,
    );
  } else if (result.send && !result.send.ok) {
    const err = new Error(
      `SMS send failed: ${result.send.reason ?? "unknown"} (HTTP ${result.send.status ?? "?"})`,
    );
    console.error(`[sms-notify] fail piJob=${data.jobId}`, err.message);
    throw err;
  } else {
    console.log(
      `[sms-notify] done kind=${data.kind} piJob=${data.jobId} stubbed=${result.send?.stubbed ?? false}`,
    );
  }

  return result;
}
