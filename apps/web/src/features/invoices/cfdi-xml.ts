import { cfdiImportSchema, type CfdiImport } from "@/lib/form-schemas";

const RFC_PATTERN = /^[A-Z0-9]{12,13}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export class CfdiXmlError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CfdiXmlError";
  }
}

export interface CfdiXmlParseOptions {
  fileName: string;
  organizationRfc?: string | null;
  currency: string;
}

function elementLocalName(element: Element) {
  return (
    element.localName ??
    element.tagName.split(":").pop() ??
    ""
  ).toLowerCase();
}

function isElement(element: Element, name: string) {
  return elementLocalName(element) === name.toLowerCase();
}

function findDescendant(root: ParentNode, name: string) {
  return (
    Array.from(root.querySelectorAll("*")).find((element) =>
      isElement(element, name),
    ) ?? null
  );
}

function findDirectChild(parent: Element, name: string) {
  return (
    Array.from(parent.children).find((element) => isElement(element, name)) ??
    null
  );
}

function readAttribute(element: Element, names: string[]) {
  const requested = new Set(names.map((name) => name.toLowerCase()));
  for (const attribute of Array.from(element.attributes)) {
    const name = (
      attribute.localName ??
      attribute.name.split(":").pop() ??
      ""
    ).toLowerCase();
    if (requested.has(name)) {
      const value = attribute.value.trim();
      if (value) return value;
    }
  }
  return undefined;
}

function requiredAttribute(element: Element, names: string[], label: string) {
  const value = readAttribute(element, names);
  if (!value) {
    throw new CfdiXmlError(`El XML no incluye ${label}.`);
  }
  return value;
}

function requiredChild(parent: Element, name: string, label: string) {
  const child = findDirectChild(parent, name);
  if (!child) {
    throw new CfdiXmlError(`El XML no incluye ${label}.`);
  }
  return child;
}

function normalizeRfc(value: string, label: string) {
  const normalized = value.trim().toUpperCase();
  if (!RFC_PATTERN.test(normalized)) {
    throw new CfdiXmlError(`${label} no tiene un RFC válido.`);
  }
  return normalized;
}

function normalizeAmount(value: string) {
  const normalized = value.trim().replaceAll(",", "");
  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);
  const whole = match?.[1];
  const decimals = match?.[2];
  if (!whole || (decimals?.length ?? 0) > 2) {
    throw new CfdiXmlError(
      "El total del XML no tiene un formato válido de hasta dos decimales.",
    );
  }
  return decimals ? `${whole}.${decimals}` : whole;
}

function normalizeDateTime(value: string) {
  const normalized = value.trim();
  const withOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const date = new Date(withOffset);
  if (Number.isNaN(date.getTime())) {
    throw new CfdiXmlError("La fecha de emisión del XML no es válida.");
  }
  return date.toISOString();
}

function normalizeDate(value: string) {
  const normalized = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new CfdiXmlError("La fecha de vencimiento del XML no es válida.");
  }
  const date = new Date(`${normalized}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new CfdiXmlError("La fecha de vencimiento del XML no es válida.");
  }
  return normalized;
}

function inferDirection(
  issuerRfc: string,
  receiverRfc: string,
  organizationRfc: string | null | undefined,
  cfdiType: string,
): CfdiImport["documents"][number]["direction"] {
  const normalizedType = cfdiType.toUpperCase();
  if (normalizedType !== "I" && normalizedType !== "E") {
    throw new CfdiXmlError(
      "Solo se admiten CFDI de ingreso o egreso; este XML parece ser un complemento o traslado.",
    );
  }

  const companyRfc = organizationRfc?.trim().toUpperCase();
  if (companyRfc) {
    if (!RFC_PATTERN.test(companyRfc)) {
      throw new CfdiXmlError(
        "Configura un RFC válido para identificar el sentido de la factura.",
      );
    }
    if (companyRfc === issuerRfc && companyRfc === receiverRfc) {
      throw new CfdiXmlError(
        "El emisor y receptor del XML no pueden ser la misma empresa.",
      );
    }
    if (companyRfc === issuerRfc) return "receivable";
    if (companyRfc === receiverRfc) return "payable";
    throw new CfdiXmlError(
      "El RFC de la empresa no coincide con el emisor ni con el receptor del XML.",
    );
  }

  return normalizedType === "I" ? "receivable" : "payable";
}

function sourceName(fileName: string) {
  const safeName = fileName.trim() || "archivo.xml";
  return `CFDI XML · ${safeName.slice(0, 148)}`;
}

function invalidPayloadMessage(payload: unknown) {
  const parsed = cfdiImportSchema.safeParse(payload);
  if (parsed.success) return null;
  const issue = parsed.error.issues[0];
  const path = issue?.path.length ? ` en ${issue.path.join(" → ")}` : "";
  return `El XML contiene un dato inválido${path}. Revisa que sea un CFDI válido.`;
}

export function parseCfdiXml(
  xml: string,
  options: CfdiXmlParseOptions,
): CfdiImport {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const root = parsed.documentElement;
  if (
    !root ||
    isElement(root, "parsererror") ||
    findDescendant(parsed, "parsererror")
  ) {
    throw new CfdiXmlError(
      "No se pudo leer el XML. Revisa que el archivo esté bien formado.",
    );
  }

  const comprobante = isElement(root, "Comprobante")
    ? root
    : findDescendant(parsed, "Comprobante");
  if (!comprobante) {
    throw new CfdiXmlError(
      "El archivo no parece un CFDI: no encontramos el comprobante.",
    );
  }

  const emisor = requiredChild(comprobante, "Emisor", "el emisor");
  const receptor = requiredChild(comprobante, "Receptor", "el receptor");
  const issuerRfc = normalizeRfc(
    requiredAttribute(emisor, ["Rfc"], "el RFC del emisor"),
    "El emisor",
  );
  const receiverRfc = normalizeRfc(
    requiredAttribute(receptor, ["Rfc"], "el RFC del receptor"),
    "El receptor",
  );
  const cfdiType = requiredAttribute(
    comprobante,
    ["TipoDeComprobante"],
    "el tipo de comprobante",
  );
  const direction = inferDirection(
    issuerRfc,
    receiverRfc,
    options.organizationRfc,
    cfdiType,
  );
  const stamp = findDescendant(comprobante, "TimbreFiscalDigital");
  const cfdiUuid = (
    (stamp && readAttribute(stamp, ["UUID"])) ??
    readAttribute(comprobante, ["UUID"])
  )?.toUpperCase();
  if (!cfdiUuid || cfdiUuid.length < 8) {
    throw new CfdiXmlError(
      "El XML no tiene UUID fiscal. Solo se pueden importar CFDI timbrados.",
    );
  }

  const totalAmount = normalizeAmount(
    requiredAttribute(comprobante, ["Total"], "el total"),
  );
  const currencyFromXml = readAttribute(comprobante, ["Moneda"])?.toUpperCase();
  const fallbackCurrency = options.currency.trim().toUpperCase();
  const currency =
    currencyFromXml && currencyFromXml !== "XXX"
      ? currencyFromXml
      : fallbackCurrency;
  if (!CURRENCY_PATTERN.test(currency)) {
    throw new CfdiXmlError("El XML no incluye una moneda válida.");
  }

  const issuedAt = normalizeDateTime(
    requiredAttribute(comprobante, ["Fecha"], "la fecha de emisión"),
  );
  const dueDateValue = readAttribute(comprobante, [
    "FechaVencimiento",
    "FechaVence",
    "Vencimiento",
  ]);
  const dueOn = dueDateValue ? normalizeDate(dueDateValue) : undefined;
  const counterparty = direction === "receivable" ? receptor : emisor;
  const counterpartyName = readAttribute(counterparty, ["Nombre"])?.slice(
    0,
    200,
  );
  const fileName = options.fileName.trim() || "archivo.xml";
  const document = {
    cfdiUuid,
    direction,
    issuerRfc,
    receiverRfc,
    ...(counterpartyName ? { counterpartyName } : {}),
    issuedAt,
    ...(dueOn ? { dueOn } : {}),
    totalAmount,
    outstandingAmount: totalAmount,
    currency,
    paymentStatus: "pending" as const,
    metadata: {
      sourceFormat: "cfdi-xml",
      sourceFile: fileName.slice(0, 160),
      cfdiType: cfdiType.toUpperCase(),
      serie: readAttribute(comprobante, ["Serie"]) ?? null,
      folio: readAttribute(comprobante, ["Folio"]) ?? null,
    },
  };
  const payload = {
    sourceName: sourceName(fileName),
    documents: [document],
  };
  const error = invalidPayloadMessage(payload);
  if (error) throw new CfdiXmlError(error);
  return cfdiImportSchema.parse(payload);
}
