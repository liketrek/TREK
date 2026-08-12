// FE-COMP-COSTS: settlements surfaced inline in the Costs ledger (issue #1241)
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
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

  it('supports custom split amounts on save', async () => {
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
    const nums = () => screen.getAllByPlaceholderText('0.00') as HTMLInputElement[]
    await user.type(nums()[0], '100') // total = 100

    await user.click(screen.getByRole('button', { name: /Custom/i }))

    const customInputs = screen.getAllByPlaceholderText('50.00')
    await user.type(customInputs[0], '30')
    await user.type(customInputs[1], '70')

    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    await user.click(addBtns[addBtns.length - 1]) // footer submit
    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted!.total_price).toBe(100)
    expect(posted!.payers).toEqual([
      expect.objectContaining({ amount: 100 })
    ])
    expect(posted!.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ user_id: 1, amount: 30 }),
      expect.objectContaining({ user_id: 2, amount: 70 }),
    ]))
  })

  it('accepts a comma as the decimal separator in the total amount (#1256)', async () => {
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item: { ...buildBudgetItem({ trip_id: 1, name: 'AirTags' }), id: 6 } })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    await user.type(await screen.findByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'AirTags')
    await user.type(screen.getAllByPlaceholderText('0.00')[0], '39,99') // comma → normalized to 39.99

    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    await user.click(addBtns[addBtns.length - 1]) // footer submit
    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted!.total_price).toBe(39.99)
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

  it('sums only unfinished expenses in the Outstanding amount card', async () => {
    // Display in the trip's own currency so FX conversion is an identity — keeps the asserted sum deterministic.
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } })
    const paid = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Dinner' }), total_price: 60, payers: [{ user_id: 1, amount: 60, username: 'alice' }], members: [{ user_id: 1, username: 'alice', paid: 1 }] }
    const unfinishedA = { ...buildBudgetItem({ trip_id: 1, category: 'lodging', name: 'Hotel' }), total_price: 90, payers: [], members: [{ user_id: 1, username: 'alice', paid: 0 }] }
    const unfinishedB = { ...buildBudgetItem({ trip_id: 1, category: 'transport', name: 'Taxi' }), total_price: 30, payers: [], members: [{ user_id: 1, username: 'alice', paid: 0 }] }
    const zero = { ...buildBudgetItem({ trip_id: 1, category: 'misc', name: 'Freebie' }), total_price: 0, payers: [], members: [{ user_id: 1, username: 'alice', paid: 0 }] }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [paid, unfinishedA, unfinishedB, zero] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
    )
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    // Footer only shows the count once unfinished expenses have loaded.
    const foot = await screen.findByText('expenses need a payer')
    expect(foot).toHaveTextContent('2 expenses need a payer') // the two payer-less, non-zero expenses
    // Sum is 90 + 30 = 120 — the paid (60) and zero-total items are excluded.
    // Sum is 90 + 30 = 120 — the paid (60) and zero-total items are excluded.
    const card = screen.getByText('Outstanding amount').closest('div[style*="border-radius: 22"]')
    expect(card).toHaveTextContent('120') // 120,00 € (locale separator), i.e. 90 + 30
  })

  it('records a recorded-total expense with nobody to split with (#1286)', async () => {
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item: { ...buildBudgetItem({ trip_id: 1, name: 'Hotel' }), id: 9 } })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    await user.type(await screen.findByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'Hotel')
    await user.type(screen.getAllByPlaceholderText('0.00')[0], '120') // total only, paid on-site later

    // Deselect everyone — the cost is recorded without a split (the bug: this was blocked).
    // The participant toggles are buttons; the same names also appear as plain text in
    // the Balances sidebar, so target the buttons specifically.
    await user.click(screen.getByRole('button', { name: /alice/i }))
    await user.click(screen.getByRole('button', { name: /bob/i }))

    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    const submit = addBtns[addBtns.length - 1] // footer submit
    expect(submit).not.toBeDisabled()
    await user.click(submit)

    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted!.total_price).toBe(120)
    expect(posted!.member_ids).toEqual([])
    expect(posted!.payers).toEqual([])
  })

  it('keeps "no one paid yet" when reopening a payer-less expense (#1533)', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true })
    let put: Record<string, unknown> | null = null
    const item = {
      ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Hotel' }),
      id: 5,
      total_price: 120,
      payers: [],
      members: [{ user_id: 1, username: 'alice', paid: 0 }, { user_id: 2, username: 'bob', paid: 0 }],
    }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.put('/api/trips/1/budget/5', async ({ request }) => {
        put = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await screen.findByText('Hotel')
    await user.click(screen.getByTitle('Edit'))

    // Nobody paid this expense — reopening it must not silently reselect "You".
    expect(await screen.findByRole('button', { name: 'No one paid yet' })).toBeInTheDocument()

    // …and saving an untouched edit must not assign the current user as payer.
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(put).toBeTruthy())
    expect(put!.payers).toEqual([])
  })

  it('still defaults a brand-new expense to "You" as the payer', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true })
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    expect(await screen.findByRole('button', { name: 'You' })).toBeInTheDocument()
  })

  // ── Multi-payer (#1426 regression) ─────────────────────────────────────────
  // 3.2.0 collapsed payers[] to a single payer, so a bill fronted by two people
  // credited all of it to one and skewed settle-up. The ledger always supported N
  // payers; only the form could no longer send them.

  it('records an expense paid by two people with their own amounts', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true })
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item: { ...buildBudgetItem({ trip_id: 1, name: 'Dinner' }), id: 11 } })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    await user.type(await screen.findByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'Dinner')
    await user.type(screen.getAllByPlaceholderText('0.00')[0], '90')

    await user.click(screen.getByRole('button', { name: 'Multiple people paid' }))

    // Alice (me) is seeded as the sole payer; including Bob rebalances to 45/45.
    await user.click(screen.getAllByTestId('payer-toggle')[1])
    expect(screen.getAllByTestId('payer-amount').map(i => (i as HTMLInputElement).value))
      .toEqual(['45.00', '45.00'])

    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    await user.click(addBtns[addBtns.length - 1])

    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted!.total_price).toBe(90)
    expect(posted!.payers).toEqual(expect.arrayContaining([
      { user_id: 1, amount: 45 },
      { user_id: 2, amount: 45 },
    ]))
    expect(posted!.payers).toHaveLength(2)
  })

  it('blocks saving when the payer amounts do not add up to the total', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true })
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item: buildBudgetItem({ trip_id: 1, name: 'Dinner' }) })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    await user.type(await screen.findByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'Dinner')
    await user.type(screen.getAllByPlaceholderText('0.00')[0], '90')
    await user.click(screen.getByRole('button', { name: 'Multiple people paid' }))
    await user.click(screen.getAllByTestId('payer-toggle')[1])

    // Pin both payers at 20 of a 90 bill, so nobody is left to absorb the rest.
    const amounts = () => screen.getAllByTestId('payer-amount') as HTMLInputElement[]
    await user.clear(amounts()[0])
    await user.type(amounts()[0], '20')
    await user.clear(amounts()[1])
    await user.type(amounts()[1], '20')

    // An unbalanced payer list would make the server re-derive total_price as 40.
    expect(screen.getByText(/must add up to/i)).toBeInTheDocument()
    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    expect(addBtns[addBtns.length - 1]).toBeDisabled()
    expect(posted).toBeNull()
  })

  it('reopens a two-payer expense with both payers intact', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true })
    let put: Record<string, unknown> | null = null
    const item = {
      ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Dinner' }),
      id: 7,
      total_price: 90,
      payers: [{ user_id: 1, amount: 45, username: 'alice' }, { user_id: 2, amount: 45, username: 'bob' }],
      members: [{ user_id: 1, username: 'alice', paid: 0 }, { user_id: 2, username: 'bob', paid: 0 }],
    }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.put('/api/trips/1/budget/7', async ({ request }) => {
        put = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await screen.findByText('Dinner')
    await user.click(screen.getByTitle('Edit'))

    // Loading used to be payers.find(...), which silently dropped the second payer.
    const amounts = await screen.findAllByTestId('payer-amount')
    expect(amounts.map(i => (i as HTMLInputElement).value)).toEqual(['45', '45'])

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(put).toBeTruthy())
    expect(put!.payers).toHaveLength(2)
  })

  it('exports the expenses as a CSV download (#1500)', async () => {
    // Display in the trip's own currency so FX conversion is an identity.
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } })
    let exported: Blob | null = null
    const createObjURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(b => { exported = b as Blob; return 'blob:mock' })
    const revokeObjURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const item = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Dinner; tapas' }), total_price: 90, expense_date: '2025-06-15' }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await screen.findByText('Dinner; tapas')
    await user.click(screen.getByTitle('Export CSV'))

    expect(exported).toBeTruthy()
    const text = await exported!.text()
    expect(text).toContain('Date;Name;Category;Amount;Currency;Amount (EUR);Note')
    expect(text).toContain('"Dinner; tapas"') // separator inside the name gets quoted
    expect(text).toContain('Food & drink')    // category label, not the raw key
    expect(text).toContain('90.00;EUR')
    createObjURL.mockRestore(); revokeObjURL.mockRestore(); clickSpy.mockRestore()
  })

  it('supports itemized receipt ticket manual entry and split assignment', async () => {
    let posted: Record<string, unknown> | null = null
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
      http.post('/api/trips/1/budget', async ({ request }) => {
        posted = await request.json() as Record<string, unknown>
        return HttpResponse.json({ item: { ...buildBudgetItem({ trip_id: 1, name: 'Dinner' }), id: 10 } })
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await user.click(await screen.findByRole('button', { name: 'Add expense' }))
    await user.type(await screen.findByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'Dinner')

    await user.click(screen.getByRole('button', { name: 'Ticket' }))

    const addBtn = screen.getByRole('button', { name: /Add item/i })
    await user.click(addBtn)
    await user.click(addBtn)
    await user.click(addBtn)

    const itemNames = screen.getAllByPlaceholderText('Item name')
    const itemPrices = screen.getAllByPlaceholderText('0.00')
    
    await user.type(itemNames[0], 'Apples')
    await user.type(itemPrices[1], '10')

    await user.type(itemNames[1], 'chocolate cake')
    await user.type(itemPrices[2], '50')
    const bobButtons = screen.getAllByRole('button', { name: /bob/i })
    await user.click(bobButtons[1])

    await user.type(itemNames[2], 'Milk')
    await user.type(itemPrices[3], '40')

    expect(screen.getByDisplayValue('100.00')).toBeDisabled()

    expect(screen.getByText('Individual Shares Summary')).toBeInTheDocument()
    expect(screen.getByText(/75\.00/)).toBeInTheDocument()
    expect(screen.getByText(/25\.00/)).toBeInTheDocument()

    const addBtns = screen.getAllByRole('button', { name: 'Add expense' })
    await user.click(addBtns[addBtns.length - 1])

    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted!.total_price).toBe(100)
    expect(posted!.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ user_id: 1, amount: 75 }),
      expect.objectContaining({ user_id: 2, amount: 25 }),
    ]))
    expect(posted!.note).toContain('TICKETJSON:')
  })

  // ── Display currency ───────────────────────────────────────────────────────

  it('shows amounts in the trip currency when the user has no display currency set', async () => {
    // No personal preference → the trip's own currency wins, instead of a hardcoded one.
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: '' } })
    seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'JPY' }) })
    const item = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Sushi' }), total_price: 3000, currency: 'JPY', payers: [], members: [{ user_id: 1, username: 'alice', paid: 0 }] }
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
    )
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await screen.findByText('Sushi')
    const card = screen.getByText('Total trip spend').closest('div[style*="border-radius: 22"]')
    // Yen, unconverted and with JPY's zero decimals — not a euro/dollar default.
    expect(card).toHaveTextContent('￥3,000')
  })

  // ── Payment currency ───────────────────────────────────────────────────────
  // A transfer settling a shared bill can be made in any currency, so it carries its
  // own rather than being assumed to be in the display one.

  it('records a payment in the display currency by default', async () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } })
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
    const addButtons = screen.getAllByRole('button', { name: 'Add payment' })
    await user.click(addButtons[addButtons.length - 1])

    await waitFor(() => expect(posted).toMatchObject({ amount: 25, currency: 'EUR' }))
  })

  it('records a payment made in another currency', async () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } })
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
    // Bob paid me back in dollars — the server freezes the USD rate on write.
    await user.click(screen.getByText(/^EUR/))
    await user.click(await screen.findByText(/^USD/))
    const addButtons = screen.getAllByRole('button', { name: 'Add payment' })
    await user.click(addButtons[addButtons.length - 1])

    await waitFor(() => expect(posted).toMatchObject({ amount: 25, currency: 'USD' }))
  })

  it('reopens a foreign-currency payment with its own currency', async () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } })
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [] })),
      http.get('/api/trips/1/budget/settlement', () =>
        HttpResponse.json({
          balances: [],
          flows: [],
          settlements: [
            { id: 7, trip_id: 1, from_user_id: 2, to_user_id: 1, amount: 30, currency: 'USD', exchange_rate: 1.1, created_at: '2025-06-16 10:00:00', from_username: 'bob', to_username: 'alice' },
          ],
        })
      ),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)

    await screen.findByText('Payment')
    await user.click(screen.getByTitle('Edit'))

    // The stored USD amount comes back as-is, not silently reread as euros.
    expect((await screen.findByPlaceholderText('0.00') as HTMLInputElement).value).toBe('30')
    expect(screen.getByText(/^USD/)).toBeInTheDocument()
  })
})
