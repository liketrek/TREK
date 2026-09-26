import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, ensureRoadtripFixtures } from './fixtures'
import { openTrip, modal, dialog } from './trip-shared'
import { tripRoadtripContext, tripRoadtripGuides } from '../../src/help/contexts/tripRoadtrip'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for road trip mode, keyed by the ids in
 * `src/help/contexts/tripRoadtrip.ts`. They run on the seeded "Autumn in
 * Japan" with the Road trip addon switched on, one long drive out of Tokyo on
 * day 4 and one imported track on day 7 (`ensureRoadtripFixtures`). What a
 * guide writes it takes away again in `cleanup`, and `test.afterAll` switches
 * the addon off again: it is an instance-wide setting, and while it is on
 * every trip's left column grows a switch the other screens never show.
 */

const guide = (id: string): HelpGuide => {
  const g = tripRoadtripGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

// ── Where things are ──────────────────────────────────────────────────────────

const rail = (page: Page) => page.locator('.roadtrip-rail-scroll')
/** A day's card by the number in its heading: the rail leaves out days with nothing on them. */
const dayCard = (page: Page, day: number) =>
  rail(page)
    .locator('> section')
    .filter({ has: page.getByRole('heading', { name: `Day ${day}`, exact: true }) })
    .first()
/**
 * One stop's row and everything hanging off it. The kind disc sits inside the
 * row button while the stop is a destination and beside it once it is a stop on
 * the way, so the list item is the only handle that holds for both.
 */
const stopItem = (page: Page, name: string) => rail(page).getByRole('listitem').filter({ hasText: name }).first()
const stopRow = (page: Page, name: string) => stopItem(page, name).getByRole('button').filter({ hasText: name }).first()
const kindDialog = (page: Page) => page.getByRole('dialog', { name: 'Kind of stop' })
/** The corridor panel: before a search its heading is the only stable thing in it. */
const corridor = (page: Page) => page.getByRole('heading', { name: 'Along the route' }).locator('xpath=ancestor::div[2]')
const kindPicker = (page: Page) => corridor(page).locator('button[aria-haspopup="listbox"]')
const dayPicker = (page: Page) => corridor(page).getByRole('button', { name: /^Day \d/ }).first()
const settingsCard = (page: Page) => page.getByRole('button', { name: /^Driving settings/ })
/** The alternatives bar floats over the map, inside neither column. */
const altBar = (page: Page) => page.getByText('Ways to drive this leg').locator('xpath=ancestor::div[2]')
/** The refuel band belongs to no stop: it runs across the rail between two of them. */
const dryBand = (page: Page) => page.getByText('Tank runs out here').first().locator('xpath=ancestor::div[3]')
const addFuelStop = (page: Page) => dryBand(page).getByRole('button', { name: /as a fuel stop$/ }).first()
/** A via handle is the one marker Leaflet drags itself; the corridor pins use HTML5 drag. */
const viaHandle = (page: Page) => page.locator('.leaflet-marker-icon.leaflet-marker-draggable').first()

// ── Getting there ─────────────────────────────────────────────────────────────

async function openRoadtrip(page: Page): Promise<void> {
  await openTrip(page, { day: null })
  await page.getByRole('tab', { name: 'Road trip' }).click()
  await waitForTheDrive(page)
}

/**
 * Every leg of every day is a router round trip, and the rail says nothing at
 * all until they land. The totals appear first and the partial line only while
 * something is outstanding, so neither of them on its own says the drive is
 * there; a drive band on a day that really has one does.
 */
async function waitForTheDrive(page: Page): Promise<void> {
  await expect(page.getByText('Driving time', { exact: true })).toBeVisible({ timeout: 120_000 })
  await expect(dayCard(page, 2).getByRole('button', { name: /Other ways$/ }).first()).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText('Still working out the rest of the drive')).toHaveCount(0, { timeout: 120_000 })
  await settle(page)
}

/**
 * Put a leg where the pointer can reach it. The map opens fitted to the whole
 * trip, which leaves the drawn route under the two floating panels; clicking a
 * stop frames that stop instead, and the card it opens is closed again at once.
 */
async function frameOnStop(page: Page, name: string): Promise<void> {
  await stopRow(page, name).click()
  await page.waitForTimeout(2500)
  const close = page.locator('button:has(svg.lucide-x)').last()
  if (await close.isVisible().catch(() => false)) await close.click()
  await settle(page)
}

type RoutePoint = { leg: number; x: number; y: number }

/**
 * Points that really lie on a drawn leg, with nothing over them. A bounding-box
 * centre is no use here: a route is a curve, its box is mostly empty space, and
 * what sits in the middle of it is usually somebody else's pin.
 */
async function routePoints(page: Page): Promise<RoutePoint[]> {
  return page.evaluate(() => {
    const paths = Array.from(
      document.querySelectorAll<SVGPathElement>('.leaflet-overlay-pane svg path[stroke="#0a5cc2"]'),
    )
    const found: { leg: number; x: number; y: number }[] = []
    paths.forEach((path, leg) => {
      const length = path.getTotalLength()
      const ctm = path.getScreenCTM()
      if (!ctm || length < 24) return
      for (let f = 0.08; f <= 0.92; f += 0.02) {
        const at = path.getPointAtLength(length * f)
        const x = Math.round(ctm.a * at.x + ctm.c * at.y + ctm.e)
        const y = Math.round(ctm.b * at.x + ctm.d * at.y + ctm.f)
        // The two panels float over the map; a point under one of them is not clickable.
        if (x < 430 || x > 1550 || y < 220 || y > 950) continue
        if (document.elementFromPoint(x, y) === path) found.push({ leg, x, y })
      }
    })
    return found
  })
}

/** Which leg the via guide aims at, and where; worked out once, used by three steps. */
let aimedLeg = 0
let aimedAt = { x: 0, y: 0 }
/** The day the via landed on, read back between two steps of the same guide. */
let viaDayId = 0
/** Names of what a guide created, read back by its cleanup. */
let addedStop = ''
let refuelStop = ''

/** The leg with the most reachable points: the one worth clicking and worth a picture. */
async function aimAtLeg(page: Page): Promise<void> {
  const points = await routePoints(page)
  if (points.length === 0) throw new Error('no drawn leg is reachable on the map')
  const counts = new Map<number, number>()
  for (const point of points) counts.set(point.leg, (counts.get(point.leg) ?? 0) + 1)
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  aimedLeg = best ? best[0] : points[0].leg
  const own = points.filter(point => point.leg === aimedLeg)
  const middle = own[Math.floor(own.length / 2)] ?? points[0]
  aimedAt = { x: middle.x, y: middle.y }
}

const aimedLine = (page: Page) => page.locator('.leaflet-overlay-pane svg path[stroke="#0a5cc2"]').nth(aimedLeg)
/** The pointer goes on the line, not on the centre of the box around it. */
const hoverAimedLine = async (page: Page): Promise<void> => {
  await page.mouse.move(aimedAt.x, aimedAt.y)
}

// ── What the guides write, and how it is taken back ───────────────────────────

type ViaRow = { id: number; day_id: number; lat: number; lng: number }

async function listVias(page: Page): Promise<ViaRow[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/roadtrip/vias`)
  const body = (await res.json()) as { vias?: ViaRow[] }
  return body.vias ?? []
}

async function clearVias(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  for (const via of await listVias(page)) {
    await page.request.delete(`/api/trips/${tripId}/roadtrip/days/${via.day_id}/vias/${via.id}`)
  }
}

async function clearDayBoundaries(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/roadtrip/day-boundaries`)
  const body = (await res.json()) as { boundaries?: { day_number: number }[] }
  for (const boundary of body.boundaries ?? []) {
    await page.request.delete(`/api/trips/${tripId}/roadtrip/day-boundaries/${boundary.day_number}`)
  }
}

async function listPlaces(page: Page): Promise<{ id: number; name: string }[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/places`)
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  return Array.isArray(body) ? body : (body.places ?? [])
}

async function deleteByName(page: Page, ...names: string[]): Promise<void> {
  const { tripId } = seededTrip()
  const wanted = names.filter(name => name.length > 0)
  if (wanted.length === 0) return
  for (const place of (await listPlaces(page)).filter(x => wanted.includes(x.name))) {
    await page.request.delete(`/api/trips/${tripId}/places/${place.id}`)
  }
}

/** Put one place back the way the seed had it. */
async function restorePlace(page: Page, name: string, data: Record<string, unknown>): Promise<void> {
  const { tripId } = seededTrip()
  const place = (await listPlaces(page)).find(x => x.name === name)
  if (place) await page.request.put(`/api/trips/${tripId}/places/${place.id}`, { data })
}

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  'roadtrip-mode': {
    guide: guide('roadtrip-mode'),
    start: p => openTrip(p, { day: null }),
    steps: [
      {
        target: p => p.getByRole('tablist', { name: 'Plan view' }),
        act: async p => {
          await p.getByRole('tab', { name: 'Road trip' }).click()
          await waitForTheDrive(p)
        },
      },
      only(p => p.getByText('Driving time', { exact: true }).locator('xpath=ancestor::header[1]')),
      only(p => dayCard(p, 2).locator('header')),
      only(p => dayCard(p, 2).getByRole('list').first()),
      {
        // Day 2, like the two steps above: the rail leaves out a day with
        // nothing to drive, and day 1 is one of them.
        target: p => dayCard(p, 2).locator('header'),
        act: async p => {
          await dayCard(p, 2).locator('header').click()
          await expect(dayCard(p, 2).locator('header')).toHaveAttribute('aria-expanded', 'false')
          await settle(p)
          // Folded is not the state to leave the trip in, and the result picture
          // is of the whole drive rather than of one card shut.
          await dayCard(p, 2).locator('header').click()
          await expect(dayCard(p, 2).locator('header')).toHaveAttribute('aria-expanded', 'true')
          await settle(p)
        },
      },
    ],
  },
  'roadtrip-stops': {
    guide: guide('roadtrip-stops'),
    start: openRoadtrip,
    steps: [
      {
        // The disc itself, by its own label: the row button around it takes the
        // disc's label into its accessible name, so the role query matches both.
        target: p => stopItem(p, 'Meiji Jingu').locator('[aria-label="Make it a stop on the way"]'),
        act: async p => {
          await stopItem(p, 'Meiji Jingu').locator('[aria-label="Make it a stop on the way"]').click()
          await expect(kindDialog(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: kindDialog,
        act: async p => {
          await kindDialog(p).getByRole('button', { name: 'Rest area' }).click()
          await expect(kindDialog(p)).toHaveCount(0)
          await expect(
            stopItem(p, 'Meiji Jingu').getByRole('button', { name: 'Change what kind of stop this is' }),
          ).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      only(p => dayCard(p, 2).locator('header')),
      {
        prepare: async p => {
          await stopItem(p, 'Meiji Jingu').getByRole('button', { name: 'Change what kind of stop this is' }).click()
          await expect(kindDialog(p)).toBeVisible()
          await settle(p)
        },
        target: p => kindDialog(p).getByRole('button', { name: 'Back to a destination' }),
        act: async p => {
          await kindDialog(p).getByRole('button', { name: 'Back to a destination' }).click()
          await expect(kindDialog(p)).toHaveCount(0)
          await expect(stopItem(p, 'Meiji Jingu').locator('[aria-label="Make it a stop on the way"]')).toBeVisible({
            timeout: 20_000,
          })
          await settle(p)
        },
      },
      {
        target: p => stopItem(p, 'Shibuya Crossing').getByRole('button', { name: /^Time at this stop/ }),
        act: async p => {
          await stopItem(p, 'Shibuya Crossing').getByRole('button', { name: /^Time at this stop/ }).click()
          await expect(modal(p).getByRole('heading', { name: 'Time at this stop' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: dialog,
        act: async p => {
          await modal(p).getByRole('button', { name: '1 h', exact: true }).click()
          await expect(modal(p).getByRole('slider', { name: 'Minutes' })).toHaveValue('60')
          await modal(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(stopItem(p, 'Shibuya Crossing')).toContainText('1 h', { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await restorePlace(p, 'Shibuya Crossing', { duration_minutes: 45 })
      await restorePlace(p, 'Meiji Jingu', { stop_type: null })
    },
  },
  'roadtrip-corridor': {
    guide: guide('roadtrip-corridor'),
    start: async p => {
      addedStop = ''
      await openRoadtrip(p)
    },
    steps: [
      {
        target: dayPicker,
        act: async p => {
          await dayPicker(p).click()
          await p.getByRole('button', { name: 'Day 2', exact: true }).last().click()
          await expect(dayPicker(p)).toContainText('Day 2')
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await kindPicker(p).click()
          await expect(corridor(p).locator('div[role="listbox"]')).toBeVisible()
          await settle(p)
        },
        target: p => corridor(p).locator('div[role="listbox"]'),
        act: async p => {
          await corridor(p).getByRole('option', { name: 'Food' }).click()
          // The list closes on a second click of its own trigger, not on Escape.
          await kindPicker(p).click()
          await expect(kindPicker(p)).toContainText('Food')
          await settle(p)
        },
      },
      {
        target: p => corridor(p).getByRole('button', { name: '5 km', exact: true }).locator('xpath=..'),
        act: async p => {
          // The step's sentence tells the reader to choose a width and then search,
          // so the width is chosen here even though 5 km is what the panel opens on.
          await corridor(p).getByRole('button', { name: '5 km', exact: true }).click()
          await expect(corridor(p).getByRole('button', { name: '5 km', exact: true })).toHaveAttribute(
            'aria-pressed',
            'true',
          )
          await corridor(p).getByRole('button', { name: 'Search', exact: true }).click()
          await expect(corridor(p).getByText(/on the way$/).first()).toBeVisible({ timeout: 180_000 })
          await settle(p)
        },
      },
      only(p => corridor(p).getByRole('listitem').first()),
      {
        prepare: async p => {
          const row = corridor(p).getByRole('listitem').first()
          addedStop = (await row.innerText()).split('\n')[0] ?? ''
          await row.hover()
          await settle(p)
        },
        target: p => corridor(p).getByRole('listitem').first().getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await corridor(p).getByRole('listitem').first().getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p).getByRole('heading', { name: 'Add as a stop' })).toBeVisible()
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 30_000 })
          await expect
            .poll(async () => (await listPlaces(p)).some(x => x.name === addedStop), { timeout: 30_000 })
            .toBe(true)
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, addedStop),
  },
  'roadtrip-via': {
    guide: guide('roadtrip-via'),
    start: openRoadtrip,
    steps: [
      {
        target: p => stopItem(p, 'Meiji Jingu'),
        act: async p => {
          await frameOnStop(p, 'Meiji Jingu')
          await aimAtLeg(p)
        },
      },
      {
        target: aimedLine,
        hover: hoverAimedLine,
        act: async p => {
          await p.mouse.click(aimedAt.x, aimedAt.y)
          await expect.poll(async () => (await listVias(p)).length, { timeout: 60_000 }).toBe(1)
          await expect(viaHandle(p)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          viaDayId = (await listVias(p))[0]?.day_id ?? 0
          await settle(p)
        },
        // Which day the click landed on is the router's answer, not ours.
        target: p => {
          const day = seededTrip().dayIds.indexOf(viaDayId) + 1
          // Fall back to day 2, not day 1: the rail has no card for a day
          // with nothing to drive.
          return dayCard(p, day > 0 ? day : 2).locator('header')
        },
      },
      {
        target: viaHandle,
        act: async p => {
          const box = await viaHandle(p).boundingBox()
          if (!box) throw new Error('the via handle has no box')
          const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
          const before = JSON.stringify((await listVias(p))[0] ?? {})
          // A Leaflet drag, not an HTML5 one: the handle listens for the raw
          // pointer, so `dragTo` would move nothing.
          await p.mouse.move(from.x, from.y)
          await p.mouse.down()
          await p.mouse.move(from.x + 45, from.y + 40, { steps: 10 })
          await p.mouse.move(from.x + 90, from.y + 80, { steps: 10 })
          await p.mouse.up()
          await expect
            .poll(async () => JSON.stringify((await listVias(p))[0] ?? {}), { timeout: 60_000 })
            .not.toBe(before)
          await settle(p)
        },
      },
      {
        target: viaHandle,
        act: async p => {
          const box = await viaHandle(p).boundingBox()
          if (!box) throw new Error('the via handle has no box')
          await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' })
          await expect.poll(async () => (await listVias(p)).length, { timeout: 60_000 }).toBe(0)
          await settle(p)
        },
      },
    ],
    cleanup: clearVias,
  },
  'roadtrip-alternatives': {
    guide: guide('roadtrip-alternatives'),
    start: openRoadtrip,
    steps: [
      {
        target: p => dayCard(p, 2).getByRole('button', { name: /Other ways$/ }).last(),
        act: async p => {
          await dayCard(p, 2).getByRole('button', { name: /Other ways$/ }).last().click()
          await expect(p.getByText('Ways to drive this leg')).toBeVisible({ timeout: 60_000 })
          await expect(p.getByText('Asking the router…')).toHaveCount(0, { timeout: 60_000 })
          await settle(p)
        },
      },
      only(altBar),
      {
        prepare: async p => {
          await altBar(p).getByRole('button', { name: /km/ }).last().hover()
          await settle(p)
        },
        target: p => altBar(p).getByRole('button', { name: /km/ }).last(),
      },
      {
        target: p => altBar(p).getByRole('button', { name: 'Close' }),
        act: async p => {
          await altBar(p).getByRole('button', { name: 'Close' }).click()
          await expect(p.getByText('Ways to drive this leg')).toHaveCount(0)
          await settle(p)
        },
      },
    ],
    // Nothing is chosen here, but choosing an entry writes a via, so a misclick
    // must not follow the run into the next guide.
    cleanup: clearVias,
  },
  'roadtrip-limits': {
    guide: guide('roadtrip-limits'),
    start: openRoadtrip,
    steps: [
      {
        target: settingsCard,
        act: async p => {
          await settingsCard(p).click()
          await expect(modal(p).getByRole('heading', { name: 'Driving settings' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByTestId('limit-legMinutes').locator('xpath=ancestor::section[1]'),
        act: async p => {
          await modal(p).getByTestId('limit-legMinutes').fill('60')
          await p.keyboard.press('Tab')
          await expect(modal(p).getByTestId('limit-legMinutes')).toHaveValue('60')
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('group', { name: 'What you drive' }),
        act: async p => {
          await modal(p).getByText('Electric', { exact: true }).click()
          await expect(modal(p).getByRole('radio', { name: 'Electric' })).toBeChecked()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByTestId('limit-range').locator('xpath=ancestor::label[1]'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Work it out from the car' }).click()
          await expect(modal(p).getByRole('spinbutton', { name: /^Battery, / })).toBeVisible()
          await settle(p)
        },
      },
      // Not toggled on purpose: each of these switches sends every leg of the
      // trip back through the avoidance router, which is minutes of waiting for
      // one picture of a row of switches.
      only(p => modal(p).getByRole('button', { name: 'Toll roads' }).locator('xpath=ancestor::section[1]')),
      {
        prepare: async p => {
          await closeModal(p)
          await settle(p)
        },
        target: settingsCard,
        act: async p => {
          // Both halves: the badge the fixture leaves reads "1 h 30 min", which
          // contains "1 h", so the shortened limit only shows in what is NOT there.
          await expect(settingsCard(p)).toContainText('1 h', { timeout: 30_000 })
          await expect(settingsCard(p)).not.toContainText('1 h 30 min')
          await settle(p)
        },
      },
    ],
    // The fixture writes the whole preference set, so re-running it is the undo.
    cleanup: p => ensureRoadtripFixtures(p.request),
  },
  'roadtrip-day-window': {
    guide: guide('roadtrip-day-window'),
    start: openRoadtrip,
    steps: [
      {
        prepare: async p => {
          await settingsCard(p).click()
          await expect(modal(p).getByRole('heading', { name: 'Driving settings' })).toBeVisible()
          await settle(p)
        },
        target: p => modal(p).getByRole('group', { name: 'Daily travel times' }),
      },
      {
        target: p => modal(p).getByRole('textbox', { name: 'Day start time' }),
        act: async p => {
          await modal(p).getByRole('textbox', { name: 'Day start time' }).fill('09:00')
          await expect(modal(p).getByRole('textbox', { name: 'Day start time' })).toHaveValue('09:00')
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('textbox', { name: 'Day end time' }),
        act: async p => {
          await modal(p).getByRole('textbox', { name: 'Day end time' }).fill('17:30')
          await p.keyboard.press('Tab')
          await expect(modal(p).getByRole('textbox', { name: 'Day end time' })).toHaveValue('17:30')
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('group', { name: 'End the day' }),
        act: async p => {
          await modal(p).getByText('At the last place', { exact: true }).click()
          await expect(modal(p).getByRole('radio', { name: 'At the last place' })).toBeChecked()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await closeModal(p)
          await settle(p)
        },
        target: settingsCard,
        act: async p => {
          await expect(settingsCard(p)).toContainText('09:00', { timeout: 60_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await clearDayBoundaries(p)
      await ensureRoadtripFixtures(p.request)
    },
  },
  'roadtrip-refuel': {
    guide: guide('roadtrip-refuel'),
    start: async p => {
      refuelStop = ''
      await openRoadtrip(p)
    },
    steps: [
      only(dryBand),
      {
        target: p => p.getByRole('button', { name: 'Find fuel' }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Find fuel' }).first().click()
          await expect(p.getByText('Looking along the route…')).toHaveCount(0, { timeout: 180_000 })
          await expect(addFuelStop(p)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      only(p => dryBand(p).getByRole('list').first()),
      {
        prepare: async p => {
          const label = (await addFuelStop(p).getAttribute('aria-label')) ?? ''
          refuelStop = label.replace(/^Add /, '').replace(/ as a fuel stop$/, '')
          await addFuelStop(p).hover()
          await settle(p)
        },
        target: addFuelStop,
        act: async p => {
          await addFuelStop(p).click()
          await expect(modal(p).getByRole('heading', { name: 'Add as a stop' })).toBeVisible({ timeout: 30_000 })
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 30_000 })
          await expect
            .poll(async () => (await listPlaces(p)).some(x => x.name === refuelStop), { timeout: 30_000 })
            .toBe(true)
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, refuelStop),
  },
  'roadtrip-track': {
    guide: guide('roadtrip-track'),
    start: openRoadtrip,
    steps: [
      {
        target: p => dayCard(p, 7).getByRole('button', { name: 'Track', exact: true }),
        act: async p => {
          await dayCard(p, 7).getByRole('button', { name: 'Track', exact: true }).click()
          await expect(modal(p).getByRole('heading', { name: 'Day 7 follows a track' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('list').first(),
        act: async p => {
          await modal(p).getByRole('button', { name: /^Arashiyama loop/ }).click()
          await expect(modal(p).getByRole('button', { name: 'Follow this track' })).toBeEnabled()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Follow this track' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Follow this track' }).click()
          // One router round trip per refinement round, on a route that is
          // being pulled onto a track metre by metre.
          await expect(modal(p).getByText(/via points placed|already followed this track/)).toBeVisible({
            timeout: 240_000,
          })
          await settle(p)
        },
      },
      {
        target: dialog,
        act: async p => {
          await closeModal(p)
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await closeModal(p)
      await clearVias(p)
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureRoadtripFixtures(request)
})

test.afterAll(async ({ request }) => {
  // Instance-wide, not trip-scoped: left on, every trip's left column grows the
  // Days / Road trip switch and every other screen's pictures change. Here
  // rather than in the last guide's cleanup, so a failed run puts it back too.
  await request.put('/api/admin/addons/roadtrip', { data: { enabled: false } })
})

test('every registered road trip guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripRoadtripContext.guides].sort())
})

test('hero: trip-roadtrip', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripRoadtripContext.id, openRoadtrip)
})

for (const id of tripRoadtripContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
