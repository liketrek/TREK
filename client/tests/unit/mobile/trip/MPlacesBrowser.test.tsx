import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import MPlacesBrowser from '../../../../src/mobile/screens/trip/places/MPlacesBrowser'
import { collectionsApi } from '../../../../src/api/collections'
import type { CollectionListResponse } from '@trek/shared'
import { useAddonStore } from '../../../../src/store/addonStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { resetAllStores, seedStore } from '../../../helpers/store'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { AssignmentsMap, Category, Day, Place } from '../../../../src/types'

// FE-MOB-PBROW-001 to FE-MOB-PBROW-030

const CATEGORIES = [
  { id: 1, name: 'Sights', color: '#123456', icon: 'landmark' },
  // No colour — the panel and the row fall back to the muted token.
  { id: 2, name: 'Food', color: '', icon: 'utensils' },
] as unknown as Category[]

const DAYS = [
  { id: 21, trip_id: 1, day_number: 1, date: '2026-05-01' },
  { id: 22, trip_id: 1, day_number: 2, date: '2026-05-02' },
] as unknown as Day[]

function place(over: Partial<Place>): Place {
  return {
    id: 0, trip_id: 1, name: '', address: null, description: null, category_id: null,
    lat: 48.2, lng: 16.3, image_url: null, google_place_id: null, osm_id: null,
    route_geometry: null, route_color: null,
    ...over,
  } as unknown as Place
}

const LOUVRE = place({ id: 1, name: 'Louvre', address: 'Rue de Rivoli', category_id: 1 })
const EIFFEL = place({ id: 2, name: 'Eiffel Tower', description: 'Iron lady' })
const SEINE = place({ id: 3, name: 'Seine Track', category_id: 2, route_geometry: 'abc', route_color: '#ff0000' })

const PLACES = [LOUVRE, EIFFEL, SEINE]

// Louvre is planned on day 22 (day_number 2), the rest is still in the pool.
const ASSIGNMENTS: AssignmentsMap = {
  '22': [{ id: 90, day_id: 22, place_id: 1, order_index: 0, place: { id: 1, name: 'Louvre' } }],
} as unknown as AssignmentsMap

function makePlanner(overrides: Partial<TripPlanner> = {}): TripPlanner {
  return buildPlanner({
    places: PLACES,
    categories: CATEGORIES,
    assignments: ASSIGNMENTS,
    days: DAYS,
    ...overrides,
  } as Partial<TripPlanner>)
}

function renderBrowser(planner: TripPlanner = makePlanner(), shell: MTripShellApi = buildShell()) {
  const view = render(<MPlacesBrowser planner={planner} shell={shell} />)
  return { ...view, planner, shell }
}

/** Row button of a place — the whole left side of the row is one button. */
const row = (name: string) => screen.getByRole('button', { name: new RegExp(name) })

describe('MPlacesBrowser', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAddonStore, { addons: [{ id: 'collections', enabled: true }] })
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ collections: [], incomingInvites: [] } as CollectionListResponse)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-PBROW-001: lists every place with its count divider', () => {
    renderBrowser()
    expect(screen.getByText('places.count:3')).toBeInTheDocument()
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Rue de Rivoli')).toBeInTheDocument()
    // No address → the description takes the sub line.
    expect(screen.getByText('Iron lady')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-002: badges a planned place with its first day and offers no quick-add', () => {
    renderBrowser()
    expect(screen.getByText('planner.dayN:2')).toBeInTheDocument()
    // Two unplanned places → two quick-add buttons.
    expect(screen.getAllByRole('button', { name: 'places.assignToDay' })).toHaveLength(2)
  })

  it('FE-MOB-PBROW-003: quick-add opens the place-actions sheet with the day picker', () => {
    const { shell } = renderBrowser()
    fireEvent.click(screen.getAllByRole('button', { name: 'places.assignToDay' })[0])
    expect(shell.openSheet).toHaveBeenCalledWith('bract', { placeId: 2, dayPicker: true })
  })

  it('FE-MOB-PBROW-004: a row tap opens the place-actions sheet without the day picker', () => {
    const { shell } = renderBrowser()
    fireEvent.click(row('Louvre'))
    expect(shell.openSheet).toHaveBeenCalledWith('bract', { placeId: 1, dayPicker: false })
  })

  it('FE-MOB-PBROW-005: the filter chips write the pool filter to the trip store', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'places.unplanned' }))
    expect(useTripStore.getState().placesFilter).toBe('unplanned')
    expect(screen.getByText('places.count:2')).toBeInTheDocument()
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'places.planned' }))
    expect(useTripStore.getState().placesFilter).toBe('planned')
    expect(screen.getByText('places.countSingular')).toBeInTheDocument()
    expect(screen.getByText('Louvre')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'places.all' }))
    expect(useTripStore.getState().placesFilter).toBe('all')
  })

  it('FE-MOB-PBROW-006: the tracks chip only appears with a track and filters to it', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'places.filterTracks' }))
    expect(screen.getByText('places.countSingular')).toBeInTheDocument()
    expect(screen.getByText('Seine Track')).toBeInTheDocument()
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-007: hides the tracks chip and falls back to all when the last track is gone', () => {
    seedStore(useTripStore, { placesFilter: 'tracks' })
    renderBrowser(makePlanner({ places: [LOUVRE, EIFFEL] } as Partial<TripPlanner>))
    expect(screen.queryByRole('button', { name: 'places.filterTracks' })).not.toBeInTheDocument()
    expect(useTripStore.getState().placesFilter).toBe('all')
    expect(screen.getByText('places.count:2')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-008: entering the browser from the edit segment seeds the unplanned pool', () => {
    renderBrowser(makePlanner(), buildShell({ browseFromEdit: true }))
    expect(useTripStore.getState().placesFilter).toBe('unplanned')
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-009: the search box matches name and address', () => {
    renderBrowser()
    const input = screen.getByPlaceholderText('places.search')
    fireEvent.change(input, { target: { value: 'rivoli' } })
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.queryByText('Seine Track')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'seine' } })
    expect(screen.getByText('Seine Track')).toBeInTheDocument()
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-010: the category panel toggles the shared filter set and badges its size', () => {
    renderBrowser()
    const catBtn = screen.getByRole('button', { name: 'places.allCategories' })
    expect(catBtn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(catBtn)
    expect(catBtn).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sights' }))
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['1'])
    expect(screen.getByRole('checkbox', { name: 'Sights' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.queryByText('Eiffel Tower')).not.toBeInTheDocument()
    expect(catBtn).toHaveTextContent('1')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sights' }))
    expect(useTripStore.getState().placesCategoryFilter.size).toBe(0)
  })

  it('FE-MOB-PBROW-011: the uncategorized row filters the places without a category', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'places.allCategories' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'places.noCategory' }))
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['uncategorized'])
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-012: the uncategorized row is dropped when every place has a category', () => {
    const planner = makePlanner({ places: [LOUVRE, SEINE] } as Partial<TripPlanner>)
    renderBrowser(planner)
    fireEvent.click(screen.getByRole('button', { name: 'places.allCategories' }))
    expect(screen.queryByRole('checkbox', { name: 'places.noCategory' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Food' })).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-013: select mode picks rows and reports the count', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    expect(screen.getByText('places.selectionCount:0')).toBeInTheDocument()

    fireEvent.click(row('Louvre'))
    fireEvent.click(row('Eiffel Tower'))
    expect(screen.getByText('places.selectionCount:2')).toBeInTheDocument()
    fireEvent.click(row('Louvre'))
    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
    // Row taps no longer open the actions sheet while selecting.
    expect(screen.queryByRole('button', { name: 'places.assignToDay' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-014: select all / deselect all covers exactly the visible pool', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.selectAll' }))
    expect(screen.getByText('places.selectionCount:3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'common.deselectAll' }))
    expect(screen.getByText('places.selectionCount:0')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-015: switching the pool filter or searching clears the selection', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.selectAll' }))
    fireEvent.click(screen.getByRole('button', { name: 'places.unplanned' }))
    expect(screen.getByText('places.selectionCount:0')).toBeInTheDocument()

    fireEvent.click(row('Eiffel Tower'))
    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('places.search'), { target: { value: 'ei' } })
    expect(screen.getByText('places.selectionCount:0')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-016: leaving select mode drops the selection', () => {
    renderBrowser()
    const toggle = screen.getByRole('button', { name: 'common.select' })
    fireEvent.click(toggle)
    fireEvent.click(row('Louvre'))
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText(/places.selectionCount/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-017: the bulk actions stay disabled until something is selected', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    expect(screen.getByRole('button', { name: 'places.changeCategory' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'inspector.saveToCollection' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'places.deleteSelected' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'common.selectAll' })).toBeEnabled()
  })

  it('FE-MOB-PBROW-018: the bulk category sheet applies the pick and leaves select mode once it resolved', async () => {
    const { planner } = renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(screen.getByRole('button', { name: 'places.changeCategory' }))

    expect(screen.getByRole('dialog', { name: 'Change category' })).toBeInTheDocument()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Food' })) })
    expect(planner.confirmChangeCategory).toHaveBeenCalledWith([1], 2)
    expect(screen.queryByText(/places.selectionCount/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-018b: a failed bulk category change keeps the selection for a retry', async () => {
    const planner = makePlanner()
    ;(planner.confirmChangeCategory as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('nope'))
    renderBrowser(planner)
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(screen.getByRole('button', { name: 'places.changeCategory' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Food' })) })

    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-019: dismissing the category sheet keeps the selection untouched', async () => {
    const { planner } = renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(screen.getByRole('button', { name: 'places.changeCategory' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Change category' })).not.toBeInTheDocument())
    expect(planner.confirmChangeCategory).not.toHaveBeenCalled()
    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-020: the delete confirmation removes the selection in one call', async () => {
    const { planner } = renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(row('Seine Track'))
    fireEvent.click(screen.getByRole('button', { name: 'places.deleteSelected' }))

    expect(screen.getByText('trip.confirm.deletePlaces:2')).toBeInTheDocument()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.delete' })) })
    expect(planner.confirmDeletePlaces).toHaveBeenCalledWith([1, 3])
    expect(screen.queryByText(/places.selectionCount/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-020b: a failed bulk delete keeps the selection for a retry', async () => {
    const planner = makePlanner()
    ;(planner.confirmDeletePlaces as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('nope'))
    renderBrowser(planner)
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(screen.getByRole('button', { name: 'places.deleteSelected' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.delete' })) })

    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-021: cancelling the delete keeps the selection intact', () => {
    const { planner } = renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(screen.getByRole('button', { name: 'places.deleteSelected' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(planner.confirmDeletePlaces).not.toHaveBeenCalled()
    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-022: the save-to-collection action opens the list picker', async () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(screen.getByRole('button', { name: 'inspector.saveToCollection' }))
    await waitFor(() => expect(collectionsApi.list).toHaveBeenCalled())
    expect(screen.getByRole('dialog', { name: 'Save 1 to a list' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Save 1 to a list' })).not.toBeInTheDocument())
    expect(screen.getByText('places.selectionCount:1')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-023: without the collections addon neither the action nor the sheet exists', () => {
    seedStore(useAddonStore, { addons: [] })
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    expect(screen.queryByRole('button', { name: 'inspector.saveToCollection' })).not.toBeInTheDocument()
    expect(collectionsApi.list).not.toHaveBeenCalled()
  })

  it('FE-MOB-PBROW-024: the add button opens a blank place form', () => {
    const { planner } = renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))
    expect(planner.setEditingPlace).toHaveBeenCalledWith(null)
    expect(planner.setEditingAssignmentId).toHaveBeenCalledWith(null)
    expect(planner.setPrefillCoords).toHaveBeenCalledWith(null)
    expect(planner.setShowPlaceForm).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-PBROW-025: the ellipsis opens the import sheet', () => {
    const { shell } = renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.importPlaces' }))
    expect(shell.openSheet).toHaveBeenCalledWith('import')
  })

  it('FE-MOB-PBROW-026: a read-only member keeps the filters but loses every mutation', () => {
    renderBrowser(makePlanner({ can: vi.fn(() => false) } as Partial<TripPlanner>))
    expect(screen.getByRole('button', { name: 'places.all' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'mobileTrip.importPlaces' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.select' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.add' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-027: the empty unplanned pool celebrates instead of reporting no matches', () => {
    renderBrowser(makePlanner({ places: [LOUVRE] } as Partial<TripPlanner>), buildShell({ browseFromEdit: true }))
    expect(screen.getByText('places.allPlanned')).toBeInTheDocument()
    expect(screen.queryByText('places.noneFound')).not.toBeInTheDocument()
  })

  it('FE-MOB-PBROW-028: a search without hits reports no matches', () => {
    renderBrowser()
    fireEvent.change(screen.getByPlaceholderText('places.search'), { target: { value: 'zzz' } })
    expect(screen.getByText('places.noneFound')).toBeInTheDocument()
    expect(screen.getByText('places.count:0')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-029: a deleted place drops out of the selection count', async () => {
    const shell = buildShell()
    const { rerender } = renderBrowser(makePlanner(), shell)
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.selectAll' }))
    expect(screen.getByText('places.selectionCount:3')).toBeInTheDocument()

    await act(async () => {
      rerender(<MPlacesBrowser planner={makePlanner({ places: [LOUVRE, EIFFEL] } as Partial<TripPlanner>)} shell={shell} />)
    })
    expect(screen.getByText('places.selectionCount:2')).toBeInTheDocument()
  })

  it('FE-MOB-PBROW-030: a selection that only matches the visible pool in size is not "all selected"', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('button', { name: 'common.select' }))
    fireEvent.click(row('Louvre'))
    fireEvent.click(row('Eiffel Tower'))

    // Narrow to the two categorised places: two visible, two selected — but not
    // the same two, so the toolbar must still offer select-all.
    fireEvent.click(screen.getByRole('button', { name: 'places.allCategories' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sights' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Food' }))

    expect(screen.getByText('places.count:2')).toBeInTheDocument()
    expect(screen.getByText('places.selectionCount:2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.selectAll' })).toBeInTheDocument()
  })
})
