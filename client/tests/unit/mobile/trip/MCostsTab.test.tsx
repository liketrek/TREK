import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import MCostsTab from '../../../../src/mobile/screens/trip/tabs/MCostsTab'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { budgetApi } from '../../../../src/api/client'
import { clearExchangeRateCache } from '../../../../src/hooks/useExchangeRates'
import { useAuthStore } from '../../../../src/store/authStore'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import type { BudgetItem, Day, Trip } from '../../../../src/types'
import { buildTrip, buildUser } from '../../../helpers/factories'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { server } from '../../../helpers/msw/server'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-COSTT-001 to FE-MOB-COSTT-037

// The add/edit expense sheet is the shared desktop-sized form; the panel only
// owns when it opens and what happens on save, so it is stubbed here.
vi.mock('../../../../src/mobile/screens/trip/sheets/MCostSheet', () => ({
  default: ({ base, editing, onClose, onSaved }: {
    base: string
    editing: { id: number } | null
    onClose: () => void
    onSaved: () => void
  }) => (
    <div>
      <span>{editing ? `sheet editing ${editing.id}` : `sheet new ${base}`}</span>
      <button type="button" onClick={onSaved}>sheet save</button>
      <button type="button" onClick={onClose}>sheet close</button>
    </div>
  ),
}))

const TRIP = buildTrip({ id: 7, title: 'Tokyo Trip', currency: 'USD' }) as Trip

const DAYS = [
  { id: 1, trip_id: 7, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 7, day_number: 2, date: '2026-05-02', title: 'Kyoto' },
] as unknown as Day[]

const MEMBERS = [
  { id: 1, username: 'Me', avatar_url: null },
  { id: 2, username: 'Ada', avatar_url: '/uploads/avatars/ada.png' },
  { id: 3, username: 'Bob', avatar_url: null },
]

const RAMEN = {
  id: 11, trip_id: 7, name: 'Ramen', category: 'food', total_price: 80, currency: 'USD',
  expense_date: '2026-05-02', note: null,
  members: [
    { user_id: 1, paid: 1, username: 'Me', amount: null, avatar_url: null },
    { user_id: 2, paid: 0, username: 'Ada', amount: null, avatar_url: '/uploads/avatars/ada.png' },
  ],
  payers: [{ user_id: 1, amount: 80, username: 'Me' }],
} as unknown as BudgetItem

/** Foreign currency + explicit custom shares — exercises the conversion line. */
const MUSEUM = {
  id: 12, trip_id: 7, name: 'Museum', category: 'activities', total_price: 30, currency: 'GBP',
  expense_date: '2026-04-30', note: 'Tickets; adult',
  members: [
    { user_id: 1, paid: 0, username: 'Me', amount: 10, avatar_url: null },
    { user_id: 3, paid: 0, username: 'Bob', amount: 20, avatar_url: null },
  ],
  payers: [{ user_id: 3, amount: 30, username: 'Bob' }],
} as unknown as BudgetItem

/** No currency (falls back to the trip's), no members, no payer → the "unfinished" case. */
const SOUVENIR = {
  id: 13, trip_id: 7, name: 'Souvenirs', category: 'shopping', total_price: 25, currency: null,
  expense_date: null, note: null, payers: [],
} as unknown as BudgetItem

/** I paid exactly my own share — counts as "mine" but never as "owed". */
const TAXI = {
  id: 14, trip_id: 7, name: 'Taxi', category: 'transport', total_price: 20, currency: 'USD',
  expense_date: '2026-05-02', note: 'TICKETJSON:{"items":[]}',
  members: [{ user_id: 1, paid: 1, username: 'Me', amount: 20, avatar_url: null }],
  payers: [{ user_id: 1, amount: 20, username: 'Me' }],
} as unknown as BudgetItem

const ITEMS = [RAMEN, MUSEUM, SOUVENIR, TAXI]

const SETTLEMENT = {
  balances: [
    { user_id: 1, username: 'Me', avatar_url: null, balance: 12.5 },
    { user_id: 2, username: 'Ada', avatar_url: '/uploads/avatars/ada.png', balance: -7.25 },
  ],
  flows: [
    { from: { user_id: 1, username: 'Me' }, to: { user_id: 2, username: 'Ada' }, amount: 40 },
    { from: { user_id: 3, username: 'Bob' }, to: { user_id: 1, username: 'Me' }, amount: 15 },
    { from: { user_id: 99, username: 'Ghost' }, to: { user_id: 3, username: 'Bob' }, amount: 5 },
  ],
}

let settlementBases: string[] = []

function serveSettlement(body: unknown = SETTLEMENT, fail = false) {
  server.use(
    http.get('/api/trips/:id/budget/settlement', ({ request }) => {
      settlementBases.push(new URL(request.url).searchParams.get('base') ?? '')
      return fail ? HttpResponse.error() : HttpResponse.json(body)
    }),
  )
}

function planner(overrides: Partial<TripPlanner> = {}) {
  return buildPlanner({
    tripId: 7,
    trip: TRIP,
    days: DAYS,
    budgetItems: ITEMS,
    tripMembers: MEMBERS as unknown as TripPlanner['tripMembers'],
    ...overrides,
  })
}

/** Renders and waits until the settlement response has landed in state. */
async function renderTab(p: TripPlanner = planner(), shell: MTripShellApi = buildShell()) {
  const view = render(<MCostsTab planner={p} shell={shell} />)
  await screen.findByText('+$12.50')
  return { ...view, planner: p, shell }
}

/** Walks up `n` levels — the panel's blocks are plain divs without test ids. */
function up(el: HTMLElement, n: number): HTMLElement {
  let node: HTMLElement = el
  for (let i = 0; i < n; i++) node = node.parentElement as HTMLElement
  return node
}

/** The expense card of a row, found from its name. */
function cardOf(name: string): HTMLElement {
  let el = screen.getByText(name).parentElement
  while (el && !el.className.includes('rounded-2xl')) el = el.parentElement
  if (!el) throw new Error(`no card for ${name}`)
  return el
}

/** Card plus the edit/delete stack that sits next to it. */
function rowOf(name: string): HTMLElement {
  return up(cardOf(name), 1)
}

describe('MCostsTab', () => {
  beforeEach(() => {
    resetAllStores()
    clearExchangeRateCache()
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'Me' }) })
    localStorage.setItem('trek_fx_USD', JSON.stringify({ rates: { USD: 1, GBP: 0.5 }, ts: Date.now() }))
    localStorage.setItem('trek_fx_GBP', JSON.stringify({ rates: { GBP: 1, USD: 2 }, ts: Date.now() }))
    settlementBases = []
    serveSettlement()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-COSTT-001: loads the items and the settlement for the display currency', async () => {
    const { planner: p } = await renderTab()
    expect(p.tripActions.loadBudgetItems).toHaveBeenCalledWith(7)
    expect(settlementBases).toEqual(['USD'])
  })

  it('FE-MOB-COSTT-002: sums the hero totals across currencies', async () => {
    await renderTab()
    const hero = up(screen.getByText('costs.totalSpend'), 1)
    expect(hero.textContent).toContain('$185.00')
    expect(hero.textContent).toContain('costs.yourShare')
    expect(hero.textContent).toContain('$80.00')
    expect(hero.textContent).toContain('costs.youPaid')
    expect(hero.textContent).toContain('$100.00')
  })

  it('FE-MOB-COSTT-003: derives owe / owed from the settlement flows', async () => {
    await renderTab()
    expect(up(screen.getByText('costs.youOwe'), 1).textContent).toContain('$40.00')
    expect(up(screen.getByText('costs.youreOwed'), 1).textContent).toContain('$15.00')
  })

  it('FE-MOB-COSTT-004: reports the unpaid expenses as outstanding', async () => {
    await renderTab()
    const block = up(screen.getByText('costs.outstanding'), 2)
    expect(block.textContent).toContain('1')
    expect(block.textContent).toContain('$25.00')
  })

  it('FE-MOB-COSTT-005: hides the outstanding block when everything is paid', async () => {
    await renderTab(planner({ budgetItems: [RAMEN, TAXI] }))
    expect(screen.queryByText('costs.outstanding')).not.toBeInTheDocument()
  })

  it('FE-MOB-COSTT-006: lists the settle-up flows and names the participants', async () => {
    await renderTab()
    const settle = up(screen.getByText('costs.settleUp'), 3)
    expect(within(settle).getByText('$40.00')).toBeInTheDocument()
    expect(within(settle).getByText('$15.00')).toBeInTheDocument()
    expect(within(settle).getByText('$5.00')).toBeInTheDocument()
    expect(within(settle).getByText('?')).toBeInTheDocument()
    expect(within(settle).getAllByText('costs.you')).toHaveLength(3)
    expect(within(settle).getAllByText('Ada')).toHaveLength(2)
  })

  it('FE-MOB-COSTT-007: shows each member balance with its sign, zero for unknown members', async () => {
    await renderTab()
    const settle = up(screen.getByText('costs.settleUp'), 3)
    expect(within(settle).getByText('+$12.50')).toBeInTheDocument()
    expect(within(settle).getByText('−$7.25')).toBeInTheDocument()
    expect(within(settle).getByText('$0.00')).toBeInTheDocument()
    expect(within(settle).getByAltText('')).toHaveAttribute('src', '/uploads/avatars/ada.png')
  })

  it('FE-MOB-COSTT-008: collapses and reopens the settle-up card', async () => {
    await renderTab()
    // The header is a real <button> now, so Enter/Space activation is the
    // browser's job — no key handler of our own left to exercise.
    const head = screen.getByRole('button', { name: /costs\.settleUp/ })
    expect(head).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(head)
    expect(screen.queryByText('costs.balances')).not.toBeInTheDocument()
    fireEvent.click(head)
    expect(screen.getByText('costs.balances')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-009: celebrates a settlement without open flows', async () => {
    serveSettlement({ balances: SETTLEMENT.balances, flows: [] })
    await renderTab()
    expect(screen.getByText('costs.everyoneSquare')).toBeInTheDocument()
    expect(screen.getByText('costs.nothingOutstanding')).toBeInTheDocument()
    expect(up(screen.getByText('costs.youOwe'), 1).textContent).toContain('$0.00')
  })

  it('FE-MOB-COSTT-010: survives a failing settlement request', async () => {
    serveSettlement(null, true)
    render(<MCostsTab planner={planner()} shell={buildShell()} />)
    await waitFor(() => expect(settlementBases).toEqual(['USD']))
    expect(screen.getByText('costs.everyoneSquare')).toBeInTheDocument()
    const settle = up(screen.getByText('costs.settleUp'), 3)
    expect(within(settle).getAllByText('$0.00')).toHaveLength(3)
  })

  it('FE-MOB-COSTT-011: breaks the spend down by category, largest bar first', async () => {
    await renderTab()
    const block = up(screen.getByText('costs.byCategory'), 1)
    const labels = within(block).getAllByText(/^costs\.cat\./).map(n => n.textContent)
    expect(labels).toEqual(['costs.cat.food', 'costs.cat.activities', 'costs.cat.shopping', 'costs.cat.transport'])
    expect(within(block).getByText('$60.00')).toBeInTheDocument()
    expect(within(block).getByText('$20.00')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-012: shows the empty panel without any expense', async () => {
    await renderTab(planner({ budgetItems: [] }))
    expect(screen.getByText('costs.noCategories')).toBeInTheDocument()
    expect(screen.getByText('costs.emptyText')).toBeInTheDocument()
    expect(up(screen.getByText('costs.totalSpend'), 1).textContent).toContain('$0.00')
  })

  it('FE-MOB-COSTT-013: groups the expenses by day with a per-day total', async () => {
    await renderTab()
    expect(screen.getByText('Sat, May 2')).toBeInTheDocument()
    expect(screen.getByText('Thu, Apr 30')).toBeInTheDocument()
    expect(screen.getByText('costs.noDate')).toBeInTheDocument()
    expect(screen.getByText('costs.spent:$100.00')).toBeInTheDocument()
    expect(screen.getByText('costs.spent:$60.00')).toBeInTheDocument()
    expect(screen.getByText('costs.spent:$25.00')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-014: converts a foreign expense and shows both amounts', async () => {
    await renderTab()
    const card = cardOf('Museum')
    expect(within(card).getByText('£30.00 → $60.00')).toBeInTheDocument()
    expect(within(card).getByText('costs.cat.activities')).toBeInTheDocument()
    expect(within(card).getByText('$40.00')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-015: marks an expense nobody paid as unfinished', async () => {
    await renderTab()
    expect(within(cardOf('Souvenirs')).getByText('costs.unfinished')).toBeInTheDocument()
    expect(within(cardOf('Ramen')).queryByText('costs.unfinished')).not.toBeInTheDocument()
  })

  it('FE-MOB-COSTT-016: renders the member chips with their share and paid state', async () => {
    await renderTab()
    const card = cardOf('Ramen')
    const chips = within(card).getAllByRole('button')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true')
    expect(chips[1]).toHaveAttribute('aria-pressed', 'false')
    expect(chips.map(c => c.textContent)).toEqual(['costs.youShort$40.00', '$40.00'])
  })

  it('FE-MOB-COSTT-017: toggles a member chip to paid', async () => {
    const p = planner()
    await renderTab(p)
    fireEvent.click(within(cardOf('Ramen')).getByRole('button', { pressed: false }))
    await waitFor(() => expect(p.tripActions.toggleBudgetMemberPaid).toHaveBeenCalledWith(7, 11, 2, true))
  })

  it('FE-MOB-COSTT-018: toasts when the paid toggle fails', async () => {
    const p = planner()
    vi.mocked(p.tripActions.toggleBudgetMemberPaid).mockRejectedValueOnce(new Error('offline'))
    await renderTab(p)
    fireEvent.click(within(cardOf('Ramen')).getByRole('button', { pressed: false }))
    await waitFor(() => expect(p.toast.error).toHaveBeenCalledWith('common.unknownError'))
  })

  it('FE-MOB-COSTT-019: filters the list by the search field', async () => {
    await renderTab()
    const search = screen.getByLabelText('costs.searchPlaceholder')
    fireEvent.change(search, { target: { value: 'muse' } })
    expect(screen.getByText('Museum')).toBeInTheDocument()
    expect(screen.queryByText('Ramen')).not.toBeInTheDocument()
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText('costs.noMatch')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-020: segments the list into mine and owed', async () => {
    await renderTab()
    const mine = screen.getByRole('button', { name: 'costs.filter.mine' })
    fireEvent.click(mine)
    expect(mine).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Ramen')).toBeInTheDocument()
    expect(screen.getByText('Taxi')).toBeInTheDocument()
    expect(screen.queryByText('Museum')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'costs.filter.owed' }))
    expect(screen.getByText('Ramen')).toBeInTheDocument()
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'costs.filter.all' }))
    expect(screen.getByText('Museum')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-021: filters by a category that is actually in use', async () => {
    await renderTab()
    const trigger = screen.getByText('costs.filter.allCategories').closest('button') as HTMLElement
    fireEvent.click(trigger)
    const menu = up(trigger, 1).nextElementSibling as HTMLElement
    const options = within(menu).getAllByRole('button').map(b => b.textContent)
    expect(options).toEqual([
      'costs.filter.allCategories', 'costs.cat.food', 'costs.cat.transport', 'costs.cat.activities', 'costs.cat.shopping',
    ])

    fireEvent.click(within(menu).getByText('costs.cat.activities'))
    expect(screen.getByText('Museum')).toBeInTheDocument()
    expect(screen.queryByText('Ramen')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    fireEvent.click(within(up(trigger, 1).nextElementSibling as HTMLElement).getByText('costs.filter.allCategories'))
    expect(screen.getByText('Ramen')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-022: filters by expense day, labelling known days with their number', async () => {
    await renderTab()
    const trigger = screen.getByText('costs.filter.allDays').closest('button') as HTMLElement
    fireEvent.click(trigger)
    const menu = up(trigger, 1).nextElementSibling as HTMLElement
    expect(within(menu).getAllByRole('button').map(b => b.textContent)).toEqual([
      'costs.filter.allDays', 'Apr 30', 'dayplan.dayN:2 · May 2',
    ])

    fireEvent.click(within(menu).getByText('dayplan.dayN:2 · May 2'))
    expect(screen.getByText('Ramen')).toBeInTheDocument()
    expect(screen.getByText('Taxi')).toBeInTheDocument()
    expect(screen.queryByText('Museum')).not.toBeInTheDocument()
    expect(trigger.textContent).toBe('dayplan.dayN:2 · May 2')
  })

  it('FE-MOB-COSTT-023: only one filter menu is open at a time', async () => {
    await renderTab()
    const catTrigger = screen.getByText('costs.filter.allCategories').closest('button') as HTMLElement
    const dayTrigger = screen.getByText('costs.filter.allDays').closest('button') as HTMLElement
    fireEvent.click(catTrigger)
    fireEvent.click(dayTrigger)
    expect(catTrigger).toHaveAttribute('aria-expanded', 'false')
    expect(dayTrigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('FE-MOB-COSTT-024: opens the edit sheet from a row and reloads on save', async () => {
    const p = planner()
    await renderTab(p)
    fireEvent.click(within(rowOf('Ramen')).getByRole('button', { name: 'common.edit' }))
    expect(screen.getByText('sheet editing 11')).toBeInTheDocument()

    fireEvent.click(screen.getByText('sheet save'))
    expect(screen.queryByText('sheet editing 11')).not.toBeInTheDocument()
    expect(p.tripActions.loadBudgetItems).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(settlementBases).toEqual(['USD', 'USD']))
  })

  it('FE-MOB-COSTT-025: deletes an expense after confirming and refreshes the settlement', async () => {
    const p = planner()
    await renderTab(p)
    fireEvent.click(within(rowOf('Ramen')).getByRole('button', { name: 'common.delete' }))
    const dialog = screen.getByRole('dialog', { name: 'costs.confirm.deleteTitle' })
    expect(within(dialog).getByText('costs.confirm.deleteBody:Ramen')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByText('common.delete'))
    await waitFor(() => expect(p.tripActions.deleteBudgetItem).toHaveBeenCalledWith(7, 11))
    await waitFor(() => expect(settlementBases).toHaveLength(2))
  })

  it('FE-MOB-COSTT-026: toasts when the delete fails', async () => {
    const p = planner()
    vi.mocked(p.tripActions.deleteBudgetItem).mockRejectedValueOnce(new Error('offline'))
    await renderTab(p)
    fireEvent.click(within(rowOf('Ramen')).getByRole('button', { name: 'common.delete' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('common.delete'))
    await waitFor(() => expect(p.toast.error).toHaveBeenCalledWith('common.unknownError'))
  })

  it('FE-MOB-COSTT-027: opens a blank expense sheet when the header raises the add signal', async () => {
    const p = planner()
    const { rerender } = await renderTab(p)
    expect(screen.queryByText('sheet new USD')).not.toBeInTheDocument()

    rerender(<MCostsTab planner={p} shell={buildShell({ addExpenseSignal: 1 })} />)
    expect(screen.getByText('sheet new USD')).toBeInTheDocument()
    fireEvent.click(screen.getByText('sheet close'))
    expect(screen.queryByText('sheet new USD')).not.toBeInTheDocument()
  })

  it('FE-MOB-COSTT-028: exports the CSV when the header raises the export signal', async () => {
    const blobs: Blob[] = []
    const createObjectURL = vi.fn((b: Blob) => { blobs.push(b); return 'blob:costs' })
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: revokeObjectURL })
    let downloadName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download
    })

    const p = planner()
    const { rerender } = await renderTab(p)
    expect(createObjectURL).not.toHaveBeenCalled()

    rerender(<MCostsTab planner={p} shell={buildShell({ exportCostsCsvSignal: 1 })} />)
    expect(downloadName).toBe('costs-Tokyo Trip.csv')
    // The blob URL outlives the click by a beat so the download can start.
    expect(revokeObjectURL).not.toHaveBeenCalled()
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:costs'))

    const csv = await blobs[0].text()
    const lines = csv.replace('﻿', '').split('\r\n')
    expect(lines[0]).toBe('Date;Name;Category;Amount;Currency;Amount (USD);Note')
    expect(lines[1]).toBe(';Souvenirs;costs.cat.shopping;25.00;USD;25.00;')
    expect(lines[2]).toBe('04/30/2026;Museum;costs.cat.activities;30.00;GBP;60.00;"Tickets; adult"')
    // The ticket JSON note never leaves the app as a "note".
    expect(lines[4]).toBe('05/02/2026;Taxi;costs.cat.transport;20.00;USD;20.00;')
  })

  it('FE-MOB-COSTT-029: records a manual payment and refreshes the settlement', async () => {
    const create = vi.spyOn(budgetApi, 'createSettlement').mockResolvedValue({})
    await renderTab()
    fireEvent.click(screen.getByRole('button', { name: 'costs.addPayment' }))
    const dialog = screen.getByRole('dialog', { name: 'costs.addPayment' })
    const submit = within(dialog).getByRole('button', { name: 'costs.addPayment' })
    expect(submit).toBeDisabled()

    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '12,5' } })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(create).toHaveBeenCalledWith(7, { from_user_id: 1, to_user_id: 2, amount: 12.5, currency: 'USD' })
    await waitFor(() => expect(settlementBases).toHaveLength(2))
  })

  it('FE-MOB-COSTT-030: refuses a payment to yourself and toasts a failed one', async () => {
    const create = vi.spyOn(budgetApi, 'createSettlement').mockRejectedValue(new Error('nope'))
    const p = planner()
    await renderTab(p)
    fireEvent.click(screen.getByRole('button', { name: 'costs.addPayment' }))
    const dialog = screen.getByRole('dialog', { name: 'costs.addPayment' })
    const submit = within(dialog).getByRole('button', { name: 'costs.addPayment' })
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '5' } })

    const toGroup = within(dialog).getByText('costs.to').nextElementSibling as HTMLElement
    fireEvent.click(within(toGroup).getByText('costs.you'))
    expect(submit).toBeDisabled()

    fireEvent.click(within(within(dialog).getByText('costs.to').nextElementSibling as HTMLElement).getByText('Ada'))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    await waitFor(() => expect(p.toast.error).toHaveBeenCalledWith('common.unknownError'))
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COSTT-031: a solo trip can never send a payment', async () => {
    await renderTab(planner({ tripMembers: [MEMBERS[0]] as unknown as TripPlanner['tripMembers'] }))
    fireEvent.click(screen.getByRole('button', { name: 'costs.addPayment' }))
    const dialog = screen.getByRole('dialog', { name: 'costs.addPayment' })
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '5' } })
    expect(within(dialog).getByRole('button', { name: 'costs.addPayment' })).toBeDisabled()
  })

  it('FE-MOB-COSTT-032: a read-only member gets no add, edit or delete affordances', async () => {
    await renderTab(planner({ can: vi.fn(() => false) as unknown as TripPlanner['can'] }))
    expect(screen.queryByRole('button', { name: 'costs.addPayment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    expect(within(cardOf('Ramen')).getByRole('button', { pressed: false })).toBeDisabled()
  })

  it('FE-MOB-COSTT-033: resets the day filter back to all days', async () => {
    await renderTab()
    const trigger = screen.getByText('costs.filter.allDays').closest('button') as HTMLElement
    fireEvent.click(trigger)
    fireEvent.click(within(up(trigger, 1).nextElementSibling as HTMLElement).getByText('Apr 30'))
    expect(screen.queryByText('Ramen')).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.click(within(up(trigger, 1).nextElementSibling as HTMLElement).getByText('costs.filter.allDays'))
    expect(screen.getByText('Ramen')).toBeInTheDocument()
    expect(trigger.textContent).toBe('costs.filter.allDays')
  })

  it('FE-MOB-COSTT-034: dismisses the payment sheet without recording anything', async () => {
    const create = vi.spyOn(budgetApi, 'createSettlement')
    await renderTab()
    fireEvent.click(screen.getByRole('button', { name: 'costs.addPayment' }))
    const dialog = screen.getByRole('dialog', { name: 'costs.addPayment' })
    const fromGroup = within(dialog).getByText('costs.from').nextElementSibling as HTMLElement
    fireEvent.click(within(fromGroup).getByText('Bob'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.cancel' }))
    expect(create).not.toHaveBeenCalled()
    expect(settlementBases).toHaveLength(1)
  })

  it('FE-MOB-COSTT-035: cancelling the confirm keeps the expense', async () => {
    const p = planner()
    await renderTab(p)
    fireEvent.click(within(rowOf('Ramen')).getByRole('button', { name: 'common.delete' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('common.cancel'))
    expect(p.tripActions.deleteBudgetItem).not.toHaveBeenCalled()
    expect(screen.getByText('Ramen')).toBeInTheDocument()
  })

  it('FE-MOB-COSTT-036: falls back to EUR and a neutral avatar without a user or trip currency', async () => {
    seedStore(useAuthStore, { user: null })
    localStorage.setItem('trek_fx_EUR', JSON.stringify({ rates: { EUR: 1 }, ts: Date.now() }))
    const solo = [{ id: 1, username: '', avatar_url: null }] as unknown as TripPlanner['tripMembers']
    render(<MCostsTab planner={planner({ trip: null as unknown as TripPlanner['trip'], tripMembers: solo })} shell={buildShell()} />)
    await screen.findByText('+12,50 €')
    expect(settlementBases).toEqual(['EUR'])
    // Nameless member → the avatar and the flow names both fall back to '?'.
    expect(screen.getAllByText('?').length).toBeGreaterThan(1)
  })

  it('FE-MOB-COSTT-037: follows the user display currency instead of the trip currency', async () => {
    seedStore(useSettingsStore, {
      settings: { ...useSettingsStore.getState().settings, default_currency: 'GBP' },
    })
    render(<MCostsTab planner={planner()} shell={buildShell()} />)
    await screen.findByText('+£12.50')
    expect(settlementBases).toEqual(['GBP'])
    expect(up(screen.getByText('costs.totalSpend'), 1).textContent).toContain('£92.50')
  })
})
