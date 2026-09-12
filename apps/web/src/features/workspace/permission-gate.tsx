"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useWorkspace } from "@/features/workspace/workspace";
import { EmptyView } from "@/components/feedback";
import { Button } from "@/components/ui/button";

export function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { can, basePath } = useWorkspace();
  if (can(permission)) return children;
  return (
    <div className="page-container">
      <EmptyView
        title="Esta vista necesita otro acceso"
        description="Pide al administrador de tu empresa que revise tus permisos."
      >
        <Button asChild variant="outline">
          <Link href={`${basePath}/dashboard`}>Volver al resumen</Link>
        </Button>
      </EmptyView>
    </div>
  );
}

export function DemoNotice() {
  const { isDemo } = useWorkspace();
  return isDemo ? (
    <p className="mb-6 rounded-lg border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
      Estás explorando datos de ejemplo. Los cambios se habilitan al usar tu
      empresa.
    </p>
  ) : null;
}
