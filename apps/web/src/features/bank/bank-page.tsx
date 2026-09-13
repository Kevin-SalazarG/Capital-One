"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Search,
  Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/forms/field";
import { DataList } from "@/components/data-list";
import { FilterMenu } from "@/components/filter-menu";
import { EmptyView, ErrorView } from "@/components/feedback";
import {
  BankAccountsSkeleton,
  BankTransactionsSkeleton,
} from "@/components/page-skeletons";
import {
  PermissionGate,
  DemoNotice,
} from "@/features/workspace/permission-gate";
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
  const { can, basePath, organization } = useWorkspace();
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
  return (
    <>
      <div className="page-container">
        <PageHeader
          title="La cuenta de operación."
          description="Cuentas y movimientos que dan contexto a tu caja."
          action={
            can("connection:read") && (
              <Button
                type="button"
                variant="outline"
                className="bank-connections-trigger"
                aria-haspopup="dialog"
                onClick={() => setConnectionsOpen(true)}
              >
                <Settings2 />
                Conexiones
              </Button>
            )
          }
        />
        <DemoNotice />
        {accounts.isPending ? (
          <BankAccountsSkeleton />
        ) : accounts.isError ? (
          <ErrorView
            error={accounts.error}
            retry={() => void accounts.refetch()}
          />
        ) : !accounts.data.length ? (
          <EmptyView
            title="Tu primera cuenta, aquí"
            description="Conecta y sincroniza una fuente bancaria para ver su saldo y movimientos."
          >
            <Button asChild>
              <Link href={`${basePath}/onboarding`}>Conectar banco</Link>
            </Button>
          </EmptyView>
        ) : (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {accounts.data.map((account) => (
              <section key={account.id} className="panel p-6">
                <div className="mb-5 flex items-start gap-3">
                  <Landmark className="mt-1 size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold">
                      {account.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ACCOUNT_TYPES[account.type] ?? account.type} ·{" "}
                      {account.currency}
                    </p>
                  </div>
                </div>
                <p className="numeric break-words text-[28px] font-semibold tracking-tight">
                  {formatMoney(account.balance, account.currency)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Actualizada:{" "}
                  {formatTimestamp(account.lastSyncedAt, organization.timeZone)}
                </p>
              </section>
            ))}
          </div>
        )}
        {can("bank-transaction:read") && (
          <section className="mt-9">
            <h2 className="mb-5 text-xl font-semibold">Movimientos</h2>
            <div className="mb-6 flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
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
                    {accounts.data?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
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
                            (account) => account.id === item.bankAccountId,
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
                  <>
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                        {item.direction === "inflow" ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <ArrowUpRight className="size-4" />
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
                  </>
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
