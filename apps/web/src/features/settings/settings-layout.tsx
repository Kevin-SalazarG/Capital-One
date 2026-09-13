"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useWorkspace } from "@/features/workspace/workspace";
import { cn } from "@/lib/class-names";

export function SettingsLayout({ children }: { children: ReactNode }) {
  const { can, basePath } = useWorkspace();
  const pathname = usePathname();
  const links = [
    { path: "company", label: "Empresa", permission: "organization:read" },
    { path: "connections", label: "Conexiones", permission: "connection:read" },
  ];
  return (
    <div className="page-container">
      <PageHeader
        title="Todo en su lugar."
        description="Los datos de tu constructora y las fuentes que alimentan el plan de caja de tus obras."
      />
      <nav
        aria-label="Configuración"
        className="mb-8 flex flex-wrap gap-2 border-b pb-3"
      >
        {links
          .filter((item) => can(item.permission))
          .map((item) => (
            <Link
              key={item.path}
              href={`${basePath}/settings/${item.path}`}
              aria-current={pathname.endsWith(item.path) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-secondary",
                pathname.endsWith(item.path)
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
      </nav>
      {children}
    </div>
  );
}
