import { test, expect, type Page, type Locator, type Request } from '@playwright/test'
import path from 'node:path'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, OUT_DIR, PICTURE_DAY, type GuideScript } from './guide'
import { ensureExtraTrips } from './fixtures'
import { collectionsGuides, collectionsContext } from '../../src/help/contexts/collections'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Collections guides, keyed by the ids in
 * `src/help/contexts/collections.ts`. The seed leaves one list, "Kyoto
 * shortlist", with the Japan trip's three Kyoto places on it; the guides add a
 * second list, a Kyoto place found by search, three more Kyoto temples taken
 * from the trip, a label, a member and a file round trip, in the order the
 * context lists them, and leave the list side of it in place. Whatever they put
 * into a trip comes out again in that guide's cleanup.
 */

const KYOTO = 'Kyoto shortlist'
const LISBON = 'Lisbon coffee'
const JAPAN = 'Autumn in Japan'

/**
 * Kyoto places the import guide puts into the Japan trip first. The seed's trip
 * holds Tokyo and the three Kyoto places the list already has, so an import from
 * it could only add Tokyo to a list called "Kyoto shortlist", and every later
 * picture would carry that. None of these is on a day, which is also what the
 * import's third step says starts out selected.
 */
const KYOTO_EXTRAS = [
  { name: 'Kinkaku-ji Temple', lat: 35.0394, lng: 135.7292, address: '1 Kinkakujicho, Kita Ward, Kyoto',
    description: 'The Golden Pavilion, mirrored in its pond.' },
  { name: 'Tenryu-ji Temple', lat: 35.0158, lng: 135.6737, address: '68 Sagatenryuji Susukinobabacho, Ukyo Ward, Kyoto',
    description: 'Zen garden next to the bamboo grove.' },
  { name: 'Kiyomizu-dera Temple', lat: 34.9949, lng: 135.785, address: '1-294 Kiyomizu, Higashiyama Ward, Kyoto',
    description: 'The wooden stage over the maples.' },
]
/** The two places in Arashiyama, which the labels guide groups under that name. */
const ARASHIYAMA_PLACES = ['Arashiyama Bamboo Grove', 'Tenryu-ji Temple']

const guide = (id: string): HelpGuide => {
  const g = collectionsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const rail = (page: Page) => page.locator('.col-rail')
const listRow = (page: Page, name: string) => rail(page).locator('button.col-row-btn').filter({ has: page.locator('.nm').getByText(name, { exact: true }) })
const hero = (page: Page) => page.locator('.col-hero')
const filterBar = (page: Page) => page.locator('.col-filterbar')
const modal = (page: Page) => page.locator('.trek-modal-backdrop').last()
/** The rounded panel inside the backdrop, for framing a whole dialog. */
const modalCard = (page: Page) => modal(page).locator('> [role="dialog"]').first()
/** A trip's tile on the first step of the import from a trip. */
const importTrip = (page: Page, title: string) => modal(page).getByRole('button').filter({ hasText: title })
/**
 * The trip tiles on the first step of that import, and the rows of a trip's
 * places on its second step: each is the dialog's only staggered block while it
 * is on screen.
 */
const importStagger = (page: Page) => modal(page).locator('.trek-stagger')
const placeRow = (page: Page, name: string) => page.locator('.col-lrow').filter({ hasText: name }).first()
const placeRows = (page: Page) => page.locator('.col-lrow')
const selectionBar = (page: Page) => page.locator('.col-selbar')
/** The detail sheet beside the list. */
const detail = (page: Page) => page.locator('.col-detail').first()
/** The map beside the list, with its floating controls. */
const mapShell = (page: Page) => page.locator('.col-map-shell')
/** The map's search pill: the magnifier and the field together. */
const mapSearch = (page: Page) => mapShell(page).locator('.col-map-search').first()

// ── Trip data over the API ────────────────────────────────────────────────────

async function tripIdOf(page: Page, title: string): Promise<number> {
  const res = await page.request.get('/api/trips')
  const body = (await res.json()) as { trips?: { id: number; title: string }[] } | { id: number; title: string }[]
  const trips = Array.isArray(body) ? body : (body.trips ?? [])
  const trip = trips.find(t => t.title === title)
  if (!trip) throw new Error(`trip "${title}" is missing`)
  return trip.id
}

async function tripPlaces(page: Page, tripId: number): Promise<{ id: number; name: string }[]> {
  const res = await page.request.get(`/api/trips/${tripId}/places`)
  if (!res.ok()) throw new Error(`GET places of trip ${tripId}: ${res.status()}`)
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  return Array.isArray(body) ? body : (body.places ?? [])
}

async function deleteTripPlaces(page: Page, tripId: number, ids: number[]): Promise<void> {
  for (const id of ids) {
    const res = await page.request.delete(`/api/trips/${tripId}/places/${id}`)
    if (!res.ok() && res.status() !== 404) throw new Error(`DELETE place ${id} of trip ${tripId}: ${res.status()}`)
  }
}

/** The places the import guide put into the Japan trip, removed again in its cleanup. */
let addedToTrip: number[] = []
/** The Japan trip's places before the copy guide ran; everything else is the copy's. */
let placesBeforeCopy: Set<number> | null = null

// ── Waiting for the page to look finished ─────────────────────────────────────

/**
 * Take focus off whatever holds it. A focused field or a button that got focus
 * back from a closed dialog draws an outline in the accent, which in a picture
 * reads as a second step ring.
 */
async function blurFocus(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.())
}

/**
 * Let a Leaflet camera move that is under way arrive.
 *
 * Leaflet times a pan from `+new Date()`, and the browser's clock is pinned to
 * the picture day (guide.ts), so a pan started for a picture never gets past its
 * first frame: the map stays where it was and the place the text says it pans
 * to is not in view. Moving the fixed time on for a moment lets the running
 * animation see that its time is up and finish, exactly where it would have
 * ended; the clock goes back to the picture day straight after.
 */
async function finishMapMotion(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(PICTURE_DAY.getTime() + 10_000))
  await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))))
  await page.clock.setFixedTime(PICTURE_DAY)
}

/**
 * Wait until the map has stopped moving and shows its pins in the part of it
 * that is on screen: every pin, or with `every: false` at least one, for a map
 * that has just panned to one place and may have left others behind its edge.
 * Nothing to wait for where the list has no map.
 */
async function mapReady(page: Page, { every = true } = {}): Promise<void> {
  if (!(await mapShell(page).count())) return
  await finishMapMotion(page)
  await expect
    .poll(
      () =>
        mapShell(page).evaluate((el, every) => {
          if (el.querySelector('.leaflet-zoom-anim, .leaflet-pan-anim, .leaflet-cluster-anim')) return 'moving'
          const map = el.getBoundingClientRect()
          const box = {
            left: Math.max(map.left, 0),
            top: Math.max(map.top, 0),
            right: Math.min(map.right, window.innerWidth),
            bottom: Math.min(map.bottom, window.innerHeight),
          }
          const icons = Array.from(el.querySelectorAll('.leaflet-marker-icon')).map(i => i.getBoundingClientRect())
          const inside = icons.filter(r => r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom).length
          if (!inside) return 'no pins in view'
          return every && inside < icons.length ? `${icons.length - inside} of ${icons.length} pins out of view` : 'ready'
        }, every, { timeout: 2_000 }), // short: a map on its way off the page is asked again, not waited for
      { message: 'the map shows the pins of the list', timeout: 15_000 },
    )
    .toBe('ready')
}

/**
 * Frame the map on the list that is open.
 *
 * The map opens on a camera worked out for the whole window, not for the pane it
 * sits in (MapView's opening frame), so on this page it starts about one zoom
 * level too close and every pin is off its edges. It frames the pane properly
 * whenever the number of places on it changes, so the search pill is used to
 * empty it and fill it again, which is what a reader who searches and clears the
 * search sees. The pill ends empty and the page as it was.
 */
async function frameMap(page: Page): Promise<void> {
  if (!(await mapShell(page).count())) return
  const field = mapSearch(page).locator('input')
  const rows = await placeRows(page).count()
  await field.fill('zzz')
  await expect(placeRows(page)).toHaveCount(0)
  await field.fill('')
  await expect(placeRows(page)).toHaveCount(rows)
  await blurFocus(page)
  await mapReady(page)
}

/** Photo requests of each page still in flight: the lookups and the images they point at. */
const photoRequests = new WeakMap<Page, Set<Request>>()

function trackPhotos(page: Page): void {
  if (photoRequests.has(page)) return
  const pending = new Set<Request>()
  photoRequests.set(page, pending)
  const isPhoto = (r: Request) => r.url().includes('/api/maps/place-photo/')
  page.on('request', r => { if (isPhoto(r)) pending.add(r) })
  page.on('requestfinished', r => pending.delete(r))
  page.on('requestfailed', r => pending.delete(r))
  // A cached photo whose file has gone answers with an empty 204, and the avatar
  // falls back to its pin. Say so in the log, because that is not the app.
  page.on('response', r => {
    if (isPhoto(r) && r.url().endsWith('/bytes') && r.status() === 204) console.warn(`[collections] empty place photo: ${r.url()}`)
  })
}

/**
 * Wait for the place photos. Each avatar looks its photo up first and loads the
 * image after that, so the lookups can be quiet for a moment while an image is
 * still to come; quiet has to hold for a while before it counts. Bounded, so a
 * lookup that hangs costs time, not the run.
 */
async function photosReady(page: Page): Promise<void> {
  const pending = photoRequests.get(page)
  if (pending) {
    const until = Date.now() + 30_000
    let quietSince = 0
    while (Date.now() < until) {
      if (pending.size) quietSince = 0
      else if (!quietSince) quietSince = Date.now()
      else if (Date.now() - quietSince > 800) break
      await page.waitForTimeout(100)
    }
    if (pending.size) console.warn(`[collections] place photos still loading: ${[...pending].map(r => r.url()).join(', ')}`)
  }
  await page
    .waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('.col-lrow img')).every(img => img.complete), undefined, { timeout: 10_000 })
    .catch(() => {})
}

/** Map framed, pins drawn, photos in, nothing focused: a page ready for its picture. */
async function pageReady(page: Page, { reframe = false, every = true } = {}): Promise<void> {
  if (reframe) await frameMap(page)
  else await mapReady(page, { every })
  await photosReady(page)
  await blurFocus(page)
  await settle(page)
}

async function openCollections(page: Page): Promise<void> {
  trackPhotos(page)
  await page.goto('/collections')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(rail(page)).toBeVisible({ timeout: 20_000 })
  await expect(listRow(page, KYOTO)).toBeVisible({ timeout: 20_000 })
  // All saved, which this lands on, always has places, and the map comes with them.
  await expect(placeRows(page).first()).toBeVisible({ timeout: 20_000 })
  await pageReady(page, { reframe: true })
}

async function openList(page: Page, name: string): Promise<void> {
  await openCollections(page)
  await listRow(page, name).click()
  await expect(hero(page)).toContainText(name)
  // Until its places are in, the page can still show the map of the list before.
  await settle(page)
  await expect(page.locator('.col-loading')).toHaveCount(0)
  await pageReady(page, { reframe: true })
}

/** Turn on select mode and tick the named places. */
async function selectPlaces(page: Page, names: string[]): Promise<void> {
  await filterBar(page).getByRole('button', { name: 'Select', exact: true }).click()
  await expect(selectionBar(page)).toBeVisible()
  for (const name of names) await placeRow(page, name).click()
  await expect(selectionBar(page)).toContainText(`${names.length} selected`)
}

/** Pick an option in a CustomSelect that has a search box. */
async function pickSearchable(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click()
  const search = page.getByPlaceholder('...')
  await search.waitFor({ state: 'visible', timeout: 5_000 })
  await typeInto(page, search, text)
  await search.locator('xpath=../..').getByRole('button', { name: text, exact: true }).first().click()
}

/** The place the add guide finds by search: not on the list yet, with a real street address. */
const SEARCH_FOR = 'Nijo Castle'
const FOUND = /Nij[oō]/

const SCRIPTS: Record<string, GuideScript> = {
  'create-list': {
    guide: guide('create-list'),
    start: openCollections,
    steps: [
      {
        target: p => rail(p).getByRole('button', { name: 'New list' }),
        act: async p => {
          await rail(p).getByRole('button', { name: 'New list' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: modalCard,
        act: async p => {
          await typeInto(p, modal(p).getByPlaceholder('e.g. Tokyo 2025'), LISBON)
          await modal(p).getByRole('button', { name: '#f97316' }).click()
          await typeInto(p, modal(p).getByPlaceholder('Add a description…'), 'Pastéis, miradouros and the best flat white in Alfama.')
          await beat(p, 400)
          // The description keeps focus after typing, and its focus border sits
          // right next to the ring on Create in the next picture.
          await blurFocus(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create' }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(hero(p)).toContainText(LISBON)
          // The new list is empty: its two ways to fill it replace the list and the map.
          await expect(p.locator('.col-cta').first()).toBeVisible()
          await expect(mapShell(p)).toHaveCount(0)
          await pageReady(p)
        },
      },
    ],
  },

  'add-place': {
    guide: guide('add-place'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => filterBar(p).getByRole('button', { name: 'Add a place' }),
        act: async p => {
          await filterBar(p).getByRole('button', { name: 'Add a place' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // The whole pill, magnifier included, not the bare input inside it.
        target: p => modal(p).getByPlaceholder('Search for a place…').locator('xpath=..'),
        act: async p => {
          const search = modal(p).getByPlaceholder('Search for a place…')
          await typeInto(p, search, SEARCH_FOR)
          await modal(p).getByRole('button', { name: 'Search', exact: true }).click()
          // The OpenStreetMap hit, whose address runs from the street to the
          // country; the index can answer the same name with only a ward.
          const hit = modal(p).locator('button').filter({ hasText: FOUND }).filter({ hasText: /Kyoto.*Japan/ }).first()
          await expect(hit).toBeVisible({ timeout: 20_000 })
          await hit.click()
          await expect(modal(p).getByPlaceholder('Name', { exact: true })).toHaveValue(FOUND)
          await blurFocus(p)
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(placeRow(p, 'Nij')).toBeVisible({ timeout: 15_000 })
          // The dialog stays open for the next place; the guide is done with it.
          await beat(p, 600)
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p)).toHaveCount(0)
          await pageReady(p)
        },
      },
    ],
  },

  'import-from-trip': {
    guide: guide('import-from-trip'),
    start: async p => {
      const tripId = await tripIdOf(p, JAPAN)
      const have = new Set((await tripPlaces(p, tripId)).map(x => x.name))
      addedToTrip = []
      for (const place of KYOTO_EXTRAS) {
        if (have.has(place.name)) continue
        const res = await p.request.post(`/api/trips/${tripId}/places`, { data: place })
        if (!res.ok()) throw new Error(`could not add "${place.name}" to ${JAPAN}: ${res.status()} ${await res.text()}`)
        const body = (await res.json()) as { place?: { id: number }; id?: number }
        const id = body.place?.id ?? body.id
        if (id != null) addedToTrip.push(id)
      }
      await openList(p, KYOTO)
    },
    steps: [
      {
        target: p => filterBar(p).getByRole('button', { name: 'Import from a trip' }),
        act: async p => {
          await filterBar(p).getByRole('button', { name: 'Import from a trip' }).click()
          await expect(modal(p)).toBeVisible()
          await expect(importTrip(p, JAPAN)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // All the trip tiles, not the one: a tile in the left column puts the
        // frame's centre there, and the dialog's right half falls off the picture.
        target: importStagger,
        act: async p => {
          await importTrip(p, JAPAN).click()
          await expect(modal(p).getByPlaceholder('Search places…')).toBeVisible()
          await expect(importStagger(p).getByRole('button').first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The whole dialog: the rows with their toolbar are taller than the
        // smallest frame, so a frame centred on them cuts the head band off.
        target: modalCard,
        act: async p => {
          // Nothing to tick: the three temples no day holds are what the dialog
          // selects by itself, which is what the step's text says.
          for (const place of KYOTO_EXTRAS) {
            await expect(importStagger(p).getByRole('button', { name: new RegExp(place.name) })).toHaveAttribute('aria-pressed', 'true')
          }
          await expect(modal(p).getByRole('button', { name: `Import ${KYOTO_EXTRAS.length}` })).toBeVisible()
          await beat(p, 300)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: /^Import \d+$/ }),
        act: async p => {
          await modal(p).getByRole('button', { name: /^Import \d+$/ }).click()
          await expect(modal(p).getByText('Import finished')).toBeVisible({ timeout: 15_000 })
          // The head band has a Close of its own; the one meant here ends the dialog in its footer.
          await modal(p).locator('footer').getByRole('button', { name: 'Close' }).click()
          await expect(modal(p)).toHaveCount(0)
          for (const place of KYOTO_EXTRAS) await expect(placeRow(p, place.name)).toBeVisible()
          await pageReady(p)
        },
      },
    ],
    cleanup: async p => {
      // The list keeps its copies; the trip goes back to what the seed made of it.
      await deleteTripPlaces(p, await tripIdOf(p, JAPAN), addedToTrip)
      addedToTrip = []
    },
  },

  'place-status': {
    guide: guide('place-status'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => placeRows(p).first().getByRole('button', { name: 'Idea' }),
        act: async p => {
          await placeRows(p).first().getByRole('button', { name: 'Idea' }).click()
          await expect(placeRows(p).first().getByRole('button', { name: 'Want to go' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => placeRows(p).first().getByRole('button', { name: 'Want to go' }),
        act: async p => {
          await placeRows(p).first().getByRole('button', { name: 'Want to go' }).click()
          await expect(placeRows(p).first().getByRole('button', { name: 'Visited' })).toBeVisible()
          await pageReady(p)
        },
      },
    ],
  },

  'place-detail': {
    guide: guide('place-detail'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => placeRows(p).nth(1),
        act: async p => {
          await placeRows(p).nth(1).click()
          await expect(detail(p)).toBeVisible()
          // The map pans to the place; let that pan arrive before the next picture.
          // Places at the far side of the list can end up past the map's edge.
          await pageReady(p, { every: false })
        },
      },
      {
        target: p => detail(p).locator('.col-detail-footer'),
      },
    ],
  },

  labels: {
    guide: guide('labels'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => p.getByRole('button', { name: /^(Add label|Manage labels)$/ }).first(),
        act: async p => {
          await p.getByRole('button', { name: /^(Add label|Manage labels)$/ }).first().click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByPlaceholder('e.g. Berlin').locator('xpath=../..'),
        act: async p => {
          await typeInto(p, modal(p).getByPlaceholder('e.g. Berlin'), 'Arashiyama')
          await modal(p).getByRole('button', { name: 'Add label' }).click()
          await expect(modal(p).locator('input[aria-label="Label name"][value="Arashiyama"]')).toBeVisible()
          await beat(p, 400)
          await p.keyboard.press('Escape')
          await expect(modal(p)).toHaveCount(0)
          // Escape hands focus back to the label control, outlined.
          await blurFocus(p)
          await settle(p)
        },
      },
      {
        // The two places that are in Arashiyama, so the label means what it says.
        prepare: p => selectPlaces(p, ARASHIYAMA_PLACES),
        target: p => selectionBar(p).getByRole('button', { name: 'Assign label' }),
        act: async p => {
          await selectionBar(p).getByRole('button', { name: 'Assign label' }).click()
          await expect(modal(p)).toBeVisible()
          await modal(p).getByRole('button', { name: 'Arashiyama' }).click()
          await modal(p).getByRole('button', { name: 'Assign label' }).click()
          await expect(modal(p)).toHaveCount(0)
          await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
          await expect(selectionBar(p)).toHaveCount(0)
          for (const name of ARASHIYAMA_PLACES) await expect(placeRow(p, name).locator('.col-lrow-label')).toContainText('Arashiyama')
          await blurFocus(p)
          await settle(p)
        },
      },
      {
        target: p => p.locator('.col-labelfilter').first(),
        act: async p => {
          await p.locator('.col-labelfilter').first().getByRole('button', { name: /Arashiyama/ }).click()
          await expect(placeRows(p)).toHaveCount(ARASHIYAMA_PLACES.length)
          await pageReady(p)
        },
      },
    ],
    cleanup: async p => {
      // Leave the list unfiltered for the guides that follow.
      const chip = p.locator('.col-labelfilter').first().getByRole('button', { name: /Arashiyama/ })
      if ((await chip.count()) && (await chip.getAttribute('aria-pressed')) === 'true') await chip.click()
    },
  },

  'filter-select': {
    guide: guide('filter-select'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        prepare: async p => {
          await filterBar(p).locator('button[aria-haspopup="listbox"]').first().click()
          await expect(filterBar(p).locator('[role="listbox"]')).toBeVisible()
        },
        target: p => filterBar(p).locator('button[aria-haspopup="listbox"]').first(),
        act: async p => {
          await filterBar(p).locator('[role="option"]').first().click()
          await expect(filterBar(p).locator('[role="listbox"]')).toHaveCount(0)
        },
      },
      {
        target: p => filterBar(p).getByRole('button', { name: 'Select', exact: true }),
        act: async p => {
          await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
          await expect(selectionBar(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await selectionBar(p).getByRole('button', { name: 'Select all' }).click()
          await blurFocus(p)
        },
        target: selectionBar,
        act: pageReady,
      },
    ],
    cleanup: async p => {
      await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
      await expect(selectionBar(p)).toHaveCount(0)
    },
  },

  'copy-to-trip': {
    guide: guide('copy-to-trip'),
    start: async p => {
      placesBeforeCopy = new Set((await tripPlaces(p, await tripIdOf(p, JAPAN))).map(x => x.id))
      await openList(p, KYOTO)
    },
    steps: [
      {
        target: p => filterBar(p).getByRole('button', { name: 'Select', exact: true }),
        act: async p => {
          // Two places the Japan trip does not have yet: the one found by search
          // and a temple whose trip copy the import guide took out again.
          await selectPlaces(p, ['Nij', 'Kinkaku-ji Temple'])
          await beat(p, 300)
        },
      },
      {
        target: p => selectionBar(p).getByRole('button', { name: 'Copy to trip' }),
        act: async p => {
          await selectionBar(p).getByRole('button', { name: 'Copy to trip' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).locator('button').filter({ hasText: JAPAN }),
        act: async p => {
          await modal(p).locator('button').filter({ hasText: JAPAN }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 15_000 })
          await pageReady(p)
        },
      },
    ],
    cleanup: async p => {
      if (await selectionBar(p).count()) await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
      // The copies leave the trip again, so the trip screens keep the seed's trip.
      if (placesBeforeCopy) {
        const tripId = await tripIdOf(p, JAPAN)
        const before = placesBeforeCopy
        await deleteTripPlaces(p, tripId, (await tripPlaces(p, tripId)).filter(x => !before.has(x.id)).map(x => x.id))
        placesBeforeCopy = null
      }
    },
  },

  'share-list': {
    guide: guide('share-list'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => hero(p).getByRole('button', { name: 'Share' }),
        act: async p => {
          await hero(p).getByRole('button', { name: 'Share' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // The invite row: the user picker, the role picker and Send invite. Each
        // picker sits in a wrapper that sizes it, so the row is three levels up.
        target: p => modal(p).getByRole('button', { name: 'Select a user' }).locator('xpath=../../..'),
        act: async p => {
          await pickSearchable(p, modal(p).getByRole('button', { name: 'Select a user' }), 'mira')
          await beat(p, 300)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Send invite' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Send invite' }).click()
          await expect(modal(p).getByText('pending invite')).toBeVisible({ timeout: 10_000 })
          await beat(p, 500)
          await p.keyboard.press('Escape')
          await expect(modal(p)).toHaveCount(0)
          // Escape gives focus back to Share, and its outline would read as a ring.
          await pageReady(p)
        },
      },
    ],
  },

  'export-list': {
    guide: guide('export-list'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => hero(p).getByRole('button', { name: 'Export' }),
        act: async p => {
          await hero(p).getByRole('button', { name: 'Export' }).click()
          await expect(p.getByRole('menu')).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('menu'),
        act: async p => {
          const download = p.waitForEvent('download')
          await p.getByRole('menuitem', { name: /TREK list/ }).click()
          const file = await download
          exportedFile = path.join(OUT_DIR, 'kyoto.trekcollection.json')
          await file.saveAs(exportedFile)
          await settle(p)
        },
      },
    ],
  },

  'import-file': {
    guide: guide('import-file'),
    start: openCollections,
    steps: [
      {
        target: p => rail(p).getByRole('button', { name: 'Import a list from a file' }),
        act: async p => {
          await rail(p).getByRole('button', { name: 'Import a list from a file' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Choose a list file' }),
        act: async p => {
          if (!exportedFile) throw new Error('the export guide did not leave a file to import')
          await modal(p).locator('input[type="file"]').setInputFiles(exportedFile)
          await expect(modal(p).getByRole('button', { name: /^Import$/ })).toBeEnabled({ timeout: 10_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'New list' }).locator('xpath=..'),
        act: async p => {
          const name = modal(p).locator('input:not([type="file"])').last()
          await name.fill('')
          await typeInto(p, name, 'Kyoto shortlist (from file)')
          await modal(p).getByRole('button', { name: /^Import$/ }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 15_000 })
          await expect(hero(p)).toContainText('Kyoto shortlist (from file)')
          // A new list mounts a new map, which opens on the window's camera.
          await pageReady(p, { reframe: true })
        },
      },
    ],
  },

  'edit-list': {
    guide: guide('edit-list'),
    start: p => openList(p, LISBON),
    steps: [
      {
        target: p => hero(p).getByRole('button', { name: 'Edit' }),
        act: async p => {
          await hero(p).getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: modalCard,
        act: async p => {
          const desc = modal(p).getByPlaceholder('Add a description…')
          await desc.fill('')
          await typeInto(p, desc, 'Coffee first, then the miradouros. For the long weekend in Lisbon.')
          await modal(p).getByRole('button', { name: 'Save' }).click()
          await expect(modal(p)).toHaveCount(0)
          await pageReady(p)
        },
      },
    ],
  },

  'all-saved': {
    guide: guide('all-saved'),
    start: openCollections,
    steps: [
      {
        target: p => rail(p).locator('button.col-row-btn').filter({ hasText: 'All saved' }),
        act: async p => {
          await rail(p).locator('button.col-row-btn').filter({ hasText: 'All saved' }).click()
          await expect(hero(p)).toContainText('All saved')
          await pageReady(p)
        },
      },
      {
        // The whole pill, magnifier included, not the bare input inside it.
        target: mapSearch,
        act: async p => {
          await typeInto(p, mapSearch(p).locator('input'), 'temple')
          await settle(p)
        },
      },
    ],
  },
}

/** The list file the export guide downloads and the import guide reads back. */
let exportedFile: string | null = null

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureExtraTrips(request)
})

test('every registered collections guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(collectionsContext.guides.slice().sort())
})

test('hero: collections', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, collectionsContext.id, p => openList(p, KYOTO))
})

for (const id of collectionsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
