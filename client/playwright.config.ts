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
/**
 * Ports. The defaults are what `npm run e2e` has always used. `npm run
 * help:media` (e2e/help/run.mjs) sets E2E_WEB_PORT/E2E_API_PORT to a second
 * pair so it can record while `npm run dev` keeps serving 5173/3001 to whoever
 * is watching. Environment only, no argv sniffing: Playwright's workers load
 * this file again with different arguments, and every process must agree.
 * vite.config.js honours TREK_DEV_PORT and TREK_DEV_API for the same reason.
 */
const WEB_PORT = Number(process.env.E2E_WEB_PORT) || 5173
const API_PORT = Number(process.env.E2E_API_PORT) || 3001
export const E2E_BASE_URL = `http://localhost:${WEB_PORT}`
/**
 * The session and the seed's ids belong to the database the run boots, which is
 * named after its API port (e2e/server-launch.mjs). Two runs on two port pairs
 * therefore share nothing, and the default port keeps the old file names.
 */
export const E2E_STATE_FILE = `e2e/.tmp/state-${API_PORT}.json`
export const E2E_SEED_FILE = `e2e/.tmp/seed-${API_PORT}.json`

// The day the seed and the pictures are relative to (e2e/dates.ts). Fixed here
// for every project and worker that loads this file, so a run that crosses
// midnight still agrees with itself; `help:media` sets it before this runs.
if (!process.env.E2E_PICTURE_DAY) {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  process.env.E2E_PICTURE_DAY = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

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
    baseURL: E2E_BASE_URL,
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
      use: { ...devices['Desktop Chrome'], storageState: E2E_STATE_FILE },
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
      use: { ...devices['Desktop Chrome'], storageState: E2E_STATE_FILE },
      dependencies: ['setup'],
    },
    {
      name: 'screenshots',
      testMatch: /\.shot\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: E2E_STATE_FILE,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
      dependencies: ['seed'],
    },
    // Help-center media (`npm run help:media`): pictures and walkthroughs for
    // the in-app guides, generated from the guide definitions in src/help/.
    // Same seed as the wiki screenshots; its own match so neither run pays
    // for the other. Serial and generous on time: a walkthrough is paced for
    // a human to follow.
    {
      name: 'help-media',
      testMatch: /\.guide\.ts/,
      // Four minutes. A guide is a whole task, and a few of them wait on the
      // network more than once: the nearby-places one runs two POI searches
      // against a public index and opens the place form on top of them, which
      // does not fit in the two and a half minutes this used to allow.
      timeout: 240_000,
      use: {
        ...devices['Desktop Chrome'],
        // The full Chrome for Testing build rather than the headless shell the
        // other projects run on. Only the full build carries the PDF viewer,
        // and the Files tab's preview embeds a PDF as <object>, which the
        // shell leaves as a "Download PDF" link. Still headless.
        channel: 'chromium',
        storageState: E2E_STATE_FILE,
        viewport: { width: 1920, height: 1080 },
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
      port: API_PORT,
      env: { E2E_API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      port: WEB_PORT,
      env: { TREK_DEV_PORT: String(WEB_PORT), TREK_DEV_API: `http://localhost:${API_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
