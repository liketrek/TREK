import { act, fireEvent, render, screen } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildAssignment, buildPlace, buildTrip, buildUser } from '../../../tests/helpers/factories'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { usePermissionsStore } from '../../store/permissionsStore'
import { PlacesHeader } from './PlacesSidebarHeader'
import { usePlacesSidebar, type PlacesSidebarProps, type SidebarState } from './usePlacesSidebar'

let sidebar: SidebarState

function Host(props: PlacesSidebarProps) {
  sidebar = usePlacesSidebar(props)
  return (
    <div data-testid="pool" onDragEnter={sidebar.handleSidebarDragEnter}
      onDragOver={sidebar.handleSidebarDragOver} onDragLeave={sidebar.handleSidebarDragLeave}
      onDrop={sidebar.handleSidebarDrop}>
      <PlacesHeader {...sidebar} />
      {sidebar.filtered.map(place => <span key={place.id} data-testid={`place-${place.id}`}>{place.name}</span>)}
    </div>
  )
}

function makeProps(overrides: Partial<PlacesSidebarProps> = {}): PlacesSidebarProps {
  return {
    tripId: 1,
    places: [],
    categories: [],
    assignments: {},
    selectedDayId: null,
    selectedPlaceId: null,
    onPlaceClick: vi.fn(),
    onAddPlace: vi.fn(),
    onAssignToDay: vi.fn(),
    onEditPlace: vi.fn(),
    onDeletePlace: vi.fn(),
    days: [],
    isMobile: false,
    ...overrides,
  }
}

beforeEach(() => {
  resetAllStores()
  localStorage.removeItem('trek:places-sort')
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) })
})

afterEach(() => {
  localStorage.removeItem('trek:places-sort')
})

describe('B4A Places pool', () => {
  it('excludes only parent-identified Tours from rows and every Show count base', () => {
    const tour = buildPlace({ id: 1, name: 'Tour', route_geometry: 'track', rating_avg: 5 })
    const legacyTrack = buildPlace({ id: 2, name: 'Zebra track', route_geometry: 'track', rating_avg: 2 })
    const planned = buildPlace({ id: 3, name: 'Alpha planned', rating_avg: 5 })
    const loose = buildPlace({ id: 4, name: 'Beta loose', rating_avg: 2 })
    render(<Host {...makeProps({
      places: [tour, legacyTrack, planned, loose],
      selectedDayId: 7,
      assignments: {
        '7': [buildAssignment({ day_id: 7, place: tour }), buildAssignment({ day_id: 7, place: planned })],
        '8': [buildAssignment({ day_id: 8, place: legacyTrack })],
      },
      toursEnabled: true,
      excludePlaceIds: new Set([1]),
    })} />)
    expect(sidebar.filtered.map(place => place.id)).toEqual([2, 3, 4])
    expect(sidebar.filterCounts).toEqual({ all: 3, unplanned: 1, planned: 1, tracks: 1 })
    expect(sidebar.hasTracks).toBe(false)
    act(() => sidebar.setPlacesSort('name'))
    expect(sidebar.filtered.map(place => place.id)).toEqual([3, 4, 2])
    act(() => sidebar.setLocalityFilter({ country: 'No matching country', region: null }))
    expect(sidebar.filtered).toEqual([])
    act(() => { sidebar.setLocalityFilter(null); sidebar.setRatingFilter(5) })
    expect(sidebar.filtered.map(place => place.id)).toEqual([3])
    expect(sidebar.filterCounts.all).toBe(3)
    act(() => { sidebar.setRatingFilter('all'); sidebar.pickFilter('planned') })
    expect(sidebar.filtered.map(place => place.id)).toEqual([3])
    act(() => sidebar.pickFilter('unplanned'))
    expect(sidebar.filtered.map(place => place.id)).toEqual([4])
  })

  it('applies category and search to the excluded count base and reacts to a replacement exclusion set', () => {
    const props = makeProps({
      toursEnabled: true,
      excludePlaceIds: new Set([1]),
      places: [
        buildPlace({ id: 1, name: 'Matching tour', category_id: 7 }),
        buildPlace({ id: 2, name: 'Matching place', category_id: 7 }),
        buildPlace({ id: 3, name: 'Matching other category', category_id: 8 }),
        buildPlace({ id: 4, name: 'Other place', category_id: 7 }),
      ],
    })
    const { rerender } = render(<Host {...props} />)
    act(() => { sidebar.setCategoryFilters(new Set(['7'])); sidebar.setSearch('matching') })
    expect(sidebar.filtered.map(place => place.id)).toEqual([2])
    expect(sidebar.filterCounts).toEqual({ all: 1, unplanned: 1, planned: 0, tracks: 0 })
    rerender(<Host {...props} excludePlaceIds={new Set([1, 2])} />)
    expect(sidebar.filtered).toEqual([])
    expect(sidebar.filterCounts.all).toBe(0)
  })

  it('restores legacy rows and Tracks while off, even when the parent retains the exclusion set', () => {
    const props = makeProps({
      places: [buildPlace({ id: 1, name: 'Tour', route_geometry: 'track' }), buildPlace({ id: 2, name: 'Place' })],
      toursEnabled: true,
      excludePlaceIds: new Set([1]),
    })
    const { rerender } = render(<Host {...props} />)
    expect(sidebar.filtered.map(place => place.id)).toEqual([2])
    rerender(<Host {...props} toursEnabled={false} />)
    expect(sidebar.filtered.map(place => place.id)).toEqual([1, 2])
    expect(sidebar.filterCounts.all).toBe(2)
    expect(sidebar.hasTracks).toBe(true)
    act(() => sidebar.pickFilter('tracks'))
    expect(sidebar.filtered.map(place => place.id)).toEqual([1])
  })

  it('blocks Places file drops while Tours is on and restores them while off', () => {
    const props = makeProps({ toursEnabled: true })
    const { rerender } = render(<Host {...props} />)
    const file = new File(['track'], 'route.gpx', { type: 'application/gpx+xml' })
    fireEvent.dragEnter(screen.getByTestId('pool'))
    expect(sidebar.sidebarDragOver).toBe(false)
    fireEvent.drop(screen.getByTestId('pool'), { dataTransfer: { files: [file] } })
    expect(sidebar.fileImportOpen).toBe(false)
    expect(sidebar.sidebarDropFile).toBeNull()
    rerender(<Host {...props} toursEnabled={false} />)
    fireEvent.dragEnter(screen.getByTestId('pool'))
    expect(sidebar.sidebarDragOver).toBe(true)
    fireEvent.drop(screen.getByTestId('pool'), { dataTransfer: { files: [file] } })
    expect(sidebar.fileImportOpen).toBe(true)
    expect(sidebar.sidebarDropFile).toBe(file)
  })

  it('keeps list import in Places while Tours is on and restores the file menu while off', async () => {
    const user = userEvent.setup()
    const props = makeProps({ toursEnabled: true })
    const { rerender } = render(<Host {...props} />)
    await user.click(screen.getByRole('button', { name: 'Import Places' }))
    expect(screen.queryByRole('button', { name: sidebar.t('places.importFile') })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: sidebar.t('places.importList') }))
    expect(sidebar.listImportOpen).toBe(true)
    expect(sidebar.fileImportOpen).toBe(false)
    rerender(<Host {...props} toursEnabled={false} />)
    await user.click(screen.getByRole('button', { name: 'Import Places' }))
    await user.click(screen.getByRole('button', { name: sidebar.t('places.importFile') }))
    expect(sidebar.fileImportOpen).toBe(true)
  })

  it.each([true, false])('exposes no AddRow actions without place-edit permission (Tours=%s)', async toursEnabled => {
    seedStore(usePermissionsStore, { permissions: { place_edit: 'admin' } })
    const props = makeProps({ toursEnabled, selectedDayId: 7, onAddPlaceToSelectedDay: vi.fn() })
    render(<Host {...props} />)
    expect(sidebar.canEditPlaces).toBe(false)
    expect(screen.queryByRole('button', { name: 'Import Places' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('add-place-to-day')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add Place|New place/i })).not.toBeInTheDocument()
    expect(props.onAddPlace).not.toHaveBeenCalled()
    expect(props.onAddPlaceToSelectedDay).not.toHaveBeenCalled()
  })
})