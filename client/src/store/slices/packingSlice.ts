import { packingRepo } from '../../repo/packingRepo'
import { packingApi } from '../../api/client'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { PackingItem } from '../../types'
import { getApiErrorMessage } from '../../types'
import { notify } from '../notify'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface PackingSlice {
  addPackingItem: (tripId: number | string, data: Partial<PackingItem> & { name: string }) => Promise<PackingItem>
  updatePackingItem: (tripId: number | string, id: number, data: Partial<PackingItem>) => Promise<PackingItem>
  deletePackingItem: (tripId: number | string, id: number) => Promise<void>
  togglePackingItem: (tripId: number | string, id: number, checked: boolean) => Promise<void>
  reorderPackingItems: (tripId: number | string, orderedIds: number[]) => Promise<void>
  // Three-tier sharing (#858)
  setPackingItemSharing: (tripId: number | string, id: number, visibility: 'common' | 'personal' | 'shared', recipientIds: number[]) => Promise<void>
  clonePackingItem: (tripId: number | string, id: number) => Promise<void>
  addPackingContributor: (tripId: number | string, id: number) => Promise<void>
  removePackingContributor: (tripId: number | string, id: number, userId: number) => Promise<void>
}

export const createPackingSlice = (set: SetState, get: GetState): PackingSlice => ({
  addPackingItem: async (tripId, data) => {
    try {
      const result = await packingRepo.create(tripId, data as Record<string, unknown> & { name: string })
      set(state => ({ packingItems: [...state.packingItems, result.item] }))
      return result.item
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error adding item'))
    }
  },

  updatePackingItem: async (tripId, id, data) => {
    try {
      const result = await packingRepo.update(tripId, id, data as Record<string, unknown>)
      set(state => ({
        packingItems: state.packingItems.map(item => item.id === id ? result.item : item)
      }))
      return result.item
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating item'))
    }
  },

  deletePackingItem: async (tripId, id) => {
    const prev = get().packingItems
    set(state => ({ packingItems: state.packingItems.filter(item => item.id !== id) }))
    try {
      await packingRepo.delete(tripId, id)
    } catch (err: unknown) {
      set({ packingItems: prev })
      throw new Error(getApiErrorMessage(err, 'Error deleting item'))
    }
  },

  togglePackingItem: async (tripId, id, checked) => {
    set(state => ({
      packingItems: state.packingItems.map(item =>
        item.id === id ? { ...item, checked: checked ? 1 : 0 } : item
      )
    }))
    try {
      await packingRepo.update(tripId, id, { checked })
    } catch (err: unknown) {
      // The caller fires this optimistically and doesn't await, so rolling back
      // silently would just flip the checkbox with no explanation. Surface it.
      set(state => ({
        packingItems: state.packingItems.map(item =>
          item.id === id ? { ...item, checked: checked ? 0 : 1 } : item
        )
      }))
      notify(getApiErrorMessage(err, 'Error updating item'), 'error')
    }
  },

  reorderPackingItems: async (tripId, orderedIds) => {
    const prev = get().packingItems
    // Optimistic reorder: rebuild the array in the requested order, reindexing
    // sort_order; any items not in orderedIds keep their place at the end.
    set(state => {
      const byId = new Map(state.packingItems.map(i => [i.id, i]))
      const reordered = orderedIds
        .map((id, idx): PackingItem | null => { const item = byId.get(id); return item ? { ...item, sort_order: idx } : null })
        .filter((i): i is PackingItem => i !== null)
      const remaining = state.packingItems.filter(i => !orderedIds.includes(i.id))
      return { packingItems: [...reordered, ...remaining] }
    })
    try {
      await packingApi.reorder(tripId, orderedIds)
    } catch (err: unknown) {
      set({ packingItems: prev })
      notify(getApiErrorMessage(err, 'Error reordering items'), 'error')
    }
  },

  // ── Three-tier sharing (#858) ──────────────────────────────────────────────
  setPackingItemSharing: async (tripId, id, visibility, recipientIds) => {
    try {
      const result = await packingApi.setSharing(tripId, id, { visibility, recipient_ids: recipientIds })
      set(state => ({ packingItems: state.packingItems.map(i => i.id === id ? result.item : i) }))
    } catch (err: unknown) {
      notify(getApiErrorMessage(err, 'Error updating sharing'), 'error')
      throw err
    }
  },

  clonePackingItem: async (tripId, id) => {
    try {
      const result = await packingApi.clone(tripId, id)
      set(state => (state.packingItems.some(i => i.id === result.item.id) ? {} : { packingItems: [...state.packingItems, result.item] }))
    } catch (err: unknown) {
      notify(getApiErrorMessage(err, 'Error copying item'), 'error')
    }
  },

  addPackingContributor: async (tripId, id) => {
    try {
      const result = await packingApi.addContributor(tripId, id)
      set(state => ({ packingItems: state.packingItems.map(i => i.id === id ? result.item : i) }))
    } catch (err: unknown) {
      notify(getApiErrorMessage(err, 'Error joining item'), 'error')
    }
  },

  removePackingContributor: async (tripId, id, userId) => {
    try {
      const result = await packingApi.removeContributor(tripId, id, userId)
      set(state => ({ packingItems: state.packingItems.map(i => i.id === id ? result.item : i) }))
    } catch (err: unknown) {
      notify(getApiErrorMessage(err, 'Error leaving item'), 'error')
    }
  },
})
