// FE-PAGE-COLL-001 to FE-PAGE-COLL-061
// The Collections page hook. The collection store is replaced by a fixture so
// every handler/branch can be driven directly; the categories request goes
// through MSW, and the websocket module is already mocked in tests/setup.ts.
import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { Collection, CollectionLabel, CollectionMember, CollectionPlace, CollectionStatus } from '@trek/shared'
import { TranslationProvider } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { addListener, removeListener } from '../../api/websocket'
import { seedStore } from '../../../tests/helpers/store'
import { server } from '../../../tests/helpers/msw/server'
import { useCollections } from './useCollections'

const navigate = vi.fn()
let routeParams: { id?: string } = {}
vi.mock('react-router', () => ({
  useNavigate: () => navigate,
  useParams: () => routeParams,
}))

// The fixture is handed out by the mocked store hook; tests mutate it and rerender.
const hoisted = vi.hoisted(() => ({ store: null as unknown }))
vi.mock('../../store/collectionStore', () => ({
  ALL_SAVED: 'all',
  useCollectionStore: () => hoisted.store,
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────
function makeStore() {
  return {
    collections: [] as Collection[],
    activeId: 'all' as number | 'all' | null,
    places: [] as CollectionPlace[],
    members: [] as CollectionMember[],
    labels: [] as CollectionLabel[],
    incomingInvites: [] as unknown[],
    view: 'list' as 'list' | 'map',
    statusFilter: 'all' as CollectionStatus | 'all',
    categoryFilter: 'all' as number | 'all',
    ratingFilter: 'all' as number | 'all',
    labelFilter: [] as number[],
    sortMode: 'default' as 'default' | 'name_asc',
    search: '',
    selectedPlaceId: null as number | null,
    selectMode: false,
    selectedIds: [] as number[],
    loading: false,
    placesLoading: false,

    loadAll: vi.fn(async () => {}),
    setActive: vi.fn(async (_id: number | 'all' | null) => {}),
    refreshActive: vi.fn(async () => {}),
    loadCollection: vi.fn(async (_id: number) => {}),
    deleteCollection: vi.fn(async (_id: number) => {}),
    setStatus: vi.fn(async (_id: number, _status: CollectionStatus) => {}),
    updatePlace: vi.fn(async (_id: number, _body: Record<string, unknown>) => {}),
    uploadPlaceImage: vi.fn(async (_id: number, _file: File) => {}),
    ratePlace: vi.fn(async (_id: number, _rating: number | null) => {}),
    deletePlace: vi.fn(async (_id: number) => {}),
    deleteMany: vi.fn(async (_ids: number[]) => {}),
    copyToTrip: vi.fn(async (_tripId: number, _ids: number[]) => ({ copied: 2, skipped: [] as { id: number; name: string }[] })),
    clearSelection: vi.fn(() => {}),
    moveToList: vi.fn(async (_ids: number[], _target: number) => {}),
    duplicateToList: vi.fn(async (_ids: number[], _target: number) => {}),
    setSelectedIds: vi.fn((_ids: number[]) => {}),
    createLabel: vi.fn(async (_name: string, _color?: string) => {}),
    updateLabel: vi.fn(async (_id: number, _body: Record<string, unknown>) => {}),
    deleteLabel: vi.fn(async (_id: number) => {}),
    assignLabels: vi.fn(async (_labelIds: number[], _placeIds: number[]) => {}),
    acceptInvite: vi.fn(async (_id: number) => {}),
    declineInvite: vi.fn(async (_id: number) => {}),
    setView: vi.fn(() => {}),
    setStatusFilter: vi.fn(() => {}),
    setCategoryFilter: vi.fn(() => {}),
    setRatingFilter: vi.fn(() => {}),
    setLabelFilter: vi.fn(() => {}),
    setSortMode: vi.fn(() => {}),
    setSearch: vi.fn(() => {}),
    setSelectedPlaceId: vi.fn((_id: number | null) => {}),
    setSelectMode: vi.fn(() => {}),
    toggleSelect: vi.fn(() => {}),
  }
}
let store = makeStore()

function collection(over: Partial<Collection> & { id: number }): Collection {
  return { owner_id: 1, name: `List ${over.id}`, is_owner: true, ...over } as unknown as Collection
}
function place(over: Partial<CollectionPlace> & { id: number }): CollectionPlace {
  return { collection_id: 1, name: `Place ${over.id}`, status: 'idea', ...over } as unknown as CollectionPlace
}

// ── Environment stubs ────────────────────────────────────────────────────────
let wideMedia = false
let darkMedia = false
let mqChangeHandlers: Array<() => void> = []

function installMatchMedia() {
  mqChangeHandlers = []
  window.matchMedia = ((query: string) => ({
    // A getter so flipping the flag mid-test is visible to the captured handler.
    get matches() {
      if (query.includes('min-width: 1024px')) return wideMedia
      if (query.includes('prefers-color-scheme: dark')) return darkMedia
      return false
    },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_type: string, handler: () => void) => { mqChangeHandlers.push(handler) },
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

const addToast = vi.fn((_message: string, _type?: string, _duration?: number) => 0)

function wrapper({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>
}

// Mount and let the initial categories request settle so no state lands after
// the test has finished.
async function setup() {
  hoisted.store = store
  const view = renderHook(() => useCollections(), { wrapper })
  await waitFor(() => expect(view.result.current.categories).toHaveLength(2))
  return view
}

/** The websocket handler the hook registered on its last render. */
function wsHandler(): (msg: { type: string; collectionId?: number }) => void {
  const calls = vi.mocked(addListener).mock.calls
  return calls[calls.length - 1][0] as unknown as (msg: { type: string; collectionId?: number }) => void
}

beforeEach(() => {
  store = makeStore()
  hoisted.store = store
  routeParams = {}
  wideMedia = false
  darkMedia = false
  navigate.mockClear()
  addToast.mockClear()
  vi.mocked(addListener).mockClear()
  vi.mocked(removeListener).mockClear()
  installMatchMedia()
  window.__addToast = addToast as unknown as typeof window.__addToast
  seedStore(useSettingsStore, { settings: { dark_mode: false } })
  seedStore(useAuthStore, { user: { id: 7, username: 'me', email: 'me@example.com', role: 'user' } })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete window.__addToast
})

describe('useCollections — mount', () => {
  it('FE-PAGE-COLL-001: loads the lists and the central categories on mount', async () => {
    const { result } = await setup()
    expect(store.loadAll).toHaveBeenCalledTimes(1)
    expect(result.current.categories).toHaveLength(2)
    expect(result.current.language).toBe('en')
  })

  it('FE-PAGE-COLL-002: registers a websocket listener and drops it on unmount', async () => {
    const { unmount } = await setup()
    expect(addListener).toHaveBeenCalled()
    const registered = vi.mocked(addListener).mock.calls[0][0]
    unmount()
    expect(removeListener).toHaveBeenCalledWith(registered)
  })

  it('FE-PAGE-COLL-003: a route without an id activates the All-saved union', async () => {
    store.activeId = 5
    await setup()
    expect(store.setActive).toHaveBeenCalledWith('all')
  })

  it('FE-PAGE-COLL-004: /collections/:id activates that list', async () => {
    routeParams = { id: '7' }
    await setup()
    expect(store.setActive).toHaveBeenCalledWith(7)
  })

  it('FE-PAGE-COLL-005: a non-numeric route id is ignored', async () => {
    routeParams = { id: 'not-a-number' }
    await setup()
    expect(store.setActive).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-006: an already-active list is not re-activated', async () => {
    routeParams = { id: '7' }
    store.activeId = 7
    await setup()
    expect(store.setActive).not.toHaveBeenCalled()
  })
})

describe('useCollections — categories request', () => {
  it('FE-PAGE-COLL-082: a failing categories request leaves the list empty', async () => {
    server.use(http.get('/api/categories', () => new HttpResponse(null, { status: 500 })))
    hoisted.store = store
    const { result } = renderHook(() => useCollections(), { wrapper })
    await waitFor(() => expect(store.loadAll).toHaveBeenCalled())
    expect(result.current.categories).toEqual([])
  })

  it('FE-PAGE-COLL-083: a payload without a categories array falls back to an empty list', async () => {
    server.use(http.get('/api/categories', () => HttpResponse.json({})))
    hoisted.store = store
    const { result } = renderHook(() => useCollections(), { wrapper })
    await waitFor(() => expect(store.loadAll).toHaveBeenCalled())
    expect(result.current.categories).toEqual([])
  })
})

describe('useCollections — appearance and breakpoint', () => {
  it('FE-PAGE-COLL-007: an explicit dark_mode setting turns the dark flag on', async () => {
    seedStore(useSettingsStore, { settings: { dark_mode: 'dark' } })
    const { result } = await setup()
    expect(result.current.dark).toBe(true)
  })

  it('FE-PAGE-COLL-008: dark_mode auto follows the OS colour scheme', async () => {
    seedStore(useSettingsStore, { settings: { dark_mode: 'auto' } })
    darkMedia = true
    const { result } = await setup()
    expect(result.current.dark).toBe(true)
  })

  it('FE-PAGE-COLL-009: dark_mode auto stays light when the OS prefers light', async () => {
    seedStore(useSettingsStore, { settings: { dark_mode: 'auto' } })
    darkMedia = false
    const { result } = await setup()
    expect(result.current.dark).toBe(false)
  })

  it('FE-PAGE-COLL-010: isWide tracks the 1024px media query and its change event', async () => {
    const { result } = await setup()
    expect(result.current.isWide).toBe(false)

    wideMedia = true
    act(() => { mqChangeHandlers.forEach(h => h()) })
    expect(result.current.isWide).toBe(true)
  })
})

describe('useCollections — active list and permissions', () => {
  it('FE-PAGE-COLL-011: resolves the active collection from the id', async () => {
    store.collections = [collection({ id: 1 }), collection({ id: 2, name: 'Japan' })]
    store.activeId = 2
    const { result } = await setup()
    expect(result.current.activeCollection?.name).toBe('Japan')
    expect(result.current.isAllSaved).toBe(false)
    expect(result.current.isOwner).toBe(true)
    expect(result.current.canShare).toBe(true)
  })

  it('FE-PAGE-COLL-012: the All-saved union has no collection and stays permissive', async () => {
    store.activeId = 'all'
    const { result } = await setup()
    expect(result.current.activeCollection).toBeNull()
    expect(result.current.isAllSaved).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(true)
    expect(result.current.canShare).toBe(false)
  })

  it('FE-PAGE-COLL-013: an editor may edit but not delete', async () => {
    store.collections = [collection({ id: 2, is_owner: false })]
    store.activeId = 2
    store.members = [{ user_id: 7, username: 'me', status: 'accepted', role: 'editor' } as unknown as CollectionMember]
    const { result } = await setup()
    expect(result.current.myRole).toBe('editor')
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(false)
  })

  it('FE-PAGE-COLL-014: an admin may edit and delete', async () => {
    store.collections = [collection({ id: 2, is_owner: false })]
    store.activeId = 2
    store.members = [{ user_id: 7, username: 'me', status: 'accepted', role: 'admin' } as unknown as CollectionMember]
    const { result } = await setup()
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(true)
  })

  it('FE-PAGE-COLL-015: a viewer may neither edit nor delete', async () => {
    store.collections = [collection({ id: 2, is_owner: false })]
    store.activeId = 2
    store.members = [{ user_id: 7, username: 'me', status: 'accepted', role: 'viewer' } as unknown as CollectionMember]
    const { result } = await setup()
    expect(result.current.myRole).toBe('viewer')
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canDelete).toBe(false)
  })

  it('FE-PAGE-COLL-016: a non-member has no role at all', async () => {
    store.collections = [collection({ id: 2, is_owner: false })]
    store.activeId = 2
    store.members = [{ user_id: 99, username: 'other', status: 'accepted', role: 'editor' } as unknown as CollectionMember]
    const { result } = await setup()
    expect(result.current.myRole).toBeNull()
    expect(result.current.canEdit).toBe(false)
  })

  it('FE-PAGE-COLL-017: the share badge counts everyone but the owner', async () => {
    store.collections = [collection({ id: 2 })]
    store.activeId = 2
    store.members = [
      { user_id: 1, username: 'owner', status: 'accepted', is_owner: true } as unknown as CollectionMember,
      { user_id: 7, username: 'me', status: 'accepted', role: 'editor' } as unknown as CollectionMember,
      { user_id: 8, username: 'pending', status: 'pending', role: 'viewer' } as unknown as CollectionMember,
    ]
    const { result } = await setup()
    expect(result.current.shareMemberCount).toBe(2)
  })

  it('FE-PAGE-COLL-018: splits the rail into owned and shared lists', async () => {
    store.collections = [collection({ id: 1 }), collection({ id: 2, is_owner: false }), collection({ id: 3, is_owner: undefined })]
    const { result } = await setup()
    expect(result.current.ownedLists.map(c => c.id)).toEqual([1, 3])
    expect(result.current.sharedLists.map(c => c.id)).toEqual([2])
  })

  it('FE-PAGE-COLL-019: closes the share modal when the active list changes', async () => {
    store.collections = [collection({ id: 1 }), collection({ id: 2 })]
    store.activeId = 1
    const { result, rerender } = await setup()

    act(() => result.current.setShowShare(true))
    expect(result.current.showShare).toBe(true)

    store.activeId = 2
    rerender()
    expect(result.current.showShare).toBe(false)
  })
})

describe('useCollections — derived place lists', () => {
  beforeEach(() => {
    store.activeId = 1
    store.collections = [collection({ id: 1 })]
    store.places = [
      place({ id: 1, name: 'Bar', status: 'want', lat: 10, lng: 20, category_id: 3, category: { id: 3, name: 'Food', color: '#f00', icon: 'utensils' } as unknown as CollectionPlace['category'], label_ids: [50], sort_order: 1 }),
      place({ id: 2, name: 'Alpha', status: 'idea', label_ids: [51], sort_order: 0 }),
      place({ id: 3, name: 'Zoo', status: 'visited', lat: 1, lng: 2, sort_order: 2 }),
    ]
    store.labels = [
      { id: 50, collection_id: 1, name: 'Food', color: '#f00' },
      { id: 51, collection_id: 1, name: 'Culture', color: null },
    ]
  })

  it('FE-PAGE-COLL-020: visiblePlaces keeps the saved order by default', async () => {
    const { result } = await setup()
    expect(result.current.visiblePlaces.map(p => p.id)).toEqual([2, 1, 3])
    expect(result.current.counts).toEqual({ all: 3, idea: 1, want: 1, visited: 1 })
    expect(result.current.mappable.map(p => p.id)).toEqual([1, 3])
  })

  it('FE-PAGE-COLL-021: the alphabetical sort mode reorders by name', async () => {
    store.sortMode = 'name_asc'
    const { result } = await setup()
    expect(result.current.visiblePlaces.map(p => p.name)).toEqual(['Alpha', 'Bar', 'Zoo'])
  })

  it('FE-PAGE-COLL-022: status, search and category filters narrow the list', async () => {
    store.statusFilter = 'want'
    const { result, rerender } = await setup()
    expect(result.current.visiblePlaces.map(p => p.id)).toEqual([1])

    store.statusFilter = 'all'
    store.search = 'zo'
    rerender()
    expect(result.current.visiblePlaces.map(p => p.id)).toEqual([3])

    store.search = ''
    store.categoryFilter = 3
    rerender()
    expect(result.current.visiblePlaces.map(p => p.id)).toEqual([1])
  })

  it('FE-PAGE-COLL-023: the label filter applies on a real list', async () => {
    store.labelFilter = [51]
    const { result } = await setup()
    expect(result.current.visiblePlaces.map(p => p.id)).toEqual([2])
  })

  it('FE-PAGE-COLL-024: the label filter is ignored on the All-saved union', async () => {
    store.activeId = 'all'
    store.labelFilter = [51]
    const { result } = await setup()
    expect(result.current.visiblePlaces).toHaveLength(3)
  })

  it('FE-PAGE-COLL-025: category and label options carry their counts', async () => {
    const { result } = await setup()
    expect(result.current.categoryOptions).toEqual([{ id: 3, name: 'Food', color: '#f00', icon: 'utensils', count: 1 }])
    expect(result.current.labelOptions.map(l => [l.id, l.count])).toEqual([[50, 1], [51, 1]])
  })

  it('FE-PAGE-COLL-026: allVisibleSelected only once every visible place is selected', async () => {
    store.selectedIds = [1, 2]
    const { result, rerender } = await setup()
    expect(result.current.allVisibleSelected).toBe(false)

    store.selectedIds = [1, 2, 3]
    rerender()
    expect(result.current.allVisibleSelected).toBe(true)
  })

  it('FE-PAGE-COLL-027: handleSelectAll selects every visible place, then clears', async () => {
    const { result, rerender } = await setup()
    act(() => result.current.handleSelectAll())
    expect(store.setSelectedIds).toHaveBeenCalledWith([2, 1, 3])

    store.selectedIds = [1, 2, 3]
    rerender()
    act(() => result.current.handleSelectAll())
    expect(store.setSelectedIds).toHaveBeenLastCalledWith([])
  })

  it('FE-PAGE-COLL-028: the detail place is shimmed with a trip id', async () => {
    store.places = [place({ id: 4, name: 'Museum', source_trip_id: 12, category: { id: 3, name: 'Food' } as unknown as CollectionPlace['category'] })]
    store.selectedPlaceId = 4
    const { result } = await setup()
    expect(result.current.selectedPlace?.name).toBe('Museum')
    expect(result.current.detailPlace?.trip_id).toBe(12)
    expect(result.current.detailCategories).toHaveLength(1)
  })

  it('FE-PAGE-COLL-029: a place without a source trip falls back to trip id 0 and no category chip', async () => {
    store.places = [place({ id: 4, name: 'Museum' })]
    store.selectedPlaceId = 4
    const { result } = await setup()
    expect(result.current.detailPlace?.trip_id).toBe(0)
    expect(result.current.detailCategories).toEqual([])
  })

  it('FE-PAGE-COLL-030: an unknown selection resolves to no detail place', async () => {
    store.selectedPlaceId = 999
    const { result } = await setup()
    expect(result.current.selectedPlace).toBeNull()
    expect(result.current.detailPlace).toBeNull()
  })
})

describe('useCollections — list handlers', () => {
  it('FE-PAGE-COLL-031: selecting a list navigates to it and closes the mobile rail', async () => {
    const { result } = await setup()
    act(() => result.current.setMobileRailOpen(true))
    expect(result.current.mobileRailOpen).toBe(true)

    act(() => result.current.handleSelectList(4))
    expect(navigate).toHaveBeenCalledWith('/collections/4')
    expect(result.current.mobileRailOpen).toBe(false)
  })

  it('FE-PAGE-COLL-032: the All-saved entry and a null id both go to the index route', async () => {
    const { result } = await setup()
    act(() => result.current.handleSelectList('all'))
    expect(navigate).toHaveBeenLastCalledWith('/collections')

    act(() => result.current.handleSelectList(null))
    expect(navigate).toHaveBeenLastCalledWith('/collections')
  })

  it('FE-PAGE-COLL-033: a freshly created list is opened', async () => {
    const { result } = await setup()
    act(() => result.current.handleEditorCreated(11))
    expect(navigate).toHaveBeenCalledWith('/collections/11')
  })

  it('FE-PAGE-COLL-034: adding a place refreshes the active list', async () => {
    const { result } = await setup()
    act(() => result.current.handlePlaceAdded())
    expect(store.refreshActive).toHaveBeenCalledTimes(1)
  })

  it('FE-PAGE-COLL-035: deleting without a pending confirmation does nothing', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleDeleteList() })
    expect(store.deleteCollection).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-036: confirming the delete removes the list and bounces off it', async () => {
    store.activeId = 3
    const { result } = await setup()
    act(() => result.current.setConfirmDeleteList(3))
    await act(async () => { await result.current.handleDeleteList() })

    expect(store.deleteCollection).toHaveBeenCalledWith(3)
    expect(navigate).toHaveBeenCalledWith('/collections')
    expect(result.current.confirmDeleteList).toBeNull()
  })

  it('FE-PAGE-COLL-037: deleting a list you are not on does not navigate', async () => {
    store.activeId = 9
    const { result } = await setup()
    act(() => result.current.setConfirmDeleteList(3))
    await act(async () => { await result.current.handleDeleteList() })

    expect(store.deleteCollection).toHaveBeenCalledWith(3)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-038: a failing delete is surfaced as a toast', async () => {
    store.deleteCollection.mockRejectedValueOnce(new Error('list is locked'))
    const { result } = await setup()
    act(() => result.current.setConfirmDeleteList(3))
    await act(async () => { await result.current.handleDeleteList() })

    expect(addToast).toHaveBeenCalledWith('list is locked', 'error', undefined)
  })
})

describe('useCollections — place handlers', () => {
  it('FE-PAGE-COLL-039: status changes forward to the store', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleStatusChange(5, 'visited') })
    expect(store.setStatus).toHaveBeenCalledWith(5, 'visited')
  })

  it('FE-PAGE-COLL-040: a failing status change toasts the error', async () => {
    store.setStatus.mockRejectedValueOnce(new Error('offline'))
    const { result } = await setup()
    await act(async () => { await result.current.handleStatusChange(5, 'visited') })
    expect(addToast).toHaveBeenCalledWith('offline', 'error', undefined)
  })

  it('FE-PAGE-COLL-041: deleting a place forwards, and failures toast', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleDeletePlace(5) })
    expect(store.deletePlace).toHaveBeenCalledWith(5)

    store.deletePlace.mockRejectedValueOnce(new Error('nope'))
    await act(async () => { await result.current.handleDeletePlace(5) })
    expect(addToast).toHaveBeenCalledWith('nope', 'error', undefined)
  })

  it('FE-PAGE-COLL-042: rating a place forwards, and failures toast', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleRatePlace(5, 4) })
    expect(store.ratePlace).toHaveBeenCalledWith(5, 4)

    store.ratePlace.mockRejectedValueOnce(new Error('rate limited'))
    await act(async () => { await result.current.handleRatePlace(5, null) })
    expect(addToast).toHaveBeenCalledWith('rate limited', 'error', undefined)
  })

  it('FE-PAGE-COLL-043: bulk delete no-ops on an empty selection', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleDeleteSelected() })
    expect(store.deleteMany).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-044: bulk delete forwards the selection and toasts failures', async () => {
    store.selectedIds = [1, 2]
    const { result } = await setup()
    await act(async () => { await result.current.handleDeleteSelected() })
    expect(store.deleteMany).toHaveBeenCalledWith([1, 2])

    store.deleteMany.mockRejectedValueOnce(new Error('denied'))
    await act(async () => { await result.current.handleDeleteSelected() })
    expect(addToast).toHaveBeenCalledWith('denied', 'error', undefined)
  })
})

describe('useCollections — move and duplicate', () => {
  it('FE-PAGE-COLL-045: move and duplicate no-op on an empty selection', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleMoveToList(9) })
    await act(async () => { await result.current.handleDuplicateToList(9) })
    expect(store.moveToList).not.toHaveBeenCalled()
    expect(store.duplicateToList).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-046: a successful move closes the picker and confirms with a toast', async () => {
    store.selectedIds = [1, 2]
    const { result } = await setup()
    act(() => result.current.setListPickerMode('move'))
    await act(async () => { await result.current.handleMoveToList(9) })

    expect(store.moveToList).toHaveBeenCalledWith([1, 2], 9)
    expect(result.current.listPickerMode).toBeNull()
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('2'), 'success', undefined)
  })

  it('FE-PAGE-COLL-047: a failing move keeps the picker open and toasts', async () => {
    store.selectedIds = [1]
    store.moveToList.mockRejectedValueOnce(new Error('target is read-only'))
    const { result } = await setup()
    act(() => result.current.setListPickerMode('move'))
    await act(async () => { await result.current.handleMoveToList(9) })

    expect(result.current.listPickerMode).toBe('move')
    expect(addToast).toHaveBeenCalledWith('target is read-only', 'error', undefined)
  })

  it('FE-PAGE-COLL-048: a successful duplicate closes the picker', async () => {
    store.selectedIds = [3]
    const { result } = await setup()
    act(() => result.current.setListPickerMode('copy'))
    await act(async () => { await result.current.handleDuplicateToList(9) })

    expect(store.duplicateToList).toHaveBeenCalledWith([3], 9)
    expect(result.current.listPickerMode).toBeNull()
  })

  it('FE-PAGE-COLL-049: a failing duplicate toasts', async () => {
    store.selectedIds = [3]
    store.duplicateToList.mockRejectedValueOnce(new Error('quota'))
    const { result } = await setup()
    await act(async () => { await result.current.handleDuplicateToList(9) })
    expect(addToast).toHaveBeenCalledWith('quota', 'error', undefined)
  })
})

describe('useCollections — labels', () => {
  it('FE-PAGE-COLL-050: create, update and delete forward to the store', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleCreateLabel('Food', '#f00') })
    await act(async () => { await result.current.handleUpdateLabel(3, { name: 'Drinks' }) })
    await act(async () => { await result.current.handleDeleteLabel(3) })

    expect(store.createLabel).toHaveBeenCalledWith('Food', '#f00')
    expect(store.updateLabel).toHaveBeenCalledWith(3, { name: 'Drinks' })
    expect(store.deleteLabel).toHaveBeenCalledWith(3)
  })

  it('FE-PAGE-COLL-051: each label mutation surfaces its error', async () => {
    store.createLabel.mockRejectedValueOnce(new Error('dup name'))
    store.updateLabel.mockRejectedValueOnce(new Error('gone'))
    store.deleteLabel.mockRejectedValueOnce(new Error('in use'))
    const { result } = await setup()

    await act(async () => { await result.current.handleCreateLabel('Food') })
    expect(addToast).toHaveBeenLastCalledWith('dup name', 'error', undefined)

    await act(async () => { await result.current.handleUpdateLabel(3, { color: '#000' }) })
    expect(addToast).toHaveBeenLastCalledWith('gone', 'error', undefined)

    await act(async () => { await result.current.handleDeleteLabel(3) })
    expect(addToast).toHaveBeenLastCalledWith('in use', 'error', undefined)
  })

  it('FE-PAGE-COLL-052: bulk assign needs both a selection and a label', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleBulkAssignLabels([1]) })
    expect(store.assignLabels).not.toHaveBeenCalled()

    store.selectedIds = [4]
    await act(async () => { await result.current.handleBulkAssignLabels([]) })
    expect(store.assignLabels).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-053: a successful bulk assign closes the picker', async () => {
    store.selectedIds = [4, 5]
    const { result } = await setup()
    act(() => result.current.setLabelPickerOpen(true))
    await act(async () => { await result.current.handleBulkAssignLabels([1, 2]) })

    expect(store.assignLabels).toHaveBeenCalledWith([1, 2], [4, 5])
    expect(result.current.labelPickerOpen).toBe(false)
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('2'), 'success', undefined)
  })

  it('FE-PAGE-COLL-054: a failing bulk assign leaves the picker open', async () => {
    store.selectedIds = [4]
    store.assignLabels.mockRejectedValueOnce(new Error('label missing'))
    const { result } = await setup()
    act(() => result.current.setLabelPickerOpen(true))
    await act(async () => { await result.current.handleBulkAssignLabels([1]) })

    expect(result.current.labelPickerOpen).toBe(true)
    expect(addToast).toHaveBeenCalledWith('label missing', 'error', undefined)
  })

  it('FE-PAGE-COLL-055: assigning labels to one place patches that place', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleAssignPlaceLabels(8, [1, 2]) })
    expect(store.updatePlace).toHaveBeenCalledWith(8, { label_ids: [1, 2] })

    store.updatePlace.mockRejectedValueOnce(new Error('conflict'))
    await act(async () => { await result.current.handleAssignPlaceLabels(8, []) })
    expect(addToast).toHaveBeenCalledWith('conflict', 'error', undefined)
  })
})

describe('useCollections — invites and leaving', () => {
  it('FE-PAGE-COLL-056: accepting an invite opens the list', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleAcceptInvite(12) })
    expect(store.acceptInvite).toHaveBeenCalledWith(12)
    expect(navigate).toHaveBeenCalledWith('/collections/12')
  })

  it('FE-PAGE-COLL-057: a failing accept toasts and does not navigate', async () => {
    store.acceptInvite.mockRejectedValueOnce(new Error('invite expired'))
    const { result } = await setup()
    await act(async () => { await result.current.handleAcceptInvite(12) })
    expect(navigate).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith('invite expired', 'error', undefined)
  })

  it('FE-PAGE-COLL-058: declining forwards, and failures toast', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleDeclineInvite(12) })
    expect(store.declineInvite).toHaveBeenCalledWith(12)

    store.declineInvite.mockRejectedValueOnce(new Error('already gone'))
    await act(async () => { await result.current.handleDeclineInvite(12) })
    expect(addToast).toHaveBeenCalledWith('already gone', 'error', undefined)
  })

  it('FE-PAGE-COLL-059: leaving a shared list closes the share modal and bounces to the rail', async () => {
    const { result } = await setup()
    act(() => result.current.setShowShare(true))
    act(() => result.current.handleAfterLeave())

    expect(result.current.showShare).toBe(false)
    expect(navigate).toHaveBeenCalledWith('/collections')
  })
})

describe('useCollections — detail panel and copy to trip', () => {
  beforeEach(() => {
    store.places = [place({ id: 4 }), place({ id: 5 })]
  })

  it('FE-PAGE-COLL-060: closing the detail clears the selection', async () => {
    const { result } = await setup()
    act(() => result.current.handleCloseDetail())
    expect(store.setSelectedPlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-PAGE-COLL-061: the detail status button no-ops without a selected place', async () => {
    const { result } = await setup()
    act(() => result.current.handleDetailStatus('want'))
    expect(store.setStatus).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-062: the detail status button sets the status of the open place', async () => {
    store.selectedPlaceId = 4
    const { result } = await setup()
    await act(async () => { result.current.handleDetailStatus('want') })
    expect(store.setStatus).toHaveBeenCalledWith(4, 'want')
  })

  it('FE-PAGE-COLL-063: removing from the detail deletes and closes it', async () => {
    store.selectedPlaceId = 4
    const { result } = await setup()
    await act(async () => { await result.current.handleDetailRemove() })
    expect(store.deletePlace).toHaveBeenCalledWith(4)
    expect(store.setSelectedPlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-PAGE-COLL-064: removing without a selected place does nothing', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleDetailRemove() })
    expect(store.deletePlace).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-065: copy-to-trip opens for the place in the detail sheet', async () => {
    store.selectedPlaceId = 5
    const { result } = await setup()
    act(() => result.current.openCopyForSelectedPlace())
    expect(result.current.copyIds).toEqual([5])

    act(() => result.current.closeCopy())
    expect(result.current.copyIds).toBeNull()
  })

  it('FE-PAGE-COLL-066: copy-to-trip stays closed without a selected place', async () => {
    const { result } = await setup()
    act(() => result.current.openCopyForSelectedPlace())
    expect(result.current.copyIds).toBeNull()
  })

  it('FE-PAGE-COLL-067: copy-to-trip opens for the whole select-mode set', async () => {
    store.selectedIds = [4, 5]
    const { result } = await setup()
    act(() => result.current.openCopyForSelection())
    expect(result.current.copyIds).toEqual([4, 5])
  })

  it('FE-PAGE-COLL-068: copy-to-trip stays closed for an empty selection', async () => {
    const { result } = await setup()
    act(() => result.current.openCopyForSelection())
    expect(result.current.copyIds).toBeNull()
  })

  it('FE-PAGE-COLL-069: copying returns the store result and clears select mode', async () => {
    store.selectedIds = [4, 5]
    store.selectMode = true
    const { result } = await setup()
    act(() => result.current.openCopyForSelection())

    let res: { copied: number } | undefined
    await act(async () => { res = await result.current.handleCopyToTrip(20) })

    expect(store.copyToTrip).toHaveBeenCalledWith(20, [4, 5])
    expect(res?.copied).toBe(2)
    expect(store.clearSelection).toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-070: copying without an open modal sends an empty id list', async () => {
    const { result } = await setup()
    await act(async () => { await result.current.handleCopyToTrip(20) })
    expect(store.copyToTrip).toHaveBeenCalledWith(20, [])
    expect(store.clearSelection).not.toHaveBeenCalled()
  })
})

describe('useCollections — websocket sync', () => {
  it('FE-PAGE-COLL-071: ignores messages from other domains', async () => {
    await setup()
    store.loadAll.mockClear()
    act(() => wsHandler()({ type: 'trip:updated' }))
    expect(store.loadAll).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-072: a deleted active list bounces to the rail', async () => {
    store.activeId = 4
    await setup()
    store.loadAll.mockClear()
    act(() => wsHandler()({ type: 'collections:deleted', collectionId: 4 }))

    expect(navigate).toHaveBeenCalledWith('/collections')
    expect(store.loadAll).toHaveBeenCalledTimes(1)
  })

  it('FE-PAGE-COLL-073: being removed from another list only refreshes the rail', async () => {
    store.activeId = 4
    await setup()
    store.loadAll.mockClear()
    act(() => wsHandler()({ type: 'collections:removed', collectionId: 9 }))

    expect(navigate).not.toHaveBeenCalled()
    expect(store.loadAll).toHaveBeenCalledTimes(1)
    expect(store.loadCollection).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-074: an incoming invite is announced', async () => {
    await setup()
    act(() => wsHandler()({ type: 'collections:invite' }))
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'info', undefined)
  })

  it('FE-PAGE-COLL-075: an update reloads the active list without dropping the selection', async () => {
    store.activeId = 4
    await setup()
    store.loadAll.mockClear()
    // The route sync already activated the union on mount; only the WS effect counts here.
    store.setActive.mockClear()
    act(() => wsHandler()({ type: 'collections:updated', collectionId: 4 }))

    expect(store.loadAll).toHaveBeenCalledTimes(1)
    expect(store.loadCollection).toHaveBeenCalledWith(4)
    expect(store.setActive).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-084: an update with no active list only refreshes the rail', async () => {
    routeParams = { id: 'nope' }
    store.activeId = null
    await setup()
    store.loadAll.mockClear()
    act(() => wsHandler()({ type: 'collections:left' }))

    expect(store.loadAll).toHaveBeenCalledTimes(1)
    expect(store.loadCollection).not.toHaveBeenCalled()
    expect(store.setActive).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLL-076: an update on the All-saved union re-unions the lists', async () => {
    store.activeId = 'all'
    await setup()
    act(() => wsHandler()({ type: 'collections:accepted' }))

    expect(store.setActive).toHaveBeenCalledWith('all')
    expect(store.loadCollection).not.toHaveBeenCalled()
  })
})

describe('useCollections — map relayout nudge', () => {
  it('FE-PAGE-COLL-077: toggling the view on a wide layout pumps resize events until the transition ends', async () => {
    wideMedia = true
    const frames: FrameRequestCallback[] = []
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length })
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)

    const onResize = vi.fn()
    window.addEventListener('resize', onResize)

    const { rerender, unmount } = await setup()
    expect(frames).toHaveLength(0)

    store.view = 'map'
    rerender()
    expect(frames).toHaveLength(1)

    act(() => { frames[0](0) })
    expect(onResize).toHaveBeenCalledTimes(1)
    expect(frames).toHaveLength(2)

    // Past the 440ms transition window the loop stops scheduling.
    now.mockReturnValue(1000)
    act(() => { frames[1](0) })
    expect(onResize).toHaveBeenCalledTimes(2)
    expect(frames).toHaveLength(2)

    unmount()
    expect(cancel).toHaveBeenCalled()
    window.removeEventListener('resize', onResize)
  })

  it('FE-PAGE-COLL-078: a narrow layout never schedules the nudge', async () => {
    wideMedia = false
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { rerender } = await setup()
    store.view = 'map'
    rerender()
    expect(frames).toHaveLength(0)
  })
})

describe('useCollections — local UI state', () => {
  it('FE-PAGE-COLL-079: the list editor target opens for create and for an existing list', async () => {
    const target = collection({ id: 3, name: 'Rome' })
    const { result } = await setup()

    act(() => result.current.setEditorTarget('new'))
    expect(result.current.editorTarget).toBe('new')

    act(() => result.current.setEditorTarget(target))
    expect(result.current.editorTarget).toEqual(target)

    act(() => result.current.setEditorTarget(null))
    expect(result.current.editorTarget).toBeNull()
  })

  it('FE-PAGE-COLL-080: the add-place and label-manager modals toggle', async () => {
    const { result } = await setup()
    act(() => result.current.setShowAddPlace(true))
    expect(result.current.showAddPlace).toBe(true)

    act(() => result.current.setShowLabelManager(true))
    expect(result.current.showLabelManager).toBe(true)
  })

  it('FE-PAGE-COLL-081: store setters are handed through untouched', async () => {
    const { result } = await setup()
    expect(result.current.setView).toBe(store.setView)
    expect(result.current.setSortMode).toBe(store.setSortMode)
    expect(result.current.setRatingFilter).toBe(store.setRatingFilter)
    expect(result.current.toggleSelect).toBe(store.toggleSelect)
    expect(result.current.uploadPlaceImage).toBe(store.uploadPlaceImage)
  })
})
