"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            className="size-8"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          />
        }
      >
        <SunIcon className="dark:hidden" />
        <MoonIcon className="hidden dark:block" />
        <span className="sr-only">Toggle light / dark</span>
      </TooltipTrigger>
      <TooltipContent>Toggle light / dark</TooltipContent>
    </Tooltip>
  );
}
