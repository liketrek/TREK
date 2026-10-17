// Regression coverage for issue #1485 — the "Add place" button vanished once a
// collection held its first mappable place on a wide/desktop layout. The button
// now lives inside the filter row (delegated via `canAddPlace`) for a populated
// list, and as an empty-state CTA when the list has no places yet. These tests
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
// The filter row hosts the Add button for a populated list; mirror that contract
// so the page-level "reachable + exactly one" assertion still holds end to end.
vi.mock('../components/Collections/CollectionFilterBar', () => ({
  default: (props: { canAddPlace?: boolean; onAddPlace?: () => void }) =>
    props.canAddPlace
      ? <button type="button" onClick={props.onAddPlace}>collections.addPlace</button>
      : <div />,
}))
const mapPanelProps = vi.hoisted(() => ({ current: null as null | { onSelect: (id: number) => void; onDeselect: () => void } }))
vi.mock('../components/Collections/CollectionMapPanel', () => ({
  default: (props: { onSelect: (id: number) => void; onDeselect: () => void }) => {
    mapPanelProps.current = props
    return <div data-testid="map" />
  },
}))
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
    hasMappable: true,
    members: [],
    incomingInvites: [],
    orderedInvites: [],
    routeInvite: null,
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
    const addButtons = screen.getAllByRole('button', { name: 'collections.addPlace' })
    // Present, and exactly one — no duplicate affordance alongside it.
    expect(addButtons).toHaveLength(1)
  })

  it('does not show the Add button for a viewer who cannot edit', () => {
    mockUseCollections.mockReturnValue(makeHook({ canEdit: false, isOwner: false, myRole: 'viewer' }))
    render(<CollectionsPage />)
    expect(screen.queryByRole('button', { name: 'collections.addPlace' })).toBeNull()
  })

  it('shows the Add button on an empty collection', () => {
    mockUseCollections.mockReturnValue(makeHook({ places: [], visiblePlaces: [], mappable: [], hasMappable: false }))
    render(<CollectionsPage />)
    expect(screen.getAllByRole('button', { name: 'collections.addPlace' })).toHaveLength(1)
  })
})

describe('CollectionsPage — the map survives a filter that matches nothing', () => {
  it('keeps the map when a label filter empties the list', () => {
    // Clicking a label with no places behind it left visiblePlaces empty, and
    // the layout hung off exactly that: the map was torn out and the page
    // reflowed to full width. A filter should empty the map, not remove it.
    mockUseCollections.mockReturnValue(makeHook({ visiblePlaces: [], mappable: [], hasMappable: true }))
    render(<CollectionsPage />)
    expect(screen.getByTestId('map')).toBeInTheDocument()
  })

  it('still hides the map for a list with nothing mappable in it at all', () => {
    mockUseCollections.mockReturnValue(makeHook({ mappable: [], hasMappable: false }))
    render(<CollectionsPage />)
    expect(screen.queryByTestId('map')).toBeNull()
  })
})

describe('CollectionsPage: a marker click shows the place (#2431)', () => {
  it('selects the place a marker stands for, even when that place is already selected', () => {
    const setSelectedPlaceId = vi.fn()
    mockUseCollections.mockReturnValue(makeHook({ selectedPlaceId: 10, setSelectedPlaceId }))
    render(<CollectionsPage />)
    // A second click on the marker of the open place used to toggle it away, which
    // read as the details refusing to open. The map background is what clears.
    mapPanelProps.current!.onSelect(10)
    expect(setSelectedPlaceId).toHaveBeenLastCalledWith(10)
    mapPanelProps.current!.onDeselect()
    expect(setSelectedPlaceId).toHaveBeenLastCalledWith(null)
  })
})

// #2645: the rail is hidden below 1080px and an invitee with no lists of their
// own saw only "Start your first collection", so the invites the person has to
// answer also sit at the top of the body.
describe('CollectionsPage: invites in the body (#2645)', () => {
  const invite = { collection_id: 14, name: 'Lisbon', from: { id: 4, username: 'Lena' } }
  const other = { collection_id: 3, name: 'Rome', from: { id: 5, username: 'Tom' } }
  const noLists = {
    collections: [], ownedLists: [], activeCollection: null, activeId: null,
    places: [], visiblePlaces: [], mappable: [], hasMappable: false, canShare: false,
  }

  it('with no lists of their own, every invite can be answered from the body', () => {
    const handleAcceptInvite = vi.fn()
    const handleDeclineInvite = vi.fn()
    mockUseCollections.mockReturnValue(makeHook({
      ...noLists, incomingInvites: [invite, other], orderedInvites: [invite, other],
      handleAcceptInvite, handleDeclineInvite,
    }))
    render(<CollectionsPage />)
    expect(screen.getByText('Lisbon')).toBeInTheDocument()
    expect(screen.getByText('Rome')).toBeInTheDocument()
    expect(screen.getByText('collections.empty.firstTitle')).toBeInTheDocument()
    screen.getAllByRole('button', { name: 'collections.invites.accept' })[0].click()
    expect(handleAcceptInvite).toHaveBeenCalledWith(14)
    screen.getAllByRole('button', { name: 'collections.invites.decline' })[1].click()
    expect(handleDeclineInvite).toHaveBeenCalledWith(3)
  })

  it('with lists, only the invite the route points at is shown in the body', () => {
    mockUseCollections.mockReturnValue(makeHook({
      incomingInvites: [other, invite], orderedInvites: [invite, other], routeInvite: invite,
    }))
    render(<CollectionsPage />)
    expect(screen.getByText('Lisbon')).toBeInTheDocument()
    expect(screen.queryByText('Rome')).not.toBeInTheDocument()
  })

  it('with lists and no invite on the route, the body leaves invites to the rail', () => {
    mockUseCollections.mockReturnValue(makeHook({ incomingInvites: [invite], orderedInvites: [invite] }))
    render(<CollectionsPage />)
    expect(screen.queryByRole('button', { name: 'collections.invites.accept' })).not.toBeInTheDocument()
  })
})
