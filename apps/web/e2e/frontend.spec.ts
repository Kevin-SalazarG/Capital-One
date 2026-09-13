import { expect, test } from "@playwright/test";
import { DEMO_ORGANIZATION } from "../src/demo/fixtures";

test("all demo routes render without external API requests", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  for (const [path, title] of [
    ["dashboard", "Protege la nómina antes del faltante."],
    ["commitments", "Los pagos que sostienen tu obra."],
    ["invoices", "Avances, materiales y pagos."],
    ["bank", "La cuenta de operación."],
  ]) {
    await page.goto(`/demo/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      title ?? "",
    );
    await expect(page.getByText("No pudimos cargar esta vista")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(requests).toEqual([]);
});

test("cash alert opens an editable email modal without leaving the dashboard", async ({
  page,
}) => {
  await page.goto("/demo/dashboard");

  await page.getByRole("button", { name: "Revisar y enviar" }).click();

  const dialog = page.getByRole("dialog", {
    name: "Revisa el correo antes de enviarlo",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("maria@example.com", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Asunto")).toHaveValue(
    "Colchón: posible faltante el 29 sep",
  );
  await expect(dialog.getByLabel("Mensaje")).toHaveValue(
    /podría tener un faltante de \$14,000\.00 el 29 sep/,
  );
  await expect(
    dialog.getByRole("button", { name: "Enviar correo", exact: true }),
  ).toBeEnabled();

  await dialog.getByRole("button", { name: "Cerrar", exact: true }).last().click();
  await expect(dialog).toHaveAttribute("data-state", "closed");
  await expect(page).toHaveURL(/\/demo\/dashboard$/);
});

test("invoice filters retain complete search text and details are keyboard accessible", async ({
  page,
}) => {
  await page.goto("/demo/invoices");
  const filterButton = page.getByRole("button", {
    name: /^Filtros de facturas/,
  });
  const input = page.getByRole("searchbox", { name: "Buscar", exact: true });
  await expect(input).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await input.pressSequentially("Casa Roble", { delay: 15 });
  await expect(input).toHaveValue("Casa Roble");
  await expect(page.getByRole("status")).toContainText("1 registro");
  await filterButton.click();
  await expect(
    page.getByRole("dialog", { name: "Filtros", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("receivable");
  await page.keyboard.press("Escape");
  await expect(filterButton).toBeFocused();
  await expect(filterButton).toHaveAccessibleName(
    "Filtros de facturas, 1 activo",
  );
  const invoice = page.getByRole("link", {
    name: "Ver detalle de Casa Roble · Estimación 02",
    exact: true,
  });
  await invoice.click();
  await expect(page).toHaveURL(/\/demo\/invoices\/i-1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Casa Roble · Estimación 02",
  );
  await expect(
    page.getByText("CFDI-ENCINO-i-1", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(input).toHaveValue("Casa Roble");
  await page.reload();
  await expect(input).toHaveValue("Casa Roble");
  await filterButton.click();
  await expect(
    page.getByRole("combobox", { name: "Tipo", exact: true }),
  ).toHaveValue("receivable");
  await page.getByRole("button", { name: "Limpiar", exact: true }).click();
  await expect(input).toHaveValue("Casa Roble");
  await expect(filterButton).toHaveAccessibleName("Filtros de facturas");
  await page.getByRole("button", { name: "Listo", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("invoice rows and mobile cards open from outside the name and preserve keyboard access", async ({
  page,
  isMobile,
}) => {
  await page.goto("/demo/invoices");
  const invoice = page.getByRole("link", {
    name: "Ver detalle de Casa Roble · Estimación 02",
    exact: true,
  });
  const item = page
    .getByRole(isMobile ? "listitem" : "row")
    .filter({ has: invoice });
  const bounds = await item.boundingBox();
  if (!bounds) throw new Error("Invoice row is not visible");

  // Hit the right-hand padding, away from the visible name.
  await item.click({
    position: { x: bounds.width - 12, y: bounds.height - 12 },
  });
  await expect(page).toHaveURL(/\/demo\/invoices\/i-1$/);
  await expect(
    page.getByText("CFDI-ENCINO-i-1", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(invoice).toBeVisible();

  await invoice.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/demo\/invoices\/i-1$/);
  await expect(
    page.getByText("CFDI-ENCINO-i-1", { exact: true }),
  ).toBeVisible();

  await page.goBack();
  await expect(
    page.getByRole("searchbox", { name: "Buscar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Filtros de facturas", exact: true }),
  ).toBeVisible();
});

test("bank keeps search visible and groups persistent filters without clearing the search", async ({
  page,
}) => {
  await page.goto("/demo/bank");
  const search = page.getByRole("searchbox", {
    name: "Buscar movimiento",
    exact: true,
  });
  const trigger = page.getByRole("button", { name: /^Filtros de movimientos/ });
  await expect(search).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await search.fill("Renta");
  await expect(page.getByRole("status")).toHaveText("1 registro");

  await trigger.click();
  await page
    .getByRole("combobox", { name: "Cuenta", exact: true })
    .selectOption("example-account");
  await page
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("inflow");
  await expect(
    page.getByRole("heading", { name: "No hay movimientos para esta vista" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("outflow");
  await expect(page.getByRole("status")).toHaveText("1 registro");
  await expect(trigger).toHaveAccessibleName(
    "Filtros de movimientos, 2 activos",
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  await page.reload();
  await expect(search).toHaveValue("Renta");
  await trigger.click();
  await expect(
    page.getByRole("combobox", { name: "Cuenta", exact: true }),
  ).toHaveValue("example-account");
  await expect(
    page.getByRole("combobox", { name: "Tipo", exact: true }),
  ).toHaveValue("outflow");
  await page.getByRole("button", { name: "Limpiar", exact: true }).click();
  await expect(search).toHaveValue("Renta");
  await expect(trigger).toHaveAccessibleName("Filtros de movimientos");
  await expect(page.getByRole("status")).toHaveText("1 registro");
  await page.getByRole("button", { name: "Listo", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("bank opens the connection editor without leaving the page", async ({
  page,
}) => {
  await page.goto("/demo/bank");
  const trigger = page.getByRole("button", {
    name: "Conexiones",
    exact: true,
  });

  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Agregar conexión" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText(
      "Estás viendo datos de ejemplo. Conecta tu empresa para guardar una fuente.",
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Agregar conexión", exact: true }),
  ).toBeDisabled();

  await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(dialog).toHaveAttribute("data-state", "closed");
  await expect(page).toHaveURL(/\/demo\/bank$/);
});

test("viewer cannot reach privileged views or issue writes", async ({
  page,
}) => {
  const writes: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    if (route.request().method() !== "GET") writes.push(path);
    const data =
      path === "/me"
        ? {
            user: { id: "viewer", email: "viewer@example.com" },
            organizations: [
              {
                ...DEMO_ORGANIZATION,
                role: "viewer",
                permissions: [
                  "organization:read",
                  "dashboard:read",
                  "forecast:read",
                  "recommendation:read",
                ],
              },
            ],
          }
        : null;
    await route.fulfill({ json: { data, meta: { requestId: "test-viewer" } } });
  });
  await page.goto(`/app/${DEMO_ORGANIZATION.id}/dashboard`);
  await expect(
    page.getByRole("heading", { name: "Tu acceso es de consulta" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Actualizar proyección" }),
  ).toHaveCount(0);
  await page.goto(`/app/${DEMO_ORGANIZATION.id}/settings/connections`);
  await expect(
    page.getByRole("heading", { name: "Esta vista necesita otro acceso" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Agregar conexión" }),
  ).toHaveCount(0);
  expect(writes).toEqual([]);
});

test("company validation blocks empty names and displays backend failures", async ({
  page,
}) => {
  const writes: unknown[] = [];
  await page.route("**/api/v1/**", async (route) => {
    if (route.request().method() === "PATCH") {
      writes.push(route.request().postDataJSON());
      await route.fulfill({
        status: 500,
        json: {
          error: { code: "INTERNAL_ERROR" },
          meta: { requestId: "test-save" },
        },
      });
      return;
    }
    await route.fulfill({
      json: {
        data: {
          user: { id: "owner", email: "owner@example.com" },
          organizations: [DEMO_ORGANIZATION],
        },
        meta: { requestId: "test-owner" },
      },
    });
  });
  await page.goto(`/app/${DEMO_ORGANIZATION.id}/settings/company`);
  await page.getByLabel("Nombre de la empresa", { exact: true }).fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Escribe al menos 2 caracteres.")).toBeVisible();
  expect(writes).toHaveLength(0);
  await page
    .getByLabel("Nombre de la empresa", { exact: true })
    .fill("Empresa editada");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "No pudimos",
  );
  await expect(
    page.getByLabel("Nombre de la empresa", { exact: true }),
  ).toHaveValue("Empresa editada");
  expect(writes).toHaveLength(1);
});
