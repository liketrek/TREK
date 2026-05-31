import { packingRepo } from '../../repo/packingRepo'
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
})
