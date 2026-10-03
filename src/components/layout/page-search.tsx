"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { adminNavGroups, mastersLinks } from "@/lib/nav-config";

/** Header search: finds a page in the menu and jumps to it, as the template's search does. */
export function PageSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const pages = useMemo(() => {
    const seen = new Set<string>();
    const all = [
      ...adminNavGroups.flatMap((g) => g.items),
      ...mastersLinks,
    ].filter((p) => (seen.has(p.title) ? false : (seen.add(p.title), true)));
    return all.map((p) => ({ title: p.title, href: p.href, icon: p.icon }));
  }, []);

  const matches = q.trim()
    ? pages.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase()))
    : pages;

  return (
    <div className="relative w-full max-w-xs">
      <label htmlFor="page-search" className="sr-only">
        Search pages
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="page-search"
        type="search"
        autoComplete="off"
        placeholder="Search pages…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-10 w-full rounded-xl border border-input bg-transparent pr-3 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      {open ? (
        <div className="absolute top-12 left-0 z-30 w-full rounded-md border border-border bg-popover p-2 shadow-md">
          {matches.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No page matches “{q}”.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {matches.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.href + p.title}>
                    <Link
                      href={p.href}
                      onClick={() => {
                        setQ("");
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-md bg-muted/40 p-2 text-sm font-medium hover:bg-lightprimary hover:text-primary"
                    >
                      <Icon className="size-4 shrink-0" />
                      {p.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
