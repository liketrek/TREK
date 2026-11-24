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
 * items (a template, a bag, a list's assignees, who brings or sees an item, a
 * task) is removed by the guide that made it.
 *
 * A packing row shows only what is set; a click on its name opens the item's
 * window, where every choice about the item lives. The list-wide actions sit
 * in the menu behind the three dots next to Add list.
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
/** Fully packed in the seed, so Hide packed hides its list. */
const PACKED_ITEM = 'Passport'
/** What the ordering guide moves: the third list onto the first, then the last item of that first list to its top. */
const MOVED_LIST = 'Electronics'
const FIRST_LIST = 'Documents'
const MOVED_ITEM = 'Credit card and some yen'
const TOP_ITEM = 'Passport'
/** A to Z puts this one first in Clothing, where the seed has it in the middle. */
const SORTED_LIST = 'Clothing'
const SORTED_FIRST = 'Light layers'
/** Packed in the seed; the counting guide unticks it and counts five pairs in. */
const PIECES_ITEM = 'Merino socks'
const PIECES = 5
/** The item whose window the editing guide walks through; it gets a second bringer. */
const EDIT_ITEM = 'Power bank'
/** The list the whole-list sharing guide hands to one person. */
const SHARE_LIST = 'Toiletries'
/** The count in the label moves with what is ticked, so it is matched, not spelled. */
const CLEAR_CHECKED = /^Remove \d+ checked$/

// ── Locators ─────────────────────────────────────────────────────────────────

/** A category card: the list's name is a span in the card's head band. */
const cat = (page: Page, name: string): Locator =>
  page.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[2]')
/**
 * The head band of a card. The ⋯ has to be taken from here: the card's rows
 * and its add field hold buttons of their own.
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
/** The name of a row is the button that opens the item's window. */
const itemName = (page: Page, name: string): Locator => item(page, name).locator('button[aria-haspopup="dialog"]')
/** The item's window, portalled to <body>; only one is ever open. */
const itemWindow = (page: Page): Locator => page.locator('div[role="dialog"].trek-menu-enter')
/** The short list a pill of the window opens under its line. */
const choiceList = (page: Page): Locator => itemWindow(page).locator('div.max-h-56')
/** A line of the window found by its label, for the pill on it. */
const windowLine = (page: Page, label: string): Locator =>
  itemWindow(page).getByText(label, { exact: true }).locator('xpath=..')
/** The two-column grid of list cards; its children are the cards, in order. */
const listGrid = (page: Page): Locator =>
  page.locator('div.grid').filter({ has: page.locator('.packing-item-row') }).first()
/** The only item of the list the first guide builds; its name changes mid-guide. */
const onlyRow = (page: Page): Locator => cat(page, NEW_LIST).locator('.packing-item-row').first()
/** The line beside Shared and My list that counts what is packed. */
const progressLine = (page: Page): Locator => page.getByText(/^\d+ of \d+ packed$/).first().locator('xpath=..')
/** The name dialog that Add list and Save as template open. */
const nameDialog = (page: Page, confirm: string): Locator => page.getByRole('button', { name: confirm, exact: true })
/** The three dots next to Add list, and the menu they open. */
const listsMenuButton = (page: Page): Locator =>
  page.getByRole('button', { name: 'Add list' }).locator('xpath=..').getByRole('button', { name: 'Show more' })
const listsMenu = (page: Page): Locator => page.getByRole('menu')
/** The bulk-import dialog, a DialogShell whose head band carries its title. */
const importCard = (page: Page): Locator =>
  page.getByRole('dialog').filter({ has: page.getByText('Import Packing List', { exact: true }) })
/** The whole-list sharing dialog, found by its footer button. */
const listSharing = (page: Page): Locator =>
  page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Apply to list' }) })
/** The member picker of a bag hangs off the body, so it is found by its caption. */
const bagMemberPicker = (page: Page): Locator => page.locator('.trek-menu-enter').filter({ hasText: 'Assign members' }).last()
/** The calendar a date field opens, a portal of its own. */
const datePicker = (page: Page): Locator => page.getByRole('dialog', { name: 'Date picker' })
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

/** The three dots next to Add list, opened. */
async function openListsMenu(page: Page): Promise<void> {
  await listsMenuButton(page).click()
  await expect(listsMenu(page)).toBeVisible()
  await beat(page, 300)
}

/**
 * The menu and the item window sit over a full-viewport catcher; a click in
 * the corner closes either without touching what is under it.
 */
async function clickAside(page: Page): Promise<void> {
  await page.mouse.click(20, VIEWPORT.height - 40)
}

/** Opens an item's window, with its row in the middle of the screen so the window has room below it. */
async function openItem(page: Page, name: string): Promise<void> {
  await item(page, name).evaluate(el => el.scrollIntoView({ block: 'center' }))
  await itemName(page, name).click()
  await expect(itemWindow(page)).toBeVisible()
  await settle(page)
}

async function closeItem(page: Page): Promise<void> {
  await itemWindow(page).getByRole('button', { name: 'Close', exact: true }).click()
  await expect(itemWindow(page)).toHaveCount(0)
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
  category: string | null
  is_private?: number | boolean
  contributors?: { user_id: number; username: string }[]
}

async function packingItems(page: Page): Promise<PackingRow[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/packing`)
  const body = (await res.json()) as { items?: PackingRow[] }
  return body.items ?? []
}

/** Puts items back into the group pool, the seed's tier for every item. */
async function shareWithEveryone(page: Page, rows: PackingRow[]): Promise<void> {
  const { tripId } = seededTrip()
  for (const row of rows) {
    await page.request.put(`/api/trips/${tripId}/packing/${row.id}/sharing`, { data: { visibility: 'common', recipient_ids: [] } })
  }
}

/** Takes a member off the people who bring an item. */
async function dropBringer(page: Page, itemName: string, username: string): Promise<void> {
  const { tripId } = seededTrip()
  const row = (await packingItems(page)).find(x => x.name === itemName)
  if (!row) return
  for (const c of (row.contributors ?? []).filter(x => x.username === username)) {
    await page.request.delete(`/api/trips/${tripId}/packing/${row.id}/contributors/${c.user_id}`)
  }
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
          // Enter fills the list's empty row rather than adding a second one,
          // and leaves the field open; Escape is how it closes.
          await field.press('Enter')
          await expect(item(p, FIRST_ITEM)).toBeVisible({ timeout: 20_000 })
          await field.press('Escape')
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await onlyRow(p).locator('button[aria-haspopup="dialog"]').click()
          await expect(itemWindow(p)).toBeVisible()
          await settle(p)
        },
        // The name at the top of the window is the field the text means.
        target: p => itemWindow(p).getByRole('textbox', { name: 'Rename' }),
        act: async p => {
          const field = itemWindow(p).getByRole('textbox', { name: 'Rename' })
          await typeInto(p, field, RENAMED_ITEM)
          await field.press('Enter')
          await expect(item(p, RENAMED_ITEM)).toBeVisible({ timeout: 20_000 })
          await closeItem(p)
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
        // Shown on the first list: the new one is the last card on the page, and
        // its menu would run past the bottom of the screen.
        prepare: async p => {
          await catHeader(p, FIRST_LIST).evaluate(el => el.scrollIntoView({ block: 'center' }))
          await catMenu(p, FIRST_LIST).click()
          await expect(p.getByRole('button', { name: 'Delete List' })).toBeVisible()
          await beat(p, 300)
        },
        target: catMenuCard,
        // The pointer rests on the three dots that opened it, not on an entry.
        // Moved by coordinates: the menu's click-catcher covers the button.
        hover: async p => {
          const b = await catMenu(p, FIRST_LIST).boundingBox()
          if (b) await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
        },
        act: async p => {
          // A click in the corner closes the menu without deleting the list the picture was just taken of.
          await clickAside(p)
          await expect(p.getByRole('button', { name: 'Delete List' })).toHaveCount(0)
          // Back to the new list for the after-picture.
          await cat(p, NEW_LIST).evaluate(el => el.scrollIntoView({ block: 'center' }))
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
  'edit-packing-item': {
    guide: guide('edit-packing-item'),
    start: async p => {
      await dropBringer(p, EDIT_ITEM, MEMBER)
      await startLists(p)
    },
    steps: [
      {
        target: p => itemName(p, EDIT_ITEM),
        act: p => openItem(p, EDIT_ITEM),
      },
      only(p => itemWindow(p).getByRole('textbox', { name: 'Rename' })),
      {
        prepare: async p => {
          await windowLine(p, 'List').getByRole('button').click()
          await expect(choiceList(p)).toBeVisible()
          await settle(p)
        },
        target: choiceList,
        // The pointer on another list, as if about to pick it.
        hover: async p => { await choiceList(p).getByRole('button', { name: FIRST_LIST, exact: true }).hover() },
        act: async p => {
          // Shown, not picked: the item would leave its row and the window with it.
          await windowLine(p, 'List').getByRole('button').click()
          await expect(choiceList(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await windowLine(p, 'Brought by').getByRole('button').click()
          await expect(choiceList(p)).toBeVisible()
          await settle(p)
        },
        target: choiceList,
        hover: async p => { await choiceList(p).getByRole('button', { name: MEMBER, exact: true }).hover() },
        act: async p => {
          await choiceList(p).getByRole('button', { name: MEMBER, exact: true }).click()
          await expect(windowLine(p, 'Brought by')).toContainText(MEMBER, { timeout: 20_000 })
          await windowLine(p, 'Brought by').getByRole('button').click()
          await expect(choiceList(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        target: p => itemWindow(p).getByRole('button', { name: 'Delete', exact: true }),
        // Shown, not pressed: the window closes with its cross.
        act: closeItem,
      },
    ],
    cleanup: async p => {
      await dropBringer(p, EDIT_ITEM, MEMBER)
      await resetPacking(p)
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
        prepare: openListsMenu,
        target: p => listsMenu(p).getByRole('button', { name: 'A to Z' }),
        act: async p => {
          await listsMenu(p).getByRole('button', { name: 'A to Z' }).click()
          // The order is a switch with a tick; the menu stays open for the next one.
          await clickAside(p)
          await expect(listsMenu(p)).toHaveCount(0)
          await expect(cat(p, SORTED_LIST).locator('.packing-item-row').first()).toContainText(SORTED_FIRST, { timeout: 20_000 })
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
        target: p => item(p, OPEN_ITEM).locator('.packing-check'),
        act: async p => {
          await item(p, OPEN_ITEM).locator('.packing-check').click()
          await expect(item(p, OPEN_ITEM).locator('.packing-check')).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      only(progressLine),
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
        prepare: openListsMenu,
        target: p => listsMenu(p).getByRole('button', { name: 'Hide packed' }),
        act: async p => {
          await listsMenu(p).getByRole('button', { name: 'Hide packed' }).click()
          await clickAside(p)
          await expect(listsMenu(p)).toHaveCount(0)
          await expect(item(p, PACKED_ITEM)).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: openListsMenu,
        target: p => listsMenu(p).getByRole('button', { name: CLEAR_CHECKED }),
        act: async p => {
          // A native window.confirm, which cannot be pictured. The step shows the
          // entry and answers the browser with Cancel: with the packed items
          // hidden, the screen looks the same either way, and the seed's ticked
          // items (most of the list) stay where they are for the guides after this one.
          p.once('dialog', d => { void d.dismiss() })
          await listsMenu(p).getByRole('button', { name: CLEAR_CHECKED }).click()
          await expect(listsMenu(p)).toHaveCount(0)
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
        target: p => itemName(p, PIECES_ITEM),
        act: p => openItem(p, PIECES_ITEM),
      },
      {
        target: p => itemWindow(p).getByRole('group', { name: 'Qty' }),
        act: async p => {
          const field = itemWindow(p).getByRole('group', { name: 'Qty' }).locator('input')
          await typeInto(p, field, String(PIECES))
          await field.press('Enter')
          await expect(itemWindow(p).getByRole('group', { name: `0 of ${PIECES} packed` })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => itemWindow(p).getByRole('group', { name: / of \d+ packed$/ }),
        act: async p => {
          for (let n = 1; n <= 3; n++) {
            await itemWindow(p).getByRole('button', { name: 'Pack one more' }).click()
            await expect(itemWindow(p).getByRole('group', { name: `${n} of ${PIECES} packed` })).toBeVisible({ timeout: 20_000 })
          }
          await settle(p)
        },
      },
      {
        // Partly packed: the count in the row, the tick box outlined in the accent.
        prepare: closeItem,
        target: p => item(p, PIECES_ITEM),
      },
    ],
    cleanup: resetPacking,
  },
  'apply-packing-template': {
    guide: guide('apply-packing-template'),
    start: startLists,
    steps: [
      {
        target: listsMenuButton,
        act: async p => {
          await openListsMenu(p)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await listsMenu(p).getByRole('button', { name: 'Apply template' }).click()
          await expect(listsMenu(p).getByRole('button', { name: new RegExp(`^${TEMPLATE.name}`) })).toBeVisible()
          await settle(p)
        },
        target: p => listsMenu(p).getByRole('button', { name: new RegExp(`^${TEMPLATE.name}`) }),
        act: async p => {
          await listsMenu(p).getByRole('button', { name: new RegExp(`^${TEMPLATE.name}`) }).click()
          await expect(cat(p, TEMPLATE.category)).toBeVisible({ timeout: 30_000 })
          await expect(listsMenu(p)).toHaveCount(0)
          await settle(p)
        },
      },
      only(p => p.getByRole('button', { name: /^Shared/ })),
      {
        prepare: openListsMenu,
        target: p => listsMenu(p).getByRole('button', { name: 'Save as template' }),
        act: async p => {
          await listsMenu(p).getByRole('button', { name: 'Save as template' }).click()
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
        prepare: openListsMenu,
        target: p => listsMenu(p).getByRole('button', { name: 'Import', exact: true }),
        act: async p => {
          await listsMenu(p).getByRole('button', { name: 'Import', exact: true }).click()
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
        target: listsMenuButton,
        act: async p => {
          await openListsMenu(p)
          await settle(p)
        },
      },
      // The two file entries download at once; the step shows them, it does not press them.
      {
        target: listsMenu,
        hover: async p => { await listsMenu(p).getByRole('button', { name: 'CSV for import (.csv)' }).hover() },
      },
      {
        target: p => listsMenu(p).getByRole('button', { name: 'Print or save as PDF' }),
        act: async p => {
          await listsMenu(p).getByRole('button', { name: 'Print or save as PDF' }).click()
          await expect(printFrame(p).locator('h1')).toBeVisible({ timeout: 15_000 })
          // The page carries the app's own Poppins; the result picture waits for it.
          await printFrame(p).locator('body').evaluate(async () => { await document.fonts.ready })
          await settle(p)
        },
      },
      // Pressing it opens the operating system's print dialog, which is not part
      // of the picture; the button is shown, not pressed. The result picture is the
      // preview itself.
      only(p => p.getByRole('button', { name: 'Print or save as PDF' }).last()),
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
        prepare: p => openItem(p, SHARED_ITEM),
        // The whole line: its label and the three choices.
        target: p => itemWindow(p).getByRole('radiogroup', { name: 'Visible to' }).locator('xpath=../..'),
      },
      {
        target: p => itemWindow(p).getByRole('radio', { name: 'Only me' }),
        act: async p => {
          await itemWindow(p).getByRole('radio', { name: 'Only me' }).click()
          // The row leaves the shared list, and its window goes with it.
          await expect(item(p, SHARED_ITEM)).toHaveCount(0, { timeout: 20_000 })
          await expect(itemWindow(p)).toHaveCount(0)
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
          await openItem(p, SHARED_ITEM)
          await itemWindow(p).getByRole('radio', { name: 'Selected' }).click()
          await expect(choiceList(p)).toBeVisible()
          await settle(p)
        },
        target: choiceList,
        hover: async p => { await choiceList(p).getByRole('button', { name: MEMBER, exact: true }).hover() },
        act: async p => {
          await choiceList(p).getByRole('button', { name: MEMBER, exact: true }).click()
          await expect(item(p, SHARED_ITEM).getByLabel('shared with 1')).toBeVisible({ timeout: 20_000 })
          await closeItem(p)
        },
      },
    ],
    cleanup: async p => {
      await shareWithEveryone(p, (await packingItems(p)).filter(x => x.name === SHARED_ITEM))
      await resetPacking(p)
    },
  },
  'share-packing-list': {
    guide: guide('share-packing-list'),
    start: async p => {
      await shareWithEveryone(p, (await packingItems(p)).filter(x => x.category === SHARE_LIST))
      await startLists(p)
    },
    steps: [
      {
        prepare: async p => {
          await catMenu(p, SHARE_LIST).click()
          await expect(p.getByRole('button', { name: 'Sharing for Whole List' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => p.getByRole('button', { name: 'Sharing for Whole List' }),
        act: async p => {
          await p.getByRole('button', { name: 'Sharing for Whole List' }).click()
          await expect(listSharing(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // The box of the three tiers; the list starts on Shared, where the seed has it.
        target: p => listSharing(p).getByRole('button', { name: /^Shared with/ }).locator('xpath=..'),
        hover: async p => { await listSharing(p).getByRole('button', { name: /^Shared with/ }).hover() },
        act: async p => {
          await listSharing(p).getByRole('button', { name: /^Shared with/ }).click()
          await expect(listSharing(p).getByRole('button', { name: MEMBER, exact: true })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => listSharing(p).getByRole('button', { name: MEMBER, exact: true }),
        act: async p => {
          await listSharing(p).getByRole('button', { name: MEMBER, exact: true }).click()
          await expect(listSharing(p).getByRole('button', { name: MEMBER, exact: true })).toHaveAttribute('aria-pressed', 'true')
          await settle(p)
        },
      },
      {
        target: p => listSharing(p).getByRole('button', { name: 'Apply to list' }),
        act: async p => {
          await listSharing(p).getByRole('button', { name: 'Apply to list' }).click()
          await expect(listSharing(p)).toHaveCount(0, { timeout: 30_000 })
          // The confirmation is a toast; the after-picture waits for it to go.
          const done = p.getByText(`Sharing changed for "${SHARE_LIST}"`)
          await expect(done).toBeVisible({ timeout: 20_000 })
          await p.getByRole('button', { name: /^My list/ }).click()
          await expect(cat(p, SHARE_LIST)).toBeVisible({ timeout: 20_000 })
          await expect(done).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await shareWithEveryone(p, (await packingItems(p)).filter(x => x.category === SHARE_LIST))
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
        prepare: p => openItem(p, BAG_ITEM),
        // The weight field's placeholder really is a dash: it is the app's own
        // string, not prose, so it is matched exactly as rendered. The ring takes
        // the whole pill, the grams with it.
        target: p => itemWindow(p).getByPlaceholder('—').locator('xpath=..'),
        act: async p => {
          const field = itemWindow(p).getByPlaceholder('—')
          await typeInto(p, field, '620')
          await field.press('Enter')
          await expect(field).toHaveValue('620', { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => windowLine(p, 'Bag').getByRole('button'),
        act: async p => {
          await windowLine(p, 'Bag').getByRole('button').click()
          await expect(itemWindow(p).getByPlaceholder('Add bag')).toBeVisible()
          await settle(p)
        },
      },
      {
        // The line at the end of the bag list, with its round add button.
        target: p => itemWindow(p).getByPlaceholder('Add bag').locator('xpath=..'),
        act: async p => {
          const field = itemWindow(p).getByPlaceholder('Add bag')
          await typeInto(p, field, BAG)
          await field.press('Enter')
          await expect(windowLine(p, 'Bag')).toContainText(BAG, { timeout: 30_000 })
          // The window repeats Total weight and the bag's name, so it goes before the card is looked for.
          await closeItem(p)
          await expect(bagSidebar(p)).toBeVisible({ timeout: 30_000 })
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
          await clickAside(p)
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
