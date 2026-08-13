import { test, expect, devices } from '@playwright/test'
import { dismissSystemNotices } from './helpers'

// Phone regression guard for #1809: the dashboard must scroll the DOCUMENT.
//
// iOS Safari minimises its address bar only in reaction to the root scroller
// moving. V4 blocked that twice over: html was globally overflow:hidden and the
// mobile shell added a scroll container of its own, so the gesture never
// reached the viewport and the bar kept ~1/6th of the screen forever. The bar
// itself is not observable from page context, but the invariant it hangs off is:
// document.scrollingElement has to move.
//
// Needs WebKit (`npx playwright install webkit`). playwright.config.ts has no
// webkit project, the engine comes from this file-level device (defaultBrowserType
// 'webkit'), same as e2e/ipad-scroll-1432.spec.ts. WebKit is the point here, not
// a nicety: viewport propagation and the toolbar behaviour are Safari's.
//
// The file sorts last in the e2e run, so the trips it seeds cannot show up in
// another spec's dashboard assertions.
test.use({ ...devices['iPhone 14'] })

function readScroll() {
  const el = document.scrollingElement as HTMLElement
  return {
    top: el.scrollTop,
    scrollHeight: el.scrollHeight,
    viewport: window.innerHeight,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
  }
}

test('#1809 iPhone: flow screens scroll the document, full-screen ones do not', async ({ page }) => {
  await page.goto('/dashboard')
  await dismissSystemNotices(page)

  // The context has to be the one from the report: phone width, coarse pointer.
  // If either is wrong, nothing below proves anything.
  const env = await page.evaluate(() => ({
    width: window.innerWidth,
    coarse: window.matchMedia('(pointer: coarse)').matches,
  }))
  expect(env.width, 'iPhone sits below the 768px phone breakpoint').toBeLessThan(768)
  expect(env.coarse, 'iPhone reports a coarse primary pointer').toBe(true)

  // Enough trips for the dashboard to overflow a phone screen.
  const stamp = Date.now()
  for (let i = 1; i <= 20; i++) {
    const res = await page.request.post('/api/trips', {
      data: { title: `URL bar ${stamp} ${i}`, start_date: '2099-06-01', end_date: '2099-06-10' },
    })
    expect(res.ok(), `seed trip ${i}`).toBeTruthy()
  }
  await page.reload()
  await dismissSystemNotices(page)
  await expect(page.getByText(`URL bar ${stamp} 1`).first()).toBeVisible({ timeout: 20_000 })

  // 1. The root scroller is unlocked and the page is longer than the viewport.
  const before = await page.evaluate(readScroll)
  expect(before.htmlOverflow, 'html must not lock the viewport scroller').not.toBe('hidden')
  expect(before.scrollHeight, 'dashboard is longer than one viewport').toBeGreaterThan(before.viewport)
  expect(before.top).toBe(0)

  // 2. Scrolling moves the document, the signal Safari retracts its bar for.
  await page.evaluate(() => window.scrollBy(0, 400))
  const scrolled = await page.evaluate(readScroll)
  expect(scrolled.top, 'the document itself scrolled').toBeGreaterThan(0)

  // 3. The brand tile scrolls the page back up (it used to walk up to the shell
  //    container, which no longer exists).
  await page.getByRole('button', { name: 'TREK' }).click()
  await expect.poll(() => page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)

  // 4. The shared body scroll lock: with the document as the scroller, an open
  //    sheet must freeze the page behind it and give the position back.
  await page.evaluate(() => window.scrollBy(0, 300))
  const locked = await page.evaluate(readScroll)
  expect(locked.top).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'New Trip' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.evaluate(() => window.scrollBy(0, 300))
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(locked.top)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(locked.top)
  await page.evaluate(() => window.scrollBy(0, 200))
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBeGreaterThan(locked.top)

  // 5. Counter-probe: the map screens keep their own full-viewport layout. They
  //    deliberately do NOT scroll the document (and so keep the address bar), and
  //    the map must not collapse to zero height now that the shell has none.
  await page.goto('/atlas')
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })
  const atlas = await page.evaluate(() => {
    const map = document.querySelector('.leaflet-container') as HTMLElement
    window.scrollBy(0, 400)
    return {
      top: document.scrollingElement!.scrollTop,
      mapHeight: map.getBoundingClientRect().height,
    }
  })
  expect(atlas.top, 'the atlas does not move the document').toBe(0)
  expect(atlas.mapHeight, 'the atlas map keeps a real height').toBeGreaterThan(200)
})
