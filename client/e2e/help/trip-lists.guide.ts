import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { pickerLabel } from '../dates'
import { seededTrip, ensureListsFixtures } from './fixtures'
import { openTrip, modal } from './trip-shared'
import { tripListsContext, tripListsGuides } from '../../src/help/contexts/tripLists'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Lists tab of a trip, keyed by the ids in
 * `src/help/contexts/tripLists.ts`. They run on the seeded "Autumn in Japan"
 * with the fixtures' packing template and two extra tasks in place, so Apply
 * template exists and the to-do sidebar has more than one filled filter; what
 * a guide creates it takes away again in `cleanup`, so the next one starts the
 * same.
 */

const guide = (id: string): HelpGuide => {
  const g = tripListsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** What the guides make and unmake. Nothing here is in the seed. */
const NEW_LIST = 'Toiletries'
const FIRST_ITEM = 'Toothbrush'
const RENAMED_ITEM = 'Toothbrush and paste'
const MEMBER = 'mira'
const SHARED_ITEM = 'Camera'
const BAG_ITEM = 'Rain jacket'
const BAG = 'Cabin bag'
const SAVED_TEMPLATE = 'Autumn in Japan'
const NEW_TASK = 'Pick up the pocket wifi'
const NEW_TASK_NOTE = 'Counter is past customs, on the right, open until 22:00.'
const TASK_LIST = 'On arrival'
const OTHER_TASK_LIST = 'Before departure'
const EDITED_TASK = 'Activate JR Pass'
const ASSIGNEE = 'jonas'
/** The date picker labels a day cell with the whole date, in the run's English. */
const DUE_DAY = pickerLabel(4)
/** The fixtures' template, and the lists it brings with it. */
const TEMPLATE = { name: 'Japan autumn basics', category: 'Rain kit', items: ['Umbrella', 'Quick-dry towel', 'Dry bag', 'SIM card', 'Plug adapter'] }
const IMPORT_LINES = 'Toiletries, Toothbrush\nToiletries, Sunscreen, 90\nHealth, Plasters, 30'
const IMPORTED = ['Toothbrush', 'Sunscreen', 'Plasters']
/** The seed's packing items, in the order it created them. */
const SEED_ORDER = ['Passport', 'JR Pass voucher', 'Travel insurance', 'Rain jacket', 'Walking shoes', 'Light layers', 'Type-A adapter', 'Power bank', 'Camera']
const DOCUMENTS = ['Passport', 'JR Pass voucher', 'Travel insurance']
/** The count in the label moves with what is ticked, so it is matched, not spelled. */
const CLEAR_CHECKED = /^Remove \d+ checked$/

// ── Locators ─────────────────────────────────────────────────────────────────

/** A category card: the list's name is a span in the card's header row. */
const cat = (page: Page, name: string): Locator =>
  page.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[2]')
/**
 * The header row of a card. The ⋯ has to be taken from here: every item row
 * carries a ⋯ of its own, so the card as a whole holds several of them.
 */
const catHeader = (page: Page, name: string): Locator => cat(page, name).locator('> div').first()
const catMenu = (page: Page, name: string): Locator =>
  catHeader(page, name).locator('button:has(svg.lucide-more-horizontal)')
/** The open ⋯ menu is a fixed popover with no class of its own; its last entry names it. */
const catMenuCard = (page: Page): Locator => page.getByRole('button', { name: 'Delete List' }).locator('xpath=..')
const item = (page: Page, name: string): Locator =>
  page.locator('.packing-item-row').filter({ hasText: name }).first()
/** The only item of the list the first guide builds; its name changes mid-guide. */
const onlyRow = (page: Page): Locator => cat(page, NEW_LIST).locator('.packing-item-row').first()
/** An item's own ⋯, which holds Move to List, Sharing, Rename and Delete. */
const rowMenu = (page: Page, name: string): Locator => item(page, name).locator('.packing-row-overflow button')
/** The open item menu; Sharing is a whole line in it. */
const rowMenuSharing = (page: Page): Locator =>
  page.locator('.trek-menu-enter').getByRole('button', { name: /^Sharing/ })
/** The name dialog that Add list and Save as template open. */
const nameDialog = (page: Page, confirm: string): Locator => page.getByRole('button', { name: confirm, exact: true })
/** The sharing dropdown is portalled to <body>, so the hint's parent is the card itself. */
const shareMenu = (page: Page): Locator =>
  page.getByText('In the group pool, visible to everyone').locator('xpath=ancestor::div[1]')
/** Its click-catcher, the only way back out of the menu once a name is ticked. */
const shareOverlay = (page: Page): Locator => page.locator('div[role="presentation"][style*="z-index: 1099"]').last()
/** The bulk-import dialog: its own portal, with none of the shared backdrop classes. */
const importCard = (page: Page): Locator =>
  page.getByText('Import Packing List', { exact: true }).locator('xpath=..')
/** The Export button's menu: print, Markdown and CSV. */
const exportMenu = (page: Page): Locator => page.getByRole('menu')
/** The printable page inside the preview, a srcdoc frame of its own. */
const printFrame = (page: Page) => page.frameLocator('iframe[title^="Packing List"]')
/** The bags column. Total weight is a span two divs inside it, under the rule. */
const bagSidebar = (page: Page): Locator =>
  page.getByText('Total weight', { exact: true }).locator('xpath=ancestor::div[3]')
/** The detail pane on the right; its header reads Task. */
const todoPane = (page: Page): Locator => page.getByText('Task', { exact: true }).locator('xpath=ancestor::div[2]')
/** A task row is a div with role=button whose name starts with the task's own. */
const task = (page: Page, name: string): Locator =>
  page.getByRole('button', { name: new RegExp(`^${name}`) }).first()
const sidebarFilter = (page: Page, name: string): Locator =>
  page.getByRole('button', { name: new RegExp(`^${name}`) })

const only = (target: (p: Page) => Locator) => ({ target })

// ── Getting there ────────────────────────────────────────────────────────────

/** The tab id in the address is the legacy 'listen'; the tab itself reads Lists. */
async function openLists(page: Page): Promise<void> {
  await openTrip(page, { tab: 'listen' })
  await expect(page.getByRole('button', { name: /^Packing List/ })).toBeVisible({ timeout: 30_000 })
  await settle(page)
}

/**
 * The sub-tab is remembered in sessionStorage, which Playwright never restores,
 * so every guide opens on Packing List and the to-do ones switch over.
 */
async function openTodos(page: Page): Promise<void> {
  await openLists(page)
  await page.getByRole('button', { name: /^To-Do/ }).click()
  await expect(page.getByRole('button', { name: 'Add new task' })).toBeVisible({ timeout: 15_000 })
  await settle(page)
}

// ── Putting the seed back ────────────────────────────────────────────────────

interface PackingRow {
  id: number
  name: string
  category: string | null
}

async function packingItems(page: Page): Promise<PackingRow[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/packing`)
  const body = (await res.json()) as { items?: PackingRow[] }
  return body.items ?? []
}

async function deleteItems(page: Page, match: (row: PackingRow) => boolean): Promise<void> {
  const { tripId } = seededTrip()
  for (const row of (await packingItems(page)).filter(match)) {
    await page.request.delete(`/api/trips/${tripId}/packing/${row.id}`)
  }
}

/**
 * Re-creates the three Documents items the guide really deleted, then writes
 * the seed's order back: without it the re-created rows sort last, the
 * Documents card slides to the end of the two-column grid, and every later
 * guide's picture changes.
 */
async function restoreDocuments(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  const present = await packingItems(page)
  for (const name of DOCUMENTS) {
    if (present.some(row => row.name === name)) continue
    await page.request.post(`/api/trips/${tripId}/packing`, { data: { name, category: 'Documents', visibility: 'common' } })
  }
  const after = await packingItems(page)
  const orderedIds = SEED_ORDER.map(name => after.find(row => row.name === name)?.id).filter((id): id is number => id !== undefined)
  await page.request.put(`/api/trips/${tripId}/packing/reorder`, { data: { orderedIds } })
}

async function deleteTemplate(page: Page, name: string): Promise<void> {
  const res = await page.request.get('/api/admin/packing-templates')
  const body = (await res.json()) as { templates?: { id: number; name: string }[] }
  for (const template of (body.templates ?? []).filter(row => row.name === name)) {
    await page.request.delete(`/api/admin/packing-templates/${template.id}`)
  }
}

async function deleteTodo(page: Page, name: string): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/todo`)
  const body = (await res.json()) as { items?: { id: number; name: string }[] }
  for (const row of (body.items ?? []).filter(x => x.name === name)) {
    await page.request.delete(`/api/trips/${tripId}/todo/${row.id}`)
  }
}

async function unassignTodo(page: Page, name: string): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/todo`)
  const body = (await res.json()) as { items?: { id: number; name: string }[] }
  const row = (body.items ?? []).find(x => x.name === name)
  if (row) await page.request.put(`/api/trips/${tripId}/todo/${row.id}`, { data: { assigned_user_id: null } })
}

// ── Scripts ──────────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'packing-categories': {
    guide: guide('packing-categories'),
    start: openLists,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Add list' }),
        act: async p => {
          await p.getByRole('button', { name: 'Add list' }).click()
          const field = p.getByPlaceholder('List name (e.g. Clothing)')
          await typeInto(p, field, NEW_LIST)
          await nameDialog(p, 'Add').click()
          await expect(cat(p, NEW_LIST)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => cat(p, NEW_LIST).getByRole('button', { name: 'Add item' }),
        act: async p => {
          await cat(p, NEW_LIST).getByRole('button', { name: 'Add item' }).click()
          const field = p.getByPlaceholder('Item name...')
          await typeInto(p, field, FIRST_ITEM)
          // Enter renames the list's '...' row rather than adding a second one,
          // and leaves the field open; Escape is how it closes.
          await field.press('Enter')
          await expect(item(p, FIRST_ITEM)).toBeVisible({ timeout: 20_000 })
          await field.press('Escape')
          await settle(p)
        },
      },
      {
        prepare: async p => { await onlyRow(p).hover() },
        // A click on the name renames it; the row has no pencil of its own.
        target: p => onlyRow(p).getByRole('button', { name: FIRST_ITEM }),
        act: async p => {
          await onlyRow(p).getByRole('button', { name: FIRST_ITEM }).click()
          // While editing, the name is the row's first input; the quantity and
          // the weight come after it.
          const field = onlyRow(p).locator('input').first()
          await typeInto(p, field, RENAMED_ITEM)
          await field.press('Enter')
          await expect(item(p, RENAMED_ITEM)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => catHeader(p, NEW_LIST).locator('button:has(svg.lucide-user-plus)'),
        act: async p => {
          const plus = catHeader(p, NEW_LIST).locator('button:has(svg.lucide-user-plus)')
          await plus.click()
          await catHeader(p, NEW_LIST).getByRole('button', { name: MEMBER }).click()
          await expect(catHeader(p, NEW_LIST).locator('.assignee-chip')).toHaveCount(1, { timeout: 20_000 })
          await plus.click()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await catMenu(p, NEW_LIST).click()
          await expect(p.getByRole('button', { name: 'Delete List' })).toBeVisible()
          await beat(p, 300)
        },
        target: catMenuCard,
        act: async p => {
          // The menu sits over a full-viewport catcher; a click in the corner
          // closes it without deleting the list the picture was just taken of.
          await p.mouse.click(20, VIEWPORT.height - 40)
          await expect(p.getByRole('button', { name: 'Delete List' })).toHaveCount(0)
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      await deleteItems(p, row => row.category === NEW_LIST)
      await p.request.put(`/api/trips/${tripId}/packing/category-assignees/${encodeURIComponent(NEW_LIST)}`, { data: { user_ids: [] } })
    },
  },
  'check-off-packing': {
    guide: guide('check-off-packing'),
    start: openLists,
    steps: [
      {
        // The grip is a div, so the tick box is the row's first button.
        target: p => item(p, 'Passport').getByRole('button').first(),
        act: async p => {
          await item(p, 'Passport').getByRole('button').first().click()
          await expect(item(p, 'Passport').locator('.packing-check')).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      // The whole progress card: the count, the bar, and the clean-up beside it.
      only(p => p.getByText('/9', { exact: true }).locator('xpath=ancestor::div[4]')),
      {
        prepare: async p => {
          await catMenu(p, 'Documents').click()
          await expect(p.getByRole('button', { name: 'Check All', exact: true })).toBeVisible()
          await beat(p, 300)
        },
        target: p => p.getByRole('button', { name: 'Check All', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Check All', exact: true }).click()
          await expect(cat(p, 'Documents').getByText('3/3', { exact: true })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Open', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Open', exact: true }).click()
          await expect(p.getByText('Documents', { exact: true })).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: CLEAR_CHECKED }),
        act: async p => {
          // A native window.confirm, which Playwright dismisses unless something
          // accepts it first. The browser's own dialog cannot be pictured, so
          // the step shows the button and the state it leaves behind.
          p.once('dialog', d => { void d.accept() })
          await p.getByRole('button', { name: CLEAR_CHECKED }).click()
          await expect(p.getByRole('button', { name: CLEAR_CHECKED })).toHaveCount(0, { timeout: 30_000 })
          await settle(p)
        },
      },
    ],
    cleanup: restoreDocuments,
  },
  'apply-packing-template': {
    guide: guide('apply-packing-template'),
    start: openLists,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Apply template' }),
        act: async p => {
          await p.getByRole('button', { name: 'Apply template' }).click()
          await expect(p.locator('.trek-menu-enter').last()).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => p.locator('.trek-menu-enter').last(),
        act: async p => {
          await p.locator('.trek-menu-enter').last().getByRole('button', { name: new RegExp(`^${TEMPLATE.name}`) }).click()
          await expect(cat(p, TEMPLATE.category)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      only(p => p.getByRole('button', { name: /^Shared/ })),
      {
        target: p => p.getByRole('button', { name: 'Save as template' }),
        act: async p => {
          await p.getByRole('button', { name: 'Save as template' }).click()
          const field = p.getByPlaceholder('Template name')
          await typeInto(p, field, SAVED_TEMPLATE)
          await nameDialog(p, 'Save').click()
          await expect(p.getByText('Packing list saved as template')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await deleteItems(p, row => TEMPLATE.items.includes(row.name))
      await deleteTemplate(p, SAVED_TEMPLATE)
    },
  },
  'import-packing-list': {
    guide: guide('import-packing-list'),
    start: openLists,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Import', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Import', exact: true }).click()
          await expect(importCard(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // The step's text points at the grey sample, which is the textarea's
        // placeholder: it is only on screen while the box is empty, so the lines
        // are typed after the picture, not before it.
        target: importCard,
        act: async p => {
          await typeInto(p, importCard(p).locator('textarea'), IMPORT_LINES)
          await expect(importCard(p).locator('textarea')).toHaveValue(IMPORT_LINES, { timeout: 20_000 })
          await settle(p)
        },
      },
      // Clicking it would open the operating system's file chooser, which is
      // not part of the picture; the button is shown, not pressed.
      only(p => importCard(p).getByRole('button', { name: 'Load CSV/TXT/MD' })),
      {
        target: p => importCard(p).getByRole('button', { name: /^Import \d+$/ }),
        act: async p => {
          await importCard(p).getByRole('button', { name: /^Import \d+$/ }).click()
          await expect(p.getByText('Import Packing List', { exact: true })).toHaveCount(0, { timeout: 30_000 })
          await expect(item(p, 'Sunscreen')).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteItems(p, row => IMPORTED.includes(row.name)),
  },
  'export-packing-list': {
    guide: guide('export-packing-list'),
    start: openLists,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Export', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Export', exact: true }).click()
          await expect(exportMenu(p)).toBeVisible()
          await settle(p)
        },
      },
      // The two file entries download at once; the step shows them, it does not press them.
      only(exportMenu),
      {
        target: p => exportMenu(p).getByRole('menuitem', { name: 'Print or save as PDF' }),
        act: async p => {
          await exportMenu(p).getByRole('menuitem', { name: 'Print or save as PDF' }).click()
          await expect(printFrame(p).locator('h1')).toBeVisible({ timeout: 15_000 })
          // The page carries the app's own Poppins; the result picture waits for it.
          await printFrame(p).locator('body').evaluate(async () => { await document.fonts.ready })
          await settle(p)
        },
      },
      // Pressing it opens the operating system's print dialog, which is not part
      // of the picture; the button is shown, not pressed. The result picture is the
      // preview itself.
      only(p => p.getByRole('button', { name: 'Print or save as PDF' })),
    ],
    cleanup: async p => {
      await p.getByRole('button', { name: 'Close', exact: true }).click()
    },
  },
  'share-packing-item': {
    guide: guide('share-packing-item'),
    start: openLists,
    steps: [
      {
        target: p => p.getByRole('button', { name: /^My list/ }),
        act: async p => {
          await p.getByRole('button', { name: /^My list/ }).click()
          await expect(p.getByText('No items match this filter')).toBeVisible({ timeout: 20_000 })
          await p.getByRole('button', { name: /^Shared/ }).click()
          await expect(item(p, SHARED_ITEM)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await item(p, SHARED_ITEM).hover()
          await rowMenu(p, SHARED_ITEM).click()
          await expect(rowMenuSharing(p)).toBeVisible()
          await beat(p, 300)
        },
        target: rowMenuSharing,
        act: async p => {
          await rowMenuSharing(p).click()
          await expect(shareMenu(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: shareMenu,
        act: async p => {
          await shareMenu(p).getByRole('button', { name: /^Personal/ }).click()
          await expect(item(p, SHARED_ITEM)).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: /^My list/ }),
        act: async p => {
          await p.getByRole('button', { name: /^My list/ }).click()
          await expect(item(p, SHARED_ITEM)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await item(p, SHARED_ITEM).hover()
          await rowMenu(p, SHARED_ITEM).click()
          await rowMenuSharing(p).click()
          await expect(shareMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        target: p => shareMenu(p).getByRole('button', { name: MEMBER }),
        act: async p => {
          await shareMenu(p).getByRole('button', { name: MEMBER }).click()
          // Ticking a name leaves the menu open on purpose; its catcher closes it,
          // and the item menu under it has one of its own.
          await shareOverlay(p).click({ position: { x: 5, y: 5 } })
          await p.mouse.click(20, VIEWPORT.height - 40)
          await expect(p.locator('.trek-menu-enter')).toHaveCount(0)
          await expect(item(p, SHARED_ITEM).getByLabel('shared with 1')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      const row = (await packingItems(p)).find(x => x.name === SHARED_ITEM)
      if (row) {
        await p.request.put(`/api/trips/${tripId}/packing/${row.id}/sharing`, { data: { visibility: 'common', recipient_ids: [] } })
      }
    },
  },
  'packing-bags': {
    guide: guide('packing-bags'),
    start: openLists,
    steps: [
      {
        // The weight field's placeholder really is a dash: it is the app's own
        // string, not prose, so it is matched exactly as rendered.
        target: p => item(p, BAG_ITEM).getByPlaceholder('\u2014'),
        act: async p => {
          const field = item(p, BAG_ITEM).getByPlaceholder('\u2014')
          await typeInto(p, field, '620')
          await expect(field).toHaveValue('620', { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => { await item(p, BAG_ITEM).hover() },
        // The circle is dashed with a parcel in it while the item is in no bag.
        target: p => item(p, BAG_ITEM).locator('button:has(svg.lucide-package)'),
        act: async p => {
          await item(p, BAG_ITEM).locator('button:has(svg.lucide-package)').click()
          await expect(item(p, BAG_ITEM).getByRole('button', { name: 'Add bag' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => item(p, BAG_ITEM).getByRole('button', { name: 'Add bag' }),
        act: async p => {
          await item(p, BAG_ITEM).getByRole('button', { name: 'Add bag' }).click()
          const field = item(p, BAG_ITEM).getByPlaceholder('Bag name...')
          await typeInto(p, field, BAG)
          await field.press('Enter')
          await expect(bagSidebar(p)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      only(bagSidebar),
      {
        target: p => bagSidebar(p).getByRole('button', { name: 'Set limit' }),
        act: async p => {
          await bagSidebar(p).getByRole('button', { name: 'Set limit' }).click()
          // Entered in kilograms, stored in grams.
          const field = bagSidebar(p).locator('input[aria-label="Weight limit"]')
          await typeInto(p, field, '8')
          await field.press('Enter')
          await expect(bagSidebar(p).getByText('/ 8.0 kg')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        // The card's member picker is the dashed plus beside the bag's name; the
        // column's other plus, + Bags in its head, adds a bag.
        target: p => bagSidebar(p).locator('button[style*="dashed"]').first(),
        act: async p => {
          await bagSidebar(p).locator('button[style*="dashed"]').first().click()
          await bagSidebar(p).getByRole('button', { name: MEMBER }).click()
          // The picker closes on a click anywhere beside it.
          await p.mouse.click(20, VIEWPORT.height - 40)
          await expect(bagSidebar(p).getByRole('button', { name: MEMBER })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      const res = await p.request.get(`/api/trips/${tripId}/packing/bags`)
      const body = (await res.json()) as { bags?: { id: number; name: string }[] }
      for (const bag of (body.bags ?? []).filter(x => x.name === BAG)) {
        // bag_id is ON DELETE SET NULL, so the item is freed with it.
        await p.request.delete(`/api/trips/${tripId}/packing/bags/${bag.id}`)
      }
      const row = (await packingItems(p)).find(x => x.name === BAG_ITEM)
      if (row) await p.request.put(`/api/trips/${tripId}/packing/${row.id}`, { data: { weight_grams: null } })
    },
  },
  'create-todo': {
    guide: guide('create-todo'),
    start: openTodos,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Add new task' }),
        act: async p => {
          await p.getByRole('button', { name: 'Add new task' }).click()
          await expect(modal(p).getByPlaceholder('Task name')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByPlaceholder('Task name'), NEW_TASK)
          await typeInto(p, modal(p).getByPlaceholder('Description (optional)'), NEW_TASK_NOTE)
          await settle(p)
        },
        target: p => modal(p).getByPlaceholder('Task name'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'No list' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'No list' }).click()
          // The select's list is portalled to <body>, outside the dialog.
          await p.getByRole('button', { name: TASK_LIST, exact: true }).click()
          await expect(modal(p).getByRole('button', { name: TASK_LIST })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'P1', exact: true }).locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'P2', exact: true }).click()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          // Exact: the keyboard button beside it is "Enter date manually", which a
          // loose name match also finds.
          await modal(p).getByRole('button', { name: 'Date', exact: true }).click()
          await expect(p.getByRole('button', { name: DUE_DAY })).toBeVisible()
          await beat(p, 300)
        },
        target: p => p.getByRole('dialog').last(),
        act: async p => {
          await p.getByRole('button', { name: DUE_DAY }).click()
          await modal(p).getByRole('button', { name: 'Unassigned' }).click()
          await p.getByRole('button', { name: ASSIGNEE }).click()
          await expect(modal(p).getByRole('button', { name: ASSIGNEE })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create task' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create task' }).click()
          await expect(p.locator('.trek-modal-backdrop')).toHaveCount(0, { timeout: 30_000 })
          await expect(task(p, NEW_TASK)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteTodo(p, NEW_TASK),
  },
  'todo-filters': {
    guide: guide('todo-filters'),
    start: openTodos,
    steps: [
      {
        target: p => sidebarFilter(p, 'Overdue'),
        act: async p => {
          await sidebarFilter(p, 'Overdue').click()
          await expect(p.getByRole('heading', { name: 'Overdue' })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => sidebarFilter(p, OTHER_TASK_LIST),
        act: async p => {
          await sidebarFilter(p, OTHER_TASK_LIST).click()
          await expect(p.getByRole('heading', { name: OTHER_TASK_LIST })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await sidebarFilter(p, 'All').click()
          await settle(p)
        },
        target: p => p.getByRole('button', { name: 'Priority', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Priority', exact: true }).click()
          await expect(p.locator('div[role="button"][data-no-press]').first()).toContainText(EDITED_TASK, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => task(p, EDITED_TASK),
        act: async p => {
          await task(p, EDITED_TASK).click()
          await expect(todoPane(p)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await todoPane(p).getByRole('button', { name: 'Unassigned' }).click()
          await p.getByRole('button', { name: ASSIGNEE }).click()
          await settle(p)
        },
        target: p => todoPane(p).getByRole('button', { name: 'Save changes' }),
        act: async p => {
          await todoPane(p).getByRole('button', { name: 'Save changes' }).click()
          // The row names its assignee as an avatar, labelled with the name.
          await expect(task(p, EDITED_TASK).getByLabel(ASSIGNEE)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => unassignTodo(p, EDITED_TASK),
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureListsFixtures(request)
})

test('every registered lists guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripListsContext.guides].sort())
})

test('hero: trip-lists', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripListsContext.id, openLists)
})

for (const id of tripListsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
