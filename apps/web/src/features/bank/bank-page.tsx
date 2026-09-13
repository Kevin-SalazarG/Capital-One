"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Info,
  Landmark,
  Search,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, NativeSelect } from "@/components/forms/field";
import { DataList } from "@/components/data-list";
import { FilterMenu } from "@/components/filter-menu";
import { EmptyView, ErrorView } from "@/components/feedback";
import { BankTransactionsSkeleton } from "@/components/page-skeletons";
import { PermissionGate } from "@/features/workspace/permission-gate";
import { ConnectionDialog } from "@/features/connections/connection-dialog";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { useListFilters } from "@/features/workspace/use-list-filters";
import { accountSchema, transactionSchema } from "@/lib/api/contracts";
import { formatDate, formatMoney, formatTimestamp } from "@/lib/formatters";

const DIRECTIONS: Record<string, string> = {
  inflow: "Entrada",
  outflow: "Salida",
  transfer: "Transferencia",
};
const ACCOUNT_TYPES: Record<string, string> = {
  Checking: "Cuenta corriente",
  Savings: "Ahorro",
  "Credit Card": "Tarjeta de crédito",
};
export function BankPage() {
  return (
    <PermissionGate permission="bank-account:read">
      <BankContent />
    </PermissionGate>
  );
}
function BankContent() {
  const { can, basePath, isDemo, organization } = useWorkspace();
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const filters = useListFilters();
  const accounts = useResource("bank/accounts", z.array(accountSchema));
  const transactions = useResource(
    "bank/transactions?limit=500",
    z.array(transactionSchema),
    can("bank-transaction:read"),
  );
  const rows = (transactions.data ?? [])
    .filter(
      (item) =>
        (!filters.get("account") ||
          item.bankAccountId === filters.get("account")) &&
        (!filters.get("direction") ||
          item.direction === filters.get("direction")) &&
        (!filters.get("q") ||
          (item.description ?? "")
            .toLocaleLowerCase("es-MX")
            .includes(filters.get("q").toLocaleLowerCase("es-MX"))),
    )
    .toSorted((a, b) => b.postedAt.localeCompare(a.postedAt));
  const account = accounts.data?.[0] ?? null;
  const accountCount = accounts.data?.length ?? 0;
  return (
    <>
      <div className="page-container dashboard-page bank-page space-y-7 pb-14">
        <section
          className="dashboard-hero bank-hero"
          aria-labelledby="bank-title"
        >
          <div className="dashboard-hero-copy">
            <div className="dashboard-kicker dashboard-kicker-safe">
              <Landmark aria-hidden="true" className="size-4" />
              Cuenta operativa
            </div>
            <h1
              id="bank-title"
              className="dashboard-hero-title bank-hero-title"
            >
              La cuenta de operación.
            </h1>
            <p className="dashboard-hero-description">
              Saldo, entradas y salidas reales para entender con qué caja
              cuentas hoy.
            </p>
            <div className="dashboard-hero-links">
              <a href="#bank-movements" className="dashboard-hero-link">
                Ver movimientos
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
              {can("connection:read") && (
                <Button
                  type="button"
                  variant="outline"
                  className="bank-hero-connection"
                  aria-haspopup="dialog"
                  onClick={() => setConnectionsOpen(true)}
                >
                  <Settings2 aria-hidden="true" />
                  Conexiones
                </Button>
              )}
            </div>
          </div>
          <div className="dashboard-payroll-card bank-balance-card">
            <div className="dashboard-payroll-topline">
              <span className="dashboard-payroll-icon">
                <Landmark aria-hidden="true" className="size-5" />
              </span>
              <span className="dashboard-payroll-label">Saldo operativo</span>
              <span
                className="bank-balance-status"
                data-active={Boolean(account)}
              >
                <span aria-hidden="true" />
                {account ? "Cuenta activa" : "Sin cuenta"}
              </span>
            </div>
            <p className="dashboard-payroll-title">Disponible hoy</p>
            {accounts.isPending ? (
              <Skeleton className="relative mt-2 h-12 w-52 max-w-full bg-white/10" />
            ) : (
              <p className="dashboard-payroll-amount bank-balance-amount">
                {account ? formatMoney(account.balance, account.currency) : "—"}
              </p>
            )}
            <p className="dashboard-payroll-detail bank-balance-detail">
              {account
                ? `${ACCOUNT_TYPES[account.type] ?? account.type} · ${account.currency}`
                : accounts.isError
                  ? "No pudimos actualizar este saldo."
                  : "Conecta una cuenta para ver su saldo."}
            </p>
            <div className="dashboard-payroll-risk bank-balance-risk">
              <div>
                <p className="dashboard-payroll-risk-label">
                  Última sincronización
                </p>
                <p className="bank-balance-sync">
                  {account
                    ? formatTimestamp(
                        account.lastSyncedAt,
                        organization.timeZone,
                      )
                    : "Sin sincronizar"}
                </p>
              </div>
              <p className="bank-balance-count numeric">
                {accounts.isPending ? "—" : accountCount}
              </p>
            </div>
          </div>
        </section>

        {can("bank-transaction:read") && (
          <section
            id="bank-movements"
            className="dashboard-panel bank-movements-panel"
            aria-labelledby="bank-movements-title"
          >
            <header className="bank-movements-header">
              <div className="min-w-0">
                <p className="dashboard-panel-kicker">Actividad bancaria</p>
                <h2
                  id="bank-movements-title"
                  className="dashboard-panel-heading"
                >
                  Movimientos recientes
                </h2>
                <p className="dashboard-panel-description">
                  Revisa qué entró y qué salió de tu cuenta de operación.
                </p>
              </div>
              <span className="dashboard-period bank-movements-count">
                {transactions.isPending
                  ? "Cargando"
                  : `${rows.length} ${rows.length === 1 ? "movimiento" : "movimientos"}`}
              </span>
            </header>

            {isDemo && (
              <div className="bank-panel-notice" aria-live="polite">
                <Info aria-hidden="true" className="size-4 shrink-0" />
                <p>
                  Datos de ejemplo. Los cambios se habilitan al usar tu empresa.
                </p>
              </div>
            )}

            {accounts.isError && (
              <div className="bank-account-notice" role="alert">
                <div className="min-w-0">
                  <p className="font-semibold">
                    No pudimos actualizar la cuenta
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los movimientos pueden seguir visibles, pero el saldo podría
                    estar desactualizado.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void accounts.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            )}

            {!accounts.isPending && !accounts.isError && !account && (
              <div className="bank-account-notice" role="status">
                <div className="min-w-0">
                  <p className="font-semibold">Conecta una cuenta bancaria</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sincronízala para ver el saldo y clasificar tus movimientos.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href={`${basePath}/onboarding`}>Conectar banco</Link>
                </Button>
              </div>
            )}

            {accounts.data && accounts.data.length > 1 && (
              <section
                className="bank-account-strip"
                aria-label="Cuentas conectadas"
              >
                {accounts.data.map((item) => (
                  <article key={item.id} className="bank-account-compact">
                    <Landmark
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ACCOUNT_TYPES[item.type] ?? item.type} ·{" "}
                        {item.currency}
                      </p>
                    </div>
                    <p className="numeric ml-auto break-words text-right text-sm font-semibold">
                      {formatMoney(item.balance, item.currency)}
                    </p>
                  </article>
                ))}
              </section>
            )}

            <div className="bank-movements-content">
              <div className="bank-controls">
                <div className="bank-search-field">
                  <Field id="bank-search" label="Buscar movimiento">
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-primary"
                      />
                      <Input
                        id="bank-search"
                        type="search"
                        placeholder="Descripción, obra o proveedor"
                        className="list-search-input pl-11"
                        value={filters.get("q")}
                        onChange={(event) =>
                          filters.setFilter("q", event.target.value)
                        }
                      />
                    </div>
                  </Field>
                </div>
                <FilterMenu
                  label="Filtros de movimientos"
                  activeCount={
                    [filters.get("account"), filters.get("direction")].filter(
                      Boolean,
                    ).length
                  }
                  onClear={() =>
                    filters.setFilters({ account: "", direction: "" })
                  }
                >
                  <Field id="bank-account" label="Cuenta">
                    <NativeSelect
                      id="bank-account"
                      value={filters.get("account")}
                      onChange={(event) =>
                        filters.setFilter("account", event.target.value)
                      }
                    >
                      <option value="">Todas las cuentas</option>
                      {accounts.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field id="bank-direction" label="Tipo">
                    <NativeSelect
                      id="bank-direction"
                      value={filters.get("direction")}
                      onChange={(event) =>
                        filters.setFilter("direction", event.target.value)
                      }
                    >
                      <option value="">Entradas y salidas</option>
                      {Object.entries(DIRECTIONS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </FilterMenu>
              </div>
              {transactions.isPending ? (
                <BankTransactionsSkeleton />
              ) : transactions.isError ? (
                <ErrorView
                  error={transactions.error}
                  retry={() => void transactions.refetch()}
                />
              ) : (
                <DataList
                  className="bank-transactions-list"
                  items={rows}
                  caption="Movimientos bancarios, del más reciente al más antiguo"
                  headings={["Movimiento", "Fecha", "Tipo", "Monto"]}
                  row={(item) => (
                    <>
                      <td className="table-cell">
                        <p className="break-words font-medium">
                          {item.description ?? "Movimiento bancario"}
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {
                            accounts.data?.find(
                              (itemAccount) =>
                                itemAccount.id === item.bankAccountId,
                            )?.name
                          }
                        </p>
                      </td>
                      <td className="table-cell">
                        {formatDate(item.postedAt, {
                          day: "numeric",
                          month: "short",
                          timeZone: organization.timeZone,
                        })}
                      </td>
                      <td className="table-cell text-muted-foreground">
                        {DIRECTIONS[item.direction]}
                      </td>
                      <td className="table-cell numeric break-words text-right font-medium">
                        {formatMoney(item.amount, item.currency)}
                      </td>
                    </>
                  )}
                  mobile={(item) => (
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                        {item.direction === "inflow" ? (
                          <ArrowDownLeft
                            aria-hidden="true"
                            className="size-4"
                          />
                        ) : (
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">
                          {item.description ?? "Movimiento bancario"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(item.postedAt, {
                            day: "numeric",
                            month: "short",
                            timeZone: organization.timeZone,
                          })}{" "}
                          · {DIRECTIONS[item.direction]}
                        </p>
                        <p className="numeric mt-3 font-semibold">
                          {formatMoney(item.amount, item.currency)}
                        </p>
                      </div>
                    </div>
                  )}
                  empty={
                    <EmptyView
                      title="No hay movimientos para esta vista"
                      description="Revisa los filtros o gestiona tus conexiones."
                    >
                      <Button variant="outline" onClick={filters.reset}>
                        Limpiar filtros
                      </Button>
                    </EmptyView>
                  }
                />
              )}
              {transactions.data?.length === 500 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Mostrando los últimos 500 movimientos sincronizados.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
      {can("connection:read") && (
        <ConnectionDialog
          open={connectionsOpen}
          onOpenChange={setConnectionsOpen}
        />
      )}
    </>
  );
}
