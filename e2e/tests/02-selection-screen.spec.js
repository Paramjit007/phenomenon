// @ts-check
/**
 * 02 — SelectionScreen
 * Verify the demo cards and template grid are rendered correctly.
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');

test.describe('SelectionScreen', () => {

  test.beforeAll(async () => {
    // Start from a clean state so SelectionScreen appears
    await api.deleteAllContracts();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for SelectionScreen root to appear
    await page.waitForSelector('[data-testid="selection-screen"]', { timeout: 10_000 });
  });

  test('shows PHENOMENON logo', async ({ page }) => {
    await expect(page.getByText('PHENOMENON').first()).toBeVisible();
    await expect(page.getByText('MOTOR DE INTELIGENCIA CONTRACTUAL')).toBeVisible();
  });

  test('shows KPMG featured demo card', async ({ page }) => {
    await expect(page.getByText('Hotel Mediterráneo Valencia 5*')).toBeVisible();
    await expect(page.getByRole('button', { name: /Abrir Demo KPMG/ })).toBeVisible();
  });

  test('shows Seguros featured demo card', async ({ page }) => {
    await expect(page.getByText('Caso Seguros')).toBeVisible();
    await expect(page.getByRole('button', { name: /Abrir Demo Seguros/ })).toBeVisible();
  });

  test('shows template grid with standard templates', async ({ page }) => {
    // These templates should always appear in the grid (not isDemo)
    await expect(page.getByText('Contrato Marco de Servicios')).toBeVisible();
    await expect(page.getByText('Contrato SaaS')).toBeVisible();
    await expect(page.getByText('Contrato de Distribución')).toBeVisible();
    await expect(page.getByText('Acuerdo de Confidencialidad Bilateral')).toBeVisible();
  });

  test('isDemo templates are NOT shown in the grid', async ({ page }) => {
    // Demo templates should only appear as featured cards, not in the grid
    const gridCount = await page.getByText('Seguro de Vida').count();
    const kpmgInGrid = await page.getByText('Arrendamiento de Cosa Futura (KPMG)').count();
    // The featured card text vs grid text — if the card shows it, grid should NOT separately
    expect(kpmgInGrid).toBeLessThanOrEqual(0); // excluded from grid
  });

  test('clicking CSM template navigates to main app', async ({ page }) => {
    await page.getByText('Contrato Marco de Servicios').click();
    // Main app header should appear
    await page.waitForSelector('[data-testid="phenomenon-header"]', { timeout: 15_000 });
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible();
  });
});
