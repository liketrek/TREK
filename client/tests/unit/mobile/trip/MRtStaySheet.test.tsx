import { beforeEach, describe, expect, it, vi } from 'vitest'
import MRtStaySheet from '../../../../src/mobile/screens/trip/roadtrip/MRtStaySheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import { useAuthStore } from '../../../../src/store/authStore'
import { usePermissionsStore } from '../../../../src/store/permissionsStore'
import { useTripStore } from '../../../../src/store/tripStore'
import type { RoadtripDay } from '@trek/shared/roadtrip'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-RTSTAY-001 to FE-MOB-RTSTAY-026
//
// The sheet renders inside the real TranslationProvider, so the copy is asserted
// in English.

/** Arrives late in the evening, so a long stay has to carry into the next day. */
const STAGE = {
  dayId: 11,
  dayNumber: 1,
  date: '2026-05-01',
  title: null,
  stops: [
    { assignmentId: 101, ownerDayId: 11, ownerIndex: 0, placeId: 201, name: 'Hamburg Hafen', lat: 53.54, lng: 9.98, time: null, dwellMinutes: 30, legMode: null, incomingLegMode: null, stopType: null },
    { assignmentId: 102, ownerDayId: 11, ownerIndex: 1, placeId: 202, name: 'Bremen Marktplatz', lat: 53.07, lng: 8.8, time: null, dwellMinutes: 30, legMode: null, incomingLegMode: null, stopType: null },
  ],
  legs: [undefined, undefined],
  legVias: [[], []],
  geometry: [],
  distance: 0,
  duration: 0,
  dayWarning: null,
  schedule: {
    entries: [
      { arrival: '09:15', departure: '09:45', anchored: false, dayOffset: 0 },
      { arrival: '22:30', departure: '23:00', anchored: false, dayOffset: 0 },
    ],
    warnings: [],
  },
  driveWarnings: [],
} as unknown as RoadtripDay

function makePlanner(overrides: Record<string, unknown> = {}) {
  return buildPlanner({
    tripId: 4,
    selectedDayId: 11,
    roadtripRoutes: { days: [STAGE] },
    setRoadtripStay: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Partial<TripPlanner>)
}

function makeShell(overrides: Record<string, unknown> = {}) {
  return buildShell({
    sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 30, name: 'Bremen Marktplatz', dayId: 11, assignmentId: 102 } },
    ...overrides,
  } as unknown as Partial<MTripShellApi>)
}

function renderSheet(plannerOverrides: Record<string, unknown> = {}, shellOverrides: Record<string, unknown> = {}) {
  const planner = makePlanner(plannerOverrides)
  const shell = makeShell(shellOverrides)
  render(<MRtStaySheet planner={planner} shell={shell} />)
  return { planner, shell }
}

const minus = () => screen.getByRole('button', { name: '5 minutes less' })
const plus = () => screen.getByRole('button', { name: '5 minutes more' })
const value = () => screen.getByText('Minutes').previousElementSibling

describe('MRtStaySheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-RTSTAY-001: stays closed while another sheet id is active', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { placeId: 202, minutes: 30 } } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-002: opens on the stay the place carries, named and scoped', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Add a stay' })).toBeInTheDocument()
    expect(screen.getByText('Bremen Marktplatz')).toBeInTheDocument()
    expect(screen.getByText('The stay belongs to the place, so it counts on every day this stop is planned.')).toBeInTheDocument()
    expect(value()).toHaveTextContent('30')
  })

  it('FE-MOB-RTSTAY-003: plus and minus move the value in five-minute steps', () => {
    renderSheet()
    fireEvent.click(plus())
    expect(value()).toHaveTextContent('35')
    fireEvent.click(plus())
    expect(value()).toHaveTextContent('40')
    fireEvent.click(minus())
    expect(value()).toHaveTextContent('35')
  })

  it('FE-MOB-RTSTAY-004: minus stops at zero instead of going negative', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 3, name: 'Bremen Marktplatz', dayId: 11, assignmentId: 102 } } })
    fireEvent.click(minus())
    expect(value()).toHaveTextContent('0')
    expect(minus()).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-005: plus stops at a full day', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 1438, name: 'Bremen Marktplatz' } } })
    fireEvent.click(plus())
    expect(value()).toHaveTextContent('1440')
    expect(plus()).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-006: a preset sets the value outright rather than adding to it', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: '2 h' }))
    expect(value()).toHaveTextContent('120')
    fireEvent.click(screen.getByRole('button', { name: '45 min' }))
    expect(value()).toHaveTextContent('45')
  })

  it('FE-MOB-RTSTAY-007: previews the new departure as arrival plus the stay', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 201, minutes: 30, name: 'Hamburg Hafen' } } })
    expect(screen.getByText('09:15')).toBeInTheDocument()
    expect(screen.getByText('09:45')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '1 h' }))
    expect(screen.getByText('10:15')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-008: carries the preview into the next day when the stay runs past midnight', () => {
    renderSheet()
    // Arrives 22:30; two hours of it land at 00:30 the following day.
    fireEvent.click(screen.getByRole('button', { name: '2 h' }))
    expect(screen.getByText('00:30')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Next day')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-009: no carry mark while the departure stays on the same day', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: '30 min' }))
    expect(screen.getByText('23:00')).toBeInTheDocument()
    expect(screen.queryByText('+1')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-010: reads the preview clocks in the 12h setting', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, time_format: '12h' } })
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 201, minutes: 30, name: 'Hamburg Hafen' } } })
    expect(screen.getByText('9:15 AM')).toBeInTheDocument()
    expect(screen.getByText('9:45 AM')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-011: drops the preview when the stop is not on the stage', () => {
    renderSheet({ selectedDayId: 99 })
    expect(screen.queryByText('Arrive')).not.toBeInTheDocument()
    expect(screen.queryByText('Leave')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-012: saving writes the place and the minutes, then hands back to the stop', async () => {
    const { planner, shell } = renderSheet()
    fireEvent.click(plus())
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.setRoadtripStay).toHaveBeenCalledWith(202, 35))
    // Addressed by day and assignment, which is how 'rtstop' locates a row. Spreading this
    // sheet's own payload left it unable to resolve anything, so it drew nothing while still
    // counting as open, and the day swipe stayed blocked behind it.
    expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 11, assignmentId: 102 })
  })

  it('FE-MOB-RTSTAY-019: with no row to go back to it closes rather than opening a sheet that resolves to nothing', async () => {
    // Every caller sends the row, but a payload without one must not leave `shell.sheet`
    // pointing at a stop sheet that cannot locate anything: it would draw nothing and still
    // count as open, and the day swipe reads exactly that to decide it is blocked.
    const { planner, shell } = renderSheet({}, {
      sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 30, name: 'Bremen Marktplatz' } },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(planner.setRoadtripStay).toHaveBeenCalledWith(202, 30))
    expect(shell.closeSheet).toHaveBeenCalled()
    expect(shell.openSheet).not.toHaveBeenCalledWith('rtstop', expect.anything())
  })

  it('FE-MOB-RTSTAY-013: clearing the stay is a save of zero, not a second write path', async () => {
    const { planner, shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'No stay' }))
    expect(planner.setRoadtripStay).not.toHaveBeenCalled()
    expect(value()).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.setRoadtripStay).toHaveBeenCalledWith(202, 0))
    expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 11, assignmentId: 102 })
  })

  it('FE-MOB-RTSTAY-014: closing without saving writes nothing and does not reopen the stop', () => {
    const { planner, shell } = renderSheet()
    fireEvent.click(plus())
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.setRoadtripStay).not.toHaveBeenCalled()
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTAY-015: a failed write puts the stored value back and says so', async () => {
    const { planner, shell } = renderSheet({
      setRoadtripStay: vi.fn(async () => { throw new Error('offline') }),
    })
    fireEvent.click(screen.getByRole('button', { name: '2 h' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Unknown error'))
    expect(value()).toHaveTextContent('30')
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTAY-016: without place_edit there is nothing to set the stay with', () => {
    renderSheet({ can: vi.fn(() => false) })
    expect(minus()).toBeDisabled()
    expect(plus()).toBeDisabled()
    expect(screen.queryByRole('button', { name: '2 h' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'No stay' })).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-017: a stop that carries no stay yet opens on zero', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 202, name: 'Bremen Marktplatz' } } })
    expect(value()).toHaveTextContent('0')
    expect(minus()).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-018: a place the stage does not stop at gets no preview either', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 909, minutes: 30, name: 'Elsewhere' } } })
    expect(screen.getByRole('dialog', { name: 'Add a stay' })).toBeInTheDocument()
    expect(screen.queryByText('Arrive')).not.toBeInTheDocument()
  })

  describe('a stop left at a set time', () => {
    // Bremen's End is 23:45, so the stay is whatever the arrival at 22:30 leaves of it,
    // and there is nothing for the buttons to set.
    const LEAVING = {
      ...STAGE,
      stops: [STAGE.stops[0], { ...STAGE.stops[1], leaveAt: '23:45' }],
      schedule: {
        entries: [STAGE.schedule.entries[0], { arrival: '22:30', departure: '23:45', anchored: false, dayOffset: 0 }],
        warnings: [],
      },
    } as unknown as RoadtripDay
    let setAssignmentTimes: ReturnType<typeof vi.fn>

    beforeEach(() => {
      setAssignmentTimes = vi.fn(async () => undefined)
      seedStore(useAuthStore, { user: { id: 1, role: 'user' } })
      seedStore(useTripStore, {
        trip: { id: 4, user_id: 1 },
        assignments: { '11': [{ id: 102, day_id: 11, place_id: 202, order_index: 1, assignment_time: '22:00', assignment_end_time: '23:45' }] },
      })
      useTripStore.setState({ setAssignmentTimes, refreshDays: vi.fn(async () => undefined) } as never)
    })

    it('FE-MOB-RTSTAY-020: says when the drive leaves and what stay that makes, with nothing to set', () => {
      renderSheet({ roadtripRoutes: { days: [LEAVING] } })
      // Named for what it holds, as the desktop dialog is: there is no stay to add here.
      expect(screen.getByRole('dialog', { name: 'Time at this stop' })).toBeInTheDocument()
      expect(screen.getByText('Time at this stop')).toBeInTheDocument()
      expect(screen.queryByText('Add a stay')).not.toBeInTheDocument()
      expect(screen.getByText('1 h 15 min')).toBeInTheDocument()
      expect(screen.getByText('This visit has an end time, so the drive leaves at 23:45.')).toBeInTheDocument()
      expect(screen.getByText('22:30')).toBeInTheDocument()
      expect(screen.getByText('23:45')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '5 minutes more' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    })

    it('FE-MOB-RTSTAY-021: taking the end time off keeps the Start and writes through the visit', async () => {
      const { planner } = renderSheet({ roadtripRoutes: { days: [LEAVING] } })
      fireEvent.click(screen.getByRole('button', { name: 'Remove end time' }))
      await waitFor(() => expect(setAssignmentTimes).toHaveBeenCalledWith(4, 11, 102, { place_time: '22:00', end_time: null }))
      // The ordinary sheet is back, on the stay the place carries.
      await waitFor(() => expect(value()).toHaveTextContent('30'))
      expect(planner.setRoadtripStay).not.toHaveBeenCalled()
    })

    it('FE-MOB-RTSTAY-022: a traveller who may not change the day is not offered the removal', () => {
      usePermissionsStore.setState({ permissions: { day_edit: 'trip_owner' } })
      seedStore(useTripStore, { trip: { id: 4, user_id: 2 } })
      renderSheet({ roadtripRoutes: { days: [LEAVING] } })
      expect(screen.getByText('1 h 15 min')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Remove end time' })).not.toBeInTheDocument()
    })

    it('FE-MOB-RTSTAY-024: reached after the time, it says so instead of promising it', () => {
      const late = {
        ...LEAVING,
        schedule: {
          entries: [STAGE.schedule.entries[0], { arrival: '23:55', departure: '23:55', anchored: false, dayOffset: 0 }],
          warnings: [{ index: 1, code: 'missedLeave', minutes: 10 }],
        },
      } as unknown as RoadtripDay
      renderSheet({ roadtripRoutes: { days: [late] } })
      expect(screen.getByText('Arrives 10 min after the time you set to leave')).toBeInTheDocument()
      expect(screen.queryByText('This visit has an end time, so the drive leaves at 23:45.')).not.toBeInTheDocument()
      expect(screen.getAllByText('23:55')).toHaveLength(2)
    })

    it('FE-MOB-RTSTAY-025: travel hours over before the time say so, with no departure beside it', () => {
      const closed = {
        ...LEAVING,
        schedule: {
          entries: [STAGE.schedule.entries[0], { arrival: '17:30', departure: '18:00', anchored: false, dayOffset: 0 }],
          warnings: [],
        },
      } as unknown as RoadtripDay
      renderSheet({ roadtripRoutes: { days: [closed] } })
      expect(screen.getByText('The travel day ends before 23:45, so the drive goes on the next morning.')).toBeInTheDocument()
      expect(screen.queryByText('18:00')).not.toBeInTheDocument()
    })

    it('FE-MOB-RTSTAY-023: the close in the header writes nothing', () => {
      const { shell } = renderSheet({ roadtripRoutes: { days: [LEAVING] } })
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(shell.closeSheet).toHaveBeenCalledTimes(1)
      expect(setAssignmentTimes).not.toHaveBeenCalled()
    })
  })
})

describe('MRtStaySheet and a booked night at the edge of the stage', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-RTSTAY-026: the arrival is the stop of the place, not the hotel the day sets out from there', () => {
    // The morning's hotel stands on Bremen's place at the head of the card, with a clock of
    // its own. Found by the place, it put 07:10 in the preview for a stop reached at 22:30.
    const hotel = {
      ...STAGE.stops[1],
      assignmentId: -6_000_000_022,
      ownerIndex: 0,
      stopType: 'hotel',
      bookend: { phase: 'morning', accommodationId: 5, reservationId: null, checkingOut: false, checkingIn: false, checkOut: null },
    }
    const withHotel = {
      ...STAGE,
      stops: [hotel, ...STAGE.stops],
      schedule: { entries: [{ arrival: '07:10', departure: '07:10', anchored: false, dayOffset: 0 }, ...STAGE.schedule.entries], warnings: [] },
    } as unknown as RoadtripDay
    renderSheet({ roadtripRoutes: { days: [withHotel] } }, { sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 30, name: 'Bremen Marktplatz' } } })
    expect(screen.getByText('22:30')).toBeInTheDocument()
    expect(screen.queryByText('07:10')).not.toBeInTheDocument()
  })
})
