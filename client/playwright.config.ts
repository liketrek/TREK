import { defineConfig, devices } from '@playwright/test'

/**
 * E2E harness for TREK's critical user flows (FE7).
 *
 * Two web servers are orchestrated: the Express/Nest backend on :3001 against an
 * isolated throwaway SQLite DB (e2e/server-launch.mjs sets TREK_DB_FILE + seeds a
 * known admin), and the Vite dev server on :5173 which proxies /api, /uploads,
 * /ws to the backend. Tests run serially against one worker so they share the
 * single seeded database deterministically.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Unauthenticated flows (login, register, public share) — no stored session.
    { name: 'public', testMatch: /\.public\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    // One-time login that persists a session for the authenticated flows.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'app',
      testMatch: /\.spec\.ts/,
      testIgnore: /(\.public\.spec\.ts|auth\.setup\.ts)/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.tmp/state.json' },
      dependencies: ['setup'],
    },
    // Documentation screenshots (`npm run shots`). Excluded from the normal e2e
    // run by its own testMatch — these capture artwork for wiki/assets/, they
    // assert nothing. 2x scale keeps text crisp at the sizes the wiki renders.
    // Populates the demo trip the screenshots are taken of. Separate project so
    // it runs exactly once, between auth and capture.
    {
      name: 'seed',
      testMatch: /seed\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.tmp/state.json' },
      dependencies: ['setup'],
    },
    {
      name: 'screenshots',
      testMatch: /\.shot\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.tmp/state.json',
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
      dependencies: ['seed'],
    },
  ],
  webServer: [
    {
      // Always start our own backend (never reuse) so the isolated test DB is
      // reset + reseeded on every run, regardless of any stray dev server.
      command: 'node e2e/server-launch.mjs',
      port: 3001,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
