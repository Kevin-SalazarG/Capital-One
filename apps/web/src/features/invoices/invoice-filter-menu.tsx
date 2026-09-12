"use client";

import { FilterMenu } from "@/components/filter-menu";
import { Field, NativeSelect } from "@/components/forms/field";
import { useListFilters } from "@/features/workspace/use-list-filters";
import { PAYMENT_LABELS } from "@/lib/formatters";

export function InvoiceFilterMenu({
  direction,
  status,
}: {
  direction: string;
  status: string;
}) {
  const filters = useListFilters();
  const sort = filters.get("sort") === "name" ? "name" : "due";
  const activeCount = [direction, status, sort === "name"].filter(
    Boolean,
  ).length;

  return (
    <FilterMenu
      label="Filtros de facturas"
      activeCount={activeCount}
      onClear={() =>
        filters.setFilters({ direction: "", status: "", sort: "" })
      }
    >
      <Field id="invoice-direction" label="Tipo">
        <NativeSelect
          id="invoice-direction"
          value={direction}
          onChange={(event) =>
            filters.setFilter("direction", event.target.value)
          }
        >
          <option value="">Cobros y pagos</option>
          <option value="receivable">Por cobrar</option>
          <option value="payable">Por pagar</option>
        </NativeSelect>
      </Field>
      <Field id="invoice-status" label="Estado">
        <NativeSelect
          id="invoice-status"
          value={status}
          onChange={(event) => filters.setFilter("status", event.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="invoice-sort" label="Ordenar por">
        <NativeSelect
          id="invoice-sort"
          value={sort}
          onChange={(event) =>
            filters.setFilter(
              "sort",
              event.target.value === "due" ? "" : event.target.value,
            )
          }
        >
          <option value="due">Vencimiento</option>
          <option value="name">Nombre</option>
        </NativeSelect>
      </Field>
    </FilterMenu>
  );
}
