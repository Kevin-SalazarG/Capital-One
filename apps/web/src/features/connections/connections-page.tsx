"use client";

import { useState } from "react";
import { z } from "zod";
import { FileText, Landmark, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditorDialog } from "@/components/forms/editor-dialog";
import {
  BusyIcon,
  EmptyView,
  ErrorView,
  FieldError,
} from "@/components/feedback";
import { ConnectionsListSkeleton } from "@/components/page-skeletons";
import {
  PermissionGate,
  DemoNotice,
} from "@/features/workspace/permission-gate";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import {
  connectionSchema,
  acknowledgmentSchema,
  type Connection,
} from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import { errorMessage, ApiError } from "@/lib/api/errors";
import { formatTimestamp } from "@/lib/formatters";
import { ConnectionDialog } from "@/features/connections/connection-dialog";
import { SyncButton } from "@/features/connections/sync-button";

const STATUS_LABELS = {
  active: "Activa",
  paused: "En pausa",
  revoked: "Desconectada",
  error: "Requiere atención",
};
export function ConnectionsPage() {
  return (
    <PermissionGate permission="connection:read">
      <ConnectionsContent />
    </PermissionGate>
  );
}
function ConnectionsContent() {
  const { organization, can, isDemo } = useWorkspace();
  const connections = useResource("connections", z.array(connectionSchema));
  const [editor, setEditor] = useState<Connection | "new" | null>(null);
  const [revoking, setRevoking] = useState<Connection | null>(null);
  const revoke = useCommand(
    (connection: Connection) =>
      apiRequest(
        `/organizations/${organization.id}/connections/${connection.id}`,
        acknowledgmentSchema,
        { method: "DELETE" },
      ),
    "Conexión desconectada",
    () => setRevoking(null),
  );
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Conexiones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Las fuentes que alimentan el plan de caja de tus obras.
          </p>
        </div>
        {can("connection:create") && (
          <Button disabled={isDemo} onClick={() => setEditor("new")}>
            <Plus />
            Agregar conexión
          </Button>
        )}
      </div>
      <DemoNotice />
      {connections.isPending ? (
        <ConnectionsListSkeleton />
      ) : connections.isError ? (
        <ErrorView
          error={connections.error}
          retry={() => void connections.refetch()}
        />
      ) : !connections.data.length ? (
        <EmptyView
          title="Conecta tu primera fuente"
          description="Agrega tu cliente de Nessie o una fuente de facturas de demostración."
        />
      ) : (
        <div className="panel divide-y">
          {connections.data.map((connection) => (
            <section key={connection.id} className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {connection.kind === "bank" ? (
                    <Landmark className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold">
                    {connection.displayName}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {connection.provider === "nessie"
                      ? "Nessie · Banco de prueba"
                      : "Facturas sintéticas"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Badge variant="outline">
                      {STATUS_LABELS[connection.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(
                        connection.lastSyncedAt,
                        organization.timeZone,
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  <SyncButton connection={connection} compact />
                  {connection.status !== "revoked" &&
                    (can("connection:update") || can("connection:revoke")) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Opciones de ${connection.displayName}`}
                            disabled={isDemo}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {can("connection:update") && (
                            <DropdownMenuItem
                              className="min-h-11"
                              onSelect={() => setEditor(connection)}
                            >
                              Editar conexión
                            </DropdownMenuItem>
                          )}
                          {can("connection:revoke") && (
                            <DropdownMenuItem
                              className="min-h-11"
                              variant="destructive"
                              onSelect={() => setRevoking(connection)}
                            >
                              Desconectar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </div>
              {connection.lastErrorCode && (
                <p className="mt-4 text-sm text-destructive">
                  {errorMessage(new ApiError(connection.lastErrorCode, 502))}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
      {editor && (
        <ConnectionDialog
          open
          onOpenChange={(open) => !open && setEditor(null)}
          {...(editor === "new" ? {} : { connection: editor })}
        />
      )}
      <EditorDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Desconectar fuente"
        description={`Se revocará la conexión «${revoking?.displayName ?? ""}». Dejará de sincronizar nueva información.`}
        busy={revoke.isPending}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={revoke.isPending}
            onClick={() => setRevoking(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={revoke.isPending}
            onClick={() => revoking && revoke.mutate(revoking)}
          >
            {revoke.isPending && <BusyIcon />}Desconectar
          </Button>
        </div>
        {revoke.isError && <FieldError message={errorMessage(revoke.error)} />}
      </EditorDialog>
    </>
  );
}
