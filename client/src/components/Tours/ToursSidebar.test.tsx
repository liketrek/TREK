import { act, fireEvent, render, screen, waitFor, within } from '../../../tests/helpers/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { useTourMapVisibilityStore } from '../../store/tourMapVisibilityStore'
import { useTripStore } from '../../store/tripStore'
import { tourGpxApi } from '../../api/tourGpx'
import ToursSidebar from './ToursSidebar'
import { pickFiles } from '../../../tests/helpers/filePicker'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }))

vi.mock('../Map/MapViewAuto', () => ({ MapViewAuto: () => <div data-testid="gpx-preview-map-stub" /> }))
vi.mock('../shared/Toast', () => ({ useToast: () => toast }))

vi.mock('../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in client tests') })
vi.mock('../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in client tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in client tests') })

const tour: TourListItem = {
  place_id: 42,
  name: 'Selected ridge walk',
  tour_type: 'hike',
  distance: 4,
  elevation_gain: 100,
  elevation_loss: 80,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

beforeEach(() => {
  vi.restoreAllMocks()
  Object.values(toast).forEach((notify) => notify.mockClear())
  resetAllStores()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

function previewTrack(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Ridge',
    geometry: [[47, 11, 600], [47.01, 11.01, 650], [47.02, 11.02, 640]] as [number, number, number][],
    point_count: 3,
    distance_km: 2.4,
    elevation_gain_m: 50,
    elevation_loss_m: 10,
    duplicate: false,
    ...overrides,
  }
}

describe('ToursSidebar', () => {
  it('uses the compact counted dropdown for All, Unplanned and Planned', () => {
    render(<ToursSidebar tripId={1} days={[]} tours={[tour, { ...tour, place_id: 43, name: 'Planned walk', planned: true }]} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Show' })
    expect(trigger).toHaveTextContent('All')
    expect(trigger).toHaveTextContent('2')
    fireEvent.click(trigger)
    const choices = screen.getByRole('group', { name: 'Show' })
    expect(within(choices).getByRole('button', { name: /All\s*2/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(choices).getByRole('button', { name: /Unplanned\s*1/ })).toBeInTheDocument()
    expect(within(choices).getByRole('button', { name: /Planned\s*1/ })).toBeInTheDocument()
  })

  it('uses the place selection id for the same selected background as a place row', () => {
    render(<ToursSidebar tripId={1} days={[]} tours={[tour]} selectedPlaceId={42} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)
    const row = screen.getByRole('option', { name: /Selected ridge walk/i })
    expect(row).toHaveAttribute('aria-selected', 'true')
    expect(row).toHaveClass('bg-surface-selected')
  })

  it('RS-01: trails the description after the badges on one line, as a plan row does', () => {
    const listed = { ...tour, description: 'A quiet path above the lake', website: 'https://www.komoot.com/tour/42', planned_duration_minutes: 95 }
    render(<ToursSidebar tripId={1} days={[]} tours={[listed]} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)
    const row = screen.getByRole('option', { name: /Selected ridge walk/i })
    const line = within(row).getByTestId('tour-metrics')
    expect(line).toHaveClass('flex-nowrap', 'overflow-hidden')
    expect(line).toHaveTextContent('1 h 35 min')
    expect(within(line).getByTestId('tour-description-preview')).toHaveTextContent('A quiet path above the lake')
    expect(within(line).getByTestId('tour-description-preview')).toHaveClass('truncate')
    // The information link belongs to the detail, not the list row.
    expect(row).not.toHaveTextContent('Komoot')
  })

  it('selects the tour from keyboard activation', () => {
    const onSelectTour = vi.fn()
    render(<ToursSidebar tripId={1} days={[]} tours={[tour]} selectedPlaceId={null} onAssignToDay={vi.fn()} onSelectTour={onSelectTour} />)
    const row = screen.getByRole('option', { name: /Selected ridge walk/i })
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onSelectTour).toHaveBeenCalledWith(tour, row)
  })

  it.each([
    ['en', 'A deliberately long English hiking tour name that should wrap without pushing its metrics aside'],
    ['de', 'Eine außergewöhnlich lange deutsche Wanderung mit ausführlicher Bezeichnung für schmale Seitenleisten'],
  ])('keeps %s title, fact pills and the day action in one place-style row', (language, name) => {
    seedStore(useSettingsStore, { settings: { language, distance_unit: 'metric' } })
    const onAssignToDay = vi.fn()
    const { container } = render(<ToursSidebar
      canEdit={true}
      canAssign={true}
      tripId={1}
      days={[{ id: 7, trip_id: 1, day_number: 1, title: 'Day one', date: null } as never]}
      tours={[{ ...tour, name, distance: 1.9, elevation_gain: 13, elevation_loss: 11, has_waypoints: true }]}
      selectedPlaceId={42}
      onAssignToDay={onAssignToDay}
      onSelectTour={vi.fn()}
    />)

    const row = screen.getByRole('option', { name: new RegExp(name) })
    expect(row).toHaveAttribute('aria-selected', 'true')
    expect(row).toHaveTextContent(name)
    const metrics = row.querySelector('[data-testid="tour-metrics"]')!
    expect(metrics).toHaveTextContent('1.9 km')
    expect(metrics).toHaveTextContent('13 m')
    const labels = [...metrics.querySelectorAll('[aria-label]')].map(element => element.getAttribute('aria-label'))
    expect(labels[0]).toContain('1.9 km')
    expect(labels[1]).toContain('13 m')
    expect(within(row).queryByText('TREK')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Maximum trail difficulty|Maximale Wanderschwierigkeit|T2/)).toBeInTheDocument()
    const actionRow = row.querySelector('[data-testid="tour-action-row"]')!
    expect(within(actionRow as HTMLElement).getByRole('button', { name: /Add to day|Zum Tag hinzufügen/ })).toHaveAttribute('aria-haspopup', 'menu')
    expect(container.querySelector('[data-testid="tour-metrics"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Add to day|Zum Tag hinzufügen/ }))
    expect(screen.getByRole('button', { name: /Day one/ })).toBeInTheDocument()
  })

  it('shows no T-badge for an imported tour that carries no difficulty', () => {
    const imported = { ...tour, name: 'Imported GPX walk', has_waypoints: false, max_hiking_difficulty: null }
    render(<ToursSidebar tripId={1} days={[]} tours={[imported]} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)

    const metrics = within(screen.getByRole('option', { name: /Imported GPX walk/ })).getByTestId('tour-metrics')
    expect(metrics).not.toHaveTextContent(/T\d/)
    expect(metrics).not.toHaveTextContent('Tnull')
    expect(within(metrics).queryByLabelText(/^T\d/)).not.toBeInTheDocument()
  })

  it('leaves the post-write refresh to the shared assignment handler', async () => {
    let resolveAssignment!: () => void
    const assignment = new Promise<void>(resolve => { resolveAssignment = resolve })
    const onAssignToDay = vi.fn(() => assignment)
    const onToursChanged = vi.fn()
    render(<ToursSidebar
      canEdit={true}
      canAssign={true}
      tripId={1}
      days={[{ id: 7, trip_id: 1, day_number: 1, title: 'Day one', date: null } as never]}
      tours={[tour]}
      onAssignToDay={onAssignToDay}
      onToursChanged={onToursChanged}
      onSelectTour={vi.fn()}
    />)

    fireEvent.click(screen.getByRole('button', { name: /Add to day|Zum Tag hinzufügen/ }))
    fireEvent.click(screen.getByRole('button', { name: /Day one/ }))
    expect(onAssignToDay).toHaveBeenCalledWith(42, 7)
    expect(onToursChanged).not.toHaveBeenCalled()

    await act(async () => { resolveAssignment(); await assignment })
    expect(onToursChanged).not.toHaveBeenCalled()
  })

  it('disables already-assigned days and refreshes availability when the picker is reopened', async () => {
    const dayOne = { id: 7, trip_id: 1, day_number: 1, title: 'Day one', date: null } as never
    const dayTwo = { id: 8, trip_id: 1, day_number: 2, title: 'Day two', date: null } as never
    const dayThree = { id: 9, trip_id: 1, day_number: 3, title: 'Day three', date: null } as never
    useTripStore.setState({ assignments: { '7': [{ id: 1, day_id: 7, place_id: tour.place_id }] } as never })
    const onAssignToDay = vi.fn((placeId: number, dayId: number) => {
      useTripStore.setState(state => ({
        assignments: { ...state.assignments, [String(dayId)]: [{ id: 2, day_id: dayId, place_id: placeId }] } as never,
      }))
      return true
    })
    render(<ToursSidebar canAssign tripId={1} days={[dayOne, dayTwo, dayThree]} tours={[tour]} onAssignToDay={onAssignToDay} onSelectTour={vi.fn()} />)

    const openPicker = () => fireEvent.click(screen.getByRole('button', { name: /Add to day|Zum Tag hinzufügen/ }))
    openPicker()
    expect(screen.getByRole('button', { name: /Day one/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Day two/ })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: /Day two/ }))
    expect(onAssignToDay).toHaveBeenCalledTimes(1)
    expect(onAssignToDay).toHaveBeenCalledWith(tour.place_id, 8)

    openPicker()
    expect(screen.getByRole('button', { name: /Day one/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Day two/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Day three/ })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: /Day three/ }))
    expect(onAssignToDay).toHaveBeenCalledTimes(2)
    expect(onAssignToDay).toHaveBeenLastCalledWith(tour.place_id, 9)
  })

  it('neither refreshes nor reports success when assignment fails', async () => {
    toast.success.mockClear()
    const onToursChanged = vi.fn()
    render(<ToursSidebar
      canAssign={true}
      tripId={1}
      days={[{ id: 7, trip_id: 1, day_number: 1, title: 'Day one', date: null } as never]}
      tours={[tour]}
      onAssignToDay={vi.fn().mockResolvedValue(false)}
      onToursChanged={onToursChanged}
      onSelectTour={vi.fn()}
    />)

    fireEvent.click(screen.getByRole('button', { name: /Add to day|Zum Tag hinzufügen/ }))
    fireEvent.click(screen.getByRole('button', { name: /Day one/ }))

    await act(async () => {})
    expect(toast.success).not.toHaveBeenCalled()
    expect(onToursChanged).not.toHaveBeenCalled()
  })

  it('quarantines returned Tour ids before loading the imported Places', async () => {
    vi.spyOn(tourGpxApi, 'preview').mockResolvedValue({ tracks: [previewTrack()] })
    const importCall = vi.spyOn(tourGpxApi, 'import').mockResolvedValue({
      tours: [tour], caution: false, skipped: 0,
    })
    const onToursChanged = vi.fn()
    const loadTrip = vi.spyOn(useTripStore.getState(), 'loadTrip').mockResolvedValue(undefined)
    const refreshPlaces = vi.fn().mockResolvedValue(undefined)
    seedStore(useTripStore, { refreshPlaces })
    render(<ToursSidebar
      tripId={1}
      days={[]}
      tours={[]}
      canEdit={true}
      onAssignToDay={vi.fn()}
      onToursChanged={onToursChanged}
      onSelectTour={vi.fn()}
    />)

    const file = new File(['<gpx/>'], 'ridge.gpx', { type: 'application/gpx+xml' })
    expect(pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [file])).toHaveAttribute('accept', '.gpx')
    fireEvent.click(await screen.findByRole('button', { name: 'Import 1 tour' }))

    // Only the places are read again, not the whole trip: that would rebuild the workspace.
    await waitFor(() => expect(refreshPlaces).toHaveBeenCalledWith(1))
    expect(loadTrip).not.toHaveBeenCalled()
    expect(onToursChanged).toHaveBeenCalledWith([42])
    expect(onToursChanged.mock.invocationCallOrder[0]).toBeLessThan(refreshPlaces.mock.invocationCallOrder[0])
    expect(importCall).toHaveBeenCalledOnce()
    expect(importCall).toHaveBeenCalledWith(1, file, { tour_type: 'hike' })
    vi.restoreAllMocks()
  })

  it('reports duplicate-only GPX success without refetching or invalidating unchanged data', async () => {
    vi.spyOn(tourGpxApi, 'preview').mockResolvedValue({ tracks: [previewTrack()] })
    vi.spyOn(tourGpxApi, 'import').mockResolvedValue({ tours: [], caution: false, skipped: 3 })
    const onToursChanged = vi.fn()
    const loadTrip = vi.spyOn(useTripStore.getState(), 'loadTrip').mockResolvedValue(undefined)
    render(<ToursSidebar
      tripId={1}
      days={[]}
      tours={[]}
      canEdit={true}
      onAssignToDay={vi.fn()}
      onToursChanged={onToursChanged}
      onSelectTour={vi.fn()}
    />)

    pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [new File(['<gpx/>'], 'already-imported.gpx', { type: 'application/gpx+xml' }),
    ])
    fireEvent.click(await screen.findByRole('button', { name: 'Import 1 tour' }))

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Everything in that file is already in this trip.'))
    expect(onToursChanged).not.toHaveBeenCalled()
    expect(loadTrip).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
  it('RC-04: names each file that fails and still imports the rest', async () => {
    vi.spyOn(tourGpxApi, 'preview')
      .mockRejectedValueOnce({ response: { data: { error: 'No track or route found in GPX file' } } })
      .mockResolvedValueOnce({ tracks: [previewTrack()] })
    const importCall = vi.spyOn(tourGpxApi, 'import').mockResolvedValueOnce({ tours: [tour], caution: true, skipped: 0 })
    seedStore(useTripStore, { refreshPlaces: vi.fn().mockResolvedValue(undefined) })
    render(
      <ToursSidebar tripId={1} days={[]} tours={[]} canEdit={true} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />
    )

    pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [
      new File(['<gpx/>'], 'empty.gpx', { type: 'application/gpx+xml' }),
      new File(['<gpx/>'], 'ridge.gpx', { type: 'application/gpx+xml' }),
    ])
    // The file without a track is named at once and left out of the preview.
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No track or route found in empty.gpx'))
    fireEvent.click(await screen.findByRole('button', { name: 'Import 1 tour' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 tour imported from GPX'))
    expect(importCall).toHaveBeenCalledOnce()
    expect(toast.info).toHaveBeenCalledWith('Imported with caution — elevation/metrics incomplete')
    vi.restoreAllMocks()
  })

  it('PAD-02: shows the file before storing anything, and closing the preview stores nothing', async () => {
    vi.spyOn(tourGpxApi, 'preview').mockResolvedValue({ tracks: [previewTrack(), previewTrack({ name: 'Back', duplicate: true })] })
    const importCall = vi.spyOn(tourGpxApi, 'import')
    render(
      <ToursSidebar tripId={1} days={[]} tours={[]} canEdit={true} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />
    )
    pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [new File(['<gpx/>'], 'ridge.gpx', { type: 'application/gpx+xml' })])

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('GPX preview')
    expect(dialog).toHaveTextContent('ridge.gpx')
    expect(screen.getAllByTestId('gpx-preview-track')).toHaveLength(2)
    expect(screen.getAllByTestId('gpx-preview-track')[1]).toHaveTextContent('Already in the trip')
    expect(screen.getAllByTestId('gpx-preview-track')[0]).toHaveTextContent('3 points')
    // Only the track the trip does not hold yet is imported.
    expect(screen.getByRole('button', { name: 'Import 1 tour' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(importCall).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('PAD-02: a file the trip holds completely cannot be imported again, and says why', async () => {
    vi.spyOn(tourGpxApi, 'preview').mockResolvedValue({ tracks: [previewTrack({ duplicate: true })] })
    render(
      <ToursSidebar tripId={1} days={[]} tours={[]} canEdit={true} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />
    )
    pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [new File(['<gpx/>'], 'ridge.gpx', { type: 'application/gpx+xml' })])
    expect(await screen.findByText('Every track is already in the trip, so there is nothing to import.')).toBeInTheDocument()
    expect(screen.getByTestId('gpx-preview-import')).toBeDisabled()
    vi.restoreAllMocks()
  })

  it('PAD-02: a paddle import waits for its boat and water, then sends them along', async () => {
    vi.spyOn(tourGpxApi, 'preview').mockResolvedValue({ tracks: [previewTrack({ elevation_gain_m: null, elevation_loss_m: null })] })
    const importCall = vi.spyOn(tourGpxApi, 'import').mockResolvedValue({ tours: [tour], caution: false, skipped: 0 })
    seedStore(useTripStore, { refreshPlaces: vi.fn().mockResolvedValue(undefined) })
    render(
      <ToursSidebar tripId={1} days={[]} tours={[]} canEdit={true} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />
    )
    const file = new File(['<gpx/>'], 'lake.gpx', { type: 'application/gpx+xml' })
    pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [file])
    await screen.findByRole('dialog')
    // A file without heights says so instead of showing zero.
    expect(screen.getByTestId('gpx-preview-track')).toHaveTextContent('No heights in the file')

    fireEvent.click(screen.getByRole('button', { name: 'Paddle tour' }))
    const confirm = screen.getByTestId('gpx-preview-import')
    expect(confirm).toBeDisabled()
    expect(screen.getByText('Choose the boat and the water to import as a paddle tour.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'SUP' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lake' }))
    expect(confirm).toBeEnabled()
    fireEvent.click(confirm)

    await waitFor(() => expect(importCall).toHaveBeenCalledWith(1, file, { tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' }))
    vi.restoreAllMocks()
  })

  it('RC-04: refuses files that are not GPX before uploading anything', async () => {
    const importCall = vi.spyOn(tourGpxApi, 'import')
    render(
      <ToursSidebar tripId={1} days={[]} tours={[]} canEdit={true} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />
    )

    pickFiles(screen.getByRole('button', { name: 'Import GPX' }), [
      new File(['x'], 'notes.txt', { type: 'text/plain' }),
    ])

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Only GPX files can be imported as tours.'))
    expect(importCall).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('RC-02: names the days a tour is on in one badge, in the order of the trip', () => {
    const days = [
      { id: 7, trip_id: 1, day_number: 1, title: null, date: null },
      { id: 8, trip_id: 1, day_number: 2, title: null, date: null },
      { id: 9, trip_id: 1, day_number: 3, title: 'Summit', date: null },
    ] as never[]
    seedStore(useTripStore, {
      assignments: { '9': [{ id: 2, place_id: 42 }], '7': [{ id: 1, place_id: 42 }] } as never,
    })
    render(<ToursSidebar tripId={1} days={days} tours={[tour]} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)

    const badge = within(screen.getByRole('option', { name: /Selected ridge walk/ })).getByTestId('tour-days-badge')
    expect(badge).toHaveTextContent('Days 1, 3')
    expect(badge).toHaveAttribute('aria-label', 'Day 1, Day 3: Summit')
  })

  it('PR1-13: offers the source and routing limit only where the list varies, and narrows by them', () => {
    render(<ToursSidebar tripId={1} days={[]} tours={[
      { ...tour, place_id: 1, name: 'Drawn', origin: 'trek', max_hiking_difficulty: 2 },
      { ...tour, place_id: 2, name: 'Imported', origin: 'gpx', max_hiking_difficulty: null },
      { ...tour, place_id: 3, name: 'Snapshot', origin: 'wanderer', max_hiking_difficulty: 3 },
    ]} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    const limit = () => within(screen.getByRole('group', { name: 'Routing limit' })).getByRole('button', { name: /T3/ })
    fireEvent.click(limit())
    expect(screen.getAllByRole('option').map(row => row.textContent)).toEqual([expect.stringContaining('Snapshot')])
    // Under that limit only the wanderer snapshot is left, so the source offers nothing else.
    expect(within(screen.getByRole('group', { name: 'Source' })).queryByRole('button', { name: /GPX import/ })).toBeNull()
    fireEvent.click(limit())
    fireEvent.click(within(screen.getByRole('group', { name: 'Source' })).getByRole('button', { name: /GPX import\s*1/ }))
    expect(screen.getAllByRole('option').map(row => row.textContent)).toEqual([expect.stringContaining('Imported')])
    expect(screen.getByRole('button', { name: 'Show' })).toHaveTextContent('+1')
    // Only one tour type in the list: no type filter.
    expect(screen.queryByRole('group', { name: 'Type' })).toBeNull()
    // The import has no routing limit, so none is offered for it; the day status still narrows it away.
    expect(screen.queryByRole('group', { name: 'Routing limit' })).toBeNull()
    fireEvent.click(within(screen.getByRole('group', { name: 'Status' })).getByRole('button', { name: /^Planned/ }))
    expect(screen.getByRole('status')).toHaveTextContent('No tour matches these filters.')
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('PR1-07/08: a row shows its line colour, and its eye hides the tour from the map until shown again', () => {
    seedStore(useAuthStore, { user: { id: 3 } as never })
    seedStore(useTripStore, { places: [{ id: 42, route_color: '#e11d48' }] as never })
    render(<ToursSidebar tripId={1} days={[]} tours={[tour]} onAssignToDay={vi.fn()} onSelectTour={vi.fn()} />)
    const row = screen.getByRole('option', { name: /Selected ridge walk/ })
    expect(row.querySelector('[aria-hidden="true"][style]')).toHaveStyle({ background: '#e11d48' })

    fireEvent.click(within(row).getByRole('button', { name: 'Hide on the map' }))
    expect(useTourMapVisibilityStore.getState().hidden).toEqual([42])
    expect(screen.getByRole('status')).toHaveTextContent('Hidden on the map')
    // A hidden tour keeps its eye in sight, not only on hover.
    expect(within(row).getByRole('button', { name: 'Show on the map' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
    expect(useTourMapVisibilityStore.getState().hidden).toEqual([])
  })
})
