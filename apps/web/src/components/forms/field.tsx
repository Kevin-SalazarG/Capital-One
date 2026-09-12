import type { ReactNode, SelectHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/feedback";
import { cn } from "@/lib/class-names";

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function NativeSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full min-w-0 rounded-md border bg-card px-3 text-base text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
