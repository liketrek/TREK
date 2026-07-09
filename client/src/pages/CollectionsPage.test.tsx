// Regression coverage for issue #1485 — the "Add place" button vanished once a
// collection held its first mappable place on a wide/desktop layout, because the
// whole toolbar (which hosts the button) was gated on `!mapOverlay`. These tests
// render the page against a mocked useCollections hook (per the Page pattern) and
// assert the Add affordance stays reachable — and that there is exactly one of it.
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '../../tests/helpers/render'
import CollectionsPage from './CollectionsPage'

// Stub every child so the test isolates CollectionsPage's own toolbar/branch JSX
// (the Add button is rendered by the page itself, not by any child). This also
// keeps the Leaflet/Mapbox map out of jsdom.
vi.mock('../components/Layout/Navbar', () => ({ default: () => <nav /> }))
vi.mock('../components/Collections/ListsRail', () => ({ default: () => <div /> }))
vi.mock('../components/Collections/ListEditorModal', () => ({ default: () => null }))
vi.mock('../components/Collections/CollectionHero', () => ({ default: () => <div /> }))
vi.mock('../components/Collections/CollectionList', () => ({ default: () => <div data-testid="list" /> }))
vi.mock('../components/Collections/CollectionFilterBar', () => ({ default: () => <div /> }))
vi.mock('../components/Collections/CollectionMapPanel', () => ({ default: () => <div data-testid="map" /> }))
vi.mock('../components/Collections/CopyToTripModal', () => ({ default: () => null }))
vi.mock('../components/Collections/MoveToListModal', () => ({ default: () => null }))
vi.mock('../components/Collections/ShareCollectionModal', () => ({ default: () => null }))
vi.mock('../components/Collections/AddPlaceToCollectionModal', () => ({ default: () => null }))
vi.mock('../components/Collections/CollectionPlaceDetail', () => ({ default: () => null }))
vi.mock('../components/Collections/LabelManager', () => ({ default: () => null }))
vi.mock('../components/Collections/BulkAssignLabelModal', () => ({ default: () => null }))
vi.mock('../components/shared/Modal', () => ({ default: () => null }))

const mockUseCollections = vi.fn()
vi.mock('./collections/useCollections', () => ({
  useCollections: () => mockUseCollections(),
}))

// A complete-enough hook return; individual tests override the fields that matter.
function makeHook(overrides: Record<string, unknown> = {}) {
  const noop = vi.fn()
  return {
    t: (k: string) => k,
    language: 'en',
    dark: false,
    navigate: noop,
    isWide: true,
    heroRef: { current: null },
    heroHeight: 0,
    listColRef: { current: null },
    listColRect: null,
    categories: [],
    collections: [{ id: 1, name: 'Test', is_owner: true }],
    ownedLists: [{ id: 1, name: 'Test', is_owner: true }],
    sharedLists: [],
    activeCollection: { id: 1, name: 'Test', is_owner: true, color: '#6366f1' },
    isAllSaved: false,
    isOwner: true,
    myRole: 'owner',
    canEdit: true,
    canDelete: true,
    canShare: true,
    shareMemberCount: 0,
    activeId: 1,
    places: [{ id: 10 }],
    visiblePlaces: [{ id: 10 }],
    mappable: [{ id: 10 }],
    members: [],
    incomingInvites: [],
    counts: { all: 1, idea: 0, want: 1, visited: 0 },
    view: 'list',
    statusFilter: 'all',
    categoryFilter: 'all',
    categoryOptions: [],
    search: '',
    selectedPlaceId: null,
    selectMode: false,
    selectedIds: [],
    labels: [],
    labelFilter: [],
    labelOptions: [],
    loading: false,
    placesLoading: false,
    setView: noop, setStatusFilter: noop, setCategoryFilter: noop, setLabelFilter: noop,
    setSearch: noop, setSelectedPlaceId: noop, setSelectMode: noop, toggleSelect: noop,
    updatePlace: noop,
    showLabelManager: false, setShowLabelManager: noop, labelPickerOpen: false, setLabelPickerOpen: noop,
    handleCreateLabel: noop, handleUpdateLabel: noop, handleDeleteLabel: noop, handleBulkAssignLabels: noop, handleAssignPlaceLabels: noop,
    editorTarget: null, setEditorTarget: noop, handleEditorCreated: noop,
    showAddPlace: false, setShowAddPlace: noop, handlePlaceAdded: noop,
    confirmDeleteList: null, setConfirmDeleteList: noop,
    mobileRailOpen: false, setMobileRailOpen: noop,
    showShare: false, setShowShare: noop, handleAfterLeave: noop,
    selectedPlace: null, detailPlace: null, detailCategories: [], handleCloseDetail: noop,
    handleDetailStatus: noop, handleDetailRemove: noop,
    copyIds: null, openCopyForSelectedPlace: noop, openCopyForSelection: noop, closeCopy: noop, handleCopyToTrip: noop,
    handleSelectList: noop, handleDeleteList: noop,
    handleStatusChange: noop, handleDeletePlace: noop, handleDeleteSelected: noop,
    handleAcceptInvite: noop, handleDeclineInvite: noop,
    allVisibleSelected: false, handleSelectAll: noop,
    listPickerMode: null, setListPickerMode: noop, handleMoveToList: noop, handleDuplicateToList: noop,
    ...overrides,
  }
}

describe('CollectionsPage — Add place button reachability (#1485)', () => {
  it('keeps the Add button visible on a wide desktop once the list has a mappable place', () => {
    // The exact bug: wide layout + one place with coordinates + editable list.
    mockUseCollections.mockReturnValue(makeHook())
    render(<CollectionsPage />)
    const addButtons = screen.getAllByLabelText('collections.addPlace')
    // Present, and exactly one — no duplicate map-overlay "+" alongside it.
    expect(addButtons).toHaveLength(1)
  })

  it('does not show the Add button for a viewer who cannot edit', () => {
    mockUseCollections.mockReturnValue(makeHook({ canEdit: false, isOwner: false, myRole: 'viewer' }))
    render(<CollectionsPage />)
    expect(screen.queryByLabelText('collections.addPlace')).toBeNull()
  })

  it('shows the Add button on an empty collection', () => {
    mockUseCollections.mockReturnValue(makeHook({ places: [], visiblePlaces: [], mappable: [] }))
    render(<CollectionsPage />)
    expect(screen.getAllByLabelText('collections.addPlace')).toHaveLength(1)
  })
})
