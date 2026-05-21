/**
 * Navigation helpers — common wait patterns and UI interactions.
 */

/** Wait until the main app shell is visible (i.e. SelectionScreen is dismissed). */
async function waitForMainApp(page) {
  await page.waitForSelector('[data-testid="phenomenon-header"]', { timeout: 20_000 });
}

/** Wait until the SelectionScreen is visible. */
async function waitForSelectionScreen(page) {
  await page.waitForSelector('[data-testid="selection-screen"]', { timeout: 10_000 });
}

/** Click a right-panel tab by label text. */
async function clickTab(page, label) {
  // Tabs are buttons inside the right panel tab bar
  const tab = page.locator('[data-testid="right-panel-tabs"]').getByRole('button', { name: label });
  await tab.click();
  await page.waitForTimeout(500); // allow React to re-render tab content
}

/** Dismiss any visible impact notification. */
async function dismissNotification(page) {
  const closeBtn = page.locator('[data-testid="impact-notification"] button').last();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
  }
}

/** Wait for cascade flash animations to settle. */
async function waitForCascade(page) {
  await page.waitForTimeout(1500);
}

/** Wait until the verification panel shows results. */
async function waitForVerification(page) {
  await page.waitForSelector('[data-testid="verify-panel"]', { timeout: 15_000 });
}

module.exports = {
  waitForMainApp,
  waitForSelectionScreen,
  clickTab,
  dismissNotification,
  waitForCascade,
  waitForVerification,
};
