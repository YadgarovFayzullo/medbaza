import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a real web + API pair (CLAUDE.md §11).
 *
 * Start both first:
 *   docker compose up -d db redis
 *   cd apps/api && alembic upgrade head && python -m app.scripts.seed && uvicorn app.main:app
 *   cd apps/web && pnpm dev
 */
const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    // Never record a video or a screenshot of a prescription document.
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
