/**
 * Shared configuration for E2E tests.
 * BACKEND_URL: the URL the Node.js test runner process uses to call the API directly.
 * FRONTEND_URL: the URL the Playwright browser navigates to (always localhost since Chromium is Windows-native).
 */
const BACKEND_URL  = process.env.BACKEND_URL  || 'http://host.docker.internal:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://host.docker.internal:5173';

module.exports = { BACKEND_URL, FRONTEND_URL };
