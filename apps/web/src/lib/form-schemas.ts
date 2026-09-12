import { z } from "zod";

export const amountInput = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Usa un monto positivo con máximo dos decimales.",
  );
export const companyFormSchema = z.object({
  name: z.string().trim().min(2, "Escribe al menos 2 caracteres.").max(120),
  legalName: z.string().trim().max(160),
  rfc: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^[A-Z0-9]{12,13}$/.test(value),
      "Usa un RFC de 12 o 13 caracteres en mayúsculas.",
    ),
  currency: z.string().regex(/^[A-Z]{3}$/, "Selecciona una moneda."),
  timeZone: z
    .string()
    .min(1)
    .max(80)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("es-MX", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Selecciona una zona horaria válida."),
  minimumCashReserve: amountInput,
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;
export function companyPayload(values: CompanyFormValues) {
  return { ...values, ...(values.rfc ? {} : { rfc: undefined }) };
}
export const connectionFormSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Escribe un nombre para la conexión.")
      .max(120),
    externalCustomerId: z.string().trim().max(120),
    kind: z.enum(["bank", "cfdi"]),
  })
  .refine(
    (value) => value.kind !== "bank" || value.externalCustomerId.length > 0,
    {
      path: ["externalCustomerId"],
      message: "Escribe el identificador del cliente de Nessie.",
    },
  );
export const memberFormSchema = z.object({
  email: z.email("Escribe un correo válido.").max(320),
  role: z.enum(["admin", "analyst", "viewer"]),
});
export const obligationFormSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre.").max(120),
  amount: amountInput,
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  nextDueOn: z.iso.date("Elige una fecha válida."),
});
const rfcInput = z.string().regex(/^[A-Z0-9]{12,13}$/);
export const cfdiImportSchema = z
  .object({
    sourceName: z.string().trim().min(1).max(160),
    documents: z
      .array(
        z
          .object({
            cfdiUuid: z.string().min(8).max(80),
            direction: z.enum(["receivable", "payable"]),
            issuerRfc: rfcInput,
            receiverRfc: rfcInput,
            counterpartyName: z.string().max(200).optional(),
            issuedAt: z.iso.datetime({ offset: true }),
            dueOn: z.iso.date().optional(),
            totalAmount: amountInput,
            outstandingAmount: amountInput,
            currency: z
              .string()
              .regex(/^[A-Z]{3}$/)
              .optional(),
            paymentStatus: z.enum([
              "pending",
              "partial",
              "paid",
              "overdue",
              "cancelled",
            ]),
            expectedCollectionProbability: z.number().min(0).max(1).optional(),
            metadata: z
              .record(
                z.string(),
                z.union([z.string(), z.number(), z.boolean(), z.null()]),
              )
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();
export type CfdiImport = z.infer<typeof cfdiImportSchema>;
