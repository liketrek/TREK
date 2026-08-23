import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MCostSheet from '../../../../src/mobile/screens/trip/sheets/MCostSheet'
import type { TripMember } from '../../../../src/components/Budget/BudgetPanelMemberChips'
import { clearExchangeRateCache } from '../../../../src/hooks/useExchangeRates'
import { useTripStore, type TripStoreState } from '../../../../src/store/tripStore'
import type { BudgetItem, BudgetItemMember } from '../../../../src/types'
import { buildBudgetItem } from '../../../helpers/factories'
import { localToday } from '../../../../src/components/Planner/today'
import { resetAllStores } from '../../../helpers/store'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-COSTSH-001 to FE-MOB-COSTSH-030
// The sheet reads its copy from useTranslation(), so assertions are English.
// EUR formats de-DE style: displayed amounts and inputs use a comma.

const PEOPLE = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
] as TripMember[]

// The traveller's own calendar day, not the UTC one — see components/Planner/today.ts.
const TODAY = localToday()

function member(user_id: number, amount: number | null): BudgetItemMember {
  return { user_id, paid: 0, username: user_id === 1 ? 'alice' : 'bob', amount }
}

let addBudgetItem: ReturnType<typeof vi.fn>
let updateBudgetItem: ReturnType<typeof vi.fn>
let deleteBudgetItem: ReturnType<typeof vi.fn>
let addToast: ReturnType<typeof vi.fn>

interface SheetOverrides {
  people?: TripMember[]
  me?: number
  base?: string
  editing?: BudgetItem | null
  prefill?: { name?: string; category?: string; amount?: number; reservationId?: number; placeId?: number }
}

function renderSheet(overrides: SheetOverrides = {}) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  const view = render(
    <MCostSheet
      tripId={1}
      base={overrides.base ?? 'EUR'}
      people={overrides.people ?? PEOPLE}
      me={overrides.me ?? 1}
      editing={overrides.editing ?? null}
      prefill={overrides.prefill}
      onClose={onClose}
      onSaved={onSaved}
    />,
  )
  return { ...view, onClose, onSaved }
}

const nameField = () => screen.getByPlaceholderText('e.g. Dinner, souvenirs, gas…')
const totalField = () => screen.getAllByPlaceholderText('0,00')[0]
const submit = () => screen.getByRole('button', { name: 'Add' })
const saveBtn = () => screen.getByRole('button', { name: 'Save' })

function fillBasics(name: string, total: string) {
  fireEvent.change(nameField(), { target: { value: name } })
  fireEvent.change(totalField(), { target: { value: total } })
}

const CAT_LABELS = ['Accommodation', 'Food & drink', 'Groceries', 'Transport', 'Flights', 'Activities', 'Sightseeing', 'Shopping', 'Fees & tickets', 'Health', 'Tips', 'Other']

describe('MCostSheet', () => {
  beforeEach(() => {
    resetAllStores()
    clearExchangeRateCache()
    // Seeded FX cache, fresh enough that the hook never reaches the network.
    localStorage.setItem('trek_fx_EUR', JSON.stringify({ rates: { EUR: 1, USD: 1.25 }, ts: Date.now() }))
    addBudgetItem = vi.fn(async () => buildBudgetItem({ id: 9 }))
    updateBudgetItem = vi.fn(async () => buildBudgetItem({ id: 9 }))
    deleteBudgetItem = vi.fn(async () => undefined)
    useTripStore.setState(
      { addBudgetItem, updateBudgetItem, deleteBudgetItem } as unknown as Partial<TripStoreState>,
    )
    addToast = vi.fn()
    ;(window as unknown as { __addToast: unknown }).__addToast = addToast
  })

  afterEach(() => {
    delete (window as unknown as { __addToast?: unknown }).__addToast
  })

  // The category moved from a row of eleven pills to a dropdown: the trigger
  // shows the current one, and the options only exist while it is open.
  const catTrigger = () => screen.getByRole('button', { name: new RegExp(`^(${CAT_LABELS.join('|')})$`) })
  const chooseCategory = (label: string) => {
    fireEvent.click(catTrigger())
    fireEvent.click(screen.getByRole('button', { name: label, pressed: false }))
  }

  it('FE-MOB-COSTSH-001: opens in add mode with everyone in an equal split and a blocked submit', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Add expense' })).toBeInTheDocument()
    expect(nameField()).toHaveValue('')
    expect(catTrigger()).toHaveTextContent('Food & drink')
    expect(screen.getByRole('button', { name: 'Y You' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'B bob' })).toBeInTheDocument()
    expect(submit()).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('FE-MOB-COSTSH-002: splits the typed total equally and saves the expense', async () => {
    const { onSaved } = renderSheet()
    // A comma is normalised to a dot before it reaches the state.
    fillBasics('Dinner', '85,50')

    expect(screen.getAllByText('€42.75')).toHaveLength(2)
    expect(screen.getByText('Split 2 ways · €42.75 each')).toBeInTheDocument()

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
    expect(addBudgetItem).toHaveBeenCalledWith(1, {
      name: 'Dinner',
      category: 'food',
      currency: 'EUR',
      payers: [{ user_id: 1, amount: 85.5 }],
      members: [{ user_id: 1, amount: null }, { user_id: 2, amount: null }],
      member_ids: [1, 2],
      expense_date: TODAY,
      total_price: 85.5,
      note: null,
      ticket_json: null,
    })
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-COSTSH-020: the category dropdown opens, marks the current pick and closes on choose (#1658)', () => {
    renderSheet()
    expect(screen.queryByRole('button', { name: 'Groceries' })).toBeNull()

    fireEvent.click(catTrigger())
    expect(screen.getByRole('button', { name: 'Food & drink', pressed: true })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Groceries', pressed: false }))
    expect(catTrigger()).toHaveTextContent('Groceries')
    expect(screen.queryByRole('button', { name: 'Sightseeing' })).toBeNull()
  })

  it('FE-MOB-COSTSH-021: a note typed on the phone is saved with the expense (#1658)', async () => {
    renderSheet()
    fillBasics('Pharmacy', '18')
    fireEvent.change(screen.getByPlaceholderText(/what it covered/i), { target: { value: 'Ben was ill, he pays this back' } })

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      note: 'Ben was ill, he pays this back',
    })))
  })

  it('FE-MOB-COSTSH-022: an existing note is loaded for editing, and a receipt blob never is (#1658)', () => {
    const { unmount } = renderSheet({ editing: buildBudgetItem({ id: 5, name: 'Chemist', note: 'reimburse from the kitty' }) })
    expect(screen.getByPlaceholderText(/what it covered/i)).toHaveValue('reimburse from the kitty')
    unmount()

    renderSheet({ editing: buildBudgetItem({ id: 6, name: 'Market', note: 'TICKETJSON:{"items":[]}' }) })
    expect(screen.getByPlaceholderText(/what it covered/i)).toHaveValue('')
  })

  it('FE-MOB-COSTSH-003: adopts the prefill and carries the reservation link into the payload', async () => {
    renderSheet({ prefill: { name: 'Ryokan', category: 'accommodation', amount: 240, reservationId: 77 } })
    expect(nameField()).toHaveValue('Ryokan')
    expect(totalField()).toHaveValue('240')
    expect(catTrigger()).toHaveTextContent('Accommodation')

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
    expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Ryokan', category: 'accommodation', total_price: 240, reservation_id: 77,
    }))
  })

  it('FE-MOB-COSTSH-003b: a place prefill carries the place link into the payload (#1298)', async () => {
    renderSheet({ prefill: { name: 'Louvre', category: 'activities', placeId: 12 } })
    expect(nameField()).toHaveValue('Louvre')

    fireEvent.change(totalField(), { target: { value: '34' } })
    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
    expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Louvre', category: 'activities', total_price: 34, place_id: 12,
    }))
    expect(addBudgetItem.mock.calls[0][1]).not.toHaveProperty('reservation_id')
  })

  it('FE-MOB-COSTSH-004: dropping a participant re-splits and shrinks the member list', async () => {
    renderSheet()
    fillBasics('Taxi', '30')
    fireEvent.click(screen.getByRole('button', { name: 'B bob' }))

    expect(screen.getByText('Split 1 ways · €30.00 each')).toBeInTheDocument()
    expect(screen.getAllByText('Tap to include')).toHaveLength(1)

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
    expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      members: [{ user_id: 1, amount: null }],
      member_ids: [1],
      payers: [{ user_id: 1, amount: 30 }],
    }))
  })

  it('FE-MOB-COSTSH-005: an expense nobody shares is saved without members but keeps its payer', async () => {
    renderSheet()
    fillBasics('Souvenir', '12')
    fireEvent.click(screen.getByRole('button', { name: 'Y You' }))
    fireEvent.click(screen.getByRole('button', { name: 'B bob' }))

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
    // The server derives total_price from the payer sum, so the payer has to go
    // out even with an empty split — otherwise the entry comes back at 0.
    expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      payers: [{ user_id: 1, amount: 12 }], members: [], member_ids: [],
    }))
  })

  it('FE-MOB-COSTSH-006: switching the category updates the pressed pill and the payload', async () => {
    renderSheet()
    fillBasics('Metro pass', '20')
    chooseCategory('Transport')
    expect(catTrigger()).toHaveTextContent('Transport')

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({ category: 'transport' })))
  })

  it('FE-MOB-COSTSH-007: a foreign currency shows the live conversion into the base', () => {
    renderSheet()
    fillBasics('Hotel', '100')
    expect(screen.queryByText(/live rate/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'EUR €' }))
    fireEvent.change(screen.getByPlaceholderText('...'), { target: { value: 'USD' } })
    fireEvent.click(screen.getByRole('button', { name: 'USD $' }))

    expect(screen.getByText('$100.00')).toBeInTheDocument()
    // 100 USD at 1.25 USD per EUR = 80 EUR.
    expect(screen.getByRole('dialog').textContent).toContain('80,00')
    expect(screen.getByText(/live rate/)).toBeInTheDocument()
  })

  it('FE-MOB-COSTSH-008: "No one paid yet" saves a planning entry without payers', async () => {
    renderSheet()
    fillBasics('Tickets', '60')
    fireEvent.click(screen.getByRole('button', { name: 'You' }))
    fireEvent.click(screen.getByRole('button', { name: 'No one paid yet' }))

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({ payers: [] })))
  })

  it('FE-MOB-COSTSH-009: multiple payers start out balanced on the current payer', () => {
    renderSheet()
    fillBasics('Group ticket', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Multiple people paid' }))

    const amounts = screen.getAllByPlaceholderText('0,00')
    // Total field plus the single active payer row.
    expect(amounts).toHaveLength(2)
    expect(amounts[1]).toHaveValue('100,00')

    // The hint next to an inactive payer is a second way into the same toggle.
    fireEvent.click(screen.getByRole('button', { name: 'Tap to include' }))
    expect(screen.getAllByPlaceholderText('0,00')[2]).toHaveValue('50,00')
  })

  it('FE-MOB-COSTSH-010: adding a second payer spreads the total and saves both', async () => {
    renderSheet()
    fillBasics('Group ticket', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Multiple people paid' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'B bob' })[0])

    const amounts = screen.getAllByPlaceholderText('0,00')
    expect(amounts[1]).toHaveValue('50,00')
    expect(amounts[2]).toHaveValue('50,00')

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      payers: [{ user_id: 1, amount: 50 }, { user_id: 2, amount: 50 }],
    })))
  })

  it('FE-MOB-COSTSH-011: a typed payer amount is pinned and the rest absorbs the remainder', () => {
    renderSheet()
    fillBasics('Group ticket', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Multiple people paid' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'B bob' })[0])

    fireEvent.change(screen.getAllByPlaceholderText('0,00')[1], { target: { value: '30' } })
    const amounts = screen.getAllByPlaceholderText('0,00')
    expect(amounts[1]).toHaveValue('30')
    expect(amounts[2]).toHaveValue('70,00')
  })

  it('FE-MOB-COSTSH-012: payers that do not add up block the save and explain why', () => {
    renderSheet()
    fillBasics('Group ticket', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Multiple people paid' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'B bob' })[0])

    fireEvent.change(screen.getAllByPlaceholderText('0,00')[1], { target: { value: '30' } })
    fireEvent.change(screen.getAllByPlaceholderText('0,00')[2], { target: { value: '30' } })

    expect(screen.getByText(/Payer amounts must add up to/)).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-COSTSH-013: going back to a single payer keeps the remaining one selected', () => {
    renderSheet()
    fillBasics('Group ticket', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Multiple people paid' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'B bob' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Y You' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'One person paid' }))

    expect(screen.getByRole('button', { name: 'bob' })).toBeInTheDocument()
    expect(screen.queryByText(/Payer amounts must add up to/)).not.toBeInTheDocument()
  })

  it('FE-MOB-COSTSH-014: a custom split must match the total before it can be saved', async () => {
    renderSheet()
    fillBasics('Dinner', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }))

    const shares = screen.getAllByPlaceholderText('50,00')
    expect(shares).toHaveLength(2)
    fireEvent.change(shares[0], { target: { value: '30' } })
    expect(screen.getByText('€30.00 / €100.00')).toBeInTheDocument()
    expect(submit()).toBeDisabled()

    // The remaining share now suggests what is left of the total.
    fireEvent.change(screen.getByPlaceholderText('70,00'), { target: { value: '70' } })
    expect(screen.getByText('Split 2 ways · €50.00 each')).toBeInTheDocument()

    fireEvent.click(submit())
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      members: [{ user_id: 1, amount: 30 }, { user_id: 2, amount: 70 }],
    })))
  })

  it('FE-MOB-COSTSH-015: a custom share rejects a third decimal and is cleared when the member drops out', () => {
    renderSheet()
    fillBasics('Dinner', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }))

    const share = screen.getAllByPlaceholderText('50,00')[0]
    fireEvent.change(share, { target: { value: '30.123' } })
    expect(share).toHaveValue('')
    fireEvent.change(share, { target: { value: '30,5' } })
    expect(screen.getByDisplayValue('30,5')).toBe(share)

    fireEvent.click(screen.getByRole('button', { name: 'Y You' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tap to include' }))
    expect(screen.getAllByPlaceholderText('50,00')[0]).toHaveValue('')
  })

  it('FE-MOB-COSTSH-016: ticket mode derives the total and the per-person shares from the items', async () => {
    renderSheet()
    fireEvent.change(nameField(), { target: { value: 'Izakaya' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ticket' }))
    expect(totalField()).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0])
    fireEvent.change(screen.getByPlaceholderText('What was it for?'), { target: { value: 'Ramen' } })
    fireEvent.change(screen.getAllByPlaceholderText('0,00')[1], { target: { value: '20' } })

    expect(totalField()).toHaveValue('20,00')
    expect(screen.getAllByText('€10.00')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[1])
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
    expect(addBudgetItem).toHaveBeenCalledWith(1, expect.objectContaining({
      total_price: 20,
      members: [{ user_id: 1, amount: 10 }, { user_id: 2, amount: 10 }],
      ticket_json: '{"items":[{"name":"Ramen","price":"20","parts":[1,2]}]}',
    }))
  })

  it('FE-MOB-COSTSH-017: a ticket item without a name or a participant blocks the save', () => {
    renderSheet()
    fireEvent.change(nameField(), { target: { value: 'Izakaya' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ticket' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0])

    const footerSubmit = () => screen.getAllByRole('button', { name: 'Add' })[1]
    fireEvent.change(screen.getAllByPlaceholderText('0,00')[1], { target: { value: '20' } })
    expect(footerSubmit()).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('What was it for?'), { target: { value: 'Ramen' } })
    expect(footerSubmit()).toBeEnabled()

    // Un-ticking everyone makes the item unsplittable again.
    fireEvent.click(screen.getByRole('button', { name: 'Y You' }))
    fireEvent.click(screen.getByRole('button', { name: 'B bob' }))
    expect(footerSubmit()).toBeDisabled()
  })

  it('FE-MOB-COSTSH-018: removing the last ticket item drops the share breakdown', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Ticket' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0])
    fireEvent.change(screen.getByPlaceholderText('What was it for?'), { target: { value: 'Ramen' } })
    expect(screen.getAllByText('Split')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByPlaceholderText('What was it for?')).not.toBeInTheDocument()
    expect(screen.getAllByText('Split')).toHaveLength(1)
  })

  it('FE-MOB-COSTSH-019: editing loads name, currency, legacy category and the custom shares', () => {
    const editing = buildBudgetItem({
      id: 5, name: 'Flight to Osaka', category: 'Flight', currency: 'usd', total_price: 60,
      expense_date: '2026-03-04',
      members: [member(1, 20), member(2, 40)],
      payers: [{ user_id: 2, amount: 60 }],
    })
    renderSheet({ editing })

    expect(screen.getByRole('dialog', { name: 'Edit expense' })).toBeInTheDocument()
    expect(nameField()).toHaveValue('Flight to Osaka')
    expect(catTrigger()).toHaveTextContent('Flights')
    expect(screen.getByRole('button', { name: 'USD $' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'bob' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom' })).toHaveClass('bg-m-act')
    // USD renders with a dot, so the total and both shares share this placeholder.
    const amounts = screen.getAllByPlaceholderText('0.00')
    expect(amounts[0]).toHaveValue('60')
    expect(amounts[1]).toHaveValue('20')
    expect(amounts[2]).toHaveValue('40')
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('FE-MOB-COSTSH-020: saving an edit goes through updateBudgetItem', async () => {
    const editing = buildBudgetItem({
      id: 5, name: 'Dinner', category: 'food', currency: 'EUR', total_price: 60,
      members: [member(1, null), member(2, null)],
      payers: [{ user_id: 1, amount: 60 }],
    })
    const { onSaved } = renderSheet({ editing })
    fireEvent.change(nameField(), { target: { value: 'Dinner & drinks' } })
    fireEvent.click(saveBtn())

    await waitFor(() => expect(updateBudgetItem).toHaveBeenCalledTimes(1))
    expect(updateBudgetItem).toHaveBeenCalledWith(1, 5, expect.objectContaining({
      name: 'Dinner & drinks',
      total_price: 60,
      members: [{ user_id: 1, amount: null }, { user_id: 2, amount: null }],
    }))
    expect(addBudgetItem).not.toHaveBeenCalled()
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-COSTSH-021: an expense with two payers reopens in multi-payer mode', () => {
    const editing = buildBudgetItem({
      id: 6, name: 'Rental car', category: 'transport', currency: 'EUR', total_price: 100,
      members: [member(1, null), member(2, null)],
      payers: [{ user_id: 1, amount: 40 }, { user_id: 2, amount: 60 }],
    })
    renderSheet({ editing })

    expect(screen.getByRole('button', { name: 'One person paid' })).toBeInTheDocument()
    const amounts = screen.getAllByPlaceholderText('0,00')
    expect(amounts[1]).toHaveValue('40')
    expect(amounts[2]).toHaveValue('60')
    expect(screen.queryByText(/Payer amounts must add up to/)).not.toBeInTheDocument()
  })

  it('FE-MOB-COSTSH-022: an expense nobody paid reopens on the placeholder payer', () => {
    const editing = buildBudgetItem({
      id: 7, name: 'Museum', category: 'sightseeing', currency: 'EUR', total_price: 0,
      members: [], payers: [],
    })
    renderSheet({ editing })

    expect(screen.getByRole('button', { name: 'No one paid yet' })).toBeInTheDocument()
    expect(totalField()).toHaveValue('')
    expect(saveBtn()).toBeDisabled()
  })

  it('FE-MOB-COSTSH-023: a stored ticket note reopens as editable ticket rows', () => {
    const editing = buildBudgetItem({
      id: 8, name: 'Izakaya', category: 'food', currency: 'EUR', total_price: 20,
      members: [member(1, 10), member(2, 10)],
      note: 'TICKETJSON:{"items":[{"name":"Ramen","price":"20","parts":[1,2]}]}',
    })
    renderSheet({ editing })

    expect(screen.getByRole('button', { name: 'Ticket' })).toHaveClass('bg-m-act')
    expect(screen.getByPlaceholderText('What was it for?')).toHaveValue('Ramen')
    expect(screen.getAllByPlaceholderText('0,00')[1]).toHaveValue('20')
    expect(totalField()).toHaveValue('20,00')
  })

  it('FE-MOB-COSTSH-024: a corrupt ticket note still opens the sheet with an empty item list', () => {
    const editing = buildBudgetItem({
      id: 9, name: 'Izakaya', category: 'food', currency: 'EUR', total_price: 20,
      members: [], note: 'TICKETJSON:{not json',
    })
    renderSheet({ editing })

    expect(screen.getByRole('button', { name: 'Ticket' })).toHaveClass('bg-m-act')
    expect(screen.queryByPlaceholderText('What was it for?')).not.toBeInTheDocument()
    expect(saveBtn()).toBeDisabled()
  })

  it('FE-MOB-COSTSH-025: deleting takes two taps and warns in between', async () => {
    const editing = buildBudgetItem({ id: 5, name: 'Dinner', category: 'food', currency: 'EUR', total_price: 60, members: [] })
    const { onSaved } = renderSheet({ editing })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(addToast).toHaveBeenCalledWith('Tap again to delete', 'warning', undefined)
    expect(deleteBudgetItem).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('--m-st-danger')

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteBudgetItem).toHaveBeenCalledWith(1, 5))
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-COSTSH-026: a failing delete disarms the button and reports the error', async () => {
    deleteBudgetItem.mockRejectedValueOnce(new Error('locked'))
    const editing = buildBudgetItem({ id: 5, name: 'Dinner', category: 'food', currency: 'EUR', total_price: 60, members: [] })
    const { onSaved } = renderSheet({ editing })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Unknown error', 'error', undefined))
    expect(onSaved).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' }).className).not.toContain('--m-st-danger'))
  })

  it('FE-MOB-COSTSH-027: a failing save reports the error and lets the user retry', async () => {
    addBudgetItem.mockRejectedValueOnce(new Error('offline'))
    const { onSaved } = renderSheet()
    fillBasics('Dinner', '20')
    fireEvent.click(submit())

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Unknown error', 'error', undefined))
    expect(onSaved).not.toHaveBeenCalled()
    await waitFor(() => expect(submit()).toBeEnabled())
  })

  it('FE-MOB-COSTSH-028: cancel reports the close only after the exit animation', () => {
    vi.useFakeTimers()
    try {
      const { onClose } = renderSheet()
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(onClose).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(280) })
      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MOB-COSTSH-029: renders member avatars and flags guests', () => {
    const people = [
      { id: 1, username: 'alice', avatar_url: '/uploads/avatars/alice.png' },
      { id: 2, username: 'bob', avatar_url: null, is_guest: true },
    ] as TripMember[]
    renderSheet({ people })

    // The sheet lives in a portal, so query from the document root.
    expect(document.querySelector('img[src="/uploads/avatars/alice.png"]')).not.toBeNull()
    expect(screen.getByText('Guest')).toBeInTheDocument()
  })

  // #1567 all over again: an expense entered at 23:00 in Tokyo belongs on that
  // evening's day, not on the UTC date that has not started there yet.
  it('FE-MOB-COSTSH-031: the default expense date comes off the local clock, not UTC', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      // East of Greenwich the two dates part just after midnight, west of it just
      // before, so pick the edge that this runner's zone actually has.
      const hour = new Date(2026, 7, 12).getTimezoneOffset() > 0 ? 23 : 0
      const now = new Date(2026, 7, 12, hour, 30, 0)
      vi.setSystemTime(now)
      const { onSaved } = renderSheet()
      fillBasics('Ramen', '12')
      fireEvent.click(submit())

      await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1))
      expect(addBudgetItem.mock.calls[0][1]).toMatchObject({ expense_date: '2026-08-12' })
      // Guard the guard: in a UTC runner there is no drift to catch.
      if (now.getTimezoneOffset() !== 0) {
        expect(now.toISOString().slice(0, 10)).not.toBe('2026-08-12')
      }
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MOB-COSTSH-030: a currency without a known symbol falls back to its code', () => {
    localStorage.setItem('trek_fx_XTS', JSON.stringify({ rates: { XTS: 1 }, ts: Date.now() }))
    renderSheet({ base: 'XTS' })
    fireEvent.change(nameField(), { target: { value: 'Test purchase' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '10' } })

    expect(screen.getAllByText('XTS 5.00')).toHaveLength(2)
    expect(screen.getByText('Split 2 ways · XTS 5.00 each')).toBeInTheDocument()
  })
})
