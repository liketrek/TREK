import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import type { PluginDaySchedule } from '../../../../src/components/Plugins/PluginDaySchedule'
import type { MPlanTimelineController } from '../../../../src/mobile/screens/trip/plan/useMPlanTimeline'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { PlanRow, TransitMeta, TransportEntry } from '../../../../src/mobile/screens/trip/plan/planTimelineModel'
import type { MergedItem } from '../../../../src/utils/dayMerge'
import type { Assignment, Day, DayNote, Place, RouteSegment } from '../../../../src/types'
import MPlanTimeline from '../../../../src/mobile/screens/trip/plan/MPlanTimeline'

// FE-MOB-PLTL-001 to FE-MOB-PLTL-045

const mocks = vi.hoisted(() => ({
  tl: {} as Record<string, unknown>,
  schedule: {} as PluginDaySchedule,
}))

vi.mock('../../../../src/mobile/screens/trip/plan/useMPlanTimeline', () => ({
  useMPlanTimeline: () => mocks.tl,
}))

vi.mock('../../../../src/components/Plugins/PluginDaySchedule', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../src/components/Plugins/PluginDaySchedule')>()
  return { ...actual, usePluginDaySchedule: () => mocks.schedule }
})

const DAY = { id: 2, trip_id: 1, day_number: 2, date: '2026-05-02', title: 'Tokyo → Kyoto' } as unknown as Day

const MUSEUM = {
  id: 11, day_id: 2, place_id: 101, order_index: 0,
  place: { id: 101, name: 'Museum', place_time: '09:30', address: 'Museum Rd 1', lat: 35.71, lng: 139.79 },
} as unknown as Assignment

const PARK = {
  id: 12, day_id: 2, place_id: 102, order_index: 1,
  place: { id: 102, name: 'Ueno Park', lat: 35.72, lng: 139.77 },
} as unknown as Assignment

const NOTE = {
  id: 41, day_id: 2, text: 'Buy museum tickets', time: '08:00', icon: 'Ticket', sort_order: 0,
} as unknown as DayNote

const FLIGHT = {
  id: 21, type: 'flight', title: 'LH 714 to Tokyo', day_id: 2,
  reservation_time: '2026-05-02T08:15',
} as unknown as TransportEntry

const TRANSIT_RES = {
  id: 22, type: 'transit', title: 'Shibuya → Asakusa', day_id: 2,
  reservation_time: '2026-05-02T10:05',
} as unknown as TransportEntry

const TRANSIT: TransitMeta = {
  legs: [{
    mode: 'SUBWAY', line: 'G', line_color: '#FF9500', duration: 900,
    from: { name: 'Shibuya Sta.' }, to: { name: 'Asakusa Sta.' },
  }],
}

const SEG: RouteSegment = {
  mid: [35.7, 139.7], from: [35.71, 139.79], to: [35.72, 139.77],
  distance: 2100, duration: 600,
  walkingText: '26 min', drivingText: '7 min', distanceText: '2.1 km',
}

const M_PLACE: MergedItem = { type: 'place', sortKey: 0, data: MUSEUM }
const M_FLIGHT: MergedItem = { type: 'transport', sortKey: 1, data: FLIGHT }
const M_TRANSIT: MergedItem = { type: 'transport', sortKey: 2, data: TRANSIT_RES }
const M_NOTE: MergedItem = { type: 'note', sortKey: 3, data: NOTE }
const M_PLACE2: MergedItem = { type: 'place', sortKey: 4, data: PARK }

const MERGED = [M_PLACE, M_FLIGHT, M_TRANSIT, M_NOTE, M_PLACE2]

const ROWS: PlanRow[] = [
  { key: 'pl-11', kind: 'place', item: M_PLACE, assignment: MUSEUM, linkedRes: null },
  { key: 'conn-pl-11', kind: 'conn', seg: SEG, assignmentId: 11 },
  { key: 'tr-21', kind: 'transport', item: M_FLIGHT, res: FLIGHT },
  { key: 'tr-22', kind: 'transit', item: M_TRANSIT, res: TRANSIT_RES, transit: TRANSIT },
  { key: 'note-41', kind: 'note', item: M_NOTE, note: NOTE },
  { key: 'pl-12', kind: 'place', item: M_PLACE2, assignment: PARK, linkedRes: null },
  { key: 'conn-orphan', kind: 'conn', seg: { ...SEG, mode: 'walking' } },
]

const EMPTY_SCHEDULE: PluginDaySchedule = {
  byAssignment: {}, byReservation: {}, byPosition: {}, minutesByDay: {},
}

function buildTl(over: Record<string, unknown> = {}): MPlanTimelineController {
  return {
    day: DAY,
    rows: ROWS,
    merged: MERGED,
    hotelLegs: { top: null, bottom: null },
    hotelChips: [],
    weather: null,
    weatherTemp: null,
    upNext: { assignment: MUSEUM, minutesUntil: 45 },
    language: 'en',
    timeFormat: '24h',
    openTransitKeys: new Set<string>(),
    toggleTransit: vi.fn(),
    moveRow: vi.fn(),
    removeAssignment: vi.fn(),
    editAssignment: vi.fn(),
    editTransport: vi.fn(),
    openTransitJourney: vi.fn(),
    addPlace: vi.fn(),
    addBooking: vi.fn(),
    addTransport: vi.fn(),
    optimize: vi.fn(async () => undefined),
    exportGoogleMaps: vi.fn(),
    renameDay: vi.fn(),
    fullPlaceOf: vi.fn(() => undefined as Place | undefined),
    routeModeOptions: [
      { key: 'driving', label: 'Driving' },
      { key: 'walking', label: 'Walking' },
      { key: 'plugin:ev/fastest', label: 'EV fastest' },
    ],
    setLegMode: vi.fn(),
    ...over,
  } as unknown as MPlanTimelineController
}

/** The scrollable timeline card — its inline top offset encodes the layout mode. */
const card = (container: HTMLElement) => container.querySelector('.overflow-y-auto') as HTMLElement

function renderTimeline(
  tlOver: Record<string, unknown> = {},
  plannerOver: Partial<TripPlanner> = {},
  shellOver: Partial<MTripShellApi> = {},
) {
  mocks.tl = buildTl(tlOver) as unknown as Record<string, unknown>
  const planner = buildPlanner(plannerOver)
  const shell = buildShell(shellOver)
  return { planner, shell, ...render(<MPlanTimeline planner={planner} shell={shell} />) }
}

describe('MPlanTimeline', () => {
  beforeEach(() => {
    mocks.schedule = EMPTY_SCHEDULE
  })

  describe('go mode — up next card', () => {
    it('FE-MOB-PLTL-001: shows the next stop with its time, subtitle and countdown', () => {
      renderTimeline()

      expect(screen.getByText('mobileTrip.upNext')).toBeInTheDocument()
      expect(screen.getByText('mobileTrip.inCountdown:transit.min:45')).toBeInTheDocument()
      expect(screen.getAllByText('Museum').length).toBeGreaterThan(0)
      expect(screen.getAllByText('09:30').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Museum Rd 1').length).toBeGreaterThan(0)
    })

    it('FE-MOB-PLTL-002: tapping the card selects the place and its assignment', () => {
      const { planner } = renderTimeline()

      fireEvent.click(screen.getByText('mobileTrip.upNext'))

      expect(planner.handlePlaceClick).toHaveBeenCalledWith(101, 11)
    })

    it('FE-MOB-PLTL-003: hides the countdown, time chip and subtitle when the stop has none', () => {
      const bare = { ...MUSEUM, place: { id: 101, name: 'Museum' } } as unknown as Assignment
      renderTimeline({ upNext: { assignment: bare, minutesUntil: null }, rows: [], merged: [] })

      expect(screen.queryByText(/mobileTrip.inCountdown/)).not.toBeInTheDocument()
      expect(screen.queryByText('09:30')).not.toBeInTheDocument()
      expect(screen.queryByText('Museum Rd 1')).not.toBeInTheDocument()
    })

    it('FE-MOB-PLTL-004: collapses the reserved space when the day has no up next', () => {
      const { container, unmount } = renderTimeline()
      expect(card(container).style.top).toContain('216px')
      unmount()

      const empty = renderTimeline({ upNext: null, rows: [], merged: [] })
      expect(screen.queryByText('mobileTrip.upNext')).not.toBeInTheDocument()
      expect(card(empty.container).style.top).toContain('102px')
    })
  })

  describe('timeline header', () => {
    it('FE-MOB-PLTL-005: renders the accommodation chips and the weather chip', () => {
      renderTimeline({
        hotelChips: [
          { key: 'out-1', variant: 'checkout', name: 'Hotel Sacher', time: '11:00:00' },
          { key: 'in-2', variant: 'checkin', name: 'Ryokan Kyoto', time: '15:00:00' },
          { key: 'stay-3', variant: 'stay', name: 'Capsule Tokyo', time: null },
        ],
        weather: { main: 'Rain', temp: 17 },
        weatherTemp: 17,
      })

      expect(screen.getByText(/Hotel Sacher/)).toHaveTextContent('Hotel Sacher · 11:00')
      expect(screen.getByText(/Ryokan Kyoto/)).toHaveTextContent('Ryokan Kyoto · 15:00')
      expect(screen.getByText('Capsule Tokyo')).toBeInTheDocument()
      expect(screen.getByText('17°')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-006: a chip opens the day sheet', () => {
      const { shell } = renderTimeline({
        hotelChips: [{ key: 'stay-3', variant: 'stay', name: 'Capsule Tokyo', time: null }],
      })

      fireEvent.click(screen.getByText('Capsule Tokyo'))

      expect(shell.openSheet).toHaveBeenCalledWith('day', { dayId: 2 })
    })

    it('FE-MOB-PLTL-007: still renders, with the day pill, without chips or weather (#2004)', () => {
      const { container } = renderTimeline()

      // The pill is the only way into the day sheet, so it may not depend on the
      // day happening to have an accommodation or a weather reading.
      expect(container.querySelector('.border-b')).not.toBeNull()
      expect(screen.getByRole('button', { name: 'day.overview' })).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-008: draws the hotel bookend legs above and below the rows', () => {
      renderTimeline({
        hotelLegs: {
          top: { seg: SEG, name: 'Hotel Sacher' },
          bottom: { seg: SEG, name: 'Ryokan Kyoto' },
        },
      })

      expect(screen.getByText('Hotel Sacher')).toBeInTheDocument()
      expect(screen.getByText('Ryokan Kyoto')).toBeInTheDocument()
    })
  })

  describe('rows', () => {
    it('FE-MOB-PLTL-009: renders one row per kind', () => {
      renderTimeline()

      expect(screen.getAllByText('Museum').length).toBeGreaterThan(0)
      expect(screen.getByText('Ueno Park')).toBeInTheDocument()
      expect(screen.getByText('LH 714 to Tokyo')).toBeInTheDocument()
      expect(screen.getByText('Shibuya → Asakusa')).toBeInTheDocument()
      expect(screen.getByText('Buy museum tickets')).toBeInTheDocument()
      expect(screen.getByText('7 min')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-010: a place row selects its place', () => {
      const { planner } = renderTimeline()

      fireEvent.click(screen.getByText('Ueno Park'))

      expect(planner.handlePlaceClick).toHaveBeenCalledWith(102, 12)
    })

    it('FE-MOB-PLTL-011: a place row without a place still reports the assignment', () => {
      const orphan = { id: 13, day_id: 2, place_id: 103, order_index: 2, place: null } as unknown as Assignment
      const rows: PlanRow[] = [{ key: 'pl-13', kind: 'place', item: M_PLACE, assignment: orphan, linkedRes: null }]
      const { planner, container } = renderTimeline({ rows })

      fireEvent.click(container.querySelector('.cursor-pointer.items-center') as HTMLElement)

      expect(planner.handlePlaceClick).toHaveBeenCalledWith(null, 13)
    })

    it('FE-MOB-PLTL-012: a transport row opens the transport sheet in go mode', () => {
      const { shell } = renderTimeline()

      fireEvent.click(screen.getByText('LH 714 to Tokyo'))

      expect(shell.openSheet).toHaveBeenCalledWith('transport', { reservationId: 21 })
    })

    it('FE-MOB-PLTL-013: a transport row opens the editor in edit mode', () => {
      const { shell } = renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByText('LH 714 to Tokyo'))

      expect(mocks.tl.editTransport).toHaveBeenCalledWith(FLIGHT)
      expect(shell.openSheet).not.toHaveBeenCalledWith('transport', { reservationId: 21 })
    })

    it('FE-MOB-PLTL-014: a transit row toggles by its row key and renders its legs when open', () => {
      const { unmount } = renderTimeline()
      fireEvent.click(screen.getByText('Shibuya → Asakusa'))
      expect(mocks.tl.toggleTransit).toHaveBeenCalledWith('tr-22')
      expect(screen.queryByText('Shibuya Sta. → Asakusa Sta.')).not.toBeInTheDocument()
      unmount()

      renderTimeline({ openTransitKeys: new Set(['tr-22']) })

      expect(screen.getByText('Shibuya Sta. → Asakusa Sta.')).toBeInTheDocument()
      expect(screen.getByText('transit.min:15')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-015: a note row opens the note sheet with its note in edit mode', () => {
      const { shell } = renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByText('Buy museum tickets'))

      expect(shell.openSheet).toHaveBeenCalledWith('note', { dayId: 2, note: NOTE })
    })

    it('FE-MOB-PLTL-016: the reorder arrows move the merged item they belong to', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      const ups = screen.getAllByLabelText('dayplan.moveUp')
      const downs = screen.getAllByLabelText('dayplan.moveDown')

      // one stack per reorderable row: place, transport, transit, note, place
      expect(ups).toHaveLength(5)
      expect(ups[0]).toBeDisabled()
      expect(downs[4]).toBeDisabled()

      fireEvent.click(downs[0])
      fireEvent.click(ups[4])

      expect(mocks.tl.moveRow).toHaveBeenNthCalledWith(1, M_PLACE, 'down')
      expect(mocks.tl.moveRow).toHaveBeenNthCalledWith(2, M_PLACE2, 'up')
    })
  })

  describe('per-segment travel mode', () => {
    /** The timeline only offers the mode menu in edit mode, where many buttons exist. */
    const renderEditing = () => renderTimeline({}, {}, { mode: 'edit' })
    const connector = () => screen.getByText('7 min').closest('button') as HTMLElement

    it('FE-MOB-PLTL-017: a connector with an origin assignment opens the mode menu', () => {
      renderEditing()

      fireEvent.click(connector())

      expect(screen.getByText('Driving')).toBeInTheDocument()
      expect(screen.getByText('Walking')).toBeInTheDocument()
      expect(screen.getByText('EV fastest')).toBeInTheDocument()
      expect(screen.getByText('dayplan.transportMode.useDefault')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-018: picking a mode sets it on the origin assignment', () => {
      renderEditing()
      fireEvent.click(connector())

      fireEvent.click(screen.getByText('Walking'))

      expect(mocks.tl.setLegMode).toHaveBeenCalledWith(11, 'walking')
    })

    it('FE-MOB-PLTL-019: the default entry clears the override', () => {
      renderEditing()
      fireEvent.click(connector())

      fireEvent.click(screen.getByText('dayplan.transportMode.useDefault'))

      expect(mocks.tl.setLegMode).toHaveBeenCalledWith(11, null)
    })

    it('FE-MOB-PLTL-020: read-only members get no tappable connectors', () => {
      renderTimeline({}, { can: vi.fn(() => false) }, { mode: 'edit' })

      expect(screen.getByText('7 min').closest('button')).toBeNull()
    })

    it('FE-MOB-PLTL-020b: go mode keeps the connectors read-only even with edit rights', () => {
      renderTimeline()

      expect(screen.getByText('7 min').closest('button')).toBeNull()
    })
  })

  describe('plugin day schedule', () => {
    it('FE-MOB-PLTL-021: slots contributions under their anchors and at the day edges', () => {
      mocks.schedule = {
        byAssignment: { 2: { 11: [{ pluginId: 'ev', id: 'a1', dayId: 2, assignmentId: 11, minutes: 35, label: 'Charging stop', tone: 'success' }] } },
        byReservation: {
          2: {
            21: [{ pluginId: 'ev', id: 'r1', dayId: 2, reservationId: 21, minutes: 45, label: 'Security', tone: 'warn' }],
            22: [{ pluginId: 'ev', id: 'r2', dayId: 2, reservationId: 22, label: 'Ticket check', tone: 'default' }],
          },
        },
        byPosition: {
          2: {
            start: [{ pluginId: 'ev', id: 's1', dayId: 2, position: 'start', minutes: 10, label: 'Morning prep', tone: 'default' }],
            end: [{ pluginId: 'ev', id: 'e1', dayId: 2, position: 'end', minutes: 20, label: 'Evening wrap', tone: 'danger' }],
          },
        },
        minutesByDay: { 2: 110 },
      }
      renderTimeline()

      expect(screen.getByText('Charging stop')).toBeInTheDocument()
      expect(screen.getByText('Security')).toBeInTheDocument()
      expect(screen.getByText('Ticket check')).toBeInTheDocument()
      expect(screen.getByText('Morning prep')).toBeInTheDocument()
      expect(screen.getByText('Evening wrap')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-022: contributes nothing while no day is selected', () => {
      mocks.schedule = {
        byAssignment: { 2: { 11: [{ pluginId: 'ev', id: 'a1', dayId: 2, assignmentId: 11, minutes: 35, label: 'Charging stop', tone: 'success' }] } },
        byReservation: {},
        byPosition: { 2: { start: [{ pluginId: 'ev', id: 's1', dayId: 2, position: 'start', label: 'Morning prep', tone: 'default' }], end: [] } },
        minutesByDay: { 2: 35 },
      }
      const rows: PlanRow[] = [{ key: 'pl-11', kind: 'place', item: M_PLACE, assignment: MUSEUM, linkedRes: null }]
      renderTimeline({ day: undefined, rows })

      expect(screen.queryByText('Charging stop')).not.toBeInTheDocument()
      expect(screen.queryByText('Morning prep')).not.toBeInTheDocument()
    })
  })

  describe('empty day', () => {
    it('FE-MOB-PLTL-023: shows the mascot empty state in go mode', () => {
      const { container } = renderTimeline({ rows: [], merged: [], upNext: null })

      expect(screen.getByText('dayplan.emptyDay')).toBeInTheDocument()
      expect(container.querySelector('.trek--guide')).toBeTruthy()
    })

    it('FE-MOB-PLTL-024: replaces it with the action grid in edit mode', () => {
      renderTimeline({ rows: [], merged: [], upNext: null }, {}, { mode: 'edit' })

      expect(screen.queryByText('dayplan.emptyDay')).not.toBeInTheDocument()
      expect(screen.getByText('mobileTrip.addPlaceShort')).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('FE-MOB-PLTL-025: reserves the header space and hides the up-next card', () => {
      const { container } = renderTimeline({}, {}, { mode: 'edit' })

      expect(screen.queryByText('mobileTrip.upNext')).not.toBeInTheDocument()
      expect(card(container).style.top).toContain('140px')
    })

    it('FE-MOB-PLTL-026: splits the day title into city pills', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      expect(screen.getByText('Tokyo')).toBeInTheDocument()
      expect(screen.getByText('Kyoto')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-027: falls back to the day number when the day has no title', () => {
      renderTimeline({ day: { ...DAY, title: null } }, {}, { mode: 'edit' })

      expect(screen.getByText('planner.dayN:2')).toBeInTheDocument()
      // …and the day pill next to it stays icon-only so the name is not doubled.
      expect(screen.getByRole('button', { name: 'day.overview' })).toHaveTextContent('')
    })

    it('FE-MOB-PLTL-028: the pencil renames the day and Enter commits the change', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByLabelText('mobileTrip.renameDay'))
      const input = screen.getByPlaceholderText('mobileTrip.dayTitlePlaceholder') as HTMLInputElement
      expect(input.value).toBe('Tokyo → Kyoto')

      fireEvent.change(input, { target: { value: 'Osaka' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mocks.tl.renameDay).toHaveBeenCalledWith('Osaka')
      // committing closes the field again — the pills come back from the store
      expect(screen.queryByPlaceholderText('mobileTrip.dayTitlePlaceholder')).not.toBeInTheDocument()
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-029: Escape leaves the title untouched', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByLabelText('mobileTrip.renameDay'))
      const input = screen.getByPlaceholderText('mobileTrip.dayTitlePlaceholder')
      fireEvent.change(input, { target: { value: 'Osaka' } })
      fireEvent.keyDown(input, { key: 'Escape' })

      expect(mocks.tl.renameDay).not.toHaveBeenCalled()
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-030: blurring an unchanged draft does not rename', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByLabelText('mobileTrip.renameDay'))
      fireEvent.blur(screen.getByPlaceholderText('mobileTrip.dayTitlePlaceholder'))

      expect(mocks.tl.renameDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-PLTL-031: the calendar button opens the day reorder sheet', () => {
      const { shell } = renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByLabelText('dayplan.reorderDays'))

      expect(shell.openSheet).toHaveBeenCalledWith('days')
    })

    it('FE-MOB-PLTL-032: undo is disabled until there is something to undo', () => {
      const { unmount } = renderTimeline({}, {}, { mode: 'edit' })
      expect(screen.getByText('undo.button').closest('button')).toBeDisabled()
      unmount()

      const { planner } = renderTimeline(
        {}, { canUndo: true, lastActionLabel: 'undo.reorder' }, { mode: 'edit' },
      )
      const button = screen.getByText('undo.button').closest('button') as HTMLButtonElement
      expect(button).toHaveAttribute('title', 'undo.tooltip:undo.reorder')

      fireEvent.click(button)

      expect(planner.handleUndo).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-PLTL-033: every action tile fires its planner action', () => {
      const { shell } = renderTimeline({}, {}, { mode: 'edit' })

      fireEvent.click(screen.getByText('mobileTrip.addPlaceShort'))
      fireEvent.click(screen.getByText('mobileTrip.addNoteShort'))
      fireEvent.click(screen.getByText('mobileTrip.addBookingShort'))
      fireEvent.click(screen.getByText('mobileTrip.addTransportShort'))
      fireEvent.click(screen.getByText('dayplan.optimize'))
      fireEvent.click(screen.getByText('mobileTrip.googleMaps'))

      expect(mocks.tl.addPlace).toHaveBeenCalledTimes(1)
      expect(shell.openSheet).toHaveBeenCalledWith('note', { dayId: 2 })
      expect(mocks.tl.addBooking).toHaveBeenCalledTimes(1)
      expect(mocks.tl.addTransport).toHaveBeenCalledTimes(1)
      expect(mocks.tl.optimize).toHaveBeenCalledTimes(1)
      expect(mocks.tl.exportGoogleMaps).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-PLTL-034: the note tile is inert while no day is selected', () => {
      const { shell } = renderTimeline({ day: undefined, rows: [], merged: [] }, {}, { mode: 'edit' })

      fireEvent.click(screen.getByText('mobileTrip.addNoteShort'))

      expect(shell.openSheet).not.toHaveBeenCalled()
    })

    it('FE-MOB-PLTL-038: renaming starts from an empty draft while no day is loaded', () => {
      renderTimeline({ day: undefined, rows: [], merged: [] }, {}, { mode: 'edit' })

      fireEvent.click(screen.getByLabelText('mobileTrip.renameDay'))
      const input = screen.getByPlaceholderText('mobileTrip.dayTitlePlaceholder') as HTMLInputElement
      expect(input.value).toBe('')

      fireEvent.change(input, { target: { value: 'Nara' } })
      fireEvent.blur(input)

      expect(mocks.tl.renameDay).toHaveBeenCalledWith('Nara')
    })

    it('FE-MOB-PLTL-035: read-only members never enter edit mode', () => {
      renderTimeline({}, { can: vi.fn(() => false) }, { mode: 'edit' })

      expect(screen.queryByText('mobileTrip.addPlaceShort')).not.toBeInTheDocument()
      expect(screen.getByText('mobileTrip.upNext')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-036: place rows expose edit and remove in edit mode', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      const edits = screen.getAllByLabelText('common.edit')
      fireEvent.click(edits[0])
      fireEvent.click(screen.getAllByLabelText('planner.removeFromDay')[0])

      expect(mocks.tl.editAssignment).toHaveBeenCalledWith(MUSEUM)
      expect(mocks.tl.removeAssignment).toHaveBeenCalledWith(MUSEUM)
    })

    it('FE-MOB-PLTL-037: the transit row opens the journey view from its edit circle', () => {
      renderTimeline({}, {}, { mode: 'edit' })

      const transitCard = screen.getByText('Shibuya → Asakusa').closest('.mt-1\\.5') as HTMLElement
      fireEvent.click(within(transitCard).getByLabelText('common.edit'))

      expect(mocks.tl.openTransitJourney).toHaveBeenCalledWith(TRANSIT_RES)
    })
  })
  describe('day swipe (#2051)', () => {
    const DAYS = [
      { id: 1, trip_id: 1, day_number: 1 }, DAY, { id: 3, trip_id: 1, day_number: 3 },
    ] as unknown as Day[]

    const panel = (container: HTMLElement) => container.firstElementChild as HTMLElement

    /** A committing left swipe across the whole panel. */
    function swipe(el: HTMLElement, from = 300, to = 180) {
      fireEvent.touchStart(el, { touches: [{ clientX: from, clientY: 300 }] })
      fireEvent.touchMove(el, { touches: [{ clientX: from - 20, clientY: 300 }] })
      fireEvent.touchMove(el, { touches: [{ clientX: to, clientY: 300 }] })
      fireEvent.touchEnd(el, { touches: [], changedTouches: [{ clientX: to, clientY: 300 }] })
    }

    it('FE-MOB-PLTL-039: swiping the panel selects the next day without re-framing the map', async () => {
      const { container, planner } = renderTimeline({}, { days: DAYS, selectedDayId: 2 })

      swipe(panel(container))

      // skipFit must be true: the map stays mounted under the timeline, and
      // re-fitting it here would move it somewhere nobody asked for.
      await waitFor(() => expect(planner.handleSelectDay).toHaveBeenCalledWith(3, true))
    })

    it('FE-MOB-PLTL-040: the header chip strip is excluded from the swipe zone', () => {
      const { container } = renderTimeline({}, { days: DAYS, selectedDayId: 2 })

      expect(container.querySelector('[data-hswipe-ignore]')).toBeInTheDocument()
    })

    it('FE-MOB-PLTL-041: the live region is present and silent until a swipe lands', () => {
      const { container } = renderTimeline({}, { days: DAYS, selectedDayId: 2 })

      const live = container.querySelector('[role="status"]') as HTMLElement
      expect(live).toHaveAttribute('aria-live', 'polite')
      expect(live).toHaveAttribute('aria-atomic', 'true')
      expect(live).toHaveTextContent('')
    })

    it('FE-MOB-PLTL-042: a committed swipe announces the day it reached', async () => {
      const { container } = renderTimeline({}, { days: DAYS, selectedDayId: 2 })

      swipe(panel(container))

      await waitFor(() => expect(container.querySelector('[role="status"]'))
        .toHaveTextContent('mobileTrip.dayAnnounce:3,3'))
    })

    it('FE-MOB-PLTL-043: edit mode keeps both the swipe and the long-press reorder', async () => {
      const { container, planner } = renderTimeline({}, { days: DAYS, selectedDayId: 2 }, { mode: 'edit' })

      swipe(panel(container))

      await waitFor(() => expect(planner.handleSelectDay).toHaveBeenCalledWith(3, true))
      expect(card(container)).toHaveAttribute('data-touch-drag')
    })

    it('FE-MOB-PLTL-044: a plain tap on a place row still opens it', () => {
      const { planner } = renderTimeline({}, { days: DAYS, selectedDayId: 2 })

      fireEvent.click(screen.getByText('Ueno Park'))

      expect(planner.handlePlaceClick).toHaveBeenCalledWith(102, 12)
    })

    it('FE-MOB-PLTL-045: nothing narrows touch-action, and the excluded strip stays tappable', () => {
      const { container, shell } = renderTimeline({}, { days: DAYS, selectedDayId: 2 })

      // touch-action intersects down the tree, so a pan-y here would take the
      // header strip's own horizontal pan with it.
      expect(panel(container).style.touchAction).toBe('')
      expect(card(container).style.touchAction).toBe('')

      fireEvent.click(screen.getByLabelText('day.overview'))
      expect(shell.openSheet).toHaveBeenCalledWith('day', { dayId: 2 })
    })
  })
})
