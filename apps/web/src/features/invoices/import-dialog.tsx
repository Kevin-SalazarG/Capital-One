"use client";

import { useState } from "react";
import { FileCode2, FileJson, Upload } from "lucide-react";
import { EditorDialog } from "@/components/forms/editor-dialog";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusyIcon, FieldError } from "@/components/feedback";
import { useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import { acknowledgmentSchema } from "@/lib/api/contracts";
import { cfdiImportSchema, type CfdiImport } from "@/lib/form-schemas";
import { errorMessage } from "@/lib/api/errors";
import { CfdiXmlError, parseCfdiXml } from "@/features/invoices/cfdi-xml";

type ImportFileType = "json" | "xml";

const FILE_LIMITS: Record<ImportFileType, number> = {
  json: 1_000_000,
  xml: 5_000_000,
};

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { organization } = useWorkspace();
  const [payload, setPayload] = useState<CfdiImport | null>(null);
  const [fileType, setFileType] = useState<ImportFileType>();
  const [fileError, setFileError] = useState<string>();
  const [reading, setReading] = useState(false);
  const mutation = useCommand(
    (input: CfdiImport) =>
      apiRequest(
        `/organizations/${organization.id}/cfdi/imports`,
        acknowledgmentSchema,
        { method: "POST", body: input },
      ),
    "Facturas importadas. Actualiza la proyección para incluirlas.",
    () => onOpenChange(false),
  );
  async function readFile(file: File | undefined) {
    setPayload(null);
    setFileType(undefined);
    setFileError(undefined);
    if (!file) return;

    const extension = file.name.toLowerCase().split(".").pop();
    const nextFileType: ImportFileType | undefined =
      extension === "xml" || extension === "json" ? extension : undefined;
    if (!nextFileType) {
      setFileError("Selecciona un CFDI XML o un archivo JSON.");
      return;
    }
    if (file.size > FILE_LIMITS[nextFileType]) {
      setFileError(
        `El archivo ${nextFileType.toUpperCase()} no puede superar ${nextFileType === "xml" ? "5 MB" : "1 MB"}.`,
      );
      return;
    }
    setReading(true);
    try {
      const contents = await file.text();
      if (nextFileType === "xml") {
        setPayload(
          parseCfdiXml(contents, {
            fileName: file.name,
            organizationRfc: organization.rfc,
            currency: organization.currency,
          }),
        );
      } else {
        const parsed = cfdiImportSchema.safeParse(
          JSON.parse(contents) as unknown,
        );
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          setFileError(
            `Revisa ${issue?.path.join(" → ") ?? "el archivo"}. El archivo debe seguir el formato de importación.`,
          );
          return;
        }
        setPayload(parsed.data);
      }
      setFileType(nextFileType);
    } catch (error) {
      if (nextFileType === "xml" && error instanceof CfdiXmlError) {
        setFileError(error.message);
      } else {
        setFileError(
          nextFileType === "xml"
            ? "No se pudo leer el XML. Revisa que sea un CFDI válido y vuelve a seleccionarlo."
            : "No se pudo leer el JSON. Revisa su formato y vuelve a seleccionarlo.",
        );
      }
    } finally {
      setReading(false);
    }
  }
  const ReadyFileIcon = fileType === "xml" ? FileCode2 : FileJson;
  const readyLabel =
    payload?.documents.length === 1 ? "factura lista" : "facturas listas";
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Importar facturas"
      description="Carga un CFDI XML o un lote JSON. Validamos los datos antes de importarlos."
      dirty={Boolean(payload)}
      busy={mutation.isPending || reading}
    >
      <div className="space-y-5">
        <Field id="invoice-file" label="Archivo XML o JSON" error={fileError}>
          <Input
            id="invoice-file"
            type="file"
            accept=".xml,.json,application/xml,text/xml,application/json"
            aria-describedby="invoice-file-error"
            aria-invalid={Boolean(fileError)}
            disabled={mutation.isPending || reading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              void readFile(file);
            }}
          />
        </Field>
        {payload && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-lg bg-secondary p-4 text-sm"
          >
            <ReadyFileIcon aria-hidden="true" className="size-5 shrink-0" />
            <span>
              <strong>
                {payload.documents.length} {readyLabel}
              </strong>
              <span className="mt-1 block break-all text-xs text-muted-foreground">
                {payload.sourceName}
              </span>
            </span>
          </div>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer py-2 text-primary">
            Qué tomamos del XML
          </summary>
          <p className="mt-2 rounded-lg bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            UUID fiscal, emisor, receptor, fecha, total y moneda. El XML se
            procesa en tu navegador; solo enviamos los datos normalizados.
          </p>
        </details>
        <details className="text-sm">
          <summary className="cursor-pointer py-2 text-primary">
            Ver formato JSON
          </summary>
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-muted p-4 text-xs">
            {JSON.stringify(
              {
                sourceName: "mi-sistema",
                documents: [
                  {
                    cfdiUuid: "FACTURA-EJEMPLO-001",
                    direction: "receivable",
                    issuerRfc: "AAA010101AAA",
                    receiverRfc: "BBB010101BBB",
                    counterpartyName: "Mi cliente",
                    issuedAt: "2026-09-12T12:00:00Z",
                    dueOn: "2026-09-30",
                    totalAmount: "1000.00",
                    outstandingAmount: "1000.00",
                    currency: organization.currency,
                    paymentStatus: "pending",
                  },
                ],
              },
              null,
              2,
            )}
          </pre>
        </details>
        {mutation.isError && (
          <FieldError message={errorMessage(mutation.error)} />
        )}
        <Button
          className="w-full"
          disabled={!payload || mutation.isPending || reading}
          onClick={() => payload && mutation.mutate(payload)}
        >
          {mutation.isPending || reading ? <BusyIcon /> : <Upload />}
          {mutation.isPending ? "Importando…" : "Importar facturas"}
        </Button>
      </div>
    </EditorDialog>
  );
}
