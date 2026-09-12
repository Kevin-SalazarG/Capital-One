"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { DataList } from "@/components/data-list";
import { EmptyView, ErrorView, LoadingView } from "@/components/feedback";
import {
  PermissionGate,
  DemoNotice,
} from "@/features/workspace/permission-gate";
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
  const { can, isDemo, basePath } = useWorkspace();
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
    <div className="page-container">
      <PageHeader
        title="Tus cobros y pagos."
        description="Facturas, vencimientos y saldos pendientes, en un solo lugar."
        action={
          can("cfdi:import") && (
            <Button disabled={isDemo} onClick={() => setImporting(true)}>
              <Upload />
              Importar facturas
            </Button>
          )
        }
      />
      <DemoNotice />
      <div className="mb-6 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <Field id="invoice-search" label="Buscar">
            <Input
              id="invoice-search"
              type="search"
              placeholder="Cliente, proveedor o folio"
              value={filters.get("q")}
              onChange={(event) => filters.setFilter("q", event.target.value)}
            />
          </Field>
        </div>
        <InvoiceFilterMenu direction={direction} status={status} />
      </div>
      {invoices.isPending ? (
        <LoadingView />
      ) : invoices.isError ? (
        <ErrorView
          error={invoices.error}
          retry={() => void invoices.refetch()}
        />
      ) : (
        <>
          <DataList
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
                      {invoice.dueOn ? formatDate(invoice.dueOn) : "Sin fecha"}
                    </p>
                  </div>
                  <FileText className="mt-3 size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <InvoicePaymentStatus invoice={invoice} />
                  <span className="numeric font-semibold">
                    {formatMoney(invoice.outstandingAmount, invoice.currency)}
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
              Se muestran hasta 500 facturas por consulta. Usa los filtros para
              acotar la vista.
            </p>
          )}
        </>
      )}
      {importing && (
        <ImportDialog open={importing} onOpenChange={setImporting} />
      )}
    </div>
  );
}
