import { db } from "@/lib/db";
import { isBank, isBoth } from "@/lib/rbac";
import type { SessionUser } from "@/types/next-auth";

export type JobScope = {
  unrestricted: boolean;
  bankId?: number;
  /** Empty list matches no jobs. */
  agentIds?: number[];
};

type JobRef = {
  agent_id: number | null;
  bank_id: number | null;
};

/** Admin and HO see every case. Others are limited to their bank, self, or child surveyors. */
export async function resolveJobScope(user: SessionUser): Promise<JobScope> {
  if (isBoth(user)) return { unrestricted: true };

  if (isBank(user)) {
    return {
      unrestricted: false,
      bankId: user.bankId ?? -1,
    };
  }

  if (user.type === "Surveyor") {
    return { unrestricted: false, agentIds: [Number(user.id)] };
  }

  if (user.type === "RO") {
    const surveyors = await db.users.findMany({
      where: {
        parent_id: Number(user.id),
        type: "Surveyor",
        is_deleted: 0,
      },
      select: { id: true },
    });
    return {
      unrestricted: false,
      agentIds: surveyors.map((row) => row.id),
    };
  }

  return { unrestricted: false, agentIds: [] };
}

export function applyJobScope(
  where: Record<string, unknown>,
  scope: JobScope,
) {
  if (scope.unrestricted) return;
  if (scope.bankId != null) where.bank_id = scope.bankId;
  if (scope.agentIds) {
    where.agent_id = { in: scope.agentIds.length > 0 ? scope.agentIds : [-1] };
  }
}

export async function canAccessJob(
  user: SessionUser,
  job: JobRef,
): Promise<boolean> {
  if (isBoth(user)) return true;

  if (isBank(user)) {
    return user.bankId != null && job.bank_id === user.bankId;
  }

  if (user.type === "Surveyor") {
    return job.agent_id != null && job.agent_id === Number(user.id);
  }

  if (user.type === "RO") {
    if (job.agent_id == null) return false;
    const agent = await db.users.findFirst({
      where: {
        id: job.agent_id,
        parent_id: Number(user.id),
        type: "Surveyor",
        is_deleted: 0,
      },
      select: { id: true },
    });
    return agent != null;
  }

  return false;
}

/** Inspection writes: assigned surveyor, their RO, or admin/HO. Not a bank user. */
export async function canWorkInspection(
  user: SessionUser,
  job: JobRef & { is_deleted?: number | null },
): Promise<boolean> {
  if (isBank(user)) return false;
  if (job.is_deleted === 1) return false;
  return canAccessJob(user, job);
}

/** Signed PDF links and logged-in reads. Unlinked files are not readable by bank users. */
export async function canReadMediaKey(
  user: SessionUser,
  key: string,
): Promise<boolean> {
  if (isBoth(user)) return true;

  const name = key.split("/").pop() ?? "";
  if (!name) return false;

  const jobId = await jobIdForStoredName(name);
  if (jobId == null) {
    return user.type === "Surveyor" || user.type === "RO";
  }

  const job = await db.tbl_jobs.findFirst({
    where: { id: jobId },
    select: { agent_id: true, bank_id: true },
  });
  if (!job) return false;
  return canAccessJob(user, job);
}

async function jobIdForStoredName(name: string): Promise<number | null> {
  const imageWhere = {
    OR: [{ image: name }, { image: { endsWith: `/${name}` } }],
  };

  const image2 = await db.tbl_2wheeler_images.findFirst({
    where: imageWhere,
    select: { parent_id: true },
  });
  if (image2?.parent_id) {
    const row = await db.tbl_2wheeler.findUnique({
      where: { id: image2.parent_id },
      select: { job_id: true },
    });
    if (row?.job_id) return row.job_id;
  }

  const image3 = await db.tbl_3wheeler_images.findFirst({
    where: {
      OR: [
        { image: name },
        { image: { endsWith: `/${name}` } },
        { s3_url: { contains: name } },
      ],
    },
    select: { parent_id: true },
  });
  if (image3?.parent_id) {
    const row = await db.tbl_3wheeler.findUnique({
      where: { id: image3.parent_id },
      select: { job_id: true },
    });
    if (row?.job_id) return row.job_id;
  }

  const image4 = await db.tbl_4wheeler_images.findFirst({
    where: {
      OR: [
        { image: name },
        { image: { endsWith: `/${name}` } },
        { s3_url: { contains: name } },
      ],
    },
    select: { parent_id: true },
  });
  if (image4?.parent_id) {
    const row = await db.tbl_4wheeler.findUnique({
      where: { id: image4.parent_id },
      select: { job_id: true },
    });
    if (row?.job_id) return row.job_id;
  }

  const fileWhere = {
    OR: [
      { chassisphoto: name },
      { video: name },
      { chassisphoto: { endsWith: name } },
      { video: { endsWith: name } },
      { s3video_url: { contains: name } },
    ],
  };

  const two = await db.tbl_2wheeler.findFirst({
    where: fileWhere,
    select: { job_id: true },
  });
  if (two?.job_id) return two.job_id;

  const three = await db.tbl_3wheeler.findFirst({
    where: fileWhere,
    select: { job_id: true },
  });
  if (three?.job_id) return three.job_id;

  const four = await db.tbl_4wheeler.findFirst({
    where: fileWhere,
    select: { job_id: true },
  });
  return four?.job_id ?? null;
}
