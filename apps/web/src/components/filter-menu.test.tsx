import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FilterMenu } from "@/components/filter-menu";

describe("shared filter menu", () => {
  it.each([
    [0, "Filtros de movimientos", "outline"],
    [1, "Filtros de movimientos, 1 activo", "secondary"],
    [2, "Filtros de movimientos, 2 activos", "secondary"],
  ] as const)(
    "announces %i active filters and keeps controls closed initially",
    (activeCount, label, variant) => {
      const onClear = vi.fn();
      const html = renderToStaticMarkup(
        <FilterMenu
          label="Filtros de movimientos"
          activeCount={activeCount}
          onClear={onClear}
        >
          <label htmlFor="test-account">Cuenta</label>
          <select id="test-account">
            <option>Todas las cuentas</option>
          </select>
        </FilterMenu>,
      );
      expect(html).toContain(`aria-label="${label}"`);
      expect(html).toContain(`data-variant="${variant}"`);
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('type="button"');
      expect(html).not.toContain("test-account");
      expect(onClear).not.toHaveBeenCalled();
    },
  );
});
