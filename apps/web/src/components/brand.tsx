import { cn } from "@/lib/class-names";

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[24px] font-bold tracking-[-0.05em]",
        className,
      )}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        className="size-9 shrink-0"
        aria-hidden="true"
      >
        <rect width="36" height="36" rx="11" fill="currentColor" />
        <path
          d="M10 19.5c0-5 3.3-8.5 8-8.5 3 0 5.3 1.4 6.5 3.5M10 19.5c0 4.2 3.3 6.5 8 6.5 3 0 5.2-.9 7-2.7M10 19.5h15"
          stroke="var(--background)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && "colchón"}
    </span>
  );
}
