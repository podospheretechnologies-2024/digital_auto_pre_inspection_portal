import { cn } from "@/lib/utils";

/** Registration number in the mono "plate" chip. */
export function RegPlate({
  value,
  large = false,
  className,
}: {
  value?: string | null;
  large?: boolean;
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/60 font-mono font-semibold tracking-wide tabular-nums whitespace-nowrap text-foreground",
        large ? "px-3 py-1 text-base" : "px-2 py-0.5 text-[12.5px]",
        className,
      )}
    >
      {value}
    </span>
  );
}
