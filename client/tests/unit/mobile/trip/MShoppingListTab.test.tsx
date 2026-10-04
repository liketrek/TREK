import { beforeEach, describe, expect, it, vi } from 'vitest'
import MShoppingListTab from '../../../../src/mobile/screens/trip/tabs/MShoppingListTab'
import type { ShoppingItem, TripMember } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { buildUser } from '../../../helpers/factories'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import { useAuthStore } from '../../../../src/store/authStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { resetAllStores, seedStore } from '../../../helpers/store'

const ME = 1
const MEMBERS = [
  { id: ME, username: 'alice', avatar: null, avatar_url: null },
  { id: 2, username: 'bob', avatar: null, avatar_url: null },
] as unknown as TripMember[]

function shoppingItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 101,
    trip_id: 1,
    name: 'Milk',
    checked: 0,
    quantity: '2L',
    category: 'Supermarket',
    assigned_user_id: null,
    notes: null,
    sort_order: 0,
    created_at: '2026-10-03T10:00:00Z',
    ...overrides,
  }
}

describe('MShoppingListTab', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAuthStore, {
      user: buildUser({ id: ME, role: 'admin' }),
    })
    seedStore(useTripStore, {
      trip: { id: 1, user_id: ME, currency: 'EUR' } as never,
    })
  })

  it('renders empty state when there are no shopping items', () => {
    const planner = buildPlanner({
      shoppingItems: [],
      tripMembers: MEMBERS,
    })

    render(<MShoppingListTab planner={planner} />)
    expect(screen.getByText(/No items on the shopping list yet/i)).toBeInTheDocument()
  })

  it('renders items grouped by category with name and quantity', () => {
    const items = [
      shoppingItem({ id: 1, name: 'Milk', quantity: '2L', category: 'Supermarket', checked: 0 }),
      shoppingItem({ id: 2, name: 'Baguette', quantity: '1x', category: 'Bakery', checked: 1 }),
    ]
    const planner = buildPlanner({
      shoppingItems: items,
      tripMembers: MEMBERS,
    })

    render(<MShoppingListTab planner={planner} />)

    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('2L')).toBeInTheDocument()
    expect(screen.getByText('Baguette')).toBeInTheDocument()
    expect(screen.getByText('1x')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('allows adding an item via quick-add bar', async () => {
    const addShoppingItemSpy = vi.fn().mockResolvedValue(shoppingItem({ id: 99, name: 'Apples' }))
    seedStore(useTripStore, {
      trip: { id: 1, user_id: ME, currency: 'EUR' } as never,
      addShoppingItem: addShoppingItemSpy,
    })

    const planner = buildPlanner({
      shoppingItems: [],
      tripMembers: MEMBERS,
    })

    render(<MShoppingListTab planner={planner} />)

    const input = screen.getByPlaceholderText(/Item name|Artikel/i)
    fireEvent.change(input, { target: { value: 'Apples' } })

    const qtyInput = screen.getByPlaceholderText(/Qty|Menge/i)
    fireEvent.change(qtyInput, { target: { value: '1kg' } })

    const addBtn = screen.getByRole('button', { name: /Add|Hinzufügen/i })
    fireEvent.click(addBtn)

    expect(addShoppingItemSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: 'Apples',
        quantity: '1kg',
        category: 'Supermarket',
      }),
    )
  })

  it('toggles an item checked state when checkbox is tapped', () => {
    const toggleSpy = vi.fn()
    seedStore(useTripStore, {
      trip: { id: 1, user_id: ME, currency: 'EUR' } as never,
      toggleShoppingItem: toggleSpy,
    })

    const items = [shoppingItem({ id: 1, name: 'Coffee', checked: 0 })]
    const planner = buildPlanner({
      shoppingItems: items,
      tripMembers: MEMBERS,
    })

    render(<MShoppingListTab planner={planner} />)

    const checkbox = screen.getByRole('button', { name: 'Bought: Coffee' })
    fireEvent.click(checkbox)

    expect(toggleSpy).toHaveBeenCalledWith(1, 1, true)
  })

  it('filters items by open and done status', () => {
    const items = [
      shoppingItem({ id: 1, name: 'Coffee', checked: 0 }),
      shoppingItem({ id: 2, name: 'Tea', checked: 1 }),
    ]
    const planner = buildPlanner({
      shoppingItems: items,
      tripMembers: MEMBERS,
    })

    render(<MShoppingListTab planner={planner} />)

    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Tea')).toBeInTheDocument()

    // Click 'To buy' filter
    fireEvent.click(screen.getByText('To buy'))
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.queryByText('Tea')).not.toBeInTheDocument()

    // Click 'Bought' filter pill
    fireEvent.click(screen.getByText('Bought'))
    expect(screen.queryByText('Coffee')).not.toBeInTheDocument()
    expect(screen.getByText('Tea')).toBeInTheDocument()
  })

  it('opens budget transfer modal and records expense into budget', async () => {
    const addBudgetItemSpy = vi.fn().mockResolvedValue({ id: 50 })
    const clearCheckedSpy = vi.fn().mockResolvedValue(undefined)

    seedStore(useTripStore, {
      trip: { id: 1, user_id: ME, currency: 'EUR' } as never,
      addBudgetItem: addBudgetItemSpy,
      clearCheckedShoppingItems: clearCheckedSpy,
    })

    const items = [
      shoppingItem({ id: 1, name: 'Bread', checked: 1 }),
      shoppingItem({ id: 2, name: 'Cheese', checked: 1 }),
    ]
    const planner = buildPlanner({
      shoppingItems: items,
      tripMembers: MEMBERS,
    })

    render(<MShoppingListTab planner={planner} />)

    // Budget button in header
    const budgetBtn = screen.getByTitle(/Add as expense to budget/i)
    fireEvent.click(budgetBtn)

    // Wait for MSheet portal to render
    const amountInput = await waitFor(() => screen.getByPlaceholderText('0.00'))
    fireEvent.change(amountInput, { target: { value: '24.50' } })

    // Find submit button in sheet footer
    const confirmButtons = screen.getAllByRole('button', { name: /Add as expense to budget/i })
    const submitBtn = confirmButtons[confirmButtons.length - 1]
    fireEvent.click(submitBtn)

    expect(addBudgetItemSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        category: 'groceries',
        total_price: 24.5,
        currency: 'EUR',
        member_ids: [1, 2],
      }),
    )
  })
})
