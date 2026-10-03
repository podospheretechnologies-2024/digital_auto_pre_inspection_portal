import Image from "next/image";

import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs";
import { Badge } from "@/components/ui/badge";

/** Title card at the top of each page — the template's breadcrumb banner. */
export function PageHeader({
  title,
  description,
  badge,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  badge?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-md bg-lightsecondary px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-2.5">
          {eyebrow ? (
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {badge ? <Badge variant="outline">{badge}</Badge> : null}
          </div>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
          <PageBreadcrumbs />
        </div>

        {actions ? (
          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : (
          <div className="pointer-events-none absolute right-7 bottom-0 hidden sm:block">
            <Image
              src="/images/dashboard/customer-support-img.png"
              alt=""
              width={145}
              height={95}
              priority={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
