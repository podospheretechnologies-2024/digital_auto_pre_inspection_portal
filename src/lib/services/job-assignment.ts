import { db } from "@/lib/db";
import { enqueueAssignSms } from "@/lib/jobs/enqueue-sms";
import {
  deriveWorkflowStatus,
  parseJobDate,
  resolveFinYear,
  resolveWheelKind,
  type WorkflowStatus,
} from "@/lib/jobs/helpers";
import type {
  CreateJobInput,
  JobListFilter,
  UpdateJobInput,
  WorkflowAction,
} from "@/lib/jobs/schemas";
import type { SessionUser } from "@/types/next-auth";

export type JobListItem = {
  id: number;
  status: WorkflowStatus;
  vehicle_type: string | null;
  bank_id: number | null;
  agent_id: number | null;
  company_id: number | null;
  model_id: number | null;
  variant_id: number | null;
  vehicleno: string | null;
  dti_no: string | null;
  bank_ref_no: string | null;
  cname: string | null;
  mobileno: string | null;
  address: string | null;
  mode: string | null;
  remark: string | null;
  cdate: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  assigned_at: Date | null;
  hold_at: Date | null;
  cancelled_at: Date | null;
  /** When inspection was submitted to QC */
  inspection_at: Date | null;
  /** When QC approved / completed */
  qc_datetime: Date | null;
  on_hold?: number;
  is_deleted?: number;
  bankname?: string;
  company?: string;
  model?: string;
  variant?: string;
  agent_name?: string;
  wheel_kind?: string;
  inspection_id?: number | null;
  qc?: number | null;
};

async function enrichJobs(
  rows: Array<{
    id: number;
    vehicle_type: string | null;
    bank_id: number | null;
    agent_id: number | null;
    company_id: number | null;
    model_id: number | null;
    variant_id: number | null;
    vehicleno: string;
    dti_no: string;
    bank_ref_no: string | null;
    cname: string | null;
    mobileno: string | null;
    address: string | null;
    mode: string | null;
    remark: string | null;
    cdate: Date;
    created_at: Date | null;
    updated_at: Date | null;
    assigned_at?: Date | null;
    hold_at?: Date | null;
    cancelled_at?: Date | null;
    on_hold?: number | null;
    is_deleted?: number | null;
  }>,
): Promise<JobListItem[]> {
  if (rows.length === 0) return [];

  const [banks, companies, models, variants, agents, tw, th, fw] =
    await Promise.all([
      db.m_bank.findMany(),
      db.m_company.findMany(),
      db.m_model.findMany(),
      db.m_variant.findMany(),
      db.users.findMany({
        where: {
          is_admin: 0,
          is_deleted: 0,
          type: { in: ["RO", "Surveyor"] },
        },
        select: { id: true, first_name: true, last_name: true },
      }),
      db.tbl_2wheeler.findMany({
        where: { job_id: { in: rows.map((r) => r.id) } },
        select: {
          id: true,
          job_id: true,
          qc: true,
          created_at: true,
          qc_datetime: true,
        },
      }),
      db.tbl_3wheeler.findMany({
        where: { job_id: { in: rows.map((r) => r.id) } },
        select: {
          id: true,
          job_id: true,
          qc: true,
          created_at: true,
          qc_datetime: true,
        },
      }),
      db.tbl_4wheeler.findMany({
        where: { job_id: { in: rows.map((r) => r.id) } },
        select: {
          id: true,
          job_id: true,
          qc: true,
          created_at: true,
          qc_datetime: true,
        },
      }),
    ]);

  const bankMap = new Map(banks.map((b) => [b.id, b.name]));
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const modelMap = new Map(models.map((m) => [m.id, m.name]));
  const variantMap = new Map(variants.map((v) => [v.id, v.name]));
  const agentMap = new Map(
    agents.map((a) => [a.id, `${a.first_name} ${a.last_name}`.trim()]),
  );

  const inspByJob = new Map<
    number,
    {
      id: number;
      qc: number;
      kind: string;
      created_at: Date | null;
      qc_datetime: Date | null;
    }
  >();
  for (const row of tw) {
    if (row.job_id != null)
      inspByJob.set(row.job_id, {
        id: row.id,
        qc: row.qc,
        kind: "2wheeler",
        created_at: row.created_at,
        qc_datetime: row.qc_datetime,
      });
  }
  for (const row of th) {
    if (row.job_id != null)
      inspByJob.set(row.job_id, {
        id: row.id,
        qc: row.qc,
        kind: "3wheeler",
        created_at: row.created_at,
        qc_datetime: row.qc_datetime,
      });
  }
  for (const row of fw) {
    if (row.job_id != null)
      inspByJob.set(row.job_id, {
        id: row.id,
        qc: row.qc,
        kind: "4wheeler",
        created_at: row.created_at,
        qc_datetime: row.qc_datetime,
      });
  }

  return rows.map((row) => {
    const insp = inspByJob.get(row.id);
    const status = deriveWorkflowStatus({
      agent_id: row.agent_id,
      hasInspection: !!insp,
      qc: insp?.qc,
      on_hold: row.on_hold,
      is_deleted: row.is_deleted,
    });
    return {
      id: row.id,
      status,
      vehicle_type: row.vehicle_type,
      bank_id: row.bank_id,
      agent_id: row.agent_id,
      company_id: row.company_id,
      model_id: row.model_id,
      variant_id: row.variant_id,
      vehicleno: row.vehicleno,
      dti_no: row.dti_no,
      bank_ref_no: row.bank_ref_no,
      cname: row.cname,
      mobileno: row.mobileno,
      address: row.address,
      mode: row.mode,
      remark: row.remark,
      cdate: row.cdate,
      created_at: row.created_at,
      updated_at: row.updated_at,
      assigned_at: row.assigned_at ?? null,
      hold_at: row.hold_at ?? null,
      cancelled_at: row.cancelled_at ?? null,
      inspection_at: insp?.created_at ?? null,
      qc_datetime: insp?.qc_datetime ?? null,
      on_hold: Number(row.on_hold ?? 0),
      is_deleted: Number(row.is_deleted ?? 0),
      bankname: row.bank_id ? (bankMap.get(row.bank_id) ?? "—") : "—",
      company: row.company_id ? (companyMap.get(row.company_id) ?? "—") : "—",
      model: row.model_id ? (modelMap.get(row.model_id) ?? "—") : "—",
      variant: row.variant_id ? (variantMap.get(row.variant_id) ?? "—") : "—",
      agent_name: row.agent_id ? (agentMap.get(row.agent_id) ?? "—") : "—",
      wheel_kind: resolveWheelKind(row.vehicle_type),
      inspection_id: insp?.id ?? null,
      qc: insp?.qc ?? null,
    };
  });
}

/**
 * List jobs with flowchart queues:
 * fresh → assigned → qc_pending → completed | hold | cancelled
 */
export async function listJobs(
  filter: JobListFilter = { list: "all" },
): Promise<JobListItem[]> {
  try {
    const limit = filter.limit ?? 100;
    const list = filter.list;
    const where: Record<string, unknown> = {};

    if (list === "cancel" || list === "cancelled") {
      where.is_deleted = 1;
    } else {
      where.is_deleted = 0;
      if (list === "hold") {
        where.on_hold = 1;
      } else if (list !== "all") {
        where.on_hold = 0;
      }
    }

    if (list === "unassigned" || list === "fresh") {
      where.agent_id = null;
    } else if (
      list === "assigned" ||
      list === "old" ||
      list === "schedule" ||
      list === "qc_pending" ||
      list === "completed"
    ) {
      where.agent_id = { not: null };
    } else if (list === "pending" && filter.agent_id) {
      where.agent_id = filter.agent_id;
    }

    if (filter.agent_id && list !== "pending") {
      where.agent_id = filter.agent_id;
    }
    if (filter.bank_id) where.bank_id = filter.bank_id;

    if (filter.q) {
      where.OR = [
        { dti_no: { contains: filter.q } },
        { vehicleno: { contains: filter.q } },
        { cname: { contains: filter.q } },
        { bank_ref_no: { contains: filter.q } },
        { mobileno: { contains: filter.q } },
      ];
    }

    const rows = await db.tbl_jobs.findMany({
      where,
      take: Math.min(limit * 3, 500),
      orderBy: list === "pending" ? { cdate: "asc" } : { id: "desc" },
    });

    let enriched = await enrichJobs(rows);

    if (list === "pending" || list === "old" || list === "schedule") {
      enriched = enriched.filter((j) => j.inspection_id == null);
    } else if (list === "qc_pending") {
      enriched = enriched.filter(
        (j) => j.inspection_id != null && Number(j.qc ?? 0) === 0,
      );
    } else if (list === "completed") {
      enriched = enriched.filter((j) => Number(j.qc ?? 0) === 1);
    } else if (list === "assigned") {
      enriched = enriched.filter((j) => j.inspection_id == null);
    }

    return enriched.slice(0, limit);
  } catch (error) {
    console.error("[job-assignment] listJobs failed:", error);
    return [];
  }
}

export async function getJobById(id: number): Promise<JobListItem | null> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("getJobById: invalid id");
  }

  try {
    const row = await db.tbl_jobs.findFirst({ where: { id } });
    if (!row) return null;
    const [enriched] = await enrichJobs([row]);
    return enriched ?? null;
  } catch (error) {
    console.error("[job-assignment] getJobById failed:", error);
    throw new Error(
      "getJobById: Prisma query failed. Check DATABASE_URL / schema.",
    );
  }
}

export async function listAgents() {
  return db.users.findMany({
    where: {
      is_admin: 0,
      is_deleted: 0,
      type: { in: ["RO", "Surveyor"] },
      verified_at: { not: null },
    },
    orderBy: { first_name: "asc" },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      city_id: true,
      parent_id: true,
      type: true,
    },
  });
}

export async function createJob(user: SessionUser, input: CreateJobInput) {
  const finYear = await resolveFinYear(db);
  const syear = finYear.slice(0, 2);

  const agg = await db.tbl_jobs.aggregate({ _max: { serial_no: true } });
  let maxsno = agg._max.serial_no ?? 0;
  if (!maxsno) maxsno = 78601;
  else maxsno = maxsno + 1;

  const dti_no = `DTI${syear}${maxsno}`;
  const now = new Date();

  const created = await db.tbl_jobs.create({
    data: {
      serial_no: maxsno,
      dti_no,
      fin_year: finYear,
      bank_id: input.bank_id,
      bank_ref_no: input.bank_ref_no,
      agent_id: input.agent_id ?? null,
      company_id: input.company_id,
      model_id: input.model_id,
      variant_id: input.variant_id,
      cdate: parseJobDate(input.cdate),
      remark: input.remark ?? null,
      cname: input.cname,
      mobileno: input.mobileno,
      address: input.address,
      mode: input.mode,
      vehicleno: input.vehicleno,
      vehicle_type: input.vehicle_type,
      source: "WEB",
      created_user_id: Number(user.id),
      created_at: now,
      updated_at: now,
      is_deleted: 0,
      on_hold: 0,
    },
  });

  if (created.agent_id) {
    await enqueueAssignSms({
      jobId: created.id,
      agentId: created.agent_id,
      customerName: created.cname,
      customerMobile: created.mobileno,
    });
  }

  return created;
}

export async function updateJob(input: UpdateJobInput) {
  const now = new Date();
  return db.tbl_jobs.update({
    where: { id: input.id },
    data: {
      bank_id: input.bank_id,
      bank_ref_no: input.bank_ref_no,
      agent_id: input.agent_id ?? null,
      company_id: input.company_id,
      model_id: input.model_id,
      variant_id: input.variant_id,
      cdate: parseJobDate(input.cdate),
      remark: input.remark ?? null,
      cname: input.cname,
      mobileno: input.mobileno,
      address: input.address,
      mode: input.mode,
      vehicleno: input.vehicleno,
      vehicle_type: input.vehicle_type,
      updated_at: now,
    },
  });
}

/** Assign (or reassign) surveyor/agent — Laravel assignupdate_agent (+ SMS). */
export async function assignJob(jobId: number, agentId: number) {
  const agent = await db.users.findFirst({
    where: {
      id: agentId,
      type: "Surveyor",
      is_deleted: 0,
      verified_at: { not: null },
      parent_id: { not: null },
    },
    select: { id: true, parent_id: true },
  });
  if (!agent?.parent_id) {
    throw new Error("INVALID_SURVEYOR");
  }

  const parentRo = await db.users.findFirst({
    where: {
      id: agent.parent_id,
      type: "RO",
      is_deleted: 0,
      verified_at: { not: null },
    },
    select: { id: true },
  });
  if (!parentRo) throw new Error("INVALID_PARENT_RO");

  const now = new Date();
  const updated = await db.tbl_jobs.update({
    where: { id: jobId },
    data: {
      agent_id: agentId,
      on_hold: 0,
      hold_at: null,
      assigned_at: now,
      updated_at: now,
    },
  });

  await enqueueAssignSms({
    jobId: updated.id,
    agentId,
    customerName: updated.cname,
    customerMobile: updated.mobileno,
  });

  return updated;
}

export async function deleteJob(jobId: number) {
  return applyWorkflowAction(jobId, "cancel");
}

export async function applyWorkflowAction(
  jobId: number,
  action: WorkflowAction,
) {
  const job = await db.tbl_jobs.findFirst({ where: { id: jobId } });
  if (!job) throw new Error("NOT_FOUND");

  const now = new Date();

  switch (action) {
    case "hold":
      if (job.is_deleted === 1) throw new Error("CANCELLED");
      return db.tbl_jobs.update({
        where: { id: jobId },
        data: { on_hold: 1, hold_at: now, updated_at: now },
      });
    case "resume":
      if (job.is_deleted === 1) throw new Error("CANCELLED");
      return db.tbl_jobs.update({
        where: { id: jobId },
        data: { on_hold: 0, hold_at: null, updated_at: now },
      });
    case "cancel":
      return db.tbl_jobs.update({
        where: { id: jobId },
        data: {
          is_deleted: 1,
          on_hold: 0,
          hold_at: null,
          cancelled_at: now,
          updated_at: now,
        },
      });
    case "restore":
      return db.tbl_jobs.update({
        where: { id: jobId },
        data: {
          is_deleted: 0,
          on_hold: 0,
          cancelled_at: null,
          updated_at: now,
        },
      });
  }
}
