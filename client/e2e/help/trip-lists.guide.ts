import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, dragLoop, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { pickerLabel } from '../dates'
import { seededTrip, ensureListsFixtures } from './fixtures'
import { openTrip, modal } from './trip-shared'
import { restorePacking, snapshotPacking, untickPacking, type PackingSnapshotRow } from './fixtures-trip-lists'
import { tripListsContext, tripListsGuides } from '../../src/help/contexts/tripLists'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Lists tab of a trip, keyed by the ids in
 * `src/help/contexts/tripLists.ts`. They run on the seeded "Autumn in Japan"
 * with the fixtures' packing template and extra tasks in place, so Apply
 * template exists and the to-do sidebar has more than one filled filter.
 *
 * The seed's packing list is long and mostly ticked, so the packing guides do
 * not undo their changes one by one: the list is snapshotted once before the
 * first guide (`fixtures-trip-lists.ts`) and put back from that snapshot when
 * each packing guide starts and again when it ends. What lives outside the
 * items (a template, a bag, a list's assignees, a task) is removed by the
 * guide that made it.
 */

const guide = (id: string): HelpGuide => {
  const g = tripListsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** What the guides make and unmake. None of these names is in the seed. */
const NEW_LIST = 'Snacks'
const FIRST_ITEM = 'Rice crackers'
const RENAMED_ITEM = 'Rice crackers for the train'
const MEMBER = 'mira'
const SHARED_ITEM = 'Camera'
const BAG_ITEM = 'Rain jacket'
const BAG = 'Cabin bag'
const SAVED_TEMPLATE = 'Autumn in Japan'
const NEW_TASK = 'Pick up the pocket wifi'
const NEW_TASK_NOTE = 'Counter is past customs, on the right, open until 22:00.'
const TASK_LIST = 'On arrival'
const OTHER_TASK_LIST = 'Before departure'
/** An open, unassigned task of the seed; the edit guide puts a name on it. */
const EDITED_TASK = 'Send postcards home'
/** The only open task with a priority (the fixtures' P3), so Priority puts it on top. */
const PRIORITY_TASK = 'Confirm ryokan check-in time'
const ASSIGNEE = 'jonas'
/** The date picker labels a day cell with the whole date, in the run's English. */
const DUE_DAY = pickerLabel(4)
/** The fixtures' template, and the list it brings with it. */
const TEMPLATE = { name: 'Japan autumn basics', category: 'Rain kit' }
/** Names the seed does not have, so the imported rows are the only ones that match. */
const IMPORT_LINES = 'Toiletries, Earplugs\nHealth, Motion sickness tablets, 20\nDay bag, Folding fan, 40'
const IMPORTED_LAST = 'Folding fan'
/** Still open in the seed, so a click ticks it rather than unticking it. */
const OPEN_ITEM = 'Slip-on shoes for temples'
/** A list with one open item, so Check All visibly finishes it. */
const CHECK_ALL_LIST = 'Electronics'
const CHECK_ALL_OPEN = 'eSIM activation code'
/** Fully packed in the seed, so the Open filter hides its list. */
const PACKED_ITEM = 'Passport'
/** What the ordering guide moves: the third list onto the first, then the last item of that first list to its top. */
const MOVED_LIST = 'Electronics'
const FIRST_LIST = 'Documents'
const MOVED_ITEM = 'Credit card and some yen'
const TOP_ITEM = 'Passport'
/** Packed in the seed; the counting guide unticks it and counts five pairs in. */
const PIECES_ITEM = 'Merino socks'
const PIECES = 5
/** The count in the label moves with what is ticked, so it is matched, not spelled. */
const CLEAR_CHECKED = /^Remove \d+ checked$/

// ── Locators ─────────────────────────────────────────────────────────────────

/** A category card: the list's name is a span in the card's head band. */
const cat = (page: Page, name: string): Locator =>
  page.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[2]')
/**
 * The head band of a card. The ⋯ has to be taken from here: every item row
 * carries a ⋯ of its own, so the card as a whole holds several of them.
 */
const catHeader = (page: Page, name: string): Locator => cat(page, name).locator('> div').first()
const catMenu = (page: Page, name: string): Locator =>
  catHeader(page, name).locator('button:has(svg.lucide-ellipsis, svg.lucide-more-horizontal)')
/** The grip in a list's head band, before its colour dot. */
const catGrip = (page: Page, name: string): Locator =>
  catHeader(page, name).getByRole('button', { name: 'Drag to reorder the category' })
/** The open ⋯ menu is a fixed popover with no class of its own; its last entry names it. */
const catMenuCard = (page: Page): Locator => page.getByRole('button', { name: 'Delete List' }).locator('xpath=..')
const item = (page: Page, name: string): Locator =>
  page.locator('.packing-item-row').filter({ hasText: name }).first()
/** A row's own grip is a bare draggable div, the first thing in the row. */
const rowGrip = (page: Page, name: string): Locator => item(page, name).locator('div[draggable="true"]')
/** The two-column grid of list cards; its children are the cards, in order. */
const listGrid = (page: Page): Locator =>
  page.locator('div.grid').filter({ has: page.locator('.packing-item-row') }).first()
/** The only item of the list the first guide builds; its name changes mid-guide. */
const onlyRow = (page: Page): Locator => cat(page, NEW_LIST).locator('.packing-item-row').first()
/** An item's own ⋯, which holds Move to List, Sharing, Rename and Delete. */
const rowMenu = (page: Page, name: string): Locator => item(page, name).locator('.packing-row-overflow button')
/** The open item menu; Sharing is a whole line in it. */
const rowMenuSharing = (page: Page): Locator =>
  page.locator('.trek-menu-enter').getByRole('button', { name: /^Sharing/ })
/**
 * The progress card's count and percentage. The total is a span of its own
 * that reads "/28"; the category badges hold "n/m" in one span, so they never match.
 */
const progressCount = (page: Page): Locator =>
  page.getByText(/^\/\d+$/).first().locator('xpath=ancestor::div[2]')
/** The quantity badge is the first field among a row's inline actions while it has no counter. */
const quantityField = (page: Page, name: string): Locator =>
  item(page, name).locator('.packing-row-inline-actions input').first()
/** The packed counter of a multi-piece item, named "3 of 5 packed". */
const piecesCounter = (page: Page, name: string): Locator =>
  item(page, name).getByRole('group', { name: / of \d+ packed$/ })
/** The name dialog that Add list and Save as template open. */
const nameDialog = (page: Page, confirm: string): Locator => page.getByRole('button', { name: confirm, exact: true })
/** The sharing dropdown is portalled to <body>, so the hint's parent is the card itself. */
const shareMenu = (page: Page): Locator =>
  page.getByText('In the group pool, visible to everyone').locator('xpath=ancestor::div[1]')
/** Its click-catcher, the only way back out of the menu once a name is ticked. */
const shareOverlay = (page: Page): Locator => page.locator('div[role="presentation"][style*="z-index: 1099"]').last()
/** The bulk-import dialog, a DialogShell whose head band carries its title. */
const importCard = (page: Page): Locator =>
  page.getByRole('dialog').filter({ has: page.getByText('Import Packing List', { exact: true }) })
/**
 * The bag picker of a row and the member picker of a bag both hang off the
 * body, so they are found by their caption rather than inside the row.
 */
const bagPicker = (page: Page): Locator => page.locator('.trek-menu-enter').filter({ hasText: 'Bags' }).last()
const bagMemberPicker = (page: Page): Locator => page.locator('.trek-menu-enter').filter({ hasText: 'Assign members' }).last()
/** The calendar a date field opens, a portal of its own. */
const datePicker = (page: Page): Locator => page.getByRole('dialog', { name: 'Date picker' })
/** The Export button's menu: print, Markdown and CSV. */
const exportMenu = (page: Page): Locator => page.getByRole('menu')
/** The printable page inside the preview, a srcdoc frame of its own. */
const printFrame = (page: Page) => page.frameLocator('iframe[title^="Packing List"]')
/** The bag sidebar: the innermost box holding the guide's bag and the weight summary below the cards. */
const bagSidebar = (page: Page): Locator =>
  page.locator('div')
    .filter({ has: page.getByText('Total weight', { exact: true }) })
    .filter({ has: page.getByText(BAG, { exact: true }) })
    .last()
/** The detail pane on the right; its header reads Task. */
const todoPane = (page: Page): Locator => page.getByText('Task', { exact: true }).locator('xpath=ancestor::div[2]')
/** A task row is a div with role=button whose name starts with the task's own. */
const task = (page: Page, name: string): Locator =>
  page.getByRole('button', { name: new RegExp(`^${name}`) }).first()
const sidebarFilter = (page: Page, name: string): Locator =>
  page.getByRole('button', { name: new RegExp(`^${name}`) })
/**
 * A CustomSelect's options are portalled to <body> as a group named after what
 * the field shows. Scoped to it, an option never collides with the sidebar's
 * list row of the same name, which reads exactly the same once its count is zero.
 */
const selectList = (page: Page, showing: string): Locator => page.getByRole('group', { name: showing, exact: true }).last()

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

/** The packing list as the seed and the fixtures left it, taken in beforeAll. */
let seedPacking: PackingSnapshotRow[] | null = null

function seed(): PackingSnapshotRow[] {
  if (!seedPacking) throw new Error('the packing list was not snapshotted before the guides')
  return seedPacking
}

const resetPacking = (page: Page): Promise<void> => restorePacking(page.request, seed())

/** Every packing guide starts from the seed's list, even after one that failed half way. */
async function startLists(page: Page): Promise<void> {
  await resetPacking(page)
  await openLists(page)
}

interface PackingRow {
  id: number
  name: string
}

async function packingItems(page: Page): Promise<PackingRow[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/packing`)
  const body = (await res.json()) as { items?: PackingRow[] }
  return body.items ?? []
}

async function deleteTemplate(page: Page, name: string): Promise<void> {
  const res = await page.request.get('/api/admin/packing-templates')
  const body = (await res.json()) as { templates?: { id: number; name: string }[] }
  for (const template of (body.templates ?? []).filter(row => row.name === name)) {
    await page.request.delete(`/api/admin/packing-templates/${template.id}`)
  }
}

async function deleteBag(page: Page, name: string): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/packing/bags`)
  const body = (await res.json()) as { bags?: { id: number; name: string }[] }
  for (const bag of (body.bags ?? []).filter(x => x.name === name)) {
    // bag_id is ON DELETE SET NULL, so the item is freed with it.
    await page.request.delete(`/api/trips/${tripId}/packing/bags/${bag.id}`)
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
    start: startLists,
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
        // The pointer rests on the three dots that opened it, not on an entry.
        // Moved by coordinates: the menu's click-catcher covers the button.
        hover: async p => {
          const b = await catMenu(p, NEW_LIST).boundingBox()
          if (b) await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
        },
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
      await resetPacking(p)
      await p.request.put(`/api/trips/${tripId}/packing/category-assignees/${encodeURIComponent(NEW_LIST)}`, { data: { user_ids: [] } })
    },
  },
  'arrange-packing-list': {
    guide: guide('arrange-packing-list'),
    start: startLists,
    steps: [
      {
        // The still rings the grip and the card it goes onto; the loop shows the drag.
        target: p => catGrip(p, MOVED_LIST),
        dropTo: p => catHeader(p, FIRST_LIST),
        clip: async (p, frame) => {
          await dragLoop(p, catGrip(p, MOVED_LIST), catHeader(p, FIRST_LIST), frame)
          await expect(listGrid(p).locator('> div').first()).toContainText(MOVED_LIST, { timeout: 20_000 })
          await settle(p)
          for (let i = 0; i < 3; i++) await frame()
        },
      },
      {
        prepare: async p => { await item(p, MOVED_ITEM).hover() },
        target: p => rowGrip(p, MOVED_ITEM),
        dropTo: p => item(p, TOP_ITEM),
        clip: async (p, frame) => {
          await dragLoop(p, rowGrip(p, MOVED_ITEM), item(p, TOP_ITEM), frame)
          await expect(cat(p, FIRST_LIST).locator('.packing-item-row').first()).toContainText(MOVED_ITEM, { timeout: 20_000 })
          await settle(p)
          for (let i = 0; i < 3; i++) await frame()
        },
      },
      {
        target: p => p.getByRole('button', { name: 'A to Z' }),
        act: async p => {
          await p.getByRole('button', { name: 'A to Z' }).click()
          await expect(p.getByRole('button', { name: 'A to Z' })).toHaveAttribute('aria-pressed', 'true')
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      // A to Z is remembered in this browser; the next guide opens a fresh one,
      // but the switch goes back off here all the same.
      await p.evaluate(() => { try { localStorage.removeItem('trek:packing-sort') } catch { /* nothing stored */ } })
      await resetPacking(p)
    },
  },
  'check-off-packing': {
    guide: guide('check-off-packing'),
    start: startLists,
    steps: [
      {
        // The grip is a div, so the tick box is the row's first button.
        target: p => item(p, OPEN_ITEM).getByRole('button').first(),
        act: async p => {
          await item(p, OPEN_ITEM).getByRole('button').first().click()
          await expect(item(p, OPEN_ITEM).locator('.packing-check')).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      // The count and the percentage, with the bar beside them: the whole card is
      // wider than any frame and would lose both at its edges.
      only(progressCount),
      {
        prepare: async p => {
          await catMenu(p, CHECK_ALL_LIST).click()
          await expect(p.getByRole('button', { name: 'Check All', exact: true })).toBeVisible()
          await beat(p, 300)
        },
        target: p => p.getByRole('button', { name: 'Check All', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Check All', exact: true }).click()
          await expect(item(p, CHECK_ALL_OPEN).locator('.packing-check')).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Open', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Open', exact: true }).click()
          await expect(item(p, PACKED_ITEM)).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: CLEAR_CHECKED }),
        act: async p => {
          // A native window.confirm, which cannot be pictured. The step shows the
          // button and answers the browser with Cancel: with the Open filter on,
          // the screen looks the same either way, and the seed's ticked items
          // (most of the list) stay where they are for the guides after this one.
          p.once('dialog', d => { void d.dismiss() })
          await p.getByRole('button', { name: CLEAR_CHECKED }).click()
          await expect(p.getByRole('button', { name: CLEAR_CHECKED })).toBeVisible()
          await settle(p)
        },
      },
    ],
    cleanup: resetPacking,
  },
  'count-packed-pieces': {
    guide: guide('count-packed-pieces'),
    start: async p => {
      await resetPacking(p)
      await untickPacking(p.request, PIECES_ITEM)
      await openLists(p)
    },
    steps: [
      {
        prepare: async p => { await item(p, PIECES_ITEM).hover() },
        target: p => quantityField(p, PIECES_ITEM),
        act: async p => {
          const field = quantityField(p, PIECES_ITEM)
          await typeInto(p, field, String(PIECES))
          await field.press('Enter')
          await expect(piecesCounter(p, PIECES_ITEM)).toHaveAccessibleName(`0 of ${PIECES} packed`, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => piecesCounter(p, PIECES_ITEM),
        act: async p => {
          for (let n = 1; n <= 3; n++) {
            await item(p, PIECES_ITEM).getByRole('button', { name: 'Pack one more' }).click()
            await expect(piecesCounter(p, PIECES_ITEM)).toHaveAccessibleName(`${n} of ${PIECES} packed`, { timeout: 20_000 })
          }
          await settle(p)
        },
      },
      {
        // Partly packed: the counter in the accent, the tick box outlined in it.
        target: p => item(p, PIECES_ITEM),
        act: async p => {
          for (let n = 4; n <= PIECES; n++) {
            await item(p, PIECES_ITEM).getByRole('button', { name: 'Pack one more' }).click()
            await expect(piecesCounter(p, PIECES_ITEM)).toHaveAccessibleName(`${n} of ${PIECES} packed`, { timeout: 20_000 })
          }
          await expect(item(p, PIECES_ITEM).locator('.packing-check')).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      only(p => item(p, PIECES_ITEM)),
    ],
    cleanup: resetPacking,
  },
  'apply-packing-template': {
    guide: guide('apply-packing-template'),
    start: startLists,
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
      await resetPacking(p)
      await deleteTemplate(p, SAVED_TEMPLATE)
    },
  },
  'import-packing-list': {
    guide: guide('import-packing-list'),
    start: startLists,
    steps: [
      {
        // An icon at the right end of the bar, named Import by its label and tooltip.
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
          // Out of the box again, or its dark focus ring reads as a second ring
          // in the next two pictures.
          await importCard(p).locator('textarea').blur()
          await settle(p)
        },
      },
      // In the dialog's footer, on the left. Clicking it would open the operating
      // system's file chooser, which is not part of the picture; the button is
      // shown, not pressed.
      only(p => importCard(p).getByRole('button', { name: 'Load CSV/TXT/MD' })),
      {
        target: p => importCard(p).getByRole('button', { name: /^Import \d+$/ }),
        act: async p => {
          await importCard(p).getByRole('button', { name: /^Import \d+$/ }).click()
          await expect(importCard(p)).toHaveCount(0, { timeout: 30_000 })
          await expect(item(p, IMPORTED_LAST)).toBeVisible({ timeout: 30_000 })
          await item(p, IMPORTED_LAST).scrollIntoViewIfNeeded()
          await settle(p)
        },
      },
    ],
    cleanup: resetPacking,
  },
  'export-packing-list': {
    guide: guide('export-packing-list'),
    start: startLists,
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
      await p.getByRole('button', { name: 'Close', exact: true }).first().click()
    },
  },
  'share-packing-item': {
    guide: guide('share-packing-item'),
    start: startLists,
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
      await resetPacking(p)
    },
  },
  'packing-bags': {
    guide: guide('packing-bags'),
    start: async p => {
      // A run that died half way leaves its bag behind, and the Bags card with it.
      await deleteBag(p, BAG)
      await startLists(p)
    },
    steps: [
      {
        // The weight field's placeholder really is a dash: it is the app's own
        // string, not prose, so it is matched exactly as rendered.
        target: p => item(p, BAG_ITEM).getByPlaceholder('—'),
        act: async p => {
          const field = item(p, BAG_ITEM).getByPlaceholder('—')
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
          await expect(bagPicker(p).getByRole('button', { name: 'Add bag' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => bagPicker(p).getByRole('button', { name: 'Add bag' }),
        act: async p => {
          await bagPicker(p).getByRole('button', { name: 'Add bag' }).click()
          const field = bagPicker(p).getByPlaceholder('Bag name...')
          await typeInto(p, field, BAG)
          await field.press('Enter')
          await expect(bagSidebar(p)).toBeVisible({ timeout: 30_000 })
          await expect(bagPicker(p)).toHaveCount(0)
          await settle(p)
        },
      },
      // The jacket is ticked in the seed, so Packed under Total weight already
      // carries its 620 g.
      only(bagSidebar),
      {
        target: p => bagSidebar(p).getByRole('button', { name: 'Set limit' }),
        act: async p => {
          await bagSidebar(p).getByRole('button', { name: 'Set limit' }).click()
          // Entered in kilograms, stored in grams.
          // The sidebar locator needs Set limit, which the open editor replaces: look page-wide.
          const field = p.locator('input[aria-label="Weight limit"]')
          await typeInto(p, field, '8')
          await field.press('Enter')
          await expect(p.getByText('/ 8.0 kg').first()).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        // The card's member picker is the dashed plus beside the bag's name; the
        // column's other plus, + Bags in its head, adds a bag.
        target: p => bagSidebar(p).locator('button[style*="dashed"]').first(),
        act: async p => {
          await bagSidebar(p).locator('button[style*="dashed"]').first().click()
          await bagMemberPicker(p).getByRole('button', { name: MEMBER }).click()
          // The picker closes on a click anywhere beside it.
          await p.mouse.click(20, VIEWPORT.height - 40)
          await expect(bagSidebar(p).getByRole('button', { name: MEMBER })).toBeVisible({ timeout: 20_000 })
          // A bag with someone on it fills Per person at the foot of the card.
          await expect(p.getByText('Per person', { exact: true })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await deleteBag(p, BAG)
      await resetPacking(p)
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
          // Out of the field, so its dark focus border does not read as a second ring.
          await modal(p).getByPlaceholder('Description (optional)').blur()
          await settle(p)
        },
        // The name is typed into the dialog's head band, where Task name stands.
        target: p => modal(p).getByPlaceholder('Task name'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'No list' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'No list' }).click()
          // The select's list is portalled to <body>, outside the dialog.
          await selectList(p, 'No list').getByRole('button', { name: TASK_LIST, exact: true }).click()
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
          await expect(datePicker(p)).toBeVisible()
          // The calendar opens on the picture day's month, the last of the trip,
          // and four days later can already be in the next one.
          if (!(await datePicker(p).getByRole('button', { name: DUE_DAY }).isVisible())) {
            await datePicker(p).getByRole('button', { name: 'Next month' }).click()
          }
          await expect(datePicker(p).getByRole('button', { name: DUE_DAY })).toBeVisible()
          await beat(p, 300)
        },
        target: datePicker,
        // The pointer on the day about to be picked, not on whatever the middle is.
        hover: async p => { await datePicker(p).getByRole('button', { name: DUE_DAY }).hover() },
        act: async p => {
          await datePicker(p).getByRole('button', { name: DUE_DAY }).click()
          await modal(p).getByRole('button', { name: 'Unassigned' }).click()
          await selectList(p, 'Unassigned').getByRole('button', { name: ASSIGNEE }).click()
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
          await expect(p.locator('div[role="button"][data-no-press]').first()).toContainText(PRIORITY_TASK, { timeout: 20_000 })
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
          await selectList(p, 'Unassigned').getByRole('button', { name: ASSIGNEE }).click()
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
  seedPacking = await snapshotPacking(request)
})

test('every registered lists guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripListsContext.guides].sort())
})

test('hero: trip-lists', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripListsContext.id, startLists)
})

for (const id of tripListsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
