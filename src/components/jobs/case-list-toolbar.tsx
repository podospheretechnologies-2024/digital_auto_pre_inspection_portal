"use client";

import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EMPTY_CASE_FILTERS,
  caseFiltersActive,
  type CaseListFilterState,
} from "@/lib/jobs/case-list-filters";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-9 min-w-[8.5rem] rounded-lg border border-input bg-background px-2.5 text-[12.5px] text-foreground shadow-none outline-none",
  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
);

export function CaseListToolbar({
  value,
  onChange,
  banks = [],
  surveyors = [],
  showVehicleType = true,
  showBank = true,
  showSurveyor = true,
  showDates = true,
  searchPlaceholder = "Search ref no, name, mobile, bank ref…",
  className,
}: {
  value: CaseListFilterState;
  onChange: (next: CaseListFilterState) => void;
  banks?: string[];
  surveyors?: string[];
  showVehicleType?: boolean;
  showBank?: boolean;
  showSurveyor?: boolean;
  showDates?: boolean;
  searchPlaceholder?: string;
  className?: string;
}) {
  const active = caseFiltersActive(value);

  function patch(partial: Partial<CaseListFilterState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div
      className={cn(
        "border-b border-border/70 bg-muted/20 px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder={searchPlaceholder}
            className="h-9 bg-background pl-8 text-[13px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showVehicleType ? (
            <select
              className={selectClass}
              value={value.vehicleType}
              onChange={(e) => patch({ vehicleType: e.target.value })}
              aria-label="Vehicle type"
            >
              <option value="all">All types</option>
              <option value="2wheeler">2 Wheeler</option>
              <option value="3wheeler">3 Wheeler</option>
              <option value="4wheeler">4 Wheeler</option>
            </select>
          ) : null}

          {showBank ? (
            <select
              className={selectClass}
              value={value.bank}
              onChange={(e) => patch({ bank: e.target.value })}
              aria-label="Bank"
            >
              <option value="all">All banks</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : null}

          {showSurveyor ? (
            <select
              className={selectClass}
              value={value.surveyor}
              onChange={(e) => patch({ surveyor: e.target.value })}
              aria-label="Surveyor"
            >
              <option value="all">All surveyors</option>
              {surveyors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : null}

          {showDates ? (
            <>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 font-medium">From</span>
                <Input
                  type="date"
                  value={value.dateFrom}
                  onChange={(e) => patch({ dateFrom: e.target.value })}
                  className="h-9 w-[9.5rem] bg-background text-[12.5px]"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 font-medium">To</span>
                <Input
                  type="date"
                  value={value.dateTo}
                  onChange={(e) => patch({ dateTo: e.target.value })}
                  className="h-9 w-[9.5rem] bg-background text-[12.5px]"
                />
              </label>
            </>
          ) : null}

          <Button
            type="button"
            size="sm"
            aria-label="Reset filters"
            title={active ? "Clear all filters" : "No filters applied"}
            className={cn(
              "group/reset h-9 min-w-[5.75rem] gap-1.5 rounded-md px-3 text-[12.5px] font-semibold shadow-none transition-colors",
              "hover:border-transparent hover:bg-red-600 hover:text-white",
              active
                ? "border-transparent bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30"
                : "border-border bg-background text-muted-foreground",
            )}
            onClick={() => {
              if (!active) return;
              onChange({ ...EMPTY_CASE_FILTERS });
            }}
          >
            <RotateCcw
              className="size-3.5 shrink-0 transition-transform duration-500 group-hover/reset:-rotate-180"
              strokeWidth={2.5}
            />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
