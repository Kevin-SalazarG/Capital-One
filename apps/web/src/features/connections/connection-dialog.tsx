"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { EditorDialog } from "@/components/forms/editor-dialog";
import { Field, NativeSelect } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BusyIcon, FieldError } from "@/components/feedback";
import { useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import { acknowledgmentSchema, type Connection } from "@/lib/api/contracts";
import { connectionFormSchema } from "@/lib/form-schemas";
import { errorMessage } from "@/lib/api/errors";

type Values = z.infer<typeof connectionFormSchema>;
export function ConnectionDialog({
  connection,
  open,
  onOpenChange,
  initialKind = "bank",
}: {
  connection?: Connection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: "bank" | "cfdi";
}) {
  const { organization, isDemo } = useWorkspace();
  const form = useForm<Values>({
    resolver: zodResolver(connectionFormSchema),
    mode: "onBlur",
    defaultValues: {
      displayName: connection?.displayName ?? "",
      kind: connection?.kind ?? initialKind,
      externalCustomerId: connection?.externalCustomerId ?? "",
    },
  });
  const kind = form.watch("kind");
  const mutation = useCommand(
    (values: Values) =>
      apiRequest(
        `/organizations/${organization.id}/connections${connection ? `/${connection.id}` : ""}`,
        acknowledgmentSchema,
        {
          method: connection ? "PATCH" : "POST",
          body: {
            displayName: values.displayName,
            ...(kind === "bank"
              ? { externalCustomerId: values.externalCustomerId }
              : {}),
            ...(!connection
              ? {
                  kind,
                  provider: kind === "bank" ? "nessie" : "synthetic_cfdi",
                }
              : {}),
          },
        },
      ),
    connection ? "Conexión actualizada" : "Conexión agregada",
    () => onOpenChange(false),
  );
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title={connection ? "Editar conexión" : "Agregar conexión"}
      description={
        isDemo
          ? "Estás viendo datos de ejemplo. Conecta tu empresa para guardar una fuente."
          : "No necesitas ingresar claves ni contraseñas."
      }
      dirty={form.formState.isDirty}
      busy={mutation.isPending}
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <fieldset disabled={mutation.isPending || isDemo} className="space-y-5">
          <Field id="connection-kind" label="Fuente">
            <NativeSelect
              id="connection-kind"
              {...form.register("kind")}
              disabled={Boolean(connection)}
            >
              <option value="bank">Banco de prueba · Nessie</option>
              <option value="cfdi">Facturas de demostración</option>
            </NativeSelect>
          </Field>
          <Field
            id="connection-name"
            label="Nombre"
            error={form.formState.errors.displayName?.message}
          >
            <Input
              id="connection-name"
              placeholder="Cuenta de operación"
              aria-invalid={Boolean(form.formState.errors.displayName)}
              aria-describedby="connection-name-error"
              {...form.register("displayName")}
            />
          </Field>
          {kind === "bank" && (
            <Field
              id="connection-customer"
              label="Identificador del cliente"
              hint="Usa el ID del cliente creado en Nessie. No es tu número de cuenta ni una contraseña."
              error={form.formState.errors.externalCustomerId?.message}
            >
              <Input
                id="connection-customer"
                autoComplete="off"
                aria-invalid={Boolean(form.formState.errors.externalCustomerId)}
                aria-describedby="connection-customer-hint connection-customer-error"
                {...form.register("externalCustomerId")}
              />
            </Field>
          )}
        </fieldset>
        {mutation.isError && (
          <FieldError message={errorMessage(mutation.error)} />
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isDemo || mutation.isPending}
        >
          {mutation.isPending && <BusyIcon />}
          {connection ? "Guardar conexión" : "Agregar conexión"}
        </Button>
      </form>
    </EditorDialog>
  );
}
