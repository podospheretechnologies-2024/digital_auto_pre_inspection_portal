"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavGroups, mastersLinks } from "@/lib/nav-config";

/** "/jobs/pending" -> Home • Jobs • Pending, using menu titles where a page has one. */
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
    // A group root such as /account has no page of its own.
    crumbs.push({ label, href: hit ? acc : undefined });
  }
  return crumbs;
}

export function PageBreadcrumbs() {
  const crumbs = crumbsFor(usePathname());

  return (
    <ol aria-label="Breadcrumb" className="flex flex-wrap items-center">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <li key={`${c.label}-${i}`} className="flex items-center">
            {c.href && !last ? (
              <Link
                href={c.href}
                className="text-sm leading-none text-muted-foreground hover:underline"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className="text-sm leading-none text-muted-foreground"
                aria-current={last ? "page" : undefined}
              >
                {c.label}
              </span>
            )}
            {!last ? (
              <span className="mx-2.5 size-1 rounded-full bg-muted-foreground" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
