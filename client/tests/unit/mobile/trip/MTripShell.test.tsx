import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { act, fireEvent, render, screen, waitFor, within } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { server } from '../../../helpers/msw/server'
import { seedStore } from '../../../helpers/store'
import { buildUser } from '../../../helpers/factories'
import { useAuthStore } from '../../../../src/store/authStore'
import { useDocSyncOfferStore } from '../../../../src/store/docSyncOfferStore'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { Day, PackingItem, TodoItem } from '../../../../src/types'

// FE-MOB-SHELL-001 to FE-MOB-SHELL-068

const mocks = vi.hoisted(() => ({ planner: {} as TripPlanner }))

vi.mock('../../../../src/pages/tripPlanner/useTripPlanner', () => ({
  useTripPlanner: () => mocks.planner,
}))

// The real slots pull in the map engine and every tab panel; the shell only
// ever hands them props, so they are replaced by the probes below.
vi.mock('../../../../src/mobile/screens/trip/plan/MPlanTimeline', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/map/MMapArea', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/places/MPlacesBrowser', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/tabs/MTripTabPanel', () => ({ default: () => null }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MTripSheets', () => ({ default: () => null }))

import MTripShell from '../../../../src/mobile/screens/trip/MTripShell'

/** Last shell api handed to a slot — the object every slot shares. */
let shellApi!: MTripShellApi

function slot(testId: string) {
  return function Slot({ shell }: { planner: TripPlanner; shell: MTripShellApi }) {
    shellApi = shell
    return <div data-testid={testId} />
  }
}

/**
 * One identity per slot, created once. Built inside the wrapper's render body instead,
 * every rerender hands the shell four brand-new component types and React remounts all
 * of them, which would quietly mask the one thing FE-MOB-SHELL-054 is watching for.
 */
const PlanTimelineSlot = slot('plan-timeline')
const MapAreaSlot = slot('map-area')
const PlacesBrowserSlot = slot('places-browser')
const SheetsSlot = slot('sheets')

function TabSlot({ shell, tab }: { planner: TripPlanner; shell: MTripShellApi; tab: string }) {
  shellApi = shell
  return <div data-testid="tab-panel">{tab}</div>
}

const TRIP_TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'transports', label: 'Transport' },
  { id: 'buchungen', label: 'Bookings' },
  { id: 'finanzplan', label: 'Budget' },
  { id: 'listen', label: 'Lists' },
  { id: 'dateien', label: 'Files' },
  { id: 'collab', label: 'Collaboration' },
]

const DAYS = [
  { id: 11, trip_id: 1, day_number: 1, date: '2026-05-02', title: null },
  { id: 12, trip_id: 1, day_number: 2, date: '2026-05-03', title: null },
] as unknown as Day[]

/**
 * The same sections with the road trip addon on, in the order the planner hook builds
 * them, which is NOT the dock's order. The dock seats by its own priority list, so a
 * fixture that mirrors the hook is the only one that can tell the two apart.
 */
const RT_TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'transports', label: 'Transport' },
  { id: 'buchungen', label: 'Bookings' },
  { id: 'roadtrip', label: 'Road trip' },
  { id: 'listen', label: 'Lists' },
  { id: 'finanzplan', label: 'Budget' },
  { id: 'dateien', label: 'Files' },
  { id: 'collab', label: 'Collaboration' },
]

/** One routed stage, as the addon reports it. */
const stage = (over: Record<string, unknown> = {}) => ({
  dayId: 11, dayNumber: 1, date: '2026-05-02', title: null, distance: 123000, duration: 5400,
  stops: [], legs: [], legVias: [], geometry: [], schedule: { entries: [] }, driveWarnings: [],
  ...over,
})

/** The dock's seats, in order, plus the More button at the end. */
const dockLabels = () =>
  within(screen.getByRole('navigation')).getAllByRole('button').map(b => b.getAttribute('aria-label'))

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function renderShell(overrides: Partial<TripPlanner> = {}) {
  mocks.planner = buildPlanner({
    days: DAYS,
    selectedDayId: 11,
    TRIP_TABS,
    ...overrides,
  } as Partial<TripPlanner>)
  const Shell = () => (
    <MTripShell
      PlanTimeline={PlanTimelineSlot}
      MapArea={MapAreaSlot}
      PlacesBrowser={PlacesBrowserSlot}
      TabPanel={TabSlot}
      Sheets={SheetsSlot}
    />
  )
  const view = render(<Shell />)
  return { ...view, planner: mocks.planner, rerenderShell: () => view.rerender(<Shell />) }
}

const spy = (planner: TripPlanner, name: keyof TripPlanner) =>
  vi.mocked(planner[name] as unknown as ReturnType<typeof vi.fn>)

describe('MTripShell', () => {
  beforeEach(() => {
    sessionStorage.clear()
    // Document sync as a fresh install has it: every provider off, nothing bound.
    useDocSyncOfferStore.setState({ bound: {}, providers: null })
    seedStore(useAuthStore, { user: null, isAuthenticated: false })
    server.use(
      http.get('/api/trips/:tripId/docsync/providers', () => HttpResponse.json([])),
      http.get('/api/trips/:tripId/docsync/links', () => HttpResponse.json([])),
    )
  })

  it('FE-MOB-SHELL-001: shows the loading splash with the trip title while the planner loads', () => {
    renderShell({ isLoading: true } as Partial<TripPlanner>)
    expect(screen.getByText('Japan 2026')).toBeInTheDocument()
    expect(screen.queryByTestId('sheets')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-002: keeps the splash up until the photo warm-up finished', () => {
    renderShell({ splashDone: false } as Partial<TripPlanner>)
    expect(screen.getByText('Japan 2026')).toBeInTheDocument()
    expect(screen.queryByTestId('map-area')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-003: renders nothing once loading finished without a trip', () => {
    const { container } = renderShell({ trip: null } as Partial<TripPlanner>)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-MOB-SHELL-003b: the splash falls back to the brand name before the trip arrives', () => {
    renderShell({ isLoading: true, trip: null } as Partial<TripPlanner>)
    expect(screen.getByText('TREK')).toBeInTheDocument()
  })

  it('FE-MOB-SHELL-004: seeds the running trip on today rather than on day one', () => {
    const days = [
      { id: 11, day_number: 1, date: '2026-05-02' },
      { id: 12, day_number: 2, date: todayIso() },
    ] as unknown as Day[]
    const { planner } = renderShell({ days, selectedDayId: null } as Partial<TripPlanner>)
    expect(planner.tripActions.setSelectedDay).toHaveBeenCalledWith(12)
  })

  it('FE-MOB-SHELL-005: falls back to the first day when the trip is not running', () => {
    const { planner } = renderShell({ selectedDayId: null } as Partial<TripPlanner>)
    expect(planner.tripActions.setSelectedDay).toHaveBeenCalledWith(11)
  })

  it('FE-MOB-SHELL-006: leaves an existing day selection alone, and a later deselect too', () => {
    const { planner, rerenderShell } = renderShell()
    expect(planner.tripActions.setSelectedDay).not.toHaveBeenCalled()

    // Clearing the day is the user's doing; seeding it again here would be the
    // shell fighting them for it.
    planner.selectedDayId = null
    rerenderShell()
    expect(planner.tripActions.setSelectedDay).not.toHaveBeenCalled()
  })

  it('FE-MOB-SHELL-006b: seeds the next dated day when today falls in a gap', () => {
    const now = new Date()
    const iso = (offset: number) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    const days = [
      { id: 11, day_number: 1, date: iso(-2) },
      { id: 12, day_number: 2, date: iso(2) },
    ] as unknown as Day[]
    const { planner } = renderShell({ days, selectedDayId: null } as Partial<TripPlanner>)
    expect(planner.tripActions.setSelectedDay).toHaveBeenCalledWith(12)
  })

  it('FE-MOB-SHELL-007: does not seed a day before the days arrive', () => {
    const { planner } = renderShell({ days: [], selectedDayId: null } as Partial<TripPlanner>)
    expect(planner.tripActions.setSelectedDay).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Sat 2' })).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-008: the back button leaves for the dashboard', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'common.back' }))
    expect(planner.navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('FE-MOB-SHELL-009: the plan tab mounts the map under the timeline and no browser', () => {
    renderShell()
    expect(screen.getByTestId('map-area')).toBeInTheDocument()
    expect(screen.getByTestId('plan-timeline')).toBeInTheDocument()
    expect(screen.getByTestId('sheets')).toBeInTheDocument()
    expect(screen.queryByTestId('places-browser')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tab-panel')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-010: the browse segment swaps the timeline for the places browser', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }))
    expect(screen.getByTestId('places-browser')).toBeInTheDocument()
    expect(screen.queryByTestId('plan-timeline')).not.toBeInTheDocument()
    expect(shellApi.mode).toBe('browse')
    expect(shellApi.view).toBe('plan')
  })

  it('FE-MOB-SHELL-011: browse entered from edit flags browseFromEdit for the pool filter', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlan' }))
    expect(shellApi.mode).toBe('edit')
    expect(shellApi.browseFromEdit).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }))
    expect(shellApi.browseFromEdit).toBe(true)
  })

  it('FE-MOB-SHELL-012: browse entered from travel leaves browseFromEdit off', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }))
    expect(shellApi.browseFromEdit).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.travel' }))
    expect(shellApi.mode).toBe('go')
  })

  it('FE-MOB-SHELL-013: switching the travel mode from another tab forces the plan tab', () => {
    const { planner } = renderShell({ activeTab: 'listen' } as Partial<TripPlanner>)
    act(() => { shellApi.setTravelMode('edit') })
    expect(planner.handleTabChange).toHaveBeenCalledWith('plan')
    expect(shellApi.mode).toBe('edit')
  })

  it('FE-MOB-SHELL-014: the map toggle draws the route and refits the selected day', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    expect(planner.autoShowRoute).toHaveBeenCalled()
    expect(planner.handleSelectDay).toHaveBeenCalledWith(11, false)
    expect(shellApi.view).toBe('map')
    // The timeline unmounts, the map layer stays warm underneath.
    expect(screen.queryByTestId('plan-timeline')).not.toBeInTheDocument()
    expect(screen.getByTestId('map-area')).toBeInTheDocument()
  })

  it('FE-MOB-SHELL-015: leaving the map restores the timeline without touching the route', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.listView' }))
    expect(shellApi.view).toBe('plan')
    expect(screen.getByTestId('plan-timeline')).toBeInTheDocument()
    // Entering the map defaults the route on once; leaving it leaves the choice alone.
    expect(spy(planner, 'autoShowRoute')).toHaveBeenCalledTimes(1)
    expect(spy(planner, 'setRouteShown')).not.toHaveBeenCalled()
  })

  it('FE-MOB-SHELL-016: the map toggle skips the refit while no day is selected', () => {
    const { planner } = renderShell({ selectedDayId: null } as Partial<TripPlanner>)
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    expect(planner.autoShowRoute).toHaveBeenCalled()
    expect(planner.handleSelectDay).not.toHaveBeenCalled()
  })

  it('FE-MOB-SHELL-017: the map toggle drops out of browse mode', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }))
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    expect(shellApi.mode).toBe('go')
    expect(screen.queryByTestId('places-browser')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-018: day chips render weekday + date and mark the active one', () => {
    renderShell()
    const chip = screen.getByRole('button', { name: 'Sat 2' })
    expect(chip).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Sun 3' })).not.toHaveAttribute('aria-current')
  })

  it('FE-MOB-SHELL-019: a chip without a usable date falls back to the day number', () => {
    const days = [
      { id: 11, day_number: 1, date: null },
      { id: 12, day_number: 2, date: 'nodatehere' },
      { id: 13, date: null },
    ] as unknown as Day[]
    renderShell({ days } as Partial<TripPlanner>)
    expect(screen.getByRole('button', { name: 'planner.dayN:1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'planner.dayN:2' })).toBeInTheDocument()
    // A day the server sent without a number falls back to its position.
    expect(screen.getByRole('button', { name: 'planner.dayN:3' })).toBeInTheDocument()
  })

  it('FE-MOB-SHELL-020: tapping another day selects it and fits the list view', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Sun 3' }))
    expect(planner.handleSelectDay).toHaveBeenCalledWith(12, true)
    expect(planner.autoShowRoute).not.toHaveBeenCalled()
  })

  it('FE-MOB-SHELL-021: tapping the active day opens the day sheet', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Sat 2' }))
    expect(shellApi.sheet).toEqual({ id: 'day', payload: { dayId: 11 } })
    expect(planner.handleSelectDay).not.toHaveBeenCalled()
  })

  it('FE-MOB-SHELL-022: a day tap in map mode fits without the list flag and draws the route', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    vi.mocked(planner.setRouteShown).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Sun 3' }))
    expect(planner.handleSelectDay).toHaveBeenLastCalledWith(12, false)
    expect(planner.autoShowRoute).toHaveBeenCalled()
  })

  // #1962 — the phone lost the desktop sidebar's collapse chevron, so the map showed
  // every day's pins at once with no way to narrow it down.
  it('FE-MOB-SHELL-040: entering the map focuses it on the selected day', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    expect(planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([11]))
  })

  it('FE-MOB-SHELL-041: a day tap in map mode moves the focus with it', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    vi.mocked(planner.setExpandedDayIds).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Sun 3' }))
    expect(planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([12]))
  })

  it('FE-MOB-SHELL-042: a day tap in list mode leaves the map unfiltered', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Sun 3' }))
    expect(planner.setExpandedDayIds).not.toHaveBeenCalled()
  })

  it('FE-MOB-SHELL-043: leaving the map clears the focus again', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))
    vi.mocked(planner.setExpandedDayIds).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.listView' }))
    expect(planner.setExpandedDayIds).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-SHELL-023: the dock only shows enabled tabs and marks the active one', () => {
    const { planner } = renderShell({
      TRIP_TABS: [
        { id: 'plan', label: 'Plan' },
        { id: 'transports', label: 'Transport' },
        // A plugin tab that arrived without a name still needs a label.
        { id: 'buchungen' },
      ],
    } as Partial<TripPlanner>)
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'buchungen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lists' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Transport' }))
    expect(planner.handleTabChange).toHaveBeenCalledWith('transports')
    expect(shellApi.mode).toBe('go')
  })

  it('FE-MOB-SHELL-024: a dock tap changes the tab and drops out of browse mode', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }))
    expect(shellApi.mode).toBe('browse')
    fireEvent.click(screen.getByRole('button', { name: 'Lists' }))
    expect(planner.handleTabChange).toHaveBeenCalledWith('listen')
    expect(shellApi.mode).toBe('go')
  })

  it('FE-MOB-SHELL-025: the Mehr button opens the sheet and closeSheet clears it', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.more' }))
    expect(shellApi.sheet).toEqual({ id: 'mehr', payload: undefined })
    act(() => { shellApi.closeSheet() })
    expect(shellApi.sheet).toBeNull()
  })

  it('FE-MOB-SHELL-026: a non-plan tab replaces the plan chrome with its panel', () => {
    renderShell({ activeTab: 'dateien' } as Partial<TripPlanner>)
    expect(screen.getByTestId('tab-panel')).toHaveTextContent('dateien')
    expect(screen.queryByTestId('map-area')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'mobileTrip.travel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'mobileTrip.mapView' })).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-027: the transports header opens a blank transport modal', () => {
    const { planner } = renderShell({ activeTab: 'transports' } as Partial<TripPlanner>)
    fireEvent.click(screen.getByRole('button', { name: 'transport.addTransport' }))
    expect(planner.setEditingTransport).toHaveBeenCalledWith(null)
    expect(planner.setTransitPrefill).toHaveBeenCalledWith(null)
    expect(planner.setTransportModalAutomated).toHaveBeenCalledWith(false)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-SHELL-028: the transports header offers both importers when they are available', () => {
    const { planner } = renderShell({ activeTab: 'transports', airTrailAvailable: true } as Partial<TripPlanner>)
    fireEvent.click(screen.getByRole('button', { name: 'reservations.import.title' }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.airtrail.title' }))
    expect(planner.setShowBookingImport).toHaveBeenCalledWith(true)
    expect(planner.setShowAirTrailImport).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-SHELL-029: the transports header hides the importers that are switched off', () => {
    renderShell({
      activeTab: 'transports', bookingImportAvailable: false, airTrailAvailable: false,
    } as Partial<TripPlanner>)
    expect(screen.queryByRole('button', { name: 'reservations.import.title' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'reservations.airtrail.title' })).not.toBeInTheDocument()
  })

  it('FE-MOB-SHELL-030: the transports compact toggle flips the shell flag', () => {
    renderShell({ activeTab: 'transports' } as Partial<TripPlanner>)
    const toggle = screen.getByRole('button', { name: 'mobileTrip.compactView' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(shellApi.transportsCompact).toBe(true)
    expect(shellApi.bookingsCompact).toBe(false)
  })

  it('FE-MOB-SHELL-031: the bookings header opens a blank reservation and toggles its own density', () => {
    const { planner } = renderShell({ activeTab: 'buchungen' } as Partial<TripPlanner>)
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.newReservation' }))
    expect(planner.setEditingReservation).toHaveBeenCalledWith(null)
    expect(planner.setShowReservationModal).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'reservations.import.title' }))
    expect(planner.setShowBookingImport).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.compactView' }))
    expect(shellApi.bookingsCompact).toBe(true)
    expect(shellApi.transportsCompact).toBe(false)
  })

  it('FE-MOB-SHELL-032: the costs header raises the add-expense and CSV signals', () => {
    renderShell({ activeTab: 'finanzplan' } as Partial<TripPlanner>)
    expect(shellApi.addExpenseSignal).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'costs.addExpense' }))
    fireEvent.click(screen.getByRole('button', { name: 'budget.exportCsv' }))
    expect(shellApi.addExpenseSignal).toBe(1)
    expect(shellApi.exportCostsCsvSignal).toBe(1)
  })

  it('FE-MOB-SHELL-033: the files header raises the upload and trash signals', () => {
    renderShell({ activeTab: 'dateien' } as Partial<TripPlanner>)
    fireEvent.click(screen.getByRole('button', { name: 'common.upload' }))
    fireEvent.click(screen.getByRole('button', { name: 'files.trash' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.upload' }))
    expect(shellApi.uploadFilesSignal).toBe(2)
    expect(shellApi.openFilesTrashSignal).toBe(1)
  })

  it('FE-MOB-SHELL-067: the files header leaves the sync button out while no provider is on and nothing is bound', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 1, role: 'user' }), isAuthenticated: true })
    const asked: string[] = []
    server.use(
      http.get('/api/trips/:tripId/docsync/links', () => {
        asked.push('links')
        return HttpResponse.json([])
      }),
    )
    renderShell({ activeTab: 'dateien' } as Partial<TripPlanner>)

    await waitFor(() => expect(asked).toContain('links'))
    expect(screen.queryByRole('button', { name: 'docsync.title' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.upload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'files.trash' })).toBeInTheDocument()
  })

  it('FE-MOB-SHELL-068: a bound trip shows the sync button to a member, and it raises the open signal', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 999, role: 'user' }), isAuthenticated: true })
    server.use(http.get('/api/trips/:tripId/docsync/links', () => HttpResponse.json([{ id: 1, providerId: 'paperless' }])))
    renderShell({ activeTab: 'dateien' } as Partial<TripPlanner>)

    fireEvent.click(await screen.findByRole('button', { name: 'docsync.title' }))
    expect(shellApi.openDocSyncSignal).toBe(1)
  })

  it('FE-MOB-SHELL-034: the lists header shows packed/open counts and persists the sub-tab', () => {
    const packingItems = [
      { id: 1, checked: true }, { id: 2, checked: false }, { id: 3, checked: true },
    ] as unknown as PackingItem[]
    const todoItems = [{ id: 1, checked: false }, { id: 2, checked: false }] as unknown as TodoItem[]
    renderShell({ activeTab: 'listen', packingItems, todoItems } as Partial<TripPlanner>)
    expect(screen.getByRole('button', { name: /todo\.subtab\.packing/ })).toHaveTextContent('2/3')
    const todoTab = screen.getByRole('button', { name: /todo\.subtab\.todo/ })
    expect(todoTab).toHaveTextContent('mobileTrip.todoOpenCount:2')

    fireEvent.click(todoTab)
    expect(shellApi.listsTab).toBe('todo')
    expect(sessionStorage.getItem('trip-lists-subtab-1')).toBe('todo')
  })

  it('FE-MOB-SHELL-035: the lists sub-tab is restored from the session', () => {
    sessionStorage.setItem('trip-lists-subtab-1', 'todo')
    renderShell({ activeTab: 'listen' } as Partial<TripPlanner>)
    expect(shellApi.listsTab).toBe('todo')
  })

  it('FE-MOB-SHELL-036: the collab header switches the sub-tab', () => {
    renderShell({ activeTab: 'collab' } as Partial<TripPlanner>)
    expect(shellApi.collabTab).toBe('chat')
    fireEvent.click(screen.getByRole('button', { name: 'collab.tabs.polls' }))
    expect(shellApi.collabTab).toBe('polls')
    fireEvent.click(screen.getByRole('button', { name: 'collab.tabs.notes' }))
    expect(shellApi.collabTab).toBe('notes')
  })

  it('FE-MOB-SHELL-037: setTrTab from a slot routes through the planner and resets browse', () => {
    const { planner } = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'trip.mobilePlaces' }))
    act(() => { shellApi.setTrTab('collab') })
    expect(planner.handleTabChange).toHaveBeenCalledWith('collab')
    expect(shellApi.mode).toBe('go')
  })

  it('FE-MOB-SHELL-038: openSheet carries the payload through to the slots', () => {
    renderShell()
    act(() => { shellApi.openSheet('note', { dayId: 12 }) })
    expect(shellApi.sheet).toEqual({ id: 'note', payload: { dayId: 12 } })
  })

  // The chip rail overflows from roughly six days on, and swiping the day panel
  // (#2051) can move the day well past what is on screen.
  describe('chip rail auto-scroll', () => {
    const RAIL = { left: 0, right: 300 } as DOMRect
    /** Rects are all zero without layout, so the two boxes are stubbed by role. */
    function stubRects(chip: Partial<DOMRect>) {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        return (this.tagName === 'BUTTON' ? { ...RAIL, ...chip } : RAIL) as DOMRect
      })
    }

    afterEach(() => { vi.restoreAllMocks() })

    it('FE-MOB-SHELL-044: a clipped active chip pulls itself into the middle of the rail', () => {
      const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView)
      scrollIntoView.mockClear()
      stubRects({ left: 480, right: 540 })
      renderShell({ selectedDayId: 12 } as Partial<TripPlanner>)
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    })

    it('FE-MOB-SHELL-045: a chip already in view never shifts the rail under the thumb', () => {
      const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView)
      scrollIntoView.mockClear()
      stubRects({ left: 40, right: 100 })
      renderShell({ selectedDayId: 12 } as Partial<TripPlanner>)
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('FE-MOB-SHELL-046: reduced motion jumps instead of gliding', () => {
      const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView)
      scrollIntoView.mockClear()
      stubRects({ left: 480, right: 540 })
      vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
        matches: query.includes('reduced-motion'), media: query, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList)
      renderShell({ selectedDayId: 12 } as Partial<TripPlanner>)
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', inline: 'center', block: 'nearest' })
    })
  })

  // #2257 — the map filters down to one day, and until now nothing took that
  // filter back off: the chip rail can only swap one day for another, and the
  // second tap on the active chip is the day sheet. Its own control, map only.
  describe('the all-days toggle (#2257)', () => {
    const allDays = () => screen.getByRole('button', { name: 'mobileTrip.allDays' })
    const enterMap = () => fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }))

    it('FE-MOB-SHELL-047: stays off the plan view, where nothing is filtered anyway', () => {
      renderShell()
      expect(screen.queryByRole('button', { name: 'mobileTrip.allDays' })).not.toBeInTheDocument()
      enterMap()
      expect(allDays()).toBeInTheDocument()
    })

    it('FE-MOB-SHELL-048: drops the day and its pin filter so the whole trip comes back', () => {
      const { planner } = renderShell()
      enterMap()
      vi.mocked(planner.setExpandedDayIds).mockClear()

      fireEvent.click(allDays())

      expect(planner.handleSelectDay).toHaveBeenLastCalledWith(null, false)
      expect(planner.setExpandedDayIds).toHaveBeenCalledWith(null)
      // The day sheet belongs to the chip, not to this button.
      expect(shellApi.sheet).toBeNull()
    })

    it('FE-MOB-SHELL-049: a second press goes back to the day it came from', () => {
      const { planner, rerenderShell } = renderShell()
      enterMap()
      fireEvent.click(allDays())

      // The planner is a fixture, so the commit is replayed by hand.
      ;(planner as { selectedDayId: number | null }).selectedDayId = null
      rerenderShell()
      vi.mocked(planner.setExpandedDayIds).mockClear()
      vi.mocked(planner.autoShowRoute).mockClear()

      fireEvent.click(allDays())

      expect(planner.handleSelectDay).toHaveBeenLastCalledWith(11, false)
      expect(planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([11]))
      expect(planner.autoShowRoute).toHaveBeenCalled()
    })

    it('FE-MOB-SHELL-050: leaving the map puts a day back, the timeline has no all-days state', () => {
      const { planner, rerenderShell } = renderShell()
      enterMap()
      fireEvent.click(allDays())
      ;(planner as { selectedDayId: number | null }).selectedDayId = null
      rerenderShell()

      fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.listView' }))

      expect(planner.handleSelectDay).toHaveBeenLastCalledWith(11, true)
    })

    it('FE-MOB-SHELL-051: the active chip still opens the day sheet on the map', () => {
      const { planner } = renderShell()
      enterMap()
      vi.mocked(planner.handleSelectDay).mockClear()

      fireEvent.click(screen.getByRole('button', { name: 'Sat 2' }))

      expect(shellApi.sheet).toEqual({ id: 'day', payload: { dayId: 11 } })
      expect(planner.handleSelectDay).not.toHaveBeenCalled()
    })
  })

  // The road trip tab. The drive is a second reading of the same trip on the same map,
  // so it does not get a map of its own: the shell's single instance now lies under
  // BOTH tabs, and everything floating over it keys off `mapFront` rather than off
  // `view`, which only ever meant the plan tab.
  describe('the road trip tab', () => {
    /** Commit a tab change the way the planner would, and redraw. */
    function goToTab(planner: TripPlanner, rerenderShell: () => void, tabId: string) {
      ;(planner as { activeTab: string }).activeTab = tabId
      rerenderShell()
    }

    const rtSwitch = () => screen.getByRole('button', { name: 'mobileTrip.mapView' })
    const backToList = () => screen.getByRole('button', { name: 'mobileTrip.listView' })

    it('FE-MOB-SHELL-052: the drive takes the second dock seat and the packing list loses its own', () => {
      renderShell({ TRIP_TABS: RT_TABS } as Partial<TripPlanner>)
      // Second seat, not fourth: the dock orders by its own priority list, so the drive
      // sits beside the plan however late the hook appends it.
      expect(dockLabels()).toEqual(['Plan', 'Road trip', 'Transport', 'Bookings', 'Budget', 'mobileTrip.more'])
      // Six sections would leave 3px between the circles, so the cap cuts the last one
      // and the More sheet picks it up.
      expect(screen.queryByRole('button', { name: 'Lists' })).not.toBeInTheDocument()
    })

    it('FE-MOB-SHELL-053: without the addon the dock is exactly what it was', () => {
      renderShell()
      expect(dockLabels()).toEqual(['Plan', 'Transport', 'Bookings', 'Budget', 'Lists', 'mobileTrip.more'])
    })

    it('FE-MOB-SHELL-054: the map survives the move between the plan tab and the drive', () => {
      const { planner, rerenderShell } = renderShell({ TRIP_TABS: RT_TABS } as Partial<TripPlanner>)
      const map = screen.getByTestId('map-area')

      goToTab(planner, rerenderShell, 'roadtrip')
      expect(screen.getByTestId('tab-panel')).toHaveTextContent('roadtrip')
      // Identity, not presence. Written as two JSX positions the map remounts here,
      // which tears down the WebGL context and reloads every tile, a flash on the
      // device that a presence check would happily call a pass.
      expect(screen.getByTestId('map-area')).toBe(map)

      goToTab(planner, rerenderShell, 'plan')
      expect(screen.getByTestId('map-area')).toBe(map)
      expect(screen.getByTestId('plan-timeline')).toBeInTheDocument()
    })

    it('FE-MOB-SHELL-055: a tab with no map still tears it down', () => {
      const { planner, rerenderShell } = renderShell({ TRIP_TABS: RT_TABS, activeTab: 'roadtrip' } as Partial<TripPlanner>)
      expect(screen.getByTestId('map-area')).toBeInTheDocument()

      goToTab(planner, rerenderShell, 'transports')

      expect(screen.queryByTestId('map-area')).not.toBeInTheDocument()
      expect(screen.getByTestId('tab-panel')).toHaveTextContent('transports')
    })

    it('FE-MOB-SHELL-056: the switch in the drive flips its own half, not the plan view', () => {
      renderShell({ TRIP_TABS: RT_TABS, activeTab: 'roadtrip' } as Partial<TripPlanner>)
      expect(shellApi.mapFront).toBe(false)

      fireEvent.click(rtSwitch())
      expect(shellApi.rtView).toBe('map')
      expect(shellApi.mapFront).toBe(true)
      expect(shellApi.view).toBe('plan')

      fireEvent.click(backToList())
      expect(shellApi.rtView).toBe('list')
      expect(shellApi.mapFront).toBe(false)
    })

    it('FE-MOB-SHELL-057: the drive switch draws the route and otherwise leaves the camera alone', () => {
      const { planner } = renderShell({
        TRIP_TABS: RT_TABS, activeTab: 'roadtrip', selectedDayId: null,
      } as Partial<TripPlanner>)

      fireEvent.click(rtSwitch())
      expect(planner.autoShowRoute).toHaveBeenCalledTimes(1)
      // Deliberately quieter than the plan tab's toggle: the stage is always one day,
      // both halves show the same one, and the camera belongs to whoever looked last.
      expect(planner.handleSelectDay).not.toHaveBeenCalled()
      expect(planner.setExpandedDayIds).not.toHaveBeenCalled()

      fireEvent.click(backToList())
      // And no day restore on the way out, which is what the plan tab does here.
      expect(planner.handleSelectDay).not.toHaveBeenCalled()
      expect(planner.setExpandedDayIds).not.toHaveBeenCalled()
    })

    it('FE-MOB-SHELL-058: the two halves are separate states, so neither tab drags the other into its own', () => {
      const { planner, rerenderShell } = renderShell({ TRIP_TABS: RT_TABS } as Partial<TripPlanner>)

      fireEvent.click(rtSwitch())
      expect(shellApi.view).toBe('map')
      expect(shellApi.rtView).toBe('list')
      expect(shellApi.mapFront).toBe(true)

      goToTab(planner, rerenderShell, 'roadtrip')
      // The plan tab is still on its map; the drive opens on its chain regardless.
      expect(shellApi.view).toBe('map')
      expect(shellApi.mapFront).toBe(false)
      expect(screen.getByRole('button', { name: 'mobileTrip.mapView' })).toBeInTheDocument()
    })

    it('FE-MOB-SHELL-059: the all-days button follows the map into the drive', () => {
      const { planner } = renderShell({ TRIP_TABS: RT_TABS, activeTab: 'roadtrip' } as Partial<TripPlanner>)
      expect(screen.queryByRole('button', { name: 'mobileTrip.allDays' })).not.toBeInTheDocument()

      fireEvent.click(rtSwitch())
      vi.mocked(planner.setExpandedDayIds).mockClear()
      fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.allDays' }))

      // The whole drive in its day colours, off the same handler the plan map uses.
      expect(planner.handleSelectDay).toHaveBeenLastCalledWith(null, false)
      expect(planner.setExpandedDayIds).toHaveBeenCalledWith(null)
    })

    it('FE-MOB-SHELL-060: the stage header opens the driving settings', () => {
      renderShell({ TRIP_TABS: RT_TABS, activeTab: 'roadtrip' } as Partial<TripPlanner>)
      fireEvent.click(screen.getByRole('button', { name: 'roadtrip.title' }))
      expect(shellApi.sheet).toEqual({ id: 'rtinfo', payload: undefined })
    })

    it('FE-MOB-SHELL-061: the stage header names the day on screen and what it costs', () => {
      renderShell({
        TRIP_TABS: RT_TABS,
        activeTab: 'roadtrip',
        roadtripRoutes: { days: [stage()], totalDistance: 240000 },
      } as unknown as Partial<TripPlanner>)
      // The stage beats the total: 123 km is today's drive, 240 km is the whole trip.
      const header = screen.getByRole('button', { name: 'Sat 2, 123 km' })
      // Two badges rather than one line joined with a dot.
      expect(within(header).getByText('Sat 2')).not.toBe(within(header).getByText('123 km'))
      expect(header.textContent).not.toContain('·')
    })

    it('FE-MOB-SHELL-062: with the day filter off it reads the whole drive', () => {
      renderShell({
        TRIP_TABS: RT_TABS,
        activeTab: 'roadtrip',
        selectedDayId: null,
        roadtripRoutes: { days: [stage()], totalDistance: 240000 },
      } as unknown as Partial<TripPlanner>)
      const header = screen.getByRole('button', { name: '240 km' })
      // The total alone: without a stage there is no day to badge.
      const badges = header.querySelectorAll('span.rounded-full')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toHaveTextContent('240 km')
    })

    it('FE-MOB-SHELL-063: before anything has routed it falls back to the addon name, and the plan tab never shows it', () => {
      const { planner, rerenderShell } = renderShell({ TRIP_TABS: RT_TABS, activeTab: 'roadtrip' } as Partial<TripPlanner>)
      // Never an empty figure: the header is the only way into the driving settings.
      expect(screen.getByRole('button', { name: 'roadtrip.title' })).toBeInTheDocument()

      goToTab(planner, rerenderShell, 'plan')
      expect(screen.queryByRole('button', { name: 'roadtrip.title' })).not.toBeInTheDocument()
    })

    it('FE-MOB-SHELL-064: a stage whose day the rail has lost still reads as a day number', () => {
      // A remote day:deleted can retire the day while its legs are still on screen.
      renderShell({
        TRIP_TABS: RT_TABS,
        activeTab: 'roadtrip',
        selectedDayId: 99,
        roadtripRoutes: { days: [stage({ dayId: 99, dayNumber: 4, distance: 50000 })], totalDistance: 240000 },
      } as unknown as Partial<TripPlanner>)
      expect(screen.getByRole('button', { name: 'planner.dayN:4, 50 km' })).toBeInTheDocument()
    })

    it('FE-MOB-SHELL-065: a stage the round has not measured yet shows its day badge alone', () => {
      renderShell({
        TRIP_TABS: RT_TABS,
        activeTab: 'roadtrip',
        roadtripRoutes: { days: [stage({ distance: 0 })], totalDistance: 240000 },
      } as unknown as Partial<TripPlanner>)
      // Not "Sat 2 · 0 m", and not the whole trip's 240 km standing in for the day either.
      // The active day chip below shares the name, so the header is the one with the sliders.
      const header = screen.getAllByRole('button', { name: 'Sat 2' })
        .find(button => button.querySelector('.lucide-sliders-horizontal')) as HTMLElement
      expect(header).toBeDefined()
      expect(within(header).queryByText('0 m')).toBeNull()
      expect(within(header).queryByText('240 km')).toBeNull()
    })

    it('FE-MOB-SHELL-066: the header figures are badges, the day in caps and the distance in its own case', () => {
      renderShell({
        TRIP_TABS: RT_TABS,
        activeTab: 'roadtrip',
        roadtripRoutes: { days: [stage()], totalDistance: 240000 },
      } as unknown as Partial<TripPlanner>)
      const header = screen.getByRole('button', { name: 'Sat 2, 123 km' })
      const badges = Array.from(header.children).filter(el => el.tagName === 'SPAN')
      expect(badges.map(b => b.textContent)).toEqual(['Sat 2', '123 km'])
      for (const badge of badges) expect(badge.className).toContain('rounded-full')
      expect(badges[0].className).toContain('uppercase')
      // m and M are different units, so the distance keeps its case.
      expect(badges[1].className).not.toContain('uppercase')
      // Neutral, both: the active day chip right below is already the filled pill.
      expect(badges[0].className).not.toContain('bg-m-act')
    })
  })
})

describe('buildShell fixture', () => {
  it('FE-MOB-SHELL-039: defaults to the plan/go state and takes overrides', () => {
    const shell = buildShell({ mode: 'browse', browseFromEdit: true })
    expect(shell.view).toBe('plan')
    expect(shell.trTab).toBe('plan')
    expect(shell.mode).toBe('browse')
    expect(shell.browseFromEdit).toBe(true)
  })
})
