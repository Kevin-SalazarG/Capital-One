"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  decisionSchema,
  treasurySchema,
  type Treasury,
  type TreasuryDecision,
  type TreasuryPlan,
} from "@colchon/treasury/treasury-contract";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CircleOff,
  Clock3,
  FileCheck2,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
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
import { apiRequest } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/class-names";

const TreasuryChart = dynamic(
  () => import("./treasury-chart").then((module) => module.TreasuryChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[425px] w-full rounded-xl" />,
  },
);

export function TreasuryPage() {
  const { basePath, can } = useWorkspace();
  const query = useResource(
    "treasury",
    treasurySchema,
    can("bank-account:read"),
  );
  if (!can("bank-account:read"))
    return (
      <div className="page-container">
        <EmptyView
          title="Tu acceso es de consulta"
          description="El plan de caja necesita permiso para consultar cuentas. Pide acceso de analista a un administrador."
        />
      </div>
    );
  if (query.isPending)
    return (
      <div className="page-container">
        <LoadingView />
      </div>
    );
  if (
    query.error instanceof ApiError &&
    query.error.code === "FORECAST_INPUTS_INCOMPLETE"
  )
    return (
      <div className="page-container">
        <h1 className="page-title mb-8">Primero, pongamos tu caja en orden.</h1>
        <EmptyView
          title="Prepara tu primer plan"
          description="Conecta una cuenta de débito o ahorro en la moneda de tu empresa, agrega tus cobros y registra tu próxima nómina."
        >
          <Button asChild>
            <Link href={`${basePath}/onboarding`}>
              Preparar mis datos
              <ArrowRight />
            </Link>
          </Button>
        </EmptyView>
      </div>
    );
  if (!query.data)
    return (
      <div className="page-container">
        <ErrorView error={query.error} retry={() => void query.refetch()} />
      </div>
    );
  return (
    <TreasuryContent
      data={query.data}
      refreshing={query.isFetching}
      refresh={() => void query.refetch()}
    />
  );
}

function TreasuryContent({
  data,
  refreshing,
  refresh,
}: {
  data: Treasury;
  refreshing: boolean;
  refresh: () => void;
}) {
  const { organization, basePath, isDemo, can } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stressId, setStressId] = useState("");
  const [localDecision, setLocalDecision] = useState<TreasuryDecision | null>(
    null,
  );
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!isDemo) return;
    try {
      const stored = sessionStorage.getItem("colchon-demo-decision-v2");
      const parsed = decisionSchema.safeParse(
        stored ? JSON.parse(stored) : null,
      );
      if (parsed.success) setLocalDecision(parsed.data);
    } catch {
      toast.warning(
        "No pudimos recuperar el plan de esta demo. Puedes elegirlo de nuevo.",
      );
    }
  }, [isDemo]);
  const preview = useResource(
    `treasury?delayedReceiptId=${encodeURIComponent(stressId)}`,
    treasurySchema,
    Boolean(stressId),
  );
  const model = stressId && preview.data ? preview.data : data;
  const plan = model.plans.find((item) => item.id === selectedId) ?? null;
  const decision = isDemo ? localDecision : data.decision;
  const stale = decision && decision.inputHash !== data.inputHash;
  const currency = data.input.currency;
  const money = (value: string) => formatMoney(value, currency);
  function remember(next: TreasuryDecision) {
    setLocalDecision(next);
    try {
      sessionStorage.setItem("colchon-demo-decision-v2", JSON.stringify(next));
    } catch {
      toast.warning(
        "El plan funciona en esta vista, pero tu navegador no permite conservarlo al recargar.",
      );
    }
  }
  const choose = useMutation({
    mutationFn: async (selected: TreasuryPlan) => {
      if (isDemo)
        return decisionSchema.parse({
          id: "demo-decision",
          inputHash: data.inputHash,
          planId: selected.id,
          createdAt: new Date().toISOString(),
          plan: selected,
          steps: {},
        });
      return apiRequest(
        `/organizations/${organization.id}/treasury/decisions`,
        decisionSchema,
        {
          method: "POST",
          body: { inputHash: data.inputHash, planId: selected.id },
        },
      );
    },
    onSuccess: async (next) => {
      if (isDemo) remember(next);
      else
        await queryClient.invalidateQueries({
          queryKey: ["organization", organization.id],
        });
      toast.success(
        isDemo
          ? "Plan guardado en esta demo"
          : "Plan guardado para seguimiento",
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const step = useMutation({
    mutationFn: async ({
      actionId,
      status,
    }: {
      actionId: string;
      status: "pending" | "contacted" | "agreed";
    }) => {
      if (!decision) throw new Error("No decision");
      if (isDemo)
        return {
          ...decision,
          steps: { ...decision.steps, [actionId]: status },
        };
      return apiRequest(
        `/organizations/${organization.id}/treasury/decisions/${decision.id}`,
        decisionSchema,
        { method: "PATCH", body: { actionId, status } },
      );
    },
    onSuccess: async (next) => {
      if (isDemo) remember(next);
      else
        await queryClient.invalidateQueries({
          queryKey: ["organization", organization.id],
        });
      toast.success("Seguimiento actualizado. El saldo real no cambió.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const payroll =
    model.criticalEvents.find((event) => event.category === "payroll") ??
    model.criticalEvents[0];
  const payrollPoint =
    payroll &&
    model.baseline.points.find((point) => point.date === payroll.date);
  const payrollRisk = payrollPoint && Number(payrollPoint.closing) < 0;
  const hasRisk = Number(model.baseline.summary.reserveShortfall) > 0;
  const receiptOptions = data.input.events.filter(
    (event) => Number(event.amount) > 0,
  );
  const firstRisk = model.baseline.summary.firstRiskDate;
  const riskPoint = model.baseline.points.find(
    (point) => point.date === firstRisk,
  );
  return (
    <div className="page-container space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {organization.name}
          <span className="mx-2 text-border">/</span>
          {formatDate(data.input.asOf, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <Button variant="ghost" disabled={refreshing} onClick={refresh}>
          {refreshing ? <BusyIcon /> : <RefreshCw />}Actualizar datos
        </Button>
      </div>
      <section className="flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div>
          <div
            className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              hasRisk ? "risk-note" : "bg-secondary text-primary",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                hasRisk ? "bg-destructive" : "bg-primary",
              )}
            />
            {hasRisk ? "Hay tiempo para actuar" : "Dentro de tu reserva"}
          </div>
          <h1 className="treasury-heading">
            {payrollRisk
              ? payroll?.category === "payroll"
                ? "Tu nómina necesita un plan."
                : "Tu pago crítico necesita un plan."
              : hasRisk
                ? "Tu reserva necesita atención."
                : "Tu caja tiene margen."}
          </h1>
          <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted-foreground">
            {payrollRisk
              ? `El ${formatDate(payroll?.date ?? data.input.asOf)} el cierre proyectado no alcanza para todos tus pagos. Comparemos cómo llegar.`
              : hasRisk
                ? "Anticipa el punto más ajustado del mes y decide qué acuerdos vale la pena buscar."
                : "Revisa tus compromisos y prueba qué pasaría si un cliente se retrasa."}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border bg-card px-6 py-5 xl:w-[310px] xl:shrink-0">
          <div className="mb-4 flex items-center justify-between gap-4 text-primary">
            <ShieldCheck className="size-6" />
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <LockKeyhole className="size-3" />
              No se mueve
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {payroll
              ? payroll.category === "payroll"
                ? "Próxima nómina"
                : "Próximo pago protegido"
              : "Tu próximo compromiso"}
          </p>
          <p className="treasury-number mt-1 text-[1.9rem]">
            {payroll
              ? money(String(Math.abs(Number(payroll.amount))))
              : "Sin registrar"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {payroll
              ? `${formatDate(payroll.date, { day: "numeric", month: "long" })} · ${payroll.label}`
              : "Agrega nómina y pagos esenciales."}
          </p>
          {!payroll && (
            <Link
              href={`${basePath}/commitments`}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary"
            >
              Registrar compromiso
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </section>

      <section
        className="grid grid-cols-2 gap-x-6 gap-y-5 border-y py-6 lg:grid-cols-4"
        aria-label="Resumen de caja sin cambios"
      >
        <Metric
          label="Disponible hoy"
          value={money(model.input.currentBalance)}
          note="Saldo bancario de referencia"
          icon={<Wallet className="size-4" />}
        />
        <Metric
          label="Saldo mínimo previsto"
          value={money(model.baseline.summary.minimumBalance)}
          note={formatDate(model.baseline.summary.worstDate, {
            day: "numeric",
            month: "long",
          })}
          icon={<ArrowDownRight className="size-4" />}
          risk={Number(model.baseline.summary.minimumBalance) < 0}
        />
        <Metric
          label="Reserva objetivo"
          value={money(model.input.reserve)}
          note="Tu margen de seguridad"
          icon={<ShieldCheck className="size-4" />}
        />
        <Metric
          label="Días bajo tu reserva"
          value={String(model.baseline.summary.daysBelowReserve)}
          note="En los próximos 30 días"
          icon={<CalendarDays className="size-4" />}
        />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section
          className="treasury-surface min-w-0 p-5 sm:p-7"
          aria-labelledby="cash-heading"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="cash-heading"
                className="text-xl font-semibold tracking-tight"
              >
                El camino de tu caja
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lo que entra, lo que sale y el momento de actuar.
              </p>
            </div>
            <span className="rounded-lg bg-muted px-3 py-2 text-xs font-medium">
              30 días · {currency}
            </span>
          </div>
          <TreasuryChart data={model} projected={plan?.projection ?? null} />
          <div
            className={cn(
              "mt-5 flex items-start gap-3 rounded-xl p-4",
              hasRisk ? "risk-note" : "bg-secondary text-primary",
            )}
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <p className="text-sm leading-relaxed">
              {riskPoint ? (
                <>
                  El {formatDate(riskPoint.date)} terminas con{" "}
                  <strong>{money(riskPoint.closing)}</strong>, debajo de tu
                  reserva.{" "}
                  {Number(riskPoint.closing) >= 0
                    ? "Eso reduce tu margen, pero no implica un impago."
                    : "Ese día existe un faltante de efectivo."}
                </>
              ) : (
                "No aparece un faltante en este escenario. Los cobros siguen siendo supuestos hasta recibirlos."
              )}
            </p>
          </div>
          <details className="mt-5 border-t pt-3">
            <summary className="treasury-summary">
              <SlidersHorizontal className="size-4" />
              ¿Y si un cliente paga tarde?
            </summary>
            <div className="mt-3 space-y-3">
              <label
                htmlFor="stress-receipt"
                className="block text-sm text-muted-foreground"
              >
                Retrasa un cobro 7 días. No modifica tus facturas.
              </label>
              <select
                id="stress-receipt"
                className="treasury-select"
                value={stressId}
                onChange={(event) => {
                  setStressId(event.target.value);
                  setSelectedId(null);
                }}
              >
                <option value="">Fechas originales</option>
                {receiptOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.label} · {money(event.amount)}
                  </option>
                ))}
              </select>
              {stressId && (
                <p role="status" className="risk-note rounded-lg p-3 text-sm">
                  {preview.isPending
                    ? "Calculando el atraso… La gráfica aún muestra las fechas originales."
                    : preview.isError
                      ? "No pudimos calcular el atraso. La gráfica muestra las fechas originales. Vuelve a seleccionarlo para reintentar."
                      : "Prueba de estrés activa. Recalculamos los planes; no podrás guardarlos como si fueran el escenario real."}
                </p>
              )}
            </div>
          </details>
        </section>

        <section className="min-w-0" aria-labelledby="plans-heading">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              id="plans-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Tus opciones
            </h2>
            <span className="text-xs text-muted-foreground">
              {model.plans.length} opciones modeladas
            </span>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            Primero cubrimos pagos críticos. Después comparamos faltante, costo
            y esfuerzo.
          </p>
          <fieldset className="space-y-3" aria-label="Comparar planes">
            {model.plans.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={plan?.id === item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "relative w-full overflow-hidden rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/60",
                  plan?.id === item.id &&
                    "border-primary bg-secondary/50 ring-1 ring-primary",
                )}
              >
                {plan?.id === item.id && (
                  <motion.span
                    layoutId="selected-plan-marker"
                    className="absolute inset-y-4 left-0 w-1 rounded-r bg-primary"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: "spring", bounce: 0, duration: 0.3 }
                    }
                  />
                )}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {index === 0
                      ? "Mejor resultado simulado"
                      : `Alternativa ${index + 1}`}
                  </span>
                  {plan?.id === item.id ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-base font-semibold">
                  {item.actions.length === 1
                    ? `${item.actions[0]?.kind === "collect" ? "Cobrar a" : "Acordar con"} ${item.actions[0]?.label}`
                    : "Combinar dos acuerdos"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.actions.length}{" "}
                  {item.actions.length === 1 ? "acción" : "acciones"} · Costo
                  supuesto {money(item.cost)}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    Saldo mínimo con plan
                  </span>
                  <span className="treasury-number text-lg">
                    {money(item.projection.summary.minimumBalance)}
                  </span>
                </div>
              </button>
            ))}
          </fieldset>
          {model.plans.length === 0 && (
            <div className="treasury-surface space-y-3 p-5">
              <CircleOff className="size-6 text-muted-foreground" />
              <p className="font-medium">
                {hasRisk
                  ? "No hay movimientos elegibles"
                  : "No necesitas mover fechas"}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {hasRisk
                  ? "Agrega fechas posibles de cobro o negociación en tus facturas. No inventamos acuerdos ni movemos pagos protegidos."
                  : "Prueba un retraso para explorar qué tan resistente es tu caja."}
              </p>
              <Button asChild variant="outline">
                <Link href={`${basePath}/invoices`}>Revisar facturas</Link>
              </Button>
            </div>
          )}
          {plan && (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => setSelectedId(null)}
            >
              Ver solo escenario sin cambios
            </Button>
          )}
        </section>
      </div>

      {plan && (
        <section
          className="treasury-surface border-primary/35 p-5 sm:p-7"
          aria-labelledby="selected-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                Vista previa · no ejecuta pagos
              </p>
              <h2
                id="selected-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                Un plan, con números claros.
              </h2>
            </div>
            <div className="rounded-xl bg-secondary px-4 py-3 text-primary">
              <p className="text-xs">
                Liquidez adicional aún necesaria para la reserva
              </p>
              <p className="treasury-number mt-1 text-2xl">
                {money(plan.projection.summary.reserveShortfall)}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_290px]">
            <ol className="space-y-5">
              {plan.actions.map((action, index) => (
                <li key={action.id} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">
                      {action.kind === "collect"
                        ? "Solicitar anticipo a"
                        : "Negociar nueva fecha con"}{" "}
                      {action.label}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Mover {money(action.amount)} del {formatDate(action.from)}{" "}
                      al {formatDate(action.to)}. Costo supuesto:{" "}
                      {money(action.cost)}. Requiere aceptación de la
                      contraparte.
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Nómina e impuestos conservan su fecha. El saldo real y las
                facturas no cambian al guardar.
              </p>
              <Button
                className="h-auto min-h-12 w-full whitespace-normal"
                disabled={
                  Boolean(stressId) ||
                  choose.isPending ||
                  !can("recommendation:update")
                }
                onClick={() => choose.mutate(plan)}
              >
                {choose.isPending ? <BusyIcon /> : <FileCheck2 />}
                {decision?.planId === plan.id && !stale
                  ? "Volver a guardar plan"
                  : "Elegir este plan"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {decision && (
        <section
          className="treasury-surface p-5 sm:p-7"
          aria-labelledby="followup-heading"
        >
          <div className="mb-5 flex flex-wrap justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                {isDemo ? "Guardado en esta sesión de demo" : "Plan guardado"}
              </p>
              <h2 id="followup-heading" className="text-xl font-semibold">
                De la decisión al acuerdo
              </h2>
            </div>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" />
              {
                Object.values(decision.steps).filter(
                  (status) => status === "agreed",
                ).length
              }{" "}
              de {decision.plan.actions.length} acuerdos
            </span>
          </div>
          {stale && (
            <p role="status" className="risk-note mb-4 rounded-lg p-3 text-sm">
              Los datos cambiaron desde que guardaste este plan. Conservamos tu
              seguimiento, pero necesitas comparar de nuevo.
            </p>
          )}
          <div className="divide-y">
            {decision.plan.actions.map((action) => (
              <div
                key={action.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      decision.steps[action.id] === "agreed"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold">
                      {action.label} · {money(action.amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Fecha propuesta: {formatDate(action.to)}
                    </p>
                  </div>
                </div>
                <label className="min-w-48 text-xs text-muted-foreground">
                  Estado del acuerdo con {action.label}
                  <select
                    aria-label={`Estado del acuerdo con ${action.label}`}
                    className="treasury-select mt-1"
                    disabled={step.isPending || !can("recommendation:update")}
                    value={decision.steps[action.id] ?? "pending"}
                    onChange={(event) =>
                      step.mutate({
                        actionId: action.id,
                        status: event.target.value as
                          "pending" | "contacted" | "agreed",
                      })
                    }
                  >
                    <option value="pending">Por contactar</option>
                    <option value="contacted">Contacto realizado</option>
                    <option value="agreed">Acuerdo confirmado</option>
                  </select>
                </label>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t pt-4 text-sm leading-relaxed text-muted-foreground">
            Confirmar un acuerdo no confirma un cobro. Cuando ocurra, sincroniza
            el banco y actualiza el saldo pendiente de la factura para
            recalcular.
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="treasury-surface p-5 sm:p-7">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">
            Lo que protegemos
          </h2>
          <div className="space-y-5">
            {model.criticalEvents.length ? (
              model.criticalEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4">
                  <div className="flex min-w-12 flex-col items-center rounded-xl bg-muted p-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.date, { month: "short" })}
                    </span>
                    <span className="numeric text-xl font-semibold">
                      {formatDate(event.date, { day: "numeric" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{event.label}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <LockKeyhole className="size-3" />
                      Fecha protegida
                    </p>
                  </div>
                  <p className="numeric text-sm font-semibold">
                    {money(String(Math.abs(Number(event.amount))))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Registra tu próxima nómina y los pagos que no pueden moverse.
              </p>
            )}
          </div>
          <Link
            href={`${basePath}/commitments`}
            className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            Revisar compromisos
            <ChevronRight className="size-4" />
          </Link>
        </section>
        <section className="treasury-surface p-5 sm:p-7">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">
            Sin esconder el faltante
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Si mantienes todas las fechas, necesitas esta liquidez adicional
            desde el inicio para cubrir el peor momento de los 30 días.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Para no quedar en negativo
              </p>
              <p className="treasury-number mt-2 text-2xl">
                {money(model.baseline.summary.cashShortfall)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Para conservar tu reserva
              </p>
              <p className="treasury-number mt-2 text-2xl">
                {money(model.baseline.summary.reserveShortfall)}
              </p>
            </div>
          </div>
          <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            Son necesidades de liquidez, no una oferta de crédito. Crear una
            reserva en pantalla no agrega dinero a tu cuenta.
          </p>
        </section>
      </div>

      <details
        id="assumptions"
        className="scroll-mt-24 rounded-xl border px-5 py-3"
      >
        <summary className="treasury-summary">
          <CircleHelp className="size-4" />
          Datos, supuestos y límites de este plan
        </summary>
        <div className="space-y-4 pb-3 pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Gasto operativo adicional: {money(data.input.dailyOperatingExpense)}{" "}
            al día. No incluye los compromisos ya registrados. Las fechas son
            supuestos de caja, no probabilidades de cobro.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {model.input.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            <li>
              Exploramos movimientos individuales y parejas sobre hasta 12
              candidatos. Se muestran hasta tres resultados; no es un óptimo
              global ni una garantía de pago.
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link
                href={isDemo ? "#assumptions" : `${basePath}/settings/company`}
              >
                Ajustar reserva y gasto
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#assumptions">Cómo calculamos</Link>
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
  risk = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  risk?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "treasury-number mt-2 break-words text-xl sm:text-2xl",
          risk && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
