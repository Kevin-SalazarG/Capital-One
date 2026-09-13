"use client";

import { useId, type ReactNode } from "react";
import { Funnel } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/class-names";

export function FilterMenu({
  label,
  activeCount,
  onClear,
  className,
  children,
}: {
  label: string;
  activeCount: number;
  onClear: () => void;
  className?: string;
  children: ReactNode;
}) {
  const titleId = useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={activeCount ? "secondary" : "outline"}
          aria-label={
            activeCount
              ? `${label}, ${activeCount} ${activeCount === 1 ? "activo" : "activos"}`
              : label
          }
          className={cn("list-filter-trigger", className)}
        >
          <Funnel aria-hidden="true" />
          Filtros
          {activeCount > 0 && (
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
            >
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-labelledby={titleId}>
        <h2 id={titleId} className="mb-5 text-sm font-semibold">
          Filtros
        </h2>
        <div className="space-y-4">{children}</div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            disabled={!activeCount}
            onClick={onClear}
          >
            Limpiar
          </Button>
          <PopoverClose asChild>
            <Button type="button">Listo</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
