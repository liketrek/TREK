import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, gpxFixture, ensureTrack } from './fixtures'
import { openTrip, modal, dialog, confirmDialog } from './trip-shared'
import { tripPlacesContext, tripPlacesGuides } from '../../src/help/contexts/tripPlaces'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the places column of a trip, keyed by the ids in
 * `src/help/contexts/tripPlaces.ts`. They run on the seeded "Autumn in Japan"
 * with one walk imported up front, so the Tracks filter exists; what a guide
 * creates it takes away again in `cleanup`, so the next one starts the same.
 */

const guide = (id: string): HelpGuide => {
  const g = tripPlacesGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const SPARE = { name: 'Tsukiji Outer Market', lat: 35.6654, lng: 139.7707, address: '4 Chome Tsukiji, Chuo City, Tokyo' }
/** What create-place looks up. See the note in its second step for why this one. */
const SEARCHED = { query: 'Osaka Castle', match: /^Osaka Castle/ }

/** The search result create-place picks. */
const suggestion = (page: Page) =>
  modal(page).locator('.shadow-dropdown button').filter({ hasText: SEARCHED.match }).first()
/** A row of the places column by the place's name (the rows are options of a list). */
const row = (page: Page, name: string) => page.getByRole('option', { name: new RegExp(`^${name}`) }).first()
/** The context menu is a fixed popover of plain buttons; the item texts tell it apart. */
const menu = (page: Page) => page.locator('.trek-popover-enter').filter({ has: page.getByRole('button', { name: 'Delete' }) }).last()
/** The add button: "Add Place/Activity" with no day open, "New place" with one. */
const addButton = (page: Page) => page.getByRole('button', { name: /^(Add Place\/Activity|New place)$/ })
/**
 * The head band of the column: the add row, the search with the select switch,
 * and the row of filters. Found from its import button, the one control only
 * this band has, so the plain "Search" of the field is read inside it.
 */
const head = (page: Page) =>
  page.getByRole('button', { name: 'Import Places' }).locator('xpath=ancestor::div[contains(@class,"flex-col")][1]')
/** The import button's menu: Import file and the list import. */
const importMenu = (page: Page) =>
  page.locator('.trek-popover-enter').filter({ has: page.getByRole('button', { name: 'Import file' }) }).last()
/** The Show dropdown (All, Unplanned, Planned, Tracks) and the list it opens. */
const showTrigger = (page: Page) => head(page).getByRole('button', { name: 'Show', exact: true })
const showList = (page: Page) => page.getByTestId('places-filter').locator('xpath=..')
/** The category filter: a tag button whose list sits right after it. */
const categoryTrigger = (page: Page) => head(page).getByRole('button', { name: 'Categories', exact: true })
const categoryList = (page: Page) => categoryTrigger(page).locator('xpath=following-sibling::div[1]')
const searchBox = (page: Page) => head(page).getByPlaceholder('Search', { exact: true })
/** The selection bar at the foot of the column, found by its delete action. */
const selectionBar = (page: Page) => page.getByRole('button', { name: 'Delete selected' }).locator('xpath=..')
/** FileImportModal, recognised by its hidden file input. */
const importFileDialog = (page: Page) =>
  page.getByRole('dialog').filter({ has: page.locator('input[type="file"][accept*=".gpx"]') })
/** ListImportModal, recognised by the link box. */
const listImportDialog = (page: Page) => page.getByRole('dialog').filter({ has: page.getByPlaceholder(/goo\.gl|naver/) })
/** The drop box of the file dialog: the dashed button that opens the file picker. */
const dropBox = (page: Page) => importFileDialog(page).locator('button.border-dashed').first()
/** The column itself: the header block around the search box. */
const column = (page: Page) => searchBox(page).locator('xpath=ancestor::div[contains(@class,"scroll") or @data-places-sidebar][1]')

async function createSpare(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  const created = await page.request.post(`/api/trips/${tripId}/places`, { data: SPARE })
  if (!created.ok()) throw new Error(`could not create the spare place: ${created.status()} ${await created.text()}`)
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

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

const only = (target: (p: Page) => Locator) => ({ target })

const sortTrigger = (page: Page) => head(page).getByRole('button', { name: 'Sort by', exact: true })
const sortList = (page: Page) => sortTrigger(page).locator('xpath=following-sibling::div[1]')
/** A name no index knows, so the search comes back empty and offers Add by hand. */
const HANDMADE = { name: 'Kissaten Hoshizora Ura', phone: '+81 75 000 1234', email: 'hello@hoshizora.example' }

const SCRIPTS: Record<string, GuideScript> = {
  'sort-places': {
    guide: guide('sort-places'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => {
          await sortTrigger(p).click()
          await expect(sortList(p)).toBeVisible()
          await beat(p, 300)
        },
        target: sortList,
      },
      {
        target: p => sortList(p).getByRole('button', { name: 'Highest rated' }),
        act: async p => {
          await sortList(p).getByRole('button', { name: 'Highest rated' }).click()
          await expect(sortList(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await sortTrigger(p).click()
      await sortList(p).getByRole('button', { name: 'Recently added' }).click()
    },
  },
  'place-by-hand': {
    guide: guide('place-by-hand'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => {
          await addButton(p).click()
          const box = modal(p).getByPlaceholder('Search places...')
          await expect(box).toBeVisible()
          await typeInto(p, box, HANDMADE.name)
          await box.press('Enter')
          await expect(modal(p).getByText(/^Nothing found for/)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
        target: p => modal(p).getByRole('button', { name: 'Add by hand' }).locator('xpath=..'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add by hand' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add by hand' }).click()
          await expect(modal(p).getByPlaceholder('e.g. Eiffel Tower')).toHaveValue(HANDMADE.name)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByLabel('Phone', { exact: true }), HANDMADE.phone)
          await typeInto(p, modal(p).getByLabel('E-mail', { exact: true }), HANDMADE.email)
          await settle(p)
        },
        target: p => modal(p).getByLabel('E-mail', { exact: true }).locator('xpath=ancestor::div[.//label[normalize-space()="Phone"]][1]'),
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Add opening hours' }).click()
          await expect(modal(p).getByRole('button', { name: 'Remove opening hours' })).toBeVisible()
          await modal(p).getByRole('button', { name: 'Remove opening hours' }).scrollIntoViewIfNeeded()
          await settle(p)
        },
        target: p => modal(p).getByRole('button', { name: 'Remove opening hours' }).locator('xpath=ancestor::div[.//input][1]'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(row(p, HANDMADE.name)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, HANDMADE.name),
  },
  'create-place': {
    guide: guide('create-place'),
    start: p => openTrip(p),
    steps: [
      {
        // A running trip always has a day open, so the button reads New place.
        target: addButton,
        act: async p => {
          await addButton(p).click()
          await expect(modal(p).getByPlaceholder('Search places...')).toBeVisible()
          await settle(p)
        },
      },
      {
        // The results are pictured before the pick: once one is taken the
        // search box empties again, and a ring round an empty box shows the
        // reader nothing of what the step says.
        prepare: async p => {
          const box = modal(p).getByPlaceholder('Search places...')
          // Osaka Castle on purpose: its entry in the index carries a picture,
          // opening hours and a description, so Place details shows what the
          // text says it shows. Most results have none of that and the column
          // would be an empty state in the picture.
          await typeInto(p, box, SEARCHED.query)
          await expect(suggestion(p)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
        target: p => modal(p).locator('.shadow-dropdown').first(),
        hover: p => suggestion(p).hover(),
        act: async p => {
          await suggestion(p).click()
          await expect(modal(p).getByPlaceholder('e.g. Eiffel Tower')).toHaveValue(SEARCHED.match, { timeout: 20_000 })
          // The details column answers after the form; wait for it or the
          // picture catches the spinner.
          await expect(modal(p).getByText('Pick a picture', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      // The details column is an <aside> beside the form; both used to resolve to
      // the whole dialog, which gave two steps the same picture.
      only(p => modal(p).getByText('Place details', { exact: true }).locator('xpath=ancestor::aside[1]')),
      // The name and the category sit in the head band, above the form, so the
      // step about the fields shows the dialog rather than the form alone.
      only(p => dialog(p)),
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(row(p, SEARCHED.query)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, SEARCHED.query),
  },
  'place-to-open-day': {
    guide: guide('place-to-open-day'),
    start: async p => {
      await createSpare(p)
      await openTrip(p, { day: null })
    },
    steps: [
      {
        target: p => p.getByRole('button', { name: /^1 .*Day 1 / }),
        act: async p => {
          await p.getByRole('button', { name: /^1 .*Day 1 / }).click()
          await expect(p.getByRole('button', { name: 'Add to the open day' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Add to the open day' }),
        act: async p => {
          await p.getByRole('button', { name: 'Add to the open day' }).click()
          await expect(modal(p).getByPlaceholder('Search places...')).toBeVisible()
          await beat(p, 400)
          await closeModal(p)
        },
      },
      {
        prepare: async p => { await row(p, SPARE.name).hover() },
        target: p => row(p, SPARE.name).getByRole('button', { name: '+ Day' }),
        act: async p => {
          await row(p, SPARE.name).getByRole('button', { name: '+ Day' }).click()
          await expect(p.getByRole('button', { name: 'Undo' })).toBeEnabled({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The other way round, and the one most readers try first: the row is
        // dragged onto a day card. The place is off the day again before the
        // drag so the picture shows it leaving the column rather than a stop
        // that is already there.
        prepare: async p => {
          await p.getByRole('button', { name: 'Undo' }).click()
          await expect(row(p, SPARE.name)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
        target: p => row(p, SPARE.name),
        dropTo: p => p.getByRole('button', { name: /^2 .*Day 2 / }).locator('xpath=..'),
        act: async p => {
          await row(p, SPARE.name).dragTo(p.getByRole('button', { name: /^2 .*Day 2 / }))
          await expect(p.locator('.dp-row[role="button"]').filter({ hasText: SPARE.name }).first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, SPARE.name),
  },
  'filter-places': {
    guide: guide('filter-places'),
    start: async p => {
      await createSpare(p)
      await openTrip(p)
    },
    steps: [
      {
        prepare: async p => {
          await showTrigger(p).click()
          await expect(showList(p)).toBeVisible()
          await beat(p, 300)
        },
        target: showList,
        // The lists close on a second click of their trigger.
        act: async p => { await showTrigger(p).click(); await settle(p) },
      },
      {
        prepare: async p => { await typeInto(p, searchBox(p), 'temple'); await settle(p) },
        target: p => searchBox(p).locator('xpath=..'),
        act: async p => { await searchBox(p).fill(''); await settle(p) },
      },
      {
        // One category ticked, so the list shows the tick, the button its count
        // and the foot of the list its Clear filter.
        prepare: async p => {
          await categoryTrigger(p).click()
          await expect(categoryList(p)).toBeVisible()
          // No Category: the seed's places carry none, so it is the choice that
          // leaves rows in the list rather than an empty column.
          await categoryList(p).getByRole('button', { name: /No Category/ }).click()
          await expect(categoryList(p).getByRole('button', { name: 'Clear filter' })).toBeVisible()
          // The list scrolls inside itself; its foot is where the tick and Clear filter are.
          await categoryList(p).evaluate(el => { el.scrollTop = el.scrollHeight })
          await beat(p, 300)
        },
        target: categoryList,
        act: async p => {
          await categoryList(p).getByRole('button', { name: 'Clear filter' }).click()
          await categoryTrigger(p).click()
          await expect(categoryList(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => { await p.getByRole('button', { name: 'Filter by rating' }).click(); await beat(p, 300) },
        target: p => p.getByRole('button', { name: 'Filter by rating' }),
        act: async p => { await p.getByRole('button', { name: 'Filter by rating' }).click() },
      },
    ],
    cleanup: p => deleteByName(p, SPARE.name),
  },
  'edit-place': {
    guide: guide('edit-place'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => {
          await row(p, 'Shibuya Crossing').click({ button: 'right' })
          await expect(menu(p).getByRole('button', { name: 'Edit' })).toBeVisible()
          await beat(p, 300)
        },
        target: menu,
        act: async p => {
          await menu(p).getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p).getByPlaceholder('e.g. Eiffel Tower')).toHaveValue('Shibuya Crossing')
          await settle(p)
        },
      },
      only(dialog),
      {
        target: p => modal(p).getByRole('button', { name: 'Update', exact: true }),
        act: closeModal,
      },
    ],
  },
  'delete-place': {
    guide: guide('delete-place'),
    start: async p => {
      await createSpare(p)
      await openTrip(p)
    },
    steps: [
      {
        prepare: async p => {
          await row(p, SPARE.name).click({ button: 'right' })
          await expect(menu(p).getByRole('button', { name: 'Delete' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => menu(p).getByRole('button', { name: 'Delete' }),
        act: async p => {
          await menu(p).getByRole('button', { name: 'Delete' }).click()
          await expect(confirmDialog(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: confirmDialog,
        act: async p => {
          await confirmDialog(p).getByRole('button', { name: 'Delete', exact: true }).click()
          await expect(row(p, SPARE.name)).toHaveCount(0, { timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, SPARE.name),
  },
  'select-places': {
    guide: guide('select-places'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Select', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Select', exact: true }).click()
          await expect(p.getByRole('button', { name: 'Select all' })).toBeVisible()
          await settle(p)
        },
      },
      {
        // Two rows next to each other, so one picture shows both ticks.
        prepare: async p => {
          await row(p, 'Shibuya Crossing').click()
          await row(p, 'Meiji Jingu').click()
          await expect(p.getByRole('status', { name: '2 selected' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => row(p, 'Meiji Jingu'),
      },
      only(selectionBar),
      {
        target: p => selectionBar(p).getByRole('button', { name: 'Done' }),
        act: async p => {
          await selectionBar(p).getByRole('button', { name: 'Done' }).click()
          await expect(p.getByRole('button', { name: 'Select all' })).toHaveCount(0)
        },
      },
    ],
  },
  'import-places-file': {
    guide: guide('import-places-file'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Import Places' }).click()
          await expect(importMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        target: p => importMenu(p).getByRole('button', { name: 'Import file' }),
        act: async p => {
          await importMenu(p).getByRole('button', { name: 'Import file' }).click()
          await expect(importFileDialog(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await importFileDialog(p).locator('input[type="file"]').setInputFiles(gpxFixture('arashiyama-loop'))
          await expect(importFileDialog(p).getByText('Tracks (with path geometry)')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
        target: importFileDialog,
      },
      only(dropBox),
      {
        target: p => importFileDialog(p).getByRole('button', { name: 'Import', exact: true }),
        act: async p => {
          await importFileDialog(p).getByRole('button', { name: 'Import', exact: true }).click()
          await expect(importFileDialog(p)).toHaveCount(0, { timeout: 30_000 })
          await expect(row(p, 'Arashiyama loop')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByName(p, 'Arashiyama loop', 'Togetsukyo Bridge', 'Okochi Sanso Villa'),
  },
  'import-places-list': {
    guide: guide('import-places-list'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Import Places' }).click()
          await expect(importMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        // Google List while Google is the only list provider, List Import once Naver is on too.
        target: p => importMenu(p).getByRole('button', { name: /^(Google List|List Import)$/ }),
        act: async p => {
          await importMenu(p).getByRole('button', { name: /^(Google List|List Import)$/ }).click()
          await expect(listImportDialog(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, listImportDialog(p).getByPlaceholder(/goo\.gl|naver/), 'https://maps.app.goo.gl/kyoto-favourites')
          await beat(p, 300)
        },
        target: listImportDialog,
      },
      only(p => listImportDialog(p).getByRole('button', { name: 'Import', exact: true })),
    ],
    // The dialog has no Escape route: Cancel is the way out.
    cleanup: async p => {
      if (await listImportDialog(p).isVisible().catch(() => false)) {
        await listImportDialog(p).getByRole('button', { name: 'Cancel' }).click()
        await expect(listImportDialog(p)).toHaveCount(0)
      }
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureTrack(request, seededTrip().tripId, 'kyoto-walk')
})

test('every registered places guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripPlacesContext.guides].sort())
})

test('hero: trip-places', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripPlacesContext.id, p => openTrip(p))
})

for (const id of tripPlacesContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
