import { test, expect, devices } from '@playwright/test'
import { dismissSystemNotices } from './helpers'

// Tablet regression guard for #1432 — the places list must scroll under a touch swipe.
//
// A tablet is a coarse-pointer device at a *desktop* viewport width, so the width-based
// "is this mobile" check that 3.2.1 shipped left `draggable` armed on iPad: the swipe
// became an HTML5 drag and raised the drop-to-import overlay instead of scrolling. What
// turned the swipe into a drag was the drag-drop-touch polyfill, confined to hybrid
// laptops since. #1616 then gave tablets their drag back on purpose, through the
// long-press bridge ([data-touch-drag]): a row may be draggable, but only a press that
// is held becomes a drag, so a swipe still scrolls. Only a real device context proves
// that; a jsdom unit test cannot express "coarse pointer at 834px".
//
// Needs WebKit (`npx playwright install webkit`, plus libmanette-0.2-0 and libwoff1 on
// Debian/Ubuntu). WebKit is the right engine here, not a nicety: every browser on iPadOS
// is WebKit underneath, which is why the reporter saw this in all three they tried.
test.use({ ...devices['iPad Pro 11'] })

test('#1432 iPad: the places list scrolls under a swipe', async ({ page }) => {
  await page.goto('/dashboard')

  await dismissSystemNotices(page)

  await page.locator('.add-trip-card').click()
  const createBtn = page.getByRole('button', { name: 'Create New Trip' })
  await expect(createBtn).toBeVisible()
  const title = `iPad 1432 ${Date.now()}`
  await page.getByPlaceholder('e.g. Summer in Japan').fill(title)
  await createBtn.click()

  await page.getByText(title).first().click()
  await expect(page).toHaveURL(/\/trips\/\d+/)
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })

  const tripId = page.url().match(/\/trips\/(\d+)/)![1]

  // Seed enough places for the list to overflow and actually need scrolling.
  for (let i = 1; i <= 25; i++) {
    const res = await page.request.post(`/api/trips/${tripId}/places`, {
      data: { name: `Place ${i}`, lat: 48.85 + i * 0.01, lng: 2.35 + i * 0.01 },
    })
    expect(res.ok(), `seed place ${i}`).toBeTruthy()
  }
  await page.reload()
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })

  // An iPad is inside the 768-1023px band, where only one side panel is open at a
  // time so the map keeps a usable width (#2247). The places list is one tap away.
  // Located by the tab's own aria-label, not by role+name: the tab bar carries a
  // "Plan" button of its own.
  await page.locator('button[aria-label="Places"]').click()
  await expect(page.getByText('Place 1').first()).toBeVisible({ timeout: 20_000 })

  // The context must really be the one from the bug report: coarse pointer, desktop
  // width. If either is wrong, everything below proves nothing.
  const env = await page.evaluate(() => ({
    coarse: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
  }))
  expect(env.coarse, 'iPad reports a coarse primary pointer').toBe(true)
  expect(env.width, 'iPad sits above the 768px "mobile" breakpoint').toBeGreaterThanOrEqual(768)

  // 1. A swipe must not become a drag. What turned it into one in #1432 was the
  //    drag-drop-touch polyfill; it belongs to hybrid laptops only now
  //    (utils/touchDragPolyfill.ts), so a tablet must never load it. A row may be
  //    draggable, but only behind the long-press bridge (#1616).
  const polyfillLoaded = await page.evaluate(() =>
    performance.getEntriesByType('resource').some(e => /drag-?drop-?touch/i.test(e.name)))
  expect(polyfillLoaded, 'the drag-drop-touch polyfill stays off a tablet').toBe(false)
  const row = page.locator('div[draggable]').filter({ hasText: 'Place 1' }).first()
  await expect(row).toBeVisible()
  const swipeSafe = await row.evaluate(el => el.getAttribute('draggable') !== 'true' || !!el.closest('[data-touch-drag]'))
  expect(swipeSafe, 'a draggable row sits behind the long-press bridge').toBe(true)

  // 2. The list must scroll, and no drop-to-import overlay may appear.
  // The list's scroll container carries trek-stagger among its other classes. Taken
  // from the row above: the first draggable on the page can be another panel's.
  const scroller = row.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " trek-stagger ")]')
  const before = await scroller.evaluate(el => el.scrollTop)
  const box = (await scroller.boundingBox())!
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 40)
  await scroller.evaluate(el => el.scrollBy(0, 200))
  const after = await scroller.evaluate(el => el.scrollTop)
  expect(after, 'places list scrolled').toBeGreaterThan(before)
  await expect(page.getByText('Drop to import')).toHaveCount(0)

  // 3. The iPad must still get the desktop shell — isMobile stayed width-based. One
  //    panel at a time (#2247), so opening Places closed the day plan and left its
  //    tab as the way back.
  await expect(page.locator('.leaflet-container')).toBeVisible()
  // The top tab bar has a button named Plan as well; the way back is the panel's
  // own tab, which is accented while its panel is closed.
  await expect(page.locator('button[aria-label="Plan"].bg-accent')).toBeVisible()
})
