import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { mastersLinks } from "@/lib/nav-config";

export default function MastersHubPage() {
  return (
    <>
      <PageHeader
        title="Masters"
        description="Reference data used by Pre-Inspection intimations"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mastersLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40 hover:bg-lightprimary"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-lightprimary text-primary">
                <Icon className="size-5" />
              </span>
              <span className="font-semibold text-foreground">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
