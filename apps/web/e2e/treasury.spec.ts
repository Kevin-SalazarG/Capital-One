import { expect, test } from "@playwright/test";

test("owner compares, saves and follows an agreement without manufacturing cash", async ({
  page,
}) => {
  await page.goto("/demo/dashboard");
  const metrics = page.getByRole("region", {
    name: "Resumen de caja sin cambios",
  });
  await expect(metrics).toContainText("-$14,000.00");
  await page
    .getByRole("button", {
      name: /Mejor resultado simulado Cobrar a Hotel Alameda/,
    })
    .click();
  await expect(
    page.getByRole("img", { name: /Con plan:.*41,700/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver tabla", exact: true }).click();
  const payroll = page.getByRole("row").filter({ hasText: "25 sep" });
  await expect(payroll).toContainText("-$9,200.00");
  await expect(payroll).toContainText("$46,500.00");
  await page.getByRole("button", { name: "Ver gráfica", exact: true }).click();
  await page
    .getByRole("button", { name: "Elegir este plan", exact: true })
    .click();
  const state = page.getByRole("combobox", {
    name: "Estado del acuerdo con Hotel Alameda",
  });
  await state.selectOption("contacted");
  await expect(state).toHaveValue("contacted");
  await state.selectOption("agreed");
  await expect(state).toHaveValue("agreed");
  await expect(metrics).toContainText("-$14,000.00");
  await page.reload();
  await expect(state).toHaveValue("agreed");
  await expect(metrics).toContainText("-$14,000.00");
});

test("stress recalculates offline, cannot be saved, and resets to original dates", async ({
  page,
}) => {
  await page.goto("/demo/dashboard");
  await page.getByText("¿Y si un cliente paga tarde?", { exact: true }).click();
  const receipt = page.getByLabel(
    "Retrasa un cobro 7 días. No modifica tus facturas.",
  );
  await receipt.selectOption("alameda");
  await expect(page.getByRole("status")).toContainText(
    "Prueba de estrés activa",
  );
  await expect(
    page.getByRole("button", { name: /Cobrar a Hotel Alameda/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Mejor resultado simulado/ }).click();
  await expect(
    page.getByRole("button", { name: "Elegir este plan", exact: true }),
  ).toBeDisabled();
  await receipt.selectOption("");
  await page.getByRole("button", { name: /Cobrar a Hotel Alameda/ }).click();
  await expect(
    page.getByRole("button", { name: "Elegir este plan", exact: true }),
  ).toBeEnabled();
});

test("retired demo pages return 404 and are absent from navigation", async ({
  page,
}) => {
  for (const route of [
    "settings/team",
    "settings/company",
    "settings/connections",
    "settings/obligations",
    "help",
    "onboarding",
  ]) {
    const response = await page.goto(`/demo/${route}`);
    expect(response?.status()).toBe(404);
  }
  await page.goto("/demo/dashboard");
  await expect(
    page.getByRole("link", { name: "Equipo", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Configuración", exact: true }),
  ).toHaveCount(0);
});

test("reduced motion and larger text keep the decision flow usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/dashboard");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "24px";
  });
  const plan = page.getByRole("button", { name: /Cobrar a Hotel Alameda/ });
  await plan.focus();
  await page.keyboard.press("Enter");
  await expect(plan).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Elegir este plan", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
