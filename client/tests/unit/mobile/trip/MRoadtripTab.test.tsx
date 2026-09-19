import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { useTripStore } from '../../../../src/store/tripStore'
import MRoadtripTab from '../../../../src/mobile/screens/trip/roadtrip/MRoadtripTab'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { Day, Place } from '../../../../src/types'
import type { RoadtripDay, RoadtripRoutes, RouteSegment } from '@trek/shared/roadtrip'
import type { LegAlternatives } from '../../../../src/components/Roadtrip/useRouteAlternatives'

// FE-MOB-RTTAB-001 to FE-MOB-RTTAB-050
//
// The stage bar pictures the place its day ends at. It reads that place out of the trip
// store rather than the planner, the unfiltered list, so the picture tests seed the store.

// The preference store is a zustand slice keyed by user and trip; the tab only ever
// reads two flags out of it, so the hook is the smaller seam.
const mocks = vi.hoisted(() => ({
  prefs: {} as Record<string, unknown>,
  swipe: {} as { onSelectDay: (id: number) => void; describeDay: (i: number, n: number) => string },
}))

vi.mock('../../../../src/hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (p: Record<string, unknown>) => unknown) => select(mocks.prefs),
}))

// The picture asks the photo service for any place without an image of its own. Stubbed to
// know nothing and fetch nothing, so no test of the bar ever reaches for the network.
vi.mock('../../../../src/services/photoService', () => ({
  getCached: () => null,
  isLoading: () => false,
  fetchPhoto: vi.fn(),
  onThumbReady: () => () => {},
}))

// The swipe itself is the plan tab's, tested there; this keeps the real hook and only
// records what the road trip tab hands it.
vi.mock('../../../../src/mobile/screens/trip/plan/useMPlanDaySwipe', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../src/mobile/screens/trip/plan/useMPlanDaySwipe')>()
  return {
    ...actual,
    useMPlanDaySwipe: (config: Parameters<typeof actual.useMPlanDaySwipe>[0]) => {
      mocks.swipe = config as unknown as typeof mocks.swipe
      return actual.useMPlanDaySwipe(config)
    },
  }
})

const DAYS = [
  { id: 1, trip_id: 7, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 7, day_number: 2, date: '2026-05-02', title: null },
] as unknown as Day[]

const PLACES = [
  { id: 101, trip_id: 7, name: 'Fuji Viewpoint', lat: 35.36, lng: 138.73 },
  { id: 103, trip_id: 7, name: 'Kyoto Station', lat: 34.98, lng: 135.75 },
] as unknown as Place[]

const seg = (distanceText: string, durationText: string): RouteSegment => ({
  mid: [35.4, 138.6], from: [35.7, 139.8], to: [34.98, 135.75],
  distance: 210_000, duration: 9_600,
  walkingText: '42 h', drivingText: durationText, distanceText, durationText,
})

/**
 * One stage with all five row kinds on it.
 *
 * The first stop is stored on day 1: it was reached after midnight, so it is drawn on
 * this card behind a spill band while still belonging to the day before. That is the
 * case the sheet id has to survive.
 */
function stage(over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 2,
    dayNumber: 2,
    date: '2026-05-02',
    title: null,
    stops: [
      {
        assignmentId: 501, ownerDayId: 1, ownerIndex: 3, placeId: 101, name: 'Fuji Viewpoint',
        lat: 35.36, lng: 138.73, time: null, dwellMinutes: 45,
        legMode: null, incomingLegMode: null, stopType: null,
      },
      {
        assignmentId: 502, ownerDayId: 2, ownerIndex: 0, placeId: 102, name: 'Shell Ebina',
        lat: 35.44, lng: 139.39, time: null, dwellMinutes: 10,
        legMode: null, incomingLegMode: null, stopType: 'fuel',
      },
      {
        assignmentId: 503, ownerDayId: 2, ownerIndex: 1, placeId: 103, name: 'Kyoto Station',
        lat: 34.98, lng: 135.75, time: null, dwellMinutes: null,
        legMode: null, incomingLegMode: null, stopType: null,
      },
      {
        assignmentId: 504, ownerDayId: 2, ownerIndex: 2, placeId: 104, name: 'Day end',
        lat: 34.9, lng: 135.7, time: null, dwellMinutes: null,
        legMode: null, incomingLegMode: null, stopType: null,
        automaticNight: { phase: 'end', fromDayNumber: 2 },
      },
    ],
    legs: [seg('62 km', '1 h'), seg('210 km', '2 h 40 min'), undefined],
    schedule: {
      entries: [
        { arrival: '08:30', departure: '09:15', anchored: true, dayOffset: 0 },
        { arrival: '10:05', departure: '10:15', anchored: false, dayOffset: 0 },
        { arrival: '12:40', departure: null, anchored: false, dayOffset: 0 },
        { arrival: '22:00', departure: null, anchored: false, dayOffset: 0 },
      ],
      warnings: [],
    },
    legVias: [[], [], []],
    geometry: [],
    distance: 412_000,
    duration: 18_000,
    driveWarnings: [{ index: 2, code: 'late', minutes: 25 }],
    dayWarning: null,
    spills: [{ at: 0, count: 1, fromDayNumber: 1, departure: '23:10', leg: undefined }],
    dryPoints: [{ legIndex: 1, intoLegKm: 82, drivenMeters: 82_000, sinceKm: 520, lat: 35.2, lng: 137.5 }],
    ...over,
  } as unknown as RoadtripDay
}

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [stage()],
    quietDays: [], lines: [], lineDays: [], accessLines: [], vias: [], segments: [],
    totalDistance: 980_000, totalDuration: 54_000, totalStops: 4, loading: false,
    ...over,
  } as unknown as RoadtripRoutes
}

function planner(over: Partial<TripPlanner> = {}): TripPlanner {
  return buildPlanner({
    tripId: 7,
    days: DAYS,
    places: PLACES,
    selectedDayId: 2,
    roadtripRoutes: routes(),
    askRefuel: vi.fn(),
    ...over,
  } as Partial<TripPlanner>)
}

function renderTab(p: TripPlanner = planner(), shell: MTripShellApi = buildShell()) {
  const view = render(<MRoadtripTab planner={p} shell={shell} tab="roadtrip" />)
  return { ...view, planner: p, shell }
}

/** Freezes the clock and hands back the stage's own date, whatever the runner's zone. */
function freezeAt(hour: number, minute: number): string {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 4, 2, hour, minute))
  return new Date().toISOString().slice(0, 10)
}

function today(date: string): Partial<TripPlanner> {
  return {
    days: DAYS.map(d => (d.id === 2 ? { ...d, date } : d)) as unknown as Day[],
    roadtripRoutes: routes({ days: [stage({ date })] }),
  }
}

describe('MRoadtripTab', () => {
  beforeEach(() => {
    resetAllStores()
    mocks.prefs = {}
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('list half', () => {
    it('FE-MOB-RTTAB-001: heads the stage with its start, its arrival, the day total and the stop count', () => {
      renderTab()

      // The start is the first stop's ARRIVAL (08:30), the clock its row prints, not its
      // departure (09:15). Nor is it the spill band's 23:10: that one belongs to the day before.
      const start = screen.getByText('mobileTrip.rtStart').parentElement as HTMLElement
      expect(within(start).getByText('08:30')).toBeInTheDocument()
      expect(within(start).queryByText('09:15')).toBeNull()
      expect(within(start).queryByText('23:10')).toBeNull()
      const arrive = screen.getByText('roadtrip.stay.arrive').parentElement as HTMLElement
      expect(within(arrive).getByText('12:40')).toBeInTheDocument()
      // Both clocks keep their digit order in an RTL locale, like the ones on the rows.
      expect(within(start).getByText('08:30')).toHaveAttribute('dir', 'ltr')
      expect(within(arrive).getByText('12:40')).toHaveAttribute('dir', 'ltr')

      expect(screen.getByText('roadtrip.leg.driveText:412 km,5 h')).toBeInTheDocument()
      expect(screen.getByText('roadtrip.day.stopCount:2')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-002: dates the head card, and falls back to the day number without a date', () => {
      renderTab()
      expect(screen.getByText(/May 2/)).toBeInTheDocument()

      const undated = planner({ days: DAYS.map(d => ({ ...d, date: null })) as unknown as Day[] })
      const second = render(<MRoadtripTab planner={undated} shell={buildShell()} tab="roadtrip" />)
      expect(within(second.container).getByText('roadtrip.day:2')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-003: draws one row per stop, in the order of the model', () => {
      renderTab()

      const names = screen.getAllByText(/^(Fuji Viewpoint|Shell Ebina|Kyoto Station)$/).map(n => n.textContent)
      expect(names).toEqual(['Fuji Viewpoint', 'Shell Ebina', 'Kyoto Station'])
      // The petrol stop takes no number, so the destination after it is still 2.
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.queryByText('3')).toBeNull()
      // And the automatic night is a band, not a stop.
      expect(screen.queryByText('Day end')).toBeNull()
      expect(screen.getByText('roadtrip.window.stop')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-004: opens a stop on the day it is stored on, not the card it is drawn on', () => {
      const { shell } = renderTab()

      fireEvent.click(screen.getByText('Fuji Viewpoint'))

      expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 1, assignmentId: 501 })
    })

    it('FE-MOB-RTTAB-005: opens a stop of this day with this day', () => {
      const { shell } = renderTab()

      fireEvent.click(screen.getByText('Kyoto Station'))

      expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 2, assignmentId: 503 })
    })

    it('FE-MOB-RTTAB-051: the disc asks which kind of stop it is, without opening the stop', () => {
      const { shell } = renderTab()

      // Kyoto Station is a destination, so its disc offers to make it a stop on the way.
      fireEvent.click(screen.getAllByRole('button', { name: 'roadtrip.stop.makeService' })[1])

      expect(shell.openSheet).toHaveBeenCalledWith('rtkind', {
        placeId: 103,
        stopType: null,
        name: 'Kyoto Station',
      })
      // The row's own tap opens the stop; the disc's must not do both.
      expect(shell.openSheet).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-RTTAB-052: a traveller who may not edit places gets a disc that is not a control', () => {
      renderTab(planner({ can: () => false }))

      expect(screen.queryByRole('button', { name: 'roadtrip.stop.makeService' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'roadtrip.stop.kind' })).toBeNull()
    })

    it('FE-MOB-RTTAB-006: writes the day warning out with the sentence the desktop hides in a tooltip', () => {
      const over = stage({ dayWarning: { code: 'dayDriving', minutes: 620, limitMinutes: 540 } })
      renderTab(planner({ roadtripRoutes: routes({ days: [over] }) }))

      expect(screen.getByText('roadtrip.limit.dayOver:1 h 20 min')).toBeInTheDocument()
      expect(screen.getByText('roadtrip.limit.hint')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-007: leaves the day warning off a stage that stays inside its limit', () => {
      renderTab()

      expect(screen.queryByText(/roadtrip\.limit\.dayOver/)).toBeNull()
      expect(screen.queryByText('roadtrip.limit.hint')).toBeNull()
    })

    it('FE-MOB-RTTAB-008: shows the empty stage without a summary card full of zeroes', () => {
      renderTab(planner({ roadtripRoutes: routes({ days: [] }) }))

      expect(screen.getByText('roadtrip.empty.title')).toBeInTheDocument()
      expect(screen.getByText('mobileTrip.rtPlanOnDesktop')).toBeInTheDocument()
      expect(screen.queryByText('mobileTrip.rtStart')).toBeNull()
      expect(screen.queryByText(/roadtrip\.day\.stopCount/)).toBeNull()
    })

    it('FE-MOB-RTTAB-009: shows the partial hint instead of the empty state while the round is still running', () => {
      renderTab(planner({ roadtripRoutes: routes({ days: [], loading: true }) }))

      expect(screen.getByText('roadtrip.summary.partial')).toBeInTheDocument()
      expect(screen.queryByText('roadtrip.empty.title')).toBeNull()
      expect(screen.queryByText('mobileTrip.rtPlanOnDesktop')).toBeNull()
    })

    it('FE-MOB-RTTAB-010: draws no day colour dot in the head card, even with the day colours on', () => {
      // The colour keys the day's line on the map, which lies under the list on this half,
      // so a dot here had nothing on screen to explain it.
      mocks.prefs = { roadtrip_day_colors: true }
      renderTab()

      const card = screen.getByText('mobileTrip.rtStart').closest('section') as HTMLElement
      // The dot was the card's only inline paint (this stage carries no day warning).
      expect(card.querySelectorAll('[style]')).toHaveLength(0)
      expect(card.querySelector('[aria-hidden="true"]')).toBeNull()
      // The date is text and nothing else, with no swatch leading or trailing it.
      expect(screen.getByText(/May 2/).children).toHaveLength(0)
    })

    it('FE-MOB-RTTAB-011: dashes the two figures for a stage the routing could not time', () => {
      const untimed = stage({
        schedule: { entries: [0, 1, 2, 3].map(() => ({ arrival: null, departure: null, anchored: false, dayOffset: 0 })), warnings: [] },
      } as unknown as Partial<RoadtripDay>)
      renderTab(planner({ roadtripRoutes: routes({ days: [untimed] }) }))

      const start = screen.getByText('mobileTrip.rtStart').parentElement as HTMLElement
      expect(within(start).getByText('-')).toBeInTheDocument()
      const arrive = screen.getByText('roadtrip.stay.arrive').parentElement as HTMLElement
      expect(within(arrive).getByText('-')).toBeInTheDocument()
      // The chain itself still stands, it just carries no clocks.
      expect(screen.getByText('Kyoto Station')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-012: says the day total is still partial while the distance is zero', () => {
      renderTab(planner({ roadtripRoutes: routes({ days: [stage({ distance: 0 })] }) }))

      expect(screen.getByText('roadtrip.summary.partial')).toBeInTheDocument()
      expect(screen.queryByText(/roadtrip\.leg\.driveText:412/)).toBeNull()
    })

    it('FE-MOB-RTTAB-032: heads the card with the clock the first row prints, not the end of its stay', () => {
      // The reported stage: Hamburg Speicherstadt pinned at 10:00 with an hour and a half
      // there, Sanssouci reached at 19:33. The card used to read LEAVE 11:30, a clock no row
      // shows, which hid the pinned appointment behind its own stay.
      const reported = stage({
        spills: [],
        stops: [
          {
            assignmentId: 601, ownerDayId: 2, ownerIndex: 0, placeId: 201, name: 'Hamburg Speicherstadt',
            lat: 53.54, lng: 9.99, time: '10:00', dwellMinutes: 90,
            legMode: null, incomingLegMode: null, stopType: null,
          },
          {
            assignmentId: 602, ownerDayId: 2, ownerIndex: 1, placeId: 202, name: 'Sanssouci Palace',
            lat: 52.4, lng: 13.04, time: null, dwellMinutes: 120,
            legMode: null, incomingLegMode: null, stopType: null,
          },
        ],
        legs: [seg('290 km', '3 h')],
        legVias: [[]],
        schedule: {
          entries: [
            { arrival: '10:00', departure: '11:30', anchored: true, dayOffset: 0 },
            { arrival: '19:33', departure: '21:33', anchored: false, dayOffset: 0 },
          ],
          warnings: [],
        },
        dryPoints: [],
        driveWarnings: [],
      } as unknown as Partial<RoadtripDay>)
      renderTab(planner({ roadtripRoutes: routes({ days: [reported] }) }))

      const start = screen.getByText('mobileTrip.rtStart').parentElement as HTMLElement
      expect(within(start).getByText('10:00')).toBeInTheDocument()
      const arrive = screen.getByText('roadtrip.stay.arrive').parentElement as HTMLElement
      expect(within(arrive).getByText('19:33')).toBeInTheDocument()
      // Neither departure is printed anywhere on the screen, and the word for one is gone.
      expect(screen.queryByText('11:30')).toBeNull()
      expect(screen.queryByText('21:33')).toBeNull()
      expect(screen.queryByText('roadtrip.stay.leave')).toBeNull()
      // The figure is the very clock the first row carries.
      const firstRow = screen.getByText('Hamburg Speicherstadt').closest('[role=button]') as HTMLElement
      expect(within(firstRow).getByText('10:00')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-042: carries the day\'s facts on the date line as badges, above the clocks', () => {
      renderTab()

      const date = screen.getByText(/May 2/)
      const line = date.parentElement as HTMLElement
      // The date takes the start and the badges pack to the end, and the line may wrap.
      expect(date.className).toContain('me-auto')
      expect(line.className).toContain('flex-wrap')
      const drive = within(line).getByText('roadtrip.leg.driveText:412 km,5 h').closest('.rounded-full') as HTMLElement
      const stops = within(line).getByText('roadtrip.day.stopCount:2').closest('.rounded-full') as HTMLElement
      expect(drive).not.toBeNull()
      expect(stops).not.toBeNull()
      expect(drive).not.toBe(stops)
      // The two share one wrapper beside the date, so they wrap under it as a pair and a long
      // drive never leaves the count alone on the next line, away from the drive.
      const pair = drive.parentElement as HTMLElement
      expect(stops.parentElement).toBe(pair)
      expect(pair.parentElement).toBe(line)
      expect(pair.className).toContain('flex-wrap')
      expect(pair.className).toContain('max-w-full')
      // The distance keeps its unit's case; the count is a word, in caps like the stage bar's.
      expect(drive.className).not.toContain('uppercase')
      expect(stops.className).toContain('uppercase')
      // The clocks are the band under the line, not part of it.
      expect(within(line).queryByText('mobileTrip.rtStart')).toBeNull()
      const clocks = screen.getByText('mobileTrip.rtStart')
      expect(line.compareDocumentPosition(clocks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('FE-MOB-RTTAB-043: puts the partial total on the date line in a badge that may wrap', () => {
      renderTab(planner({ roadtripRoutes: routes({ days: [stage({ distance: 0 })] }) }))

      const line = screen.getByText(/May 2/).parentElement as HTMLElement
      const badge = within(line).getByText('roadtrip.summary.partial')
      // The sentence breaks inside its badge rather than pushing past the card, and the
      // badge stops at the line's width and grows with the text instead of clipping it.
      expect(badge.className).toContain('rounded-full')
      expect(badge.className).toContain('whitespace-normal')
      expect(badge.className).toContain('max-w-full')
      expect(badge.className).not.toMatch(/(^|\s)h-\[18px\]/)
      expect(badge.className).not.toContain('uppercase')
      // The stop count beside it is a figure, and stays on one line.
      expect(within(line).getByText('roadtrip.day.stopCount:2').className).toContain('whitespace-nowrap')
    })

    it('FE-MOB-RTTAB-044: sets the clocks smaller and draws no divider band, so the card stays a header', () => {
      renderTab()

      for (const [label, clock] of [['mobileTrip.rtStart', '08:30'], ['roadtrip.stay.arrive', '12:40']] as const) {
        const value = within(screen.getByText(label).parentElement as HTMLElement).getByText(clock)
        expect(value.className).toContain('text-[1.5rem]')
        expect(value.className).not.toContain('text-[1.875rem]')
      }
      const card = screen.getByText('mobileTrip.rtStart').closest('section') as HTMLElement
      expect(card.querySelector('[class*="border-t"]')).toBeNull()
      const padding = card.className.split(' ')
      expect(padding).toContain('py-3')
      expect(padding).not.toContain('py-3.5')
    })
  })

  describe('up next', () => {
    it('FE-MOB-RTTAB-013: counts down to the next stop still ahead, on the day it actually is', () => {
      const date = freezeAt(7, 0)
      renderTab(planner(today(date)))

      const card = screen.getByText('mobileTrip.upNext').closest('section') as HTMLElement
      expect(within(card).getByText('Fuji Viewpoint')).toBeInTheDocument()
      expect(within(card).getByText('mobileTrip.inCountdown:1 h 30 min')).toBeInTheDocument()
      expect(within(card).getByText('08:30')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-014: shows no countdown on a day that is not today', () => {
      const date = freezeAt(7, 0)
      const shifted = new Date(`${date}T00:00:00Z`)
      shifted.setUTCDate(shifted.getUTCDate() + 7)
      renderTab(planner(today(shifted.toISOString().slice(0, 10))))

      // Same clock, same stage, a week further on: the countdown is about the date.
      expect(screen.queryByText('mobileTrip.upNext')).toBeNull()
      expect(screen.getByText('mobileTrip.rtStart')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-015: shows no countdown once the last stop is behind you', () => {
      const date = freezeAt(23, 30)
      renderTab(planner(today(date)))

      expect(screen.queryByText('mobileTrip.upNext')).toBeNull()
    })

    it('FE-MOB-RTTAB-016: opens the stop from the countdown card', () => {
      const date = freezeAt(7, 0)
      const { shell } = renderTab(planner(today(date)))

      fireEvent.click(screen.getByText('mobileTrip.upNext'))

      expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 1, assignmentId: 501 })
    })

    it('FE-MOB-RTTAB-017: shows the next stop on the map half by moving the camera, not the place selection', () => {
      const date = freezeAt(7, 0)
      const p = planner(today(date))
      const { shell } = renderTab(p)

      fireEvent.click(screen.getByLabelText('mobileTrip.showOnMap'))

      expect(p.focusRoadtripPoint).toHaveBeenCalledWith(35.36, 138.73)
      expect(shell.toggleRtView).toHaveBeenCalledTimes(1)
      // The place inspector opens off the selection and would come up over the stage.
      expect(p.setSelectedPlaceId).not.toHaveBeenCalled()
      // Up next is always a stop of the stage on screen, so the day stays where it is.
      expect(p.handleSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-RTTAB-018: leaves the navigate link dead when the stop has no place row behind it', () => {
      const date = freezeAt(7, 0)
      // Found by the attribute, not by a label: the button carries the single navigation
      // target's own name when there is exactly one, and a translated word otherwise, so
      // its text depends on which map apps a place qualifies for.
      const enabled = renderTab(planner(today(date)))
      expect(enabled.container.querySelector('a[aria-disabled]')).toHaveAttribute('aria-disabled', 'false')
      enabled.unmount()

      const { container } = renderTab(planner({ ...today(date), places: [] }))
      const link = container.querySelector('a[aria-disabled]') as HTMLElement
      expect(link).toHaveAttribute('aria-disabled', 'true')
      expect(link).toHaveAttribute('href', '#')
    })
  })

  describe('refuel', () => {
    it('FE-MOB-RTTAB-019: asks for a refuel with the dry point of the leg the band sits on', () => {
      const p = planner()
      renderTab(p)

      fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.find' }))

      expect(p.askRefuel).toHaveBeenCalledWith(2, expect.objectContaining({ legIndex: 1, intoLegKm: 82 }))
    })

    it('FE-MOB-RTTAB-020: offers no refuel search to a member who cannot edit the day', () => {
      renderTab(planner({ can: vi.fn(() => false) }))

      expect(screen.getByText('roadtrip.refuel.dry')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    })

    it('FE-MOB-RTTAB-021: reads the vehicle out of the trip preferences', () => {
      mocks.prefs = { roadtrip_vehicle: 'electric' }
      renderTab()

      expect(screen.getByText('roadtrip.refuel.dryElectric')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'roadtrip.refuel.findElectric' })).toBeInTheDocument()
    })
  })

  describe('map half', () => {
    const mapShell = () => buildShell({ rtView: 'map' })

    it('FE-MOB-RTTAB-022: leaves the map to itself, with no bar of its own over it', () => {
      const { container } = renderTab(planner(), mapShell())

      expect((container.firstChild as HTMLElement).className).toContain('pointer-events-none')
      expect(screen.queryByText('mobileTrip.rtStart')).toBeNull()
      expect(screen.queryByText('Shell Ebina')).toBeNull()
      expect(screen.queryByText('roadtrip.refuel.dry')).toBeNull()
      expect(screen.queryByText('roadtrip.window.stop')).toBeNull()

      // A stage bar used to stand over the dock here, naming the day's destination with its
      // picture, stop count, arrival and distance. The day and the distance are in the
      // shell's stage header already, and on a map that fills the screen a permanent card
      // over the bottom edge cost more than the three facts it added. Nothing is left of it:
      // not the destination, not its badges, and not an empty wrapper over the map's own
      // buttons. The picker's bar still uses that slot (FE-MOB-RTTAB-048).
      expect(screen.queryByText('Kyoto Station')).toBeNull()
      expect(screen.queryByText('roadtrip.day.stopCount:2')).toBeNull()
      expect(screen.queryByText('412 km')).toBeNull()
      expect(screen.queryByRole('button', { name: /Kyoto Station/ })).toBeNull()
      // The search bar is still up top; what is gone is the wrapper down at the dock.
      expect(container.querySelector('[class*="bottom-[calc(var(--bottom-nav-h"]')).toBeNull()
    })

  })

  describe('the corridor search', () => {
    const mapShell = () => buildShell({ rtView: 'map' })

    it('FE-MOB-RTTAB-028: the search bar stands in the same band on both halves', () => {
      const list = renderTab()
      const inList = screen.getByText('roadtrip.poi.title').closest('div[class*="top-[calc"]')
      expect(inList).not.toBeNull()
      list.unmount()

      renderTab(planner(), mapShell())
      const onMap = screen.getByText('roadtrip.poi.title').closest('div[class*="top-[calc"]')
      // Literally the same offset: one stage seen two ways, and a control that jumps
      // between them is a control you have to find twice.
      expect(onMap?.className).toBe(inList?.className)
    })

    it('FE-MOB-RTTAB-029: it opens the search sheet', () => {
      const { shell } = renderTab()

      fireEvent.click(screen.getByText('roadtrip.poi.title'))
      expect(shell.openSheet).toHaveBeenCalledWith('rtsearch')
    })

    it('FE-MOB-RTTAB-030: the chain starts below the bar rather than under it', () => {
      const { container } = renderTab()

      const scroller = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement
      // 96px band plus a 44px bar plus its gap. A padding left at the old 102 would
      // put the head card's first line behind the glass.
      expect(scroller.className).toContain('pt-[calc(var(--m-safe-top,12px)+150px)]')
    })
    it('FE-MOB-RTTAB-031: no stage, no search bar, and the chain keeps its old top', () => {
      // Without a stage the corridor falls back to the trip's first routed day, which
      // is not the one on screen: every distance it answered with would be measured
      // against a road nobody is looking at.
      const { container } = renderTab(planner({ selectedDayId: null }))

      expect(screen.queryByText('roadtrip.poi.title')).toBeNull()
      const scroller = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement
      expect(scroller.className).toContain('pt-[calc(var(--m-safe-top,12px)+102px)]')
    })
  })

  describe('other ways of driving a leg', () => {
    const askButtons = () => screen.queryAllByRole('button', { name: 'roadtrip.alt.ask' })

    /** The planner with a picker open on one leg, still asking the router. */
    function withPicker(open: Partial<LegAlternatives>, over: Partial<TripPlanner> = {}): TripPlanner {
      const base = buildPlanner()
      return planner({
        routeAlternatives: { ...base.routeAlternatives, open: { dayId: 2, index: 0, routes: [], loading: true, error: false, ...open } },
        ...over,
      })
    }

    it('FE-MOB-RTTAB-045: offers the question on the legs the desk rail offers it on, and only to an editor', () => {
      const full = renderTab()
      // Two routed legs between real stops. The third runs into the automatic day end,
      // which is the shell's own marker and not a road anyone can reshape.
      expect(askButtons()).toHaveLength(2)
      const kyotoLeg = screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min').closest('.grid') as HTMLElement
      expect(within(kyotoLeg).getByRole('button', { name: 'roadtrip.alt.ask' })).toBeInTheDocument()
      full.unmount()

      // Routed or not, that last leg stays a line of text: the fixture leaves it unrouted
      // too, so a routed one pins that the day end, not the missing route, is the reason.
      const intoNight = renderTab(planner({
        roadtripRoutes: routes({ days: [stage({ legs: [seg('62 km', '1 h'), seg('210 km', '2 h 40 min'), seg('12 km', '10 min')] })] }),
      }))
      expect(askButtons()).toHaveLength(2)
      const nightLeg = screen.getByText('roadtrip.leg.driveText:12 km,10 min').closest('.grid') as HTMLElement
      expect(within(nightLeg).queryByRole('button')).toBeNull()
      intoNight.unmount()

      // A leg the routing has not answered for has nothing to weigh an offer against.
      const unrouted = renderTab(planner({ roadtripRoutes: routes({ days: [stage({ legs: [seg('62 km', '1 h'), undefined, undefined] })] }) }))
      expect(askButtons()).toHaveLength(1)
      // Both unanswered legs are drawn, only neither of them asks.
      expect(screen.getAllByText('roadtrip.leg.pending')).toHaveLength(2)
      unrouted.unmount()

      renderTab(planner({ can: vi.fn(() => false) }))
      expect(askButtons()).toHaveLength(0)
    })

    it('FE-MOB-RTTAB-046: asks with the card\'s day, clears the old pick and the fuel search, and goes to the map', () => {
      const p = planner()
      const { shell } = renderTab(p)

      fireEvent.click(askButtons()[0])

      expect(p.setHighlightedAlternative).toHaveBeenCalledWith(null)
      expect(p.refuel.close).toHaveBeenCalledTimes(1)
      // Day 2, the card: the leg's first stop is stored on day 1, and the planner works
      // that out from the card itself, the way the desk rail asks.
      expect(p.askRouteAlternatives).toHaveBeenCalledWith(2, 0)
      expect(p.askRouteAlternatives).not.toHaveBeenCalledWith(1, expect.anything())
      expect(shell.toggleRtView).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-RTTAB-047: the leg with the picker open shows pressed, and tapping it goes back to the answer without asking again', () => {
      const p = withPicker({ index: 0 })
      const { shell } = renderTab(p)

      const [open, other] = askButtons()
      expect(open).toHaveAttribute('aria-pressed', 'true')
      expect(other).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(open)

      // The planner toggles an open leg shut, and the traveller came back for its answer.
      expect(p.askRouteAlternatives).not.toHaveBeenCalled()
      expect(p.routeAlternatives.close).not.toHaveBeenCalled()
      expect(shell.toggleRtView).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-RTTAB-048: on the map the picker stands over the dock and the search bar steps away', () => {
      const shell = buildShell({ rtView: 'map' })
      const open = renderTab(withPicker({}), shell)

      const bar = screen.getByRole('region', { name: 'roadtrip.alt.title' })
      expect(within(bar).getByText('roadtrip.alt.loading')).toBeInTheDocument()
      // Just above the dock, in the slot the stage bar used to hold the whole time.
      expect((bar.parentElement as HTMLElement).className).toContain('bottom-[calc(var(--bottom-nav-h,84px)+4px)]')
      expect(screen.queryByText('roadtrip.poi.title')).toBeNull()
      open.unmount()

      // Closed, that slot is empty and the map has it back: the wrapper is mounted with the
      // bar rather than left lying over the map's own buttons.
      const { container } = renderTab(planner(), shell)
      expect(screen.queryByRole('region', { name: 'roadtrip.alt.title' })).toBeNull()
      expect(container.querySelector('[class*="bottom-[calc(var(--bottom-nav-h"]')).toBeNull()
      expect(screen.getByText('roadtrip.poi.title')).toBeInTheDocument()
    })

    it('FE-MOB-RTTAB-049: offline the leg buttons stay where they are and do nothing', () => {
      const base = buildPlanner()
      const p = planner({ roadtripVias: { ...base.roadtripVias, editable: false } })
      renderTab(p)

      expect(askButtons()).toHaveLength(2)
      for (const button of askButtons()) expect(button).toBeDisabled()
      fireEvent.click(askButtons()[0])
      expect(p.askRouteAlternatives).not.toHaveBeenCalled()
    })

    it('FE-MOB-RTTAB-050: a picker left open on another stage is closed, and one on this stage survives the list', () => {
      const elsewhere = withPicker({ dayId: 1 })
      const first = renderTab(elsewhere)
      expect(elsewhere.routeAlternatives.close).toHaveBeenCalledTimes(1)
      first.unmount()

      // The chain is a look back at the stage, not a way out of the question.
      const here = withPicker({ dayId: 2, index: 1 })
      renderTab(here)
      expect(here.routeAlternatives.close).not.toHaveBeenCalled()
      expect(askButtons()[1]).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('day swipe', () => {
    it('FE-MOB-RTTAB-027: steps the stage without refitting the map, and announces the day it landed on', () => {
      const p = planner()
      renderTab(p)

      mocks.swipe.onSelectDay(1)

      // The second argument is skipFit: the map stays where it is, the stage's own
      // focus points frame it.
      expect(p.handleSelectDay).toHaveBeenCalledWith(1, true)
      expect(mocks.swipe.describeDay(0, 2)).toBe('mobileTrip.dayAnnounce:1,2')
    })
  })
})
