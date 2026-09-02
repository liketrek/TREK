// FE-COMP-BAGWEIGHT-001 to FE-COMP-BAGWEIGHT-006

/**
 * What the bag panels actually print (#2191).
 *
 * The numbers used to be summed in the browser over the privacy-filtered item
 * list, so a bag shared with someone whose personal items you cannot see read
 * lighter than it was — and that figure is what gets measured against an
 * airline's weight limit. The server now sends the real total; these tests pin
 * that the panels show it, that the "no bag" pile and the grand total follow
 * the same rule, and that offline they fall back to the honest partial sum
 * rather than a frozen absolute one.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '../../../tests/helpers/render'
import { BagSidebar } from './PackingListPanelBagSidebar'
import { BagModal } from './PackingListPanelBagModal'
import type { PackingState } from './usePackingListPanel'

/** My own 300 g item; the buddy's 700 g personal item never reaches this client. */
const ITEMS = [
  { id: 1, name: 'Stove', weight_grams: 300, quantity: 1, bag_id: 10, is_private: 0, owner_id: 1, checked: 0, category: 'Kitchen' },
  { id: 2, name: 'Sandwich', weight_grams: 150, quantity: 1, bag_id: null, is_private: 0, owner_id: 1, checked: 0, category: 'Food' },
]

function buildState(over: Partial<PackingState> = {}): PackingState {
  return {
    t: (k: string) => k,
    bags: [{ id: 10, trip_id: 1, name: 'Duffel', color: '#6366f1', sort_order: 0, weight_limit_grams: null, members: [], total_weight_grams: 1000 }],
    items: ITEMS,
    tripId: 1,
    tripMembers: [],
    canEdit: false,
    currentUserId: 1,
    unassignedWeightGrams: 500,
    serverWeightsFresh: true,
    handleDeleteBag: vi.fn(),
    handleUpdateBag: vi.fn(),
    handleSetBagMembers: vi.fn(),
    handleCreateBag: vi.fn(),
    setShowBagModal: vi.fn(),
    showAddBag: false,
    setShowAddBag: vi.fn(),
    newBagName: '',
    setNewBagName: vi.fn(),
    ...over,
  } as unknown as PackingState
}

describe('bag weights on the packing panels (#2191)', () => {
  it('FE-COMP-BAGWEIGHT-001: the sidebar shows the server total, not the sum of what you can see', () => {
    // Locally visible: 300 g. Actually in the bag: 1000 g.
    render(<BagSidebar {...buildState()} />)
    expect(screen.getByText('1.0 kg')).toBeInTheDocument()
    expect(screen.queryByText('300 g')).not.toBeInTheDocument()
  })

  it('FE-COMP-BAGWEIGHT-002: the grand total adds the bags and the unassigned pile', () => {
    // 1000 g in the bag + 500 g loose.
    const { container } = render(<BagSidebar {...buildState()} />)
    const total = within(container).getByText('packing.totalWeight').parentElement as HTMLElement
    expect(total).toHaveTextContent('1.5 kg')
  })

  it('FE-COMP-BAGWEIGHT-003: the modal follows the same rule as the sidebar', () => {
    render(<BagModal {...buildState()} />)
    expect(screen.getByText('1.0 kg')).toBeInTheDocument()
  })

  it('FE-COMP-BAGWEIGHT-004: offline it falls back to summing what is visible', () => {
    // The server totals are frozen at the last online read and blind to the
    // mutation queue, so an honest partial number beats a stale absolute one.
    render(<BagSidebar {...buildState({ serverWeightsFresh: false })} />)
    expect(screen.getByText('300 g')).toBeInTheDocument()
    expect(screen.queryByText('1.0 kg')).not.toBeInTheDocument()
  })

  it('FE-COMP-BAGWEIGHT-005: a bag from before the field falls back to the local sum', () => {
    const bags = [{ id: 10, trip_id: 1, name: 'Duffel', color: '#6366f1', sort_order: 0, weight_limit_grams: null, members: [] }]
    render(<BagSidebar {...buildState({ bags: bags as never, unassignedWeightGrams: null })} />)
    expect(screen.getByText('300 g')).toBeInTheDocument()
  })

  it('FE-COMP-BAGWEIGHT-006: the unassigned row appears for weight with no visible items', () => {
    // Someone else's personal item is loose in the trip: the grand total counts
    // it, so a row has to account for it or the total adds up to nothing.
    render(<BagSidebar {...buildState({ items: [ITEMS[0]] as never, unassignedWeightGrams: 400 })} />)
    expect(screen.getByText('packing.noBag')).toBeInTheDocument()
    expect(screen.getByText('400 g')).toBeInTheDocument()
  })
})
