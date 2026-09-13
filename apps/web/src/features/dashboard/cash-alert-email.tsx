"use client";

import { useState } from "react";
import type {
  Treasury,
  TreasuryPlan,
} from "@colchon/treasury/treasury-contract";
import {
  CheckCircle2,
  LoaderCircle,
  Mail,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/features/workspace/workspace";
import { apiRequest } from "@/lib/api/client";
import { emailDeliverySchema } from "@/lib/api/contracts";
import { cn } from "@/lib/class-names";
import { errorMessage } from "@/lib/api/errors";
import { formatDate, formatMoney } from "@/lib/formatters";

type SendStatus = "idle" | "sending" | "sent" | "error";

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
  const { organization, isDemo, can } = useWorkspace();
  const currency = data.input.currency;
  const money = (value: string) => formatMoney(value, currency);
  const riskDate = data.baseline.summary.worstDate;
  const firstRiskDate = data.baseline.summary.firstRiskDate ?? riskDate;
  const action = plan?.actions[0];
  const actionDate = action?.to ?? firstRiskDate;
  const protectedPayment =
    data.criticalEvents.find((event) => event.category === "payroll") ??
    data.criticalEvents[0];
  const protectedPaymentPoint = protectedPayment
    ? data.baseline.points.find((point) => point.date === protectedPayment.date)
    : null;
  const protectedPaymentTitle =
    protectedPayment?.category === "payroll"
      ? "Saldo después de la nómina"
      : "Saldo después del pago";
  const recipientLabel = recipient ?? "responsable de caja";
  const recommendation = action
    ? action.kind === "collect"
      ? `Revisar anticipo con ${action.label}. Hay ${money(action.amount)} pendientes.`
      : `Hablar con ${action.label} para mover ${money(action.amount)}.`
    : "Revisar los cobros pendientes y los pagos de la obra antes del primer día de riesgo.";
  const subject = `Colchón: posible faltante el ${formatDate(riskDate)}`;
  const body = [
    "Hola,",
    `Detectamos que ${organizationName} podría tener un faltante de ${money(data.baseline.summary.cashShortfall)} el ${formatDate(riskDate)}. El punto de presión está relacionado con ${protectedPayment?.label ?? "un pago crítico"}.`,
    `Te recomendamos actuar antes del ${formatDate(actionDate)}: ${recommendation}`,
    "Esta recomendación no contacta a tus clientes ni ejecuta pagos. Tú decides qué hacer y después puedes sincronizar el banco para confirmar el resultado.",
    "Ver el plan completo en Colchón.",
  ].join("\n\n");
  const [isOpen, setIsOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [editableSubject, setEditableSubject] = useState(subject);
  const [editableBody, setEditableBody] = useState(body);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const hasSendPermission = isDemo || can("recommendation:update");
  const isDirty =
    sendStatus !== "sent" &&
    (editableSubject !== subject || editableBody !== body);

  function openComposer(): void {
    setEditableSubject(subject);
    setEditableBody(body);
    setConfirmExit(false);
    setSendStatus("idle");
    setSendError(null);
    setIsOpen(true);
  }

  function requestClose(): void {
    if (sendStatus === "sending") return;
    if (isDirty) {
      setConfirmExit(true);
      return;
    }
    setConfirmExit(false);
    setIsOpen(false);
  }

  function discardAndClose(): void {
    setEditableSubject(subject);
    setEditableBody(body);
    setConfirmExit(false);
    setSendStatus("idle");
    setSendError(null);
    setIsOpen(false);
  }

  async function sendEmail(): Promise<void> {
    const trimmedSubject = editableSubject.trim();
    const trimmedBody = editableBody.trim();
    if (
      !recipient ||
      !hasSendPermission ||
      !trimmedSubject ||
      !trimmedBody ||
      sendStatus === "sending"
    ) {
      return;
    }

    setSendStatus("sending");
    setSendError(null);
    try {
      if (isDemo) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 450);
        });
      } else {
        await apiRequest(
          `/organizations/${organization.id}/notifications/email`,
          emailDeliverySchema,
          {
            method: "POST",
            body: {
              to: recipient,
              subject: trimmedSubject,
              text: trimmedBody,
            },
          },
        );
      }
      setSendStatus("sent");
      setConfirmExit(false);
    } catch (error: unknown) {
      setSendStatus("error");
      setSendError(errorMessage(error));
    }
  }

  return (
    <section
      className="dashboard-alert-card"
      aria-labelledby="cash-alert-heading"
    >
      <div className="dashboard-alert-header">
        <div className="flex min-w-0 items-start gap-3">
          <span className="dashboard-alert-icon">
            <Mail aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="dashboard-alert-eyebrow">Alerta para la pyme</p>
            <h2 id="cash-alert-heading" className="dashboard-alert-title">
              El aviso llega antes del faltante
            </h2>
          </div>
        </div>
        <span className="dashboard-alert-recipient">
          Para: {recipientLabel}
        </span>
      </div>
      <div className="dashboard-alert-body">
        <div className="dashboard-alert-main">
          <div className="dashboard-alert-meta">
            <span>De: Colchón</span>
            <span>Asunto: {subject}</span>
          </div>
          <h3 className="dashboard-alert-headline">
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
          <div className="dashboard-alert-stats sm:grid-cols-3">
            {protectedPayment && protectedPaymentPoint && (
              <div className="dashboard-alert-stat">
                <p className="text-xs text-muted-foreground">
                  {protectedPaymentTitle}
                </p>
                <p
                  className={cn(
                    "dashboard-alert-stat-value",
                    Number(protectedPaymentPoint.closing) < 0 &&
                      "text-destructive",
                  )}
                >
                  {money(protectedPaymentPoint.closing)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(protectedPayment.date)} · cierre del día
                </p>
              </div>
            )}
            <div className="dashboard-alert-stat">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldAlert aria-hidden="true" className="size-4" />
                Faltante posible
              </p>
              <p className="dashboard-alert-stat-value text-destructive">
                {money(data.baseline.summary.cashShortfall)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Peor cierre: {formatDate(riskDate)}
              </p>
            </div>
            <div className="dashboard-alert-stat">
              <p className="text-xs text-muted-foreground">
                Último día para revisar
              </p>
              <p className="dashboard-alert-stat-value">
                {formatDate(actionDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Antes de la presión sobre la nómina
              </p>
            </div>
          </div>
        </div>
        <aside className="dashboard-alert-aside">
          <p className="dashboard-alert-aside-label">
            Recomendación prioritaria
          </p>
          <p className="dashboard-alert-recommendation">{recommendation}</p>
          <p className="dashboard-alert-disclaimer">
            La pyme contacta a la contraparte; Colchón no modifica la factura.
          </p>
          <div className="dashboard-alert-cta">
            {recipient && hasSendPermission ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={openComposer}
              >
                <Mail aria-hidden="true" />
                Revisar y enviar
              </Button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {!recipient
                  ? "Agrega el correo del responsable de caja para preparar este aviso."
                  : "Tu rol puede consultar el plan, pero no enviar avisos."}
              </p>
            )}
            <p className="dashboard-alert-footnote">
              Revisa el mensaje antes de enviarlo.
            </p>
          </div>
        </aside>
      </div>
      <Dialog
        open={isOpen}
        onOpenChange={(next) => (next ? setIsOpen(true) : requestClose())}
      >
        <DialogContent
          className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton={sendStatus !== "sending" && !confirmExit}
          onEscapeKeyDown={(event) => {
            if (sendStatus === "sending") {
              event.preventDefault();
              return;
            }
            if (isDirty || confirmExit) {
              event.preventDefault();
              setConfirmExit(true);
            }
          }}
          onPointerDownOutside={(event) => {
            if (sendStatus === "sending") {
              event.preventDefault();
              return;
            }
            if (isDirty || confirmExit) {
              event.preventDefault();
              setConfirmExit(true);
            }
          }}
        >
          <div className="shrink-0 border-b px-5 py-5 pr-16 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="dashboard-email-dialog-icon">
                <Mail aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="dashboard-alert-eyebrow">Aviso para la pyme</p>
                <DialogTitle className="mt-1 text-xl tracking-[-0.03em]">
                  Revisa el correo antes de enviarlo
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-[54ch] leading-6">
                  El mensaje ya incluye el faltante, la fecha de presión y la
                  recomendación prioritaria de tu plan.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {confirmExit ? (
              <div
                role="alertdialog"
                aria-labelledby="cash-alert-exit-title"
                className="flex min-h-64 flex-col justify-center rounded-2xl border border-destructive/20 bg-risk-surface p-5 sm:p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <ShieldAlert aria-hidden="true" className="size-5" />
                </span>
                <p className="dashboard-alert-eyebrow mt-5 text-destructive">
                  Salir sin enviar
                </p>
                <h3
                  id="cash-alert-exit-title"
                  className="mt-1 text-xl font-semibold tracking-[-0.03em]"
                >
                  ¿Quieres salir sin enviar este correo?
                </h3>
                <p className="mt-2 max-w-[48ch] text-sm leading-6 text-muted-foreground">
                  Los cambios del asunto y del mensaje se perderán. El aviso
                  seguirá disponible si decides volver a revisarlo.
                </p>
              </div>
            ) : sendStatus === "sent" ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-success/20 bg-secondary/45 p-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
                  <CheckCircle2 aria-hidden="true" className="size-6" />
                </span>
                <p className="dashboard-alert-eyebrow mt-5 text-success">
                  Correo enviado
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                  El aviso ya salió.
                </h3>
                <p className="mt-2 max-w-[44ch] text-sm leading-6 text-muted-foreground">
                  Se envió a <strong>{recipientLabel}</strong> con el asunto que
                  revisaste.
                </p>
                {isDemo && (
                  <p className="mt-4 max-w-[48ch] text-xs leading-5 text-muted-foreground">
                    En esta demo simulamos el envío. En tu empresa se entrega
                    mediante Resend.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b pb-4">
                    <span className="dashboard-email-dialog-label">Para</span>
                    <span className="break-all text-sm font-semibold text-foreground">
                      {recipientLabel}
                    </span>
                  </div>
                  <div>
                    <label
                      htmlFor="cash-alert-subject"
                      className="dashboard-email-dialog-label block"
                    >
                      Asunto
                    </label>
                    <Input
                      id="cash-alert-subject"
                      value={editableSubject}
                      onChange={(event) =>
                        setEditableSubject(event.target.value)
                      }
                      className="mt-2 bg-card"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cash-alert-body"
                    className="dashboard-email-dialog-label block"
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="cash-alert-body"
                    value={editableBody}
                    onChange={(event) => setEditableBody(event.target.value)}
                    className="mt-2 min-h-56 w-full resize-none rounded-xl border border-input bg-card px-3 py-3 text-sm leading-6 text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    rows={9}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Puedes ajustar el texto antes de enviarlo. No se cambia la
                    factura ni se confirma que el cliente vaya a pagar.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/55 p-4 text-sm text-primary">
                  <ShieldAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <p className="leading-5">
                    {isDemo
                      ? "En esta demo el envío se simula. En tu empresa, Colchón mandará el mensaje mediante Resend."
                      : "Al presionar “Enviar correo”, Colchón mandará este mensaje al responsable de caja."}
                  </p>
                </div>

                {sendError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-risk-surface px-4 py-3 text-sm leading-5 text-destructive"
                  >
                    {sendError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/35 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {confirmExit ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmExit(false)}
                >
                  Seguir editando
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={discardAndClose}
                >
                  Salir sin enviar
                </Button>
              </>
            ) : sendStatus === "sent" ? (
              <Button type="button" onClick={() => setIsOpen(false)}>
                Cerrar
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={requestClose}>
                  Cerrar
                </Button>
                <Button
                  type="button"
                  disabled={
                    !recipient ||
                    !hasSendPermission ||
                    !editableSubject.trim() ||
                    !editableBody.trim() ||
                    sendStatus === "sending"
                  }
                  onClick={() => void sendEmail()}
                >
                  {sendStatus === "sending" ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                  {sendStatus === "sending" ? "Enviando…" : "Enviar correo"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
