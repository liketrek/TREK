// FE-COSTS-EXPRECEIPT-001 to FE-COSTS-EXPRECEIPT-004
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories'
import type { BudgetItem } from '../../types'
import { ExpenseModal } from './CostsPanel'

vi.mock('../../api/authUrl', () => ({ getAuthUrl: vi.fn().mockResolvedValue('http://test/receipt') }))

const people = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
]

function renderModal(editing: BudgetItem | null) {
  return render(<ExpenseModal tripId={1} base="EUR" people={people} me={1} editing={editing} onClose={vi.fn()} onSaved={vi.fn()} />)
}

const receiptsCard = () => screen.getByText('Receipts & Invoices').closest('section') as HTMLElement

beforeEach(() => {
  resetAllStores()
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }) })
})

describe('ExpenseModal receipts and note', () => {
  it('FE-COSTS-EXPRECEIPT-001: a new expense starts without receipts and takes picked files', async () => {
    renderModal(null)
    expect(within(receiptsCard()).getByText('No receipts attached')).toBeInTheDocument()
    const input = receiptsCard().querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['a'], 'lunch.jpg', { type: 'image/jpeg' }), new File(['b'], 'taxi.pdf', { type: 'application/pdf' })] } })
    expect(within(receiptsCard()).getByText('lunch.jpg')).toBeInTheDocument()
    expect(within(receiptsCard()).getByText('taxi.pdf')).toBeInTheDocument()
    // The picker is emptied, so the same file can be picked again.
    expect(input.value).toBe('')
  })

  it('FE-COSTS-EXPRECEIPT-002: a picked file is taken off again before saving', async () => {
    const user = userEvent.setup()
    renderModal(null)
    const input = receiptsCard().querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['a'], 'lunch.jpg', { type: 'image/jpeg' })] } })
    fireEvent.change(input, { target: { files: [] } })
    await user.click(within(receiptsCard()).getByRole('button', { name: 'Remove receipt' }))
    expect(within(receiptsCard()).queryByText('lunch.jpg')).toBeNull()
    expect(within(receiptsCard()).getByText('No receipts attached')).toBeInTheDocument()
  })

  it('FE-COSTS-EXPRECEIPT-003: a saved receipt opens in the preview and can be taken off the expense', async () => {
    const user = userEvent.setup()
    const editing = buildBudgetItem({
      name: 'Dinner',
      receipts: [
        { id: 31, filename: 'a.pdf', original_name: 'dinner-bill.pdf', mime_type: 'application/pdf', url: '/api/trips/1/budget/receipts/31' },
        { id: 32, filename: 'b.jpg', original_name: 'tip.jpg', mime_type: 'image/jpeg', url: '/api/trips/1/budget/receipts/32' },
      ],
    } as never)
    renderModal(editing)
    const shownBefore = screen.getAllByText('dinner-bill.pdf').length
    await user.click(within(receiptsCard()).getByRole('button', { name: 'dinner-bill.pdf' }))
    // The preview names the receipt in its own head.
    expect(screen.getAllByText('dinner-bill.pdf').length).toBeGreaterThan(shownBefore)

    const removes = within(receiptsCard()).getAllByRole('button', { name: 'Remove receipt' })
    await user.click(removes[1])
    expect(within(receiptsCard()).queryByText('tip.jpg')).toBeNull()
  })

  it('FE-COSTS-EXPRECEIPT-004: the note takes what is typed', async () => {
    const user = userEvent.setup()
    renderModal(null)
    const note = screen.getByRole('textbox', { name: 'Note' })
    await user.type(note, 'Paid in cash')
    expect(note).toHaveValue('Paid in cash')
  })
})
