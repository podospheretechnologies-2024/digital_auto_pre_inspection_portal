"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { adminNavGroups, mastersLinks } from "@/lib/nav-config";

/** "/jobs/pending" -> Home / Jobs / Pending, using menu titles where a page has one. */
function crumbsFor(pathname: string) {
  const items = [...adminNavGroups.flatMap((g) => g.items), ...mastersLinks];
  const crumbs: { label: string; href?: string }[] = [
    { label: "Home", href: "/dashboard" },
  ];
  let acc = "";
  for (const seg of pathname.split("/").filter(Boolean)) {
    acc += `/${seg}`;
    if (acc === "/dashboard") continue;
    const hit = items.find((i) => i.href === acc);
    const label =
      hit?.title ??
      (/^\d+$/.test(seg)
        ? `#${seg}`
        : seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()));
    crumbs.push({ label, href: hit ? acc : undefined });
  }
  return crumbs;
}

export function PageBreadcrumbs() {
  const crumbs = crumbsFor(usePathname());

  return (
    <ol aria-label="Breadcrumb" className="flex flex-wrap items-center gap-0.5">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <li key={`${c.label}-${i}`} className="flex items-center gap-0.5">
            {c.href && !last ? (
              <Link
                href={c.href}
                className="rounded px-0.5 py-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className="px-0.5 py-0 text-[11px] font-medium text-foreground/65"
                aria-current={last ? "page" : undefined}
              >
                {c.label}
              </span>
            )}
            {!last ? (
              <ChevronRight
                className="size-3 shrink-0 text-muted-foreground/50"
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
