"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock3,
  FileText,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BusyIcon,
  EmptyView,
  ErrorView,
  LoadingView,
} from "@/components/feedback";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { RecommendationCard } from "@/features/dashboard/recommendation-card";
import { acknowledgmentSchema, dashboardSchema } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { formatDate, formatMoney, formatTimestamp } from "@/lib/formatters";

const CashChart = dynamic(
  () =>
    import("@/features/dashboard/cash-chart").then(
      (module) => module.CashChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[440px] w-full rounded-xl" />,
  },
);

export function DashboardPage() {
  const { organization, basePath, isDemo, can } = useWorkspace();
  const query = useResource("dashboard", dashboardSchema);
  const client = useQueryClient();
  const forecast = useMutation({
    mutationFn: async () => {
      if (!isDemo)
        await apiRequest(
          `/organizations/${organization.id}/forecasts/runs`,
          acknowledgmentSchema,
          { method: "POST", body: { horizonDays: 30 } },
        );
    },
    onSuccess: async () => {
      if (!isDemo)
        await client.invalidateQueries({
          queryKey: ["organization", organization.id],
        });
      toast.success(
        isDemo ? "Esta vista usa datos de ejemplo" : "Proyección actualizada",
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (query.isPending) return <LoadingView />;
  if (
    query.error instanceof ApiError &&
    query.error.code === "FORECAST_INPUTS_INCOMPLETE"
  )
    return (
      <div className="page-container">
        <h1 className="page-title mb-8">Todo empieza con tu caja.</h1>
        <EmptyView
          title="Prepara tu primera proyección"
          description={
            can("connection:create")
              ? "Agrega tu cuenta y tus facturas para ver los próximos 30 días."
              : "Un administrador puede conectar los datos de tu empresa."
          }
        >
          {can("connection:create") && (
            <Button asChild>
              <Link href={`${basePath}/onboarding`}>
                Comenzar
                <ArrowRight />
              </Link>
            </Button>
          )}
        </EmptyView>
      </div>
    );
  if (!query.data)
    return (
      <div className="page-container">
        <ErrorView error={query.error} retry={() => void query.refetch()} />
      </div>
    );
  const data = query.data;
  return (
    <div className="page-container space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Tu caja, a futuro.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Una mirada a los próximos {data.forecast.length} días de{" "}
            {organization.name}.
          </p>
        </div>
        {can("forecast:run") && (
          <Button
            variant="outline"
            disabled={forecast.isPending}
            onClick={() => forecast.mutate()}
          >
            {forecast.isPending ? <BusyIcon /> : <RefreshCw />}
            {forecast.isPending ? "Actualizando…" : "Actualizar proyección"}
          </Button>
        )}
      </div>
      {query.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/25 bg-warning/5 px-4 py-2 text-sm"
        >
          <p>Mostramos la última información disponible.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void query.refetch()}
          >
            Reintentar
          </Button>
        </div>
      )}
      <section
        aria-label="Resumen de liquidez"
        className="grid gap-6 rounded-xl border bg-card px-6 py-6 md:grid-cols-3 md:gap-0 md:py-7"
      >
        <div className="md:border-r md:pr-7">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="size-4" />
            Saldo actual
          </p>
          <p className="numeric mt-3 text-[31px] font-semibold leading-none tracking-[-0.045em] xl:text-[35px]">
            {formatMoney(data.currentBalance, organization.currency)}
          </p>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Disponible en tus cuentas · {organization.currency}
          </p>
        </div>
        <div className="md:border-r md:px-7">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            Reserva de seguridad
          </p>
          <p className="numeric mt-3 text-[31px] font-semibold leading-none tracking-[-0.045em] xl:text-[35px]">
            {formatMoney(data.safetyThreshold, organization.currency)}
          </p>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Tu referencia para operar con margen
          </p>
        </div>
        <div className="md:pl-7">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-4" />
            {data.gap ? "Fecha a cuidar" : "Próximos 30 días"}
          </p>
          <p className="mt-3 text-[31px] font-semibold leading-none tracking-[-0.045em] xl:text-[35px]">
            {data.gap
              ? formatDate(data.gap.date, { day: "numeric", month: "short" })
              : "Con margen"}
          </p>
          <p
            className={`mt-2.5 text-xs ${data.gap ? "text-warning" : "text-primary"}`}
          >
            {data.gap
              ? `Faltan ${formatMoney(data.gap.deficit, organization.currency)} para cubrir la reserva`
              : "Sin faltantes de reserva proyectados"}
          </p>
        </div>
      </section>
      <div className="grid items-stretch gap-5 min-[1200px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 min-[1200px]:order-1">
          <CashChart data={data} />
        </div>
        <div className="order-1 min-w-0 min-[1200px]:order-2">
          <RecommendationCard data={data} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {can("cfdi:read") && (
          <Link
            href={`${basePath}/invoices`}
            className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-5 transition-colors hover:border-primary/30"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">
                Tus cobros y pagos
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Revisa las facturas de tu negocio
              </span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        {can("bank-account:read") && (
          <Link
            href={`${basePath}/bank`}
            className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-5 transition-colors hover:border-primary/30"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Landmark className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">
                Tu actividad bancaria
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Cuentas y movimientos, en un lugar
              </span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          Proyección:{" "}
          {formatTimestamp(
            data.dataFreshness.forecastCompletedAt,
            organization.timeZone,
          )}
        </p>
        <p>
          Banco:{" "}
          {formatTimestamp(
            data.dataFreshness.bankLastSyncedAt,
            organization.timeZone,
          )}
        </p>
      </footer>
    </div>
  );
}
