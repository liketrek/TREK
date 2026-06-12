import { budgetApi } from '../../api/client'
import { budgetRepo } from '../../repo/budgetRepo'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { BudgetItem, BudgetItemMember } from '../../types'
import type { BudgetCreateItemRequest, BudgetUpdateItemRequest } from '@trek/shared'
import { getApiErrorMessage } from '../../types'
import { notify } from '../notify'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface BudgetSlice {
  loadBudgetItems: (tripId: number | string) => Promise<void>
  addBudgetItem: (tripId: number | string, data: Partial<BudgetItem>) => Promise<BudgetItem>
  updateBudgetItem: (tripId: number | string, id: number, data: Partial<BudgetItem>) => Promise<BudgetItem>
  deleteBudgetItem: (tripId: number | string, id: number) => Promise<void>
  setBudgetItemMembers: (tripId: number | string, itemId: number, userIds: number[]) => Promise<{ members: BudgetItemMember[]; item: BudgetItem }>
  toggleBudgetMemberPaid: (tripId: number | string, itemId: number, userId: number, paid: boolean) => Promise<void>
  reorderBudgetItems: (tripId: number | string, orderedIds: number[]) => Promise<void>
  reorderBudgetCategories: (tripId: number | string, orderedCategories: string[]) => Promise<void>
}

export const createBudgetSlice = (set: SetState, get: GetState): BudgetSlice => ({
  loadBudgetItems: async (tripId) => {
    try {
      const data = await budgetRepo.list(tripId)
      set({ budgetItems: data.items })
    } catch (err: unknown) {
      console.error('Failed to load budget items:', err)
    }
  },

  addBudgetItem: async (tripId, data) => {
    try {
      const result = await budgetApi.create(tripId, data as BudgetCreateItemRequest)
      set(state => ({ budgetItems: [...state.budgetItems, result.item] }))
      return result.item
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error adding budget item'))
    }
  },

  updateBudgetItem: async (tripId, id, data) => {
    try {
      const result = await budgetApi.update(tripId, id, data as BudgetUpdateItemRequest)
      set(state => ({
        budgetItems: state.budgetItems.map(item => item.id === id ? result.item : item)
      }))
      if (result.item.reservation_id && data.total_price !== undefined) {
        get().loadReservations(tripId)
      }
      return result.item
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating budget item'))
    }
  },

  deleteBudgetItem: async (tripId, id) => {
    const prev = get().budgetItems
    set(state => ({ budgetItems: state.budgetItems.filter(item => item.id !== id) }))
    try {
      await budgetApi.delete(tripId, id)
    } catch (err: unknown) {
      set({ budgetItems: prev })
      throw new Error(getApiErrorMessage(err, 'Error deleting budget item'))
    }
  },

  setBudgetItemMembers: async (tripId, itemId, userIds) => {
    const result = await budgetApi.setMembers(tripId, itemId, userIds);
    set(state => ({
      budgetItems: state.budgetItems.map(item =>
        item.id === itemId ? { ...item, members: result.members, persons: result.item.persons } : item
      )
    }));
    return result;
  },

  toggleBudgetMemberPaid: async (tripId, itemId, userId, paid) => {
    await budgetApi.togglePaid(tripId, itemId, userId, paid);
    set(state => ({
      budgetItems: state.budgetItems.map(item =>
        item.id === itemId
          // The server persists `paid` as 0/1; the optimistic update stores the
          // boolean toggle value (truthy-compatible) — narrow it to the member's
          // numeric type without changing the stored runtime value.
          ? { ...item, members: (item.members || []).map(m => m.user_id === userId ? { ...m, paid: paid as unknown as number } : m) }
          : item
      )
    }));
  },

  reorderBudgetItems: async (tripId, orderedIds) => {
    // Optimistic: reorder locally
    set(state => {
      const byId = new Map(state.budgetItems.map(i => [i.id, i]))
      const reordered = orderedIds.map((id, idx): BudgetItem | null => {
        const item = byId.get(id)
        return item ? { ...item, sort_order: idx } : null
      }).filter((i): i is BudgetItem => i !== null)
      // Keep items not in orderedIds at the end
      const remaining = state.budgetItems.filter(i => !orderedIds.includes(i.id))
      return { budgetItems: [...reordered, ...remaining] }
    })
    try {
      await budgetApi.reorderItems(tripId, orderedIds)
    } catch (err: unknown) {
      // Reload on failure to restore the server's ordering, and tell the user
      // their reorder didn't stick (the caller fires this without awaiting).
      const data = await budgetApi.list(tripId)
      set({ budgetItems: data.items })
      notify(getApiErrorMessage(err, 'Error reordering budget items'), 'error')
    }
  },

  reorderBudgetCategories: async (tripId, orderedCategories) => {
    // Optimistic: reorder items by new category order (Map preserves insertion order for numeric keys)
    set(state => {
      const grouped = new Map<string, BudgetItem[]>()
      for (const item of state.budgetItems) {
        const cat = item.category || 'Other'
        if (!grouped.has(cat)) grouped.set(cat, [])
        grouped.get(cat)!.push(item)
      }
      const reordered: BudgetItem[] = []
      for (const cat of orderedCategories) {
        const items = grouped.get(cat)
        if (items) reordered.push(...items)
      }
      for (const [cat, items] of grouped) {
        if (!orderedCategories.includes(cat)) reordered.push(...items)
      }
      return { budgetItems: reordered }
    })
    try {
      await budgetApi.reorderCategories(tripId, orderedCategories)
    } catch (err: unknown) {
      // Reload on failure to restore the server's ordering, and tell the user
      // their reorder didn't stick (the caller fires this without awaiting).
      const data = await budgetApi.list(tripId)
      set({ budgetItems: data.items })
      notify(getApiErrorMessage(err, 'Error reordering budget items'), 'error')
    }
  },
})
