import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";

export type JobHistoryEvent = {
  id: number;
  job_id: number | null;
  user_id: number | null;
  event: string;
  remark: string | null;
  created_at: Date | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
};

function formatUserRole(
  type: string | null | undefined,
  isAdmin: number | null | undefined,
): string | null {
  const t = (type ?? "").trim();
  if (t === "HO" || t === "RO" || t === "Surveyor" || t === "Bank") return t;
  if (Number(isAdmin ?? 0) === 1 || !t) return "Admin";
  return t;
}

/** Best-effort write to Laravel `history_pre_inspection_modules`. Never throws. */
export async function logJobHistory(input: {
  jobId: number;
  userId: number | null | undefined;
  event: string;
  remark?: string | null;
}): Promise<void> {
  try {
    const now = new Date();
    const maxRows = await db.$queryRaw<Array<{ max_id: number | null }>>(
      Prisma.sql`SELECT MAX(id) AS max_id FROM history_pre_inspection_modules`,
    );
    const nextId = Number(maxRows[0]?.max_id ?? 0) + 1;
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO history_pre_inspection_modules
          (id, user_id, job_id, event, remark, created_at)
        VALUES
          (
            ${nextId},
            ${input.userId != null ? Number(input.userId) : null},
            ${input.jobId},
            ${input.event.slice(0, 191)},
            ${input.remark ?? null},
            ${now}
          )
      `,
    );
  } catch (error) {
    console.warn("[job-history] log skipped:", error);
  }
}

export async function latestChangeStageReasons(
  jobIds: number[],
): Promise<Map<number, string>> {
  const ids = [...new Set(jobIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return new Map();
  try {
    const rows = await db.$queryRaw<
      Array<{ job_id: number; remark: string | null }>
    >(Prisma.sql`
      SELECT h.job_id, h.remark
      FROM history_pre_inspection_modules h
      INNER JOIN (
        SELECT job_id, MAX(id) AS max_id
        FROM history_pre_inspection_modules
        WHERE event = 'Change Stage'
          AND job_id IN (${Prisma.join(ids)})
        GROUP BY job_id
      ) latest ON latest.max_id = h.id
    `);
    const map = new Map<number, string>();
    for (const row of rows) {
      const text = row.remark?.trim();
      if (row.job_id != null && text) map.set(Number(row.job_id), text);
    }
    return map;
  } catch (error) {
    console.warn("[job-history] stage reasons skipped:", error);
    return new Map();
  }
}

export async function listJobHistory(
  jobId: number,
): Promise<JobHistoryEvent[]> {
  try {
    const rows = await db.$queryRaw<
      Array<{
        id: number;
        job_id: number | null;
        user_id: number | null;
        event: string | null;
        remark: string | null;
        created_at: Date | null;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        type: string | null;
        is_admin: number | null;
      }>
    >(Prisma.sql`
      SELECT
        h.id,
        h.job_id,
        h.user_id,
        h.event,
        h.remark,
        h.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.type,
        u.is_admin
      FROM history_pre_inspection_modules h
      LEFT JOIN users u ON u.id = h.user_id
      WHERE h.job_id = ${jobId}
      ORDER BY h.created_at DESC, h.id DESC
    `);

    return rows.map((r) => ({
      id: Number(r.id),
      job_id: r.job_id,
      user_id: r.user_id,
      event: r.event?.trim() || "Event",
      remark: r.remark,
      created_at: r.created_at,
      user_name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || null,
      user_email: r.email,
      user_role: formatUserRole(r.type, r.is_admin),
    }));
  } catch (error) {
    console.error("[job-history] list failed:", error);
    return [];
  }
}
