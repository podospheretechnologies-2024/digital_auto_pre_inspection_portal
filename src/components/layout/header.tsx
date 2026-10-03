"use client";

import { PageSearch } from "@/components/layout/page-search";
import { ThemeModeToggle } from "@/components/themes/theme-mode-toggle";
import { ThemeSelector } from "@/components/themes/theme-selector";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md">
      <nav className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="size-10 rounded-full hover:bg-lightprimary hover:text-primary" />
          <PageSearch />
        </div>

        <div className="flex items-center gap-2">
          <ThemeModeToggle />
          <div className="hidden sm:block">
            <ThemeSelector />
          </div>
        </div>
      </nav>
    </header>
  );
}
