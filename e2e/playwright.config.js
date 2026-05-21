// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './reports/test-results',
  fullyParallel: false,   // Tests share state (seeded DB) — run sequentially per file
  workers: 1,             // One browser at a time (single Docker DB)
  retries: 1,             // Retry once on flake
  timeout: 45_000,        // 45s per test (API seeding + React render)
  expect: { timeout: 15_000 },

  reporter: [
    ['html',  { outputFolder: './reports/html',                open: 'never'  }],
    ['json',  { outputFile:   './reports/results.json'                        }],
    ['junit', { outputFile:   './reports/results.xml'                         }],
    ['list'],
  ],

  use: {
    baseURL:      'http://host.docker.internal:5173',
    screenshot:   'only-on-failure',
    video:        'retain-on-failure',
    trace:        'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,

    // Chromium viewport matching a QHD monitor
    viewport: { width: 1440, height: 900 },

    // Extra HTTP headers for Playwright's request fixture (used in cascade/API tests)
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  },

  // Environment variables available to test files
  env: {
    BACKEND_URL: 'http://host.docker.internal:8000',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add Firefox / WebKit:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari']  } },
  ],
});
