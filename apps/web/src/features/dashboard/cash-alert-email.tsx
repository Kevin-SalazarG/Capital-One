import type {
  Treasury,
  TreasuryPlan,
} from "@colchon/treasury/treasury-contract";
import { ExternalLink, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/formatters";

export function CashAlertEmail({
  data,
  organizationName,
  plan,
  recipient,
}: {
  data: Treasury;
  organizationName: string;
  plan: TreasuryPlan | null;
  recipient: string | null;
}) {
  const currency = data.input.currency;
  const money = (value: string) => formatMoney(value, currency);
  const riskDate = data.baseline.summary.worstDate;
  const firstRiskDate = data.baseline.summary.firstRiskDate ?? riskDate;
  const action = plan?.actions[0];
  const actionDate = action?.to ?? firstRiskDate;
  const protectedPayment =
    data.criticalEvents.find((event) => event.category === "payroll") ??
    data.criticalEvents[0];
  const recipientLabel = recipient ?? "responsable de caja";
  const recommendation = action
    ? action.kind === "collect"
      ? `Revisar un anticipo de la estimación con ${action.label}. Hay ${money(action.amount)} pendientes en ese cobro.`
      : `Hablar con ${action.label} para mover ${money(action.amount)} de su pago.`
    : "Revisar los cobros pendientes y los pagos de la obra antes del primer día de riesgo.";
  const subject = `Colchón: posible faltante el ${formatDate(riskDate)}`;
  const body = [
    `Hola,`,
    `Detectamos que ${organizationName} podría tener un faltante de ${money(data.baseline.summary.cashShortfall)} el ${formatDate(riskDate)}. El punto de presión está relacionado con ${protectedPayment?.label ?? "un pago crítico"}.`,
    `Te recomendamos actuar antes del ${formatDate(actionDate)}: ${recommendation}`,
    "Esta recomendación no contacta a tus clientes ni ejecuta pagos. Tú decides qué hacer y después puedes sincronizar el banco para confirmar el resultado.",
    "Ver el plan completo en Colchón.",
  ].join("\n\n");
  const mailto = recipient
    ? `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <section
      className="treasury-surface overflow-hidden border-chart-1/30"
      aria-labelledby="cash-alert-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-muted/45 px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
            <Mail aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-chart-1">
              Alerta para la pyme
            </p>
            <h2
              id="cash-alert-heading"
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              El aviso llega antes del faltante
            </h2>
          </div>
        </div>
        <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Para: {recipientLabel}
        </span>
      </div>
      <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>De: Colchón</span>
            <span>Asunto: {subject}</span>
          </div>
          <h3 className="mt-4 max-w-[32ch] text-xl font-semibold tracking-tight">
            Una estimación retrasada puede apretar la caja de tu obra.
          </h3>
          <p className="mt-3 max-w-[66ch] text-sm leading-relaxed text-muted-foreground">
            Detectamos un faltante proyectado de{" "}
            <strong className="font-semibold text-foreground">
              {money(data.baseline.summary.cashShortfall)}
            </strong>{" "}
            el {formatDate(riskDate)}. El correo explica qué pago provoca la
            presión y qué puedes revisar antes de que llegue la fecha.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldAlert aria-hidden="true" className="size-4" />
                Faltante posible
              </p>
              <p className="treasury-number mt-2 text-xl text-destructive">
                {money(data.baseline.summary.cashShortfall)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Peor cierre: {formatDate(riskDate)}
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">
                Último día para revisar
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight">
                {formatDate(actionDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Antes de la presión sobre la nómina
              </p>
            </div>
          </div>
        </div>
        <aside className="flex min-w-0 flex-col rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Recomendación prioritaria
          </p>
          <p className="mt-3 text-sm font-semibold leading-relaxed">
            {recommendation}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            La pyme contacta a la contraparte. Colchón no promete el pago ni
            modifica la factura.
          </p>
          <div className="mt-5 border-t pt-4">
            {mailto ? (
              <Button asChild variant="outline" className="w-full">
                <a href={mailto}>
                  <ExternalLink aria-hidden="true" />
                  Abrir borrador
                </a>
              </Button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Agrega el correo del responsable de caja para abrir este aviso.
              </p>
            )}
            <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
              En esta demo se abre el correo para que tú lo apruebes; no se
              envía automáticamente.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
