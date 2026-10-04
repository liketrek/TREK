import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { day, long, short } from '../dates'
import { seededTrip, ensureCostsFixtures } from './fixtures'
import { openTrip, modal } from './trip-shared'
import { tripCostsContext, tripCostsGuides } from '../../src/help/contexts/tripCosts'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Costs tab of a trip, keyed by the ids in
 * `src/help/contexts/tripCosts.ts`. They run on the seeded "Autumn in Japan",
 * which keeps its books in JPY with one expense in EUR and one transfer already
 * recorded, so the frozen rate and the settle-up column both have something
 * real to show. What a guide writes it takes away again in `cleanup`, the
 * settlements included, because the next guide reads the same balances.
 */

const guide = (id: string): HelpGuide => {
  const g = tripCostsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** The expense nobody has paid for; `ensureCostsFixtures` puts it there once, for every guide. */
const UNPAID = 'Airport transfer (Narita Express)'
/** The seeded expense in euros, the one carrying a frozen rate. */
const SEEDED_EUR = 'Flights FRA → HND'
/** The seeded flight booking, on the Transports tab because its type is flight. */
const BOOKING = 'LH716 FRA → HND'
/** A seeded expense costs-table gives its days to. */
const JR_PASS = 'JR Pass (14 days)'
const DINNER = 'Kaiseki dinner in Gion'
const UPGRADE = 'Shinkansen seat upgrade'
const LUNCH = { name: 'Nishiki Market lunch', category: 'food', total_price: 4800, currency: 'JPY', expense_date: day(-4) }
/** The row costs-table adds to Food & drink; the table names a new row this until it is renamed. */
const MATCHA = 'Matcha in Uji'
const NEW_ROW = 'New Entry'
/** Where the tab keeps the list/table choice (CostsPanel's COSTS_VIEW_KEY). */
const VIEW_KEY = 'trek:costs-view'

/** The Costs tab, waited out: its panel is lazy and its figures come from the server. */
const openCosts = async (p: Page): Promise<void> => {
  await openTrip(p, { tab: 'finanzplan' })
  await expect(p.getByRole('button', { name: 'Add expense' }).first()).toBeVisible({ timeout: 30_000 })
  await expect(p.locator('.exp-row').first()).toBeVisible({ timeout: 30_000 })
  await settle(p)
}

/** A row of the ledger by the expense's name. */
const expRow = (page: Page, name: string) => page.locator('.exp-row').filter({ hasText: name }).first()
/**
 * The pencil/bin pill beside a row. It is a sibling of `.exp-row`, not a child,
 * so a locator scoped to the row itself would never find it.
 */
const rowActions = (page: Page, name: string) => expRow(page, name).locator('xpath=..').locator('.exp-actions')
/**
 * The transfer settle-up records for jonas, in the display currency. The seed
 * already holds one from jonas, in euros, which carries the converted line;
 * leaving that one out keeps the guide off the seed's own payment.
 */
const newPayRow = (page: Page) =>
  page.locator('.exp-row').filter({ hasText: 'Payment' }).filter({ hasText: 'jonas' }).filter({ hasNotText: '€' }).first()
/**
 * A block of the expense editor, found by its own label: the <section> of
 * Who paid? and Split, the grey group that holds Total amount, Currency and Day.
 */
const block = (page: Page, label: string) =>
  modal(page)
    .getByText(label, { exact: true })
    .first()
    .locator('xpath=ancestor::*[self::section or contains(@class,"rounded-[16px]")][1]')
/** A card of the right-hand column: each is a <section> named by its heading. */
const card = (page: Page, name: string) => page.getByRole('region', { name, exact: true })
/** CustomSelect drops its list into a fixed portal on the body, outside the modal. */
const dropdown = (page: Page) => page.locator('div[style*="z-index: 99999"]').last()

const amounts = (page: Page) => modal(page).locator('input[inputmode="decimal"]')
/** The name, typed into the head of the expense editor. */
const nameBox = (page: Page) => modal(page).getByPlaceholder('e.g. Dinner, souvenirs, gas…')
/** The category pill under the name, and the list it opens (a portal named after it). */
const categoryPill = (page: Page) => modal(page).getByRole('button', { name: /^Category:/ })
const categoryList = (page: Page) => page.getByRole('group', { name: 'Category', exact: true })
/** The bar's button; the editor's own save carries the same words, so it is scoped to the modal. */
const addExpense = (page: Page) => page.getByRole('button', { name: 'Add expense' }).first()
const saveExpense = (page: Page) => modal(page).getByRole('button', { name: 'Add expense' })
const settleButtons = (page: Page) => card(page, 'Settle up').getByRole('button', { name: 'Settle', exact: true })
/**
 * One suggested transfer in the Settle up card, by the initial on its first
 * avatar ("J" for jonas; the names are only in the tooltip). The card lists the
 * flows in whatever order the settlement endpoint returns them, so taking the
 * first Settle button would settle whichever transfer happened to come first.
 */
const settleRow = (page: Page, initial: string) =>
  card(page, 'Settle up').locator(`xpath=.//div[span[1][normalize-space(.)="${initial}"]]/..`)

// ── The bar's filters ────────────────────────────────────────────────────────
const searchBox = (page: Page) => page.getByPlaceholder('Search expenses…')
const filterButton = (page: Page) => page.getByRole('button', { name: 'Filter', exact: true })
/** The popover the funnel opens: the owner switch, the categories and the days. */
const filterMenu = (page: Page) => page.getByRole('menu')
async function openFilter(page: Page): Promise<void> {
  if (!(await filterMenu(page).isVisible().catch(() => false))) await filterButton(page).click()
  await expect(filterMenu(page)).toBeVisible()
  await beat(page, 300)
}
async function closeFilter(page: Page): Promise<void> {
  if (await filterMenu(page).isVisible().catch(() => false)) await filterButton(page).click()
  await expect(filterMenu(page)).toHaveCount(0)
}

// ── The table view ───────────────────────────────────────────────────────────
const table = (page: Page) => page.getByRole('table')
/** A category's group of the table: a <tbody> opened by a button with its name and count. */
const group = (page: Page, category: string) =>
  table(page)
    .locator('tbody')
    .filter({ has: page.getByRole('button', { name: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\d+$`) }) })
const tableRow = (page: Page, name: string) => table(page).getByRole('row').filter({ hasText: name }).first()
const summary = (page: Page) => page.getByRole('region', { name: 'Summary', exact: true })

const only = (target: (p: Page) => Locator) => ({ target })

/**
 * A dialog that closes hands the focus back to the button that opened it, and
 * a focused button wears its outline and its tooltip, the tooltip at wherever
 * the button stood before the next picture scrolled: both would stand in that
 * picture as if they were part of it.
 */
const dropFocus = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
    await dropFocus(page)
  }
}

type BudgetRow = { id: number; name: string; days?: number | null }

/** What the JR Pass's Days held before costs-table typed into it; cleanup puts it back. */
let passDaysBefore: number | null = null

async function budgetItems(page: Page): Promise<BudgetRow[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/budget`)
  return ((await res.json()) as { items: BudgetRow[] }).items
}

async function deleteExpenses(page: Page, ...names: string[]): Promise<void> {
  const { tripId } = seededTrip()
  for (const item of (await budgetItems(page)).filter(i => names.includes(i.name))) {
    await page.request.delete(`/api/trips/${tripId}/budget/${item.id}`)
  }
}

async function createExpense(
  page: Page,
  item: { name: string; category: string; total_price: number; currency: string; expense_date: string },
): Promise<void> {
  const { tripId, memberIds } = seededTrip()
  const created = await page.request.post(`/api/trips/${tripId}/budget`, {
    data: { ...item, payers: [{ user_id: 1, amount: item.total_price }], member_ids: [1, ...memberIds] },
  })
  if (!created.ok()) throw new Error(`could not create "${item.name}": ${created.status()} ${await created.text()}`)
}

async function settlementIds(page: Page): Promise<number[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/budget/settlements`)
  const { settlements } = (await res.json()) as { settlements: { id: number }[] }
  return settlements.map(s => s.id)
}

/** The transfers that were there before the settle-up guide ran; everything else it made, it deletes. */
let transfersBefore: number[] = []

/** Open the expense editor's currency list, search for a code and take it. */
async function pickCurrency(page: Page, code: string): Promise<void> {
  await modal(page).getByRole('button', { name: /^JPY/ }).first().click()
  await beat(page, 300)
  await dropdown(page).locator('input').first().fill(code)
  await dropdown(page).getByRole('button', { name: new RegExp(`^${code}`) }).click()
  await expect(modal(page).getByRole('button', { name: new RegExp(`^${code}`) }).first()).toBeVisible()
  await settle(page)
}

const SCRIPTS: Record<string, GuideScript> = {
  'add-expense': {
    guide: guide('add-expense'),
    start: openCosts,
    steps: [
      {
        target: addExpense,
        act: async p => {
          await addExpense(p).click()
          await expect(nameBox(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, nameBox(p), DINNER)
          await settle(p)
        },
        target: nameBox,
      },
      {
        // The list open under the pill, so the picture shows what there is to pick.
        prepare: async p => {
          await categoryPill(p).click()
          await expect(categoryList(p)).toBeVisible()
          await beat(p, 300)
        },
        target: categoryPill,
        act: async p => {
          await categoryList(p).getByRole('button', { name: 'Food & drink' }).click()
          await expect(categoryList(p)).toHaveCount(0)
          await expect(categoryPill(p)).toHaveAccessibleName(/Food & drink/)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await amounts(p).first().fill('18600')
          await expect(saveExpense(p)).toBeEnabled()
          await settle(p)
        },
        // The grey group: Total amount, then Currency and Day beside it.
        target: p => block(p, 'Total amount'),
      },
      only(p => block(p, 'Who paid?')),
      {
        target: saveExpense,
        act: async p => {
          await saveExpense(p).click()
          await expect(modal(p)).toHaveCount(0)
          await dropFocus(p)
          await expect(expRow(p, DINNER)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteExpenses(p, DINNER),
  },

  'expense-payers': {
    guide: guide('expense-payers'),
    start: openCosts,
    steps: [
      {
        prepare: async p => {
          await rowActions(p, 'Ryokan in Hakone').getByRole('button', { name: 'Edit' }).click()
          await expect(block(p, 'Who paid?')).toBeVisible()
          await settle(p)
        },
        target: p => block(p, 'Who paid?'),
      },
      // Ringed, not clicked: the Ryokan keeps its payer.
      only(p => modal(p).getByRole('radio', { name: 'No one paid yet' })),
      {
        prepare: async p => {
          await block(p, 'Who paid?').getByRole('button', { name: 'Multiple people paid' }).click()
          await expect(modal(p).getByTestId('payer-toggle')).toHaveCount(3)
          await modal(p).getByTestId('payer-toggle').nth(1).click()
          await expect(modal(p).getByTestId('payer-amount')).toHaveCount(2)
          await settle(p)
        },
        target: p => block(p, 'Who paid?'),
        act: async p => {
          await block(p, 'Who paid?').getByRole('button', { name: 'One person paid' }).click()
          await closeModal(p)
          await settle(p)
        },
      },
      {
        target: p => expRow(p, UNPAID),
        // On the flag, whose tooltip says what it means; the row's centre is the note.
        hover: async p => {
          await expRow(p, UNPAID).getByText('Unfinished').hover()
        },
        act: async p => {
          await expect(expRow(p, UNPAID).getByText('Unfinished')).toBeVisible()
        },
      },
    ],
  },

  'split-expense': {
    guide: guide('split-expense'),
    start: async p => {
      await createExpense(p, LUNCH)
      await openCosts(p)
    },
    steps: [
      {
        prepare: async p => {
          await rowActions(p, LUNCH.name).getByRole('button', { name: 'Edit' }).click()
          await expect(block(p, 'Split')).toBeVisible()
          await block(p, 'Split').getByRole('checkbox', { name: 'jonas', exact: true }).click()
          await expect(block(p, 'Split').getByRole('checkbox', { name: 'jonas', exact: true })).toHaveAttribute('aria-checked', 'false')
          await settle(p)
        },
        target: p => block(p, 'Split'),
        act: async p => {
          await block(p, 'Split').getByRole('checkbox', { name: 'jonas', exact: true }).click()
          await expect(block(p, 'Split').getByRole('checkbox', { name: 'jonas', exact: true })).toHaveAttribute('aria-checked', 'true')
          await settle(p)
        },
      },
      // The badges under the list: how many share it, and what one share is.
      only(p => block(p, 'Split').getByText(/ per person$/).locator('xpath=..')),
      {
        prepare: async p => {
          await block(p, 'Split').getByRole('button', { name: 'Custom', exact: true }).click()
          await block(p, 'Split').locator('input[inputmode="decimal"]').nth(0).fill('1000')
          await expect(block(p, 'Split').getByText(/^Sum of splits: /)).toBeVisible()
          await settle(p)
        },
        target: p => block(p, 'Split').getByText(/^Sum of splits: /),
        act: async p => {
          await block(p, 'Split').locator('input[inputmode="decimal"]').nth(1).fill('1900')
          await block(p, 'Split').locator('input[inputmode="decimal"]').nth(2).fill('1900')
          await expect(block(p, 'Split').getByText('Split matches total')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          const split = block(p, 'Split')
          await split.getByRole('button', { name: 'Ticket', exact: true }).click()
          await split.getByRole('button', { name: 'Add item' }).click()
          await typeInto(p, split.getByPlaceholder('Item name').first(), 'Tamagoyaki')
          await split.locator('input[inputmode="decimal"]').nth(0).fill('1200')
          await split.getByRole('button', { name: 'Add item' }).click()
          await typeInto(p, split.getByPlaceholder('Item name').nth(1), 'Soy milk donuts')
          await split.locator('input[inputmode="decimal"]').nth(1).fill('900')
          // The second line is shared by two of the three travelers.
          await split
            .getByPlaceholder('Item name')
            .nth(1)
            .locator('xpath=ancestor::div[2]')
            .getByRole('checkbox', { name: /jonas/ })
            .click()
          await expect(amounts(p).first()).toHaveValue('2100.00')
          await settle(p)
        },
        target: p => block(p, 'Split').getByPlaceholder('Item name').first().locator('xpath=ancestor::div[2]'),
      },
      {
        target: p => modal(p).getByText('Individual shares', { exact: true }).locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await dropFocus(p)
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteExpenses(p, LUNCH.name),
  },

  'expense-currency': {
    guide: guide('expense-currency'),
    start: openCosts,
    steps: [
      {
        prepare: async p => {
          await addExpense(p).click()
          await expect(nameBox(p)).toBeVisible()
          await typeInto(p, nameBox(p), UPGRADE)
          await amounts(p).first().fill('48')
          // The editor opens on Food & drink; a seat upgrade filed under it would
          // read wrong on the ledger row this guide's last picture is of.
          await categoryPill(p).click()
          await categoryList(p).getByRole('button', { name: 'Transport', exact: true }).click()
          await expect(categoryPill(p)).toHaveAccessibleName(/Transport/)
          await settle(p)
        },
        target: p => block(p, 'Total amount'),
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: /^JPY/ }).first().click()
          await beat(p, 300)
          await dropdown(p).locator('input').first().fill('EUR')
          await expect(dropdown(p).getByRole('button', { name: /^EUR/ })).toBeVisible()
        },
        target: p => modal(p).getByRole('button', { name: /^JPY/ }).first(),
        act: async p => {
          await dropdown(p).getByRole('button', { name: /^EUR/ }).click()
          await expect(modal(p).getByRole('button', { name: /^EUR/ }).first()).toBeVisible()
          await expect(modal(p).getByText('live rate')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByText('live rate').locator('xpath=ancestor::div[1]'),
        act: async p => {
          // Both sides have to be there: an offline run would show the amount unconverted.
          await expect(modal(p).getByText('live rate').locator('xpath=ancestor::div[1]')).toHaveText(/€[\s\S]*[¥￥]/)
        },
      },
      {
        target: saveExpense,
        act: async p => {
          await saveExpense(p).click()
          await expect(modal(p)).toHaveCount(0)
          await dropFocus(p)
          await expect(expRow(p, UPGRADE)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => expRow(p, UPGRADE),
        act: async p => {
          await expect(expRow(p, UPGRADE)).toHaveText(/€[\s\S]*→[\s\S]*[¥￥]/)
          await expect(expRow(p, SEEDED_EUR)).toHaveText(/€[\s\S]*→[\s\S]*[¥￥]/)
        },
      },
    ],
    cleanup: p => deleteExpenses(p, UPGRADE),
  },

  'filter-costs': {
    guide: guide('filter-costs'),
    start: openCosts,
    steps: [
      {
        prepare: async p => {
          await typeInto(p, searchBox(p), 'pass')
          await expect(expRow(p, 'JR Pass (14 days)')).toBeVisible()
          await expect(expRow(p, 'Ryokan in Hakone')).toHaveCount(0)
          await settle(p)
        },
        target: p => searchBox(p).locator('xpath=..'),
        act: async p => {
          await searchBox(p).fill('')
          await expect(expRow(p, 'Ryokan in Hakone')).toBeVisible()
          await settle(p)
        },
      },
      {
        // The owner switch at the top of the popover, on Paid by me.
        prepare: async p => {
          await openFilter(p)
          await filterMenu(p).getByRole('button', { name: 'Paid by me', exact: true }).click()
          await expect(filterMenu(p).getByRole('button', { name: 'Paid by me', exact: true })).toHaveAttribute('aria-pressed', 'true')
          await settle(p)
        },
        target: p => filterMenu(p).getByRole('button', { name: 'Paid by me', exact: true }).locator('xpath=..'),
        act: async p => {
          await filterMenu(p).getByRole('button', { name: 'All', exact: true }).click()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await openFilter(p)
          await filterMenu(p).getByRole('button', { name: 'Transport', exact: true }).click()
          await expect(expRow(p, 'Ryokan in Hakone')).toHaveCount(0)
          await expect(expRow(p, 'JR Pass (14 days)')).toBeVisible()
          await settle(p)
        },
        // The category list, with the pick marked and the funnel's count above it.
        target: p => filterMenu(p).getByRole('button', { name: 'All categories', exact: true }).locator('xpath=..'),
        act: async p => {
          await filterMenu(p).getByRole('button', { name: 'All categories', exact: true }).click()
          await expect(expRow(p, 'Ryokan in Hakone')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await openFilter(p)
          await filterMenu(p).getByRole('button', { name: short(-9), exact: true }).click()
          // Folded away, or the popover would sit over the banner it produced.
          await closeFilter(p)
          await expect(p.getByText(new RegExp(`^${long(-9)}$`))).toBeVisible()
          await settle(p)
        },
        target: p => p.getByText(new RegExp(`^${long(-9)}$`)).locator('xpath=../..'),
        act: async p => {
          await openFilter(p)
          await filterMenu(p).getByRole('button', { name: 'Reset filters' }).click()
          await expect(p.getByText(new RegExp(`^${long(-9)}$`))).toHaveCount(0)
          await closeFilter(p)
          await settle(p)
        },
      },
      // Clicking it would start a download; the button is what the step is about.
      only(p => p.getByRole('button', { name: 'Export CSV' })),
    ],
  },

  'settle-up': {
    guide: guide('settle-up'),
    start: async p => {
      await openCosts(p)
      transfersBefore = await settlementIds(p)
    },
    steps: [
      only(p => card(p, 'Settle up')),
      {
        target: p => settleRow(p, 'J').getByRole('button', { name: 'Settle', exact: true }),
        act: async p => {
          await settleRow(p, 'J').getByRole('button', { name: 'Settle', exact: true }).click()
          await expect(settleButtons(p)).toHaveCount(1, { timeout: 15_000 })
          await expect(newPayRow(p)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(newPayRow),
      {
        target: p => newPayRow(p).locator('xpath=..').locator('.exp-actions'),
        act: async p => {
          await newPayRow(p).locator('xpath=..').getByRole('button', { name: 'Undo' }).click()
          await expect(settleButtons(p)).toHaveCount(2, { timeout: 15_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await card(p, 'Settle up').getByRole('button', { name: 'Add payment' }).click()
          await expect(p.getByRole('dialog', { name: 'Add payment' })).toBeVisible()
          await modal(p).locator('input[inputmode="decimal"]').first().fill('5000')
          await settle(p)
        },
        target: p => p.getByRole('dialog', { name: 'Add payment' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add payment' }).click()
          await expect(modal(p)).toHaveCount(0)
          await dropFocus(p)
          await settle(p)
        },
      },
      // Ringed and left alone: one click would record every open transfer and
      // flatten the balances every later picture is taken against.
      only(p => p.getByRole('button', { name: 'Settle up', exact: true })),
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      for (const id of await settlementIds(p)) {
        if (!transfersBefore.includes(id)) await p.request.delete(`/api/trips/${tripId}/budget/settlements/${id}`)
      }
    },
  },

  'final-budget': {
    guide: guide('final-budget'),
    start: openCosts,
    steps: [
      only(p => card(p, 'Balances')),
      only(p => card(p, 'Final budget')),
      {
        prepare: async p => {
          await card(p, 'Final budget').getByRole('button').first().click()
          await expect(p.getByText('Expenses paid').first()).toBeVisible()
          await settle(p)
        },
        target: p => card(p, 'Final budget').locator('[aria-expanded="true"]').locator('xpath=following-sibling::div[1]'),
      },
      {
        // The second "Expenses paid" is the heading of the list the figure is made of.
        target: p => p.getByText('Expenses paid').nth(1).locator('xpath=..'),
        act: async p => {
          await card(p, 'Final budget').getByRole('button').first().click()
          await expect(card(p, 'Final budget').locator('[aria-expanded="true"]')).toHaveCount(0)
        },
      },
    ],
  },

  'expense-from-booking': {
    guide: guide('expense-from-booking'),
    start: async p => {
      await openTrip(p, { tab: 'transports' })
      await expect(p.getByRole('article', { name: BOOKING }).first()).toBeVisible({ timeout: 30_000 })
      await settle(p)
    },
    steps: [
      {
        target: p => p.getByRole('article', { name: BOOKING }).first().getByRole('button', { name: 'Edit', exact: true }),
        act: async p => {
          await p.getByRole('article', { name: BOOKING }).first().getByRole('button', { name: 'Edit', exact: true }).click()
          await expect(modal(p).getByText('Saves the booking, then opens the Costs editor.')).toBeVisible()
          await settle(p)
        },
      },
      only(p => modal(p).getByText('Saves the booking, then opens the Costs editor.').locator('xpath=..')),
      {
        target: p => modal(p).getByRole('button', { name: 'Create expense' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create expense' }).click()
          await expect(nameBox(p)).toHaveValue(BOOKING, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await amounts(p).first().fill('890')
          await pickCurrency(p, 'EUR')
        },
        target: saveExpense,
        act: async p => {
          await saveExpense(p).click()
          await expect(modal(p)).toHaveCount(0)
          await p.getByRole('article', { name: BOOKING }).first().getByRole('button', { name: 'Edit', exact: true }).click()
          await expect(modal(p).getByText('Linked expenses', { exact: true })).toBeVisible({ timeout: 20_000 })
          // The block sits at the foot of a long form: bring it into the picture.
          await modal(p).getByText('Linked expenses', { exact: true }).evaluate(el => el.scrollIntoView({ block: 'center' }))
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await closeModal(p)
      await deleteExpenses(p, BOOKING)
    },
  },

  'costs-table': {
    guide: guide('costs-table'),
    start: async p => {
      // What the pass's Days cell holds before the guide types into it.
      const pass = (await budgetItems(p)).find(i => i.name === JR_PASS)
      if (!pass) throw new Error(`the seed has no "${JR_PASS}"`)
      passDaysBefore = pass.days ?? null
      await openCosts(p)
    },
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Table', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Table', exact: true }).click()
          await expect(table(p)).toBeVisible({ timeout: 15_000 })
          await expect(tableRow(p, SEEDED_EUR)).toBeVisible()
          await settle(p)
        },
      },
      // One category as a whole: its head with the count and the subtotal, its rows, its add button.
      only(p => group(p, 'Transport')),
      {
        // The pass is good for fourteen days, and its Days cell is still empty:
        // typed in, Per Day and P. p / Day fill in beside it.
        prepare: async p => {
          await tableRow(p, JR_PASS).getByRole('button', { name: /^Days/ }).click()
          const field = tableRow(p, JR_PASS).getByRole('textbox', { name: 'Days' })
          await expect(field).toBeFocused()
          await field.fill('14')
          await settle(p)
        },
        target: p => tableRow(p, JR_PASS).getByRole('textbox', { name: 'Days' }),
        act: async p => {
          await tableRow(p, JR_PASS).getByRole('textbox', { name: 'Days' }).press('Enter')
          await expect(tableRow(p, JR_PASS).getByRole('button', { name: 'Days: 14' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // Hovered for the picture, so the lock's reason stands above it.
        target: p => tableRow(p, SEEDED_EUR).getByRole('button', { name: /^Total: / }),
        act: async p => {
          await tableRow(p, SEEDED_EUR).getByRole('button', { name: /^Total: / }).click()
          await expect(p.getByRole('dialog', { name: 'Edit expense' })).toBeVisible()
          await closeModal(p)
          await settle(p)
        },
      },
      {
        target: p => group(p, 'Food & drink').getByRole('button', { name: 'Add expense' }),
        act: async p => {
          await group(p, 'Food & drink').getByRole('button', { name: 'Add expense' }).click()
          const name = table(p).getByRole('textbox', { name: 'Name' })
          await expect(name.or(tableRow(p, NEW_ROW)).first()).toBeVisible({ timeout: 15_000 })
          if (!(await name.isVisible().catch(() => false))) {
            await tableRow(p, NEW_ROW).getByRole('button', { name: /^Name/ }).click()
          }
          await name.fill(MATCHA)
          await name.press('Enter')
          await expect(tableRow(p, MATCHA)).toBeVisible({ timeout: 15_000 })
          // A total too, the same way, so the row reads like a real one.
          await tableRow(p, MATCHA).getByRole('button', { name: /^Total/ }).click()
          const total = tableRow(p, MATCHA).getByRole('textbox', { name: 'Total' })
          await total.fill('1800')
          await total.press('Enter')
          await expect(tableRow(p, MATCHA).getByRole('button', { name: /^Total: .*1,800/ })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await summary(p).getByRole('button', { name: 'Payer', exact: true }).click()
          await expect(summary(p).getByText('No payer yet')).toBeVisible()
          await settle(p)
        },
        target: summary,
      },
    ],
    // Back to the ledger, so every other guide finds it, and the seed as it was.
    cleanup: async p => {
      const list = p.getByRole('button', { name: 'List', exact: true })
      if (await list.isVisible().catch(() => false)) await list.click()
      await p.evaluate(key => { try { localStorage.setItem(key, 'list') } catch { /* no storage: nothing to put back */ } }, VIEW_KEY)
      await deleteExpenses(p, MATCHA, NEW_ROW)
      const { tripId } = seededTrip()
      for (const item of (await budgetItems(p)).filter(i => i.name === JR_PASS)) {
        await p.request.put(`/api/trips/${tripId}/budget/${item.id}`, { data: { days: passDaysBefore } })
      }
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureCostsFixtures(request)
})

test('every registered costs guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripCostsContext.guides].sort())
})

test('hero: trip-costs', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripCostsContext.id, openCosts)
})

for (const id of tripCostsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
