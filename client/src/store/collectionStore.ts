import { create } from 'zustand'
import { collectionsApi } from '../api/collections'
import type {
  Collection,
  CollectionPlace,
  CollectionMember,
  CollectionStatus,
  CollectionRole,
  CollectionListResponse,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionPlaceUpdateRequest,
} from '@trek/shared'

/** A pending invitation the current user has received (derived server-side). */
export type IncomingCollectionInvite = CollectionListResponse['incomingInvites'][number]

/** Sentinel id for the client-side "All saved" union pseudo-list. */
export const ALL_SAVED = 'all' as const
export type ActiveCollectionId = number | typeof ALL_SAVED | null

export type CollectionView = 'list' | 'map'
export type StatusFilter = CollectionStatus | 'all'

interface CollectionState {
  collections: Collection[]
  activeId: ActiveCollectionId
  places: CollectionPlace[]
  members: CollectionMember[]
  incomingInvites: IncomingCollectionInvite[]
  view: CollectionView
  statusFilter: StatusFilter
  categoryFilter: number | 'all'
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

  createCollection: (payload: CollectionCreateRequest) => Promise<Collection | null>
  updateCollection: (id: number, updates: CollectionUpdateRequest) => Promise<void>
  uploadCover: (id: number, file: File) => Promise<void>
  deleteCollection: (id: number) => Promise<void>
  reorderCollections: (orderedIds: number[]) => Promise<void>

  setStatus: (placeId: number, status: CollectionStatus) => Promise<void>
  updatePlace: (placeId: number, body: CollectionPlaceUpdateRequest) => Promise<void>
  deletePlace: (placeId: number) => Promise<void>
  deleteMany: (ids: number[]) => Promise<void>
  copyToTrip: (tripId: number, placeIds: number[], force?: boolean) => Promise<{ copied: number; skipped: { id: number; name: string }[] }>
  moveToList: (placeIds: number[], targetId: number) => Promise<void>
  duplicateToList: (placeIds: number[], targetId: number) => Promise<void>

  invite: (collectionId: number, userId: number, role?: CollectionRole) => Promise<void>
  setMemberRole: (collectionId: number, userId: number, role: CollectionRole) => Promise<void>
  acceptInvite: (collectionId: number) => Promise<void>
  declineInvite: (collectionId: number) => Promise<void>
  cancelInvite: (collectionId: number, userId: number) => Promise<void>
  removeMember: (collectionId: number, userId: number) => Promise<void>
  leave: (collectionId: number) => Promise<void>

  setView: (view: CollectionView) => void
  setStatusFilter: (filter: StatusFilter) => void
  setCategoryFilter: (filter: number | 'all') => void
  setSearch: (search: string) => void
  setSelectedPlaceId: (id: number | null) => void
  setSelectMode: (on: boolean) => void
  toggleSelect: (id: number) => void
  setSelectedIds: (ids: number[]) => void
  clearSelection: () => void
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  activeId: null,
  places: [],
  members: [],
  incomingInvites: [],
  view: 'list',
  statusFilter: 'all',
  categoryFilter: 'all',
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
    } catch {
      // The list may have been left / removed / deleted out from under us (a WS
      // event or the URL sync can re-request an id we just lost access to). Clear
      // it instead of leaving an uncaught 403/404 rejection; the route sync then
      // bounces to /collections.
      if (get().activeId === id) set({ activeId: null, places: [], members: [] })
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
        // On first load the lists may not be fetched yet (loadAll still in flight),
        // which would union nothing — make sure they're loaded first.
        let lists = get().collections
        if (lists.length === 0) { await get().loadAll(); lists = get().collections }
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

  createCollection: async (payload) => {
    const data = await collectionsApi.create(payload)
    await get().loadAll()
    return data.collection ?? null
  },

  updateCollection: async (id, updates) => {
    await collectionsApi.update(id, updates)
    await get().loadAll()
    if (get().activeId === id) await get().loadCollection(id)
  },

  uploadCover: async (id: number, file: File) => {
    const fd = new FormData()
    fd.append('cover', file)
    await collectionsApi.uploadCover(id, fd)
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

  updatePlace: async (placeId, body) => {
    // The endpoint returns the updated place directly (not wrapped in { place }).
    const updated = await collectionsApi.updatePlace(placeId, body)
    if (updated) set({ places: get().places.map(p => (p.id === placeId ? updated : p)) })
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

  // Move the selected places into another list (re-point collection_id). They
  // leave the current list, so drop them locally + refresh.
  moveToList: async (placeIds: number[], targetId: number) => {
    for (const id of placeIds) await collectionsApi.updatePlace(id, { collection_id: targetId })
    const idSet = new Set(placeIds)
    set({ places: get().places.filter(p => !idSet.has(p.id)), selectedIds: [], selectMode: false })
    await get().loadAll()
    const active = get().activeId
    if (typeof active === 'number') await get().loadCollection(active)
  },

  // Duplicate the selected places into another list (re-save each place's data).
  duplicateToList: async (placeIds: number[], targetId: number) => {
    const byId = new Map(get().places.map(p => [p.id, p]))
    for (const id of placeIds) {
      const p = byId.get(id)
      if (!p) continue
      await collectionsApi.savePlace({
        collection_id: targetId,
        name: p.name,
        description: p.description ?? null,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        address: p.address ?? null,
        category_id: p.category_id ?? null,
        price: p.price ?? null,
        currency: p.currency ?? null,
        notes: p.notes ?? null,
        image_url: p.image_url ?? null,
        google_place_id: p.google_place_id ?? null,
        google_ftid: p.google_ftid ?? null,
        osm_id: p.osm_id ?? null,
        website: p.website ?? null,
        phone: p.phone ?? null,
        status: p.status,
        links: p.links ?? [],
        force: true,
      })
    }
    set({ selectedIds: [], selectMode: false })
    await get().loadAll()
  },

  invite: async (collectionId: number, userId: number, role?: CollectionRole) => {
    await collectionsApi.invite(collectionId, userId, role)
    if (get().activeId === collectionId) await get().loadCollection(collectionId)
  },

  setMemberRole: async (collectionId: number, userId: number, role: CollectionRole) => {
    await collectionsApi.setMemberRole(collectionId, userId, role)
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

  removeMember: async (collectionId: number, userId: number) => {
    await collectionsApi.removeMember(collectionId, userId)
    if (get().activeId === collectionId) await get().loadCollection(collectionId)
  },

  leave: async (collectionId: number) => {
    await collectionsApi.leave(collectionId)
    if (get().activeId === collectionId) set({ activeId: null, places: [], members: [] })
    await get().loadAll()
  },

  setView: (view: CollectionView) => set({ view }),
  setStatusFilter: (filter: StatusFilter) => set({ statusFilter: filter }),
  setCategoryFilter: (filter: number | 'all') => set({ categoryFilter: filter }),
  setSearch: (search: string) => set({ search }),
  setSelectedPlaceId: (id: number | null) => set({ selectedPlaceId: id }),
  setSelectMode: (on: boolean) => set({ selectMode: on, selectedIds: on ? get().selectedIds : [] }),
  toggleSelect: (id: number) => {
    const selected = get().selectedIds
    set({ selectedIds: selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id] })
  },
  setSelectedIds: (ids: number[]) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [], selectMode: false }),
}))
