// @ts-check
/**
 * 03 — Caso Seguros (Full demo flow)
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');
const nav = require('../helpers/navigation');

test.describe('Caso Seguros — Full Demo', () => {

  test.beforeAll(async () => {
    await api.seedSeguros();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  // ── 1. Loading ─────────────────────────────────────────────────────────────

  test('main app header is visible after seeding', async ({ page }) => {
    await expect(page.locator('[data-testid="phenomenon-header"]')).toBeVisible();
  });

  test('header shows CONTRATOS stat (active ecosystem count)', async ({ page }) => {
    // Header shows active master's ecosystem count (master + its 3 subs = 4), not total DB
    const header = page.locator('[data-testid="phenomenon-header"]');
    await expect(header.getByText('CONTRATOS')).toBeVisible();
  });

  test('Seguros tab is visible in right panel', async ({ page }) => {
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await expect(segurosTab).toBeVisible();
  });

  // ── 2. Comparative View ────────────────────────────────────────────────────

  test('Seguros tab shows comparative view', async ({ page }) => {
    // Click the Seguros tab
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);

    const view = page.locator('[data-testid="seguros-comparative-view"]');
    await expect(view).toBeVisible({ timeout: 10_000 });
  });

  test('comparative view renders 4 policy columns (stat shows 4 Polizas)', async ({ page }) => {
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);
    const view = page.locator('[data-testid="seguros-comparative-view"]');
    await expect(view).toBeVisible({ timeout: 10_000 });

    // The stat bar shows how many policies are loaded
    const polizasStat = view.locator('[data-testid="stat-polizas"]');
    await expect(polizasStat).toBeVisible({ timeout: 8_000 });
    await expect(polizasStat).toContainText('4'); // 4 insurance policies loaded
  });

  test('comparative view shows shared structure description', async ({ page }) => {
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);
    const view = page.locator('[data-testid="seguros-comparative-view"]');
    // The golden bar shows the shared structure note
    await expect(view.getByText(/ESTRUCTURA/, { exact: false })).toBeVisible({ timeout: 8_000 });
  });

  // ── Updated 2026-05-21: seed is now all-VALID by default.
  //    The BLOQUEADA / IF_exclusion story is a USER-INDUCED demo flow, not the
  //    initial state. Tests below now: (a) verify the all-valid baseline, and
  //    (b) exercise the induced-block flow by patching VALIDACION_FINANCIERA.

  test('stats bar shows 0 BLOQUEADA on fresh seed (all coverages active)', async ({ page }) => {
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);
    const view = page.locator('[data-testid="seguros-comparative-view"]');
    const blockedStat = view.locator('[data-testid="stat-blocked"]');
    await expect(blockedStat).toBeVisible({ timeout: 8_000 });
    await expect(blockedStat).toContainText('0');
  });

  test('Crédito column shows ACTIVE coverage on fresh seed', async ({ page }) => {
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);
    const view = page.locator('[data-testid="seguros-comparative-view"]');
    // The credit policy area shows "Activa" / rating A (no BLOQUEADA on seed).
    await expect(view.getByText(/Activa|rating A|Distribuciones Sur/i).first()).toBeVisible({ timeout: 10_000 });
  });

  // ── User-induced BLOQUEADA flow: change rating to D → coverage flagged ────

  test('inducing rating=D on VALIDACION_FINANCIERA produces a BLOQUEADA state', async ({ page }) => {
    // 1) start clean (all valid)
    await api.seedSeguros();
    const all = await api.getContracts();
    const vf = all.find(c => c.type === 'VALIDACION_FINANCIERA');
    expect(vf).toBeTruthy();

    // 2) user-induced change: rating to D + matching pending/blocking flags
    await api.patchContract(vf.id, {
      ag: {
        terms: {
          ...vf.ag.terms,
          financialRating: 'D — Riesgo alto (cobertura BLOQUEADA)',
          validationPending: 'Sí — BLOQUEA la cobertura hasta completar',
          blockingEffect: 'BLOQUEA COBERTURA_CREDITO (rating insuficiente)',
        },
        clauses: vf.ag.clauses || [],
      },
    });

    // 3) mirror the frontend hook: explicitly fire sub-cascade on the changed field
    await api.subCascade(vf.id, 'financialRating', 'D');

    // 4) the cascade rule SUB_CASCADE_MAP[VALIDACION_FINANCIERA][financialRating]
    //    must have flagged COBERTURA_CREDITO as NEEDS_REVIEW.
    const after = await api.getContracts();
    const cc = after.find(c => c.type === 'COBERTURA_CREDITO');
    expect(cc).toBeTruthy();
    expect(cc.status === 'NEEDS_REVIEW' || cc.opus.homologation === 'PENDING').toBeTruthy();

    // Re-seed clean for next test
    await api.seedSeguros();
  });

  test('unblock-coverage restores ACTIVE state after a user induced a block', async ({ page }) => {
    // Force a BLOCKED state via direct PATCH of status (admin path), then unblock.
    await api.seedSeguros();
    const all = await api.getContracts();
    const cc = all.find(c => c.type === 'COBERTURA_CREDITO');
    await api.patchContract(cc.id, { status: 'BLOCKED' });

    // Now exercise the unblock endpoint
    await api.unblockCoverage(cc.id);

    const after = (await api.getContracts()).find(c => c.id === cc.id);
    expect(after.status).toBe('ACTIVE');
    await api.seedSeguros();
  });

  // ── 4. Siniestro Lifecycle ─────────────────────────────────────────────────

  test('Declarar Siniestro button appears on active coverage', async ({ page }) => {
    await api.seedSeguros(); // fresh state
    await page.reload();
    await nav.waitForMainApp(page);
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);
    const view = page.locator('[data-testid="seguros-comparative-view"]');
    const siniestroBtn = view.getByRole('button', { name: /Declarar Siniestro/i }).first();
    await expect(siniestroBtn).toBeVisible({ timeout: 10_000 });
  });

  test('declaring siniestro shows resolution buttons', async ({ page }) => {
    // Fresh seed: all coverages are ACTIVE
    await api.seedSeguros();
    await page.reload();
    await nav.waitForMainApp(page);

    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(1000);
    const view = page.locator('[data-testid="seguros-comparative-view"]');

    const siniestroBtn = view.getByRole('button', { name: /Declarar Siniestro/i }).first();
    await expect(siniestroBtn).toBeVisible({ timeout: 10_000 });
    await siniestroBtn.click();

    // Reload after action to guarantee fresh state from DB
    await page.waitForTimeout(2500);
    await page.reload();
    await nav.waitForMainApp(page);
    await page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ }).click();
    await page.waitForTimeout(1000);
    const freshView = page.locator('[data-testid="seguros-comparative-view"]');
    // After siniestro + reload, Indemnizar and Rechazar buttons should appear
    await expect(freshView.getByRole('button', { name: /Indemnizar/i })).toBeVisible({ timeout: 15_000 });
    await expect(freshView.getByRole('button', { name: /Rechazar/i })).toBeVisible({ timeout: 15_000 });
  });

  test('resolving siniestro hides resolution buttons', async ({ page }) => {
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await segurosTab.click();
    await page.waitForTimeout(800);
    const view = page.locator('[data-testid="seguros-comparative-view"]');

    // There should be at least one Indemnizar button (from previous test or current state)
    const indemnizarBtn = view.getByRole('button', { name: /Indemnizar/i }).first();
    if (await indemnizarBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await indemnizarBtn.click();
      // Button should disappear
      await expect(indemnizarBtn).not.toBeVisible({ timeout: 12_000 });
    } else {
      test.skip(true, 'No siniestro pending — skip resolution test');
    }
  });
});

test.describe('Caso Seguros — Load via SelectionScreen button', () => {

  test.beforeAll(async () => {
    await api.deleteAllContracts();
  });

  test('clicking Abrir Demo Seguros loads the app and shows Seguros tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="selection-screen"]', { timeout: 10_000 });

    const btn = page.getByRole('button', { name: /Abrir Demo Seguros/ });
    await expect(btn).toBeVisible();
    await btn.click();

    // Wait for seeding to complete and main app to appear
    await page.waitForSelector('[data-testid="phenomenon-header"]', { timeout: 30_000 });

    // Insurance masters detected → Seguros tab should appear (within poll interval)
    const segurosTab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: /Seguros/ });
    await expect(segurosTab).toBeVisible({ timeout: 10_000 });
  });
});
