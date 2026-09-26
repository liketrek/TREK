import { budgetApi } from '../../api/client'
import { budgetRepo } from '../../repo/budgetRepo'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { BudgetItem, BudgetItemMember } from '../../types'
import type { BudgetCreateItemRequest, BudgetFallbackFx, BudgetFreezeRatesResponse, BudgetUpdateItemRequest } from '@trek/shared'
import { getApiErrorMessage } from '../../types'
import { withFallbackFx } from '../../hooks/useExchangeRates'
import { notify } from '../notify'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface BudgetSlice {
  loadBudgetItems: (tripId: number | string) => Promise<void>
  addBudgetItem: (tripId: number | string, data: BudgetCreateItemRequest) => Promise<BudgetItem>
  updateBudgetItem: (tripId: number | string, id: number, data: BudgetUpdateItemRequest) => Promise<BudgetItem>
  deleteBudgetItem: (tripId: number | string, id: number) => Promise<void>
  setBudgetItemMembers: (tripId: number | string, itemId: number, userIds: number[]) => Promise<{ members: BudgetItemMember[]; item: BudgetItem }>
  toggleBudgetMemberPaid: (tripId: number | string, itemId: number, userId: number, paid: boolean) => Promise<void>
  reorderBudgetItems: (tripId: number | string, orderedIds: number[]) => Promise<void>
  reorderBudgetCategories: (tripId: number | string, orderedCategories: string[]) => Promise<void>
  freezeMissingRates: (tripId: number | string, fallback?: BudgetFallbackFx) => Promise<BudgetFreezeRatesResponse>
}

/**
 * The open trip's currency when `tripId` is that trip, which is what a lent rate has to be
 * quoted against. Null for any other trip: the store only knows the one that is open.
 */
function openTripCurrency(get: GetState, tripId: number | string): string | null {
  const trip = get().trip
  return trip && String(trip.id) === String(tripId) ? trip.currency : null
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
      // A foreign currency goes out with the rate the browser holds for it, so the server
      // can freeze one even when its own fetch fails.
      const result = await budgetApi.create(tripId, withFallbackFx(data, openTripCurrency(get, tripId)))
      set(state => ({ budgetItems: [...state.budgetItems, result.item] }))
      // The booking mirrors its expenses' total (#2084), so a new one on it changes its card.
      if (result.item.reservation_id) get().loadReservations(tripId)
      return result.item
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error adding budget item'))
    }
  },

  updateBudgetItem: async (tripId, id, data) => {
    try {
      const result = await budgetApi.update(tripId, id, withFallbackFx(data, openTripCurrency(get, tripId)))
      set(state => ({
        budgetItems: state.budgetItems.map(item => item.id === id ? result.item : item)
      }))
      // The booking mirrors its expenses' total, so any edit of an expense on one
      // (total, currency, payers) or a link that moved (#2084) changes its card.
      if (result.item.reservation_id || data.reservation_id !== undefined) {
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
          // The server persists `paid` as 0/1 and broadcasts the same 0/1 over
          // WebSocket, so the optimistic write normalises the boolean toggle to
          // that numeric contract instead of parking a boolean under a cast.
          ? { ...item, members: (item.members || []).map(m => m.user_id === userId ? { ...m, paid: paid ? 1 : 0 } : m) }
          : item
      )
    }));
  },

  reorderBudgetItems: async (tripId, orderedIds) => {
    // Optimistic: reorder locally
    set(state => {
      const byId = new Map(state.budgetItems.map(i => [i.id, i]))
      // Drop unknown ids before reindexing, otherwise a stale id leaves a gap
      // in the local sort_order sequence.
      const reordered = orderedIds
        .map(id => byId.get(id))
        .filter((i): i is BudgetItem => i !== undefined)
        .map((item, idx): BudgetItem => ({ ...item, sort_order: idx }))
      // Keep items not in orderedIds at the end
      const remaining = state.budgetItems.filter(i => !orderedIds.includes(i.id))
      return { budgetItems: [...reordered, ...remaining] }
    })
    try {
      await budgetApi.reorderItems(tripId, orderedIds)
    } catch (err: unknown) {
      // Reload on failure to restore the server's ordering, and tell the user
      // their reorder didn't stick (the caller fires this without awaiting, so
      // a failing reload must not escape as an unhandled rejection).
      try {
        const data = await budgetApi.list(tripId)
        set({ budgetItems: data.items })
      } catch { /* offline too — the next successful load restores the order */ }
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
      // their reorder didn't stick (the caller fires this without awaiting, so
      // a failing reload must not escape as an unhandled rejection).
      try {
        const data = await budgetApi.list(tripId)
        set({ budgetItems: data.items })
      } catch { /* offline too — the next successful load restores the order */ }
      notify(getApiErrorMessage(err, 'Error reordering budget items'), 'error')
    }
  },

  // Freezes a rate onto the rows the settlement could not count (see useFreezeMissingRates).
  // Not optimistic: nothing changes locally until the server says which rows it froze.
  freezeMissingRates: async (tripId, fallback) => {
    const result = await budgetApi.freezeRates(tripId, fallback ? { fallback_fx: fallback } : {})
    if (result.items.length > 0) {
      const healed = new Map(result.items.map(item => [item.id, item]))
      set(state => ({ budgetItems: state.budgetItems.map(item => healed.get(item.id) ?? item) }))
    }
    return result
  },
})
