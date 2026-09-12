"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowRight, Check, FileText, Landmark } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  BusyIcon,
  ErrorView,
  FieldError,
  LoadingView,
} from "@/components/feedback";
import { EditorDialog } from "@/components/forms/editor-dialog";
import { DemoNotice } from "@/features/workspace/permission-gate";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { ConnectionDialog } from "@/features/connections/connection-dialog";
import { SyncButton } from "@/features/connections/sync-button";
import { apiRequest } from "@/lib/api/client";
import {
  acknowledgmentSchema,
  accountSchema,
  connectionSchema,
  invoiceSchema,
} from "@/lib/api/contracts";
import { errorMessage } from "@/lib/api/errors";

export function OnboardingPage() {
  const { organization, can, isDemo, basePath } = useWorkspace();
  const router = useRouter();
  const [connectionKind, setConnectionKind] = useState<"bank" | "cfdi" | null>(
    null,
  );
  const [seedOpen, setSeedOpen] = useState(false);
  const connections = useResource(
    "connections",
    z.array(connectionSchema),
    can("connection:read"),
  );
  const accounts = useResource(
    "bank/accounts",
    z.array(accountSchema),
    can("bank-account:read"),
  );
  const invoices = useResource(
    "invoices?limit=1",
    z.array(invoiceSchema),
    can("cfdi:read"),
  );
  const latest = useResource(
    "forecasts/latest",
    z.object({ id: z.string(), status: z.string() }).nullable(),
    can("forecast:read"),
  );
  const forecast = useCommand(
    () =>
      apiRequest(
        `/organizations/${organization.id}/forecasts/runs`,
        acknowledgmentSchema,
        { method: "POST", body: { horizonDays: 30 } },
      ),
    "Tu proyección está lista",
    () => router.push(`${basePath}/dashboard`),
  );
  const seed = useCommand(
    () =>
      apiRequest(
        `/organizations/${organization.id}/cfdi/demo-seed`,
        acknowledgmentSchema,
        { method: "POST" },
      ),
    "Facturas de demostración importadas",
    () => setSeedOpen(false),
  );
  const bank = connections.data?.find(
    (connection) =>
      connection.kind === "bank" && connection.status !== "revoked",
  );
  const cfdi = connections.data?.find(
    (connection) =>
      connection.kind === "cfdi" && connection.status !== "revoked",
  );
  const readyBank = Boolean(accounts.data?.length);
  const readyInvoices = Boolean(invoices.data?.length);
  const readyForecast = latest.data?.status === "completed";
  return (
    <div className="page-container">
      <PageHeader
        title="Prepara tu primera proyección."
        description="Conecta tus fuentes, revisa los datos y mira los próximos 30 días."
        action={
          <Button asChild variant="outline">
            <Link href={`${basePath}/dashboard`}>Ir al resumen</Link>
          </Button>
        }
      />
      <DemoNotice />
      {connections.isPending && can("connection:read") ? (
        <LoadingView />
      ) : connections.isError ? (
        <ErrorView
          error={connections.error}
          retry={() => void connections.refetch()}
        />
      ) : (
        <div className="max-w-4xl space-y-4">
          <Step
            number={1}
            title="Conecta tu banco"
            description="Nessie es un banco de prueba. Necesitas el identificador de un cliente con cuentas creadas."
            completed={readyBank}
          >
            <div className="flex flex-wrap gap-3">
              {bank ? (
                <SyncButton connection={bank} />
              ) : can("connection:create") ? (
                <Button
                  variant="outline"
                  disabled={isDemo}
                  onClick={() => setConnectionKind("bank")}
                >
                  <Landmark />
                  Conectar Nessie
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pide a tu administrador que conecte el banco.
                </p>
              )}
              {readyBank && (
                <Button asChild variant="ghost">
                  <Link href={`${basePath}/bank`}>Ver cuentas</Link>
                </Button>
              )}
            </div>
            {accounts.isError && (
              <FieldError message={errorMessage(accounts.error)} />
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Usa la misma moneda en tu empresa, cuentas y facturas. No se
              realiza conversión de divisas.
            </p>
          </Step>
          <Step
            number={2}
            title="Agrega tus facturas"
            description="Incluye los cobros y pagos que vienen. También puedes continuar solo con tus cuentas."
            completed={readyInvoices}
          >
            <div className="flex flex-wrap gap-3">
              {can("cfdi:read") && (
                <Button asChild variant="outline">
                  <Link href={`${basePath}/invoices`}>
                    <FileText />
                    {readyInvoices ? "Ver facturas" : "Importar facturas"}
                  </Link>
                </Button>
              )}
              {can("connection:create") && !cfdi && (
                <Button
                  variant="ghost"
                  disabled={isDemo}
                  onClick={() => setConnectionKind("cfdi")}
                >
                  Agregar fuente de ejemplo
                </Button>
              )}
              {can("cfdi:import") && organization.currency === "MXN" && (
                <Button
                  variant="ghost"
                  disabled={isDemo || seed.isPending || readyInvoices}
                  onClick={() => setSeedOpen(true)}
                >
                  Usar facturas de demostración
                </Button>
              )}
            </div>
            {organization.currency !== "MXN" && !readyInvoices && (
              <p className="mt-3 text-xs text-muted-foreground">
                El lote de demostración del servidor está en MXN. Importa un
                JSON en {organization.currency} para esta empresa.
              </p>
            )}
            {invoices.isError && (
              <FieldError message={errorMessage(invoices.error)} />
            )}
          </Step>
          <Step
            number={3}
            title="Mira tu caja, a futuro"
            description="Se calcula con tus cuentas, facturas y pagos recurrentes."
            completed={readyForecast}
          >
            {can("forecast:run") ? (
              <Button
                disabled={isDemo || forecast.isPending || !readyBank}
                onClick={() => forecast.mutate()}
              >
                {forecast.isPending ? <BusyIcon /> : <ArrowRight />}
                {forecast.isPending
                  ? "Preparando proyección…"
                  : readyForecast
                    ? "Actualizar proyección"
                    : "Generar proyección"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pide a un administrador o analista que genere la proyección.
              </p>
            )}
            {!readyBank && (
              <p className="mt-3 text-xs text-muted-foreground">
                Primero sincroniza una cuenta bancaria.
              </p>
            )}
            {forecast.isPending && (
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                Procesando saldos y compromisos. Puedes seguir revisando la
                información.
              </p>
            )}
            {forecast.isError && (
              <div className="mt-3">
                <FieldError message={errorMessage(forecast.error)} />
              </div>
            )}
            {latest.isError && (
              <div className="mt-3">
                <FieldError message={errorMessage(latest.error)} />
              </div>
            )}
          </Step>
        </div>
      )}
      {connectionKind && (
        <ConnectionDialog
          open
          onOpenChange={(open) => !open && setConnectionKind(null)}
          initialKind={connectionKind}
        />
      )}
      <EditorDialog
        open={seedOpen}
        onOpenChange={setSeedOpen}
        title="Usar facturas de demostración"
        description="Se importarán 10 facturas sintéticas en MXN a esta empresa. No son documentos fiscales reales."
        busy={seed.isPending}
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            disabled={seed.isPending}
            onClick={() => setSeedOpen(false)}
          >
            Cancelar
          </Button>
          <Button disabled={seed.isPending} onClick={() => seed.mutate()}>
            {seed.isPending && <BusyIcon />}Importar demostración
          </Button>
        </div>
        {seed.isError && <FieldError message={errorMessage(seed.error)} />}
      </EditorDialog>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  completed,
  children,
}: {
  number: number;
  title: string;
  description: string;
  completed: boolean;
  children: ReactNode;
}) {
  return (
    <section className="panel flex gap-4 p-5 md:gap-6 md:p-7">
      <span
        role="img"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold"
        aria-label={completed ? `Paso ${number} completado` : `Paso ${number}`}
      >
        {completed ? <Check className="size-4" /> : number}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mb-5 mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
