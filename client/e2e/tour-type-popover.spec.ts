import { devices, expect, test, type Locator, type Page } from '@playwright/test'
import { encodePolyline6 } from '@trek/shared'

async function createTourTrip(page: Page): Promise<number> {
  const trip = await page.request.post('/api/trips', {
    data: { title: 'Tour type picker', start_date: '2099-06-01', end_date: '2099-06-05' },
  })
  await expect(trip).toBeOK()
  const { trip: { id } } = await trip.json()
  await expect(await page.request.put(`/api/trips/${id}/addons/tours`, { data: { enabled: true } })).toBeOK()
  return id
}

async function expectInside(element: Locator, boundary: Locator) {
  await expect.poll(async () => {
    const target = await element.boundingBox()
    const rail = await boundary.boundingBox()
    return !!target && !!rail && target.x >= rail.x - 1 && target.y >= rail.y - 1 &&
      target.x + target.width <= rail.x + rail.width + 1 && target.y + target.height <= rail.y + rail.height + 1
  }).toBe(true)
}

function editorFields(page: Page) {
  const trigger = page.getByTestId('tour-type-select')
  const scrollArea = page.getByTestId('tour-planner-editor-scroll')
  return { trigger, scrollArea, menu: page.getByRole('group', { name: 'Tour type', exact: true }) }
}

test('Tour type follows and fits inside the narrow editor rail', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 480 })
  const tripId = await createTourTrip(page)
  await page.goto(`/trips/${tripId}?tab=tour-planner`)
  await page.getByRole('button', { name: 'Plan new tour' }).click()
  await expect(page.getByTestId('tour-planner-empty-state')).toBeAttached()

  const grip = page.locator('[data-resize="left"]')
  for (let step = 0; step < 8; step++) await grip.press('ArrowLeft')
  const { trigger, scrollArea, menu } = editorFields(page)
  await trigger.scrollIntoViewIfNeeded()
  await expectInside(trigger, scrollArea)
  await trigger.click()
  await expectInside(menu, scrollArea)
  await expect.poll(() => menu.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)

  async function anchorGap() {
    return menu.evaluate((el) => {
      const anchor = document.querySelector('[data-testid="tour-type-select"]')!.getBoundingClientRect()
      const panel = el.getBoundingClientRect()
      return Math.round(Math.max(panel.top - anchor.bottom, anchor.top - panel.bottom))
    })
  }
  await expect.poll(anchorGap).toBe(4)
  const start = await scrollArea.evaluate(el => el.scrollTop)
  await scrollArea.evaluate(el => el.scrollBy(0, 20))
  await expect.poll(() => scrollArea.evaluate(el => el.scrollTop)).toBeGreaterThan(start)
  await expect.poll(anchorGap).toBe(4)
  await expectInside(menu, scrollArea)
  await scrollArea.evaluate((el, top) => { el.scrollTop = top }, start)
  await expect.poll(anchorGap).toBe(4)

  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(menu).toHaveCount(0)

  await trigger.click()
  await scrollArea.evaluate(el => el.scrollBy(0, 180))
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toHaveCount(0)
  await scrollArea.evaluate(el => { el.scrollTop = 0 })
  await expect(menu).toHaveCount(0)

  await trigger.click()
  const ski = menu.getByTestId('tour-type-option-ski')
  await page.keyboard.press('End')
  await expect(ski).toBeInViewport()
  await expect(ski).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(trigger).toContainText('Ski & winter')
  await expect(menu).toHaveCount(0)
  await page.getByRole('button', { name: 'Alpine', exact: true }).click()
  const hardest = page.getByRole('button', { name: 'Hardest runs', exact: true })
  const hardestMenu = page.getByRole('group', { name: 'Hardest runs', exact: true })
  await hardest.click()
  await expectInside(hardestMenu, scrollArea)
  await hardestMenu.getByRole('button', { name: 'Easy', exact: true }).click()
  await expect(hardest).toContainText('Easy')
  await expect(hardestMenu).toHaveCount(0)
})

test('the saved hike difficulty dropdown fits above the field and keeps alpine confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 520 })
  const tripId = await createTourTrip(page)
  const saved = await page.request.post(`/api/trips/${tripId}/tours`, {
    data: {
      name: 'Saved ridge walk', tour_type: 'hike', max_hiking_difficulty: 2,
      route_geometry: [[48.1, 11.1, 500], [48.11, 11.11, 550]],
      waypoints: [
        { lat: 48.1, lng: 11.1, role: 'start', sequence: 0 },
        { lat: 48.11, lng: 11.11, role: 'end', sequence: 1 },
      ],
    },
  })
  await expect(saved).toBeOK()
  const { tour: { place_id } } = await saved.json()
  const detailUrl = `**/api/trips/${tripId}/tours/${place_id}`
  const detailGate = Promise.withResolvers<void>()
  await page.route(detailUrl, async route => { await detailGate.promise; await route.continue() }, { times: 1 })
  const shape = encodePolyline6([{ lat: 48.1, lon: 11.1 }, { lat: 48.11, lon: 11.11 }])
  await page.route('**/api/routing/valhalla/route', route => route.fulfill({
    json: { trip: { legs: [{ shape, summary: { length: 1.4, time: 1200 } }] } },
  }))
  await page.goto(`/trips/${tripId}?tab=tour-planner`)
  const detailRequested = page.waitForRequest(detailUrl)
  await page.getByRole('option', { name: /Saved ridge walk/ }).click()
  await detailRequested

  const { trigger, menu, scrollArea } = editorFields(page)
  try {
    await expect(trigger).toHaveCount(0)
    await expect(menu).toHaveCount(0)
  } finally {
    detailGate.resolve()
  }
  await expect(page.getByLabel('Tour name')).toHaveValue('Saved ridge walk')
  await trigger.click()
  await expectInside(menu, scrollArea)
  await page.keyboard.press('Escape')

  const difficulty = page.getByRole('button', { name: 'Maximum trail difficulty', exact: true })
  const difficultyMenu = page.getByRole('group', { name: 'Maximum trail difficulty', exact: true })
  await difficulty.scrollIntoViewIfNeeded()
  await difficulty.click()
  await expectInside(difficultyMenu, scrollArea)
  await expect(difficultyMenu).toHaveCSS('transform-origin', /px [1-9][0-9.]*px$/)
  await page.keyboard.press('Escape')
  await expect(difficulty).toBeFocused()
  await expect(difficultyMenu).toHaveCount(0)
  await difficulty.click()
  await scrollArea.evaluate(el => { el.scrollTop = 0 })
  await expect(difficulty).toHaveAttribute('aria-expanded', 'false')
  await expect(difficultyMenu).toHaveCount(0)

  await difficulty.click()
  await difficultyMenu.getByRole('button', { name: 'T3: Demanding mountain hiking' }).click()
  await expect(difficulty).toContainText('T3:')
  await difficulty.click()
  await difficultyMenu.getByRole('button', { name: 'T4: Alpine hiking' }).click()
  await expect(page.getByRole('heading', { name: 'Enable alpine routing?' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(difficulty).toContainText('T3:')

  const categories = page.getByTestId('tour-poi-categories')
  await categories.click()
  await expectInside(page.getByRole('group', { name: 'What to look for', exact: true }), scrollArea)
})

test('the tour editor dropdowns fit in the native tablet layout', async ({ playwright, baseURL, storageState }) => {
  const browser = await playwright.webkit.launch()
  try {
    const page = await browser.newPage({ ...devices['iPad Pro 11'], viewport: { width: 680, height: 620 }, baseURL, storageState })
    page.setDefaultTimeout(10_000)
    // The browser supplies the WebKit viewport and touch input. This flag selects the app shell.
    await page.addInitScript(() => Object.assign(window, { CapacitorCustomPlatform: { name: 'ios' } }))
    const tripId = await createTourTrip(page)
    await page.goto(`/trips/${tripId}?tab=tour-planner`)
    await page.getByRole('tab', { name: 'Plan a tour', exact: true }).tap()
    await page.getByRole('button', { name: 'Plan new tour' }).tap()
    const { trigger, menu, scrollArea } = editorFields(page)
    await trigger.tap()
    await expectInside(menu, scrollArea)
    await scrollArea.evaluate(el => el.scrollBy(0, 160))
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    const difficulty = page.getByRole('button', { name: 'Maximum trail difficulty', exact: true })
    const difficultyMenu = page.getByRole('group', { name: 'Maximum trail difficulty', exact: true })
    await difficulty.tap()
    await expectInside(difficultyMenu, scrollArea)
    await difficultyMenu.getByRole('button', { name: 'T1: Hiking' }).tap()
    await expect(difficulty).toContainText('T1:')
    await expect(difficultyMenu).toHaveCount(0)

    await trigger.tap()
    await menu.getByTestId('tour-type-option-ski').tap()
    await page.getByRole('button', { name: 'Alpine', exact: true }).tap()
    const hardest = page.getByRole('button', { name: 'Hardest runs', exact: true })
    const hardestMenu = page.getByRole('group', { name: 'Hardest runs', exact: true })
    await hardest.tap()
    await expectInside(hardestMenu, scrollArea)
    await hardestMenu.getByRole('button', { name: 'Easy', exact: true }).tap()
    await expect(hardest).toContainText('Easy')
  } finally {
    await browser.close()
  }
})
