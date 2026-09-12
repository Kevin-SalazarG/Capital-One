import type { Invoice } from "@/lib/api/contracts";

export function filterInvoices(
  invoices: Invoice[],
  {
    search = "",
    direction = "",
    status = "",
    sort = "due",
  }: { search?: string; direction?: string; status?: string; sort?: string },
) {
  const term = search.trim().toLocaleLowerCase("es-MX");
  return invoices
    .filter(
      (invoice) =>
        (!direction || invoice.direction === direction) &&
        (!status || invoice.paymentStatus === status) &&
        (!term ||
          [
            invoice.counterpartyName,
            invoice.cfdiUuid,
            invoice.issuerRfc,
            invoice.receiverRfc,
          ].some((value) => value?.toLocaleLowerCase("es-MX").includes(term))),
    )
    .toSorted((a, b) =>
      sort === "name"
        ? (a.counterpartyName ?? a.cfdiUuid).localeCompare(
            b.counterpartyName ?? b.cfdiUuid,
            "es",
          )
        : (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999"),
    );
}
