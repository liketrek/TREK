import { test, expect } from '@playwright/test'
import { dismissSystemNotices } from './helpers'

// The day-plan reorder arrows are hover-revealed on desktop. The rule that did that was
// dead for a long time — it targeted `.place-row .reorder-btns`, neither of which exists
// (the component renders `.reorder-buttons` inside an unclassed row), so the buttons sat
// at opacity:0 with no way to reveal them.
//
// That is not merely "invisible": opacity:0 still hit-tests, so every itinerary row and
// note carried an invisible, fully clickable target that silently reordered the trip.
// These cases pin both halves — hidden means non-interactive, hover means visible.
test('desktop: reorder arrows are hidden-and-inert until the row is hovered', async ({ page }) => {
  await page.goto('/dashboard')
  await dismissSystemNotices(page)

  await page.locator('.add-trip-card').click()
  const modal = page.locator('.trek-modal-backdrop')
  await expect(modal).toBeVisible()
  const title = `Reorder ${Date.now()}`
  await modal.getByPlaceholder('e.g. Summer in Japan').fill(title)
  await modal.getByRole('button', { name: 'Create New Trip' }).click()

  await page.getByText(title).first().click()
  await expect(page).toHaveURL(/\/trips\/\d+/)
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })

  // Two places on day 1, so the day plan renders rows carrying reorder arrows.
  const tripId = page.url().match(/\/trips\/(\d+)/)![1]
  const daysRes = await (await page.request.get(`/api/trips/${tripId}/days`)).json()
  const dayId = (daysRes.days ?? daysRes)[0].id
  for (const name of ['Alpha', 'Beta']) {
    const res = await page.request.post(`/api/trips/${tripId}/places`, {
      data: { name, lat: 48.85, lng: 2.35 },
    })
    const body = await res.json()
    await page.request.post(`/api/trips/${tripId}/days/${dayId}/assignments`, {
      data: { place_id: body.place?.id ?? body.id },
    })
  }
  await page.reload()
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })

  const row = page.locator('.dp-row').filter({ hasText: 'Alpha' }).first()
  await expect(row).toBeVisible({ timeout: 20_000 })
  const arrows = row.locator('.reorder-buttons')

  // Unhovered: invisible AND inert — a click there must not land on the button.
  const idle = await arrows.evaluate(el => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return { opacity: cs.opacity, hitsArrow: !!hit?.closest('.reorder-buttons') }
  })
  expect(idle.opacity, 'arrows hidden until hover').toBe('0')
  expect(idle.hitsArrow, 'hidden arrows must not swallow clicks').toBe(false)

  // Hovered: revealed and clickable.
  await row.hover()
  await expect(arrows).toHaveCSS('opacity', '1')
  await expect(arrows).toHaveCSS('pointer-events', 'auto')
})
