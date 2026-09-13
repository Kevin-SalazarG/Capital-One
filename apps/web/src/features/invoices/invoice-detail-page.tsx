"use client";

import type { ReactNode } from "react";
import { z } from "zod";
import Link from "next/link";
import { CalendarDays, CircleDollarSign, ReceiptText } from "lucide-react";
import { EmptyView, ErrorView } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { InvoiceDetailSkeleton } from "@/components/page-skeletons";
import { PermissionGate } from "@/features/workspace/permission-gate";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { invoiceSchema, type Invoice } from "@/lib/api/contracts";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/class-names";
import { InvoicePaymentStatus } from "@/features/invoices/invoice-payment-status";
import { InvoicePlanningForm } from "@/features/invoices/invoice-planning-form";

function invoiceName(invoice: Invoice) {
  return (
    invoice.counterpartyName ??
    (invoice.direction === "receivable"
      ? invoice.receiverRfc
      : invoice.issuerRfc)
  );
}

function directionLabel(direction: Invoice["direction"]) {
  return direction === "receivable" ? "Cobro" : "Pago";
}

function DetailMetric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "numeric text-right text-sm",
          emphasis ? "font-semibold text-foreground" : "text-foreground/90",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailItem({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0 border-t pt-4", wide && "sm:col-span-2")}>
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function InvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  return (
    <PermissionGate permission="cfdi:read">
      <InvoiceDetailContent invoiceId={invoiceId} />
    </PermissionGate>
  );
}

function InvoiceDetailContent({ invoiceId }: { invoiceId: string }) {
  const { basePath, organization } = useWorkspace();
  const backHref = `${basePath}/invoices`;
  const invoices = useResource("invoices?limit=500", z.array(invoiceSchema));

  if (invoices.isPending) return <InvoiceDetailSkeleton />;

  if (invoices.isError) {
    return (
      <div className="page-container">
        <div>
          <ErrorView
            error={invoices.error}
            retry={() => void invoices.refetch()}
          />
        </div>
      </div>
    );
  }

  const invoice = invoices.data.find((item) => item.id === invoiceId);
  if (!invoice) {
    return (
      <div className="page-container">
        <div>
          <EmptyView
            title="No encontramos esta factura"
            description="Puede que el registro ya no esté disponible o que el enlace haya expirado."
          >
            <Button asChild variant="outline">
              <Link href={backHref}>Ver facturas</Link>
            </Button>
          </EmptyView>
        </div>
      </div>
    );
  }

  const name = invoiceName(invoice);
  const dueLabel = invoice.dueOn
    ? formatDate(invoice.dueOn, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: organization.timeZone,
      })
    : "Sin fecha";
  const issuedLabel = formatDate(invoice.issuedAt, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: organization.timeZone,
  });
  const isSettled = Number(invoice.outstandingAmount) === 0;

  return (
    <div className="page-container max-w-6xl">
      <div>
        <header className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Factura · {directionLabel(invoice.direction)}
            </p>
            <h1 className="page-title mt-2 break-words">{name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Información recibida de tu fuente de facturas.
            </p>
          </div>
          <InvoicePaymentStatus
            invoice={invoice}
            className="self-start sm:self-auto"
          />
        </header>

        <InvoicePlanningForm key={invoice.id} invoice={invoice} />
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
          <section
            aria-labelledby="invoice-balance-heading"
            className="relative overflow-hidden rounded-xl border border-primary/10 bg-primary p-6 text-primary-foreground shadow-sm md:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 size-64 rounded-full bg-white/5 blur-2xl"
            />
            <div className="relative flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <h2
                  id="invoice-balance-heading"
                  className="text-sm font-medium text-primary-foreground/75"
                >
                  Saldo pendiente
                </h2>
                <p className="numeric mt-3 break-words text-3xl font-semibold tracking-tight md:text-[2.75rem]">
                  {formatMoney(invoice.outstandingAmount, invoice.currency)}
                </p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
                  {isSettled
                    ? "Esta factura está liquidada."
                    : invoice.dueOn
                      ? `Vence el ${dueLabel}.`
                      : "No tiene una fecha de vencimiento."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-52 sm:grid-cols-1">
                <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-primary-foreground/70"
                  />
                  <p className="mt-3 text-xs text-primary-foreground/70">
                    Vencimiento
                  </p>
                  <p className="mt-1 text-sm font-medium">{dueLabel}</p>
                </div>
                <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3">
                  <CircleDollarSign
                    aria-hidden="true"
                    className="size-4 text-primary-foreground/70"
                  />
                  <p className="mt-3 text-xs text-primary-foreground/70">
                    Tipo de movimiento
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {directionLabel(invoice.direction)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            className="panel p-6 md:p-7"
            aria-labelledby="summary-heading"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <ReceiptText aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 id="summary-heading" className="font-semibold">
                  Resumen financiero
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Montos de esta factura
                </p>
              </div>
            </div>
            <dl className="mt-7 divide-y">
              <DetailMetric
                label="Total"
                value={formatMoney(invoice.totalAmount, invoice.currency)}
              />
              <DetailMetric
                label="Pendiente"
                value={formatMoney(invoice.outstandingAmount, invoice.currency)}
                emphasis
              />
              <DetailMetric label="Moneda" value={invoice.currency} />
            </dl>
          </section>
        </div>

        <section
          className="panel mt-4 p-6 md:p-8"
          aria-labelledby="invoice-data-heading"
        >
          <div>
            <h2 id="invoice-data-heading" className="font-semibold">
              Datos de la factura
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Identificación y fechas del comprobante.
            </p>
          </div>
          <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <DetailItem label="Folio" wide>
              <span className="break-all">{invoice.cfdiUuid}</span>
            </DetailItem>
            <DetailItem label="Emisor">{invoice.issuerRfc}</DetailItem>
            <DetailItem label="Receptor">{invoice.receiverRfc}</DetailItem>
            <DetailItem label="Emitida">{issuedLabel}</DetailItem>
            <DetailItem label="Vence">{dueLabel}</DetailItem>
          </dl>
        </section>
      </div>
    </div>
  );
}
