import { defineScreen } from '../defineScreen'

/**
 * Help for the Costs tab of a trip: recording what something cost, who put the
 * money down and who it is shared with, in whatever currency the receipt was
 * in, and reading back who owes whom and what the trip costs each traveler.
 * A screen under `trip`; the step actions live in `e2e/help/trip-costs.guide.ts`.
 */

const COSTS = 'Budget-Tracking'
const CURRENCIES = 'Currencies'
const SETTLEMENT = { slug: COSTS, anchor: 'settlement-calculator' }
const ITEMS = { slug: COSTS, anchor: 'expense-items' }

export const { context: tripCostsContext, guides: tripCostsGuides } = defineScreen({
  id: 'trip-costs',
  parent: 'trip',
  route: '/trips/:id?tab=finanzplan',
  icon: 'wallet',
  bullets: 6,
  docs: [{ slug: COSTS }, { slug: CURRENCIES }],
  guides: [
    ['add-expense', 'plus', 'guide', 6, 3, ITEMS, ['split-expense', 'expense-payers', 'expense-currency'], true],
    ['expense-payers', 'userRound', 'guide', 4, 3, { slug: COSTS, anchor: 'who-paid' }, ['add-expense', 'settle-up']],
    ['split-expense', 'users', 'guide', 5, 3, { slug: COSTS, anchor: 'splitting-costs' }, ['add-expense', 'expense-payers'], true],
    ['expense-currency', 'coins', 'guide', 5, 3, { slug: CURRENCIES, anchor: 'expense-currency' }, ['add-expense', 'edit-trip', 'language-region'], true],
    ['filter-costs', 'filter', 'quick', 5, 2, ITEMS, ['add-expense', 'final-budget'], true],
    ['settle-up', 'checkCircle', 'tour', 6, 3, SETTLEMENT, ['final-budget', 'expense-payers'], true],
    ['final-budget', 'chart', 'guide', 4, 2, SETTLEMENT, ['settle-up', 'add-expense']],
    ['expense-from-booking', 'link', 'quick', 4, 2, { slug: COSTS, anchor: 'expenses-linked-to-a-booking-or-a-place' }, ['add-expense', 'bookings-in-plan', 'create-booking'], true],
  ],
})
