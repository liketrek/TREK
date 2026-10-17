// FE-COSTSVIEW-001 to FE-COSTSVIEW-004: the table as a second view of the Costs tab
import { render, screen, waitFor, within } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
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

const lunch = { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Lunch' }), id: 41, total_price: 24, persons: 2, expense_date: '2025-06-15', payers: [] }

beforeEach(() => {
  resetAllStores()
  localStorage.removeItem('trek:costs-view')
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }) })
})

function serve(extra: Parameters<typeof server.use> = []) {
  server.use(
    http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [lunch] })),
    http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] })),
    ...extra,
  )
}

describe('CostsPanel table view', () => {
  it('FE-COSTSVIEW-001: opens on the list, switches to the table and remembers it', async () => {
    serve()
    const user = userEvent.setup()
    const { unmount } = render(<CostsPanel tripId={1} tripMembers={tripMembers} />)
    await screen.findByText('Lunch')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Table' }))
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(localStorage.getItem('trek:costs-view')).toBe('table')
    unmount()

    // Back on the tab later, the table is still the view.
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('FE-COSTSVIEW-002: the table view swaps the category card for the four-way summary', async () => {
    localStorage.setItem('trek:costs-view', 'table')
    serve()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)
    await screen.findByRole('table')
    expect(screen.getByRole('region', { name: 'Summary' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'By category' })).not.toBeInTheDocument()
  })

  it('FE-COSTSVIEW-003: a cell edited in the table is saved to the expense', async () => {
    localStorage.setItem('trek:costs-view', 'table')
    let patched: Record<string, unknown> | null = null
    serve([http.put('/api/trips/1/budget/:id', async ({ request }) => {
      patched = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ item: { ...lunch, ...patched } })
    })])
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)
    await user.click(await screen.findByRole('button', { name: 'Name: Lunch' }))
    const field = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(field)
    await user.type(field, 'Team lunch{Enter}')
    await waitFor(() => expect(patched).toEqual({ name: 'Team lunch' }))
  })

  it('FE-COSTSVIEW-004: a row added in a category is created empty with that category and date', async () => {
    localStorage.setItem('trek:costs-view', 'table')
    let posted: Record<string, unknown> | null = null
    serve([http.post('/api/trips/1/budget', async ({ request }) => {
      posted = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ item: { ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'New Entry' }), id: 77, payers: [] } })
    })])
    const user = userEvent.setup()
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />)
    const table = await screen.findByRole('table')
    await user.click(within(table).getByRole('button', { name: 'Add expense' }))
    await waitFor(() => expect(posted).toBeTruthy())
    expect(posted).toEqual(expect.objectContaining({ name: 'New Entry', category: 'food', total_price: 0, expense_date: '2025-06-15' }))
  })
})
