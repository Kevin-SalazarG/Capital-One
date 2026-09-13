"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListFilters } from "@/features/workspace/use-list-filters";
import { cn } from "@/lib/class-names";

export function DataList<T extends { id: string }>({
  items,
  caption,
  headings,
  row,
  mobile,
  empty,
  className,
}: {
  items: T[];
  caption: string;
  headings: string[];
  row: (item: T) => ReactNode;
  mobile: (item: T) => ReactNode;
  empty: ReactNode;
  className?: string;
}) {
  const filters = useListFilters();
  const requested = Number(filters.get("page")) || 1;
  const pages = Math.max(1, Math.ceil(items.length / 20));
  const page = Math.min(pages, Math.max(1, Math.floor(requested)));
  const visible = items.slice((page - 1) * 20, page * 20);
  if (!items.length) return empty;
  return (
    <section className={cn("panel", className)} aria-label={caption}>
      <div className="hidden md:block">
        <table className="w-full table-fixed">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {headings.map((heading, index) => (
                <th
                  key={heading}
                  scope="col"
                  className={`table-head px-5 py-3 ${index === headings.length - 1 ? "text-right" : ""}`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((item) => (
              <tr
                key={item.id}
                className="relative transition-colors duration-150 hover:bg-muted/40 has-[[data-row-action]:active]:bg-secondary/70"
              >
                {row(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y md:hidden">
        {visible.map((item) => (
          <li
            key={item.id}
            className="relative p-5 transition-colors duration-150 has-[[data-row-action]]:hover:bg-muted/40 has-[[data-row-action]:active]:bg-secondary/70"
          >
            {mobile(item)}
          </li>
        ))}
      </ul>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
        <p className="text-xs text-muted-foreground" role="status">
          {items.length} {items.length === 1 ? "registro" : "registros"}
          {pages > 1 ? ` · Página ${page} de ${pages}` : ""}
        </p>
        {pages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              aria-label="Página anterior"
              onClick={() => filters.setFilter("page", String(page - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page === pages}
              aria-label="Página siguiente"
              onClick={() => filters.setFilter("page", String(page + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </footer>
    </section>
  );
}
