"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/forms/field";
import { BusyIcon, FieldError } from "@/components/feedback";
import { useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import { acknowledgmentSchema, type Invoice } from "@/lib/api/contracts";
import { amountInput } from "@/lib/form-schemas";
import { errorMessage } from "@/lib/api/errors";

const schema = z.object({
  dueOn: z.iso.date("Indica una fecha válida."),
  flexibleDate: z.union([
    z.literal(""),
    z.iso.date("Indica una fecha válida."),
  ]),
  negotiationCost: amountInput,
  outstandingAmount: amountInput,
  category: z.enum(["payroll", "tax", "rent", "supplier", "other"]),
  critical: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function InvoicePlanningForm({ invoice }: { invoice: Invoice }) {
  const { organization, isDemo, can } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const meta = invoice.metadata ?? {};
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      dueOn: invoice.dueOn ?? "",
      flexibleDate: String(
        (invoice.direction === "receivable"
          ? meta.earliestDate
          : meta.latestDate) ?? "",
      ),
      negotiationCost: String(meta.negotiationCost ?? "0.00"),
      outstandingAmount: invoice.outstandingAmount,
      category: schema.shape.category.safeParse(meta.category).success
        ? (meta.category as Values["category"])
        : "other",
      critical: meta.critical === true,
    },
  });
  const mutation = useCommand(
    async (values: Values) =>
      apiRequest(
        `/organizations/${organization.id}/treasury/invoices/${invoice.id}`,
        acknowledgmentSchema,
        {
          method: "PATCH",
          body: {
            dueOn: values.dueOn,
            outstandingAmount: values.outstandingAmount,
            category: values.category,
            critical: values.critical,
            earliestDate:
              invoice.direction === "receivable" && values.flexibleDate
                ? values.flexibleDate
                : null,
            latestDate:
              invoice.direction === "payable" && values.flexibleDate
                ? values.flexibleDate
                : null,
            negotiationCost: values.negotiationCost,
          },
        },
      ),
    "Factura actualizada. El plan de caja se recalculará con estos datos.",
    () => setEditing(false),
  );
  return (
    <section className="treasury-surface mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Condiciones para tu plan de caja
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Tú conoces los acuerdos. Indica cuándo esperas el movimiento y si es
            posible negociar otra fecha. Dejarla vacía impide que el motor la
            proponga.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={isDemo || !can("cfdi:import")}
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cerrar edición" : "Editar condiciones"}
        </Button>
      </div>
      {isDemo && (
        <p className="mt-4 text-xs text-muted-foreground">
          Datos sintéticos. Prueba los planes en la demo; la edición de fuentes
          está disponible en tu empresa.
        </p>
      )}
      {editing && (
        <form
          noValidate
          className="mt-6 space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid gap-5 sm:grid-cols-2"
          >
            <Field
              id="planning-date"
              label={
                invoice.direction === "receivable"
                  ? "Fecha esperada de cobro"
                  : "Fecha de pago"
              }
              error={form.formState.errors.dueOn?.message}
            >
              <Input
                id="planning-date"
                type="date"
                {...form.register("dueOn")}
              />
            </Field>
            <Field
              id="planning-flex"
              label={
                invoice.direction === "receivable"
                  ? "Podría cobrar desde (opcional)"
                  : "Podría pagar hasta (opcional)"
              }
              error={form.formState.errors.flexibleDate?.message}
            >
              <Input
                id="planning-flex"
                type="date"
                {...form.register("flexibleDate")}
              />
            </Field>
            <Field
              id="planning-cost"
              label={`Costo del acuerdo (${invoice.currency})`}
              hint="Descuento o comisión total supuesto. Cero significa sin costo conocido, no que el acuerdo esté aprobado."
              error={form.formState.errors.negotiationCost?.message}
            >
              <Input
                id="planning-cost"
                inputMode="decimal"
                {...form.register("negotiationCost")}
              />
            </Field>
            <Field
              id="planning-pending"
              label={`Saldo pendiente (${invoice.currency})`}
              hint="Actualízalo únicamente con un pago verificado. Cero marca esta factura como pagada."
              error={form.formState.errors.outstandingAmount?.message}
            >
              <Input
                id="planning-pending"
                inputMode="decimal"
                {...form.register("outstandingAmount")}
              />
            </Field>
            <Field id="planning-category" label="Tipo de movimiento">
              <NativeSelect
                id="planning-category"
                {...form.register("category")}
              >
                <option value="other">Otro</option>
                <option value="supplier">Proveedor</option>
                <option value="payroll">Nómina</option>
                <option value="tax">Impuestos</option>
                <option value="rent">Renta</option>
              </NativeSelect>
            </Field>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                className="size-5 accent-primary"
                type="checkbox"
                {...form.register("critical")}
              />
              Proteger fecha (nómina e impuestos siempre se protegen)
            </label>
          </fieldset>
          {mutation.isError && (
            <FieldError message={errorMessage(mutation.error)} />
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <BusyIcon /> : <Save />}Guardar condiciones
          </Button>
        </form>
      )}
    </section>
  );
}
