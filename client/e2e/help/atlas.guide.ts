import { test, expect, type Page, type Locator } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { year } from '../dates'
import { ensureAtlasFixtures } from './fixtures'
import { ensureDawarichConnection, disconnectDawarich } from './external'
import { modal } from './trip-shared'
import { atlasGuides, atlasContext } from '../../src/help/contexts/atlas'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Atlas guides, keyed by the ids in `src/help/contexts/atlas.ts`.
 * They run in the order the context lists them and leave their marks on the
 * map on purpose: Greece is marked and removed again, a region of Austria and
 * Bavaria stay, Iceland and Petra land on the bucket list. The countries
 * are drawn on a canvas, so the way in is always the search box: it flies to
 * the country and opens the same popup a click on the map would.
 */


const guide = (id: string): HelpGuide => {
  const g = atlasGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

async function openAtlas(page: Page): Promise<void> {
  await page.goto('/atlas')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible({ timeout: 20_000 })
  // The country layer is a canvas; it exists once the borders have arrived.
  await expect(page.locator('.leaflet-overlay-pane canvas').first()).toBeVisible({ timeout: 20_000 })
  await settle(page)
  await page.waitForTimeout(600)
}

/** The search box over the map and its dropdown. */
const searchInput = (page: Page) => page.getByPlaceholder('Search a country...')
const searchBox = (page: Page) => searchInput(page).locator('xpath=ancestor::div[2]')
/** A country in the dropdown (its accessible name starts with the flag's alt text). */
const countryHit = (page: Page, name: string) => searchBox(page).getByRole('button', { name: new RegExp(`^[A-Z]{2} ${name}$`) })
/** A geocoded place in the dropdown, under the Places heading. */
const placeHit = (page: Page, text: string) => searchBox(page).getByRole('button', { name: new RegExp(text) }).first()
/** The country / region popup card. */
const popup = (page: Page) => page.locator('div[role="presentation"] > div[role="presentation"]')
/** The glass panel at the bottom. */
const panel = (page: Page) => page.getByRole('button', { name: 'Stats' }).locator('xpath=ancestor::div[2]')
/** The detail card the panel grows for a country picked in the search. */
const detailCard = (page: Page, country: string) =>
  panel(page).locator('p.text-sm.font-bold').filter({ hasText: country }).locator('xpath=../..')
/**
 * Dawarich's own glass panel, left of the statistics: the one panel with its
 * name in it. Scoped this way because its two tiles, Wishlist and Countries,
 * have namesakes in the dialog's tabs once it is open.
 */
const dawarichPanel = (page: Page) =>
  page.locator('div.hidden.md\\:flex').filter({ has: page.getByText('Dawarich', { exact: true }) }).first()
const tile = (page: Page, label: 'Wishlist' | 'Countries') =>
  dawarichPanel(page).getByRole('button', { name: label, exact: true })
/** The answers in the dialog: every row is one checkbox named after the country or the wish. */
const rows = (page: Page) => modal(page).getByRole('checkbox')

/** The countries the Atlas paints as visited right now, by code. */
async function visitedCodes(page: Page): Promise<Set<string>> {
  const res = await page.request.get('/api/addons/atlas/stats')
  const { countries } = (await res.json()) as { countries: { code: string; status: string }[] }
  return new Set(countries.filter(c => c.status === 'visited').map(c => c.code))
}
/** What was visited before the countries guide confirmed anything, so `cleanup` takes exactly its additions off again. */
let visitedBefore = new Set<string>()

async function searchCountry(page: Page, name: string): Promise<void> {
  const input = searchInput(page)
  await input.click()
  await input.fill('')
  await typeInto(page, input, name)
  await expect(countryHit(page, name)).toBeVisible()
}

async function pickCountry(page: Page, name: string): Promise<void> {
  await countryHit(page, name).click()
  await page.waitForTimeout(900) // fitBounds animates
  await settle(page)
}

/** Close the country popup by clicking beside it (there is no Escape). */
async function closePopup(page: Page): Promise<void> {
  await page.mouse.click(40, VIEWPORT.height - 40)
  await expect(popup(page)).toHaveCount(0)
}

/** The next unset select in a scope: month and year both read “—” until picked. */
const unsetSelect = (scope: Locator) => scope.getByRole('button', { name: '—', exact: true }).first()

/** Pick an option in one of the month / year selects. */
async function choose(page: Page, trigger: Locator, label: string): Promise<void> {
  await trigger.click()
  await page.getByRole('button', { name: label, exact: true }).last().click()
  await beat(page, 300)
}

/**
 * Tag the region path under the middle of the map, so a step can ring it. The
 * regions are SVG, but no element carries a name; what is at the centre after
 * flying to a country is what the reader would click first anyway.
 */
async function tagCentreRegion(page: Page): Promise<void> {
  // The first region request builds the server's admin-1 index; that can take a while.
  await expect(page.locator('.leaflet-region-pane path').first()).toBeVisible({ timeout: 90_000 })
  const map = await page.locator('.leaflet-container').boundingBox()
  if (!map) throw new Error('no map on screen')
  const point = { x: map.x + map.width / 2, y: map.y + map.height / 2 }
  await page.evaluate(({ x, y }) => {
    document.querySelectorAll('[data-help-target]').forEach(el => el.removeAttribute('data-help-target'))
    const el = document.elementFromPoint(x, y)
    if (!(el instanceof SVGPathElement)) throw new Error(`no region under the map centre, found ${el?.tagName ?? 'nothing'}`)
    el.setAttribute('data-help-target', '1')
  }, point)
}
const centreRegion = (page: Page) => page.locator('path[data-help-target]')

async function mapCentre(page: Page): Promise<{ x: number; y: number }> {
  const map = await page.locator('.leaflet-container').boundingBox()
  if (!map) throw new Error('no map on screen')
  return { x: map.x + map.width / 2, y: map.y + map.height / 2 }
}

async function hoverMapCentre(page: Page): Promise<void> {
  const c = await mapCentre(page)
  await page.mouse.move(c.x, c.y)
}

async function clickMapCentre(page: Page): Promise<void> {
  const c = await mapCentre(page)
  await page.mouse.click(c.x, c.y)
}

const SCRIPTS: Record<string, GuideScript> = {
  'mark-country': {
    guide: guide('mark-country'),
    start: openAtlas,
    steps: [
      {
        target: searchInput,
        act: async p => { await searchCountry(p, 'Greece') },
      },
      {
        target: p => countryHit(p, 'Greece'),
        act: async p => {
          await pickCountry(p, 'Greece')
          await expect(popup(p)).toBeVisible()
        },
      },
      {
        target: p => popup(p).getByRole('button', { name: /Mark as visited/ }),
        act: async p => {
          await popup(p).getByRole('button', { name: /Mark as visited/ }).click()
          await expect(popup(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },

  'unmark-country': {
    guide: guide('unmark-country'),
    start: openAtlas,
    steps: [
      {
        target: searchInput,
        act: async p => {
          await searchCountry(p, 'Greece')
          await pickCountry(p, 'Greece')
          await expect(popup(p).getByText('Remove this country from your visited list?')).toBeVisible()
        },
      },
      {
        target: p => popup(p).getByRole('button', { name: 'Remove', exact: true }),
        act: async p => {
          await popup(p).getByRole('button', { name: 'Remove', exact: true }).click()
          await expect(popup(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },

  'country-details': {
    guide: guide('country-details'),
    start: openAtlas,
    steps: [
      {
        target: searchInput,
        act: async p => { await searchCountry(p, 'Japan') },
      },
      {
        target: p => countryHit(p, 'Japan'),
        act: async p => {
          await pickCountry(p, 'Japan')
          await expect(detailCard(p, 'Japan')).toBeVisible()
        },
      },
    ],
  },

  'planned-countries': {
    guide: guide('planned-countries'),
    start: openAtlas,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Show planned countries' }).locator('xpath=..'),
        act: async p => {
          const toggle = p.getByRole('button', { name: 'Show planned countries' })
          if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await searchCountry(p, 'Portugal')
          await pickCountry(p, 'Portugal')
          await expect(detailCard(p, 'Portugal')).toBeVisible()
        },
        target: p => detailCard(p, 'Portugal'),
      },
    ],
  },

  regions: {
    guide: guide('regions'),
    start: openAtlas,
    steps: [
      {
        target: searchInput,
        act: async p => {
          await searchCountry(p, 'Austria')
          await pickCountry(p, 'Austria')
          // An unvisited country opens its popup on arrival; the regions are the point here.
          await expect(popup(p)).toBeVisible()
          await closePopup(p)
          await tagCentreRegion(p)
        },
      },
      {
        target: centreRegion,
        hover: hoverMapCentre,
        act: async p => {
          await clickMapCentre(p)
          await expect(popup(p).getByRole('button', { name: /Mark as visited/ })).toBeVisible()
        },
      },
      {
        target: p => popup(p).getByRole('button', { name: /Mark as visited/ }),
        act: async p => {
          await popup(p).getByRole('button', { name: /Mark as visited/ }).click()
          await expect(popup(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },

  'search-place': {
    guide: guide('search-place'),
    start: openAtlas,
    steps: [
      {
        target: searchInput,
        act: async p => {
          const input = searchInput(p)
          await input.click()
          await typeInto(p, input, 'Munich')
          await expect(placeHit(p, 'Munich, Bavaria')).toBeVisible({ timeout: 15_000 })
        },
      },
      {
        target: p => placeHit(p, 'Munich, Bavaria'),
        act: async p => {
          await placeHit(p, 'Munich, Bavaria').click()
          await expect(popup(p).getByRole('button', { name: /Mark as visited/ })).toBeVisible({ timeout: 60_000 })
          await settle(p)
        },
      },
      {
        target: p => popup(p).getByRole('button', { name: /Mark as visited/ }),
        act: async p => {
          await popup(p).getByRole('button', { name: /Mark as visited/ }).click()
          await expect(popup(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },

  'bucket-country': {
    guide: guide('bucket-country'),
    start: openAtlas,
    steps: [
      {
        target: searchInput,
        act: async p => {
          await searchCountry(p, 'Iceland')
          await pickCountry(p, 'Iceland')
          await expect(popup(p)).toBeVisible()
        },
      },
      {
        target: p => popup(p).getByRole('button', { name: /Add to bucket list/ }),
        act: async p => {
          await popup(p).getByRole('button', { name: /Add to bucket list/ }).click()
          await expect(popup(p).getByText('When do you plan to visit?')).toBeVisible()
        },
      },
      {
        prepare: async p => {
          await choose(p, unsetSelect(popup(p)), 'June')
          await choose(p, unsetSelect(popup(p)), String(year(1)))
        },
        target: p => popup(p),
        act: async p => {
          await popup(p).getByRole('button', { name: 'Add to bucket list', exact: true }).click()
          await expect(popup(p)).toHaveCount(0)
          await settle(p)
          await p.getByRole('button', { name: 'Bucket List' }).click()
          await settle(p)
        },
      },
    ],
  },

  'bucket-place': {
    guide: guide('bucket-place'),
    start: openAtlas,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Bucket List' }),
        act: async p => { await p.getByRole('button', { name: 'Bucket List' }).click(); await settle(p) },
      },
      {
        target: p => p.getByRole('button', { name: 'Add place' }),
        act: async p => { await p.getByRole('button', { name: 'Add place' }).click() },
      },
      {
        target: p => p.getByPlaceholder('Name (country, city, place...)'),
        act: async p => {
          const input = p.getByPlaceholder('Name (country, city, place...)')
          await typeInto(p, input, 'Petra')
          await input.locator('xpath=following-sibling::button[1]').click()
          // The geocoder also knows a Petra in Mallorca and a few streets; the one in Jordan is the wish.
          const hit = p.locator('body > div.bg-surface-card button').filter({ hasText: 'Jordan' }).first()
          await expect(hit).toBeVisible({ timeout: 15_000 })
          await hit.click()
          await expect(input).toHaveValue(/petra/i)
        },
      },
      {
        prepare: async p => {
          await choose(p, unsetSelect(panel(p)), 'Sep')
          await choose(p, unsetSelect(panel(p)), String(year(1)))
        },
        target: p => p.getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Add', exact: true }).click()
          await expect(panel(p).getByText('Petra').first()).toBeVisible()
          await settle(p)
        },
      },
    ],
  },

  stats: {
    guide: guide('stats'),
    start: openAtlas,
    steps: [
      { target: p => panel(p).locator('.rounded-xl').filter({ hasText: 'Countries' }).first() },
      { target: p => panel(p).locator('.flex.items-center.gap-4').first() },
    ],
  },

  'dawarich-countries': {
    guide: guide('dawarich-countries'),
    start: async p => {
      await openAtlas(p)
      visitedBefore = await visitedCodes(p)
    },
    steps: [
      {
        target: p => tile(p, 'Countries'),
        act: async p => {
          await tile(p, 'Countries').click()
          await expect(modal(p).getByRole('button', { name: 'Look for countries' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Look for countries' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Look for countries' }).click()
          // A year in thirteen 30-day reads, one after another, each of which
          // Dawarich computes on the spot; the client gives it four minutes.
          // An empty answer shows a sentence instead of rows and fails here,
          // which is right: a dialog with nothing to add is no picture.
          await expect(rows(p).first()).toBeVisible({ timeout: 240_000 })
          await settle(p)
          // The flags come from a CDN and land after the rows.
          await p.waitForTimeout(800)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: /^Add \d+ countries$/ }),
        act: async p => {
          await modal(p).getByRole('button', { name: /^Add \d+ countries$/ }).click()
          await expect(p.getByText(/\d+ countries added/)).toBeVisible({ timeout: 20_000 })
          await p.keyboard.press('Escape')
          await expect(modal(p)).toHaveCount(0)
          // The Atlas re-reads itself after a write; the colours land with the answer.
          await expect.poll(async () => (await visitedCodes(p)).size, { timeout: 20_000 }).toBeGreaterThan(visitedBefore.size)
          await settle(p)
          await p.waitForTimeout(900)
        },
      },
    ],
    cleanup: async p => {
      // Off the map again, so the next run and the guides after this one start
      // from the seed. Unmarking tombstones a country; confirming it again from
      // the dialog lifts that, so a re-run offers the same rows.
      const after = await visitedCodes(p)
      for (const code of after) {
        if (!visitedBefore.has(code)) await p.request.delete(`/api/addons/atlas/country/${code}/mark`)
      }
    },
  },

  'dawarich-wishes': {
    guide: guide('dawarich-wishes'),
    start: openAtlas,
    steps: [
      {
        target: p => tile(p, 'Wishlist'),
        act: async p => {
          await tile(p, 'Wishlist').click()
          await expect(modal(p).getByRole('button', { name: 'Check wishlist' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Check wishlist' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Check wishlist' }).click()
          // One read per wish with coordinates (Fushimi Inari, Wadi Rum, Petra),
          // fifteen seconds each at worst; New Zealand and Iceland have none and
          // are counted in the note instead.
          await expect(rows(p).first()).toBeVisible({ timeout: 120_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: /^Tick off \d+$/ }),
        act: async p => {
          await modal(p).getByRole('button', { name: /^Tick off \d+$/ }).click()
          await expect(p.getByText(/\d+ wishes ticked off/)).toBeVisible({ timeout: 20_000 })
          await p.keyboard.press('Escape')
          await expect(modal(p)).toHaveCount(0)
          // The result is the list itself: the ticked date under each wish is a
          // button labelled Undo, there once the list has re-read itself.
          await p.getByRole('button', { name: 'Bucket List' }).click()
          await expect(panel(p).getByRole('button', { name: 'Undo' }).first()).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      // Every tick that came from a recording goes back, by the route the Undo
      // button uses, so the wishes are open again for the next run.
      const res = await p.request.get('/api/addons/atlas/bucket-list')
      const { items } = (await res.json()) as { items: { id: number; visited_source: string | null }[] }
      for (const item of items) {
        if (item.visited_source === 'dawarich') await p.request.delete(`/api/integrations/dawarich/bucket-list/${item.id}/visit`)
      }
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureAtlasFixtures(request)
  // After the Atlas fixtures: the connection adds two wishes with coordinates
  // (Fushimi Inari Taisha, Wadi Rum) to the list the fixtures create.
  await ensureDawarichConnection(request)
})

test.afterAll(async ({ request }) => {
  // Instance-wide: while the addon is on, every Atlas carries the Dawarich
  // panel left of Stats. This file's pictures show it on purpose; the files
  // after it do not, so it goes off again here, whatever happened in between.
  await disconnectDawarich(request)
})

test('every registered atlas guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(atlasContext.guides.slice().sort())
})

test('hero: atlas', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, atlasContext.id, openAtlas)
})

for (const id of atlasContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    // The Dawarich reads are a year of countries in thirteen pieces and one
    // look-up per wish: more waiting on another service than four minutes
    // may hold on a slow instance.
    if (id.startsWith('dawarich-')) test.slow()
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
