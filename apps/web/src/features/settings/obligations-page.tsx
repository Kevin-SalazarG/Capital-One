"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorDialog } from "@/components/forms/editor-dialog";
import { Field, NativeSelect } from "@/components/forms/field";
import {
  BusyIcon,
  EmptyView,
  ErrorView,
  FieldError,
  LoadingView,
} from "@/components/feedback";
import {
  PermissionGate,
  DemoNotice,
} from "@/features/workspace/permission-gate";
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
export function ObligationsPage() {
  return (
    <PermissionGate permission="forecast:configure">
      <ObligationsContent />
    </PermissionGate>
  );
}
function ObligationsContent() {
  const { isDemo } = useWorkspace();
  const obligations = useResource("obligations", z.array(obligationSchema));
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Compromisos protegidos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Renta, nómina y otros compromisos de tu operación.
          </p>
        </div>
        <Button disabled={isDemo} onClick={() => setAdding(true)}>
          <Plus />
          Agregar pago
        </Button>
      </div>
      <DemoNotice />
      {obligations.isPending ? (
        <LoadingView />
      ) : obligations.isError ? (
        <ErrorView
          error={obligations.error}
          retry={() => void obligations.refetch()}
        />
      ) : !obligations.data.length ? (
        <EmptyView
          title="Anticipa tus pagos habituales"
          description="Registra un compromiso recurrente para incluirlo en la siguiente proyección."
        />
      ) : (
        <div className="panel divide-y">
          {obligations.data.map((obligation) => (
            <div
              key={obligation.id}
              className="flex flex-wrap items-center gap-4 p-5"
            >
              <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-semibold">
                  {obligation.name}
                </h3>
                {obligation.metadata?.critical && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    Fecha protegida · no se negocia en los planes
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {FREQUENCIES[obligation.frequency]} · Próximo pago:{" "}
                  {formatDate(obligation.nextDueOn)}
                </p>
              </div>
              <p className="numeric text-lg font-semibold">
                {formatMoney(obligation.amount, obligation.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
        Los pagos se incorporan al actualizar la proyección; no se ejecutan
        transferencias. Por ahora puedes registrarlos y consultarlos, pero no
        editarlos ni eliminarlos.
      </p>
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
              placeholder="Renta del local"
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
