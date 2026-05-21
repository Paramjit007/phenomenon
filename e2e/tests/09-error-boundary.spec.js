// @ts-check
/**
 * 09 — Error Boundary
 *
 * Verifies that when a panel's render throws, the error is caught by its
 * ErrorBoundary and a fallback UI appears in place — the rest of the app
 * keeps working, and we never get a blank page.
 *
 * The trigger mechanism: `ErrorTriggerForTests` reads `window.__phenomenonForceError`
 * on each render. Setting that flag from Playwright and reloading produces a
 * deterministic, scoped render error.
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');
const nav = require('../helpers/navigation');

test.describe('Error Boundary — catches render errors, keeps the app alive', () => {

  test('top-level boundary catches selection-screen render error', async ({ page }) => {
    await api.deleteAllContracts();

    // Arm the trigger BEFORE the page loads so it fires on first render.
    await page.addInitScript(() => {
      window.__phenomenonForceError = 'selection-screen';
    });

    await page.goto('/');

    // The boundary fallback for scope="selection-screen" should appear.
    const fallback = page.locator('[data-testid="error-boundary-selection-screen"]');
    await expect(fallback).toBeVisible({ timeout: 10_000 });

    // It must mention the scope so the user knows which area failed.
    await expect(fallback).toContainText(/selection-screen/i);

    // Retry button must be present and clickable.
    const retry = page.locator('[data-testid="error-boundary-selection-screen-retry"]');
    await expect(retry).toBeVisible();
  });

  test('retry button re-mounts the subtree (after disarming the trigger)', async ({ page }) => {
    await api.deleteAllContracts();

    await page.addInitScript(() => {
      window.__phenomenonForceError = 'selection-screen';
    });

    await page.goto('/');
    const fallback = page.locator('[data-testid="error-boundary-selection-screen"]');
    await expect(fallback).toBeVisible({ timeout: 10_000 });

    // Disarm the trigger, then click retry — selection screen should render normally.
    await page.evaluate(() => { window.__phenomenonForceError = null; });
    await page.locator('[data-testid="error-boundary-selection-screen-retry"]').click();

    await expect(page.locator('[data-testid="selection-screen"]')).toBeVisible({ timeout: 10_000 });
  });

  test('seguros panel error stays scoped — app shell remains intact', async ({ page }) => {
    await api.seedSeguros();

    // Arm trigger for the seguros scope only.
    await page.addInitScript(() => {
      window.__phenomenonForceError = 'seguros';
    });

    await page.goto('/');
    await nav.waitForMainApp(page);

    // Header must be visible — that's the proof we did NOT blank the screen.
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible();

    // Click the Seguros tab — boundary fires, fallback appears.
    const tab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await tab.click();

    const fallback = page.locator('[data-testid="error-boundary-seguros"]');
    await expect(fallback).toBeVisible({ timeout: 10_000 });

    // Header is STILL visible after the panel crashed — this is the key invariant.
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible();

    // Other tabs remain usable.
    const ecoTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Ecosistema/ });
    await ecoTab.click();
    await page.waitForTimeout(500);
    // Header still there, no crash propagated.
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible();
  });

  test('details toggle reveals the stack trace', async ({ page }) => {
    await api.deleteAllContracts();

    await page.addInitScript(() => {
      window.__phenomenonForceError = 'selection-screen';
    });

    await page.goto('/');
    const fallback = page.locator('[data-testid="error-boundary-selection-screen"]');
    await expect(fallback).toBeVisible({ timeout: 10_000 });

    // Click "Ver detalles técnicos" — stack panel appears.
    await page.getByRole('button', { name: /Ver detalles t/i }).click();
    await expect(fallback.locator('pre')).toBeVisible({ timeout: 3_000 });
  });

});
