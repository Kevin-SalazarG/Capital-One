"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  CalendarDays,
  Info,
  LockKeyhole,
  Plus,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorDialog } from "@/components/forms/editor-dialog";
import { Field, NativeSelect } from "@/components/forms/field";
import {
  BusyIcon,
  EmptyView,
  ErrorView,
  FieldError,
} from "@/components/feedback";
import { CommitmentsListSkeleton } from "@/components/page-skeletons";
import { PermissionGate } from "@/features/workspace/permission-gate";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import { obligationSchema, acknowledgmentSchema } from "@/lib/api/contracts";
import { obligationFormSchema } from "@/lib/form-schemas";
import { errorMessage } from "@/lib/api/errors";
import { formatDate, formatMoney } from "@/lib/formatters";

const FREQUENCIES = {
  weekly: "Semanal",
  biweekly: "Cada 14 días",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};
const CATEGORIES: Record<string, string> = {
  payroll: "Nómina",
  tax: "Impuestos",
  rent: "Renta",
  supplier: "Proveedor",
  other: "Otro",
};

export function ObligationsPage() {
  return (
    <PermissionGate permission="forecast:configure">
      <ObligationsContent />
    </PermissionGate>
  );
}
function ObligationsContent() {
  const { basePath, isDemo, organization } = useWorkspace();
  const obligations = useResource("obligations", z.array(obligationSchema));
  const [adding, setAdding] = useState(false);
  const items = obligations.data ?? [];
  const orderedItems = [...items].sort((left, right) =>
    left.nextDueOn.localeCompare(right.nextDueOn),
  );
  const nextPayment = orderedItems[0] ?? null;
  const totalAmount = items
    .reduce((total, item) => total + Number(item.amount), 0)
    .toFixed(2);
  const protectedCount = items.filter((item) => item.metadata?.critical).length;
  const currency = nextPayment?.currency ?? organization.currency;

  return (
    <>
      <section
        className="dashboard-hero commitments-hero"
        aria-labelledby="commitments-title"
      >
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker dashboard-kicker-safe">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Pagos protegidos
          </div>
          <h1 id="commitments-title" className="dashboard-hero-title">
            Lo que tu obra no puede posponer.
          </h1>
          <p className="dashboard-hero-description">
            La nómina, la renta y los impuestos tienen fecha fija. Tu plan los
            respeta para que sepas con qué caja sí puedes decidir.
          </p>
          <div className="dashboard-hero-links">
            <a href="#protected-payments" className="dashboard-hero-link">
              Ver pagos protegidos
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <Link
              href={`${basePath}/dashboard`}
              className="dashboard-hero-link"
            >
              Ver plan de caja
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
        <div className="dashboard-payroll-card commitments-summary-card">
          <div className="dashboard-payroll-topline">
            <span className="dashboard-payroll-icon">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <span className="dashboard-payroll-label">Salidas protegidas</span>
            <span className="dashboard-payroll-lock">
              <LockKeyhole aria-hidden="true" className="size-3" />
              No se mueve
            </span>
          </div>
          <p className="dashboard-payroll-title">
            {nextPayment
              ? "Próximo pago protegido"
              : "Aún no hay pagos protegidos"}
          </p>
          {obligations.isPending ? (
            <Skeleton className="relative mt-2 h-12 w-52 max-w-full bg-white/10" />
          ) : nextPayment ? (
            <p className="dashboard-payroll-amount">
              {formatMoney(nextPayment.amount, nextPayment.currency)}
            </p>
          ) : (
            <p className="dashboard-payroll-amount commitments-summary-empty">
              —
            </p>
          )}
          <p className="dashboard-payroll-detail commitments-summary-detail">
            {nextPayment
              ? `${formatDate(nextPayment.nextDueOn)} · ${nextPayment.name}`
              : "Agrega un pago recurrente para protegerlo en tu proyección."}
          </p>
          <div className="dashboard-payroll-risk commitments-summary-risk">
            <p className="dashboard-payroll-risk-label">
              Fechas protegidas
              <br />
              dentro del plan
            </p>
            <p className="commitments-summary-risk-value numeric">
              {obligations.isPending ? "—" : protectedCount}
            </p>
          </div>
        </div>
      </section>

      <section
        id="protected-payments"
        className="dashboard-panel commitments-list-panel"
        aria-labelledby="protected-payments-title"
      >
        <header className="commitments-list-header">
          <div className="min-w-0">
            <p className="dashboard-panel-kicker">Lo que no se mueve</p>
            <h2
              id="protected-payments-title"
              className="dashboard-panel-heading"
            >
              Pagos protegidos de tu obra
            </h2>
            <p className="dashboard-panel-description">
              Fechas que el plan respeta para que puedas decidir con el resto de
              tu caja.
            </p>
          </div>
          <Button disabled={isDemo} onClick={() => setAdding(true)}>
            <Plus />
            Agregar pago
          </Button>
        </header>

        <div className="commitments-board-summary">
          <div className="commitments-board-stat">
            <span className="commitments-board-stat-icon">
              <WalletCards aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="commitments-board-stat-value numeric">
                {obligations.isPending ? "—" : items.length}
              </p>
              <p className="commitments-board-stat-label">Pagos en el plan</p>
            </div>
          </div>
          <div className="commitments-board-stat">
            <span className="commitments-board-stat-icon">
              <CalendarDays aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="commitments-board-stat-value numeric">
                {obligations.isPending
                  ? "—"
                  : formatMoney(totalAmount, currency)}
              </p>
              <p className="commitments-board-stat-label">Monto registrado</p>
            </div>
          </div>
          <div className="commitments-board-stat">
            <span className="commitments-board-stat-icon">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="commitments-board-stat-value numeric">
                {obligations.isPending ? "—" : protectedCount}
              </p>
              <p className="commitments-board-stat-label">Fechas protegidas</p>
            </div>
          </div>
        </div>

        {isDemo && (
          <div className="commitments-board-notice" role="status">
            <Info aria-hidden="true" className="size-4 shrink-0" />
            <p>
              Datos de ejemplo. Los cambios se habilitan al usar tu empresa.
            </p>
          </div>
        )}

        {obligations.isPending ? (
          <CommitmentsListSkeleton />
        ) : obligations.isError ? (
          <div className="p-5 sm:p-7">
            <ErrorView
              error={obligations.error}
              retry={() => void obligations.refetch()}
            />
          </div>
        ) : !items.length ? (
          <div className="p-5 sm:p-7">
            <EmptyView
              title="Anticipa tus pagos habituales"
              description="Registra un compromiso recurrente para incluirlo en la siguiente proyección."
            />
          </div>
        ) : (
          <div className="commitments-list">
            {orderedItems.map((obligation) => (
              <article key={obligation.id} className="commitments-row">
                <div className="commitments-date" aria-hidden="true">
                  <span>
                    {formatDate(obligation.nextDueOn, { month: "short" })}
                  </span>
                  <strong>
                    {formatDate(obligation.nextDueOn, { day: "numeric" })}
                  </strong>
                </div>
                <div className="commitments-row-content">
                  <div className="commitments-row-heading">
                    <h3 className="commitments-row-title">{obligation.name}</h3>
                    <span
                      className={
                        obligation.metadata?.critical
                          ? "commitments-status commitments-status-protected"
                          : "commitments-status"
                      }
                    >
                      {obligation.metadata?.critical && (
                        <LockKeyhole aria-hidden="true" className="size-3" />
                      )}
                      {obligation.metadata?.critical
                        ? "Fecha protegida"
                        : "Incluido en el plan"}
                    </span>
                  </div>
                  <p className="commitments-row-meta">
                    {CATEGORIES[obligation.metadata?.category ?? ""] ??
                      "Pago recurrente"}
                    {" · "}
                    {FREQUENCIES[obligation.frequency]} · Próximo pago:{" "}
                    {formatDate(obligation.nextDueOn)}
                  </p>
                </div>
                <div className="commitments-row-amount-wrap">
                  <p className="commitments-row-amount numeric">
                    {formatMoney(obligation.amount, obligation.currency)}
                  </p>
                  <p className="commitments-row-amount-note">por periodo</p>
                </div>
              </article>
            ))}
          </div>
        )}
        <footer className="commitments-board-footer">
          <LockKeyhole aria-hidden="true" className="size-3.5 shrink-0" />
          <p>
            Se incorporan al actualizar la proyección; no ejecutan
            transferencias. Puedes consultarlos, pero todavía no editarlos ni
            eliminarlos.
          </p>
        </footer>
      </section>
      {adding && <ObligationDialog open onOpenChange={setAdding} />}
    </>
  );
}
function ObligationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { organization } = useWorkspace();
  const form = useForm<z.infer<typeof obligationFormSchema>>({
    resolver: zodResolver(obligationFormSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      amount: "",
      frequency: "monthly",
      category: "payroll",
      critical: true,
      nextDueOn: "",
    },
  });
  const mutation = useCommand(
    (values: z.infer<typeof obligationFormSchema>) =>
      apiRequest(
        `/organizations/${organization.id}/obligations`,
        acknowledgmentSchema,
        {
          method: "POST",
          body: { ...values, currency: organization.currency },
        },
      ),
    "Pago registrado. Actualiza la proyección para incluirlo.",
    () => onOpenChange(false),
  );
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar pago recurrente"
      description="Revisa los datos antes de guardar. Aún no se pueden editar ni eliminar estos pagos."
      dirty={form.formState.isDirty}
      busy={mutation.isPending}
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <fieldset disabled={mutation.isPending} className="space-y-5">
          <Field
            id="obligation-name"
            label="Concepto"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="obligation-name"
              placeholder="Nómina de cuadrilla"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby="obligation-name-error"
              {...form.register("name")}
            />
          </Field>
          <Field
            id="obligation-amount"
            label={`Monto en ${organization.currency}`}
            error={form.formState.errors.amount?.message}
          >
            <Input
              id="obligation-amount"
              inputMode="decimal"
              aria-invalid={Boolean(form.formState.errors.amount)}
              aria-describedby="obligation-amount-error"
              {...form.register("amount")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="obligation-category" label="Tipo de compromiso">
              <NativeSelect
                id="obligation-category"
                {...form.register("category")}
              >
                <option value="payroll">Nómina</option>
                <option value="tax">Impuestos</option>
                <option value="rent">Renta</option>
                <option value="supplier">Proveedor</option>
                <option value="other">Otro</option>
              </NativeSelect>
            </Field>
            <Field id="obligation-frequency" label="Frecuencia">
              <NativeSelect
                id="obligation-frequency"
                {...form.register("frequency")}
              >
                {Object.entries(FREQUENCIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="obligation-date"
              label="Próximo pago"
              error={form.formState.errors.nextDueOn?.message}
            >
              <Input
                id="obligation-date"
                type="date"
                aria-invalid={Boolean(form.formState.errors.nextDueOn)}
                aria-describedby="obligation-date-error"
                {...form.register("nextDueOn")}
              />
            </Field>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              {...form.register("critical")}
            />
            Proteger esta fecha. Nómina e impuestos siempre quedan protegidos.
          </label>
        </fieldset>
        {mutation.isError && (
          <FieldError message={errorMessage(mutation.error)} />
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <BusyIcon />}Registrar pago
        </Button>
      </form>
    </EditorDialog>
  );
}
