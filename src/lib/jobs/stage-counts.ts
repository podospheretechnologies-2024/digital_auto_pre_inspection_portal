import { db } from "@/lib/db";
import type { JobScope } from "@/lib/jobs/access";

export type JobStageCounts = {
  fresh: number;
  schedule: number;
  qc: number;
  complete: number;
};

export async function getJobStageCounts(
  scope?: JobScope,
): Promise<JobStageCounts> {
  if (!scope || scope.unrestricted) {
    return unrestrictedCounts();
  }

  const jobWhere: {
    bank_id?: number;
    agent_id?: { in: number[] };
    is_deleted: number;
  } = { is_deleted: 0 };
  if (scope.bankId != null) jobWhere.bank_id = scope.bankId;
  if (scope.agentIds) {
    jobWhere.agent_id = { in: scope.agentIds.length > 0 ? scope.agentIds : [-1] };
  }

  const jobs = await db.tbl_jobs.findMany({
    where: jobWhere,
    select: { id: true, agent_id: true },
  });
  const ids = jobs.map((row) => row.id);
  const fresh = scope.agentIds
    ? 0
    : jobs.filter((row) => row.agent_id == null).length;
  const schedule = jobs.filter((row) => row.agent_id != null).length;
  if (ids.length === 0) {
    return { fresh, schedule, qc: 0, complete: 0 };
  }

  const [qc2w, qc3w, qc4w, done2w, done3w, done4w] = await Promise.all([
    db.tbl_2wheeler.count({ where: { qc: 0, job_id: { in: ids } } }),
    db.tbl_3wheeler.count({ where: { qc: 0, job_id: { in: ids } } }),
    db.tbl_4wheeler.count({ where: { qc: 0, job_id: { in: ids } } }),
    db.tbl_2wheeler.count({ where: { qc: 1, job_id: { in: ids } } }),
    db.tbl_3wheeler.count({ where: { qc: 1, job_id: { in: ids } } }),
    db.tbl_4wheeler.count({ where: { qc: 1, job_id: { in: ids } } }),
  ]);

  return {
    fresh,
    schedule,
    qc: qc2w + qc3w + qc4w,
    complete: done2w + done3w + done4w,
  };
}

async function unrestrictedCounts(): Promise<JobStageCounts> {
  const [fresh, schedule] = await Promise.all([
    db.tbl_jobs.count({ where: { agent_id: null } }),
    db.tbl_jobs.count({ where: { agent_id: { not: null } } }),
  ]);
  const [qc2w, qc3w, qc4w] = await Promise.all([
    db.tbl_2wheeler.count({ where: { qc: 0 } }),
    db.tbl_3wheeler.count({ where: { qc: 0 } }),
    db.tbl_4wheeler.count({ where: { qc: 0 } }),
  ]);
  const [done2w, done3w, done4w] = await Promise.all([
    db.tbl_2wheeler.count({ where: { qc: 1 } }),
    db.tbl_3wheeler.count({ where: { qc: 1 } }),
    db.tbl_4wheeler.count({ where: { qc: 1 } }),
  ]);

  return {
    fresh,
    schedule,
    qc: qc2w + qc3w + qc4w,
    complete: done2w + done3w + done4w,
  };
}
