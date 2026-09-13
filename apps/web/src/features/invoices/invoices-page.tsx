"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  FileText,
  Search,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { DataList } from "@/components/data-list";
import { EmptyView, ErrorView } from "@/components/feedback";
import { InvoicesTableSkeleton } from "@/components/page-skeletons";
import { PermissionGate } from "@/features/workspace/permission-gate";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { useListFilters } from "@/features/workspace/use-list-filters";
import { invoiceSchema, type Invoice } from "@/lib/api/contracts";
import { formatDate, formatMoney, PAYMENT_LABELS } from "@/lib/formatters";
import { filterInvoices } from "@/features/invoices/invoice-filters";
import { ImportDialog } from "@/features/invoices/import-dialog";
import { InvoiceFilterMenu } from "@/features/invoices/invoice-filter-menu";
import { InvoicePaymentStatus } from "@/features/invoices/invoice-payment-status";

export function InvoicesPage() {
  return (
    <PermissionGate permission="cfdi:read">
      <InvoicesContent />
    </PermissionGate>
  );
}

function InvoicesContent() {
  const { can, isDemo, basePath, organization } = useWorkspace();
  const filters = useListFilters();
  const direction = ["receivable", "payable"].includes(filters.get("direction"))
    ? filters.get("direction")
    : "";
  const status = Object.hasOwn(PAYMENT_LABELS, filters.get("status"))
    ? filters.get("status")
    : "";
  const query = new URLSearchParams({
    limit: "500",
    ...(direction ? { direction } : {}),
    ...(status ? { paymentStatus: status } : {}),
  });
  const invoices = useResource(`invoices?${query}`, z.array(invoiceSchema));
  const [importing, setImporting] = useState(false);
  const rows = filterInvoices(invoices.data ?? [], {
    direction,
    status,
    search: filters.get("q"),
    sort: filters.get("sort"),
  });
  const allInvoices = invoices.data ?? [];
  const outstandingInvoices = allInvoices.filter(
    (invoice) =>
      invoice.paymentStatus !== "paid" && invoice.paymentStatus !== "cancelled",
  );
  const totalOutstanding = outstandingInvoices
    .reduce((total, invoice) => total + Number(invoice.outstandingAmount), 0)
    .toFixed(2);
  const receivableOutstanding = outstandingInvoices
    .filter((invoice) => invoice.direction === "receivable")
    .reduce((total, invoice) => total + Number(invoice.outstandingAmount), 0)
    .toFixed(2);
  const payableOutstanding = outstandingInvoices
    .filter((invoice) => invoice.direction === "payable")
    .reduce((total, invoice) => total + Number(invoice.outstandingAmount), 0)
    .toFixed(2);
  const overdueCount = outstandingInvoices.filter(
    (invoice) => invoice.paymentStatus === "overdue",
  ).length;
  const nextDueInvoice = [...outstandingInvoices]
    .filter((invoice) => invoice.dueOn)
    .toSorted((left, right) =>
      (left.dueOn ?? "").localeCompare(right.dueOn ?? ""),
    )[0];
  // The link's hit area spans its relative table row or mobile card.
  const name = (invoice: Invoice) => {
    const label =
      invoice.counterpartyName ??
      (invoice.direction === "receivable"
        ? invoice.receiverRfc
        : invoice.issuerRfc);
    return (
      <Link
        href={`${basePath}/invoices/${invoice.id}`}
        data-row-action
        aria-label={`Ver detalle de ${label}`}
        className="min-h-11 w-full cursor-pointer touch-manipulation break-words text-left text-sm font-semibold text-foreground outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="page-container dashboard-page invoices-page space-y-7 pb-14">
      <section
        className="dashboard-hero invoices-hero"
        aria-labelledby="invoices-title"
      >
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker dashboard-kicker-safe">
            <FileText aria-hidden="true" className="size-4" />
            Control de facturas
          </div>
          <h1
            id="invoices-title"
            className="dashboard-hero-title invoices-hero-title"
          >
            Avances, materiales y pagos.
          </h1>
          <p className="dashboard-hero-description">
            Estimaciones por cobrar, proveedores y saldos pendientes de tus
            obras, en un solo lugar.
          </p>
          <div className="dashboard-hero-links">
            <a href="#invoice-list" className="dashboard-hero-link">
              Ver facturas
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            {can("cfdi:import") && (
              <Button
                disabled={isDemo}
                variant="outline"
                className="invoices-import-button"
                onClick={() => setImporting(true)}
              >
                <Upload />
                Importar facturas
              </Button>
            )}
          </div>
        </div>
        <div className="dashboard-payroll-card invoices-summary-card">
          <div className="dashboard-payroll-topline">
            <span className="dashboard-payroll-icon">
              <FileText aria-hidden="true" className="size-5" />
            </span>
            <span className="dashboard-payroll-label">Cartera pendiente</span>
            <span className="invoices-summary-status">
              <span aria-hidden="true" />
              {isDemo ? "Datos de ejemplo" : "Actualizada"}
            </span>
          </div>
          <p className="dashboard-payroll-title">Pendiente total</p>
          <p className="dashboard-payroll-amount">
            {invoices.isPending
              ? "—"
              : formatMoney(totalOutstanding, organization.currency)}
          </p>
          <p className="dashboard-payroll-detail invoices-summary-detail">
            {invoices.isPending
              ? "Cargando facturas"
              : outstandingInvoices.length +
                " pendientes · " +
                outstandingInvoices.filter(
                  (invoice) => invoice.direction === "receivable",
                ).length +
                " por cobrar"}
          </p>
          <div className="dashboard-payroll-risk invoices-summary-risk">
            <div>
              <p className="dashboard-payroll-risk-label">
                Próximo vencimiento
              </p>
              <p className="invoices-summary-next">
                {nextDueInvoice?.dueOn
                  ? formatDate(nextDueInvoice.dueOn)
                  : "Sin fecha"}
              </p>
            </div>
            <p className="invoices-summary-next numeric">
              {nextDueInvoice
                ? formatMoney(
                    nextDueInvoice.outstandingAmount,
                    nextDueInvoice.currency,
                  )
                : "—"}
            </p>
          </div>
        </div>
      </section>

      <section
        id="invoice-list"
        className="dashboard-panel invoices-panel"
        aria-labelledby="invoice-list-title"
      >
        <header className="invoices-panel-header">
          <div className="min-w-0">
            <p className="dashboard-panel-kicker">Cobros y pagos de la obra</p>
            <h2 id="invoice-list-title" className="dashboard-panel-heading">
              Facturas pendientes
            </h2>
            <p className="dashboard-panel-description">
              Revisa qué dinero esperas recibir y qué compromisos siguen por
              pagar.
            </p>
          </div>
          <span className="dashboard-period invoices-panel-count">
            {invoices.isPending
              ? "Cargando"
              : rows.length +
                " " +
                (rows.length === 1 ? "visible" : "visibles")}
          </span>
        </header>

        <div className="invoices-board-summary">
          <div className="invoices-board-stat">
            <span className="invoices-board-stat-icon invoices-board-stat-icon-inflow">
              <ArrowDownLeft aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="invoices-board-stat-value numeric">
                {invoices.isPending
                  ? "—"
                  : formatMoney(receivableOutstanding, organization.currency)}
              </p>
              <p className="invoices-board-stat-label">Por cobrar</p>
            </div>
          </div>
          <div className="invoices-board-stat">
            <span className="invoices-board-stat-icon invoices-board-stat-icon-outflow">
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="invoices-board-stat-value numeric">
                {invoices.isPending
                  ? "—"
                  : formatMoney(payableOutstanding, organization.currency)}
              </p>
              <p className="invoices-board-stat-label">Por pagar</p>
            </div>
          </div>
          <div className="invoices-board-stat">
            <span className="invoices-board-stat-icon invoices-board-stat-icon-risk">
              <Clock3 aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="invoices-board-stat-value numeric">
                {invoices.isPending ? "—" : overdueCount}
              </p>
              <p className="invoices-board-stat-label">Vencidas</p>
            </div>
          </div>
        </div>

        {isDemo && (
          <div className="invoices-panel-notice" aria-live="polite">
            <FileText aria-hidden="true" className="size-4 shrink-0" />
            <p>
              Datos de ejemplo. Los cambios se habilitan al usar tu empresa.
            </p>
          </div>
        )}

        <div className="invoices-content">
          <div className="invoices-controls">
            <div className="invoices-search-field">
              <Field id="invoice-search" label="Buscar">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-primary"
                  />
                  <Input
                    id="invoice-search"
                    type="search"
                    placeholder="Cliente, obra, proveedor o folio"
                    className="list-search-input pl-11"
                    value={filters.get("q")}
                    onChange={(event) =>
                      filters.setFilter("q", event.target.value)
                    }
                  />
                </div>
              </Field>
            </div>
            <InvoiceFilterMenu direction={direction} status={status} />
          </div>
          {invoices.isPending ? (
            <InvoicesTableSkeleton />
          ) : invoices.isError ? (
            <ErrorView
              error={invoices.error}
              retry={() => void invoices.refetch()}
            />
          ) : (
            <>
              <DataList
                className="invoices-list"
                items={rows}
                caption="Facturas de la empresa"
                headings={[
                  "Cliente / proveedor",
                  "Tipo",
                  "Vencimiento",
                  "Estado",
                  "Pendiente",
                ]}
                row={(invoice) => (
                  <>
                    <td className="table-cell">{name(invoice)}</td>
                    <td className="table-cell text-muted-foreground">
                      {invoice.direction === "receivable"
                        ? "Por cobrar"
                        : "Por pagar"}
                    </td>
                    <td className="table-cell">
                      {invoice.dueOn ? formatDate(invoice.dueOn) : "Sin fecha"}
                    </td>
                    <td className="table-cell">
                      <InvoicePaymentStatus invoice={invoice} />
                    </td>
                    <td className="table-cell numeric break-words text-right font-medium">
                      {formatMoney(invoice.outstandingAmount, invoice.currency)}
                    </td>
                  </>
                )}
                mobile={(invoice) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {name(invoice)}
                        <p className="text-xs text-muted-foreground">
                          {invoice.direction === "receivable"
                            ? "Por cobrar"
                            : "Por pagar"}{" "}
                          ·{" "}
                          {invoice.dueOn
                            ? formatDate(invoice.dueOn)
                            : "Sin fecha"}
                        </p>
                      </div>
                      <FileText className="mt-3 size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <InvoicePaymentStatus invoice={invoice} />
                      <span className="numeric font-semibold">
                        {formatMoney(
                          invoice.outstandingAmount,
                          invoice.currency,
                        )}
                      </span>
                    </div>
                  </>
                )}
                empty={
                  <EmptyView
                    title={
                      direction || status || filters.get("q")
                        ? "No hay coincidencias"
                        : "Todavía no hay facturas"
                    }
                    description={
                      direction || status || filters.get("q")
                        ? "Prueba con otros filtros."
                        : "Importa un lote para incluir tus cobros y pagos en la proyección."
                    }
                  >
                    {direction || status || filters.get("q") ? (
                      <Button variant="outline" onClick={filters.reset}>
                        Limpiar filtros
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link href={`${basePath}/onboarding`}>
                          Ver primeros pasos
                        </Link>
                      </Button>
                    )}
                  </EmptyView>
                }
              />
              {invoices.data?.length === 500 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Se muestran hasta 500 facturas por consulta. Usa los filtros
                  para acotar la vista.
                </p>
              )}
            </>
          )}
        </div>
      </section>
      {importing && (
        <ImportDialog open={importing} onOpenChange={setImporting} />
      )}
    </div>
  );
}
