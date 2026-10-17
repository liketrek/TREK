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
/**
 * The country / region popup: the panel of the shared dialog frame, inside
 * the backdrop `modal` finds. The Dawarich dialog uses the same frame, but the
 * two are never open at once.
 */
const popup = (page: Page) => modal(page).getByRole('dialog')
/** The glass panel at the bottom. */
const panel = (page: Page) => page.getByRole('button', { name: 'Stats' }).locator('xpath=ancestor::div[2]')
/** The continent counts in the Stats tab, and the streak with this year's trips right of them. */
const continentStats = (page: Page) => panel(page).locator('div.flex.items-center.gap-4').filter({ hasText: 'Europe' }).first()
const highlightStats = (page: Page) => panel(page).locator('div.flex.items-center.gap-5').first()
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

/**
 * Close the country popup with the button in its head band. Not with Escape:
 * after a key press the browser draws its focus ring on the next popup, which
 * takes the focus as it opens, and that ring would be in the picture.
 */
async function closePopup(page: Page): Promise<void> {
  await popup(page).getByRole('button', { name: 'Close', exact: true }).click()
  await expect(popup(page)).toHaveCount(0)
}

/**
 * The next unset select of the Add place form in the Bucket List tab: month
 * and year both read a long dash until picked. The popup's bucket step labels
 * its two selects instead, so there they are found by Month and Year.
 */
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

type Box = { x: number; y: number; width: number; height: number }

/**
 * An invisible box laid over several elements, for a step whose text names
 * things that have no parent of their own to ring. The runner rings whatever
 * box the target has, so this gives it one. It takes no pointer events, so the
 * hover and the click the step makes go to the app underneath, and a step
 * that uses it needs its own `hover` for the same reason.
 */
async function spanOver(page: Page, boxes: Box[]): Promise<void> {
  await page.evaluate(boxes => {
    document.getElementById('trek-help-span')?.remove()
    const left = Math.min(...boxes.map(b => b.x))
    const top = Math.min(...boxes.map(b => b.y))
    const right = Math.max(...boxes.map(b => b.x + b.width))
    const bottom = Math.max(...boxes.map(b => b.y + b.height))
    const el = document.createElement('div')
    el.id = 'trek-help-span'
    Object.assign(el.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
      pointerEvents: 'none',
    })
    document.body.appendChild(el)
  }, boxes)
}
const span = (page: Page) => page.locator('#trek-help-span')
async function clearSpan(page: Page): Promise<void> {
  await page.evaluate(() => document.getElementById('trek-help-span')?.remove())
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (!box) throw new Error(`no box for ${locator}`)
  return box
}

/**
 * The name the Atlas shows beside the pointer over a region. It is one fixed
 * div the map moves after the pointer, with no role or name of its own; the
 * country under the region name is how it is told apart.
 */
async function regionTooltipBox(page: Page, country: string): Promise<Box> {
  const box = await page.evaluate(country => {
    const tip = Array.from(document.querySelectorAll('div')).find(d =>
      d.style.position === 'fixed' && d.style.pointerEvents === 'none' && d.style.display === 'block' && (d.textContent ?? '').includes(country))
    if (!tip) return null
    const r = tip.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  }, country)
  if (!box) throw new Error(`no region tooltip naming ${country} on screen`)
  return box
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
          // The step promises the card's flag, which is a Twemoji image from a
          // CDN. Waited for here so the result shows the flag rather than an
          // empty square; should the CDN be out of reach, the card falls back to
          // two letters and the image never loads, which fails this step.
          const flag = detailCard(p, 'Japan').locator('img[alt="JP"]')
          await expect(flag).toBeVisible({ timeout: 15_000 })
          await expect.poll(() => flag.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0), { timeout: 15_000 }).toBe(true)
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
        // The text says hovering names the region. That name floats right of
        // the pointer and reaches past the region's own box, so a ring round
        // the region alone ran straight through it. The ring goes round both.
        prepare: async p => {
          await hoverMapCentre(p)
          await settle(p)
          await spanOver(p, [await boxOf(centreRegion(p)), await regionTooltipBox(p, 'Austria')])
        },
        target: span,
        hover: hoverMapCentre,
        act: async p => {
          await clearSpan(p)
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
          await choose(p, popup(p).getByLabel('Month', { exact: true }), 'June')
          await choose(p, popup(p).getByLabel('Year', { exact: true }), String(year(1)))
        },
        // The whole popup: the step names both selects and the button under them.
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
        // The row, not the field alone: the text has the reader press the
        // search button beside it as well.
        target: p => p.getByPlaceholder('Name (country, city, place...)').locator('xpath=..'),
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
        // The whole form: framed on the small Add button alone, the picture lost
        // the name and the month, and looked like Add on an empty form.
        target: p => p.getByRole('button', { name: 'Add', exact: true }).locator('xpath=../..'),
        hover: p => p.getByRole('button', { name: 'Add', exact: true }).hover(),
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
      {
        // The text covers the continents, the streak and this year's trips.
        // Those are two groups side by side with no box of their own around
        // both, so the ring gets one laid over them.
        prepare: async p => {
          await spanOver(p, [await boxOf(continentStats(p)), await boxOf(highlightStats(p))])
        },
        target: span,
        hover: p => continentStats(p).hover(),
        act: clearSpan,
      },
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
        // The pitch with its button rather than the button alone: a frame
        // centred on the button cut off the dialog's head band, and with it the
        // name of the service this dialog asks.
        target: p => modal(p).getByRole('button', { name: 'Look for countries' }).locator('xpath=..'),
        hover: p => modal(p).getByRole('button', { name: 'Look for countries' }).hover(),
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
        // The whole dialog: the list step 2 describes (flag, cities, ticked
        // rows) is only ever pictured here, and a frame centred on the button
        // cut the rows in half. The button sits in the footer, in the ring too.
        target: p => modal(p).getByRole('dialog'),
        hover: p => modal(p).getByRole('button', { name: /^Add \d+ countries$/ }).hover(),
        act: async p => {
          await modal(p).getByRole('button', { name: /^Add \d+ countries$/ }).click()
          await expect(p.getByText(/\d+ countries added/)).toBeVisible({ timeout: 20_000 })
          // Closed with the button in its head band, not Escape: the focus goes
          // back to the Countries tile, and after a key press the browser draws
          // its focus ring there, into the result picture.
          await modal(p).getByRole('button', { name: 'Close', exact: true }).click()
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
        // As in the countries guide: the pitch with its button, so the head band
        // stays in the frame.
        target: p => modal(p).getByRole('button', { name: 'Check wishlist' }).locator('xpath=..'),
        hover: p => modal(p).getByRole('button', { name: 'Check wishlist' }).hover(),
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
        // The whole dialog, as in the countries guide: the rows with distance,
        // stay and day and the note with the 250 m rule are what step 2 quotes.
        target: p => modal(p).getByRole('dialog'),
        hover: p => modal(p).getByRole('button', { name: /^Tick off \d+$/ }).hover(),
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
