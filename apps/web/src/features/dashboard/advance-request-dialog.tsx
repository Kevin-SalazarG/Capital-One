"use client";

import { useState } from "react";
import type {
  Treasury,
  TreasuryAction,
} from "@colchon/treasury/treasury-contract";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Banknote,
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Link2,
  LoaderCircle,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
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
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/class-names";
import { formatDate, formatMoney } from "@/lib/formatters";

type Step = 1 | 2 | 3;
type AmountPreset = "cash-gap" | "reserve-gap" | "custom";
type PaymentMethod = "transfer" | "link";
type ComposeStatus = "idle" | "sending" | "sent" | "error";
type RequestStatus = "sent" | "partial" | "paid";

export type PaymentRequestUpdate = {
  status: RequestStatus;
  requestedAmount: number;
  receivedAmount: number;
  customerEmail: string;
  method: PaymentMethod;
  reference: string | null;
  paymentUrl: string | null;
};

const emailSchema = z.email();

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function amountString(value: number): string {
  return value.toFixed(2);
}

function targetName(label: string): string {
  return label.split(" · ")[0] ?? label;
}

function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value.trim()).success;
}

function buildReference(
  organizationName: string,
  action: TreasuryAction,
): string {
  const organizationPart = slugify(organizationName).slice(0, 8).toUpperCase();
  const datePart = action.to.slice(5).replace("-", "");
  return `COLCHON-${datePart}-${organizationPart}`;
}

function buildDemoPaymentUrl(action: TreasuryAction): string {
  return `https://pago.colchon.mx/demo/${slugify(action.id)}`;
}

function buildCustomerMessage({
  action,
  amount,
  clabe,
  customerName,
  currency,
  method,
  organizationName,
  paymentUrl,
  reference,
}: {
  action: TreasuryAction;
  amount: string;
  clabe: string;
  customerName: string;
  currency: string;
  method: PaymentMethod;
  organizationName: string;
  paymentUrl: string;
  reference: string;
}): string {
  const numericAmount = Number(amount);
  const amountLabel =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? formatMoney(amount, currency)
      : "el monto acordado";
  const greeting = customerName.trim()
    ? `Hola ${customerName.trim()},`
    : "Hola,";
  const paymentInstructions =
    method === "transfer"
      ? [
          "Si les funciona, pueden realizarlo por transferencia SPEI:",
          `CLABE: ${clabe || "[agregar CLABE receptora]"}`,
          `Referencia: ${reference}`,
        ].join("\n")
      : [
          "Si les funciona, pueden cubrirlo desde este link de pago:",
          paymentUrl || "[agregar link de pago]",
        ].join("\n");

  return [
    greeting,
    `Te escribo de ${organizationName} por ${action.label}. Para mantener el avance de la obra, ¿podemos revisar un anticipo parcial de ${amountLabel} antes del ${formatDate(action.to)}?`,
    "No estamos solicitando el total de la estimación; es solo una parte para cubrir los compromisos próximos de la obra.",
    paymentInstructions,
    "Si el monto o la fecha no les funcionan, respóndeme con una alternativa y lo revisamos.",
    "Gracias.",
  ].join("\n\n");
}

function statusLabel(status: RequestStatus): string {
  switch (status) {
    case "sent":
      return "Solicitud enviada";
    case "partial":
      return "Pago parcial recibido";
    case "paid":
      return "Pago recibido";
  }
}

export function AdvanceRequestDialog({
  action,
  data,
  onStatusChange,
  organizationName,
}: {
  action: TreasuryAction;
  data: Treasury;
  onStatusChange?: (next: PaymentRequestUpdate) => void;
  organizationName: string;
}) {
  const { organization, isDemo, can } = useWorkspace();
  const reducedMotion = useReducedMotion();
  const currency = data.input.currency;
  const money = (value: string) => formatMoney(value, currency);
  const maximumAmount = Number(action.amount);
  const cashGap = Math.min(
    maximumAmount,
    Math.max(0, Number(data.baseline.summary.cashShortfall)),
  );
  const reserveGap = Math.min(
    maximumAmount,
    Math.max(0, Number(data.baseline.summary.reserveShortfall)),
  );
  const defaultPreset: Exclude<AmountPreset, "custom"> =
    cashGap > 0 ? "cash-gap" : "reserve-gap";
  const defaultAmount =
    defaultPreset === "cash-gap"
      ? cashGap
      : reserveGap > 0
        ? reserveGap
        : maximumAmount;
  const reference = buildReference(organizationName, action);
  const demoPaymentUrl = buildDemoPaymentUrl(action);
  const defaultCustomerName = targetName(action.label);
  const defaultCustomerEmail = isDemo
    ? `pagos@${slugify(defaultCustomerName)}.mx`
    : "";
  const defaultSubject = `Anticipo parcial para ${action.label} · ${formatDate(action.to)}`;

  const [isOpen, setIsOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [amountPreset, setAmountPreset] = useState<AmountPreset>(defaultPreset);
  const [amount, setAmount] = useState(amountString(defaultAmount));
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [customerEmail, setCustomerEmail] = useState(defaultCustomerEmail);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [clabe, setClabe] = useState(isDemo ? "646180157004123456" : "");
  const [paymentUrl, setPaymentUrl] = useState(isDemo ? demoPaymentUrl : "");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(
    buildCustomerMessage({
      action,
      amount: amountString(defaultAmount),
      clabe: isDemo ? "646180157004123456" : "",
      customerName: defaultCustomerName,
      currency,
      method: "transfer",
      organizationName,
      paymentUrl: demoPaymentUrl,
      reference,
    }),
  );
  const [messageDirty, setMessageDirty] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [composeStatus, setComposeStatus] = useState<ComposeStatus>("idle");
  const [request, setRequest] = useState<PaymentRequestUpdate | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<"transfer" | "link" | null>(
    null,
  );

  const numericAmount = Number(amount);
  const validAmount =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= maximumAmount;
  const validCustomerEmail = isValidEmail(customerEmail);
  const validTransfer = /^\d{18}$/.test(clabe.replace(/\s/g, ""));
  const validPaymentUrl = /^https?:\/\//i.test(paymentUrl.trim());
  const methodReady = method === "transfer" ? validTransfer : validPaymentUrl;
  const readyForStepOne = validAmount && validCustomerEmail;
  const readyToSend =
    readyForStepOne && methodReady && subject.trim() && message.trim();
  const isDirty = composeStatus !== "sent" && (hasEdited || step > 1);

  function refreshGeneratedMessage(
    nextAmount = amount,
    nextMethod = method,
    nextCustomerName = customerName,
    nextClabe = clabe,
    nextPaymentUrl = paymentUrl,
  ): void {
    if (messageDirty) return;
    setMessage(
      buildCustomerMessage({
        action,
        amount: nextAmount,
        clabe: nextClabe,
        customerName: nextCustomerName,
        currency,
        method: nextMethod,
        organizationName,
        paymentUrl: nextPaymentUrl,
        reference,
      }),
    );
  }

  function resetDraft(): void {
    const initialAmount = amountString(defaultAmount);
    const initialClabe = isDemo ? "646180157004123456" : "";
    const initialPaymentUrl = isDemo ? demoPaymentUrl : "";
    setStep(1);
    setAmountPreset(defaultPreset);
    setAmount(initialAmount);
    setCustomerName(defaultCustomerName);
    setCustomerEmail(defaultCustomerEmail);
    setMethod("transfer");
    setClabe(initialClabe);
    setPaymentUrl(initialPaymentUrl);
    setSubject(defaultSubject);
    setMessageDirty(false);
    setMessage(
      buildCustomerMessage({
        action,
        amount: initialAmount,
        clabe: initialClabe,
        customerName: defaultCustomerName,
        currency,
        method: "transfer",
        organizationName,
        paymentUrl: initialPaymentUrl,
        reference,
      }),
    );
    setHasEdited(false);
    setShowValidation(false);
    setComposeStatus("idle");
    setRequest(null);
    setSendError(null);
    setConfirmExit(false);
    setCopiedValue(null);
  }

  function openComposer(): void {
    resetDraft();
    setIsOpen(true);
  }

  function requestClose(): void {
    if (composeStatus === "sending") return;
    if (isDirty) {
      setConfirmExit(true);
      return;
    }
    setConfirmExit(false);
    setIsOpen(false);
  }

  function discardAndClose(): void {
    setConfirmExit(false);
    setIsOpen(false);
  }

  function selectAmountPreset(
    nextPreset: Exclude<AmountPreset, "custom">,
  ): void {
    const nextAmount =
      nextPreset === "cash-gap"
        ? cashGap
        : reserveGap > 0
          ? reserveGap
          : maximumAmount;
    const nextAmountString = amountString(nextAmount);
    setAmountPreset(nextPreset);
    setAmount(nextAmountString);
    setHasEdited(true);
    refreshGeneratedMessage(nextAmountString);
  }

  function handleAmountChange(nextAmount: string): void {
    setAmountPreset("custom");
    setAmount(nextAmount);
    setHasEdited(true);
    refreshGeneratedMessage(nextAmount);
  }

  function handleCustomerNameChange(nextName: string): void {
    setCustomerName(nextName);
    setHasEdited(true);
    refreshGeneratedMessage(amount, method, nextName);
  }

  function handleClabeChange(nextClabe: string): void {
    setClabe(nextClabe);
    setHasEdited(true);
    refreshGeneratedMessage(amount, method, customerName, nextClabe);
  }

  function handlePaymentUrlChange(nextUrl: string): void {
    setPaymentUrl(nextUrl);
    setHasEdited(true);
    refreshGeneratedMessage(amount, method, customerName, clabe, nextUrl);
  }

  function handleMethodChange(nextMethod: PaymentMethod): void {
    setMethod(nextMethod);
    setHasEdited(true);
    refreshGeneratedMessage(amount, nextMethod);
  }

  function nextStep(): void {
    if (step === 1 && !readyForStepOne) {
      setShowValidation(true);
      return;
    }
    if (step === 2 && !methodReady) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setStep((current) => (current === 3 ? current : ((current + 1) as Step)));
  }

  function previousStep(): void {
    setShowValidation(false);
    setStep((current) => (current === 1 ? current : ((current - 1) as Step)));
  }

  async function sendRequest(): Promise<void> {
    if (!readyToSend || composeStatus === "sending") {
      setShowValidation(true);
      return;
    }

    setComposeStatus("sending");
    setSendError(null);
    try {
      if (isDemo) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 650);
        });
      } else {
        await apiRequest(
          `/organizations/${organization.id}/notifications/email`,
          emailDeliverySchema,
          {
            method: "POST",
            body: {
              to: customerEmail.trim(),
              subject: subject.trim(),
              text: message.trim(),
            },
          },
        );
      }
      const nextRequest: PaymentRequestUpdate = {
        status: "sent",
        requestedAmount: numericAmount,
        receivedAmount: 0,
        customerEmail: customerEmail.trim(),
        method,
        reference: method === "transfer" ? reference : null,
        paymentUrl: method === "link" ? paymentUrl.trim() : null,
      };
      setRequest(nextRequest);
      onStatusChange?.(nextRequest);
      setComposeStatus("sent");
      setHasEdited(false);
      setConfirmExit(false);
    } catch (error: unknown) {
      setComposeStatus("error");
      setSendError(errorMessage(error));
    }
  }

  function updateRequestStatus(status: Exclude<RequestStatus, "sent">): void {
    if (!request) return;
    const receivedAmount =
      status === "paid"
        ? request.requestedAmount
        : Math.max(1, Math.round(request.requestedAmount / 2));
    const nextRequest: PaymentRequestUpdate = {
      ...request,
      status,
      receivedAmount,
    };
    setRequest(nextRequest);
    onStatusChange?.(nextRequest);
  }

  async function copyValue(
    value: string,
    kind: "transfer" | "link",
  ): Promise<void> {
    if (!value || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopiedValue(kind);
    toast.success(kind === "transfer" ? "CLABE copiada" : "Link copiado");
    window.setTimeout(() => setCopiedValue(null), 1600);
  }

  const animation = reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" as const };

  return (
    <>
      {can("recommendation:update") || isDemo ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={openComposer}
        >
          <WalletCards aria-hidden="true" />
          Preparar solicitud de anticipo
        </Button>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Tu rol puede consultar esta recomendación, pero no preparar
          solicitudes.
        </p>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(next) => (next ? setIsOpen(true) : requestClose())}
      >
        <DialogContent
          className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton={composeStatus !== "sending" && !confirmExit}
          onEscapeKeyDown={(event) => {
            if (composeStatus === "sending") {
              event.preventDefault();
              return;
            }
            if (isDirty || confirmExit) {
              event.preventDefault();
              setConfirmExit(true);
            }
          }}
          onPointerDownOutside={(event) => {
            if (composeStatus === "sending") {
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
                <WalletCards aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="dashboard-alert-eyebrow">Facilitar el pago</p>
                <DialogTitle className="mt-1 text-xl tracking-[-0.03em]">
                  Prepara un anticipo para {targetName(action.label)}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-[55ch] leading-6">
                  Pide solo lo necesario para proteger la obra. El cliente
                  decide si acepta, cuándo paga y por qué método.
                </DialogDescription>
              </div>
            </div>
            <fieldset
              className="mt-5 grid grid-cols-3 gap-2"
              aria-label="Progreso de la solicitud"
            >
              <legend className="sr-only">Progreso de la solicitud</legend>
              {[
                [1, "Monto"],
                [2, "Cómo pagar"],
                [3, "Revisar"],
              ].map(([number, label]) => {
                const stepNumber = number as Step;
                const active = step === stepNumber;
                const complete = step > stepNumber;
                return (
                  <div
                    key={stepNumber}
                    className={cn(
                      "flex items-center gap-2 border-t pt-2 text-xs font-medium",
                      active || complete
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.68rem]",
                        active || complete
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted",
                      )}
                    >
                      {complete ? (
                        <Check aria-hidden="true" className="size-3.5" />
                      ) : (
                        stepNumber
                      )}
                    </span>
                    {label}
                  </div>
                );
              })}
            </fieldset>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {confirmExit ? (
              <div
                role="alertdialog"
                aria-labelledby="advance-request-exit-title"
                className="flex min-h-64 flex-col justify-center rounded-2xl border border-destructive/20 bg-risk-surface p-5 sm:p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <p className="dashboard-alert-eyebrow mt-5 text-destructive">
                  Salir sin enviar
                </p>
                <h3
                  id="advance-request-exit-title"
                  className="mt-1 text-xl font-semibold tracking-[-0.03em]"
                >
                  ¿Quieres salir de esta solicitud?
                </h3>
                <p className="mt-2 max-w-[48ch] text-sm leading-6 text-muted-foreground">
                  Tus cambios se perderán. La alerta de caja seguirá disponible
                  para que la prepares después.
                </p>
              </div>
            ) : composeStatus === "sent" && request ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center rounded-2xl border border-success/20 bg-secondary/45 p-6 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
                    <CheckCircle2 aria-hidden="true" className="size-6" />
                  </span>
                  <p className="dashboard-alert-eyebrow mt-5 text-success">
                    Solicitud enviada
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Ya le diste una forma concreta de pagar.
                  </h3>
                  <p className="mt-2 max-w-[44ch] text-sm leading-6 text-muted-foreground">
                    El mensaje salió a <strong>{request.customerEmail}</strong>.
                    Ahora la contraparte decide si puede cubrirlo y cuándo.
                  </p>
                </div>
                <PaymentRequestProgress
                  currency={currency}
                  request={request}
                  onMarkPartial={
                    isDemo ? () => updateRequestStatus("partial") : undefined
                  }
                  onMarkPaid={
                    isDemo ? () => updateRequestStatus("paid") : undefined
                  }
                />
                {isDemo && (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Los botones de pago son solo para recorrer el prototipo. En
                    una empresa real, el estado se confirma al sincronizar el
                    banco o al recibir un webhook del proveedor de pagos.
                  </p>
                )}
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reducedMotion ? false : { opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
                  transition={animation}
                >
                  {step === 1 && (
                    <div className="space-y-6">
                      <fieldset>
                        <legend className="text-sm font-semibold">
                          ¿Cuánto quieres solicitar?
                        </legend>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          La estimación pendiente es de {money(action.amount)}.
                          Puedes pedir una parte, no el total.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <AmountOption
                            amount={cashGap}
                            currency={currency}
                            description="Cubre el faltante proyectado"
                            disabled={cashGap <= 0}
                            label="Cubrir el faltante"
                            selected={amountPreset === "cash-gap"}
                            onClick={() => selectAmountPreset("cash-gap")}
                          />
                          <AmountOption
                            amount={reserveGap > 0 ? reserveGap : maximumAmount}
                            currency={currency}
                            description="Protege también tu reserva"
                            label="Conservar la reserva"
                            selected={amountPreset === "reserve-gap"}
                            onClick={() => selectAmountPreset("reserve-gap")}
                          />
                        </div>
                        <div className="mt-3 rounded-2xl border bg-muted/45 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <label
                              htmlFor="advance-request-amount"
                              className="text-sm font-medium"
                            >
                              Otro monto
                            </label>
                            <span className="text-xs text-muted-foreground">
                              Máximo {money(action.amount)}
                            </span>
                          </div>
                          <Input
                            id="advance-request-amount"
                            type="number"
                            min="1"
                            max={maximumAmount}
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            aria-invalid={showValidation && !validAmount}
                            onChange={(event) =>
                              handleAmountChange(event.target.value)
                            }
                            className="mt-2 bg-card text-lg font-semibold tabular-nums"
                          />
                          {showValidation && !validAmount && (
                            <p
                              role="alert"
                              className="mt-2 text-xs text-destructive"
                            >
                              Escribe un monto mayor a cero y no mayor a{" "}
                              {money(action.amount)}.
                            </p>
                          )}
                        </div>
                      </fieldset>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="advance-customer-name"
                            className="dashboard-email-dialog-label block"
                          >
                            Contacto
                          </label>
                          <div className="relative mt-2">
                            <UserRound
                              aria-hidden="true"
                              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                              id="advance-customer-name"
                              value={customerName}
                              onChange={(event) =>
                                handleCustomerNameChange(event.target.value)
                              }
                              className="bg-card pl-10"
                              placeholder="Nombre de la contraparte"
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="advance-customer-email"
                            className="dashboard-email-dialog-label block"
                          >
                            Correo del cliente
                          </label>
                          <div className="relative mt-2">
                            <Mail
                              aria-hidden="true"
                              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                              id="advance-customer-email"
                              type="email"
                              autoComplete="email"
                              value={customerEmail}
                              aria-invalid={
                                showValidation && !validCustomerEmail
                              }
                              onChange={(event) => {
                                setCustomerEmail(event.target.value);
                                setHasEdited(true);
                              }}
                              className="bg-card pl-10"
                              placeholder="pagos@cliente.com"
                            />
                          </div>
                          {showValidation && !validCustomerEmail && (
                            <p
                              role="alert"
                              className="mt-2 text-xs text-destructive"
                            >
                              Escribe un correo válido para enviar la solicitud.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/55 p-4 text-sm text-primary">
                        <ShieldCheck
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        <p className="leading-5">
                          El anticipo es una propuesta negociable. No cambia la
                          factura ni garantiza que el cliente vaya a pagar.
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <fieldset>
                        <legend className="text-sm font-semibold">
                          Elige cómo facilitarle el pago
                        </legend>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Incluiremos la opción elegida dentro del mensaje para
                          que el cliente no tenga que preguntarte cómo pagar.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <PaymentMethodOption
                            description="CLABE y referencia para SPEI"
                            icon={
                              <Banknote aria-hidden="true" className="size-5" />
                            }
                            label="Transferencia SPEI"
                            selected={method === "transfer"}
                            onClick={() => handleMethodChange("transfer")}
                          />
                          <PaymentMethodOption
                            description="Un enlace listo para compartir"
                            icon={
                              <Link2 aria-hidden="true" className="size-5" />
                            }
                            label="Link de pago"
                            selected={method === "link"}
                            onClick={() => handleMethodChange("link")}
                          />
                        </div>
                      </fieldset>

                      {method === "transfer" ? (
                        <div className="space-y-4 rounded-2xl border bg-muted/45 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                Datos para recibir el SPEI
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Usa una cuenta de operación de tu empresa, no la
                                de Colchón.
                              </p>
                            </div>
                            <Banknote
                              aria-hidden="true"
                              className="size-5 text-primary"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="advance-clabe"
                              className="dashboard-email-dialog-label block"
                            >
                              CLABE receptora
                            </label>
                            <div className="mt-2 flex gap-2">
                              <Input
                                id="advance-clabe"
                                inputMode="numeric"
                                maxLength={18}
                                value={clabe}
                                aria-invalid={showValidation && !validTransfer}
                                onChange={(event) =>
                                  handleClabeChange(
                                    event.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 18),
                                  )
                                }
                                className="bg-card font-mono tracking-[0.06em]"
                                placeholder="18 dígitos"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  void copyValue(clabe, "transfer")
                                }
                                disabled={!validTransfer}
                                aria-label="Copiar CLABE"
                              >
                                <Clipboard aria-hidden="true" />
                              </Button>
                            </div>
                            {showValidation && !validTransfer && (
                              <p
                                role="alert"
                                className="mt-2 text-xs text-destructive"
                              >
                                La CLABE debe tener 18 dígitos.
                              </p>
                            )}
                          </div>
                          <div
                            className="flex items-center justify-between gap-3 border-t pt-3 text-sm"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--border) 72%, transparent)",
                            }}
                          >
                            <span className="text-muted-foreground">
                              Referencia sugerida
                            </span>
                            <span className="font-mono font-semibold tracking-[0.04em]">
                              {reference}
                            </span>
                          </div>
                          {copiedValue === "transfer" && (
                            <p role="status" className="text-xs text-success">
                              CLABE copiada al portapapeles.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 rounded-2xl border bg-muted/45 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                Link para pagar
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Pega el link de tu proveedor. Colchón no guarda
                                datos de tarjeta.
                              </p>
                            </div>
                            <Link2
                              aria-hidden="true"
                              className="size-5 text-primary"
                            />
                          </div>
                          <label
                            htmlFor="advance-payment-url"
                            className="dashboard-email-dialog-label block"
                          >
                            Link de pago
                          </label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              id="advance-payment-url"
                              type="url"
                              value={paymentUrl}
                              aria-invalid={showValidation && !validPaymentUrl}
                              onChange={(event) =>
                                handlePaymentUrlChange(event.target.value)
                              }
                              className="bg-card"
                              placeholder="https://tu-proveedor.com/pagar/..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void copyValue(paymentUrl, "link")}
                              disabled={!validPaymentUrl}
                              aria-label="Copiar link de pago"
                            >
                              <Clipboard aria-hidden="true" />
                            </Button>
                          </div>
                          {showValidation && !validPaymentUrl && (
                            <p
                              role="alert"
                              className="text-xs text-destructive"
                            >
                              Agrega un link que empiece con https://.
                            </p>
                          )}
                          {isDemo && (
                            <p className="text-xs leading-5 text-muted-foreground">
                              En la demo usamos un link simulado; en tu empresa
                              debes usar el de tu proveedor.
                            </p>
                          )}
                          {copiedValue === "link" && (
                            <p role="status" className="text-xs text-success">
                              Link copiado al portapapeles.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border bg-muted/45 p-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <SummaryItem
                            label="Cliente"
                            value={customerName || "Sin nombre"}
                          />
                          <SummaryItem
                            label="Solicitas"
                            value={money(amount)}
                          />
                          <SummaryItem
                            label="Antes del"
                            value={formatDate(action.to)}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="advance-request-subject"
                          className="dashboard-email-dialog-label block"
                        >
                          Asunto
                        </label>
                        <Input
                          id="advance-request-subject"
                          value={subject}
                          onChange={(event) => {
                            setSubject(event.target.value);
                            setHasEdited(true);
                          }}
                          className="mt-2 bg-card"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="advance-request-message"
                          className="dashboard-email-dialog-label block"
                        >
                          Mensaje para el cliente
                        </label>
                        <textarea
                          id="advance-request-message"
                          value={message}
                          onChange={(event) => {
                            setMessage(event.target.value);
                            setMessageDirty(true);
                            setHasEdited(true);
                          }}
                          className="mt-2 min-h-64 w-full resize-none rounded-xl border border-input bg-card px-3 py-3 text-sm leading-6 text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          rows={10}
                        />
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Puedes ajustar el texto. La solicitud no cambia la
                          factura ni registra el pago por sí sola.
                        </p>
                      </div>
                      {!readyToSend && showValidation && (
                        <p
                          role="alert"
                          className="rounded-xl border border-destructive/20 bg-risk-surface px-4 py-3 text-sm leading-5 text-destructive"
                        >
                          Revisa el monto, el correo, el método de pago y el
                          mensaje antes de enviarlo.
                        </p>
                      )}
                      {sendError && (
                        <p
                          role="alert"
                          className="rounded-xl border border-destructive/20 bg-risk-surface px-4 py-3 text-sm leading-5 text-destructive"
                        >
                          {sendError}
                        </p>
                      )}
                      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/55 p-4 text-sm text-primary">
                        <Mail
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        <p className="leading-5">
                          Enviaremos a{" "}
                          <strong>
                            {customerEmail || "el correo indicado"}
                          </strong>
                          . La contraparte verá una propuesta clara y tú
                          confirmarás cualquier pago al sincronizar el banco.{" "}
                          {isDemo
                            ? "En esta demo el envío se simula."
                            : "En tu empresa se entrega mediante Resend."}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
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
            ) : composeStatus === "sent" ? (
              <Button type="button" onClick={() => setIsOpen(false)}>
                Cerrar
              </Button>
            ) : (
              <>
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={previousStep}
                  >
                    Atrás
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={requestClose}>
                  Cerrar
                </Button>
                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Continuar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={composeStatus === "sending"}
                    onClick={() => void sendRequest()}
                  >
                    {composeStatus === "sending" ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <Send aria-hidden="true" />
                    )}
                    {composeStatus === "sending"
                      ? "Enviando…"
                      : "Enviar solicitud"}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AmountOption({
  amount,
  currency,
  description,
  disabled = false,
  label,
  onClick,
  selected,
}: {
  amount: number;
  currency: string;
  description: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "relative block min-h-28 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        selected
          ? "border-primary bg-secondary/70 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <input
        type="radio"
        name="advance-amount"
        checked={selected}
        disabled={disabled}
        onChange={() => onClick()}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold">{label}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        </span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border",
          )}
        >
          {selected && <Check aria-hidden="true" className="size-3" />}
        </span>
      </span>
      <span className="mt-4 block text-lg font-semibold tabular-nums tracking-[-0.04em]">
        {formatMoney(amountString(amount), currency)}
      </span>
    </label>
  );
}

function PaymentMethodOption({
  description,
  icon,
  label,
  onClick,
  selected,
}: {
  description: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "relative block min-h-24 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        selected
          ? "border-primary bg-secondary/70 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <input
        type="radio"
        name="advance-method"
        checked={selected}
        onChange={() => onClick()}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary">
          {icon}
        </span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border",
          )}
        >
          {selected && <Check aria-hidden="true" className="size-3" />}
        </span>
      </span>
      <span className="mt-3 block text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
        {description}
      </span>
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function PaymentRequestProgress({
  currency,
  onMarkPaid,
  onMarkPartial,
  request,
}: {
  currency: string;
  onMarkPaid?: () => void;
  onMarkPartial?: () => void;
  request: PaymentRequestUpdate;
}) {
  const money = (value: number) => formatMoney(String(value), currency);
  const activeStep =
    request.status === "paid" ? 3 : request.status === "partial" ? 2 : 1;
  const steps = ["Solicitud enviada", "Pago parcial", "Pago completo"];
  return (
    <div className="dashboard-payment-status" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="dashboard-panel-kicker">Seguimiento de la solicitud</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
            {statusLabel(request.status)}
          </h3>
        </div>
        <span className="dashboard-payment-status-badge">
          {request.status === "paid" ? "Confirmado" : "Pendiente"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((label, index) => {
          const complete = index + 1 <= activeStep;
          return (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 text-xs",
                complete ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  complete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
              >
                {complete ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              {label}
            </div>
          );
        })}
      </div>
      <div
        className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2"
        style={{
          borderColor: "color-mix(in srgb, var(--border) 72%, transparent)",
        }}
      >
        <div>
          <p className="text-xs text-muted-foreground">Solicitado</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {money(request.requestedAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recibido</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-success">
            {money(request.receivedAmount)}
          </p>
        </div>
      </div>
      {(onMarkPartial || onMarkPaid) && request.status !== "paid" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onMarkPartial && request.status === "sent" && (
            <Button type="button" variant="outline" onClick={onMarkPartial}>
              <Banknote aria-hidden="true" />
              Simular pago parcial
            </Button>
          )}
          {onMarkPaid && (
            <Button type="button" variant="secondary" onClick={onMarkPaid}>
              <CheckCircle2 aria-hidden="true" />
              Simular pago completo
            </Button>
          )}
        </div>
      )}
      {request.method === "link" && request.paymentUrl && (
        <a
          href={request.paymentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Abrir link de pago
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      )}
      {request.method === "transfer" && request.reference && (
        <p className="mt-4 text-xs text-muted-foreground">
          Referencia enviada:{" "}
          <span className="font-mono font-semibold">{request.reference}</span>
        </p>
      )}
    </div>
  );
}

export function PaymentRequestStatus({
  currency,
  request,
}: {
  currency: string;
  request: PaymentRequestUpdate;
}) {
  return <PaymentRequestProgress currency={currency} request={request} />;
}
