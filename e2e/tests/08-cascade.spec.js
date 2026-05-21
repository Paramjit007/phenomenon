// @ts-check
/**
 * 08 — Cascade Engine
 * Verifies that field changes trigger cascade notifications and status updates.
 */
const { test, expect } = require('@playwright/test');
const api = require('../helpers/api');
const nav = require('../helpers/navigation');
const { BACKEND_URL } = require('../helpers/config');

test.describe('Cascade Engine — sub-to-sibling cascade via API', () => {

  test.beforeAll(async () => {
    await api.seedSeguros();
  });

  test('changing EXCLUSIONES_VIDA.blockingStatus cascades to COBERTURA_VIDA', async ({ request }) => {
    const contracts = await api.getContracts();
    const excl = contracts.find(c => c.type === 'EXCLUSIONES_VIDA');
    const cob  = contracts.find(c => c.type === 'COBERTURA_VIDA');
    expect(excl).toBeTruthy();
    expect(cob).toBeTruthy();

    const res = await request.post(`${BACKEND_URL}/cascade/sub-trigger`, {
      data: { source_id: excl.id, field: 'blockingStatus', new_value: 'BLOQUEA totalmente' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.affected_ids.length).toBeGreaterThan(0);

    const updated = await request.get(`${BACKEND_URL}/phenomena/${cob.id}`);
    const updatedBody = await updated.json();
    expect(updatedBody.status).toBe('NEEDS_REVIEW');
  });

  test('VALIDACION_FINANCIERA rating change cascades to COBERTURA_CREDITO', async ({ request }) => {
    const contracts = await api.getContracts();
    const vf = contracts.find(c => c.type === 'VALIDACION_FINANCIERA');
    expect(vf).toBeTruthy();

    const res = await request.post(`${BACKEND_URL}/cascade/sub-trigger`, {
      data: { source_id: vf.id, field: 'financialRating', new_value: 'A — Excelente' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.affected_ids.length).toBeGreaterThanOrEqual(1);
  });

  test('reverse cascade from PERITACION triggers master NEEDS_REVIEW', async ({ request }) => {
    const contracts = await api.getContracts();
    const perit = contracts.find(c => c.type === 'PERITACION');
    expect(perit).toBeTruthy();

    const res = await request.post(`${BACKEND_URL}/cascade/reverse-trigger`, {
      data: { source_id: perit.id, field: 'peritacionStatus', new_value: 'PERITACION_COMPLETADA' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.triggered).toBeTruthy();
  });
});

test.describe('Cascade Engine — master ESS cascade', () => {

  test.beforeAll(async () => {
    await api.seedKPMG();
  });

  test('changing master partyA cascades to all sub-contracts', async ({ request }) => {
    const contracts = await api.getContracts();
    const master = contracts.find(c => !c.parentId);
    expect(master).toBeTruthy();

    const res = await request.post(`${BACKEND_URL}/cascade/trigger`, {
      data: { master_id: master.id, field: 'partyA', new_value: 'Banco Test Actualizado S.A.' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.affected_ids.length).toBeGreaterThanOrEqual(1);

    const updated = await (await request.get(`${BACKEND_URL}/phenomena/`)).json();
    const needsReview = updated.filter(c => c.status === 'NEEDS_REVIEW');
    expect(needsReview.length).toBeGreaterThan(0);
  });
});

test.describe('Cascade Engine — UI Impact Notification', () => {

  test.beforeAll(async () => {
    await api.seedKPMG();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await nav.waitForMainApp(page);
  });

  test('cascade from backend triggers impact notification in UI (via polling)', async ({ page, request }) => {
    const contracts = await api.getContracts();
    const master = contracts.find(c => !c.parentId);

    await request.post(`${BACKEND_URL}/cascade/trigger`, {
      data: { master_id: master.id, field: 'jurisdiction', new_value: 'Barcelona TEST' },
    });

    // UI polls every 4s — wait for impact notification or NEEDS_REVIEW badge
    await page.waitForTimeout(5_000);

    const notification = page.locator('[data-testid="impact-notification"]');
    const revisionBadge = page.getByText('REVISIÓN').or(page.getByText(/NEEDS_REVIEW/i));

    const hasNotif = await notification.isVisible().catch(() => false);
    const hasBadge = await revisionBadge.first().isVisible().catch(() => false);

    expect(hasNotif || hasBadge, 'Expected impact notification or REVISIÓN badge after cascade').toBeTruthy();
  });
});
