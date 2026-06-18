// FE-COMP-COSTS: settlements surfaced inline in the Costs ledger (issue #1241)
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildTrip, buildBudgetItem } from '../../../tests/helpers/factories'
import CostsPanel from './CostsPanel'

const tripMembers = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
]

beforeEach(() => {
  resetAllStores()
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }) })
})

describe('CostsPanel — settlements in the ledger', () => {
  it('renders a settle-up payment as a ledger row with an undo action', async () => {
    const item = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Dinner' }), total_price: 90, expense_date: '2025-06-15' }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () =>
        HttpResponse.json({
          balances: [],
          flows: [],
          settlements: [
            { id: 7, trip_id: 1, from_user_id: 2, to_user_id: 1, amount: 30, created_at: '2025-06-16 10:00:00', from_username: 'bob', to_username: 'alice' },
          ],
        })
      ),
    )
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    // The expense and the settlement (payment) both appear in the unified ledger.
    await screen.findByText('Dinner')
    await screen.findByText('Payment')
    // The payment row exposes an inline undo (no need to open a separate History modal).
    expect(screen.getByTitle('Undo')).toBeInTheDocument()
  })

  it('records a manual payment via the Add payment button', async () => {
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget/settlements', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ settlement: { id: 1, ...posted } })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add payment' }))
    await user.type(await screen.findByPlaceholderText('0.00'), '25')
    // The footer submit is the second "Add payment" control once the modal is open.
    const addButtons = screen.getAllByRole('button', { name: 'Add payment' })
    const submit = addButtons[addButtons.length - 1]
    await user.click(submit)
    await waitFor(() => expect(posted).toMatchObject({ amount: 25 }))
  })

  it('hides payment rows while a text search is active', async () => {
    const item = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Dinner' }), total_price: 90, expense_date: '2025-06-15' }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () =>
        HttpResponse.json({
          balances: [],
          flows: [],
          settlements: [
            { id: 7, trip_id: 1, from_user_id: 2, to_user_id: 1, amount: 30, created_at: '2025-06-16 10:00:00', from_username: 'bob', to_username: 'alice' },
          ],
        })
      ),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await screen.findByText('Payment')
    await user.type(screen.getByPlaceholderText('Search expenses…'), 'Dinner')
    // Payment rows have no name, so a search hides them while the matching expense stays.
    expect(screen.queryByText('Payment')).not.toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('auto-splits the total across participants and rebalances a pinned amount on save', async () => {
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item: { ...buildBudgetItem({ trip_id: 1, name: 'Dinner' }), id: 5 } })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    await user.type(await screen.findByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'Dinner')
    const nums = () => screen.getAllByRole('spinbutton') as HTMLInputElement[]
    await user.type(nums()[0], '100') // total → auto equal-split across the 2 participants
    await waitFor(() => expect(nums()[1].value).toBe('50'))
    expect(nums()[2].value).toBe('50')
    // Pin the first participant to 30 → the other non-pinned field rebalances to 70.
    await user.clear(nums()[1]); await user.type(nums()[1], '30')
    await waitFor(() => expect(nums()[2].value).toBe('70'))

    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    await user.click(addBtns[addBtns.length - 1]) // footer submit
    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted!.total_price).toBe(100)
    expect(posted!.payers).toEqual(expect.arrayContaining([
      expect.objectContaining({ user_id: 1, amount: 30 }),
      expect.objectContaining({ user_id: 2, amount: 70 }),
    ]))
  })

  it('marks an expense with no payer as Unfinished', async () => {
    const item = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Hotel' }), total_price: 90, payers: [], members: [{ user_id: 1, username: 'alice', paid: 0 }] }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
    )
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)
    await screen.findByText('Hotel')
    expect(screen.getByText('Unfinished')).toBeInTheDocument()
  })
})
