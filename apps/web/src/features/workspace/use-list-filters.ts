"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function useListFilters() {
  const params = useSearchParams();
  const pathname = usePathname();
  function setFilters(updates: Record<string, string>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (Object.keys(updates).some((key) => key !== "page")) next.delete("page");
    window.history.replaceState(
      null,
      "",
      `${pathname}${next.size ? `?${next}` : ""}`,
    );
  }
  return {
    get: (key: string) => params.get(key) ?? "",
    setFilter: (key: string, value: string) => setFilters({ [key]: value }),
    setFilters,
    reset: () => window.history.replaceState(null, "", pathname),
  };
}
