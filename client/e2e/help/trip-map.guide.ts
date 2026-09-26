import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, settle, typeInto, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, ensureMapFixtures } from './fixtures'
import { openTrip, openTripOnDay, selectDay, modal } from './trip-shared'
import { ensureDawarichConnection, disconnectDawarich } from './external'
import { tripMapContext, tripMapGuides } from '../../src/help/contexts/tripMap'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the map in the middle of a trip's plan, keyed by the ids in
 * `src/help/contexts/tripMap.ts`. They run on the seeded "Autumn in Japan"
 * with the Tokyo to Kyoto train added up front, so the bulk booking-route
 * toggle has a second route to draw inside the frame; what a guide changes it
 * puts back in `cleanup`, so the next one starts the same.
 */

const guide = (id: string): HelpGuide => {
  const g = tripMapGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** The Leaflet map: the whole middle of the plan, with both columns floating over it. */
const map = (page: Page) => page.locator('#trek-map')
/** A cluster bubble. Its only text is the number of places folded into it. */
const clusters = (page: Page) => page.locator('#trek-map .marker-cluster-custom')
/**
 * A place pin. Cluster bubbles and the explore results are markers too, so both
 * are excluded: a bubble holds `.marker-cluster-custom`, and only a result pin
 * carries an `aria-label` (a place marker is a bare divIcon with no name at all,
 * which is why a specific place can only be found through its order badge).
 */
const pins = (page: Page) =>
  page.locator('#trek-map .leaflet-marker-icon:not(:has(.marker-cluster-custom)):not([aria-label])')
/** The pin of the stop that is number `n` in the open day. */
const badged = (page: Page, n: number) => pins(page).filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).first()
/** An explore result: the one kind of marker with an accessible name. */
const poiPins = (page: Page) => page.locator('#trek-map .leaflet-marker-icon[aria-label]')
/** The end of a drawn booking route. */
const endpoints = (page: Page) => page.locator('#trek-map .trek-endpoint-marker')
/** The card that follows the pointer over a pin. */
const hoverCard = (page: Page) => page.getByTestId('tooltip')
/**
 * A category of the explore pill. The phone portal renders a second copy of the
 * whole pill, hidden at this width, so this goes by role rather than by
 * `aria-label`, which would match both.
 */
const category = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true })
/** The pill itself: the nearest block holding the first category and the last. */
const categoryRow = (page: Page) =>
  category(page, 'Restaurants').locator('xpath=ancestor::div[.//button[@aria-label="Activities"]][1]')
/** The route icon on a booking's row, and the one in the toolbar above the days. */
const connection = (page: Page, shown: boolean) =>
  page.locator(`button[aria-label="${shown ? 'Hide' : 'Show'} booking routes"]`)
const allConnections = (page: Page, shown: boolean) =>
  page.locator(`button[aria-label="${shown ? 'Hide' : 'Show'} all booking routes"]`)
const overviewPanel = (page: Page) => page.getByTestId('trip-overview-panel')
/** The round Dawarich button under the whole-trip one; its label is its state. */
const trailPill = (page: Page) => page.getByTestId('dawarich-trail-pill')
/**
 * The recorded route. Leaflet writes the dash pattern onto the path, and "6 5"
 * is this layer's alone: the pending booking routes use "6, 6", the picked
 * alternative "2 7", so the dashed days are the one thing on the map with it.
 */
const trail = (page: Page) => page.locator('#trek-map path[stroke-dasharray="6 5"]')
/**
 * The GL renderer. There is no `#trek-map` on it: `MapViewGL` mounts a bare
 * `div.w-full.h-full` and MapLibre puts its own canvas inside, so the compass
 * guide goes by that class. The map itself is reached through
 * `window.__trek_map`, which `MapViewGL` publishes on build for exactly this.
 */
const glCanvas = (page: Page) => page.locator('.maplibregl-canvas')
/**
 * The compass button and the frosted pill around it. The planner renders the
 * pill twice, once in the desktop cluster beside the category row and once for
 * phones, `md:hidden` at this width; `getByRole` leaves the hidden copy out.
 */
const resetNorth = (page: Page) => page.getByRole('button', { name: 'Reset north' })
const compassPill = (page: Page) => resetNorth(page).locator('xpath=..')
/** The sheet a booking's endpoint opens. Its own portal, and the only Close on the plan. */
const sheetClose = (page: Page) => page.getByRole('button', { name: 'Close', exact: true })
/** A row of the places column. */
const row = (page: Page, name: string) => page.getByRole('option').filter({ hasText: name }).first()
/**
 * The card that opens under the map when a place is selected. By its own test
 * id, not by a button in it: the collection button reads Save to Collection or
 * Saved depending on whether that place is already in a list, and the seed puts
 * the three Kyoto places in one, so a locator on the label matches for some
 * pins and for others not.
 */
const inspector = (page: Page) => page.getByTestId('inspector-scroll')
/** The details panel's collapse: it keeps the day selected, where its close would drop it. */
const collapseDayDetails = (page: Page) => page.locator('button:has(svg.lucide-chevrons-down)')

/**
 * A spot on the map with nothing on it: right of the days column, left of the
 * explore pill, and clear of everything the plan floats over the lower half of
 * the map. Map-relative, so it is passed as a click `position`.
 */
const EMPTY = { x: 470, y: 80 }

/**
 * The first marker of a set the pointer can actually reach. Leaflet stacks
 * markers that overlap and the two columns float over the edges of the map, so
 * `.first()` is regularly one that nothing can hover, let alone click. Explore
 * results are searched from the end because Leaflet draws the southernmost
 * marker on top.
 */
async function reachable(locator: Locator, fromEnd = false): Promise<number> {
  const total = await locator.count()
  for (let i = 0; i < total; i++) {
    const index = fromEnd ? total - 1 - i : i
    try {
      await locator.nth(index).hover({ trial: true, timeout: 1500 })
      return index
    } catch {
      // Covered by another marker or by one of the floating columns.
    }
  }
  throw new Error(`no reachable marker among ${total}`)
}

/**
 * Move the map, so "Search this area" appears. Leaflet's own keyboard panning
 * rather than a mouse drag: a drag has to start on bare map, and after a search
 * there are sixty result pins that each swallow the press it starts with.
 */
/**
 * Drag the map the way a reader would.
 *
 * Not the arrow keys: Leaflet only listens for them while its container has
 * focus, and focusing it from here did not take, so the map never moved and the
 * button that only exists once it has never appeared. The drag starts from a
 * point checked to be empty, because a press on a marker drags the place onto a
 * day instead of moving the map.
 */
async function panMap(page: Page): Promise<void> {
  const box = await map(page).boundingBox()
  if (!box) throw new Error('the map has no box to drag')
  const candidates = [0.3, 0.7, 0.5].flatMap(fx => [0.75, 0.25].map(fy => ({
    x: Math.round(box.x + box.width * fx),
    y: Math.round(box.y + box.height * fy),
  })))
  let from: { x: number; y: number } | undefined
  for (const point of candidates) {
    const clear = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      return !!el && !el.closest('.leaflet-marker-icon, button, [role="button"], .leaflet-control')
    }, point)
    if (clear) { from = point; break }
  }
  if (!from) throw new Error('found nowhere on the map to take hold of')
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  // In steps, so Leaflet reads a drag rather than a click.
  for (let i = 1; i <= 8; i++) await page.mouse.move(from.x - i * 22, from.y - i * 9, { steps: 2 })
  await page.mouse.up()
  await settle(page)
}

/**
 * Open the trip framed on day 1's two Tokyo stops.
 *
 * The frame is what the three guides starting here have in common: one
 * right-clicks a fixed point on the map and needs a street under it, one asks
 * the map what it can see for cafes, one puts imagery under the pins. The
 * whole-trip fit spans Japan, where that fixed point is the Sea of Japan as
 * often as it is a street and the address look-up comes back empty, and zooming
 * into whichever cluster the pointer reaches first lands on Tokyo or on Kyoto by
 * chance. Day 1 is the one frame the seed guarantees is over a city.
 *
 * The details panel is folded rather than closed: closing it deselects the day
 * (`onClose` in `TripPlannerPage` clears both) and the map goes straight back to
 * the whole trip.
 */
async function openOnTokyo(page: Page): Promise<void> {
  await openTripOnDay(page, 1)
  await collapseDayDetails(page).last().click()
  await expect(badged(page, 1)).toBeVisible({ timeout: 20_000 })
  await settle(page)
}

/**
 * Which renderer draws the planner and the journals. On the account, not on
 * the trip: `MapViewAuto` reads `settings.map_provider`, and `loadSettings`
 * runs on every page load, so a `page.goto` after this sees the new map.
 */
async function setMapProvider(page: Page, provider: 'leaflet' | 'maplibre-gl'): Promise<void> {
  const res = await page.request.post('/api/settings/bulk', { data: { settings: { map_provider: provider } } })
  if (!res.ok()) throw new Error(`could not set map_provider=${provider}: ${res.status()} ${await res.text()}`)
}

/** The slice of the GL map the compass guide reads and moves, on `window.__trek_map`. */
interface TrekGlMap {
  getBearing: () => number
  getPitch: () => number
  loaded: () => boolean
  areTilesLoaded: () => boolean
  isMoving: () => boolean
  easeTo: (o: { bearing: number; pitch: number; duration: number }) => unknown
}

/** Wait until the GL map has its style, its tiles and a still camera. */
async function glMapIdle(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const m = (window as unknown as { __trek_map?: TrekGlMap }).__trek_map
      return !!m && m.loaded() && m.areTilesLoaded() && !m.isMoving()
    },
    undefined,
    { timeout: 60_000 },
  )
}

/**
 * Wait until the raster basemap has actually painted.
 *
 * `toBeVisible()` on a tile is not enough: Leaflet puts the <img> in the DOM
 * with its position and its size before the byte arrives, so a picture taken on
 * that signal catches the grey underneath. A tile counts only once the browser
 * has decoded it, and a screenful needs several of them.
 */
async function rasterTilesPainted(page: Page, atLeast = 6): Promise<void> {
  await page.waitForFunction(
    min => {
      const tiles = Array.from(document.querySelectorAll('#trek-map img.leaflet-tile'))
      const painted = tiles.filter(t => {
        const img = t as HTMLImageElement
        return img.complete && img.naturalWidth > 0
      })
      return painted.length >= min
    },
    atLeast,
    { timeout: 60_000 },
  )
}

async function deleteByName(page: Page, ...names: string[]): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/places`)
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(body) ? body : (body.places ?? [])
  for (const place of places.filter(x => names.includes(x.name))) {
    await page.request.delete(`/api/trips/${tripId}/places/${place.id}`)
  }
}

/**
 * The markers the running guide works on. Which one is reachable is decided
 * once, by `reachable`, and the steps that follow reuse the answer; `pin` holds
 * a place pin, an explore result or a route endpoint, whichever the guide is
 * about. `found` is the name of the explore result a guide took into the trip,
 * so `cleanup` can take exactly that one out again.
 */
let bubble = 0
let pin = 0
let found = ''

const NEW_PLACE = 'Lunch stop'

const SCRIPTS: Record<string, GuideScript> = {
  'map-markers': {
    guide: guide('map-markers'),
    start: async p => {
      await openTrip(p)
      await expect(clusters(p).first()).toBeVisible({ timeout: 30_000 })
      await settle(p)
      bubble = await reachable(clusters(p))
    },
    steps: [
      {
        target: p => clusters(p).nth(bubble),
        act: async p => {
          await clusters(p).nth(bubble).click()
          await expect.poll(() => pins(p).count(), { timeout: 20_000 }).toBeGreaterThan(2)
          await settle(p)
          pin = await reachable(pins(p))
        },
      },
      {
        // captureGuide hovers the target itself; this only makes sure the card
        // is up before the shot rather than a frame after it.
        prepare: async p => {
          await pins(p).nth(pin).hover()
          await expect(hoverCard(p)).toBeVisible({ timeout: 10_000 })
        },
        target: p => pins(p).nth(pin),
      },
      {
        // The picture worth having is the panel the click opens, not the pin
        // again, so the click is the preparation and the panel is the target.
        prepare: async p => {
          await pins(p).nth(pin).click()
          await expect(inspector(p)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
        target: p => inspector(p).locator('xpath=..'),
        act: async p => {
          await map(p).click({ position: EMPTY })
          await expect(inspector(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await selectDay(p, 1)
          // The panel IS the selection, so it is folded away rather than closed:
          // closing it would take the numbers off the pins again.
          await collapseDayDetails(p).last().click()
          await expect(badged(p, 1)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
        target: p => badged(p, 1),
      },
      {
        // Picture only, like the other drags in this family: HTML5 drag is what
        // the map hands the day plan, and a synthesised one does not start it.
        prepare: async p => {
          pin = await reachable(pins(p))
        },
        target: p => pins(p).nth(pin),
        dropTo: p => p.getByRole('button', { name: /^2 .*Day 2 / }).locator('xpath=..'),
      },
    ],
  },
  'map-nearby-places': {
    guide: guide('map-nearby-places'),
    // A search covers what is on screen, and day 1's fit is the two Tokyo stops
    // with the city between them: enough of a district for the sixty hits to
    // spread over the frame instead of piling up in the middle of it.
    start: openOnTokyo,
    steps: [
      { target: categoryRow },
      {
        target: p => category(p, 'Cafés'),
        act: async p => {
          await category(p, 'Cafés').click()
          await expect(poiPins(p).first()).toBeVisible({ timeout: 40_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await panMap(p)
          await expect(p.getByRole('button', { name: 'Search this area' })).toBeVisible({ timeout: 15_000 })
        },
        target: p => p.getByRole('button', { name: 'Search this area' }),
        act: async p => {
          await p.getByRole('button', { name: 'Search this area' }).click()
          await expect(poiPins(p).first()).toBeVisible({ timeout: 40_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          pin = await reachable(poiPins(p), true)
        },
        target: p => poiPins(p).nth(pin),
        act: async p => {
          await poiPins(p).nth(pin).click()
          const name = modal(p).getByPlaceholder('e.g. Eiffel Tower')
          await expect(name).not.toHaveValue('', { timeout: 20_000 })
          // Which places OpenStreetMap answers with is never the same twice, so
          // the name is read off the form rather than assumed, and `cleanup`
          // deletes exactly what was created.
          found = await name.inputValue()
          await settle(p)
        },
      },
      { target: p => modal(p).getByPlaceholder('e.g. Eiffel Tower').locator('xpath=ancestor::form[1]') },
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(row(p, found)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, found),
  },
  'map-add-place': {
    guide: guide('map-add-place'),
    start: openOnTokyo,
    steps: [
      {
        target: map,
        // The map fills the frame, so the ring would sit nowhere in particular:
        // park the pointer on the spot the right-click is about to land on.
        hover: async p => {
          const box = await map(p).boundingBox()
          if (!box) throw new Error('the map has no box')
          await p.mouse.move(box.x + EMPTY.x, box.y + EMPTY.y)
        },
        act: async p => {
          await map(p).click({ button: 'right', position: EMPTY })
          await expect(modal(p).getByText('Add Place/Activity')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          // The address is a look-up of the coordinates and lands after the form.
          await expect(modal(p).getByPlaceholder('Latitude (e.g. 48.8566)')).not.toHaveValue('')
          await expect(modal(p).getByPlaceholder('Street, City, Country')).not.toHaveValue('', { timeout: 30_000 })
          await settle(p)
        },
        target: p => modal(p).getByPlaceholder('Street, City, Country').locator('xpath=ancestor::div[1]'),
      },
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByPlaceholder('e.g. Eiffel Tower'), NEW_PLACE)
          await settle(p)
        },
        target: p => modal(p).getByPlaceholder('e.g. Eiffel Tower').locator('xpath=ancestor::form[1]'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(row(p, NEW_PLACE)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, NEW_PLACE),
  },
  'map-satellite': {
    guide: guide('map-satellite'),
    start: async p => {
      await openOnTokyo(p)
      pin = await reachable(pins(p))
    },
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Switch to satellite view' }),
        act: async p => {
          await p.getByRole('button', { name: 'Switch to satellite view' }).click()
          await expect(p.getByRole('button', { name: 'Switch to map view' })).toBeVisible()
          // The imagery is raster tiles from a third party, and the switch is
          // done long before they are on screen.
          await rasterTilesPainted(p)
          await settle(p)
          await p.waitForTimeout(1500)
        },
      },
      { prepare: p => rasterTilesPainted(p), target: p => pins(p).nth(pin) },
      {
        prepare: p => rasterTilesPainted(p),
        target: p => p.getByRole('button', { name: 'Switch to map view' }),
        act: async p => {
          await p.getByRole('button', { name: 'Switch to map view' }).click()
          await expect(p.getByRole('button', { name: 'Switch to satellite view' })).toBeVisible()
          await settle(p)
        },
      },
    ],
    // The layer is kept on the account, not on the trip: left on satellite it
    // would be the basemap of every picture taken after this guide.
    cleanup: async p => {
      await p.request.post('/api/settings/bulk', { data: { settings: { map_base_layer: 'default' } } })
    },
  },
  'map-whole-trip': {
    guide: guide('map-whole-trip'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => p.getByTestId('trip-overview-pill'),
        act: async p => {
          await p.getByTestId('trip-overview-pill').click()
          // One router request per leg, paced, so the card takes its time.
          await expect(overviewPanel(p)).toBeVisible({ timeout: 60_000 })
          await settle(p)
        },
      },
      {
        // The total carries an … until every leg has answered; a picture taken
        // before that shows a partial sum.
        prepare: async p => {
          await expect(overviewPanel(p)).not.toContainText('…', { timeout: 90_000 })
          await settle(p)
        },
        target: overviewPanel,
      },
      {
        target: p => overviewPanel(p).getByRole('button').first(),
        act: async p => {
          await overviewPanel(p).getByRole('button').first().click()
          await settle(p)
        },
      },
      // No act: the guide ends with the whole trip on the map, which is what
      // the result picture is of. `cleanup` presses the button.
      { target: p => p.getByRole('button', { name: 'Hide whole trip' }) },
    ],
    cleanup: async p => {
      const off = p.getByRole('button', { name: 'Hide whole trip' })
      if (await off.isVisible().catch(() => false)) await off.click()
    },
  },
  'map-booking-routes': {
    guide: guide('map-booking-routes'),
    start: p => openTrip(p),
    steps: [
      { target: p => connection(p, false).first() },
      {
        prepare: async p => {
          await connection(p, false).first().click()
          await expect.poll(() => endpoints(p).count(), { timeout: 30_000 }).toBeGreaterThan(1)
          await settle(p)
          pin = await reachable(endpoints(p))
        },
        target: p => endpoints(p).nth(pin),
        act: async p => {
          await endpoints(p).nth(pin).click()
          await expect(sheetClose(p)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => sheetClose(p).locator('xpath=ancestor::div[2]'),
        // The booking sheet is its own portal and ignores Escape.
        act: async p => {
          await sheetClose(p).click()
          await expect(sheetClose(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        target: p => allConnections(p, false),
        act: async p => {
          await allConnections(p, false).click()
          await expect.poll(() => endpoints(p).count(), { timeout: 30_000 }).toBeGreaterThan(2)
          await settle(p)
        },
      },
      {
        target: p => allConnections(p, true),
        act: async p => {
          await allConnections(p, true).click()
          await expect(endpoints(p)).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    // The per-trip choice lives in this browser, not on the server, so it would
    // otherwise carry into every guide that runs after it in the same context.
    cleanup: async p => {
      const { tripId } = seededTrip()
      await p.evaluate(id => localStorage.removeItem(`trek:visible-connections:${id}`), tripId)
    },
  },
  'map-dawarich-trail': {
    guide: guide('map-dawarich-trail'),
    // Day 1 in Tokyo: at the whole-trip zoom the recording is one dashed line
    // along the Shinkansen and the walks through the cities vanish under the
    // pins, so the map is framed on a day before the button is pressed;
    // nothing fits the map to the trail.
    start: openOnTokyo,
    steps: [
      {
        target: trailPill,
        act: async p => {
          await trailPill(p).click()
          // One read of the trip's dates from the Dawarich, thinned to 600
          // points a day. The label is the reliable signal: anything but Hide
          // (nothing recorded, unreachable, offline) is not a picture worth
          // taking, so the wait fails on it rather than shooting an empty map.
          await expect(trailPill(p)).toHaveAttribute('aria-label', 'Hide recorded route', { timeout: 120_000 })
          await expect(trail(p).first()).toBeAttached({ timeout: 30_000 })
          await settle(p)
          await p.waitForTimeout(600)
        },
      },
      {
        // The whole map: the dashed day under the planned route, with the
        // pointer parked on an empty spot so no pin's card is in the picture.
        target: map,
        hover: async p => {
          const box = await map(p).boundingBox()
          if (!box) throw new Error('the map has no box')
          await p.mouse.move(box.x + EMPTY.x, box.y + EMPTY.y)
        },
      },
      {
        target: p => p.getByTestId('trip-overview-pill'),
        act: async p => {
          await p.getByTestId('trip-overview-pill').click()
          // One router request per leg, paced; the total carries an … until
          // every leg has answered, and the result picture waits for that.
          await expect(overviewPanel(p)).toBeVisible({ timeout: 60_000 })
          await expect(overviewPanel(p)).not.toContainText('…', { timeout: 90_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const off = p.getByRole('button', { name: 'Hide whole trip' })
      if (await off.isVisible().catch(() => false)) await off.click()
      if ((await trailPill(p).getAttribute('aria-pressed').catch(() => null)) === 'true') await trailPill(p).click()
      // Per trip and per browser session; the test's context ends here, but
      // be explicit rather than trust that.
      const { tripId } = seededTrip()
      await p.evaluate(id => sessionStorage.removeItem(`trip-dawarich-${id}`), tripId)
    },
  },

  'map-compass': {
    guide: guide('map-compass'),
    // The compass only exists on the GL renderers, so the guide switches the
    // account to MapLibre GL (no token, OpenFreeMap tiles) before opening the
    // trip, and `cleanup` puts Leaflet back: every other map guide goes by
    // `#trek-map`, which the GL map does not have.
    start: async p => {
      await setMapProvider(p, 'maplibre-gl')
      await openTrip(p)
      // MapViewAuto shows Leaflet while the GL chunk loads, then swaps; WebGL
      // runs on SwiftShader headless at 1920×1080×2, so the style, the vector
      // tiles from tiles.openfreemap.org and the day-1 framing take their time.
      await expect(glCanvas(p)).toBeVisible({ timeout: 60_000 })
      await expect(resetNorth(p)).toBeVisible({ timeout: 30_000 })
      await glMapIdle(p)
      await settle(p)
      // `settle` counts `<img>` loads; a WebGL canvas has none, so give the
      // tiles a moment to paint or the picture catches the blank canvas.
      await p.waitForTimeout(2000)
    },
    steps: [
      {
        // The turn itself is the map's own camera move rather than a synthetic
        // right-button drag: a drag has to start on bare canvas, and the pins,
        // the two floating columns and the explore pill all sit over it. 35°
        // is enough for the streets to lie visibly askew and the arrow to lean.
        prepare: async p => {
          await p.evaluate(() => {
            const m = (window as unknown as { __trek_map?: TrekGlMap }).__trek_map
            if (!m) throw new Error('no GL map on the page')
            m.easeTo({ bearing: 35, pitch: 0, duration: 0 })
          })
          await p.waitForFunction(() => {
            const m = (window as unknown as { __trek_map?: TrekGlMap }).__trek_map
            return !!m && Math.abs(m.getBearing() - 35) < 0.5 && !m.isMoving()
          })
          await settle(p)
        },
        target: compassPill,
      },
      {
        target: compassPill,
        act: async p => {
          await resetNorth(p).click()
          // `easeTo` takes 300 ms; the compass is only upright once it has landed.
          await p.waitForFunction(() => {
            const m = (window as unknown as { __trek_map?: TrekGlMap }).__trek_map
            return !!m && Math.abs(m.getBearing()) < 0.5 && Math.abs(m.getPitch()) < 0.5 && !m.isMoving()
          })
          await settle(p)
        },
      },
    ],
    // The renderer is kept on the account, not on the trip: left on MapLibre it
    // would be the map of every picture taken after this guide, and every
    // `#trek-map` locator in the other guides would find nothing.
    cleanup: p => setMapProvider(p, 'leaflet'),
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureMapFixtures(request)
  // The recorded route: the addon on, the signed-in user connected to the
  // Dawarich from media.env, the synthetic recording of the trip uploaded.
  await ensureDawarichConnection(request)
})

test.afterAll(async ({ request }) => {
  // Instance-wide, not trip-scoped: while the addon is on, every trip map
  // carries the round Dawarich button in its bottom-right corner. This file's
  // pictures show it on purpose; the other trip screens' do not, so it goes
  // off again here, whatever happened in between. The renderer likewise: the
  // compass guide puts Leaflet back in its cleanup, but a guide that fails
  // never reaches its cleanup, and every `#trek-map` locator in the files that
  // run after this one would find a GL canvas instead.
  await disconnectDawarich(request)
  await request.post('/api/settings/bulk', { data: { settings: { map_provider: 'leaflet' } } })
})

test('every registered map guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripMapContext.guides].sort())
})

test('hero: trip-map', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripMapContext.id, p => openTrip(p))
})

for (const id of tripMapContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
