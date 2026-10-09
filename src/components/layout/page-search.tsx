"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors focus-within:text-primary" />
      <input
        id="page-search"
        type="search"
        autoComplete="off"
        placeholder="Search pages…"
        value={q}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="page-search-results"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-10 w-full rounded-xl border border-input bg-background pr-10 pl-10 text-sm shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {q ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear page search"
          title="Clear search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setQ("");
            setOpen(true);
            document.getElementById("page-search")?.focus();
          }}
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
      {open ? (
        <div
          id="page-search-results"
          className="absolute top-[calc(100%+0.5rem)] left-0 z-30 w-full rounded-xl border border-border/80 bg-popover p-1.5 shadow-lg"
        >
          {matches.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No page matches “{q}”.
            </p>
          ) : (
            <ul className="max-h-72 space-y-0.5 overflow-y-auto">
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
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
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
