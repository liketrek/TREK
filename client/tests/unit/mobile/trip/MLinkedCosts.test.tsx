import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import MLinkedCosts from '../../../../src/mobile/screens/trip/sheets/MLinkedCosts'
import { useTripStore } from '../../../../src/store/tripStore'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import { formatMoney } from '../../../../src/utils/formatters'
import type { BudgetItem } from '../../../../src/types'
import { buildBudgetItem, buildTrip } from '../../../helpers/factories'
import { server } from '../../../helpers/msw/server'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-LINKCOST-001 to FE-MOB-LINKCOST-015
// MLinkedCosts reads the real translations (it is shared by three sheets), so
// the assertions use the English copy rather than echoed keys.

// getByText collapses the no-break space Intl puts between amount and symbol.
const money = (amount: number, currency: string) => formatMoney(amount, currency, 'en').replace(/\s/g, ' ')

const flight = buildBudgetItem({ id: 11, trip_id: 1, name: 'Flight', total_price: 420, currency: 'EUR', category: 'flights', reservation_id: 9 })
const upgrade = buildBudgetItem({ id: 12, trip_id: 1, name: 'Seat upgrade', total_price: 80, currency: 'USD', category: 'fees', reservation_id: 9 })
const museum = buildBudgetItem({ id: 13, trip_id: 1, name: 'Museum pass', total_price: 25, category: 'activities', place_id: 4 })
const souvenirs = buildBudgetItem({ id: 14, trip_id: 1, name: 'Souvenirs', total_price: 18, currency: 'EUR', category: 'shopping' })

let addToast: ReturnType<typeof vi.fn>

function setup(props: Partial<React.ComponentProps<typeof MLinkedCosts>> = {}) {
  const onCreate = vi.fn()
  const onEdit = vi.fn()
  const view = render(
    <MLinkedCosts reservationId={9} hintKey="reservations.createExpenseHint" createDisabled={false} onCreate={onCreate} onEdit={onEdit} {...props} />,
  )
  return { ...view, onCreate, onEdit }
}

/** Records every expense update and answers with the merged item. */
function captureUpdates() {
  const bodies: { id: number; body: Record<string, unknown> }[] = []
  server.use(
    http.put('/api/trips/1/budget/:itemId', async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push({ id: Number(params.itemId), body })
      const current = useTripStore.getState().budgetItems.find(i => i.id === Number(params.itemId))
      return HttpResponse.json({ item: { ...current, ...body } })
    }),
    http.get('/api/trips/1/reservations', () => HttpResponse.json({ reservations: [] })),
  )
  return bodies
}

const linkPill = () => screen.getByRole('button', { name: 'Link' })
const rowOf = (name: string) => screen.getByText(name).closest('button')!.parentElement as HTMLElement

describe('MLinkedCosts', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }), budgetItems: [flight, upgrade, museum, souvenirs] })
    addToast = vi.fn()
    window.__addToast = addToast as unknown as typeof window.__addToast
  })

  afterEach(() => {
    delete window.__addToast
  })

  it('FE-MOB-LINKCOST-001: an unsaved record offers only "create expense", with the hint', () => {
    seedStore(useTripStore, { budgetItems: [souvenirs] })
    setup({ reservationId: null })
    expect(screen.getByText('Costs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create expense/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Link' })).not.toBeInTheDocument()
    expect(screen.getByText('Saves the booking, then opens the Costs editor.')).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-002: create follows createDisabled and calls onCreate', () => {
    const { onCreate, rerender } = setup({ createDisabled: true })
    const create = screen.getByRole('button', { name: /Create expense/ })
    expect(create).toBeDisabled()
    rerender(<MLinkedCosts reservationId={9} hintKey="reservations.createExpenseHint" createDisabled={false} onCreate={onCreate} onEdit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Create expense/ }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-LINKCOST-003: the linked expenses are listed with category and amount, and the hint goes', () => {
    setup()
    expect(screen.getByText('Linked expenses')).toBeInTheDocument()
    expect(within(rowOf('Flight')).getByText('Flights')).toBeInTheDocument()
    expect(within(rowOf('Flight')).getByText(money(420, 'EUR'))).toBeInTheDocument()
    expect(within(rowOf('Seat upgrade')).getByText(money(80, 'USD'))).toBeInTheDocument()
    expect(screen.queryByText('Museum pass')).not.toBeInTheDocument()
    expect(screen.queryByText('Saves the booking, then opens the Costs editor.')).not.toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-004: tapping a linked row opens it for editing', () => {
    const { onEdit } = setup()
    fireEvent.click(screen.getByText('Seat upgrade'))
    expect(onEdit).toHaveBeenCalledWith(upgrade)
  })

  it('FE-MOB-LINKCOST-005: unlink clears the link and keeps the expense', async () => {
    const bodies = captureUpdates()
    setup()
    fireEvent.click(within(rowOf('Seat upgrade')).getByRole('button', { name: 'Unlink, keep the expense' }))
    await waitFor(() => expect(bodies).toEqual([{ id: 12, body: { reservation_id: null } }]))
    await waitFor(() => expect(screen.queryByText('Seat upgrade')).not.toBeInTheDocument())
    expect(useTripStore.getState().budgetItems.some((i: BudgetItem) => i.id === 12)).toBe(true)
  })

  it('FE-MOB-LINKCOST-006: delete removes the expense through the store', async () => {
    let deleted: string | null = null
    server.use(http.delete('/api/trips/1/budget/:itemId', ({ params }) => {
      deleted = String(params.itemId)
      return HttpResponse.json({ success: true })
    }))
    setup()
    fireEvent.click(within(rowOf('Flight')).getByRole('button', { name: 'Remove expense' }))
    await waitFor(() => expect(deleted).toBe('11'))
    expect(screen.queryByText('Flight')).not.toBeInTheDocument()
    expect(useTripStore.getState().budgetItems.some((i: BudgetItem) => i.id === 11)).toBe(false)
  })

  it('FE-MOB-LINKCOST-007: a failed delete is reported and the expense comes back', async () => {
    server.use(http.delete('/api/trips/1/budget/11', () => HttpResponse.json({ error: 'nope' }, { status: 500 })))
    setup()
    fireEvent.click(within(rowOf('Flight')).getByRole('button', { name: 'Remove expense' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Unknown error', 'error', undefined))
    expect(screen.getByText('Flight')).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-008: without a trip, delete does nothing', () => {
    seedStore(useTripStore, { trip: null })
    setup()
    fireEvent.click(within(rowOf('Flight')).getByRole('button', { name: 'Remove expense' }))
    expect(useTripStore.getState().budgetItems).toHaveLength(4)
  })

  it('FE-MOB-LINKCOST-009: the link pill folds a list of the unlinked expenses in and out', () => {
    setup()
    expect(linkPill()).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(linkPill())
    expect(linkPill()).toHaveAttribute('aria-expanded', 'true')
    const option = screen.getByText('Souvenirs').closest('button') as HTMLElement
    expect(option).toHaveTextContent(money(18, 'EUR'))
    // Only expenses without any link are offered; a short list has no search field.
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument()
    expect(screen.queryByText('Museum pass')).not.toBeInTheDocument()
    fireEvent.click(linkPill())
    expect(screen.queryByText('Souvenirs')).not.toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-010: tapping an offered expense links it and folds the list away', async () => {
    const bodies = captureUpdates()
    setup()
    fireEvent.click(linkPill())
    fireEvent.click(screen.getByText('Souvenirs'))
    await waitFor(() => expect(bodies).toEqual([{ id: 14, body: { reservation_id: 9 } }]))
    await waitFor(() => expect(linkPill()).toHaveAttribute('aria-expanded', 'false'))
    // Now it is one of the linked rows.
    expect(within(rowOf('Souvenirs')).getByRole('button', { name: 'Unlink, keep the expense' })).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-011: with nothing left to link the list says so', () => {
    seedStore(useTripStore, { budgetItems: [flight, museum] })
    setup()
    fireEvent.click(linkPill())
    expect(screen.getByText('No unlinked expenses')).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-012: from six candidates on the list can be searched', () => {
    const many = ['Snacks', 'Taxi', 'Tips', 'Water', 'Museum shop', 'Postcards'].map((name, i) =>
      buildBudgetItem({ id: 40 + i, trip_id: 1, name, total_price: 5 }))
    seedStore(useTripStore, { budgetItems: many })
    setup()
    fireEvent.click(linkPill())
    const search = screen.getByPlaceholderText('Search')
    fireEvent.change(search, { target: { value: '  TA ' } })
    expect(screen.getByText('Taxi')).toBeInTheDocument()
    expect(screen.queryByText('Postcards')).not.toBeInTheDocument()
    expect(screen.queryByText('Snacks')).not.toBeInTheDocument()
    fireEvent.change(search, { target: { value: 'zeppelin' } })
    expect(screen.getByText('No unlinked expenses')).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-013: a linked pick clears the search for the next time', async () => {
    const many = ['Snacks', 'Taxi', 'Tips', 'Water', 'Museum shop', 'Postcards'].map((name, i) =>
      buildBudgetItem({ id: 50 + i, trip_id: 1, name, total_price: 5 }))
    seedStore(useTripStore, { budgetItems: many })
    captureUpdates()
    setup({ reservationId: null, placeId: 4, hintKey: 'places.createExpenseHint' })
    fireEvent.click(linkPill())
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'tax' } })
    fireEvent.click(screen.getByText('Taxi'))
    await waitFor(() => expect(linkPill()).toHaveAttribute('aria-expanded', 'false'))
    fireEvent.click(linkPill())
    // Five candidates left, so the search field is gone and every one is listed again.
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument()
    expect(screen.getByText('Snacks')).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-014: on a place it shows and links through place_id, with the place hint', async () => {
    const bodies = captureUpdates()
    setup({ reservationId: null, placeId: 4, hintKey: 'places.createExpenseHint' })
    expect(screen.getByText('Museum pass')).toBeInTheDocument()
    expect(screen.queryByText('Flight')).not.toBeInTheDocument()
    fireEvent.click(linkPill())
    fireEvent.click(screen.getByText('Souvenirs'))
    await waitFor(() => expect(bodies).toEqual([{ id: 14, body: { place_id: 4 } }]))

    seedStore(useTripStore, { budgetItems: [souvenirs] })
    expect(await screen.findByText('Saves the place, then opens the Costs editor.')).toBeInTheDocument()
  })

  it('FE-MOB-LINKCOST-015: an expense without a currency reads in the trip currency, not the display one (#2525)', () => {
    const deposit = buildBudgetItem({ id: 15, trip_id: 1, name: 'Hotel deposit', total_price: 120, currency: null, category: 'accommodation', reservation_id: 9 })
    const tram = buildBudgetItem({ id: 16, trip_id: 1, name: 'Tram pass', total_price: 9, currency: null, category: 'transport' })
    seedStore(useTripStore, { budgetItems: [deposit, tram] })
    seedStore(useSettingsStore, { settings: { default_currency: 'USD' } })
    setup()
    expect(within(rowOf('Hotel deposit')).getByText(money(120, 'EUR'))).toBeInTheDocument()
    expect(screen.queryByText(money(120, 'USD'))).not.toBeInTheDocument()
    fireEvent.click(linkPill())
    expect(screen.getByText('Tram pass').closest('button')).toHaveTextContent(money(9, 'EUR'))
  })
})
