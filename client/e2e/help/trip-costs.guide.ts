import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { day, long, short } from '../dates'
import { seededTrip, ensureCostsFixtures } from './fixtures'
import { openTrip, modal, dialog } from './trip-shared'
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
const DINNER = 'Kaiseki dinner in Gion'
const UPGRADE = 'Shinkansen seat upgrade'
const LUNCH = { name: 'Nishiki Market lunch', category: 'food', total_price: 4800, currency: 'JPY', expense_date: day(-4) }

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
/** A recorded transfer in the ledger, told apart by who paid it. */
const payRow = (page: Page, who: string) =>
  page.locator('.exp-row').filter({ hasText: 'Payment' }).filter({ hasText: who }).first()
/** A block of the expense editor, found by its own label. */
const panel = (page: Page, label: string) =>
  modal(page).getByText(label, { exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
/** A card of the right-hand column, by the label it opens with. */
const card = (page: Page, label: RegExp) =>
  page.locator('.costs-grid > div:nth-child(2) > div').filter({ hasText: label }).first()
/** CustomSelect drops its list into a fixed portal on the body, outside the modal. */
const dropdown = (page: Page) => page.locator('div[style*="z-index: 99999"]').last()

const amounts = (page: Page) => modal(page).locator('input[inputmode="decimal"]')
const nameBox = (page: Page) => modal(page).getByPlaceholder('e.g. Dinner, souvenirs, gas…')
/** The header button; the editor's own save carries the same words, so it is scoped to the modal. */
const addExpense = (page: Page) => page.getByRole('button', { name: 'Add expense' }).first()
const saveExpense = (page: Page) => modal(page).getByRole('button', { name: 'Add expense' })
const settleButtons = (page: Page) => card(page, /^Settle up · /).getByRole('button', { name: 'Settle' })
/**
 * One suggested transfer in the Settle up card, by the title its pair of avatars
 * carries ("jonas → you"); the row itself is that pair's parent. The card lists
 * the flows in whatever order the settlement endpoint returns them, so taking
 * the first Settle button would settle whichever transfer happened to come
 * first, and the ledger steps below look for a named one.
 */
const settleRow = (page: Page, from: string) =>
  card(page, /^Settle up · /).locator(`div[title^="${from} "]`).locator('xpath=..')

const only = (target: (p: Page) => Locator) => ({ target })

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

async function deleteExpenses(page: Page, ...names: string[]): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/budget`)
  const { items } = (await res.json()) as { items: { id: number; name: string }[] }
  for (const item of items.filter(i => names.includes(i.name))) {
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
          await amounts(p).first().fill('18600')
          await expect(saveExpense(p)).toBeEnabled()
          await settle(p)
        },
        // The left block carries the name, the amount, the currency and the day.
        target: p => panel(p, 'What was it for?'),
      },
      // The two-column row inside that block, so the step about them is not the
      // same picture as the step about the name.
      only(p => modal(p).getByText('Currency', { exact: true }).locator('xpath=../..')),
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Food & drink' }).click()
          // The chosen pill is marked by its border alone, not by a class.
          await expect(modal(p).getByRole('button', { name: 'Food & drink' })).toHaveAttribute(
            'style',
            /border-color: var\(--text-primary\)/,
          )
          await settle(p)
        },
        target: p => panel(p, 'Category'),
      },
      only(p => panel(p, 'Who paid?')),
      {
        target: saveExpense,
        act: async p => {
          await saveExpense(p).click()
          await expect(modal(p)).toHaveCount(0)
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
          await expect(panel(p, 'Who paid?')).toBeVisible()
          await settle(p)
        },
        target: p => panel(p, 'Who paid?'),
      },
      {
        prepare: async p => {
          await panel(p, 'Who paid?').getByRole('button').filter({ hasText: 'You' }).first().click()
          await beat(p, 300)
          await expect(p.getByRole('button', { name: 'No one paid yet' })).toBeVisible()
        },
        target: p => p.getByRole('button', { name: 'No one paid yet' }),
        // The list closes on a second click of its trigger, not on Escape; nothing is picked.
        act: async p => {
          await panel(p, 'Who paid?').getByRole('button').filter({ hasText: 'You' }).first().click()
          await expect(p.getByRole('button', { name: 'No one paid yet' })).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Multiple people paid' }).click()
          await expect(modal(p).getByTestId('payer-toggle')).toHaveCount(3)
          await modal(p).getByTestId('payer-toggle').nth(1).click()
          await expect(modal(p).getByTestId('payer-amount')).toHaveCount(2)
          await settle(p)
        },
        target: p => panel(p, 'Who paid?'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'One person paid' }).click()
          await closeModal(p)
          await settle(p)
        },
      },
      {
        target: p => expRow(p, UNPAID),
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
          await expect(panel(p, 'Split')).toBeVisible()
          await panel(p, 'Split').getByRole('button', { name: /jonas/ }).click()
          await expect(modal(p).getByText('Excluded')).toBeVisible()
          await settle(p)
        },
        target: p => panel(p, 'Split'),
        act: async p => {
          await panel(p, 'Split').getByRole('button', { name: /jonas/ }).click()
          await expect(modal(p).getByText('Excluded')).toHaveCount(0)
          await settle(p)
        },
      },
      only(p => modal(p).getByText(/^Split \d+ ways · /)),
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Custom', exact: true }).click()
          await amounts(p).nth(1).fill('1000')
          await expect(modal(p).getByText(/^Sum of splits: /)).toBeVisible()
          await settle(p)
        },
        target: p => modal(p).getByText(/^Sum of splits: /),
        act: async p => {
          await amounts(p).nth(2).fill('1900')
          await amounts(p).nth(3).fill('1900')
          await expect(modal(p).getByText('Split matches total')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Ticket', exact: true }).click()
          await modal(p).getByRole('button', { name: 'Add item' }).click()
          await typeInto(p, modal(p).getByPlaceholder('Item name').first(), 'Tamagoyaki')
          await amounts(p).nth(1).fill('1200')
          await modal(p).getByRole('button', { name: 'Add item' }).click()
          await typeInto(p, modal(p).getByPlaceholder('Item name').nth(1), 'Soy milk donuts')
          await amounts(p).nth(2).fill('900')
          // The second line is shared by two of the three travelers.
          await modal(p)
            .getByPlaceholder('Item name')
            .nth(1)
            .locator('xpath=ancestor::div[2]')
            .getByRole('button', { name: /jonas/ })
            .click()
          await expect(amounts(p).first()).toHaveValue('2100.00')
          await settle(p)
        },
        target: p => modal(p).getByPlaceholder('Item name').first().locator('xpath=ancestor::div[2]'),
      },
      {
        target: p => modal(p).getByText('Individual shares').locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
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
          await modal(p).getByRole('button', { name: 'Transport', exact: true }).click()
          await settle(p)
        },
        target: p => panel(p, 'What was it for?'),
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
          await typeInto(p, p.getByPlaceholder('Search expenses…'), 'pass')
          await expect(expRow(p, 'JR Pass (14 days)')).toBeVisible()
          await settle(p)
        },
        target: p => p.getByPlaceholder('Search expenses…').locator('xpath=..'),
        act: async p => {
          await p.getByPlaceholder('Search expenses…').fill('')
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'All categories' }).first().click()
          await beat(p, 300)
          await expect(dropdown(p).getByRole('button', { name: 'Transport', exact: true })).toBeVisible()
        },
        target: p => p.getByRole('button', { name: 'All categories' }).first(),
        act: async p => {
          await dropdown(p).getByRole('button', { name: 'Transport', exact: true }).click()
          await expect(expRow(p, 'Ryokan in Hakone')).toHaveCount(0)
          await p.getByRole('button', { name: 'Transport', exact: true }).first().click()
          await beat(p, 300)
          await dropdown(p).getByRole('button', { name: 'All categories' }).click()
          await expect(expRow(p, 'Ryokan in Hakone')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'All days' }).first().click()
          await beat(p, 300)
          await dropdown(p).getByRole('button', { name: short(-9) }).click()
          await expect(p.getByText(new RegExp(`^${long(-9)}$`))).toBeVisible()
          await settle(p)
        },
        target: p => p.getByText(new RegExp(`^${long(-9)}$`)).locator('xpath=../..'),
        act: async p => {
          await p.getByRole('button', { name: short(-9) }).first().click()
          await beat(p, 300)
          await dropdown(p).getByRole('button', { name: 'All days' }).click()
          await expect(p.getByText(new RegExp(`^${long(-9)}$`))).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Paid by me' }).click()
          await settle(p)
        },
        target: p => p.getByRole('button', { name: 'All', exact: true }).locator('xpath=..'),
        act: async p => {
          await p.getByRole('button', { name: 'All', exact: true }).click()
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
      only(p => card(p, /^Settle up · /)),
      {
        target: p => settleRow(p, 'jonas').getByRole('button', { name: 'Settle' }),
        act: async p => {
          await settleRow(p, 'jonas').getByRole('button', { name: 'Settle' }).click()
          await expect(settleButtons(p)).toHaveCount(1, { timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => payRow(p, 'jonas')),
      {
        target: p => payRow(p, 'jonas').locator('xpath=..').locator('.exp-actions'),
        act: async p => {
          await payRow(p, 'jonas').locator('xpath=..').getByRole('button', { name: 'Undo' }).click()
          await expect(settleButtons(p)).toHaveCount(2, { timeout: 15_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Add payment' }).first().click()
          await expect(modal(p).getByRole('button', { name: 'Add payment' })).toBeVisible()
          await modal(p).locator('input[inputmode="decimal"]').first().fill('5000')
          await settle(p)
        },
        target: dialog,
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add payment' }).click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
        },
      },
      // Ringed and left alone: one click would record every open transfer and
      // flatten the balances every later picture is taken against.
      only(p => p.getByRole('button', { name: 'Settle up' })),
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
      only(p => card(p, /^Balances/)),
      only(p => card(p, /^Final budget/)),
      {
        prepare: async p => {
          await card(p, /^Final budget/).getByRole('button').first().click()
          await expect(p.getByText('Expenses paid').first()).toBeVisible()
          await settle(p)
        },
        target: p => card(p, /^Final budget/).locator('[aria-expanded="true"]').locator('xpath=following-sibling::div[1]'),
      },
      {
        // The second "Expenses paid" is the heading of the list the figure is made of.
        target: p => p.getByText('Expenses paid').nth(1).locator('xpath=..'),
        act: async p => {
          await card(p, /^Final budget/).getByRole('button').first().click()
          await expect(card(p, /^Final budget/).locator('[aria-expanded="true"]')).toHaveCount(0)
        },
      },
    ],
  },

  'expense-from-booking': {
    guide: guide('expense-from-booking'),
    start: async p => {
      await openTrip(p, { tab: 'transports' })
      await expect(p.getByRole('button', { name: 'Edit' }).first()).toBeVisible({ timeout: 30_000 })
      await settle(p)
    },
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Edit' }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Edit' }).first().click()
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
          await p.getByRole('button', { name: 'Edit' }).first().click()
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
