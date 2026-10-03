import { auth } from "@/auth";
import {
  DashboardView,
  type RecentCase,
} from "@/components/dashboard/dashboard-view";
import { db } from "@/lib/db";
import { displayName, isAdmin, roleLabel } from "@/lib/rbac";

async function getPiDashboardCounts() {
  // Sequential batches keep MariaDB pool pressure low under Turbopack HMR.
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

async function getRecentCases(): Promise<RecentCase[]> {
  const jobs = await db.tbl_jobs.findMany({
    where: { is_deleted: 0 },
    orderBy: { id: "desc" },
    take: 8,
    select: {
      id: true,
      vehicleno: true,
      vehicle_type: true,
      cname: true,
      bank_id: true,
      agent_id: true,
      cdate: true,
    },
  });

  const bankIds = [
    ...new Set(jobs.map((j) => j.bank_id).filter((id) => id != null)),
  ] as number[];
  const banks = bankIds.length
    ? await db.m_bank.findMany({
        where: { id: { in: bankIds } },
        select: { id: true, name: true },
      })
    : [];
  const bankName = new Map(banks.map((b) => [b.id, b.name]));

  return jobs.map((j) => ({
    id: j.id,
    vehicleno: j.vehicleno,
    vehicle_type: j.vehicle_type,
    cname: j.cname,
    cdate: j.cdate,
    bank: j.bank_id != null ? (bankName.get(j.bank_id) ?? null) : null,
    status: j.agent_id == null ? "fresh" : "assigned",
  }));
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  let counts = { fresh: 0, schedule: 0, qc: 0, complete: 0 };
  let countsError: string | null = null;
  try {
    counts = await getPiDashboardCounts();
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Failed to load counts";
    countsError = /pool timeout|retrieve a connection/i.test(raw)
      ? "Database is busy — refresh in a moment. If this keeps happening, restart the Next.js server."
      : raw;
  }

  let recent: RecentCase[] = [];
  try {
    recent = await getRecentCases();
  } catch {
    // The counts error above already tells the user the database is unreachable.
  }

  return (
    <DashboardView
      firstName={displayName(user).split(" ")[0]}
      signedInAs={`Signed in as ${displayName(user)} (${roleLabel(user)})`}
      counts={counts}
      countsError={countsError}
      recent={recent}
      showRoleNote={!isAdmin(user)}
    />
  );
}
