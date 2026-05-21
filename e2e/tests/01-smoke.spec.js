// @ts-check
/**
 * 01 — Smoke Tests
 * Verify the app loads, has no console errors, and the basic chrome is present.
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');
const { BACKEND_URL } = require('../helpers/config');

test.describe('Smoke — App health', () => {

  test.beforeAll(async () => {
    const ready = await api.isBackendReady();
    if (!ready) throw new Error(`Backend is not reachable at ${BACKEND_URL} — is Docker running?`);
  });

  test('frontend is reachable', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
  });

  test('page shows PHENOMENON logo text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('PHENOMENON').first()).toBeVisible({ timeout: 10_000 });
  });

  test('no Vite error overlay visible', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForTimeout(3000);
    const critical = errors.filter(e =>
      !e.includes('fast refresh') &&
      !e.includes('RISK_COLORS') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection') &&
      !e.includes('fonts.gstatic.com') &&    // Google Fonts CORS (origin differs in test env)
      !e.includes('Failed to load resource') // Font load failures (non-critical)
    );
    expect(critical, `Console errors:\n${critical.join('\n')}`).toHaveLength(0);
  });

  test('backend health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('GET /phenomena/ returns an array', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/phenomena/`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});
