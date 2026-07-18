import { test as base, expect, type Page, type Locator } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Shared plumbing for the documentation screenshot run (`npm run shots`).
 *
 * These are not assertions about behaviour — they drive the app to a known
 * state and capture it for the wiki. They live behind their own Playwright
 * project (`screenshots`, testMatch /\.shot\.ts/) so a normal `npm run e2e`
 * never pays for them.
 *
 * Output goes to a staging directory, NOT straight into wiki/assets/, so a
 * bad run can never clobber good artwork. Promote with `npm run shots:promote`.
 */

// Playwright runs from the client workspace root, matching how
// playwright.config.ts spells `storageState: 'e2e/.tmp/state.json'`.
export const OUT_DIR = path.join(process.cwd(), 'e2e', '.tmp', 'shots')

/** Desktop capture size. 2x scale keeps text crisp; images are squeezed on promote. */
export const VIEWPORT = { width: 1440, height: 900 }

export const test = base.extend<{ shot: Shot }>({
  // Overriding `page` (rather than doing this inside the `shot` fixture) is
  // deliberate: fixtures initialise lazily, so a route registered in `shot`
  // lands AFTER any beforeEach hook has already navigated — too late to
  // intercept the config request.
  page: async ({ page }, use) => {
    await page.setViewportSize(VIEWPORT)
    await hideDevOnlyUi(page)
    await use(page)
  },
  shot: async ({ page }, use) => {
    mkdirSync(OUT_DIR, { recursive: true })
    await use(new Shot(page))
  },
})

/**
 * The E2E backend runs with NODE_ENV=development, so /auth/app-config reports
 * `dev_mode: true` (authService.ts) and the admin sidebar grows a
 * "Dev: Notifications" tab that no real deployment ever shows.
 *
 * Rewriting the response is the surgical fix. Flipping the server to
 * NODE_ENV=production would also enable HSTS (globalMiddleware.ts), and an
 * HSTS header on localhost would upgrade the run to https and break it.
 */
async function hideDevOnlyUi(page: Page): Promise<void> {
  await page.route('**/api/auth/app-config', async route => {
    const res = await route.fetch()
    const body = await res.json()
    await route.fulfill({ response: res, json: { ...body, dev_mode: false } })
  })
}

export { expect }

export class Shot {
  constructor(private readonly page: Page) {}

  /**
   * Capture the full viewport. `name` is the target filename in wiki/assets/
   * (without extension) so the mapping from screenshot to doc page is literal.
   */
  async page_(name: string): Promise<void> {
    await this.settle()
    await this.page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) })
  }

  /** Capture one element — preferred for dialogs, panels and cards. */
  async element(name: string, target: Locator): Promise<void> {
    await this.settle()
    await expect(target).toBeVisible()
    await target.screenshot({ path: path.join(OUT_DIR, `${name}.png`) })
  }

  /**
   * Quiet the page before capturing: fonts loaded, images decoded, animations
   * finished, no pending network. Without this, screenshots catch skeleton
   * loaders and half-faded modals, which is exactly how the current wiki
   * assets ended up inconsistent.
   */
  private async settle(): Promise<void> {
    // Bounded: TREK holds a WebSocket open at /ws, so the network never goes
    // fully idle and an unbounded wait would burn the whole test timeout.
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
    // Await, but return nothing — the resolved FontFaceSet is not serialisable.
    await this.page.evaluate(async () => { await document.fonts.ready })
    await this.page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(res => { img.onload = img.onerror = res })),
      )
    })
    // Let CSS transitions land (modal fade-in, sidebar slide).
    await this.page.waitForTimeout(400)
  }
}

/**
 * Dismiss the first-run system notice. Copied in spirit from e2e/helpers.ts,
 * but tolerant: on a seeded DB the notice may already be cleared.
 */
export async function clearNotices(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: /next/i })
  for (let i = 0; i < 6 && (await next.isVisible().catch(() => false)); i++) {
    if (!(await next.isEnabled().catch(() => false))) break
    await next.click().catch(() => {})
  }
  for (const label of ['Dismiss', 'OK']) {
    const btn = page.getByRole('button', { name: label, exact: true })
    for (let i = 0; i < 4 && (await btn.isVisible().catch(() => false)); i++) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(300)
    }
  }
}
