import { db } from "@/lib/db";

export type DashboardAnalytics = {
  fresh: string[];
  qc: string[];
  complete: string[];
};

function iso(value: Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Dates used to chart Fresh Case, Quality Check, and Completed volume. */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const [freshJobs, qc2, qc3, qc4, done2, done3, done4] = await Promise.all([
    db.tbl_jobs.findMany({
      where: { is_deleted: 0, on_hold: 0 },
      select: { created_at: true, cdate: true },
    }),
    db.tbl_2wheeler.findMany({
      where: { qc: 0, job_id: { not: null } },
      select: { job_id: true, created_at: true },
    }),
    db.tbl_3wheeler.findMany({
      where: { qc: 0, job_id: { not: null } },
      select: { job_id: true, created_at: true },
    }),
    db.tbl_4wheeler.findMany({
      where: { qc: 0, job_id: { not: null } },
      select: { job_id: true, created_at: true },
    }),
    db.tbl_2wheeler.findMany({
      where: { qc: 1, job_id: { not: null } },
      select: { job_id: true, created_at: true, qc_datetime: true },
    }),
    db.tbl_3wheeler.findMany({
      where: { qc: 1, job_id: { not: null } },
      select: { job_id: true, created_at: true, qc_datetime: true },
    }),
    db.tbl_4wheeler.findMany({
      where: { qc: 1, job_id: { not: null } },
      select: { job_id: true, created_at: true, qc_datetime: true },
    }),
  ]);

  const inspectionJobIds = [
    ...new Set(
      [...qc2, ...qc3, ...qc4, ...done2, ...done3, ...done4]
        .map((row) => row.job_id)
        .filter((id): id is number => id != null),
    ),
  ];
  const linkedJobs = inspectionJobIds.length
    ? await db.tbl_jobs.findMany({
        where: { id: { in: inspectionJobIds } },
        select: { id: true, is_deleted: true, on_hold: true },
      })
    : [];
  const openJobIds = new Set(
    linkedJobs
      .filter((job) => Number(job.is_deleted ?? 0) === 0 && Number(job.on_hold ?? 0) === 0)
      .map((job) => job.id),
  );

  const fresh = freshJobs
    .map((job) => iso(job.created_at ?? job.cdate))
    .filter((value): value is string => value != null);

  const qc = [...qc2, ...qc3, ...qc4]
    .filter((row) => row.job_id != null && openJobIds.has(row.job_id))
    .map((row) => iso(row.created_at))
    .filter((value): value is string => value != null);

  const complete = [...done2, ...done3, ...done4]
    .filter((row) => row.job_id != null && openJobIds.has(row.job_id))
    .map((row) => iso(row.qc_datetime ?? row.created_at))
    .filter((value): value is string => value != null);

  return { fresh, qc, complete };
}
