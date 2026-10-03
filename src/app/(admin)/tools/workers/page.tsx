import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANNED_CRON_JOBS } from "@/lib/jobs/scheduler";
import { QUEUE_NAMES } from "@/lib/jobs/queue-names";

export default function WorkersPage() {
  return (
    <>
      <PageHeader
        title="Workers"
        description="BullMQ background jobs for Pre-Inspection"
        badge="PI"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How to run the worker</CardTitle>
            <CardDescription>
              Separate Node process (not part of{" "}
              <code className="text-xs">next start</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-inside list-decimal space-y-2">
              <li>
                Start Redis:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  docker compose up -d redis
                </code>
              </li>
              <li>
                Set <code className="text-xs">REDIS_URL</code>,{" "}
                <code className="text-xs">DATABASE_URL</code>,{" "}
                <code className="text-xs">DIGITAL_DEKHO_API_KEY</code> in{" "}
                <code className="text-xs">.env</code>. For live SMS also set{" "}
                <code className="text-xs">SMS_ENABLED=true</code> and{" "}
                <code className="text-xs">SMS_AUTH_KEY</code>.
              </li>
              <li>
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                  npm run worker
                </pre>
              </li>
              <li>
                Queues:{" "}
                {Object.values(QUEUE_NAMES).map((name, i, arr) => (
                  <span key={name}>
                    <code className="text-xs">{name}</code>
                    {i < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
                . Vahan import repeats every 5 minutes; SMS is enqueued on
                assign / inspection submit.
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled jobs</CardTitle>
            <CardDescription>
              Background schedule — Pre-Inspection only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANNED_CRON_JOBS.map((job) => (
                <li
                  key={job.id}
                  className="rounded-md border border-border px-3 py-2"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {job.title}
                    </span>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Queue:{" "}
                    <code className="text-foreground">{job.queue}</code>
                    {job.interval !== "—" ? ` · ${job.interval}` : null}
                    {job.notes ? ` · ${job.notes}` : null}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
