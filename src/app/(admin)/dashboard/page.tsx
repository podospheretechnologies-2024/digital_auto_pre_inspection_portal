import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardAnalytics } from "@/lib/jobs/dashboard-analytics";
import { getJobStageCounts } from "@/lib/jobs/stage-counts";
import { displayName, roleLabel } from "@/lib/rbac";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  let counts = { fresh: 0, schedule: 0, qc: 0, complete: 0 };
  let countsError: string | null = null;
  try {
    counts = await getJobStageCounts();
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Failed to load counts";
    countsError = /pool timeout|retrieve a connection/i.test(raw)
      ? "Database is busy — refresh in a moment. If this keeps happening, restart the Next.js server."
      : raw;
  }

  let analytics = { fresh: [] as string[], qc: [] as string[], complete: [] as string[] };
  try {
    analytics = await getDashboardAnalytics();
  } catch {
    // The counts error above already tells the user the database is unreachable.
  }

  return (
    <DashboardView
      firstName={displayName(user).split(" ")[0]}
      signedInAs={`Signed in as ${displayName(user)} (${roleLabel(user)})`}
      counts={counts}
      countsError={countsError}
      analytics={analytics}
    />
  );
}
