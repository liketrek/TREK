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
const RECEIPTS = { slug: COSTS, anchor: 'receipts-and-invoices' }

export const { context: tripCostsContext, guides: tripCostsGuides } = defineScreen({
  id: 'trip-costs',
  parent: 'trip',
  route: '/trips/:id?tab=finanzplan',
  icon: 'wallet',
  bullets: 7,
  docs: [{ slug: COSTS }, { slug: CURRENCIES }],
  guides: [
    ['add-expense', 'plus', 'guide', 6, 3, ITEMS, ['split-expense', 'expense-payers', 'expense-receipts'], true],
    ['expense-payers', 'userRound', 'guide', 4, 3, { slug: COSTS, anchor: 'who-paid' }, ['add-expense', 'settle-up']],
    ['split-expense', 'users', 'guide', 5, 4, { slug: COSTS, anchor: 'splitting-costs' }, ['add-expense', 'expense-payers', 'split-by-shares'], true],
    ['split-by-shares', 'bed', 'quick', 4, 3, { slug: COSTS, anchor: 'splitting-costs' }, ['split-expense', 'add-expense'], true],
    ['expense-currency', 'coins', 'guide', 5, 3, { slug: CURRENCIES, anchor: 'expense-currency' }, ['add-expense', 'costs-show-in', 'edit-trip', 'language-region'], true],
    ['costs-show-in', 'globe', 'quick', 4, 3, { slug: CURRENCIES, anchor: 'reading-one-trip-in-another-currency' }, ['expense-currency', 'language-region'], true],
    ['expense-receipts', 'receipt', 'guide', 5, 4, RECEIPTS, ['add-expense', 'link-receipt-file', 'files-preview', 'files-trash'], true],
    ['link-receipt-file', 'folderInput', 'quick', 4, 2, RECEIPTS, ['expense-receipts', 'files-preview'], true],
    ['filter-costs', 'filter', 'quick', 5, 3, ITEMS, ['add-expense', 'final-budget', 'costs-table', 'leave-out-category'], true],
    ['leave-out-category', 'minusCircle', 'quick', 4, 3, { slug: COSTS, anchor: 'costs-summary' }, ['filter-costs', 'final-budget']],
    ['settle-up', 'checkCircle', 'tour', 6, 3, SETTLEMENT, ['final-budget', 'expense-payers'], true],
    ['final-budget', 'chart', 'guide', 4, 3, SETTLEMENT, ['settle-up', 'add-expense']],
    ['costs-totals-only', 'sliders', 'quick', 4, 3, { slug: COSTS, anchor: 'totals-only' }, ['add-expense', 'settle-up']],
    ['expense-from-booking', 'link', 'quick', 4, 2, { slug: COSTS, anchor: 'expenses-linked-to-a-booking-or-a-place' }, ['add-expense', 'booking-cost', 'create-booking'], true],
    ['costs-table', 'calculator', 'guide', 6, 3, { slug: COSTS, anchor: 'table-view' }, ['add-expense', 'filter-costs', 'final-budget'], true],
  ],
})
