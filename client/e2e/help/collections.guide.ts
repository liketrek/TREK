import { test, expect, type Page, type Locator } from '@playwright/test'
import path from 'node:path'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, OUT_DIR, type GuideScript } from './guide'
import { ensureExtraTrips } from './fixtures'
import { collectionsGuides, collectionsContext } from '../../src/help/contexts/collections'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Collections guides, keyed by the ids in
 * `src/help/contexts/collections.ts`. The seed leaves one list, "Kyoto
 * shortlist", with four of the Japan trip's places on it; the guides add a
 * second list, more places, a label, a member and a file round trip, in the
 * order the context lists them, and leave it all in place.
 */

const KYOTO = 'Kyoto shortlist'
const LISBON = 'Lisbon coffee'

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
/** The card inside the backdrop, for framing a whole dialog. */
const modalCard = (page: Page) => modal(page).locator('> [role="presentation"]').first()
const placeRow = (page: Page, name: string) => page.locator('.col-lrow').filter({ hasText: name }).first()
const placeRows = (page: Page) => page.locator('.col-lrow')
const selectionBar = (page: Page) => page.locator('.col-selbar')
/** The detail sheet beside the list. */
const detail = (page: Page) => page.locator('.col-detail').first()

async function openCollections(page: Page): Promise<void> {
  await page.goto('/collections')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(rail(page)).toBeVisible({ timeout: 20_000 })
  await expect(listRow(page, KYOTO)).toBeVisible({ timeout: 20_000 })
  await settle(page)
}

async function openList(page: Page, name: string): Promise<void> {
  await openCollections(page)
  await listRow(page, name).click()
  await expect(hero(page)).toContainText(name)
  await settle(page)
}

/** Pick an option in a CustomSelect that has a search box. */
async function pickSearchable(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click()
  const search = page.getByPlaceholder('...')
  await search.waitFor({ state: 'visible', timeout: 5_000 })
  await typeInto(page, search, text)
  await search.locator('xpath=../..').getByRole('button', { name: text, exact: true }).first().click()
}

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
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create' }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(hero(p)).toContainText(LISBON)
          await settle(p)
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
        target: p => modal(p).getByPlaceholder('Search for a place…'),
        act: async p => {
          const search = modal(p).getByPlaceholder('Search for a place…')
          await typeInto(p, search, 'Fushimi Inari')
          await modal(p).getByRole('button', { name: 'Search', exact: true }).click()
          const hit = modal(p).locator('button').filter({ hasText: /Fushimi Inari/ }).first()
          await expect(hit).toBeVisible({ timeout: 20_000 })
          await hit.click()
          await expect(modal(p).getByPlaceholder('Name', { exact: true })).toHaveValue(/Fushimi/)
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(placeRow(p, 'Fushimi Inari Shrine')).toBeVisible({ timeout: 15_000 })
          // The dialog stays open for the next place; the guide is done with it.
          await beat(p, 600)
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },

  'import-from-trip': {
    guide: guide('import-from-trip'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => filterBar(p).getByRole('button', { name: 'Import from a trip' }),
        act: async p => {
          await filterBar(p).getByRole('button', { name: 'Import from a trip' }).click()
          await expect(modal(p)).toBeVisible()
          await expect(modal(p).locator('button.col-imp-trip').first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).locator('button.col-imp-trip').filter({ hasText: 'Autumn in Japan' }),
        act: async p => {
          await modal(p).locator('button.col-imp-trip').filter({ hasText: 'Autumn in Japan' }).click()
          await expect(modal(p).locator('button.col-imp-row').first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).locator('.col-imp-list'),
        act: async p => {
          // Make sure something is ticked: the first two rows that are not already on the list.
          const rows = modal(p).locator('button.col-imp-row:not(.dup)')
          for (let i = 0; i < Math.min(2, await rows.count()); i++) {
            if ((await rows.nth(i).getAttribute('aria-pressed')) !== 'true') await rows.nth(i).click()
          }
          await beat(p, 300)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: /^Import \d+$/ }),
        act: async p => {
          await modal(p).getByRole('button', { name: /^Import \d+$/ }).click()
          await expect(modal(p).getByText('Import finished')).toBeVisible({ timeout: 15_000 })
          await modal(p).getByRole('button', { name: 'Close' }).click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
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
          await settle(p)
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
          await settle(p)
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
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
          await expect(selectionBar(p)).toBeVisible()
          await placeRows(p).nth(0).click()
          await placeRows(p).nth(1).click()
        },
        target: p => selectionBar(p).getByRole('button', { name: 'Assign label' }),
        act: async p => {
          await selectionBar(p).getByRole('button', { name: 'Assign label' }).click()
          await expect(modal(p)).toBeVisible()
          await modal(p).getByRole('button', { name: 'Arashiyama' }).click()
          await modal(p).getByRole('button', { name: 'Assign label' }).click()
          await expect(modal(p)).toHaveCount(0)
          await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
          await expect(selectionBar(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        target: p => p.locator('.col-labelfilter').first(),
        act: async p => {
          await p.locator('.col-labelfilter').first().getByRole('button', { name: /Arashiyama/ }).click()
          await settle(p)
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
        prepare: async p => { await selectionBar(p).getByRole('button', { name: 'Select all' }).click() },
        target: selectionBar,
      },
    ],
    cleanup: async p => {
      await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
      await expect(selectionBar(p)).toHaveCount(0)
    },
  },

  'copy-to-trip': {
    guide: guide('copy-to-trip'),
    start: p => openList(p, KYOTO),
    steps: [
      {
        target: p => filterBar(p).getByRole('button', { name: 'Select', exact: true }),
        act: async p => {
          await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
          await expect(selectionBar(p)).toBeVisible()
          await placeRows(p).nth(0).click()
          await placeRows(p).nth(2).click()
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
        target: p => modal(p).locator('button').filter({ hasText: 'Norway Road Trip' }),
        act: async p => {
          await modal(p).locator('button').filter({ hasText: 'Norway Road Trip' }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      if (await selectionBar(p).count()) await filterBar(p).getByRole('button', { name: 'Select', exact: true }).click()
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
        target: p => modal(p).getByRole('button', { name: 'Select a user' }).locator('xpath=../..'),
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
          await settle(p)
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
          await settle(p)
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
          await typeInto(p, desc, 'Coffee first, then the miradouros. Weekend of 16 October.')
          await modal(p).getByRole('button', { name: 'Save' }).click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
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
          await settle(p)
        },
      },
      {
        target: p => p.getByPlaceholder('Search places').first(),
        act: async p => {
          await typeInto(p, p.getByPlaceholder('Search places').first(), 'temple')
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
