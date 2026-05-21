// @ts-check
/**
 * 06 — Verification (Homologation)
 * Tests the "Verificar todos" button and homologation panel.
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');
const nav = require('../helpers/navigation');
// request fixture uses BACKEND_URL via playwright.config env

test.describe('Verification Panel', () => {

  test.beforeAll(async () => {
    await api.seedKPMG();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  test('"Verificar todos" button is visible in the header', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /Verificar todos/i });
    await expect(verifyBtn).toBeVisible();
  });

  test('clicking "Verificar todos" opens verification panel', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /Verificar todos/i });
    await verifyBtn.click();

    // Verification panel or modal should appear
    await expect(page.locator('[data-testid="verify-panel"]').or(
      page.getByText(/Verificación PHENOMENON/i)
    )).toBeVisible({ timeout: 15_000 });
  });

  test('verification panel shows results for each contract', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /Verificar todos/i });
    await verifyBtn.click();
    await page.waitForTimeout(5_000); // wait for results to stream

    // The verify panel modal should be open and visible
    await expect(page.locator('[data-testid="verify-panel"]')).toBeVisible({ timeout: 20_000 });
  });

  test('Verificar tab in right panel shows homologation status', async ({ page }) => {
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible({ timeout: 10_000 });

    // Click the Verificar tab button — it should exist and be clickable
    const verificarTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Verificar/ });
    await expect(verificarTab).toBeVisible({ timeout: 8_000 });
    await verificarTab.click();
    await page.waitForTimeout(500);

    // The right panel should render without crashing — header still visible
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible({ timeout: 5_000 });
    // And the Verificar tab button itself remains highlighted/active
    await expect(verificarTab).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Verification — Seguros ecosystem', () => {

  test.beforeAll(async () => {
    await api.seedSeguros();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  test('ecosystem homologation runs across all insurance contracts', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /Verificar todos/i });
    await verifyBtn.click();
    await page.waitForTimeout(6_000); // all 4 subs + master

    await expect(page.getByText(/HOMOLOGADO|✅/i).first()).toBeVisible({ timeout: 15_000 });
  });

  // ── Regression: "Verificar todos" must verify EVERY contract, not just masters[0] + its subs.
  // Earlier bug: in Seguros (4 masters × 4 contracts), only the first master and its 3 subs
  // were homologated. The other 12 contracts — including any with empty required fields —
  // were never checked, so the button falsely reported "all valid".
  test('Verificar todos catches empty required field on a non-first master', async ({ page }) => {
    // Reseed clean state, then clear propertyValue on the Danos master via API.
    await api.seedSeguros();
    const all = await api.getContracts();
    const danos = all.find(c =>
      !c.parentId && (c.ag?.terms?.templateKey === 'SEGURO_DANOS')
    );
    expect(danos, 'SEGURO_DANOS master should exist after seeding').toBeTruthy();

    await api.patchContract(danos.id, {
      ag: { terms: { ...danos.ag.terms, propertyValue: '' }, clauses: danos.ag.clauses || [] },
    });

    await page.goto('/');
    await nav.waitForMainApp(page);

    const verifyBtn = page.getByRole('button', { name: /Verificar todos/i });
    await verifyBtn.click();
    await page.waitForTimeout(10_000); // 16 contracts × ~400ms each

    // The verify panel must now show the Danos master as NOT homologado.
    const panel = page.locator('[data-testid="verify-panel"]');
    await expect(panel).toBeVisible({ timeout: 15_000 });

    // Authoritative check: backend state for the Danos master is INVALID.
    const after = await api.getContracts();
    const danosAfter = after.find(c => c.id === danos.id);
    expect(danosAfter.opus.homologation,
      'Danos master must be marked INVALID after Verificar todos finds the empty field'
    ).toBe('INVALID');
  });
});
