"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  annualHistorySchema,
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
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusyIcon, EmptyView, ErrorView } from "@/components/feedback";
import {
  AnnualChartSkeleton,
  DashboardSkeleton,
  AnnualHistorySkeleton,
} from "@/components/page-skeletons";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { apiRequest } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/class-names";
import {
  AdvanceRequestDialog,
  PaymentRequestStatus,
  type PaymentRequestUpdate,
} from "./advance-request-dialog";
import { CashAlertEmail } from "./cash-alert-email";

const TreasuryChart = dynamic(
  () => import("./treasury-chart").then((module) => module.TreasuryChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[425px] w-full rounded-xl" />,
  },
);

const AnnualCashChart = dynamic(
  () => import("./annual-cash-chart").then((module) => module.AnnualCashChart),
  {
    ssr: false,
    loading: () => <AnnualChartSkeleton />,
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
  if (query.isPending) return <DashboardSkeleton />;
  if (
    query.error instanceof ApiError &&
    query.error.code === "FORECAST_INPUTS_INCOMPLETE"
  )
    return (
      <div className="page-container">
        <h1 className="page-title mb-8">Primero, pongamos tu caja en orden.</h1>
        <EmptyView
          title="Prepara tu primer plan"
          description="Conecta una cuenta de operación, agrega tus estimaciones y registra la nómina de tu cuadrilla."
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
  return <TreasuryContent data={query.data} />;
}

function TreasuryContent({ data }: { data: Treasury }) {
  const { organization, email, basePath, isDemo, can } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stressId, setStressId] = useState("");
  const [localDecision, setLocalDecision] = useState<TreasuryDecision | null>(
    null,
  );
  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequestUpdate | null>(null);
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
        "No pudimos recuperar la recomendación de esta demo. Puedes guardarla de nuevo.",
      );
    }
  }, [isDemo]);
  const preview = useResource(
    `treasury?delayedReceiptId=${encodeURIComponent(stressId)}`,
    treasurySchema,
    Boolean(stressId),
  );
  const annualHistoryQuery = useResource(
    "treasury-history",
    annualHistorySchema,
    isDemo,
  );
  const model = stressId && preview.data ? preview.data : data;
  const annualHistory = annualHistoryQuery.data?.hasPreviousYear
    ? annualHistoryQuery.data
    : null;
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
        "La recomendación funciona en esta vista, pero tu navegador no permite conservarla al recargar.",
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
          ? "Recomendación guardada en esta demo"
          : "Recomendación guardada para seguimiento",
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
  const recommendedPlan = data.plans[0] ?? null;
  const receivedAdvance = paymentRequest?.receivedAmount ?? 0;
  const adjustedMinimumBalance =
    Number(model.baseline.summary.minimumBalance) + receivedAdvance;
  const adjustedCashShortfall = Math.max(
    0,
    Number(model.baseline.summary.cashShortfall) - receivedAdvance,
  );
  const adjustedReserveShortfall = Math.max(
    0,
    Number(model.baseline.summary.reserveShortfall) - receivedAdvance,
  );
  const adjustedDaysBelowReserve = model.baseline.points.filter(
    (point) =>
      Number(point.closing) + receivedAdvance < Number(model.input.reserve),
  ).length;
  const firstRisk = model.baseline.summary.firstRiskDate;
  const riskPoint = model.baseline.points.find(
    (point) => point.date === firstRisk,
  );
  const adjustedRiskPointClosing = riskPoint
    ? Number(riskPoint.closing) + receivedAdvance
    : null;
  const worstDateLabel = formatDate(model.baseline.summary.worstDate);
  const heroTitle = payrollRisk
    ? payroll?.category === "payroll"
      ? "Protege la nómina antes del faltante."
      : "Protege los pagos de tu obra antes del faltante."
    : hasRisk
      ? "Anticipa el faltante de tu obra."
      : "Conoce el margen de tu obra.";
  const heroDescription = payrollRisk
    ? `La estimación que esperas llega después de la nómina. El ${worstDateLabel} la caja toca su punto más bajo; te avisamos antes para que revises el cobro.`
    : hasRisk
      ? `La proyección muestra cuándo la caja se aprieta. Revisa tus cobros, materiales y pagos protegidos antes del ${worstDateLabel}.`
      : "Comparamos cobros, materiales y pagos protegidos para que conozcas el margen de tu obra durante los próximos 30 días.";
  return (
    <div className="page-container dashboard-page space-y-7 pb-14">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="dashboard-hero-copy">
          <div
            className={cn(
              "dashboard-kicker",
              hasRisk ? "dashboard-kicker-risk" : "dashboard-kicker-safe",
            )}
          >
            <span className="dashboard-kicker-dot" />
            {hasRisk ? "Hay tiempo para actuar" : "Dentro de tu reserva"}
          </div>
          <h1 id="dashboard-title" className="dashboard-hero-title">
            {heroTitle}
          </h1>
          <p className="dashboard-hero-description">{heroDescription}</p>
          <div className="dashboard-hero-links">
            <Link
              href={`${basePath}/commitments`}
              className="dashboard-hero-link"
            >
              Ver pagos protegidos
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="#assumptions" className="dashboard-hero-link">
              Cómo calculamos
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
        <div className="dashboard-payroll-card">
          <div className="dashboard-payroll-topline">
            <span className="dashboard-payroll-icon">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <span className="dashboard-payroll-label">Salida protegida</span>
            <span className="dashboard-payroll-lock">
              <LockKeyhole aria-hidden="true" className="size-3" />
              No se mueve
            </span>
          </div>
          <p className="dashboard-payroll-title">
            {payroll
              ? payroll.category === "payroll"
                ? "Próxima nómina de obra"
                : "Próximo pago de obra"
              : "Tu próximo compromiso de obra"}
          </p>
          <p className="dashboard-payroll-amount">
            {payroll
              ? money(String(Math.abs(Number(payroll.amount))))
              : "Sin registrar"}
          </p>
          <p className="dashboard-payroll-detail">
            {payroll
              ? `${formatDate(payroll.date, { day: "numeric", month: "long" })} · ${payroll.label}`
              : "Agrega nómina de cuadrilla y pagos esenciales."}
          </p>
          <div className="dashboard-payroll-risk">
            <span className="dashboard-payroll-risk-label">
              Peor cierre proyectado
              <br />
              {formatDate(model.baseline.summary.worstDate)}
            </span>
            <span className="dashboard-payroll-risk-value">
              {money(String(adjustedMinimumBalance))}
            </span>
          </div>
          {!payroll && (
            <Link
              href={`${basePath}/commitments`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              Registrar compromiso
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </div>
      </section>

      <section
        className="dashboard-signal-grid"
        aria-label={
          receivedAdvance > 0
            ? "Resumen de caja con pago registrado"
            : "Resumen de caja sin cambios"
        }
      >
        <Metric
          label="Disponible hoy"
          value={money(model.input.currentBalance)}
          note="Saldo bancario de referencia"
          icon={<Wallet className="size-4" />}
        />
        <Metric
          label="Saldo mínimo previsto"
          value={money(String(adjustedMinimumBalance))}
          note={formatDate(model.baseline.summary.worstDate, {
            day: "numeric",
            month: "long",
          })}
          icon={<ArrowDownRight className="size-4" />}
          risk={adjustedMinimumBalance < 0}
        />
        <Metric
          label="Reserva objetivo"
          value={money(model.input.reserve)}
          note="Tu margen de seguridad"
          icon={<ShieldCheck className="size-4" />}
        />
        <Metric
          label="Días bajo tu reserva"
          value={String(adjustedDaysBelowReserve)}
          note="En los próximos 30 días"
          icon={<CalendarDays className="size-4" />}
        />
      </section>

      {hasRisk && (
        <CashAlertEmail
          data={data}
          organizationName={organization.name}
          plan={recommendedPlan}
          recipient={email}
        />
      )}

      <div className="dashboard-workbench">
        <header className="dashboard-workbench-header">
          <div className="min-w-0">
            <p className="dashboard-panel-kicker">Centro de decisiones</p>
            <h2 id="workbench-heading" className="dashboard-workbench-title">
              Mira el riesgo. Elige qué conversar.
            </h2>
            <p className="dashboard-panel-description">
              Primero identifica cuándo se aprieta la caja; después compara las
              conversaciones que pueden proteger tu obra.
            </p>
          </div>
          <span className="dashboard-period shrink-0">
            30 días · {currency}
          </span>
        </header>
        <section
          className="dashboard-chart-panel"
          aria-labelledby="cash-heading"
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="dashboard-panel-kicker">Mapa de caja</p>
              <h3 id="cash-heading" className="dashboard-panel-heading">
                El camino de tu caja
              </h3>
              <p className="dashboard-panel-description">
                Avances que entran, nómina y materiales que salen, y cuándo
                actuar.
              </p>
            </div>
          </div>
          <TreasuryChart
            data={model}
            projected={plan?.projection ?? null}
            cashOffset={receivedAdvance}
          />
          <div
            className={cn(
              "dashboard-chart-insight",
              !hasRisk && "bg-secondary text-secondary-foreground",
            )}
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <p className="text-sm leading-relaxed">
              {riskPoint ? (
                <>
                  El {formatDate(riskPoint.date)} terminas con{" "}
                  <strong>
                    {money(String(adjustedRiskPointClosing ?? 0))}
                  </strong>
                  , debajo de tu reserva.{" "}
                  {receivedAdvance > 0
                    ? "El monto incluye el pago registrado en esta vista; sincroniza el banco para confirmarlo."
                    : Number(riskPoint.closing) >= 0
                      ? "Eso reduce tu margen, pero no implica un impago."
                      : "Ese día existe un faltante de efectivo. El aviso llega antes para que la pyme decida qué hacer."}
                </>
              ) : (
                "No aparece un faltante en este escenario. Los cobros siguen siendo supuestos hasta recibirlos."
              )}
            </p>
          </div>
          <details className="dashboard-disclosure">
            <summary className="treasury-summary">
              <SlidersHorizontal className="size-4" />
              Simular un atraso de estimación
            </summary>
            <div className="dashboard-disclosure-content space-y-3">
              <label
                htmlFor="stress-receipt"
                className="block text-sm text-muted-foreground"
              >
                Mueve una estimación 7 días para medir el impacto. No modifica
                tus facturas.
              </label>
              <select
                id="stress-receipt"
                className="treasury-select"
                value={stressId}
                onChange={(event) => {
                  setStressId(event.target.value);
                  setSelectedId(null);
                  setPaymentRequest(null);
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

        <section
          className="dashboard-plans-panel"
          aria-labelledby="plans-heading"
        >
          <div className="dashboard-plans-header">
            <div>
              <p className="dashboard-panel-kicker">Acciones sugeridas</p>
              <h3 id="plans-heading" className="dashboard-panel-heading">
                Qué puedes revisar
              </h3>
            </div>
            <span className="dashboard-plans-count">
              {model.plans.length === 1
                ? "1 opción"
                : `${model.plans.length} opciones`}
            </span>
          </div>
          <p className="mb-5 max-w-[32ch] text-sm leading-6 text-muted-foreground">
            Ordenadas por cuánto pueden proteger el saldo de tu obra.
          </p>
          <fieldset
            className="dashboard-plan-list"
            aria-label="Comparar planes"
          >
            {model.plans.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={plan?.id === item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setPaymentRequest(null);
                }}
                className={cn(
                  "dashboard-plan-card",
                  plan?.id === item.id && "dashboard-plan-card-selected",
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
                <div className="flex items-center justify-between gap-2">
                  <span className="dashboard-plan-card-label">
                    {index === 0
                      ? "Mejor resultado simulado"
                      : `Alternativa ${index + 1}`}
                  </span>
                  {plan?.id === item.id ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                  ) : (
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  )}
                </div>
                <p className="dashboard-plan-card-title">
                  {item.actions.length === 1
                    ? `${item.actions[0]?.kind === "collect" ? "Revisar anticipo con" : "Negociar con"} ${item.actions[0]?.label}`
                    : "Combinar dos conversaciones"}
                </p>
                <p className="dashboard-plan-card-meta">
                  {item.actions.length}{" "}
                  {item.actions.length === 1 ? "acción" : "acciones"} · Costo
                  supuesto {money(item.cost)}
                </p>
                <div className="dashboard-plan-card-footer">
                  <span className="text-xs text-muted-foreground">
                    Saldo mínimo si ocurre
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
                  ? "No hay recomendaciones calculables"
                  : "No necesitas mover fechas"}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {hasRisk
                  ? "Agrega fechas posibles de cobro o negociación en las facturas de tus obras. No inventamos acuerdos ni movemos pagos protegidos."
                  : "Prueba un atraso para explorar qué tan resistente es la caja de tu obra."}
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
              Ver solo escenario original
            </Button>
          )}
        </section>
      </div>

      {isDemo && annualHistoryQuery.isPending ? (
        <AnnualHistorySkeleton />
      ) : (
        annualHistory && (
          <section
            className="dashboard-annual-card"
            aria-labelledby="annual-history-heading"
          >
            <header className="dashboard-annual-header">
              <div className="min-w-0">
                <p className="dashboard-panel-kicker">Tendencia anual</p>
                <h2
                  id="annual-history-heading"
                  className="dashboard-annual-title"
                >
                  ¿Cómo va tu caja este año?
                </h2>
                <p className="dashboard-panel-description">
                  Compara tu saldo mes a mes con el mismo corte del año pasado.
                </p>
              </div>
              <span className="dashboard-period shrink-0">
                Comparando con {annualHistory.previousYear}
              </span>
            </header>
            <div className="dashboard-annual-body">
              <div className="dashboard-annual-summary">
                <div className="dashboard-annual-summary-item">
                  <p className="dashboard-annual-summary-label">
                    Saldo al corte
                  </p>
                  <p className="dashboard-annual-summary-value">
                    {money(annualHistory.summary.currentBalance)}
                  </p>
                  <p className="dashboard-annual-summary-note">
                    {formatDate(annualHistory.asOf)} · corte parcial
                  </p>
                </div>
                <div className="dashboard-annual-summary-item">
                  <p className="dashboard-annual-summary-label">
                    Frente al año pasado
                  </p>
                  <p
                    className={cn(
                      "dashboard-annual-summary-value",
                      annualHistory.summary.direction === "negative" &&
                        "text-destructive",
                      annualHistory.summary.direction === "flat" &&
                        "text-muted-foreground",
                    )}
                  >
                    {money(annualHistory.summary.difference)}
                  </p>
                  <p className="dashboard-annual-summary-note">
                    {annualHistory.summary.direction === "positive"
                      ? "Más saldo disponible al corte"
                      : annualHistory.summary.direction === "negative"
                        ? "Menos saldo disponible al corte"
                        : "Mismo saldo al corte"}
                  </p>
                </div>
              </div>
              <AnnualCashChart data={annualHistory} />
              <p className="dashboard-annual-source-note">
                {annualHistory.source === "demo"
                  ? "Datos históricos sintéticos para esta demo."
                  : "Comparación basada en movimientos bancarios sincronizados."}
              </p>
            </div>
          </section>
        )
      )}

      {plan && (
        <section
          className="dashboard-selection-panel"
          aria-labelledby="selected-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="dashboard-panel-kicker mb-2">
                Vista previa · no ejecuta pagos
              </p>
              <h2 id="selected-heading" className="dashboard-panel-heading">
                Tu siguiente conversación, con números claros.
              </h2>
            </div>
            <div className="dashboard-selection-summary">
              <p className="text-xs">
                Liquidez adicional aún necesaria para la reserva
              </p>
              <p className="treasury-number mt-1 text-2xl">
                {money(plan.projection.summary.reserveShortfall)}
              </p>
            </div>
          </div>
          <div className="dashboard-selection-actions">
            <ol className="space-y-5">
              {plan.actions.map((action, index) => (
                <li key={action.id} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">
                      {action.kind === "collect"
                        ? "Revisar anticipo de"
                        : "Proponer nueva fecha con"}{" "}
                      {action.label}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {action.kind === "collect"
                        ? `Revisar si puedes recibir hasta ${money(action.amount)} de este cobro antes del ${formatDate(action.to)}.`
                        : `Proponer mover ${money(action.amount)} del ${formatDate(action.from)} al ${formatDate(action.to)}.`}{" "}
                      El monto y la fecha finales dependen de la conversación.
                      Costo supuesto: {money(action.cost)}.
                    </p>
                    <div className="dashboard-action-controls">
                      {action.kind === "collect" ? (
                        <AdvanceRequestDialog
                          action={action}
                          data={data}
                          onStatusChange={setPaymentRequest}
                          organizationName={organization.name}
                        />
                      ) : (
                        <details className="dashboard-action-details">
                          <summary>
                            <SlidersHorizontal
                              aria-hidden="true"
                              className="size-4"
                            />
                            Ver cómo abordarlo
                          </summary>
                          <div className="dashboard-action-details-body">
                            <p>
                              Pide mover este pago del {formatDate(action.from)}{" "}
                              al {formatDate(action.to)} para no hacer coincidir
                              la salida con la nómina. Confirma primero la nueva
                              fecha con el proveedor.
                            </p>
                            <p className="mt-2 font-medium text-foreground">
                              Siguiente paso: contacta a {action.label} y
                              registra la respuesta en el seguimiento.
                            </p>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {paymentRequest && (
              <PaymentRequestStatus
                currency={currency}
                request={paymentRequest}
              />
            )}
            <div className="dashboard-selection-cta">
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Nómina e impuestos conservan su fecha. Guardar solo registra la
                recomendación: el saldo real y las facturas no cambian.
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
                  ? "Volver a guardar recomendación"
                  : "Guardar recomendación"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {decision && (
        <section
          className="dashboard-followup-panel"
          aria-labelledby="followup-heading"
        >
          <div className="mb-5 flex flex-wrap justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                {isDemo
                  ? "Aviso guardado en esta sesión de demo"
                  : "Recomendación guardada"}
              </p>
              <h2 id="followup-heading" className="text-xl font-semibold">
                Después del aviso, tú decides
              </h2>
            </div>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" />
              {
                Object.values(decision.steps).filter(
                  (status) => status === "agreed",
                ).length
              }{" "}
              de {decision.plan.actions.length} seguimientos
            </span>
          </div>
          {stale && (
            <p role="status" className="risk-note mb-4 rounded-lg p-3 text-sm">
              Los datos cambiaron desde que guardaste este plan. Conservamos tu
              seguimiento, pero necesitas comparar de nuevo.
            </p>
          )}
          <div>
            {decision.plan.actions.map((action) => (
              <div key={action.id} className="dashboard-followup-row">
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
                  Seguimiento con {action.label}
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
                    <option value="pending">Por revisar</option>
                    <option value="contacted">Hablé con la contraparte</option>
                    <option value="agreed">Me confirmaron</option>
                  </select>
                </label>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t pt-4 text-sm leading-relaxed text-muted-foreground">
            Marcar una conversación como confirmada no confirma un cobro. Cuando
            ocurra, sincroniza el banco y actualiza el saldo pendiente de la
            factura para recalcular.
          </p>
        </section>
      )}

      <div className="dashboard-bottom-grid">
        <section className="dashboard-bottom-panel">
          <p className="dashboard-panel-kicker">Lo que no se mueve</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
            Pagos de la obra que protegemos
          </h2>
          <div className="mt-6 space-y-5">
            {model.criticalEvents.length ? (
              model.criticalEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4">
                  <div className="dashboard-event-date">
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
                Registra la nómina de tu cuadrilla y los pagos que no pueden
                moverse.
              </p>
            )}
          </div>
          <Link
            href={`${basePath}/commitments`}
            className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            Revisar pagos protegidos
            <ChevronRight className="size-4" />
          </Link>
        </section>
        <section className="dashboard-bottom-panel">
          <p className="dashboard-panel-kicker">El hueco que vemos</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
            La brecha de esta obra
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Si mantienes todas las fechas, necesitas esta liquidez adicional
            desde el inicio para cubrir el peor momento de los próximos 30 días.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Para no quedar en negativo
              </p>
              <p className="treasury-number mt-2 text-2xl">
                {money(String(adjustedCashShortfall))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Para conservar tu reserva
              </p>
              <p className="treasury-number mt-2 text-2xl">
                {money(String(adjustedReserveShortfall))}
              </p>
            </div>
          </div>
          <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            Es una necesidad de liquidez, no una oferta de crédito. Crear una
            reserva en pantalla no agrega dinero a tu cuenta; la recomendación
            solo te da tiempo para gestionar la obra.
          </p>
        </section>
      </div>

      <details id="assumptions" className="dashboard-assumptions">
        <summary className="treasury-summary">
          <CircleHelp className="size-4" />
          Datos, supuestos y límites de este plan
        </summary>
        <div className="space-y-4 pb-3 pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Este escenario representa una constructora pequeña: cobros por
            estimaciones de obra, nómina de cuadrilla y pagos de materiales.{" "}
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
    <div className={cn("dashboard-metric", risk && "dashboard-metric-risk")}>
      <p className="dashboard-metric-label">
        <span className="dashboard-metric-icon">{icon}</span>
        {label}
      </p>
      <p className="dashboard-metric-value">{value}</p>
      <p className="dashboard-metric-note">{note}</p>
    </div>
  );
}
