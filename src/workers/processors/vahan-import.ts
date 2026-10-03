import type { Job } from "bullmq";

import { importVahanHistoryData } from "@/lib/services/vahan-history-import";

/** BullMQ — Laravel `cron:ImportVahanHistoryData` (PI RC history). */
export async function processVahanImport(job: Job): Promise<unknown> {
  const dryRun = Boolean(job.data?.dryRun);
  console.log(
    `[vahan-import] start job id=${job.id} name=${job.name} dryRun=${dryRun}`,
  );
  const result = await importVahanHistoryData({ dryRun });
  console.log(`[vahan-import] done job id=${job.id}`, result.counts);
  return result;
}
