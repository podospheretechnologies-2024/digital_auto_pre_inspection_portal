import Link from "next/link";

import { cn } from "@/lib/utils";

export type WaitingRow = {
  label: string;
  value: number;
  href?: string;
};

/** Horizontal bars showing where cases are waiting. The longest bar is emphasised. */
export function WaitingBars({ rows }: { rows: WaitingRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const top = rows.reduce((a, r) => (r.value > a.value ? r : a), rows[0]);

  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const pct = Math.round((r.value / max) * 100);
        const row = (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="font-mono text-[13px] font-semibold tabular-nums">
                {r.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  r === top && r.value > 0 ? "bg-primary" : "bg-primary/35",
                )}
                style={{ width: `${Math.max(pct, r.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        );
        return (
          <li key={r.label}>
            {r.href ? (
              <Link href={r.href} className="block rounded-lg transition-opacity hover:opacity-80">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
