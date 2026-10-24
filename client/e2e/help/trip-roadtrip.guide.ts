import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, settle, dragLoop, nudgeClock, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, ensureRoadtripFixtures } from './fixtures'
import { openTrip, modal, dialog } from './trip-shared'
import {
  FERRY, FUEL_STOP, GOOGLE_ROUTE, HAZARD_TITLE, assignmentsOn, ensureFerry, ensureFuelStop, hideHazards, overnightFlight, placeIdOf,
  removeFerry, removeFuelStop, removeImportedStops, removeNightAt, restoreFlight, stubGooglePreview, stubHazards,
} from './fixtures-trip-roadtrip'
import { tripRoadtripContext, tripRoadtripGuides } from '../../src/help/contexts/tripRoadtrip'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for road trip mode, keyed by the ids in
 * `src/help/contexts/tripRoadtrip.ts`. They run on the seeded "Autumn in
 * Japan" with the Road trip addon switched on, one long drive out of Tokyo on
 * day 4 and one imported track on day 7 (`ensureRoadtripFixtures`). A few
 * guides bring their own extra (a fuel stop, a ferry, the answers of Google's
 * preview and of the warning feeds), from `fixtures-trip-roadtrip.ts`. What a
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
/**
 * A day's card by its head band, which is the fold control and carries the day's
 * name as its label ("Day 2"): the rail leaves out days with nothing on them. Not
 * by the heading inside it, which sits inside that role=button band.
 */
const dayCard = (page: Page, day: number) =>
  rail(page)
    .locator('> section')
    .filter({ has: page.locator(`header[aria-label="Day ${day}"]`) })
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
/**
 * The two dropdowns of the Looking for line. Both are listbox triggers, so they
 * are told apart by name: the kinds read "Looking for: Fuel", the day "Day 1".
 */
const kindPicker = (page: Page) => corridor(page).getByRole('button', { name: /^Looking for/ })
const dayPicker = (page: Page) => corridor(page).getByRole('button', { name: /^Day \d/ }).first()
/** The list a dropdown opens; only one is open at a time. */
const openList = (page: Page) => corridor(page).locator('div[role="listbox"]')
const settingsCard = (page: Page) => page.getByRole('button', { name: /^Driving settings/ })
/** Which of day 4's drive bands is its longest leg; worked out by `aimAtLongLeg`. */
let altLeg = 0
/** The drive band of day 4's long leg, the one with more than one road to it. */
const altBand = (page: Page) => dayCard(page, 4).getByRole('button', { name: /Other ways$/ }).nth(altLeg)

/**
 * Pick day 4's longest leg by the distance its band reads. Not simply the first
 * band: which leg comes first depends on what else the day holds (a timed stop,
 * the hotel the day starts from), and a short hop inside Hakone has one sensible
 * road, so the bar would only say that.
 */
async function aimAtLongLeg(page: Page): Promise<void> {
  const names = await dayCard(page, 4)
    .getByRole('button', { name: /Other ways$/ })
    .evaluateAll(els => els.map(el => `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`))
  const km = names.map(name => {
    const m = /([\d.,]+)\s*km/.exec(name)
    return m ? Number(m[1].replace(/,/g, '')) : 0
  })
  altLeg = km.reduce((best, value, i) => (value > km[best] ? i : best), 0)
}
/** The alternatives bar floats over the map, inside neither column. */
const altBar = (page: Page) => page.getByText('Ways to drive this leg').locator('xpath=ancestor::div[2]')
/** The refuel band belongs to no stop: it runs across the rail between two of them. */
const dryBand = (page: Page) => page.getByText('Tank runs out here').first().locator('xpath=ancestor::div[3]')
const addFuelStop = (page: Page) => dryBand(page).getByRole('button', { name: /as a fuel stop$/ }).first()
/** A via handle is the one marker Leaflet drags itself; the corridor pins use HTML5 drag. */
const viaHandle = (page: Page) => page.locator('.leaflet-marker-icon.leaflet-marker-draggable').first()
/** The Search button's card: Looking for, the day, Within, Search and Manual. */
const searchCard = (page: Page) => corridor(page).getByRole('button', { name: 'Search', exact: true }).locator('xpath=../..')
/** A hotel hit: its add button is the bed, Add as an overnight stay. */
const nightButton = (page: Page) =>
  corridor(page).getByRole('button', { name: 'Add as an overnight stay', exact: true }).first()
const nightRow = (page: Page) =>
  corridor(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('button', { name: 'Add as an overnight stay', exact: true }) })
    .first()
/**
 * The battery badge of a refuelling stop. It has no label of its own: its name
 * is its figure, "80 %", or the "+" it shows while nothing says how full.
 */
const fillBadge = (page: Page, name: string) => stopItem(page, name).getByRole('button', { name: /^(\d+ %|\+)$/ })
const fillPopover = (page: Page) => page.getByRole('dialog', { name: 'Fills to' })
/** A booked ride is a card button in the chain, named by its title first. */
const rideCard = (page: Page) => rail(page).getByRole('button', { name: /^Lake Ashi cruise/ }).first()
/** The check-in pill of a ride card: the timetable's chips are pills of the same shape. */
const checkInPill = (page: Page) => rideCard(page).locator('span.rounded-full').filter({ hasText: /Check-in|Boarding/ }).last()
/** CustomSelect drops its options into a fixed portal on the body. */
const selectMenu = (page: Page) => page.locator('body > div[style*="99999"]').last()
/** A warning area drawn by the hazard layer, in the warning colour. */
const hazardArea = (page: Page) => page.locator('.leaflet-overlay-pane path[stroke="var(--warning)"]').first()
const hazardPopup = (page: Page) => page.locator('.leaflet-popup.trek-hazard-popup')

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
  // On the name: the row's centre can land on its Stay badge, which opens its
  // own dialog instead of selecting the stop.
  await stopRow(page, name).click({ position: { x: 70, y: 12 } })
  // The place's card opens over the map; its Close sits in the card's head band.
  const head = placeCardHead(page, name)
  await expect(head).toBeVisible({ timeout: 15_000 })
  await finishMapPan(page)
  await head.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(head).toHaveCount(0)
  await settle(page)
}

/**
 * Let the map's pan to a picked place land. Leaflet times its pan from
 * `+new Date()`, and the clock is pinned to the picture day (guide.ts), so
 * the pan starts and never gets anywhere: the map stays where it was. Moving the
 * pinned clock a few seconds on ends it on the next frame, as a second passing
 * would; nothing in these pictures reads the time to the second.
 */
async function finishMapPan(page: Page): Promise<void> {
  await page.waitForTimeout(400)
  await nudgeClock(page)
  await page.waitForTimeout(1200)
  await settle(page)
}

/**
 * The head band of the card a stop opens over the map (the place inspector):
 * the place's name as a heading, and Close beside it. The rail prints the same
 * name, but never as a heading.
 */
const placeCardHead = (page: Page, name: string) =>
  page.getByRole('heading', { name, exact: true, level: 2 }).locator('xpath=ancestor::header[1]')

type RoutePoint = { leg: number; x: number; y: number }

/**
 * Points that really lie on a drawn leg, with nothing over them. A bounding-box
 * centre is no use here: a route is a curve, its box is mostly empty space, and
 * what sits in the middle of it is usually somebody else's pin.
 *
 * The drawn casing is not what takes the click: it is non-interactive, and an
 * invisible band over the same line (`RouteHitBand`, a transparent stroke with
 * the class `cursor-copy`) catches it instead. So the point is read off the
 * casing, which is the line the reader sees and the one the ring sits on, and
 * the hit test asks for the band of that same leg. Both are drawn from the same
 * positions, so their `d` is the same string.
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
      const d = path.getAttribute('d')
      for (let f = 0.08; f <= 0.92; f += 0.02) {
        const at = path.getPointAtLength(length * f)
        const x = Math.round(ctm.a * at.x + ctm.c * at.y + ctm.e)
        const y = Math.round(ctm.b * at.x + ctm.d * at.y + ctm.f)
        // The two panels float over the map; a point under one of them is not clickable.
        if (x < 430 || x > 1550 || y < 220 || y > 950) continue
        const hit = document.elementFromPoint(x, y)
        const ownBand = hit instanceof SVGPathElement && hit.classList.contains('cursor-copy') && hit.getAttribute('d') === d
        if (hit === path || ownBand) found.push({ leg, x, y })
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
let nightStop = ''

/** The leg with the most reachable points: the one worth clicking and worth a picture. */
async function aimAtLeg(page: Page): Promise<void> {
  const points = await routePoints(page)
  if (points.length === 0) {
    const legs = await page.locator('.leaflet-overlay-pane svg path[stroke="#0a5cc2"]').count()
    const bands = await page.locator('.leaflet-overlay-pane svg path.cursor-copy').count()
    throw new Error(`no drawn leg is reachable on the map (${legs} drawn legs, ${bands} click bands)`)
  }
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

/** Where on the warning area a click lands on the area itself, clear of the panels and the route. */
let hazardAt = { x: 0, y: 0 }
async function aimAtHazard(page: Page): Promise<void> {
  const aim = await page.evaluate(() => {
    const paths = document.querySelectorAll<SVGPathElement>('.leaflet-overlay-pane path[stroke="var(--warning)"]')
    const path = paths[0]
    if (!path) return { point: null, why: 'no warning area is drawn' }
    // The stub answers with one storm. More than one area means the live feed
    // got through, and its first area is anywhere but over the drive.
    if (paths.length > 1) return { point: null, why: `${paths.length} warning areas are drawn, so the feed was not stubbed` }
    const box = path.getBoundingClientRect()
    const found: { x: number; y: number }[] = []
    for (let y = box.top + 8; y < box.bottom - 8; y += 12) {
      for (let x = box.left + 8; x < box.right - 8; x += 12) {
        if (x < 430 || x > 1550 || y < 220 || y > 950) continue
        if (document.elementFromPoint(x, y) === path) found.push({ x: Math.round(x), y: Math.round(y) })
      }
    }
    // Said in the error when nothing is found, so the log tells a map framed
    // elsewhere from an area something else is lying on.
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    const why = `area at ${Math.round(box.left)},${Math.round(box.top)} ${Math.round(box.width)}x${Math.round(box.height)}, ` +
      `on top at its centre: ${top ? `${top.tagName.toLowerCase()}.${String(top.getAttribute('class') ?? '')}` : 'nothing'}`
    return { point: found[Math.floor(found.length / 2)] ?? null, why }
  })
  if (!aim.point) throw new Error(`no part of the warning area is reachable on the map (${aim.why})`)
  hazardAt = aim.point
}

/** Hold the loop's last frame a moment, on the state the gesture left. */
async function holdResult(page: Page, frame: () => Promise<void>): Promise<void> {
  await settle(page)
  await frame()
  await frame()
}

// ── Day 4 as the fixtures left it, for the guide that moves its stops ─────────

let day4Order: number[] = []

async function placeOrder(page: Page, dayIndex: number): Promise<number[]> {
  return (await assignmentsOn(page.request, dayIndex)).map(a => a.place_id)
}

/** Whether `first` comes before `second` among the day's stops. */
async function before(page: Page, dayIndex: number, first: string, second: string): Promise<boolean> {
  const order = await placeOrder(page, dayIndex)
  const a = order.indexOf((await placeIdOf(page.request, first)) ?? -1)
  const b = order.indexOf((await placeIdOf(page.request, second)) ?? -1)
  return a >= 0 && b >= 0 && a < b
}

/**
 * Every stop the guide pushed to another day back on day 4, and day 4 back in
 * the order it had. Whichever stop went: the guide moves one, and a run that
 * broke halfway must not leave it on the other day for the next guides.
 */
async function restoreDay4(page: Page): Promise<void> {
  const { tripId, dayIds } = seededTrip()
  const onDay4 = await placeOrder(page, 3)
  for (const placeId of day4Order.filter(id => !onDay4.includes(id))) {
    for (let i = 0; i < dayIds.length; i++) {
      if (i === 3) continue
      const moved = (await assignmentsOn(page.request, i)).find(a => a.place_id === placeId)
      if (!moved) continue
      await page.request.put(`/api/trips/${tripId}/assignments/${moved.id}/move`, {
        data: { new_day_id: dayIds[3], order_index: null },
      })
      break
    }
  }
  const day4 = await assignmentsOn(page.request, 3)
  const rank = (placeId: number) => {
    const i = day4Order.indexOf(placeId)
    return i === -1 ? day4Order.length : i
  }
  const orderedIds = [...day4].sort((a, b) => rank(a.place_id) - rank(b.place_id)).map(a => a.id)
  await page.request.put(`/api/trips/${tripId}/days/${dayIds[3]}/assignments/reorder`, { data: { orderedIds } })
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
  // A followed track is recorded per day even when the drive needed no via to
  // follow it, and deleting vias leaves that record standing: clear it too.
  const res = await page.request.get(`/api/trips/${tripId}/roadtrip/vias`)
  const { tracks = [] } = (await res.json()) as { tracks?: { day_id: number }[] }
  for (const track of tracks) {
    await page.request.post(`/api/trips/${tripId}/roadtrip/days/${track.day_id}/vias/batch`, {
      data: { vias: [], track: null },
    })
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
        // Hakone Shrine, not a seeded stop: every seeded visit has an end time
        // from the day plan, and a stop with one opens the read-only "until"
        // version of the dialog, which has no slider and no Save. The drive's
        // own fixture places carry no times, so the badge is the plus of Add a stay.
        target: p => stopItem(p, 'Hakone Shrine').getByRole('button', { name: /^(Time at this stop|Add a stay)/ }),
        act: async p => {
          await stopItem(p, 'Hakone Shrine').getByRole('button', { name: /^(Time at this stop|Add a stay)/ }).click()
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
          await expect(stopItem(p, 'Hakone Shrine')).toContainText('1 h', { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      // Zero, not null: the update folds a null into "leave it alone".
      await restorePlace(p, 'Hakone Shrine', { duration_minutes: 0 })
      await restorePlace(p, 'Meiji Jingu', { stop_type: null })
    },
  },
  'roadtrip-reorder': {
    guide: guide('roadtrip-reorder'),
    start: async p => {
      day4Order = await placeOrder(p, 3)
      await openRoadtrip(p)
    },
    steps: [
      {
        // Hakone Shrine onto Shinjuku Gyoen: the shrine moves up beside
        // Owakudani, and the day stops driving to Tokyo and back.
        target: p => stopItem(p, 'Hakone Shrine'),
        dropTo: p => stopItem(p, 'Shinjuku Gyoen'),
        clip: async (p, frame) => {
          await dragLoop(p, stopItem(p, 'Hakone Shrine'), stopItem(p, 'Shinjuku Gyoen'), frame)
          await expect.poll(() => before(p, 3, 'Hakone Shrine', 'Shinjuku Gyoen'), { timeout: 20_000 }).toBe(true)
          await holdResult(p, frame)
        },
      },
      {
        // Onto the Open-Air Museum on day 3, the Hakone day the card just above:
        // the shrine on Lake Ashi joins the lake and the museum. A day close by,
        // and not Tokyo's day 2: the picture centres the stop it picks up in the
        // rail, whatever a prepare scrolled to before, and with day 3 and the
        // head of day 4 between them day 2 then lies above the rail's window, so
        // the pointer let go off the rail and nothing moved.
        target: p => stopItem(p, 'Hakone Shrine'),
        dropTo: p => stopItem(p, 'Hakone Open-Air Museum'),
        clip: async (p, frame) => {
          await dragLoop(p, stopItem(p, 'Hakone Shrine'), stopItem(p, 'Hakone Open-Air Museum'), frame)
          const shrine = await placeIdOf(p.request, 'Hakone Shrine')
          await expect.poll(async () => (await placeOrder(p, 2)).includes(shrine ?? -1), { timeout: 20_000 }).toBe(true)
          await expect(dayCard(p, 3)).toContainText('Hakone Shrine', { timeout: 30_000 })
          await holdResult(p, frame)
        },
      },
      {
        // Day 4 is Owakudani and Shinjuku Gyoen now; Alt and up puts the garden
        // first, and the day drives out of Tokyo to the valley.
        target: p => stopRow(p, 'Shinjuku Gyoen'),
        act: async p => {
          await stopRow(p, 'Shinjuku Gyoen').focus()
          await p.keyboard.press('Alt+ArrowUp')
          await expect.poll(() => before(p, 3, 'Shinjuku Gyoen', 'Owakudani'), { timeout: 20_000 }).toBe(true)
          await settle(p)
        },
      },
    ],
    cleanup: restoreDay4,
  },
  'roadtrip-corridor': {
    guide: guide('roadtrip-corridor'),
    start: async p => {
      addedStop = ''
      await openRoadtrip(p)
    },
    steps: [
      {
        // The line reads "these kinds, along this day", so the kinds come first.
        prepare: async p => {
          await kindPicker(p).click()
          await expect(openList(p)).toBeVisible()
          await settle(p)
        },
        target: openList,
        act: async p => {
          // Fuel is what the panel opens on for a petrol car; Food is ticked beside it.
          await openList(p).getByRole('option', { name: 'Food' }).click()
          await expect(openList(p).getByRole('option', { name: 'Food' })).toHaveAttribute('aria-selected', 'true')
          // The list stays open for a second kind; a second click on its trigger shuts it.
          await kindPicker(p).click()
          await expect(openList(p)).toHaveCount(0)
          await expect(kindPicker(p)).toHaveAccessibleName(/Food/)
          await settle(p)
        },
      },
      {
        target: dayPicker,
        act: async p => {
          await dayPicker(p).click()
          // The rows are options named by the day's number and its label, "2 Day 2".
          await openList(p).getByRole('option', { name: /\bDay 2$/ }).click()
          await expect(dayPicker(p)).toContainText('Day 2')
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
  'roadtrip-overnight': {
    guide: guide('roadtrip-overnight'),
    start: async p => {
      nightStop = ''
      await openRoadtrip(p)
    },
    steps: [
      {
        target: searchCard,
        act: async p => {
          // Accommodation on its own: the panel opens on Fuel for a petrol car,
          // so Accommodation is ticked first and Fuel taken off after it (the
          // trigger is only named "Looking for: ..." while something is ticked).
          await kindPicker(p).click()
          await expect(openList(p)).toBeVisible()
          await openList(p).getByRole('option', { name: 'Accommodation' }).click()
          const fuel = openList(p).getByRole('option', { name: 'Fuel' })
          if ((await fuel.getAttribute('aria-selected')) === 'true') await fuel.click()
          await kindPicker(p).click()
          await expect(openList(p)).toHaveCount(0)
          await expect(kindPicker(p)).toHaveAccessibleName('Looking for: Accommodation')
          // Day 4 ends in Hakone, where the inns are.
          await dayPicker(p).click()
          await openList(p).getByRole('option', { name: /\bDay 4$/ }).click()
          await expect(dayPicker(p)).toContainText('Day 4')
          await corridor(p).getByRole('button', { name: 'Search', exact: true }).click()
          await expect(nightButton(p)).toBeVisible({ timeout: 180_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          nightStop = (await nightRow(p).innerText()).split('\n')[0] ?? ''
          await nightRow(p).hover()
          await settle(p)
        },
        target: nightButton,
        act: async p => {
          await nightButton(p).click()
          await expect(modal(p).getByRole('heading', { name: 'Add as a stop' })).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      {
        // Left on Overnight, which is what a hotel opens on.
        target: p => modal(p).getByRole('group', { name: 'Kind of stop' }),
        act: async p => {
          await expect(modal(p).getByRole('button', { name: 'Overnight', exact: true })).toHaveAttribute('aria-pressed', 'true')
        },
      },
      only(p => dialog(p).locator('aside').filter({ hasText: 'Find accommodation' })),
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 30_000 })
          await expect
            .poll(async () => (await listPlaces(p)).some(x => x.name === nightStop), { timeout: 30_000 })
            .toBe(true)
          await expect(rail(p).getByText(nightStop).first()).toBeVisible({ timeout: 30_000 })
          await rail(p).getByText(nightStop).first().scrollIntoViewIfNeeded()
          await settle(p)
        },
      },
    ],
    // The stay goes first, with the booking it brought, then the place.
    cleanup: p => removeNightAt(p.request, nightStop),
  },
  'roadtrip-via': {
    guide: guide('roadtrip-via'),
    start: openRoadtrip,
    steps: [
      {
        // A stop of day 4, the drive out of Tokyo: the one leg long enough to be
        // worth bending, and once Hakone is in the middle of the map it runs
        // east across the open map rather than under the right column.
        target: p => stopItem(p, 'Hakone Shrine'),
        act: async p => {
          await frameOnStop(p, 'Hakone Shrine')
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
        // Day 4's long drive between Tokyo and Hakone, not a city leg: for three
        // kilometres across Shibuya the router knows one sensible way, and the
        // bar says only that.
        prepare: aimAtLongLeg,
        target: altBand,
        act: async p => {
          await altBand(p).click()
          await expect(p.getByText('Ways to drive this leg')).toBeVisible({ timeout: 60_000 })
          await expect(p.getByText('Asking the router…')).toHaveCount(0, { timeout: 60_000 })
          // Both are answers of the public routers, not of this script; said
          // outright, so a run on a day they will not help reads as that.
          if (await p.getByText('The router is not answering right now.').isVisible()) {
            throw new Error('the alternatives router did not answer (OSRM demo or public Valhalla)')
          }
          if (await p.getByText('Only one sensible way to drive this one.').isVisible()) {
            throw new Error(`the router offered one way only for day 4's leg ${altLeg + 1}`)
          }
          await expect(altBar(p).getByRole('button', { name: /km/ }).nth(1)).toBeVisible({ timeout: 60_000 })
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
      // By its title, not by a switch: without an avoidance router the switches
      // are replaced by a dash and the section is all that is left of it.
      only(p => modal(p).getByText('Avoid where possible', { exact: true }).locator('xpath=ancestor::section[1]')),
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
  'roadtrip-stop-fill': {
    guide: guide('roadtrip-stop-fill'),
    start: async p => {
      await ensureFuelStop(p.request)
      await openRoadtrip(p)
    },
    steps: [
      {
        // Faint "80 %": the stop follows the trip's Fill up to.
        target: p => fillBadge(p, FUEL_STOP.name),
        act: async p => {
          await fillBadge(p, FUEL_STOP.name).click()
          await expect(fillPopover(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: fillPopover,
        act: async p => {
          await fillPopover(p).getByRole('button', { name: '100', exact: true }).click()
          await expect(fillPopover(p)).toHaveCount(0)
          await expect(stopItem(p, FUEL_STOP.name)).toContainText('100 %', { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await fillBadge(p, FUEL_STOP.name).click()
          await expect(fillPopover(p)).toBeVisible()
          await settle(p)
        },
        target: p => fillPopover(p).getByRole('button', { name: /^Use my default/ }),
        act: async p => {
          await fillPopover(p).getByRole('button', { name: /^Use my default/ }).click()
          await expect(fillPopover(p)).toHaveCount(0)
          await expect(stopItem(p, FUEL_STOP.name)).toContainText('80 %', { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => removeFuelStop(p.request),
  },
  'roadtrip-bookings': {
    guide: guide('roadtrip-bookings'),
    start: async p => {
      await ensureFerry(p.request)
      await openRoadtrip(p)
    },
    steps: [
      only(p => dayCard(p, 3)),
      only(rideCard),
      only(checkInPill),
      {
        target: rideCard,
        act: async p => {
          await rideCard(p).click()
          await expect(modal(p)).toContainText(FERRY.title, { timeout: 15_000 })
          await settle(p)
          await closeModal(p)
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await closeModal(p)
      await removeFerry(p.request)
    },
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
  'roadtrip-google-import': {
    guide: guide('roadtrip-google-import'),
    start: async p => {
      await stubGooglePreview(p)
      await openRoadtrip(p)
    },
    steps: [
      {
        target: p => corridor(p).getByRole('button', { name: 'Import Google Maps route', exact: true }),
        act: async p => {
          await corridor(p).getByRole('button', { name: 'Import Google Maps route', exact: true }).click()
          await p.getByRole('menu').getByRole('button', { name: 'Import Google Maps route' }).click()
          await expect(modal(p).getByRole('heading', { name: 'Import Google Maps route' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('textbox', { name: 'Google Maps URL' }),
        act: async p => {
          await modal(p).getByRole('textbox', { name: 'Google Maps URL' }).fill(GOOGLE_ROUTE.url)
          await modal(p).getByRole('button', { name: 'Preview', exact: true }).click()
          await expect(modal(p).getByRole('list').first()).toContainText('Lake Kawaguchi', { timeout: 30_000 })
          await settle(p)
        },
      },
      only(p => modal(p).getByRole('list').first()),
      {
        target: dialog,
        act: async p => {
          // Day 3, the Hakone day: the route goes on round Mount Fuji from there.
          await modal(p).getByRole('button', { name: /^Day \d+/, expanded: false }).first().click()
          await expect(selectMenu(p)).toBeVisible()
          await selectMenu(p).getByRole('button', { name: 'Day 3', exact: true }).click()
          await expect(modal(p).getByRole('button', { name: /^Day 3/ }).first()).toBeVisible()
          await modal(p).getByRole('button', { name: 'Import', exact: true }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 60_000 })
          const day3 = async () => {
            const ids = await placeOrder(p, 2)
            return Promise.all(['Gotemba Premium Outlets', 'Lake Kawaguchi'].map(async n => ids.includes((await placeIdOf(p.request, n)) ?? -1)))
          }
          await expect.poll(async () => (await day3()).every(Boolean), { timeout: 30_000 }).toBe(true)
          await expect(dayCard(p, 3)).toContainText('Lake Kawaguchi', { timeout: 60_000 })
          await dayCard(p, 3).scrollIntoViewIfNeeded()
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await p.unrouteAll({ behavior: 'ignoreErrors' })
      await removeImportedStops(p.request)
    },
  },
  'roadtrip-hazards': {
    guide: guide('roadtrip-hazards'),
    start: async p => {
      // The stub sits on the browser context: the service worker fetches the
      // feed itself, and a page route would let the live warnings through.
      await stubHazards(p)
      await openRoadtrip(p)
    },
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
        target: p => modal(p).getByText('Current warnings', { exact: true }).locator('xpath=ancestor::section[1]'),
        act: async p => {
          const toggle = modal(p).getByRole('button', { name: 'Show hazard areas', exact: true })
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'true')
          // The footer's Close, not the cross in the head band.
          await modal(p).getByRole('button', { name: 'Close', exact: true }).last().click()
          await expect(modal(p)).toHaveCount(0)
          await expect(hazardArea(p)).toBeAttached({ timeout: 30_000 })
          // The map stands fitted to the whole trip, where the storm over Hakone
          // is a small patch near the right column, crossed by the drive and its
          // pins, and wherever the fit lands decides whether it is reachable at
          // all. Hakone Shrine lies inside it, so framing on
          // that stop (the way the via guide brings its leg into view) puts the
          // area in the middle of the map at the same zoom, outline and all.
          await frameOnStop(p, 'Hakone Shrine')
          await aimAtHazard(p)
        },
      },
      {
        target: hazardArea,
        hover: async p => { await p.mouse.move(hazardAt.x, hazardAt.y) },
        act: async p => {
          await p.mouse.click(hazardAt.x, hazardAt.y)
          await expect(hazardPopup(p)).toContainText(HAZARD_TITLE, { timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await p.context().unrouteAll({ behavior: 'ignoreErrors' })
      await hideHazards(p.request)
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureRoadtripFixtures(request)
  await overnightFlight(request)
})

test.afterAll(async ({ request }) => {
  // Instance-wide, not trip-scoped: left on, every trip's left column grows the
  // Days / Road trip switch and every other screen's pictures change. Here
  // rather than in the last guide's cleanup, so a failed run puts it back too.
  await request.put('/api/admin/addons/roadtrip', { data: { enabled: false } })
  await restoreFlight(request)
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
