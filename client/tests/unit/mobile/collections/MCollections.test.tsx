// FE-MOB-COLSCR-001 to FE-MOB-COLSCR-031
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../helpers/render'
import MCollections from '../../../../src/mobile/screens/collections/MCollections'
import { ALL_SAVED } from '../../../../src/store/collectionStore'

const mocks = vi.hoisted(() => ({ coll: {} as Record<string, unknown> }))

vi.mock('../../../../src/pages/collections/useCollections', () => ({
  useCollections: () => mocks.coll,
}))

// Keep the Leaflet/MapLibre stack out of jsdom, but keep its contract.
vi.mock('../../../../src/components/Collections/CollectionMap', () => ({
  default: (props: { places: { id: number }[]; onOpenPlace: (id: number) => void; onDeselect: () => void; dark: boolean }) => (
    <div data-testid="map">
      <span>{`markers:${props.places.length}`}</span>
      <span>{`dark:${String(props.dark)}`}</span>
      <button type="button" onClick={() => props.onOpenPlace(props.places[0].id)}>map-open</button>
      <button type="button" onClick={props.onDeselect}>map-deselect</button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/collections/MCollPlaceSheet', () => ({
  default: (props: {
    place: { id: number } | null
    onSave: (patch: Record<string, unknown>) => void
    onUploadImage: (file: File) => void
    onRate: (rating: number) => void
    onCopyToTrip: () => void
    onRemove: () => void
    onSetStatus: (status: string) => void
    onClose: () => void
  }) =>
    props.place ? (
      <div>
        <button type="button" onClick={() => props.onSave({ notes: 'moin' })}>place-save</button>
        <button type="button" onClick={() => props.onUploadImage(new File(['x'], 'p.png'))}>place-upload</button>
        <button type="button" onClick={() => props.onRate(4)}>place-rate</button>
        <button type="button" onClick={props.onCopyToTrip}>place-copy</button>
        <button type="button" onClick={props.onRemove}>place-remove</button>
        <button type="button" onClick={() => props.onSetStatus('visited')}>place-status</button>
        <button type="button" onClick={props.onClose}>place-close</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/mobile/screens/collections/MCollAddSheet', () => ({
  default: (props: { open: boolean; collectionId: number | null; collectionName: string; lists: { id: number }[]; onClose: () => void; onAdded: () => void }) =>
    props.open ? (
      <div>
        <span>{`add-target:${String(props.collectionId)}:${props.collectionName}:${props.lists.length}`}</span>
        <button type="button" onClick={props.onClose}>add-close</button>
        <button type="button" onClick={props.onAdded}>add-added</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/mobile/screens/collections/MCollShareSheet', () => ({
  default: (props: { open: boolean; collectionId: number | null; onClose: () => void; onAfterLeave: () => void }) =>
    props.open ? (
      <div>
        <span>{`share:${String(props.collectionId)}`}</span>
        <button type="button" onClick={props.onClose}>share-close</button>
        <button type="button" onClick={props.onAfterLeave}>share-left</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/mobile/screens/collections/MCollEditSheet', () => ({
  default: (props: { target: unknown; onClose: () => void; onCreated: (id: number) => void; onRequestDelete: (id: number) => void }) =>
    props.target ? (
      <div>
        <span>{`editor:${typeof props.target === 'string' ? props.target : 'list'}`}</span>
        <button type="button" onClick={props.onClose}>editor-close</button>
        <button type="button" onClick={() => props.onCreated(77)}>editor-created</button>
        <button type="button" onClick={() => props.onRequestDelete(3)}>editor-delete</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/mobile/screens/collections/MCollLabelsSheet', () => ({
  default: (props: {
    open: boolean
    mode: string
    selectedCount: number
    onCreate: (name: string) => void
    onUpdate: (id: number, body: Record<string, unknown>) => void
    onDelete: (id: number) => void
    onAssign: (ids: number[]) => void
    onSwitchToManage: () => void
    onClose: () => void
  }) =>
    props.open ? (
      <div>
        <span>{`labels:${props.mode}:${props.selectedCount}`}</span>
        <button type="button" onClick={() => props.onCreate('Food')}>labels-create</button>
        <button type="button" onClick={() => props.onUpdate(1, { name: 'Drinks' })}>labels-update</button>
        <button type="button" onClick={() => props.onDelete(1)}>labels-delete</button>
        <button type="button" onClick={() => props.onAssign([1])}>labels-assign</button>
        <button type="button" onClick={props.onSwitchToManage}>labels-manage</button>
        <button type="button" onClick={props.onClose}>labels-close</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/mobile/screens/collections/MCollTripPickerSheet', () => ({
  default: (props: { open: boolean; count: number; onCopy: (id: number) => void; onClose: () => void }) =>
    props.open ? (
      <div>
        <span>{`trippicker:${props.count}`}</span>
        <button type="button" onClick={() => props.onCopy(9)}>trip-copy</button>
        <button type="button" onClick={props.onClose}>trip-close</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/mobile/screens/collections/MCollListPickerSheet', () => ({
  default: (props: { mode: string | null; lists: { id: number; name: string }[]; count: number; onPick: (id: number) => void; onClose: () => void }) =>
    props.mode ? (
      <div>
        <span>{`listpicker:${props.mode}:${props.count}:${props.lists.map(l => l.id).join(',')}`}</span>
        <button type="button" onClick={() => props.onPick(2)}>listpicker-pick</button>
        <button type="button" onClick={props.onClose}>listpicker-close</button>
      </div>
    ) : null,
}))

const list = (id: number, name: string, over: Record<string, unknown> = {}) => ({
  id, owner_id: 1, name, color: '#38BDF8', place_count: 2, is_owner: true, ...over,
})

const place = (id: number, name: string, over: Record<string, unknown> = {}) => ({
  id, collection_id: 1, name, address: `${name} 1`, status: 'idea', ...over,
})

function makeHook(over: Record<string, unknown> = {}): Record<string, unknown> {
  const noop = vi.fn()
  return {
    t: (key: string) => key,
    language: 'en',
    dark: false,
    navigate: noop,
    categories: [],
    collections: [list(1, 'Hamburg')],
    ownedLists: [list(1, 'Hamburg')],
    sharedLists: [],
    activeCollection: list(1, 'Hamburg'),
    isAllSaved: false,
    isOwner: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
    activeId: 1,
    places: [place(10, 'Elbphilharmonie')],
    visiblePlaces: [place(10, 'Elbphilharmonie')],
    mappable: [place(10, 'Elbphilharmonie', { lat: 53.5, lng: 10 })],
    members: [],
    incomingInvites: [],
    counts: { all: 1, idea: 1, want: 0, visited: 0 },
    view: 'list',
    statusFilter: 'all',
    categoryFilter: 'all',
    ratingFilter: 'all',
    search: '',
    selectedPlaceId: null,
    selectMode: false,
    selectedIds: [],
    labels: [],
    labelFilter: [],
    labelOptions: [],
    loading: false,
    placesLoading: false,
    setView: vi.fn(), setStatusFilter: vi.fn(), setCategoryFilter: vi.fn(), setRatingFilter: vi.fn(),
    setLabelFilter: vi.fn(), setSearch: vi.fn(), setSelectedPlaceId: vi.fn(), setSelectMode: vi.fn(),
    toggleSelect: vi.fn(), updatePlace: vi.fn(), uploadPlaceImage: vi.fn(),
    showLabelManager: false, setShowLabelManager: vi.fn(), labelPickerOpen: false, setLabelPickerOpen: vi.fn(),
    handleCreateLabel: vi.fn(), handleUpdateLabel: vi.fn(), handleDeleteLabel: vi.fn(), handleBulkAssignLabels: vi.fn(),
    editorTarget: null, setEditorTarget: vi.fn(), handleEditorCreated: vi.fn(),
    showAddPlace: false, setShowAddPlace: vi.fn(), handlePlaceAdded: vi.fn(),
    confirmDeleteList: null, setConfirmDeleteList: vi.fn(),
    showShare: false, setShowShare: vi.fn(), handleAfterLeave: vi.fn(),
    selectedPlace: null, handleCloseDetail: vi.fn(), handleDetailStatus: vi.fn(), handleDetailRemove: vi.fn(),
    copyIds: null, openCopyForSelectedPlace: vi.fn(), openCopyForSelection: vi.fn(), closeCopy: vi.fn(), handleCopyToTrip: vi.fn(),
    handleSelectList: vi.fn(), handleDeleteList: vi.fn(),
    handleStatusChange: vi.fn(), handleRatePlace: vi.fn(), handleDeleteSelected: vi.fn(),
    allVisibleSelected: false, handleSelectAll: vi.fn(),
    listPickerMode: null, setListPickerMode: vi.fn(), handleMoveToList: vi.fn(), handleDuplicateToList: vi.fn(),
    ...over,
  }
}

const fn = (key: string) => mocks.coll[key] as ReturnType<typeof vi.fn>

/** The list switcher is the first control in the header. */
const switcher = () => screen.getAllByRole('button')[0]

describe('MCollections', () => {
  beforeEach(() => {
    mocks.coll = makeHook()
  })

  it('FE-MOB-COLSCR-001: shows only the spinner while the first load is in flight', () => {
    mocks.coll = makeHook({ loading: true, collections: [], places: [], visiblePlaces: [] })
    render(<MCollections />)

    expect(screen.queryByPlaceholderText('collections.search')).not.toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })

  it('FE-MOB-COLSCR-002: with no lists at all it offers the first-list CTA', () => {
    mocks.coll = makeHook({ collections: [], ownedLists: [], activeCollection: null, activeId: null, canShare: false })
    render(<MCollections />)

    expect(screen.getByText('collections.empty.firstTitle')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /collections.newList/ }))
    expect(fn('setEditorTarget')).toHaveBeenCalledWith('new')
    expect(screen.queryByPlaceholderText('collections.search')).not.toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-003: the header shows the active list and its edit/share actions', () => {
    render(<MCollections />)

    expect(screen.getByText('Hamburg')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'collections.editListTitle' }))
    expect(fn('setEditorTarget')).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))

    fireEvent.click(screen.getByRole('button', { name: 'collections.share.title' }))
    expect(fn('setShowShare')).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-COLSCR-004: the "All saved" union has no edit action and its own title', () => {
    mocks.coll = makeHook({ isAllSaved: true, activeId: ALL_SAVED, activeCollection: null, canShare: false })
    render(<MCollections />)

    expect(screen.getByText('collections.allSaved')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collections.editListTitle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collections.share.title' })).not.toBeInTheDocument()
    // No per-list labels on the union.
    expect(screen.queryByRole('button', { name: /collections.labels.title/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-005: without an active list the generic page title is used', () => {
    mocks.coll = makeHook({ activeId: null, activeCollection: null, canShare: false })
    render(<MCollections />)
    expect(screen.getByText('collections.title')).toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-006: the switcher dropdown lists owned + shared lists and opens the editor', () => {
    mocks.coll = makeHook({
      collections: [list(1, 'Hamburg'), list(2, 'Julien Tipps', { is_owner: false, color: null })],
      ownedLists: [list(1, 'Hamburg')],
      sharedLists: [list(2, 'Julien Tipps', { is_owner: false, color: null, place_count: undefined })],
    })
    render(<MCollections />)

    fireEvent.click(switcher())
    expect(screen.getByText('Julien Tipps')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Julien Tipps'))
    expect(fn('handleSelectList')).toHaveBeenCalledWith(2)
    // Picking closes the dropdown again.
    expect(screen.queryByText('Julien Tipps')).not.toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-007: the dropdown switches to the union and creates a new list', () => {
    render(<MCollections />)

    fireEvent.click(switcher())
    fireEvent.click(screen.getByRole('button', { name: /collections.allSaved/ }))
    expect(fn('handleSelectList')).toHaveBeenCalledWith(ALL_SAVED)

    fireEvent.click(switcher())
    fireEvent.click(screen.getByRole('button', { name: /collections.newList/ }))
    expect(fn('setEditorTarget')).toHaveBeenCalledWith('new')
  })

  it('FE-MOB-COLSCR-008: the view toggle and the search box drive the shared state', () => {
    render(<MCollections />)

    fireEvent.click(screen.getByRole('button', { name: 'collections.view.map' }))
    expect(fn('setView')).toHaveBeenCalledWith('map')
    fireEvent.click(screen.getByRole('button', { name: 'collections.view.list' }))
    expect(fn('setView')).toHaveBeenCalledWith('list')
    expect(screen.getByRole('button', { name: 'collections.view.list' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(screen.getByPlaceholderText('collections.search'), { target: { value: 'elb' } })
    expect(fn('setSearch')).toHaveBeenCalledWith('elb')
  })

  it('FE-MOB-COLSCR-009: the status filter dropdown shows the counts and applies a status', () => {
    // The union has no label chip, so the status chip is the only "all" chip.
    mocks.coll = makeHook({
      isAllSaved: true, activeId: ALL_SAVED, activeCollection: null, canShare: false,
      counts: { all: 5, idea: 2, want: 2, visited: 1 },
    })
    render(<MCollections />)

    fireEvent.click(screen.getByRole('button', { name: 'collections.status.filterAll' }))
    expect(screen.getByText('5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /collections.status.want/ }))
    expect(fn('setStatusFilter')).toHaveBeenCalledWith('want')
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-010: an active status filter is reflected in the chip label', () => {
    mocks.coll = makeHook({
      isAllSaved: true, activeId: ALL_SAVED, activeCollection: null, canShare: false, statusFilter: 'visited',
    })
    render(<MCollections />)

    const chip = screen.getByRole('button', { name: 'collections.status.visited' })
    expect(chip.className).toContain('bg-m-act')
    fireEvent.click(chip)
    fireEvent.click(screen.getByRole('button', { name: /collections.status.filterAll/ }))
    expect(fn('setStatusFilter')).toHaveBeenCalledWith('all')
  })

  it('FE-MOB-COLSCR-011: several active labels collapse to their count and can be toggled off or cleared', () => {
    mocks.coll = makeHook({
      labelOptions: [
        { id: 1, collection_id: 1, name: 'Food', color: '#f00', count: 2 },
        { id: 2, collection_id: 1, name: 'Bar', color: null, count: 1 },
      ],
      labelFilter: [1, 2],
      statusFilter: 'want',
    })
    render(<MCollections />)

    // Two active labels → the chip shows how many, not their names.
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: /^Food\s*2$/ }))
    expect(fn('setLabelFilter')).toHaveBeenCalledWith([2])

    // The "all" row wipes the filter and closes the panel.
    fireEvent.click(screen.getByRole('button', { name: 'collections.status.filterAll' }))
    expect(fn('setLabelFilter')).toHaveBeenLastCalledWith([])
    expect(screen.queryByRole('button', { name: /^Food\s*2$/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-012: a single active label shows its name and another one is added to the filter', () => {
    mocks.coll = makeHook({
      labelOptions: [
        { id: 1, collection_id: 1, name: 'Food', color: null, count: 2 },
        { id: 2, collection_id: 1, name: 'Bar', color: '#0f0', count: 1 },
      ],
      labelFilter: [2],
    })
    render(<MCollections />)

    fireEvent.click(screen.getByRole('button', { name: 'Bar' }))
    fireEvent.click(screen.getByRole('button', { name: /^Food\s*2$/ }))
    expect(fn('setLabelFilter')).toHaveBeenCalledWith([2, 1])
  })

  it('FE-MOB-COLSCR-013: a list without labels says so, and the manage chip opens the manager', () => {
    render(<MCollections />)

    // Status chip and label chip both read "all" while nothing is filtered.
    const chips = screen.getAllByRole('button', { name: 'collections.status.filterAll' })
    expect(chips).toHaveLength(2)
    fireEvent.click(chips[1])
    expect(screen.getByText('collections.labels.empty')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /collections.labels.title/ }))
    expect(fn('setShowLabelManager')).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-COLSCR-014: the backdrop under an open dropdown closes it again', () => {
    mocks.coll = makeHook({ isAllSaved: true, activeId: ALL_SAVED, activeCollection: null, canShare: false })
    render(<MCollections />)

    fireEvent.click(screen.getByRole('button', { name: 'collections.status.filterAll' }))
    // Chip plus the "all" row of the open panel.
    expect(screen.getAllByRole('button', { name: /collections.status.filterAll/ })).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(screen.getAllByRole('button', { name: /collections.status.filterAll/ })).toHaveLength(1)
  })

  it('FE-MOB-COLSCR-031: the select chip enters select mode', () => {
    render(<MCollections />)

    fireEvent.click(screen.getByRole('button', { name: /collections.select$/ }))
    expect(fn('setSelectMode')).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-COLSCR-015: select mode exposes the bulk actions and disables them without a selection', () => {
    mocks.coll = makeHook({ selectMode: true, selectedIds: [] })
    render(<MCollections />)

    expect(screen.getByRole('button', { name: /collections.copyToTrip/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /collections.selectAll/ }))
    expect(fn('handleSelectAll')).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(fn('setSelectMode')).toHaveBeenCalledWith(false)
  })

  it('FE-MOB-COLSCR-016: with a selection every bulk action reaches its handler', () => {
    mocks.coll = makeHook({
      selectMode: true,
      selectedIds: [10, 11],
      allVisibleSelected: true,
      labelOptions: [{ id: 1, collection_id: 1, name: 'Food', count: 1 }],
    })
    render(<MCollections />)

    expect(screen.getByRole('button', { name: /collections.deselectAll/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /collections.labels.assign/ }))
    expect(fn('setLabelPickerOpen')).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: /collections.copyToTrip/ }))
    expect(fn('openCopyForSelection')).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /collections.moveToList/ }))
    expect(fn('setListPickerMode')).toHaveBeenCalledWith('move')

    fireEvent.click(screen.getByRole('button', { name: /collections.duplicateToList/ }))
    expect(fn('setListPickerMode')).toHaveBeenCalledWith('copy')

    fireEvent.click(screen.getByRole('button', { name: /common.delete/ }))
    expect(fn('handleDeleteSelected')).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLSCR-017: a viewer without edit/delete rights loses move and delete', () => {
    mocks.coll = makeHook({ selectMode: true, selectedIds: [10], canEdit: false, canDelete: false, isOwner: false })
    render(<MCollections />)

    expect(screen.queryByRole('button', { name: /collections.moveToList/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /common.delete/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collections.duplicateToList/ })).toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-018: the list view renders rows, the loading state and both empty states', () => {
    render(<MCollections />)
    expect(screen.getByText('Elbphilharmonie')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Elbphilharmonie'))
    expect(fn('setSelectedPlaceId')).toHaveBeenCalledWith(10)
    fireEvent.click(screen.getByRole('button', { name: 'collections.status.idea' }))
    expect(fn('handleStatusChange')).toHaveBeenCalledWith(10, 'want')

    mocks.coll = makeHook({ places: [], visiblePlaces: [], placesLoading: true })
    const loadingView = render(<MCollections />)
    expect(loadingView.container.querySelector('.animate-spin')).not.toBeNull()

    mocks.coll = makeHook({ places: [], visiblePlaces: [] })
    render(<MCollections />)
    expect(screen.getByText('collections.empty.title')).toBeInTheDocument()

    mocks.coll = makeHook({ visiblePlaces: [] })
    render(<MCollections />)
    expect(screen.getByText('collections.empty.noMatchTitle')).toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-019: the map view hands the mappable places to the map and reports clicks', () => {
    mocks.coll = makeHook({ view: 'map', dark: true })
    render(<MCollections />)

    expect(screen.getByText('markers:1')).toBeInTheDocument()
    expect(screen.getByText('dark:true')).toBeInTheDocument()
    // No status/label chips in map view.
    expect(screen.queryByRole('button', { name: /collections.status.filterAll/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('map-open'))
    expect(fn('setSelectedPlaceId')).toHaveBeenCalledWith(10)
    fireEvent.click(screen.getByText('map-deselect'))
    expect(fn('setSelectedPlaceId')).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-COLSCR-020: a map view with nothing mappable falls back to the empty note', () => {
    mocks.coll = makeHook({ view: 'map', mappable: [] })
    render(<MCollections />)

    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
    expect(screen.getByText('collections.empty.noMatchTitle')).toBeInTheDocument()
  })

  it('FE-MOB-COLSCR-021: the place, add, share, label, trip and list sheets are wired to the hook', () => {
    mocks.coll = makeHook({
      selectedPlace: place(10, 'Elbphilharmonie'),
      selectedPlaceId: 10,
      showAddPlace: true,
      showShare: true,
      labelPickerOpen: true,
      selectedIds: [10, 11],
      copyIds: [10],
      listPickerMode: 'move',
      ownedLists: [list(1, 'Hamburg'), list(2, 'Kopenhagen')],
    })
    render(<MCollections />)

    fireEvent.click(screen.getByText('place-save'))
    expect(fn('updatePlace')).toHaveBeenCalledWith(10, { notes: 'moin' })
    fireEvent.click(screen.getByText('place-upload'))
    expect(fn('uploadPlaceImage')).toHaveBeenCalledWith(10, expect.any(File))
    fireEvent.click(screen.getByText('place-rate'))
    expect(fn('handleRatePlace')).toHaveBeenCalledWith(10, 4)
    fireEvent.click(screen.getByText('place-copy'))
    expect(fn('openCopyForSelectedPlace')).toHaveBeenCalledTimes(1)

    // The add sheet gets the active list as its fixed target.
    expect(screen.getByText('add-target:1:Hamburg:2')).toBeInTheDocument()
    fireEvent.click(screen.getByText('add-close'))
    expect(fn('setShowAddPlace')).toHaveBeenCalledWith(false)

    expect(screen.getByText('share:1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('share-close'))
    expect(fn('setShowShare')).toHaveBeenCalledWith(false)

    // The picker is in assign mode while the label picker is open.
    expect(screen.getByText('labels:assign:2')).toBeInTheDocument()
    fireEvent.click(screen.getByText('labels-manage'))
    expect(fn('setLabelPickerOpen')).toHaveBeenCalledWith(false)
    expect(fn('setShowLabelManager')).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByText('labels-close'))
    expect(fn('setShowLabelManager')).toHaveBeenCalledWith(false)

    expect(screen.getByText('trippicker:1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('trip-copy'))
    expect(fn('handleCopyToTrip')).toHaveBeenCalledWith(9)

    // The active list is not offered as a move target.
    expect(screen.getByText('listpicker:move:2:2')).toBeInTheDocument()
    fireEvent.click(screen.getByText('listpicker-pick'))
    expect(fn('handleMoveToList')).toHaveBeenCalledWith(2)
    fireEvent.click(screen.getByText('listpicker-close'))
    expect(fn('setListPickerMode')).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-COLSCR-022: the list picker duplicates in copy mode', () => {
    mocks.coll = makeHook({ listPickerMode: 'copy', selectedIds: [10], ownedLists: [list(1, 'Hamburg'), list(2, 'Kopenhagen')] })
    render(<MCollections />)

    fireEvent.click(screen.getByText('listpicker-pick'))
    expect(fn('handleDuplicateToList')).toHaveBeenCalledWith(2)
    expect(fn('handleMoveToList')).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLSCR-023: the editor sheet reports a created list and a delete request', () => {
    mocks.coll = makeHook({ editorTarget: 'new' })
    render(<MCollections />)

    expect(screen.getByText('editor:new')).toBeInTheDocument()
    fireEvent.click(screen.getByText('editor-created'))
    expect(fn('handleEditorCreated')).toHaveBeenCalledWith(77)
    fireEvent.click(screen.getByText('editor-delete'))
    expect(fn('setConfirmDeleteList')).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByText('editor-close'))
    expect(fn('setEditorTarget')).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-COLSCR-024: the delete-list confirm cancels and deletes', () => {
    mocks.coll = makeHook({ confirmDeleteList: 1 })
    render(<MCollections />)

    expect(screen.getByRole('dialog', { name: 'collections.deleteList' })).toBeInTheDocument()
    expect(screen.getByText('collections.deleteListConfirm')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(fn('setConfirmDeleteList')).toHaveBeenCalledWith(null)

    fireEvent.click(screen.getByRole('button', { name: /common.delete/ }))
    expect(fn('handleDeleteList')).toHaveBeenCalledTimes(1)

    // Escape dismisses the sheet through the same handler.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(fn('setConfirmDeleteList')).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-COLSCR-025: the ?create= hand-off from the bottom nav opens the add sheet once', async () => {
    render(<MCollections />, { initialEntries: ['/collections?create=place'] })

    await waitFor(() => expect(fn('setShowAddPlace')).toHaveBeenCalledWith(true))
    // The param is consumed so a re-render does not re-open the sheet.
    expect(fn('setShowAddPlace')).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLSCR-026: the union hand-off opens the sheet when at least one list can take the place', async () => {
    mocks.coll = makeHook({ isAllSaved: true, activeId: ALL_SAVED, activeCollection: null, canShare: false, canEdit: false })
    render(<MCollections />, { initialEntries: ['/collections?create=1'] })

    await waitFor(() => expect(fn('setShowAddPlace')).toHaveBeenCalledWith(true))
  })

  it('FE-MOB-COLSCR-027: without an editable target the hand-off is ignored', async () => {
    mocks.coll = makeHook({ activeId: null, activeCollection: null, canEdit: false, canShare: false, ownedLists: [] })
    render(<MCollections />, { initialEntries: ['/collections?create=place'] })

    await waitFor(() => expect(screen.getByText('collections.title')).toBeInTheDocument())
    expect(fn('setShowAddPlace')).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLSCR-028: an unrelated query param leaves the sheet closed', () => {
    render(<MCollections />, { initialEntries: ['/collections?tab=map'] })
    expect(fn('setShowAddPlace')).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLSCR-029: desktop-only category and rating filters are cleared on phone (#1435)', async () => {
    mocks.coll = makeHook({ categoryFilter: 3, ratingFilter: 4 })
    render(<MCollections />)

    await waitFor(() => expect(fn('setCategoryFilter')).toHaveBeenCalledWith('all'))
    expect(fn('setRatingFilter')).toHaveBeenCalledWith('all')
  })

  it('FE-MOB-COLSCR-030: the add sheet has no fixed target while the union is active', () => {
    mocks.coll = makeHook({
      isAllSaved: true, activeId: ALL_SAVED, activeCollection: null, canShare: false, showAddPlace: true,
    })
    render(<MCollections />)

    expect(screen.getByText('add-target:null::1')).toBeInTheDocument()
  })
})
