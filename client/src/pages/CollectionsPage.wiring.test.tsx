// FE-PAGE-COLLPAGE-001 to FE-PAGE-COLLPAGE-030
// Structural coverage for the desktop Collections page: which branch of the body
// renders, which affordances a role gets, and that every child callback is wired
// to the hook. The page follows the Page pattern, so useCollections is mocked and
// each child is stubbed with a prop-driven button.
import React from 'react'
import { render, screen, fireEvent } from '../../tests/helpers/render'
import CollectionsPage from './CollectionsPage'

vi.mock('../components/Layout/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }))


vi.mock('../components/Collections/ListsRail', () => ({
  default: (p: {
    onSelect: (id: number) => void
    onNewList: () => void
    onAcceptInvite: (id: number) => void
    onDeclineInvite: (id: number) => void
  }) => (
    <div data-testid="rail">
      <button type="button" onClick={() => p.onSelect(2)}>rail-select</button>
      <button type="button" onClick={p.onNewList}>rail-new</button>
      <button type="button" onClick={() => p.onAcceptInvite(3)}>rail-accept</button>
      <button type="button" onClick={() => p.onDeclineInvite(3)}>rail-decline</button>
    </div>
  ),
}))

vi.mock('../components/Collections/CollectionHero', () => ({
  default: (p: { eyebrow: string; title: string; canEdit: boolean; onEdit: () => void; onShare: () => void }) => (
    <div data-testid="hero">
      <span data-testid="hero-eyebrow">{p.eyebrow}</span>
      <span data-testid="hero-title">{p.title}</span>
      {p.canEdit && <button type="button" onClick={p.onEdit}>hero-edit</button>}
      <button type="button" onClick={p.onShare}>hero-share</button>
    </div>
  ),
}))

vi.mock('../components/Collections/CollectionList', () => ({
  default: (p: { places: { id: number }[]; onOpenPlace: (id: number) => void; onStatusChange?: (id: number, s: string) => void }) => (
    <div data-testid="list">
      <span data-testid="list-count">{p.places.length}</span>
      <span data-testid="list-can-status">{p.onStatusChange ? 'yes' : 'no'}</span>
      <button type="button" onClick={() => p.onOpenPlace(10)}>list-open</button>
    </div>
  ),
}))

vi.mock('../components/Collections/CollectionFilterBar', () => ({
  default: (p: { canAddPlace?: boolean; onAddPlace: () => void; showLabels: boolean; canManageLabels: boolean; onManageLabels: () => void; showSelect: boolean; onToggleSelect: () => void }) => (
    <div data-testid="filterbar">
      <span data-testid="filter-flags">{`${p.showLabels}|${p.canManageLabels}|${p.showSelect}`}</span>
      {p.canAddPlace && <button type="button" onClick={p.onAddPlace}>filter-add</button>}
      <button type="button" onClick={p.onManageLabels}>filter-labels</button>
      <button type="button" onClick={p.onToggleSelect}>filter-select</button>
    </div>
  ),
}))

vi.mock('../components/Collections/CollectionMapPanel', () => ({
  default: (p: { overlay: boolean; places: { id: number }[]; onSelect: (id: number) => void; onDeselect: () => void; onToggleView: () => void; onSearch: (v: string) => void; onLabelFilter?: (ids: number[]) => void; onManageLabels?: () => void }) => (
    <div data-testid={p.overlay ? 'map-overlay' : 'map-plain'}>
      <span data-testid="map-count">{p.places.length}</span>
      <span data-testid="map-has-labels">{String(p.onLabelFilter != null)}</span>
      {p.onManageLabels && <button type="button" onClick={p.onManageLabels}>map-labels</button>}
      <button type="button" onClick={() => p.onSelect(10)}>map-select</button>
      <button type="button" onClick={p.onDeselect}>map-deselect</button>
      <button type="button" onClick={p.onToggleView}>map-toggle</button>
      <button type="button" onClick={() => p.onSearch('cafe')}>map-search</button>
    </div>
  ),
}))

vi.mock('../components/Collections/CopyToTripModal', () => ({
  default: (p: { isOpen: boolean; placeIds: number[]; onClose: () => void }) =>
    p.isOpen ? <div data-testid="copy-modal">{p.placeIds.join(',')}<button type="button" onClick={p.onClose}>copy-close</button></div> : null,
}))

vi.mock('../components/Collections/MoveToListModal', () => ({
  default: (p: { mode: string; lists: { id: number }[]; count: number; onPick: (id: number) => void; onClose: () => void }) => (
    <div data-testid="move-modal">
      <span data-testid="move-mode">{p.mode}</span>
      <span data-testid="move-lists">{p.lists.map(l => l.id).join(',')}</span>
      <button type="button" onClick={() => p.onPick(9)}>move-pick</button>
      <button type="button" onClick={p.onClose}>move-close</button>
    </div>
  ),
}))

vi.mock('../components/Collections/ShareCollectionModal', () => ({
  default: (p: { isOpen: boolean; onClose: () => void; onAfterLeave: () => void }) =>
    p.isOpen ? <div data-testid="share-modal"><button type="button" onClick={p.onClose}>share-close</button><button type="button" onClick={p.onAfterLeave}>share-leave</button></div> : null,
}))

vi.mock('../components/Collections/AddPlaceToCollectionModal', () => ({
  default: (p: { isOpen: boolean; collectionId: number; onClose: () => void; onAdded: () => void }) =>
    p.isOpen ? <div data-testid="addplace-modal">{p.collectionId}<button type="button" onClick={p.onClose}>addplace-close</button><button type="button" onClick={p.onAdded}>addplace-added</button></div> : null,
}))

vi.mock('../components/Collections/CollectionPlaceDetail', () => ({
  default: (p: {
    place: { id: number }
    anchorRect: { left: number; width: number } | null
    onClose: () => void
    onSetStatus: (s: string) => void
    onSave: (patch: Record<string, unknown>) => void
    onUploadImage: (f: File) => void
    onCopyToTrip: () => void
    onRemove: () => void
    onRate: (r: number) => void
  }) => (
    <div data-testid="detail">
      <span data-testid="detail-anchored">{p.anchorRect ? 'docked' : 'sheet'}</span>
      <button type="button" onClick={p.onClose}>detail-close</button>
      <button type="button" onClick={() => p.onSetStatus('visited')}>detail-status</button>
      <button type="button" onClick={() => p.onSave({ notes: 'hi' })}>detail-save</button>
      <button type="button" onClick={() => p.onUploadImage(new File(['x'], 'a.png'))}>detail-upload</button>
      <button type="button" onClick={p.onCopyToTrip}>detail-copy</button>
      <button type="button" onClick={p.onRemove}>detail-remove</button>
      <button type="button" onClick={() => p.onRate(4)}>detail-rate</button>
    </div>
  ),
}))

vi.mock('../components/Collections/ListEditorModal', () => ({
  default: (p: { target: unknown; onClose: () => void; onCreated: (id: number) => void; onRequestDelete: (id: number) => void }) => (
    <div data-testid="editor">
      <span data-testid="editor-target">{p.target === null ? 'closed' : String(p.target)}</span>
      <button type="button" onClick={p.onClose}>editor-close</button>
      <button type="button" onClick={() => p.onCreated(77)}>editor-created</button>
      <button type="button" onClick={() => p.onRequestDelete(5)}>editor-delete</button>
    </div>
  ),
}))

vi.mock('../components/Collections/LabelManager', () => ({
  default: (p: { isOpen: boolean; onCreate: (n: string) => void; onUpdate: (id: number, b: Record<string, unknown>) => void; onDelete: (id: number) => void; onClose: () => void }) =>
    p.isOpen ? (
      <div data-testid="label-manager">
        <button type="button" onClick={() => p.onCreate('Food')}>label-create</button>
        <button type="button" onClick={() => p.onUpdate(1, { name: 'x' })}>label-update</button>
        <button type="button" onClick={() => p.onDelete(1)}>label-delete</button>
        <button type="button" onClick={p.onClose}>label-close</button>
      </div>
    ) : null,
}))

vi.mock('../components/Collections/BulkAssignLabelModal', () => ({
  default: (p: { isOpen: boolean; count: number; onAssign: (ids: number[]) => void; onManage: () => void; onClose: () => void }) =>
    p.isOpen ? (
      <div data-testid="bulk-labels">
        <span data-testid="bulk-count">{p.count}</span>
        <button type="button" onClick={() => p.onAssign([1])}>bulk-assign</button>
        <button type="button" onClick={p.onManage}>bulk-manage</button>
        <button type="button" onClick={p.onClose}>bulk-close</button>
      </div>
    ) : null,
}))

vi.mock('../components/shared/Modal', () => ({
  default: (p: { isOpen: boolean; title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) =>
    p.isOpen ? (
      <div data-testid="confirm-modal">
        <span>{p.title}</span>
        <button type="button" onClick={p.onClose}>modal-dismiss</button>
        {p.children}
        {p.footer}
      </div>
    ) : null,
}))

vi.mock('../components/shared/EmptyState', () => ({
  default: (p: { scene: string; title: string }) => <div data-testid={`empty-${p.scene}`}>{p.title}</div>,
}))

const mockUseCollections = vi.fn()
vi.mock('./collections/useCollections', () => ({ useCollections: () => mockUseCollections() }))

type Hook = Record<string, unknown>
const noop = vi.fn(() => {})

function makeHook(overrides: Hook = {}): Hook {
  const list = { id: 1, name: 'Japan', is_owner: true, color: '#6366f1', cover_image: null, description: 'trip ideas' }
  return {
    t: (k: string) => k,
    language: 'en',
    dark: false,
    navigate: noop,
    isWide: true,
    heroRef: () => {},
    heroHeight: 240,
    listColRef: () => {},
    listColRect: { left: 10, width: 400 },
    categories: [],
    collections: [list],
    ownedLists: [list, { id: 4, name: 'Other', is_owner: true }],
    sharedLists: [],
    activeCollection: list,
    isAllSaved: false,
    isOwner: true,
    myRole: 'owner',
    canEdit: true,
    canDelete: true,
    canShare: true,
    shareMemberCount: 2,
    activeId: 1,
    places: [{ id: 10 }],
    visiblePlaces: [{ id: 10 }],
    mappable: [{ id: 10 }],
    hasMappable: true,
    members: [],
    incomingInvites: [],
    counts: { all: 1, idea: 0, want: 1, visited: 0 },
    view: 'list',
    statusFilter: 'all',
    categoryFilter: 'all',
    categoryOptions: [],
    ratingFilter: 'all',
    sortMode: 'default',
    search: '',
    selectedPlaceId: null,
    selectMode: false,
    selectedIds: [],
    labels: [],
    labelFilter: [],
    labelOptions: [],
    loading: false,
    placesLoading: false,
    setView: vi.fn(() => {}),
    setStatusFilter: noop,
    setCategoryFilter: noop,
    setRatingFilter: noop,
    setLabelFilter: noop,
    setSortMode: noop,
    setSearch: vi.fn(() => {}),
    setSelectedPlaceId: vi.fn(() => {}),
    setSelectMode: vi.fn(() => {}),
    toggleSelect: noop,
    updatePlace: vi.fn(() => {}),
    uploadPlaceImage: vi.fn(() => {}),
    showLabelManager: false,
    setShowLabelManager: vi.fn(() => {}),
    labelPickerOpen: false,
    setLabelPickerOpen: vi.fn(() => {}),
    handleCreateLabel: vi.fn(() => {}),
    handleUpdateLabel: vi.fn(() => {}),
    handleDeleteLabel: vi.fn(() => {}),
    handleBulkAssignLabels: vi.fn(() => {}),
    handleAssignPlaceLabels: noop,
    editorTarget: null,
    setEditorTarget: vi.fn(() => {}),
    handleEditorCreated: vi.fn(() => {}),
    showAddPlace: false,
    setShowAddPlace: vi.fn(() => {}),
    handlePlaceAdded: vi.fn(() => {}),
    confirmDeleteList: null,
    setConfirmDeleteList: vi.fn(() => {}),
    mobileRailOpen: false,
    setMobileRailOpen: vi.fn(() => {}),
    showShare: false,
    setShowShare: vi.fn(() => {}),
    handleAfterLeave: vi.fn(() => {}),
    selectedPlace: null,
    detailPlace: null,
    detailCategories: [],
    handleCloseDetail: vi.fn(() => {}),
    handleDetailStatus: vi.fn(() => {}),
    handleDetailRemove: vi.fn(() => {}),
    copyIds: null,
    openCopyForSelectedPlace: vi.fn(() => {}),
    openCopyForSelection: vi.fn(() => {}),
    closeCopy: vi.fn(() => {}),
    handleCopyToTrip: vi.fn(() => {}),
    handleSelectList: vi.fn(() => {}),
    handleDeleteList: vi.fn(() => {}),
    handleStatusChange: vi.fn(() => {}),
    handleRatePlace: vi.fn(() => {}),
    handleDeletePlace: vi.fn(() => {}),
    handleDeleteSelected: vi.fn(() => {}),
    handleAcceptInvite: vi.fn(() => {}),
    handleDeclineInvite: vi.fn(() => {}),
    allVisibleSelected: false,
    handleSelectAll: vi.fn(() => {}),
    listPickerMode: null,
    setListPickerMode: vi.fn(() => {}),
    handleMoveToList: vi.fn(() => {}),
    handleDuplicateToList: vi.fn(() => {}),
    ...overrides,
  }
}

/** Render the page for a hook fixture and hand the fixture back for assertions. */
function renderPage(overrides: Hook = {}): Hook {
  const hook = makeHook(overrides)
  mockUseCollections.mockReturnValue(hook)
  render(<CollectionsPage />)
  return hook
}

beforeEach(() => {
  mockUseCollections.mockReset()
})

describe('CollectionsPage — shell', () => {
  it('FE-PAGE-COLLPAGE-002: renders the desktop shell with hero, rail and list', () => {
    renderPage()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('rail')).toBeInTheDocument()
    expect(screen.getByTestId('hero-title')).toHaveTextContent('Japan')
    expect(screen.getByTestId('hero-eyebrow')).toHaveTextContent('collections.hero.mine')
    expect(screen.getByTestId('list-count')).toHaveTextContent('1')
  })

  it('FE-PAGE-COLLPAGE-003: labels the All-saved union with its own title and eyebrow', () => {
    renderPage({ isAllSaved: true, activeCollection: null, activeId: 'all' })
    expect(screen.getByTestId('hero-title')).toHaveTextContent('collections.allSaved')
    expect(screen.getByTestId('hero-eyebrow')).toHaveTextContent('collections.hero.all')
  })

  it('FE-PAGE-COLLPAGE-004: marks a shared list in the eyebrow and hides the edit affordance', () => {
    renderPage({
      activeCollection: { id: 1, name: 'Shared', is_owner: false },
      isOwner: false,
      myRole: 'editor',
    })
    expect(screen.getByTestId('hero-eyebrow')).toHaveTextContent('collections.hero.shared')
    expect(screen.queryByText('hero-edit')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-005: falls back to the generic title when no list is active', () => {
    renderPage({ activeCollection: null, activeId: null, isAllSaved: false })
    expect(screen.getByTestId('hero-title')).toHaveTextContent('collections.title')
  })

  it('FE-PAGE-COLLPAGE-006: offers a first-list CTA when the user has no lists at all', () => {
    const hook = renderPage({ collections: [], loading: false, places: [] })
    expect(screen.getByTestId('empty-collections')).toHaveTextContent('collections.empty.firstTitle')
    expect(screen.queryByTestId('hero')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /collections.newList/ }))
    expect(hook.setEditorTarget).toHaveBeenCalledWith('new')
  })

  it('FE-PAGE-COLLPAGE-007: shows a spinner while the first places load', () => {
    renderPage({ places: [], visiblePlaces: [], mappable: [], hasMappable: false, placesLoading: true })
    expect(document.querySelector('.col-spinner')).not.toBeNull()
    expect(screen.queryByTestId('list')).toBeNull()
  })
})

describe('CollectionsPage — body branches', () => {
  it('FE-PAGE-COLLPAGE-008: an empty list shows the empty state plus the add CTA', () => {
    const hook = renderPage({ places: [], visiblePlaces: [], mappable: [], hasMappable: false })
    expect(screen.getByTestId('empty-collections')).toHaveTextContent('collections.empty.title')

    fireEvent.click(screen.getByRole('button', { name: /collections.addPlace/ }))
    expect(hook.setShowAddPlace).toHaveBeenCalledWith(true)
  })

  it('FE-PAGE-COLLPAGE-009: a viewer on an empty list gets no add CTA', () => {
    renderPage({ places: [], visiblePlaces: [], mappable: [], hasMappable: false, canEdit: false })
    expect(screen.getByTestId('empty-collections')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /collections.addPlace/ })).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-010: a wide layout with mappable places renders the split with an overlay map', () => {
    renderPage()
    expect(screen.getByTestId('map-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('list')).toBeInTheDocument()
    // The map overlay owns the toolbar, so the page-level search box is gone.
    expect(screen.queryByPlaceholderText('collections.search')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-011: a narrow layout in map view renders the standalone map', () => {
    renderPage({ isWide: false, view: 'map' })
    expect(screen.getByTestId('map-plain')).toBeInTheDocument()
    expect(screen.queryByTestId('list')).toBeNull()
    expect(screen.getByPlaceholderText('collections.search')).toBeInTheDocument()
  })

  it('FE-PAGE-COLLPAGE-012: a narrow layout in list view renders the plain list column', () => {
    renderPage({ isWide: false })
    expect(screen.getByTestId('list')).toBeInTheDocument()
    expect(screen.queryByTestId('map-plain')).toBeNull()
    expect(screen.queryByTestId('map-overlay')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-013: places without coordinates keep the list column even on a wide layout', () => {
    renderPage({ mappable: [], hasMappable: false })
    expect(screen.getByTestId('list')).toBeInTheDocument()
    expect(screen.queryByTestId('map-overlay')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-014: a filter that matches nothing keeps the filter bar and shows the no-match state', () => {
    renderPage({ visiblePlaces: [], mappable: [], hasMappable: false })
    expect(screen.getByTestId('filterbar')).toBeInTheDocument()
    expect(screen.getByTestId('empty-search')).toHaveTextContent('collections.empty.noMatchTitle')
    expect(screen.queryByTestId('list')).toBeNull()
  })
})

describe('CollectionsPage — toolbar', () => {
  it('FE-PAGE-COLLPAGE-015: the view segment toggles between list and map below the split breakpoint', () => {
    const hook = renderPage({ isWide: false })
    fireEvent.click(screen.getByRole('button', { name: 'collections.view.map' }))
    expect(hook.setView).toHaveBeenCalledWith('map')

    fireEvent.click(screen.getByRole('button', { name: 'collections.view.list' }))
    expect(hook.setView).toHaveBeenCalledWith('list')
  })

  it('FE-PAGE-COLLPAGE-016: the search box feeds the store', () => {
    const hook = renderPage({ isWide: false })
    fireEvent.change(screen.getByPlaceholderText('collections.search'), { target: { value: 'ramen' } })
    expect(hook.setSearch).toHaveBeenCalledWith('ramen')
  })

  it('FE-PAGE-COLLPAGE-017: the rail toggle opens the mobile drawer, which closes again', () => {
    const hook = renderPage({ isWide: false })
    fireEvent.click(screen.getByRole('button', { name: /collections.title/ }))
    expect(hook.setMobileRailOpen).toHaveBeenCalledWith(true)
  })

  it('FE-PAGE-COLLPAGE-018: the open drawer renders a second rail and closes on the backdrop', () => {
    const hook = renderPage({ mobileRailOpen: true })
    expect(screen.getAllByTestId('rail')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(hook.setMobileRailOpen).toHaveBeenCalledWith(false)

    const backdrop = document.querySelector('.col-drawer-backdrop')
    fireEvent.click(backdrop as Element)
    expect(hook.setMobileRailOpen).toHaveBeenCalledTimes(2)
  })
})

describe('CollectionsPage — select mode', () => {
  const selecting = { selectMode: true, selectedIds: [10, 11] }

  it('FE-PAGE-COLLPAGE-019: the select bar exposes every bulk action to an owner', () => {
    const hook = renderPage(selecting)
    expect(screen.getByText('collections.selectedCount')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /collections.selectAll/ }))
    expect(hook.handleSelectAll).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /collections.labels.assign/ }))
    expect(hook.setLabelPickerOpen).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: /collections.moveToList/ }))
    expect(hook.setListPickerMode).toHaveBeenCalledWith('move')

    fireEvent.click(screen.getByRole('button', { name: /collections.duplicateToList/ }))
    expect(hook.setListPickerMode).toHaveBeenCalledWith('copy')

    fireEvent.click(screen.getByRole('button', { name: /collections.copyToTrip/ }))
    expect(hook.openCopyForSelection).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /common.delete/ }))
    expect(hook.handleDeleteSelected).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(hook.setSelectMode).toHaveBeenCalledWith(false)
  })

  it('FE-PAGE-COLLPAGE-020: the select-all button flips to deselect once everything is selected', () => {
    renderPage({ ...selecting, allVisibleSelected: true })
    expect(screen.getByRole('button', { name: /collections.deselectAll/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /collections.selectAll/ })).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-021: a viewer only keeps the non-mutating bulk actions', () => {
    renderPage({ ...selecting, canEdit: false, canDelete: false })
    expect(screen.queryByRole('button', { name: /collections.moveToList/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /collections.labels.assign/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /common.delete/ })).toBeNull()
    expect(screen.getByRole('button', { name: /collections.duplicateToList/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collections.copyToTrip/ })).toBeInTheDocument()
  })

  it('FE-PAGE-COLLPAGE-022: bulk buttons are disabled while nothing is selected', () => {
    renderPage({ selectMode: true, selectedIds: [] })
    expect(screen.getByRole('button', { name: /collections.moveToList/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /collections.copyToTrip/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /common.delete/ })).toBeDisabled()
  })

  it('FE-PAGE-COLLPAGE-023: the All-saved union hides the label bulk action', () => {
    renderPage({ ...selecting, isAllSaved: true, activeId: 'all', activeCollection: null })
    expect(screen.queryByRole('button', { name: /collections.labels.assign/ })).toBeNull()
    expect(screen.getByRole('button', { name: /collections.moveToList/ })).toBeInTheDocument()
  })
})

describe('CollectionsPage — child wiring', () => {
  it('FE-PAGE-COLLPAGE-024: the rail forwards select, new-list and invite actions', () => {
    const hook = renderPage()
    fireEvent.click(screen.getByText('rail-select'))
    expect(hook.handleSelectList).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByText('rail-new'))
    expect(hook.setMobileRailOpen).toHaveBeenCalledWith(false)
    expect(hook.setEditorTarget).toHaveBeenCalledWith('new')

    fireEvent.click(screen.getByText('rail-accept'))
    expect(hook.handleAcceptInvite).toHaveBeenCalledWith(3)

    fireEvent.click(screen.getByText('rail-decline'))
    expect(hook.handleDeclineInvite).toHaveBeenCalledWith(3)
  })

  it('FE-PAGE-COLLPAGE-025: the hero forwards edit and share', () => {
    const list = { id: 1, name: 'Japan', is_owner: true }
    const hook = renderPage({ activeCollection: list })
    fireEvent.click(screen.getByText('hero-edit'))
    expect(hook.setEditorTarget).toHaveBeenCalledWith(list)

    fireEvent.click(screen.getByText('hero-share'))
    expect(hook.setShowShare).toHaveBeenCalledWith(true)
  })

  it('FE-PAGE-COLLPAGE-026: opening a place toggles the selection, and re-opening clears it', () => {
    const hook = renderPage()
    fireEvent.click(screen.getByText('list-open'))
    expect(hook.setSelectedPlaceId).toHaveBeenCalledWith(10)

    const open = renderPage({ selectedPlaceId: 10 })
    fireEvent.click(screen.getAllByText('list-open')[1])
    expect(open.setSelectedPlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-PAGE-COLLPAGE-027: the map deselects, searches and toggles back to the list', () => {
    const hook = renderPage()
    fireEvent.click(screen.getByText('map-deselect'))
    expect(hook.setSelectedPlaceId).toHaveBeenCalledWith(null)

    fireEvent.click(screen.getByText('map-search'))
    expect(hook.setSearch).toHaveBeenCalledWith('cafe')

    // From the list view the toggle closes the detail sheet and switches to map.
    fireEvent.click(screen.getByText('map-toggle'))
    expect(hook.setSelectedPlaceId).toHaveBeenCalledWith(null)
    expect(hook.setView).toHaveBeenCalledWith('map')
  })

  it('FE-PAGE-COLLPAGE-028: from the map view a marker click drops back into the split', () => {
    const hook = renderPage({ view: 'map' })
    fireEvent.click(screen.getByText('map-select'))
    expect(hook.setSelectedPlaceId).toHaveBeenCalledWith(10)
    expect(hook.setView).toHaveBeenCalledWith('list')
  })

  it('FE-PAGE-COLLPAGE-029: the map view toggle returns to the list without clearing the selection', () => {
    const hook = renderPage({ view: 'map' })
    fireEvent.click(screen.getByText('map-toggle'))
    expect(hook.setView).toHaveBeenCalledWith('list')
    expect(hook.setSelectedPlaceId).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLLPAGE-030: the filter bar drives add-place and select mode, the map takes the labels', () => {
    const hook = renderPage()
    // Labels ride in the map's top bar while a map is on screen, so the filter
    // row is told not to draw them a second time.
    expect(screen.getByTestId('filter-flags')).toHaveTextContent('false|true|true')
    expect(screen.getByTestId('map-has-labels')).toHaveTextContent('true')

    fireEvent.click(screen.getByText('filter-add'))
    expect(hook.setShowAddPlace).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByText('map-labels'))
    expect(hook.setShowLabelManager).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByText('filter-select'))
    expect(hook.setSelectMode).toHaveBeenCalledWith(true)
  })

  it('FE-PAGE-COLLPAGE-030b: without a map the filter row keeps the labels, so they stay reachable', () => {
    const hook = renderPage({ mappable: [], hasMappable: false })
    expect(screen.getByTestId('filter-flags')).toHaveTextContent('true|true|true')
    expect(screen.queryByTestId('map-overlay')).toBeNull()

    fireEvent.click(screen.getByText('filter-labels'))
    expect(hook.setShowLabelManager).toHaveBeenCalledWith(true)
  })

  it('FE-PAGE-COLLPAGE-031: the All-saved union has no labels and no add button in the filter row', () => {
    renderPage({ isAllSaved: true, activeId: 'all', activeCollection: null })
    expect(screen.getByTestId('filter-flags')).toHaveTextContent('false|false|true')
    expect(screen.queryByText('filter-add')).toBeNull()
  })
})

describe('CollectionsPage — detail sheet and modals', () => {
  const withPlace = { selectedPlace: { id: 10, name: 'Bar' }, selectedPlaceId: 10 }

  it('FE-PAGE-COLLPAGE-032: the detail sheet docks over the list column on the split', () => {
    const hook = renderPage(withPlace)
    expect(screen.getByTestId('detail-anchored')).toHaveTextContent('docked')

    fireEvent.click(screen.getByText('detail-close'))
    expect(hook.handleCloseDetail).toHaveBeenCalled()

    fireEvent.click(screen.getByText('detail-status'))
    expect(hook.handleDetailStatus).toHaveBeenCalledWith('visited')

    fireEvent.click(screen.getByText('detail-save'))
    expect(hook.updatePlace).toHaveBeenCalledWith(10, { notes: 'hi' })

    fireEvent.click(screen.getByText('detail-upload'))
    expect(hook.uploadPlaceImage).toHaveBeenCalledWith(10, expect.any(File))

    fireEvent.click(screen.getByText('detail-copy'))
    expect(hook.openCopyForSelectedPlace).toHaveBeenCalled()

    fireEvent.click(screen.getByText('detail-remove'))
    expect(hook.handleDetailRemove).toHaveBeenCalled()

    fireEvent.click(screen.getByText('detail-rate'))
    expect(hook.handleRatePlace).toHaveBeenCalledWith(10, 4)
  })

  it('FE-PAGE-COLLPAGE-033: without a split the detail is a full-width sheet', () => {
    renderPage({ ...withPlace, isWide: false })
    expect(screen.getByTestId('detail-anchored')).toHaveTextContent('sheet')
  })

  it('FE-PAGE-COLLPAGE-034: the full-map view hides the detail sheet', () => {
    renderPage({ ...withPlace, view: 'map', isWide: false })
    expect(screen.queryByTestId('detail')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-035: the add-place modal is bound to the active list', () => {
    const hook = renderPage({ showAddPlace: true })
    expect(screen.getByTestId('addplace-modal')).toHaveTextContent('1')

    fireEvent.click(screen.getByText('addplace-added'))
    expect(hook.handlePlaceAdded).toHaveBeenCalled()

    fireEvent.click(screen.getByText('addplace-close'))
    expect(hook.setShowAddPlace).toHaveBeenCalledWith(false)
  })

  it('FE-PAGE-COLLPAGE-036: the All-saved union has no add-place modal', () => {
    renderPage({ showAddPlace: true, isAllSaved: true, activeId: 'all', activeCollection: null })
    expect(screen.queryByTestId('addplace-modal')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-037: the copy-to-trip modal opens with the pending ids', () => {
    const hook = renderPage({ copyIds: [10, 11] })
    expect(screen.getByTestId('copy-modal')).toHaveTextContent('10,11')

    fireEvent.click(screen.getByText('copy-close'))
    expect(hook.closeCopy).toHaveBeenCalled()
  })

  it('FE-PAGE-COLLPAGE-038: the list picker in move mode excludes the current list', () => {
    const hook = renderPage({ listPickerMode: 'move', selectedIds: [10] })
    expect(screen.getByTestId('move-mode')).toHaveTextContent('move')
    expect(screen.getByTestId('move-lists')).toHaveTextContent('4')

    fireEvent.click(screen.getByText('move-pick'))
    expect(hook.handleMoveToList).toHaveBeenCalledWith(9)

    fireEvent.click(screen.getByText('move-close'))
    expect(hook.setListPickerMode).toHaveBeenCalledWith(null)
  })

  it('FE-PAGE-COLLPAGE-039: the list picker in copy mode duplicates instead', () => {
    const hook = renderPage({ listPickerMode: 'copy', selectedIds: [10] })
    fireEvent.click(screen.getByText('move-pick'))
    expect(hook.handleDuplicateToList).toHaveBeenCalledWith(9)
    expect(hook.handleMoveToList).not.toHaveBeenCalled()
  })

  it('FE-PAGE-COLLPAGE-040: the share modal closes and reports a leave', () => {
    const hook = renderPage({ showShare: true })
    fireEvent.click(screen.getByText('share-leave'))
    expect(hook.handleAfterLeave).toHaveBeenCalled()

    fireEvent.click(screen.getByText('share-close'))
    expect(hook.setShowShare).toHaveBeenCalledWith(false)
  })

  it('FE-PAGE-COLLPAGE-041: a list that cannot be shared renders no share modal', () => {
    renderPage({ showShare: true, canShare: false })
    expect(screen.queryByTestId('share-modal')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-042: the list editor forwards create, close and delete requests', () => {
    const hook = renderPage()
    fireEvent.click(screen.getByText('editor-created'))
    expect(hook.handleEditorCreated).toHaveBeenCalledWith(77)

    fireEvent.click(screen.getByText('editor-delete'))
    expect(hook.setConfirmDeleteList).toHaveBeenCalledWith(5)

    fireEvent.click(screen.getByText('editor-close'))
    expect(hook.setEditorTarget).toHaveBeenCalledWith(null)
  })

  it('FE-PAGE-COLLPAGE-043: the label manager forwards its CRUD callbacks', () => {
    const hook = renderPage({ showLabelManager: true })
    fireEvent.click(screen.getByText('label-create'))
    expect(hook.handleCreateLabel).toHaveBeenCalledWith('Food')

    fireEvent.click(screen.getByText('label-update'))
    expect(hook.handleUpdateLabel).toHaveBeenCalledWith(1, { name: 'x' })

    fireEvent.click(screen.getByText('label-delete'))
    expect(hook.handleDeleteLabel).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByText('label-close'))
    expect(hook.setShowLabelManager).toHaveBeenCalledWith(false)
  })

  it('FE-PAGE-COLLPAGE-044: the bulk label picker can hand over to the manager', () => {
    const hook = renderPage({ labelPickerOpen: true, selectedIds: [10, 11] })
    expect(screen.getByTestId('bulk-count')).toHaveTextContent('2')

    fireEvent.click(screen.getByText('bulk-assign'))
    expect(hook.handleBulkAssignLabels).toHaveBeenCalledWith([1])

    fireEvent.click(screen.getByText('bulk-manage'))
    expect(hook.setLabelPickerOpen).toHaveBeenCalledWith(false)
    expect(hook.setShowLabelManager).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByText('bulk-close'))
    expect(hook.setLabelPickerOpen).toHaveBeenLastCalledWith(false)
  })

  it('FE-PAGE-COLLPAGE-045: label modals are absent for someone who cannot manage labels', () => {
    renderPage({ showLabelManager: true, labelPickerOpen: true, canEdit: false })
    expect(screen.queryByTestId('label-manager')).toBeNull()
    expect(screen.queryByTestId('bulk-labels')).toBeNull()
  })

  it('FE-PAGE-COLLPAGE-046: the delete-list confirmation runs the handler', () => {
    const hook = renderPage({ confirmDeleteList: 5 })
    expect(screen.getByTestId('confirm-modal')).toHaveTextContent('collections.deleteListConfirm')

    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    expect(hook.handleDeleteList).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(hook.setConfirmDeleteList).toHaveBeenCalledWith(null)

    // Dismissing the modal itself (backdrop / escape) clears the pending id too.
    fireEvent.click(screen.getByText('modal-dismiss'))
    expect(hook.setConfirmDeleteList).toHaveBeenCalledTimes(2)
  })

  it('FE-PAGE-COLLPAGE-047: no confirmation is rendered without a pending delete', () => {
    renderPage()
    expect(screen.queryByTestId('confirm-modal')).toBeNull()
  })
})
