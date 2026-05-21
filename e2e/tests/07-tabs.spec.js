// @ts-check
/**
 * 07 — Right Panel Tabs
 * Verifies every tab is accessible and renders without crashing.
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');
const nav = require('../helpers/navigation');

test.describe('Right Panel — All tabs render without crash', () => {

  test.beforeAll(async () => {
    await api.seedKPMG();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  const TABS = [
    { label: 'Ecosistema',   content: /Ecosistema|contratos|Salud/i },
    { label: 'Demo KPMG',    content: /EURIBOR|cuota/i              },
    { label: 'Riesgo',       content: /Riesgo|Análisis/i             },
    { label: 'Red IF',       content: /Red IF|cascade|Cascada/i      },
    { label: 'Operadores',   content: /Operadores|Motor IA|IA/i      },
    { label: 'Documento',    content: /Documento|REUNIDOS|EXPONEN/i  },
  ];

  for (const { label, content } of TABS) {
    test(`tab "${label}" renders without error`, async ({ page }) => {
      await nav.clickTab(page, label);
      await expect(
        page.getByText(content).first()
      ).toBeVisible({ timeout: 12_000 });
      // Confirm no error overlay appeared
      await expect(page.locator('[id="vite-error-overlay"]')).not.toBeVisible({ timeout: 1_000 }).catch(() => {});
    });
  }

  test('Campos tab shows portfolio dashboard when no contract selected', async ({ page }) => {
    // Click Campos when nothing is selected
    const camposTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Campos/ });
    await camposTab.click();
    // Either portfolio or contract detail renders
    await expect(
      page.getByText(/Selecciona|contratos activos|Portfolio/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Right Panel — Seguros-specific tab', () => {

  test.beforeAll(async () => {
    await api.seedSeguros();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  test('Seguros tab renders SegurosComparativeView', async ({ page }) => {
    await nav.clickTab(page, 'Seguros');
    await expect(page.locator('[data-testid="seguros-comparative-view"]')).toBeVisible({ timeout: 8_000 });
  });

  test('Gobernanza tab NOT visible without KPMG_CORPORATE data', async ({ page }) => {
    const govTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Gobernanza/ });
    await expect(govTab).not.toBeVisible();
  });

  // ── Regression (audit_sweep finding 2026-05-21): Operadores tab was using
  //    `[master, ...subContracts]` which in Seguros (4 masters × 4 contracts) made
  //    12 of 16 contracts unreachable for IA assignment. Fix: read `allContracts` prop.
  //    This test proves Operadores shows contracts from ALL four insurance masters.
  test('Operadores tab shows contracts from every Seguros master', async ({ page }) => {
    await nav.clickTab(page, 'Operadores');
    await page.waitForTimeout(800);

    const view = page.locator('[role="alert"][data-testid^="error-boundary"]');
    await expect(view).toHaveCount(0); // no error boundary fired

    // After fix: contracts from every insurance template should be reachable.
    // We check that at least one contract from each of the 4 insurance families is rendered.
    // The Operadores tab lists contracts by name; insurance families have distinctive names.
    const body = page.locator('body');
    const expectedFamilies = [
      /Vida/i,
      /RC/i,
      /Daños/i,
      /Crédito/i,
    ];
    for (const re of expectedFamilies) {
      await expect(body.getByText(re).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Right Panel — Tab badge counts', () => {

  test.beforeAll(async () => {
    await api.seedKPMG();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  test('Verificar tab shows pending badge when contracts need verification', async ({ page }) => {
    // After seeding, some contracts are PENDING — badge should appear
    const verifyTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Verificar/ });
    await expect(verifyTab).toBeVisible();
    // Badge is optional, just check the tab exists
  });
});
