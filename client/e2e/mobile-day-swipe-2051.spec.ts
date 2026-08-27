import { test, expect, devices } from '@playwright/test'
import type { Page } from '@playwright/test'
import { dismissSystemNotices } from './helpers'

// Phone coverage for #2051: the day details area steps days under a horizontal
// swipe, so the trip is navigable one-handed instead of only from the chip rail
// pinned to the top of the screen.
//
// jsdom can drive the handlers but not the browser around them: whether the
// gesture survives real touch dispatch, whether the browser hands the vertical
// axis to its own scroller first, and whether a swipe at the first day stays put
// are all engine behaviour. This drives CDP's Input.dispatchTouchEvent, so the
// events are the ones a finger produces — not synthesised TouchEvent objects.
//
// Chromium, because CDP is where real touch injection lives. The file-level
// device sets a phone viewport with a coarse pointer, which is what puts the
// mobile shell on screen at all.
test.use({ ...devices['Pixel 7'] })

/** One finger, dispatched through the browser's own input pipeline. */
async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 8) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] })
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      }],
    })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
  // The out leg is 150ms and the in leg 220ms.
  await page.waitForTimeout(500)
}

const activeChip = (page: Page) => page.locator('button[aria-current="true"]')

test('#2051 phone: the day details area swipes between days', async ({ page }) => {
  await page.goto('/dashboard')
  await dismissSystemNotices(page)

  // Without a phone viewport and a coarse pointer the mobile shell never mounts,
  // and everything below would be proving nothing.
  const env = await page.evaluate(() => ({
    width: window.innerWidth,
    coarse: window.matchMedia('(pointer: coarse)').matches,
  }))
  expect(env.width, 'Pixel sits below the 768px phone breakpoint').toBeLessThan(768)
  expect(env.coarse, 'Pixel reports a coarse primary pointer').toBe(true)

  const stamp = Date.now()
  const created = await page.request.post('/api/trips', {
    data: { title: `Day swipe ${stamp}`, start_date: '2099-06-01', end_date: '2099-06-05' },
  })
  expect(created.ok(), 'seed trip').toBeTruthy()
  const tripId = (await created.json()).trip?.id ?? (await created.json()).id

  await page.goto(`/trips/${tripId}`)
  await expect(activeChip(page)).toBeVisible({ timeout: 30_000 })

  const chips = page.locator('button[aria-current], button[aria-current="true"]')
  const rail = activeChip(page).locator('xpath=..')
  expect(await rail.locator('button').count(), 'the seeded trip has five days').toBe(5)
  expect(await chips.count()).toBeGreaterThan(0)

  // The swipe zone: below the chip rail, above the dock, across the middle.
  const mid = Math.round(env.width / 2)
  const y = 460

  const day1 = (await activeChip(page).textContent())!.trim()

  // 1. A swipe left steps forward.
  await swipe(page, { x: mid + 90, y }, { x: mid - 90, y })
  const day2 = (await activeChip(page).textContent())!.trim()
  expect(day2, 'swiping left moved to the next day').not.toBe(day1)

  // 2. A swipe right steps back to where it started.
  await swipe(page, { x: mid - 90, y }, { x: mid + 90, y })
  expect((await activeChip(page).textContent())!.trim()).toBe(day1)

  // 3. The first day has nowhere to go back to — it must stay put, and the
  //    browser must not have been handed a page-back either.
  await swipe(page, { x: mid - 90, y }, { x: mid + 90, y })
  expect((await activeChip(page).textContent())!.trim()).toBe(day1)
  expect(page.url()).toContain(`/trips/${tripId}`)

  // 4. A vertical drag belongs to the card's own scroller, never to the day.
  await swipe(page, { x: mid, y: y + 120 }, { x: mid, y: y - 120 })
  expect((await activeChip(page).textContent())!.trim()).toBe(day1)

  // 5. And the rail itself still works, so the gesture added a path rather than
  //    replacing one.
  await rail.locator('button').nth(2).click()
  await expect(activeChip(page)).not.toHaveText(day1)
})
