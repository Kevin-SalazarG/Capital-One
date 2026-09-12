"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusyIcon, FieldError } from "@/components/feedback";
import { useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import { syncSchema, type Connection } from "@/lib/api/contracts";
import { errorMessage } from "@/lib/api/errors";

export function SyncButton({
  connection,
  onSynced,
  compact = false,
}: {
  connection: Connection;
  onSynced?: () => void;
  compact?: boolean;
}) {
  const { organization, isDemo, can } = useWorkspace();
  const mutation = useCommand(
    () =>
      apiRequest(
        `/organizations/${organization.id}/connections/${connection.id}/sync`,
        syncSchema,
        { method: "POST" },
      ),
    "Datos bancarios actualizados.",
    onSynced,
  );
  if (
    !can("connection:sync") ||
    connection.kind !== "bank" ||
    connection.status === "revoked" ||
    connection.status === "paused"
  )
    return null;
  const actionLabel = compact
    ? mutation.isPending
      ? `Actualizando datos de ${connection.displayName}…`
      : `Actualizar datos de ${connection.displayName}`
    : mutation.isPending
      ? "Sincronizando…"
      : "Sincronizar";
  return (
    <div className={compact ? "flex flex-col items-end gap-2" : "space-y-2"}>
      <Button
        variant="outline"
        size={compact ? "icon" : "default"}
        disabled={isDemo || mutation.isPending}
        onClick={() => mutation.mutate()}
        aria-label={
          compact ? actionLabel : `Sincronizar ${connection.displayName}`
        }
        title={compact ? actionLabel : undefined}
      >
        {mutation.isPending ? <BusyIcon /> : <RefreshCw />}
        {!compact && actionLabel}
      </Button>
      {mutation.isPending && !compact && (
        <p role="status" className="max-w-sm text-xs text-muted-foreground">
          Consultando tus cuentas y movimientos. Puede tardar un momento.
        </p>
      )}
      {mutation.isPending && compact && (
        <span className="sr-only" role="status">
          Consultando tus cuentas y movimientos. Puede tardar un momento.
        </span>
      )}
      {mutation.isError && (
        <FieldError message={errorMessage(mutation.error)} />
      )}
    </div>
  );
}
