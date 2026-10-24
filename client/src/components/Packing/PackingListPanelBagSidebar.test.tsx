// FE-BAGSIDE-001 to FE-BAGSIDE-006
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { BagSidebar } from './PackingListPanelBagSidebar'
import type { PackingState } from './usePackingListPanel'

const ITEMS = [
  { id: 1, name: 'Stove', weight_grams: 300, quantity: 1, bag_id: 10, is_private: 0, owner_id: 1, checked: 0, category: 'Kitchen' },
  { id: 2, name: 'Sandwich', weight_grams: 150, quantity: 1, bag_id: null, is_private: 0, owner_id: 1, checked: 0, category: 'Food' },
  { id: 3, name: 'Apple', weight_grams: 100, quantity: 1, bag_id: null, is_private: 0, owner_id: 1, checked: 0, category: 'Food' },
]

function buildState(over: Partial<PackingState> = {}): PackingState {
  return {
    t: (k: string) => k,
    bags: [{ id: 10, trip_id: 1, name: 'Duffel', color: '#6366f1', sort_order: 0, weight_limit_grams: null, members: [], total_weight_grams: 300 }],
    items: ITEMS,
    tripId: 1,
    tripMembers: [],
    canEdit: true,
    currentUserId: 1,
    unassignedWeightGrams: 250,
    serverWeightsFresh: true,
    handleDeleteBag: vi.fn(),
    handleUpdateBag: vi.fn(),
    handleSetBagMembers: vi.fn(),
    handleCreateBag: vi.fn(),
    showAddBag: false,
    setShowAddBag: vi.fn(),
    newBagName: '',
    setNewBagName: vi.fn(),
    ...over,
  } as unknown as PackingState
}

describe('BagSidebar', () => {
  it('FE-BAGSIDE-001: the head band carries the title and a short add button', () => {
    const S = buildState()
    render(<BagSidebar {...S} />)

    const add = screen.getByRole('button', { name: 'packing.addBag' })
    expect(add).toHaveTextContent('packing.bags')
    fireEvent.click(add)
    expect(S.setShowAddBag).toHaveBeenCalledWith(true)
  })

  it('FE-BAGSIDE-002: what sits in no bag is one row with its count as a badge', () => {
    render(<BagSidebar {...buildState()} />)

    const badge = screen.getByTitle('2 admin.packingTemplates.items')
    expect(badge).toHaveTextContent(/^2$/)
    expect(screen.getByText('packing.noBag')).toBeInTheDocument()
  })

  it('FE-BAGSIDE-003: the composer adds on Enter and on its button, once there is a name', () => {
    const S = buildState({ showAddBag: true, newBagName: 'Daypack' } as Partial<PackingState>)
    render(<BagSidebar {...S} />)

    expect(screen.queryByRole('button', { name: 'packing.addBag' })).toBeNull()
    fireEvent.keyDown(screen.getByPlaceholderText('packing.bagName'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))
    expect(S.handleCreateBag).toHaveBeenCalledTimes(2)
  })

  it('FE-BAGSIDE-004: Escape and the cross both close the composer and drop the name', () => {
    const S = buildState({ showAddBag: true, newBagName: 'Daypack' } as Partial<PackingState>)
    render(<BagSidebar {...S} />)

    fireEvent.keyDown(screen.getByPlaceholderText('packing.bagName'), { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(S.setShowAddBag).toHaveBeenCalledWith(false)
    expect(S.setNewBagName).toHaveBeenCalledWith('')
    expect(S.setShowAddBag).toHaveBeenCalledTimes(2)
  })

  it('FE-BAGSIDE-005: the confirm waits for a name', () => {
    render(<BagSidebar {...buildState({ showAddBag: true, newBagName: '  ' } as Partial<PackingState>)} />)
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()
  })

  it('FE-BAGSIDE-006: the dashed plus beside a bag opens who carries it, or says there is nobody', () => {
    render(<BagSidebar {...buildState()} />)

    const plus = document.querySelector<HTMLButtonElement>('button[style*="dashed"]')!
    fireEvent.click(plus)
    expect(screen.getByText('packing.assignMembers')).toBeInTheDocument()
    expect(screen.getByText('packing.noMembers')).toBeInTheDocument()
  })
})
