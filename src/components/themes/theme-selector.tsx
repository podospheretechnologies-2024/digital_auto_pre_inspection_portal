"use client";

import { Palette } from "lucide-react";

import { useThemeConfig } from "@/components/themes/active-theme";
import { THEMES } from "@/components/themes/theme.config";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Theme
      </Label>
      <Select
        value={activeTheme}
        onValueChange={(value) => {
          if (value !== null) setActiveTheme(value as string);
        }}
      >
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className="min-w-[9.5rem] justify-start *:data-[slot=select-value]:w-28"
        >
          <Palette className="text-muted-foreground" />
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>Theme</SelectLabel>
            {THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
