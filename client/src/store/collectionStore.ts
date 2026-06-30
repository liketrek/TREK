import { create } from 'zustand'
import { collectionsApi } from '../api/collections'
import type {
  Collection,
  CollectionPlace,
  CollectionMember,
  CollectionStatus,
  CollectionListResponse,
} from '@trek/shared'

/** A pending invitation the current user has received (derived server-side). */
export type IncomingCollectionInvite = CollectionListResponse['incomingInvites'][number]

/** Sentinel id for the client-side "All saved" union pseudo-list. */
export const ALL_SAVED = 'all' as const
export type ActiveCollectionId = number | typeof ALL_SAVED | null

export type CollectionView = 'grid' | 'list' | 'map'
export type StatusFilter = CollectionStatus | 'all'

interface CollectionState {
  collections: Collection[]
  activeId: ActiveCollectionId
  places: CollectionPlace[]
  members: CollectionMember[]
  incomingInvites: IncomingCollectionInvite[]
  view: CollectionView
  statusFilter: StatusFilter
  search: string
  selectedPlaceId: number | null
  selectMode: boolean
  selectedIds: number[]
  loading: boolean
  placesLoading: boolean

  loadAll: () => Promise<void>
  loadCollection: (id: number) => Promise<void>
  setActive: (id: ActiveCollectionId) => Promise<void>
  refreshActive: () => Promise<void>

  createCollection: (name: string, color?: string, icon?: string) => Promise<Collection | null>
  updateCollection: (id: number, updates: { name?: string; color?: string; icon?: string; description?: string | null }) => Promise<void>
  deleteCollection: (id: number) => Promise<void>
  reorderCollections: (orderedIds: number[]) => Promise<void>

  setStatus: (placeId: number, status: CollectionStatus) => Promise<void>
  deletePlace: (placeId: number) => Promise<void>
  deleteMany: (ids: number[]) => Promise<void>
  copyToTrip: (tripId: number, placeIds: number[], force?: boolean) => Promise<{ copied: number; skipped: { id: number; name: string }[] }>

  invite: (collectionId: number, userId: number) => Promise<void>
  acceptInvite: (collectionId: number) => Promise<void>
  declineInvite: (collectionId: number) => Promise<void>
  cancelInvite: (collectionId: number, userId: number) => Promise<void>
  leave: (collectionId: number) => Promise<void>

  setView: (view: CollectionView) => void
  setStatusFilter: (filter: StatusFilter) => void
  setSearch: (search: string) => void
  setSelectedPlaceId: (id: number | null) => void
  setSelectMode: (on: boolean) => void
  toggleSelect: (id: number) => void
  clearSelection: () => void
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  activeId: null,
  places: [],
  members: [],
  incomingInvites: [],
  view: 'grid',
  statusFilter: 'all',
  search: '',
  selectedPlaceId: null,
  selectMode: false,
  selectedIds: [],
  loading: false,
  placesLoading: false,

  loadAll: async () => {
    set({ loading: true })
    try {
      const data = await collectionsApi.list()
      set({ collections: data.collections, incomingInvites: data.incomingInvites })
    } finally {
      set({ loading: false })
    }
  },

  loadCollection: async (id: number) => {
    set({ placesLoading: true })
    try {
      const data = await collectionsApi.get(id)
      set({
        activeId: id,
        places: data.places,
        members: data.collection.members ?? [],
      })
    } finally {
      set({ placesLoading: false })
    }
  },

  setActive: async (id: ActiveCollectionId) => {
    set({ selectMode: false, selectedIds: [], selectedPlaceId: null })
    if (id === null) {
      set({ activeId: null, places: [], members: [] })
      return
    }
    if (id === ALL_SAVED) {
      set({ activeId: ALL_SAVED, members: [], placesLoading: true })
      try {
        // Client-side union of every list the user owns or co-owns (no server change).
        const lists = get().collections
        const results = await Promise.all(lists.map(l => collectionsApi.get(l.id).catch(() => null)))
        const seen = new Set<number>()
        const merged: CollectionPlace[] = []
        for (const res of results) {
          if (!res) continue
          for (const p of res.places) {
            if (seen.has(p.id)) continue
            seen.add(p.id)
            merged.push(p)
          }
        }
        set({ places: merged })
      } finally {
        set({ placesLoading: false })
      }
      return
    }
    await get().loadCollection(id)
  },

  refreshActive: async () => {
    const { activeId } = get()
    if (activeId === null) return
    await get().setActive(activeId)
  },

  createCollection: async (name: string, color?: string, icon?: string) => {
    const data = await collectionsApi.create({ name, color, icon })
    await get().loadAll()
    return data.collection ?? null
  },

  updateCollection: async (id, updates) => {
    await collectionsApi.update(id, updates)
    await get().loadAll()
    if (get().activeId === id) await get().loadCollection(id)
  },

  deleteCollection: async (id: number) => {
    await collectionsApi.remove(id)
    if (get().activeId === id) set({ activeId: null, places: [], members: [] })
    await get().loadAll()
  },

  reorderCollections: async (orderedIds: number[]) => {
    // optimistic
    const byId = new Map(get().collections.map(c => [c.id, c]))
    const reordered = orderedIds.map(id => byId.get(id)).filter(Boolean) as Collection[]
    set({ collections: reordered })
    try {
      await collectionsApi.reorder(orderedIds)
    } finally {
      await get().loadAll()
    }
  },

  setStatus: async (placeId: number, status: CollectionStatus) => {
    // optimistic
    set({ places: get().places.map(p => (p.id === placeId ? { ...p, status } : p)) })
    try {
      await collectionsApi.setStatus(placeId, status)
    } catch {
      await get().refreshActive()
    }
  },

  deletePlace: async (placeId: number) => {
    set({ places: get().places.filter(p => p.id !== placeId) })
    await collectionsApi.deletePlace(placeId)
    await get().loadAll()
  },

  deleteMany: async (ids: number[]) => {
    const idSet = new Set(ids)
    set({ places: get().places.filter(p => !idSet.has(p.id)), selectedIds: [], selectMode: false })
    await collectionsApi.deleteMany(ids)
    await get().loadAll()
  },

  copyToTrip: async (tripId: number, placeIds: number[], force?: boolean) => {
    const res = await collectionsApi.copyToTrip({ trip_id: tripId, place_ids: placeIds, force })
    return res
  },

  invite: async (collectionId: number, userId: number) => {
    await collectionsApi.invite(collectionId, userId)
    if (get().activeId === collectionId) await get().loadCollection(collectionId)
  },

  acceptInvite: async (collectionId: number) => {
    await collectionsApi.acceptInvite(collectionId)
    await get().loadAll()
  },

  declineInvite: async (collectionId: number) => {
    await collectionsApi.declineInvite(collectionId)
    await get().loadAll()
  },

  cancelInvite: async (collectionId: number, userId: number) => {
    await collectionsApi.cancelInvite(collectionId, userId)
    if (get().activeId === collectionId) await get().loadCollection(collectionId)
  },

  leave: async (collectionId: number) => {
    await collectionsApi.leave(collectionId)
    if (get().activeId === collectionId) set({ activeId: null, places: [], members: [] })
    await get().loadAll()
  },

  setView: (view: CollectionView) => set({ view }),
  setStatusFilter: (filter: StatusFilter) => set({ statusFilter: filter }),
  setSearch: (search: string) => set({ search }),
  setSelectedPlaceId: (id: number | null) => set({ selectedPlaceId: id }),
  setSelectMode: (on: boolean) => set({ selectMode: on, selectedIds: on ? get().selectedIds : [] }),
  toggleSelect: (id: number) => {
    const selected = get().selectedIds
    set({ selectedIds: selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id] })
  },
  clearSelection: () => set({ selectedIds: [], selectMode: false }),
}))
