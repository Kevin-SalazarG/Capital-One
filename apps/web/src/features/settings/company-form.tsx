"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, NativeSelect } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BusyIcon, FieldError } from "@/components/feedback";
import { companyFormSchema, type CompanyFormValues } from "@/lib/form-schemas";

export function CompanyForm({
  values,
  onSave,
  pending,
  error,
  readOnly = false,
  creating = false,
}: {
  values: CompanyFormValues;
  onSave: (values: CompanyFormValues) => Promise<boolean>;
  pending: boolean;
  error?: string;
  readOnly?: boolean;
  creating?: boolean;
}) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    mode: "onBlur",
    defaultValues: values,
  });
  const currencies = Array.from(
    new Set([values.currency, "MXN", "USD", "EUR"]),
  );
  const timeZones = Array.from(
    new Set([
      values.timeZone,
      "America/Mexico_City",
      "America/Monterrey",
      "America/Cancun",
      "America/Hermosillo",
      "America/Tijuana",
      "America/New_York",
      "UTC",
    ]),
  );
  return (
    <form
      noValidate
      className="max-w-3xl space-y-6"
      onSubmit={form.handleSubmit(async (input) => {
        if (!creating && values.rfc && !input.rfc) {
          form.setError("rfc", {
            message:
              "Escribe el nuevo RFC completo. Aún no se puede borrar un RFC guardado.",
          });
          form.setFocus("rfc");
          return;
        }
        if (await onSave(input)) form.reset(input);
      })}
    >
      <fieldset
        disabled={pending || readOnly}
        className="panel space-y-6 p-5 md:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="company-name"
            label="Nombre de la empresa"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="company-name"
              autoComplete="organization"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby="company-name-error"
              {...form.register("name")}
            />
          </Field>
          <Field
            id="company-currency"
            label="Moneda"
            hint="Debe coincidir con tus cuentas y facturas; no se convierten saldos."
            error={form.formState.errors.currency?.message}
          >
            <NativeSelect
              id="company-currency"
              aria-describedby="company-currency-hint company-currency-error"
              {...form.register("currency")}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency === "MXN"
                    ? "MXN · Peso mexicano"
                    : currency === "USD"
                      ? "USD · Dólar estadounidense"
                      : currency}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            id="company-reserve"
            label="Reserva mínima"
            hint="Tu referencia de seguridad para la proyección."
            error={form.formState.errors.minimumCashReserve?.message}
          >
            <Input
              id="company-reserve"
              inputMode="decimal"
              aria-invalid={Boolean(form.formState.errors.minimumCashReserve)}
              aria-describedby="company-reserve-hint company-reserve-error"
              {...form.register("minimumCashReserve")}
            />
          </Field>
          <Field
            id="company-timezone"
            label="Zona horaria"
            error={form.formState.errors.timeZone?.message}
          >
            <NativeSelect
              id="company-timezone"
              aria-describedby="company-timezone-error"
              {...form.register("timeZone")}
            >
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            id="company-daily-expense"
            label="Gasto operativo diario"
            hint="Solo gasto variable: excluye nómina, renta y facturas ya registradas para no contarlos dos veces."
            error={form.formState.errors.dailyOperatingExpense?.message}
          >
            <Input
              id="company-daily-expense"
              inputMode="decimal"
              aria-describedby="company-daily-expense-hint company-daily-expense-error"
              {...form.register("dailyOperatingExpense")}
            />
          </Field>
        </div>
        <details open={!creating} className="border-t pt-5">
          <summary className="cursor-pointer py-1 text-sm font-medium">
            Datos fiscales{" "}
            <span className="font-normal text-muted-foreground">
              · Opcionales
            </span>
          </summary>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              id="company-legal-name"
              label="Razón social"
              error={form.formState.errors.legalName?.message}
            >
              <Input
                id="company-legal-name"
                aria-describedby="company-legal-name-error"
                {...form.register("legalName")}
              />
            </Field>
            <Field
              id="company-rfc"
              label="RFC"
              error={form.formState.errors.rfc?.message}
              hint={
                values.rfc
                  ? "Para cambiarlo, escribe el nuevo RFC completo."
                  : undefined
              }
            >
              <Input
                id="company-rfc"
                autoCapitalize="characters"
                aria-invalid={Boolean(form.formState.errors.rfc)}
                aria-describedby="company-rfc-error"
                {...form.register("rfc")}
              />
            </Field>
          </div>
        </details>
      </fieldset>
      {error && <FieldError message={error} />}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            disabled={pending || (!creating && !form.formState.isDirty)}
          >
            {pending && <BusyIcon />}
            {pending
              ? "Guardando…"
              : creating
                ? "Crear empresa"
                : "Guardar cambios"}
          </Button>
          {!creating && form.formState.isDirty && (
            <p className="text-xs text-muted-foreground">Cambios sin guardar</p>
          )}
        </div>
      )}
    </form>
  );
}
