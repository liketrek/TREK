import { beforeEach, describe, expect, it, vi } from 'vitest'
import MRtStopSheet from '../../../../src/mobile/screens/trip/roadtrip/MRtStopSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { Place } from '../../../../src/types'
import type { RoadtripDay, RoadtripStop } from '@trek/shared/roadtrip'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { useTripStore } from '../../../../src/store/tripStore'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-RTSTOP-001 to FE-MOB-RTSTOP-035
//
// The sheet renders inside the real TranslationProvider, so the copy is asserted
// in English. `planner.t` from the fixture is never consulted here.
//
// The place rows come from the trip store, not from the planner: the sheet reads the
// unfiltered list, so renderSheet seeds the store and the planner keeps its empty one.

// The charging panel polls a repo of its own every minute; stubbed so the sheet's
// wiring can be asserted without a live availability lookup in the background.
vi.mock('../../../../src/components/Roadtrip/ChargingInfo', () => ({
  default: ({ placeId }: { placeId?: number }) => <div data-testid="charging-info">{placeId}</div>,
}))

function stop(over: Partial<RoadtripStop> & Pick<RoadtripStop, 'assignmentId' | 'placeId' | 'name'>): RoadtripStop {
  return {
    ownerDayId: 11,
    ownerIndex: 0,
    lat: 53.55,
    lng: 9.99,
    time: null,
    dwellMinutes: null,
    legMode: 'driving',
    incomingLegMode: 'driving',
    stopType: null,
    ...over,
  } as RoadtripStop
}

/** Stop 1 is pinned, stop 2 is a fuel stop off the road, stop 3 collects three findings. */
const HAMBURG = stop({ assignmentId: 101, placeId: 201, name: 'Hamburg Hafen', ownerIndex: 0, time: '09:00', dwellMinutes: 60 })
const ARAL = stop({ assignmentId: 102, placeId: 202, name: 'Aral Dammtor', ownerIndex: 1, stopType: 'fuel', dwellMinutes: 10, offRoadMeters: 450 })
const BREMEN = stop({ assignmentId: 103, placeId: 203, name: 'Bremen Marktplatz', ownerIndex: 2, dwellMinutes: 90 })
/** Set off from on day 11, reached on day 12: stored on one card, drawn on the other. */
const KASSEL = stop({ assignmentId: 104, placeId: 204, name: 'Kassel Rathaus', ownerDayId: 11, ownerIndex: 3 })

const DAY_A = {
  dayId: 11,
  dayNumber: 1,
  date: '2026-05-01',
  title: null,
  stops: [HAMBURG, ARAL, BREMEN],
  legs: [undefined, undefined, undefined],
  legVias: [[], [], []],
  geometry: [],
  distance: 0,
  duration: 0,
  dayWarning: null,
  schedule: {
    entries: [
      { arrival: '09:00', departure: '10:00', anchored: true, dayOffset: 0 },
      { arrival: '11:30', departure: '11:40', anchored: false, dayOffset: 0 },
      { arrival: '13:05', departure: '14:35', anchored: false, dayOffset: 0 },
    ],
    warnings: [{ index: 2, code: 'late', minutes: 25 }],
  },
  driveWarnings: [
    { index: 2, code: 'leg', overMinutes: 40 },
    { index: 2, code: 'range', sinceKm: 520 },
  ],
} as unknown as RoadtripDay

const DAY_B = {
  dayId: 12,
  dayNumber: 2,
  date: '2026-05-02',
  title: null,
  stops: [KASSEL],
  legs: [undefined],
  legVias: [[]],
  geometry: [],
  distance: 0,
  duration: 0,
  dayWarning: null,
  schedule: {
    entries: [{ arrival: '08:11', departure: '08:41', anchored: false, dayOffset: 0 }],
    warnings: [{ index: 0, code: 'late', minutes: 12 }],
  },
  driveWarnings: [],
} as unknown as RoadtripDay

const PLACES = [
  { id: 201, name: 'Hamburg Hafen', lat: 53.54, lng: 9.98, address: 'Bei den St. Pauli-Landungsbrücken' },
  { id: 203, name: 'Bremen Marktplatz', lat: 53.07, lng: 8.8, address: 'Am Markt' },
] as unknown as Place[]

function makePlanner(overrides: Record<string, unknown> = {}) {
  return buildPlanner({
    tripId: 4,
    dailyTimesActive: true,
    setRoadtripEndDay: vi.fn(async () => true),
    roadtripRoutes: { days: [DAY_A, DAY_B] },
    ...overrides,
  } as unknown as Partial<TripPlanner>)
}

function makeShell(overrides: Record<string, unknown> = {}) {
  return buildShell({
    sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 103 } },
    ...overrides,
  } as unknown as Partial<MTripShellApi>)
}

function renderSheet(
  plannerOverrides: Record<string, unknown> = {},
  shellOverrides: Record<string, unknown> = {},
  storePlaces: Place[] = PLACES,
) {
  seedStore(useTripStore, { places: storePlaces })
  const planner = makePlanner(plannerOverrides)
  const shell = makeShell(shellOverrides)
  render(<MRtStopSheet planner={planner} shell={shell} />)
  return { planner, shell }
}

describe('MRtStopSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-RTSTOP-001: stays closed while another sheet id is active', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { dayId: 11, assignmentId: 103 } } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-002: stays closed when no routed day carries the assignment', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 999 } } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-003: shows arrival and departure large, and says the time was set by hand', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 101 } } })
    expect(screen.getByRole('dialog', { name: 'Hamburg Hafen' })).toBeInTheDocument()
    expect(screen.getByText('Arrive')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
    expect(screen.getByText('Leave')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('Time you set')).toBeInTheDocument()
    expect(screen.queryByText('Calculated from the drive')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-004: says the clock was worked out when the stop is not anchored', () => {
    renderSheet()
    expect(screen.getByText('13:05')).toBeInTheDocument()
    expect(screen.getByText('14:35')).toBeInTheDocument()
    expect(screen.getByText('Calculated from the drive')).toBeInTheDocument()
    expect(screen.queryByText('Time you set')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-005: lists every finding of the stop, not just the one the chain has room for', () => {
    renderSheet()
    // The chain picks 'range' out of the drive warnings and shows nothing else.
    expect(screen.getByText('Arrives 25 min after the time you set')).toBeInTheDocument()
    expect(screen.getByText('40 min over your longest drive')).toBeInTheDocument()
    expect(screen.getByText('520 km since the last fill-up')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-006: spells out the stay and how far the stop sits off the road', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 102 } } })
    expect(screen.getByText('450 m from the road')).toBeInTheDocument()
    expect(screen.getAllByText('10 min').length).toBeGreaterThan(0)
  })

  it('FE-MOB-RTSTOP-007: finds the stop on the card it is drawn on, not the day it is stored on', () => {
    // ownerDayId 11 names day A; the stop only exists in day B's chain after a night drive.
    renderSheet({}, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 104 } } })
    expect(screen.getByRole('dialog', { name: 'Kassel Rathaus' })).toBeInTheDocument()
    // Day B's own schedule and day B's own warning, filed under day B's index.
    expect(screen.getByText('08:11')).toBeInTheDocument()
    expect(screen.getByText('Arrives 12 min after the time you set')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-008: keeps the navigation tile without any write permission', () => {
    renderSheet({ can: vi.fn(() => false) })
    expect(screen.getByRole('button', { name: 'Navigation' })).toBeInTheDocument()
    // The stay tile loses its handler and stays a plain box rather than going dead.
    expect(screen.queryByRole('button', { name: /^Stay/ })).not.toBeInTheDocument()
    const stayLabels = screen.getAllByText('Stay')
    expect(stayLabels).toHaveLength(2)
    expect(stayLabels[1].closest('button')).toBeNull()
  })

  it('FE-MOB-RTSTOP-009: offers the map apps built from the stop itself when no place row matches', () => {
    renderSheet({}, {}, [])
    fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Google Maps' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Waze' })).toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-010: has no delete, no reorder and no stop-kind control at all', () => {
    renderSheet()
    // Close, edit, navigation, stay, show-on-map, plus the end-day switch, which is a switch.
    // Edit is a hand-over to the place editor, not a control of this sheet (RTSTOP-030).
    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Stay/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show on map' })).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(1)
    // The desktop-only copy is absent rather than disabled.
    expect(screen.queryByText('Remove stop')).not.toBeInTheDocument()
    expect(screen.queryByText('Kind of stop')).not.toBeInTheDocument()
    expect(screen.queryByText('Set how full this stop fills')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-011: the stay tile hands the stop over to the stay sheet, row and all', () => {
    const { shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: /^Stay/ }))
    // The day and the assignment ride along because the stay sheet comes back here when it
    // saves, and this sheet is located by those two rather than by the place. Without them
    // it reopened on a payload it could not resolve and left an invisible sheet standing.
    expect(shell.openSheet).toHaveBeenCalledWith('rtstay', {
      placeId: 203,
      minutes: 90,
      name: 'Bremen Marktplatz',
      dayId: 11,
      assignmentId: 103,
    })
  })

  it('FE-MOB-RTSTOP-036: a day ended by a manual boundary reads as ended, not as off', () => {
    // Two things can end a day: the stop's own flag and a manual boundary filed against it.
    // Reading only the flag showed the switch as off for a stop that already ends the day,
    // and the tap meant to switch it on ran through the writer's boundary branch and
    // deleted that day end instead.
    renderSheet({ roadtripEndsDayAt: () => true })

    expect(screen.getByRole('switch', { name: 'End the day here' })).toHaveAttribute('aria-checked', 'true')
  })

  it('FE-MOB-RTSTOP-012: ending the day here calls the stop-addressed writer with that very stop', async () => {
    const { planner } = renderSheet()
    const toggle = screen.getByRole('switch', { name: 'End the day here' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(planner.setRoadtripEndDay).toHaveBeenCalledWith(BREMEN)
    // Reads as switched the moment it is tapped, before the write lands.
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
  })

  it('FE-MOB-RTSTOP-013: rolls the switch back and reports when the write fails', async () => {
    const { planner } = renderSheet({
      setRoadtripEndDay: vi.fn(async () => { throw new Error('Day boundary refused') }),
    })
    const toggle = screen.getByRole('switch', { name: 'End the day here' })
    fireEvent.click(toggle)
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Day boundary refused'))
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('FE-MOB-RTSTOP-037: a refused write rolls the switch back even though nothing was thrown', async () => {
    // The writer reports rather than throws, and shows its own toast, so the case above
    // pins a path production never takes. Refused, it answers false, and the switch has to
    // come back: it was standing at a state the trip never reached, with only a toast on
    // the other side of the screen saying otherwise.
    renderSheet({ setRoadtripEndDay: vi.fn(async () => false) })
    const toggle = screen.getByRole('switch', { name: 'End the day here' })

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
  })

  it('FE-MOB-RTSTOP-014: dropping the day window takes the end-day switch away entirely', () => {
    renderSheet({ dailyTimesActive: false })
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByText('End the day here')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-015: showing the stop on the map flips the stage over and brings the stop into view', () => {
    const { planner, shell } = renderSheet({ selectedDayId: 11 }, { rtView: 'list' })
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }))
    expect(shell.toggleRtView).toHaveBeenCalledTimes(1)
    expect(planner.focusRoadtripPoint).toHaveBeenCalledWith(BREMEN.lat, BREMEN.lng)
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    // Not the place selection: the place inspector opens off it and would cover the map.
    expect(planner.setSelectedPlaceId).not.toHaveBeenCalled()
    // Already the stage on screen, so the day stays put.
    expect(planner.handleSelectDay).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTOP-016: leaves the stage alone when the map is already the front layer', () => {
    const { shell } = renderSheet({}, { rtView: 'map' })
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }))
    expect(shell.toggleRtView).not.toHaveBeenCalled()
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTSTOP-017: the disc counts destinations, so the third stop on the card is number two', () => {
    // Hamburg is 1, the fuel stop between them takes no number, Bremen is 2.
    renderSheet()
    const heading = screen.getByRole('heading', { name: 'Bremen Marktplatz' })
    expect(heading.previousElementSibling).toHaveTextContent('2')
  })

  it('FE-MOB-RTSTOP-018: a service stop is drawn by its kind, not by a position in the chain', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 102 } } })
    const disc = screen.getByRole('heading', { name: 'Aral Dammtor' }).previousElementSibling
    // The kind's own colour, shared with the map marker, rather than a numbered disc.
    expect(disc).toHaveStyle({ background: '#E8590C' })
    expect(disc?.querySelector('svg')).not.toBeNull()
    expect(disc?.textContent).toBe('')
  })

  it('FE-MOB-RTSTOP-019: a stop the routing round has no clock for drops the clock card entirely', () => {
    const day = {
      ...DAY_A,
      stops: [BREMEN],
      schedule: { entries: [], warnings: [] },
      driveWarnings: [],
    } as unknown as RoadtripDay
    renderSheet({ roadtripRoutes: { days: [day] } }, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 103 } } })
    expect(screen.queryByText('Arrive')).not.toBeInTheDocument()
    expect(screen.queryByText('Leave')).not.toBeInTheDocument()
    expect(screen.queryByText('Calculated from the drive')).not.toBeInTheDocument()
    // The stay is still filed, so the sheet is not empty.
    expect(screen.getAllByText('1 h 30 min').length).toBeGreaterThan(0)
  })

  it('FE-MOB-RTSTOP-020: an arrival without a departure shows one clock, not an empty second one', () => {
    const day = {
      ...DAY_A,
      stops: [HAMBURG],
      schedule: { entries: [{ arrival: '09:00', departure: null, anchored: false, dayOffset: 0 }], warnings: [] },
      driveWarnings: [],
    } as unknown as RoadtripDay
    renderSheet({ roadtripRoutes: { days: [day] } }, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 101 } } })
    expect(screen.getByText('Arrive')).toBeInTheDocument()
    expect(screen.queryByText('Leave')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-021: a stop with no stay says so on the tile and files no stay finding', () => {
    const day = {
      ...DAY_A,
      stops: [{ ...BREMEN, dwellMinutes: null }],
      schedule: { entries: [{ arrival: '13:05', departure: '13:05', anchored: false, dayOffset: 0 }], warnings: [] },
      driveWarnings: [],
    } as unknown as RoadtripDay
    renderSheet({ roadtripRoutes: { days: [day] } }, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 103 } } })
    expect(screen.getByText('No stay')).toBeInTheDocument()
    expect(screen.getAllByText('Stay')).toHaveLength(1)
  })

  it('FE-MOB-RTSTOP-022: one map app means no picker, the tap opens it and names it on the tile', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    // Name only: no coordinates and no address, so only the OSM search link survives.
    renderSheet({}, {}, [{ id: 203, name: 'Bremen Marktplatz', lat: null, lng: null, address: null }] as unknown as Place[])
    const tile = screen.getByRole('button', { name: /^Navigation/ })
    expect(tile).toHaveTextContent('OpenStreetMap')
    fireEvent.click(tile)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(open).toHaveBeenCalledWith(
      'https://www.openstreetmap.org/search?query=Bremen%20Marktplatz',
      '_blank',
      'noopener,noreferrer',
    )
    open.mockRestore()
  })

  it('FE-MOB-RTSTOP-023: no reachable map app at all drops the tile instead of leaving a dead one', () => {
    renderSheet({}, {}, [{ id: 203, name: '', lat: null, lng: null, address: null }] as unknown as Place[])
    expect(screen.queryByRole('button', { name: /Navigation/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Stay/ })).toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-024: the map-app picker closes again on a tap outside it', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-025: a payload without an assignment names no stop, so nothing opens', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: {} } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-026: a charger gets the live availability panel, a pump does not', () => {
    const charger = stop({ assignmentId: 106, placeId: 206, name: 'Ionity Bremen', stopType: 'charging' })
    const day = {
      ...DAY_A,
      stops: [charger],
      schedule: { entries: [{ arrival: '12:00', departure: '12:30', anchored: false, dayOffset: 0 }], warnings: [] },
      driveWarnings: [],
    } as unknown as RoadtripDay
    renderSheet({ roadtripRoutes: { days: [day] } }, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 106 } } })
    expect(screen.getByTestId('charging-info')).toHaveTextContent('206')
  })

  it('FE-MOB-RTSTOP-027: no availability panel on a stop that is not a charger', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 102 } } })
    expect(screen.queryByTestId('charging-info')).not.toBeInTheDocument()
  })

  // jsdom has no layout, so the two header tests pin the class contract rather than pixels.
  it('FE-MOB-RTSTOP-028: the header centres the name on the disc instead of hanging it from the top', () => {
    renderSheet()
    const heading = screen.getByRole('heading', { name: 'Bremen Marktplatz' })
    const header = heading.parentElement
    expect(header).toHaveClass('items-center')
    expect(header).not.toHaveClass('items-start')
    // Disc, name and buttons are one row, so they share that one cross-axis alignment.
    expect(heading.previousElementSibling).toHaveTextContent('2')
    const buttons = heading.nextElementSibling
    expect(buttons).toHaveClass('items-center')
    expect(buttons).toContainElement(screen.getByRole('button', { name: 'Close' }))
    expect(buttons).toContainElement(screen.getByRole('button', { name: 'Edit' }))
  })

  it('FE-MOB-RTSTOP-029: a service stop with a long name centres the same way and wraps rather than truncating', () => {
    const longName = 'Aral Tankstelle an der Autobahnausfahrt Hamburg Dammtor Nord'
    renderSheet(
      { roadtripRoutes: { days: [{ ...DAY_A, stops: [HAMBURG, { ...ARAL, name: longName }, BREMEN] }, DAY_B] } },
      { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 102 } } },
    )
    const heading = screen.getByRole('heading', { name: longName })
    expect(heading.parentElement).toHaveClass('items-center')
    expect(heading).toHaveClass('line-clamp-2')
    expect(heading).not.toHaveClass('truncate')
    expect(heading.previousElementSibling?.querySelector('svg')).not.toBeNull()
  })

  it('FE-MOB-RTSTOP-030: the pencil opens the place editor on this very visit and closes the sheet', () => {
    const { planner, shell } = renderSheet()
    const edit = screen.getByRole('button', { name: 'Edit' })
    // Before the way out, so the close button keeps the corner it has on every sheet.
    expect(edit.compareDocumentPosition(screen.getByRole('button', { name: 'Close' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(edit)
    expect(planner.openPlaceEditor).toHaveBeenCalledTimes(1)
    expect(planner.openPlaceEditor).toHaveBeenCalledWith(expect.objectContaining({ id: 203, address: 'Am Markt' }), 103)
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    // The stop sheet does not hand over to a stay or a map on the way.
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTOP-031: somebody who may not edit places gets no pencil at all', () => {
    // Every right but place_edit, so it is that one right the pencil answers to.
    const { planner } = renderSheet({ can: vi.fn((action: string) => action !== 'place_edit') })
    // Absent rather than disabled, the same rule as every other write on this sheet.
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    // The night switch answers to day_edit and stays, so no other right took the pencil away.
    expect(screen.getByRole('switch', { name: 'End the day here' })).toBeInTheDocument()
    expect(planner.can).toHaveBeenCalledWith('place_edit', planner.trip)
  })

  it('FE-MOB-RTSTOP-032: a pump hidden from the day lists is still editable from the stage', () => {
    // The planner's filtered list lacks the pump, the store still holds it.
    const pump = { id: 202, name: 'Aral Dammtor', lat: 53.56, lng: 9.99, stop_type: 'fuel' } as unknown as Place
    const { planner } = renderSheet(
      { places: PLACES },
      { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 102 } } },
      [...PLACES, pump],
    )
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(planner.openPlaceEditor).toHaveBeenCalledWith(expect.objectContaining({ id: 202 }), 102)
  })

  it('FE-MOB-RTSTOP-033: a stop still being saved under its optimistic id offers no pencil yet', () => {
    const saving = stop({ assignmentId: -5, placeId: 203, name: 'Bremen Marktplatz', ownerIndex: 0, dwellMinutes: 90 })
    const day = {
      ...DAY_A,
      stops: [saving],
      schedule: { entries: [{ arrival: '13:05', departure: '14:35', anchored: false, dayOffset: 0 }], warnings: [] },
      driveWarnings: [],
    } as unknown as RoadtripDay
    const { planner } = renderSheet({ roadtripRoutes: { days: [day] } }, { sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: -5 } } })
    expect(screen.getByRole('dialog', { name: 'Bremen Marktplatz' })).toBeInTheDocument()
    // Neither the temporary id nor a null the planner would resolve back to that same row.
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(planner.openPlaceEditor).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTOP-034: a stop whose place row is not in the trip store offers no pencil', () => {
    // The editor needs the whole row; the stop's name and position are enough for directions only.
    renderSheet({}, {}, [])
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Navigation' })).toBeInTheDocument()
  })

  it('FE-MOB-RTSTOP-035: a stop drawn on another card makes that card the stage before the camera moves', () => {
    // Kassel is stored on day 11 and drawn on day 12 after a night drive, while day 11 is on screen.
    const { planner, shell } = renderSheet(
      { selectedDayId: 11 },
      { rtView: 'map', sheet: { id: 'rtstop', payload: { dayId: 11, assignmentId: 104 } } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }))

    // The card, not the stored day, and without a refit of its own: the stop is the frame.
    expect(planner.handleSelectDay).toHaveBeenCalledWith(12, true)
    expect(planner.focusRoadtripPoint).toHaveBeenCalledWith(KASSEL.lat, KASSEL.lng)
    // The day first, so the map holds the point to the day it arrives with.
    const selectDay = vi.mocked(planner.handleSelectDay).mock.invocationCallOrder[0]
    const focus = vi.mocked(planner.focusRoadtripPoint).mock.invocationCallOrder[0]
    expect(selectDay).toBeLessThan(focus)
    expect(shell.toggleRtView).not.toHaveBeenCalled()
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.setSelectedPlaceId).not.toHaveBeenCalled()
  })
})
