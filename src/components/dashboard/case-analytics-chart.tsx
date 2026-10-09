"use client";

import { Calendar } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DashboardAnalytics } from "@/lib/jobs/dashboard-analytics";
import { cn } from "@/lib/utils";

const RANGES = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

const SERIES = [
  { key: "fresh", label: "Fresh Case", color: "#3dcec4" },
  { key: "qc", label: "Quality Check", color: "#f0c14b" },
  { key: "complete", label: "Completed", color: "#5eb3f6" },
] as const;

const OFFSET_MS = 5.5 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Bucket = { start: number; end: number; label: string; title: string };

function kolkataDate(now: Date) {
  return new Date(now.getTime() + OFFSET_MS);
}

function fromKolkataUtc(date: Date) {
  return new Date(date.getTime() - OFFSET_MS);
}

function startOfKolkataDay(now: Date) {
  const local = kolkataDate(now);
  local.setUTCHours(0, 0, 0, 0);
  return fromKolkataUtc(local).getTime();
}

function startOfKolkataWeek(now: Date) {
  const start = startOfKolkataDay(now);
  const weekday = kolkataDate(new Date(start)).getUTCDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  return start - mondayOffset * DAY;
}

function startOfKolkataMonth(now: Date, monthOffset: number) {
  const local = kolkataDate(now);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCMonth(local.getUTCMonth() + monthOffset);
  return fromKolkataUtc(local).getTime();
}

function formatKolkata(time: number, options: Intl.DateTimeFormatOptions) {
  return kolkataDate(new Date(time)).toLocaleDateString("en-IN", {
    ...options,
    timeZone: "UTC",
  });
}

function todayInputValue() {
  const local = kolkataDate(new Date());
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${local.getUTCFullYear()}-${month}-${day}`;
}

function dateFromInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(Date.UTC(year, month - 1, day) - OFFSET_MS);
}

function buildBuckets(range: RangeId, now: Date): Bucket[] {
  if (range === "day") {
    const start = startOfKolkataDay(now);
    const dayTitle = formatKolkata(start, { day: "2-digit", month: "short", year: "numeric" });
    return Array.from({ length: 24 }, (_, hour) => ({
      start: start + hour * HOUR,
      end: start + (hour + 1) * HOUR,
      label: hour % 4 === 0 ? String(hour).padStart(2, "0") : "",
      title: `${dayTitle}, ${String(hour).padStart(2, "0")}:00`,
    }));
  }

  if (range === "week") {
    const first = startOfKolkataWeek(now);
    return Array.from({ length: 7 }, (_, index) => {
      const start = first + index * DAY;
      const local = kolkataDate(new Date(start));
      const weekday = local.toLocaleDateString("en-IN", {
        weekday: "short",
        timeZone: "UTC",
      });
      const title = formatKolkata(start, {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return {
        start,
        end: start + DAY,
        label: `${weekday} ${String(local.getUTCDate()).padStart(2, "0")}`,
        title,
      };
    });
  }

  if (range === "month") {
    const count = 30;
    const selected = startOfKolkataDay(now);
    const first = selected - (count - 1) * DAY;
    return Array.from({ length: count }, (_, index) => {
      const start = first + index * DAY;
      const day = kolkataDate(new Date(start)).getUTCDate();
      const title = formatKolkata(start, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const show = index === 0 || index === count - 1 || day % 5 === 1;
      return { start, end: start + DAY, label: show ? title.replace(/ \d{4}$/, "") : "", title };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const start = startOfKolkataMonth(now, index - 11);
    const end = startOfKolkataMonth(now, index - 10);
    const title = formatKolkata(start, { month: "long", year: "numeric" });
    return {
      start,
      end,
      label: formatKolkata(start, { month: "short" }),
      title,
    };
  });
}

function countsFor(dates: string[], buckets: Bucket[]) {
  const totals = buckets.map(() => 0);
  for (const value of dates) {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) continue;
    const index = buckets.findIndex((bucket) => time >= bucket.start && time < bucket.end);
    if (index >= 0) totals[index] += 1;
  }
  return totals;
}

function niceMax(value: number) {
  if (value <= 5) return 5;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * exponent;
}

function smoothLine(
  points: Array<{ x: number; y: number }>,
  yMin: number,
  yMax: number,
) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const clamp = (value: number) => Math.min(yMax, Math.max(yMin, value));
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const flat = current.y === next.y;
    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = flat ? current.y : clamp(current.y + (next.y - previous.y) / 6);
    const cp2x = next.x - (after.x - current.x) / 6;
    const cp2y = flat ? next.y : clamp(next.y - (after.y - current.y) / 6);
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return path;
}

export function CaseAnalyticsChart({ data }: { data: DashboardAnalytics }) {
  const [range, setRange] = useState<RangeId>("week");
  const [hover, setHover] = useState<number | null>(null);
  const [anchor, setAnchor] = useState(todayInputValue);
  const dateRef = useRef<HTMLInputElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(720);

  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const update = () => setPlotWidth(Math.max(360, Math.round(element.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const model = useMemo(() => {
    const buckets = buildBuckets(range, dateFromInput(anchor));
    const series = {
      fresh: countsFor(data.fresh, buckets),
      qc: countsFor(data.qc, buckets),
      complete: countsFor(data.complete, buckets),
    };
    const peak = Math.max(0, ...series.fresh, ...series.qc, ...series.complete);
    return { buckets, series, max: niceMax(peak) };
  }, [anchor, data, range]);

  const width = plotWidth;
  const height = 340;
  const pad = { top: 12, right: 36, bottom: 28, left: 32 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const step = model.buckets.length > 1 ? plotW / (model.buckets.length - 1) : plotW;

  function point(index: number, value: number) {
    return {
      x: pad.left + index * step,
      y: pad.top + plotH - (value / model.max) * plotH,
    };
  }

  const lines = SERIES.map((series) => {
    const values = model.series[series.key];
    const points = values.map((value, index) => point(index, value));
    const line = smoothLine(points, pad.top, pad.top + plotH);
    const area =
      points.length > 0
        ? `${line} L ${points[points.length - 1].x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`
        : "";
    return { ...series, values, points, line, area, total: values.reduce((sum, value) => sum + value, 0) };
  });

  const ticks = Array.from({ length: 6 }, (_, index) => {
    const ratio = index / 5;
    return {
      value: Math.round((model.max / 5) * index),
      y: pad.top + plotH - ratio * plotH,
    };
  });

  const active = hover != null ? Math.max(0, Math.min(model.buckets.length - 1, hover)) : null;
  const shownDate = formatKolkata(dateFromInput(anchor).getTime(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const selectedStart = startOfKolkataDay(dateFromInput(anchor));
  const selectedIndex = model.buckets.findIndex(
    (bucket) => selectedStart >= bucket.start && selectedStart < bucket.end,
  );
  const weekLabel =
    range === "week" && model.buckets.length > 0
      ? `${formatKolkata(model.buckets[0].start, { day: "2-digit", month: "short" })} – ${formatKolkata(model.buckets[model.buckets.length - 1].start, { day: "2-digit", month: "short", year: "numeric" })}`
      : null;

  return (
    <div className="flex h-full flex-col bg-card text-foreground">
      <div className="px-5 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[12rem]">
          <h2 className="text-base font-semibold tracking-tight">Case analytics</h2>
          <p className="text-xs text-muted-foreground">
            {weekLabel ? `Week of ${weekLabel}` : "Fresh Case, Quality Check, and Completed"}
            {selectedIndex >= 0
              ? ` · ${range === "day" ? shownDate : model.buckets[selectedIndex].label || model.buckets[selectedIndex].title}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-1.5 ring-1 ring-border">
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-background px-2.5 text-xs font-semibold text-foreground ring-1 ring-border"
              onClick={() => {
                const input = dateRef.current;
                if (!input) return;
                input.focus();
                try {
                  input.showPicker();
                } catch {
                  input.click();
                }
              }}
            >
              <span>{shownDate}</span>
              <Calendar className="size-3.5 text-muted-foreground" />
            </button>
            <input
              ref={dateRef}
              type="date"
              value={anchor}
              aria-label="Chart date"
              onChange={(event) => {
                if (!event.target.value) return;
                setAnchor(event.target.value);
                setHover(null);
              }}
              className="pointer-events-none absolute h-px w-px opacity-0"
            />
          </div>
          <div className="flex items-center gap-0.5">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                range === item.id
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
              onClick={() => {
                setRange(item.id);
                setHover(null);
              }}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pt-3 text-xs text-muted-foreground">
        {lines.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
            <span className="font-semibold text-foreground tabular-nums">{series.total}</span>
          </span>
        ))}
      </div>

      <div ref={plotRef} className="relative pb-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-[340px] w-full"
          role="img"
          aria-label="Fresh Case, Quality Check, and Completed over time"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * width;
            const index = Math.round((x - pad.left) / step);
            if (index < 0 || index >= model.buckets.length) {
              setHover(null);
              return;
            }
            setHover(index);
          }}
        >
          <defs>
            {lines.map((series) => (
              <linearGradient
                key={series.key}
                id={`analytics-${series.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={series.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((tick) => (
            <g key={tick.y}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(15,23,42,0.06)"
              />
              <text
                x={pad.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {lines.map((series) => (
            <path
              key={`${series.key}-area`}
              d={series.area}
              fill={`url(#analytics-${series.key})`}
            />
          ))}
          {lines.map((series) => (
            <path
              key={`${series.key}-line`}
              d={series.line}
              fill="none"
              stroke={series.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {lines.map((series) =>
            series.points.map((dot, index) => (
              <circle
                key={`${series.key}-point-${index}`}
                cx={dot.x}
                cy={dot.y}
                r={index === selectedIndex ? 4.5 : 2.5}
                fill={series.color}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            )),
          )}

          {model.buckets.map((bucket, index) =>
            bucket.label ? (
              <text
                key={`${bucket.start}-${bucket.label}`}
                x={pad.left + index * step}
                y={height - 8}
                textAnchor="middle"
                fill={index === selectedIndex ? "#0f172a" : "#64748b"}
                fontSize="11"
                fontWeight={index === selectedIndex ? 600 : 400}
              >
                {bucket.label}
              </text>
            ) : null,
          )}

          {range !== "day" && selectedIndex >= 0 ? (
            <line
              x1={pad.left + selectedIndex * step}
              x2={pad.left + selectedIndex * step}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke="rgba(15,23,42,0.28)"
              strokeDasharray="3 4"
            />
          ) : null}

          {active != null ? (
            <g>
              <line
                x1={pad.left + active * step}
                x2={pad.left + active * step}
                y1={pad.top}
                y2={pad.top + plotH}
                stroke="rgba(15,23,42,0.16)"
              />
              {lines.map((series) => {
                const dot = series.points[active];
                return (
                  <g key={`${series.key}-dot`}>
                    <circle cx={dot.x} cy={dot.y} r="4.5" fill="#ffffff" stroke="#e2e8f0" />
                    <circle cx={dot.x} cy={dot.y} r="2.5" fill={series.color} />
                  </g>
                );
              })}
            </g>
          ) : null}
        </svg>
        {active != null ? (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-md border border-border bg-popover px-2.5 py-2 text-[11px] text-popover-foreground shadow-md"
            style={{
              left: `calc(${((pad.left + active * step) / width) * 100}% + 8px)`,
              transform: active > model.buckets.length * 0.72 ? "translateX(-100%)" : undefined,
            }}
          >
            <p className="mb-1 font-semibold">{model.buckets[active].title}</p>
            {lines.map((series) => (
              <p key={series.key} className="flex items-center justify-between gap-3 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: series.color }} />
                  {series.label}
                </span>
                <span className="font-semibold text-foreground tabular-nums">{series.values[active]}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
