import { db } from "@/lib/db";
import type { WheelKind } from "@/lib/jobs/helpers";
import type { QcSubmitInput } from "@/lib/jobs/schemas";
import { logJobHistory, latestChangeStageReasons } from "@/lib/services/job-history";
import type { SessionUser } from "@/types/next-auth";

export type QcQueueItem = {
  id: number;
  job_id: number | null;
  vehicle_type: WheelKind;
  vehicleno: string | null;
  proposer: string | null;
  inspection_status: string | null;
  remarks: string | null;
  valuation_price: number | null;
  ownership_name: string | null;
  qc: number;
  /** When submitted to QC (inspection created) */
  created_at: Date | null;
  /** When QC approved / completed */
  qc_datetime: Date | null;
  cdate: Date | null;
  /** Job create (intimation) timestamp */
  job_created_at: Date | null;
  assigned_at: Date | null;
  hold_at: Date | null;
  cancelled_at: Date | null;
  cname: string | null;
  mobileno: string | null;
  dti_no: string | null;
  bank_ref_no: string | null;
  bankname: string;
  company: string;
  model: string;
  variant: string;
  agent_name: string;
  stage_reason: string | null;
};

async function enrichQcRows(
  kind: WheelKind,
  rows: Array<{
    id: number;
    job_id: number | null;
    vehicleno: string | null;
    proposer: string | null;
    inspection_status: string | null;
    remarks: string | null;
    valuation_price: number | null;
    ownership_name: string | null;
    qc: number;
    created_at: Date | null;
    qc_datetime?: Date | null;
  }>,
): Promise<QcQueueItem[]> {
  if (rows.length === 0) return [];
  const jobIds = rows
    .map((r) => r.job_id)
    .filter((id): id is number => id != null);

  const jobs = await db.tbl_jobs.findMany({
    where: { id: { in: jobIds } },
  });
  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  const [banks, companies, models, variants, agents, stageReasons] =
    await Promise.all([
    db.m_bank.findMany(),
    db.m_company.findMany(),
    db.m_model.findMany(),
    db.m_variant.findMany(),
    db.users.findMany({
      select: { id: true, first_name: true, last_name: true },
    }),
    latestChangeStageReasons(jobIds),
  ]);

  const bankMap = new Map(banks.map((b) => [b.id, b.name]));
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const modelMap = new Map(models.map((m) => [m.id, m.name]));
  const variantMap = new Map(variants.map((v) => [v.id, v.name]));
  const agentMap = new Map(
    agents.map((a) => [a.id, `${a.first_name} ${a.last_name}`.trim()]),
  );

  return rows
    .filter((row) => {
      if (row.job_id == null || !jobMap.has(row.job_id)) return false;
      const job = jobMap.get(row.job_id)!;
      // Held / cancelled jobs belong on Hold / Cancel desks, not QC
      if (Number(job.on_hold ?? 0) === 1) return false;
      if (Number(job.is_deleted ?? 0) === 1) return false;
      return true;
    })
    .map((row) => {
      const job = jobMap.get(row.job_id!)!;
      return {
        id: row.id,
        job_id: row.job_id,
        vehicle_type: kind,
        vehicleno: row.vehicleno ?? job.vehicleno ?? null,
        proposer: row.proposer,
        inspection_status: row.inspection_status,
        remarks: row.remarks,
        valuation_price: row.valuation_price,
        ownership_name: row.ownership_name,
        qc: row.qc,
        created_at: row.created_at,
        qc_datetime: row.qc_datetime ?? null,
        cdate: job.cdate ?? null,
        job_created_at: job.created_at ?? null,
        assigned_at: job.assigned_at ?? null,
        hold_at: job.hold_at ?? null,
        cancelled_at: job.cancelled_at ?? null,
        cname: job.cname ?? null,
        mobileno: job.mobileno ?? null,
        dti_no: job.dti_no ?? null,
        bank_ref_no: job.bank_ref_no ?? null,
        bankname: job.bank_id ? (bankMap.get(job.bank_id) ?? "—") : "—",
        company: job.company_id ? (companyMap.get(job.company_id) ?? "—") : "—",
        model: job.model_id ? (modelMap.get(job.model_id) ?? "—") : "—",
        variant: job.variant_id ? (variantMap.get(job.variant_id) ?? "—") : "—",
        agent_name: job.agent_id ? (agentMap.get(job.agent_id) ?? "—") : "—",
        stage_reason: row.job_id ? (stageReasons.get(row.job_id) ?? null) : null,
      };
    });
}

/** Delete unlinked inspection copies left behind by stage moves / bad syncs. */
async function purgeOrphanInspections(kind: WheelKind): Promise<void> {
  const where = { job_id: null as null };
  if (kind === "2wheeler") {
    const orphans = await db.tbl_2wheeler.findMany({
      where,
      select: { id: true },
    });
    if (!orphans.length) return;
    const ids = orphans.map((o) => o.id);
    await db.tbl_2wheeler_images.deleteMany({
      where: { parent_id: { in: ids } },
    });
    await db.tbl_2wheeler.deleteMany({ where: { id: { in: ids } } });
    return;
  }
  if (kind === "3wheeler") {
    const orphans = await db.tbl_3wheeler.findMany({
      where,
      select: { id: true },
    });
    if (!orphans.length) return;
    const ids = orphans.map((o) => o.id);
    await db.tbl_3wheeler_images.deleteMany({
      where: { parent_id: { in: ids } },
    });
    await db.tbl_3wheeler.deleteMany({ where: { id: { in: ids } } });
    return;
  }
  const orphans = await db.tbl_4wheeler.findMany({
    where,
    select: { id: true },
  });
  if (!orphans.length) return;
  const ids = orphans.map((o) => o.id);
  await db.tbl_4wheeler_images.deleteMany({
    where: { parent_id: { in: ids } },
  });
  await db.tbl_4wheeler.deleteMany({ where: { id: { in: ids } } });
}

/** List inspections pending QC (qc = 0). Laravel 2wqc / 3wqc / 4wqc. */
export async function listQcQueue(opts?: {
  vehicle_type?: WheelKind | "all";
  agent_id?: number;
  limit?: number;
}): Promise<QcQueueItem[]> {
  const limit = opts?.limit ?? 100;
  const kinds: WheelKind[] =
    !opts?.vehicle_type || opts.vehicle_type === "all"
      ? ["2wheeler", "3wheeler", "4wheeler"]
      : [opts.vehicle_type];

  const results: QcQueueItem[] = [];

  const select = {
    id: true,
    job_id: true,
    vehicleno: true,
    proposer: true,
    inspection_status: true,
    remarks: true,
    valuation_price: true,
    ownership_name: true,
    qc: true,
    created_at: true,
    qc_datetime: true,
  } as const;

  for (const kind of kinds) {
    // Remove already-created orphan copies, then list only linked cases
    await purgeOrphanInspections(kind);
    const where = { qc: 0, job_id: { not: null } } as const;
    const rows =
      kind === "2wheeler"
        ? await db.tbl_2wheeler.findMany({
            where,
            take: limit,
            orderBy: { created_at: "desc" },
            select,
          })
        : kind === "3wheeler"
          ? await db.tbl_3wheeler.findMany({
              where,
              take: limit,
              orderBy: { created_at: "desc" },
              select,
            })
          : await db.tbl_4wheeler.findMany({
              where,
              take: limit,
              orderBy: { created_at: "desc" },
              select,
            });

    let enriched = await enrichQcRows(kind, rows);
    if (opts?.agent_id) {
      // Filter by job agent after enrich
      const jobs = await db.tbl_jobs.findMany({
        where: {
          id: {
            in: enriched
              .map((e) => e.job_id)
              .filter((id): id is number => id != null),
          },
          agent_id: opts.agent_id,
        },
        select: { id: true },
      });
      const allowed = new Set(jobs.map((j) => j.id));
      enriched = enriched.filter(
        (e) => e.job_id != null && allowed.has(e.job_id),
      );
    }
    results.push(...enriched);
  }

  return results.sort((a, b) => {
    const ta = a.created_at?.getTime() ?? 0;
    const tb = b.created_at?.getTime() ?? 0;
    return tb - ta;
  });
}

export async function getQcByJobId(jobId: number, kind: WheelKind) {
  if (kind === "2wheeler") {
    return db.tbl_2wheeler.findFirst({
      where: { job_id: jobId },
      orderBy: { id: "desc" },
    });
  }
  if (kind === "3wheeler") {
    return db.tbl_3wheeler.findFirst({
      where: { job_id: jobId },
      orderBy: { id: "desc" },
    });
  }
  return db.tbl_4wheeler.findFirst({
    where: { job_id: jobId },
    orderBy: { id: "desc" },
  });
}

/** Mark QC done — Laravel updateremark{2,3,4}wqc. */
export async function submitQc(user: SessionUser, input: QcSubmitInput) {
  const current =
    input.vehicle_type === "2wheeler"
      ? await db.tbl_2wheeler.findUnique({ where: { id: input.inspection_id } })
      : input.vehicle_type === "3wheeler"
        ? await db.tbl_3wheeler.findUnique({
            where: { id: input.inspection_id },
          })
        : await db.tbl_4wheeler.findUnique({
            where: { id: input.inspection_id },
          });

  if (!current?.job_id) throw new Error("NOT_FOUND");
  if (Number(current.qc ?? 0) === 1) throw new Error("INVALID_TRANSITION");

  const job = await db.tbl_jobs.findFirst({
    where: { id: current.job_id },
    select: { is_deleted: true, on_hold: true },
  });
  if (!job || job.is_deleted === 1) throw new Error("CANCELLED");
  if (job.on_hold === 1) throw new Error("INVALID_TRANSITION");

  const now = new Date();
  const data = {
    remarks: input.remarks,
    valuation_price: input.valuation_price,
    ownership_name: input.ownership_name,
    qc: 1,
    qc_checked_by: String(user.id),
    qc_datetime: now,
    updated_at: now,
  };

  const where = { id: input.inspection_id, qc: current.qc };
  const result =
    input.vehicle_type === "2wheeler"
      ? await db.tbl_2wheeler.updateMany({ where, data })
      : input.vehicle_type === "3wheeler"
        ? await db.tbl_3wheeler.updateMany({ where, data })
        : await db.tbl_4wheeler.updateMany({ where, data });

  if (result.count !== 1) throw new Error("CONFLICT");

  await logJobHistory({
    jobId: current.job_id,
    userId: Number(user.id),
    event: "Quality Check",
    remark: input.remarks?.trim()
      ? input.remarks.trim()
      : "Quality check completed for this case",
  });

  return { ...current, ...data, job_id: current.job_id };
}

/** Done lists (qc = 1) for reports / admin review. */
export async function listQcDone(opts?: {
  vehicle_type?: WheelKind;
  limit?: number;
}): Promise<QcQueueItem[]> {
  const kind = opts?.vehicle_type ?? "4wheeler";
  const limit = opts?.limit ?? 100;
  const select = {
    id: true,
    job_id: true,
    vehicleno: true,
    proposer: true,
    inspection_status: true,
    remarks: true,
    valuation_price: true,
    ownership_name: true,
    qc: true,
    created_at: true,
    qc_datetime: true,
  } as const;

  const where = { qc: 1, job_id: { not: null } } as const;
  const rows =
    kind === "2wheeler"
      ? await db.tbl_2wheeler.findMany({
          where,
          take: limit,
          orderBy: { created_at: "desc" },
          select,
        })
      : kind === "3wheeler"
        ? await db.tbl_3wheeler.findMany({
            where,
            take: limit,
            orderBy: { created_at: "desc" },
            select,
          })
        : await db.tbl_4wheeler.findMany({
            where,
            take: limit,
            orderBy: { created_at: "desc" },
            select,
          });

  return enrichQcRows(kind, rows);
}

/** Global PI search (Laravel getPreInspectionReport) — QC-complete rows. */
export async function searchPreInspectionReports(opts: {
  customer?: string;
  vehicleno?: string;
  ref_no?: string;
  bank_id?: number | null;
  limit?: number;
}): Promise<QcQueueItem[]> {
  const limit = opts.limit ?? 100;
  const kinds: WheelKind[] = ["2wheeler", "3wheeler", "4wheeler"];
  const results: QcQueueItem[] = [];

  for (const kind of kinds) {
    const rows =
      kind === "2wheeler"
        ? await db.tbl_2wheeler.findMany({
            where: {
              qc: 1,
              ...(opts.vehicleno
                ? { vehicleno: { contains: opts.vehicleno } }
                : {}),
            },
            take: limit,
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              job_id: true,
              vehicleno: true,
              proposer: true,
              inspection_status: true,
              remarks: true,
              valuation_price: true,
              ownership_name: true,
              qc: true,
              created_at: true,
              qc_datetime: true,
            },
          })
        : kind === "3wheeler"
          ? await db.tbl_3wheeler.findMany({
              where: {
                qc: 1,
                ...(opts.vehicleno
                  ? { vehicleno: { contains: opts.vehicleno } }
                  : {}),
              },
              take: limit,
              orderBy: { created_at: "desc" },
              select: {
                id: true,
                job_id: true,
                vehicleno: true,
                proposer: true,
                inspection_status: true,
                remarks: true,
                valuation_price: true,
                ownership_name: true,
                qc: true,
                created_at: true,
                qc_datetime: true,
              },
            })
          : await db.tbl_4wheeler.findMany({
              where: {
                qc: 1,
                ...(opts.vehicleno
                  ? { vehicleno: { contains: opts.vehicleno } }
                  : {}),
              },
              take: limit,
              orderBy: { created_at: "desc" },
              select: {
                id: true,
                job_id: true,
                vehicleno: true,
                proposer: true,
                inspection_status: true,
                remarks: true,
                valuation_price: true,
                ownership_name: true,
                qc: true,
                created_at: true,
                qc_datetime: true,
              },
            });

    let enriched = await enrichQcRows(kind, rows);

    if (opts.customer) {
      const q = opts.customer.toLowerCase();
      enriched = enriched.filter((r) =>
        (r.cname ?? "").toLowerCase().includes(q),
      );
    }
    if (opts.ref_no) {
      const q = opts.ref_no.toLowerCase();
      enriched = enriched.filter(
        (r) =>
          (r.dti_no ?? "").toLowerCase().includes(q) ||
          (r.bank_ref_no ?? "").toLowerCase().includes(q),
      );
    }
    if (opts.bank_id) {
      // bankname already enriched — filter via job bank by re-query is heavy;
      // match bank_id through a second job lookup
      const jobs = await db.tbl_jobs.findMany({
        where: {
          id: {
            in: enriched
              .map((e) => e.job_id)
              .filter((id): id is number => id != null),
          },
          bank_id: opts.bank_id,
        },
        select: { id: true },
      });
      const allowed = new Set(jobs.map((j) => j.id));
      enriched = enriched.filter(
        (e) => e.job_id != null && allowed.has(e.job_id),
      );
    }

    results.push(...enriched);
  }

  return results
    .sort((a, b) => {
      const ta = a.created_at?.getTime() ?? 0;
      const tb = b.created_at?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, limit);
}

