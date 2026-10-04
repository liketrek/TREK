import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MTransportSheet from '../../../../src/mobile/screens/trip/sheets/MTransportSheet'
import { openFile } from '../../../../src/utils/fileDownload'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import type { Reservation, TripFile } from '../../../../src/types'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-TRSH-001 to FE-MOB-TRSH-030

vi.mock('../../../../src/utils/fileDownload', () => ({ openFile: vi.fn() }))

const FLIGHT = {
  id: 7,
  trip_id: 1,
  type: 'flight',
  title: 'FRA → HND',
  status: 'pending',
  day_id: 3,
  reservation_time: '2026-05-01T10:20',
  reservation_end_time: '2026-05-02T06:45',
  confirmation_number: 'QW7788',
  notes: 'Window seat requested',
  metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH 716', seat: '31A' }),
  endpoints: [
    { id: 1, reservation_id: 7, role: 'from', sequence: 0, name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin', local_date: '2026-05-01', local_time: '10:20' },
    { id: 2, reservation_id: 7, role: 'to', sequence: 1, name: 'Tokyo (HND)', code: 'HND', lat: 35.55, lng: 139.78, timezone: 'Asia/Tokyo', local_date: '2026-05-02', local_time: '06:45' },
  ],
} as unknown as Reservation

function makePlanner(overrides: Record<string, unknown> = {}) {
  return buildPlanner({
    reservations: [FLIGHT],
    files: [],
    ...overrides,
  } as unknown as Parameters<typeof buildPlanner>[0])
}

function makeShell(overrides: Record<string, unknown> = {}) {
  return buildShell({ sheet: { id: 'transport', payload: { reservationId: 7 } }, ...overrides } as unknown as Parameters<typeof buildShell>[0])
}

describe('MTransportSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('FE-MOB-TRSH-001: renders nothing when the payload points at an unknown reservation', () => {
    render(<MTransportSheet planner={makePlanner({ reservations: [] })} shell={makeShell()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRSH-002: stays closed while another sheet id is active', () => {
    render(<MTransportSheet planner={makePlanner()} shell={makeShell({ sheet: { id: 'mehr', payload: { reservationId: 7 } } })} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRSH-003: shows title, airline meta and the endpoint route in the subline', () => {
    render(<MTransportSheet planner={makePlanner()} shell={makeShell()} />)
    expect(screen.getByRole('dialog', { name: 'FRA → HND' })).toBeInTheDocument()
    expect(screen.getByText('Lufthansa · LH 716 · Frankfurt (FRA) → Tokyo (HND)')).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-004: falls back to the formatted date when the booking has no endpoints', () => {
    const res = { ...FLIGHT, endpoints: [], metadata: null } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getByText('Fri, May 1')).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-005: shows departure and arrival stat boxes labelled with the endpoint names', () => {
    render(<MTransportSheet planner={makePlanner()} shell={makeShell()} />)
    expect(screen.getByText('10:20')).toBeInTheDocument()
    expect(screen.getByText('06:45')).toBeInTheDocument()
    expect(screen.getByText('Frankfurt (FRA)')).toBeInTheDocument()
    expect(screen.getByText('Tokyo (HND)')).toBeInTheDocument()
    expect(screen.getByText('31A')).toBeInTheDocument()
    expect(screen.getByText('Seat')).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-006: renders the ISO reservation time in the 12h format and the generic time label', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, time_format: '12h' } })
    const res = {
      ...FLIGHT,
      endpoints: [],
      reservation_time: '2026-05-01T15:30:00Z',
      reservation_end_time: null,
      metadata: null,
    } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getByText(/PM$/)).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-007: shows the train number and platform of a train booking', () => {
    const res = {
      ...FLIGHT, type: 'train', title: 'ICE to Berlin',
      metadata: { train_number: 'ICE 599', platform: '7', seat: '12C' },
    } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getByText(/ICE 599/)).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Platform')).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-008: survives unparsable metadata without meta rows', () => {
    const res = { ...FLIGHT, metadata: '{not json', endpoints: [] } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getByRole('dialog', { name: 'FRA → HND' })).toBeInTheDocument()
    expect(screen.queryByText('Seat')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRSH-009: renders the transit itinerary with line, walk, duration and stop counts', () => {
    const res = {
      ...FLIGHT, type: 'transit', title: 'To the museum', endpoints: [], metadata: {
        transit: {
          legs: [
            { mode: 'WALK', duration: 240, to: { name: 'Karlsplatz' } },
            {
              mode: 'SUBWAY', line: 'U4', line_color: '#00a94f', line_text_color: '#fff', duration: 600, stops: 4,
              from: { name: 'Karlsplatz', time: '09:10' }, to: { name: 'Schwedenplatz', time: '09:20' },
            },
            { mode: 'BUS', line: null, duration: 0, from: { name: 'Schwedenplatz', time: null }, to: { name: 'Prater' } },
          ],
        },
      },
    } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getByText('Walk to Karlsplatz')).toBeInTheDocument()
    expect(screen.getByText('4 min')).toBeInTheDocument()
    expect(screen.getByText('U4')).toBeInTheDocument()
    expect(screen.getByText('09:10 – 09:20 · 10 min · 4 stops')).toBeInTheDocument()
    // A leg without a line falls back to its mode and renders no meta line.
    expect(screen.getByText('BUS')).toBeInTheDocument()
    expect(screen.getByText('Prater')).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-010: shows the pending status and the booking code unblurred by default', () => {
    render(<MTransportSheet planner={makePlanner()} shell={makeShell()} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    const code = screen.getByText('#QW7788')
    expect(code.className).not.toContain('blur')
  })

  it('FE-MOB-TRSH-011: blurs the booking code until it is tapped', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, blur_booking_codes: true } })
    const res = { ...FLIGHT, status: 'confirmed' } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    const code = screen.getByText('#QW7788')
    expect(code.className).toContain('blur-[4px]')
    fireEvent.click(code)
    expect(screen.getByText('#QW7788').className).not.toContain('blur-[4px]')
  })

  it('FE-MOB-TRSH-012: re-blurs the code once the sheet is closed again', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, blur_booking_codes: true } })
    const planner = makePlanner()
    const { rerender } = render(<MTransportSheet planner={planner} shell={makeShell()} />)
    fireEvent.click(screen.getByText('#QW7788'))
    expect(screen.getByText('#QW7788').className).not.toContain('blur-[4px]')
    rerender(<MTransportSheet planner={planner} shell={makeShell({ sheet: null })} />)
    rerender(<MTransportSheet planner={planner} shell={makeShell()} />)
    expect(screen.getByText('#QW7788').className).toContain('blur-[4px]')
  })

  it('FE-MOB-TRSH-013: renders the notes block only when the booking has notes', () => {
    render(<MTransportSheet planner={makePlanner()} shell={makeShell()} />)
    expect(screen.getByText('Window seat requested')).toBeInTheDocument()

    const res = { ...FLIGHT, notes: null } as unknown as Reservation
    render(<MTransportSheet planner={makePlanner({ reservations: [res] })} shell={makeShell()} />)
    expect(screen.getAllByText('Notes')).toHaveLength(1)
  })

  it('FE-MOB-TRSH-014: drawing the route closes the sheet and jumps to the plan map', () => {
    const planner = makePlanner()
    const shell = makeShell({ trTab: 'transports', view: 'plan' })
    render(<MTransportSheet planner={planner} shell={shell} />)
    const btn = screen.getByRole('button', { name: 'On map' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(planner.toggleConnection).toHaveBeenCalledWith(7)
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(shell.setTrTab).toHaveBeenCalledWith('plan')
    expect(shell.toggleView).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TRSH-015: hides an already drawn route without navigating away', () => {
    const planner = makePlanner({ visibleConnections: [7] })
    const shell = makeShell({ trTab: 'plan', view: 'map' })
    render(<MTransportSheet planner={planner} shell={shell} />)
    const btn = screen.getByRole('button', { name: 'On map' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(btn)
    expect(planner.toggleConnection).toHaveBeenCalledWith(7)
    expect(shell.closeSheet).not.toHaveBeenCalled()
    expect(shell.setTrTab).not.toHaveBeenCalled()
    expect(shell.toggleView).not.toHaveBeenCalled()
  })

  it('FE-MOB-TRSH-016: lists the attached files and opens one on tap', () => {
    const files = [
      { id: 1, reservation_id: 7, original_name: 'boardingpass.pdf', url: '/api/trips/1/files/1/download' },
      { id: 2, reservation_id: null, linked_reservation_ids: [7], original_name: 'invoice.pdf', url: '/api/trips/1/files/2/download' },
      { id: 3, reservation_id: 7, deleted_at: '2026-04-01', original_name: 'trashed.pdf', url: '/x' },
      { id: 4, reservation_id: 99, original_name: 'other.pdf', url: '/y' },
    ] as unknown as TripFile[]
    render(<MTransportSheet planner={makePlanner({ files })} shell={makeShell()} />)
    expect(screen.getByText('boardingpass.pdf')).toBeInTheDocument()
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument()
    expect(screen.queryByText('trashed.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('other.pdf')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('boardingpass.pdf'))
    expect(openFile).toHaveBeenCalledWith('/api/trips/1/files/1/download', 'boardingpass.pdf')
  })

  it('FE-MOB-TRSH-017: opens the transport editor for the booking', () => {
    const planner = makePlanner()
    const shell = makeShell()
    render(<MTransportSheet planner={planner} shell={shell} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(planner.setEditingTransport).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(3)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TRSH-018: passes a null day id to the editor when the booking has none', () => {
    const res = { ...FLIGHT, day_id: null } as unknown as Reservation
    const planner = makePlanner({ reservations: [res] })
    render(<MTransportSheet planner={planner} shell={makeShell()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-TRSH-019: deletes the booking and closes the sheet', () => {
    const planner = makePlanner()
    const shell = makeShell()
    render(<MTransportSheet planner={planner} shell={shell} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(planner.handleDeleteReservation).toHaveBeenCalledWith(7)
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TRSH-020: hides edit and delete without the day_edit permission but keeps the map toggle', () => {
    const planner = makePlanner({ can: vi.fn(() => false) })
    render(<MTransportSheet planner={planner} shell={makeShell()} />)
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'On map' })).toBeInTheDocument()
  })

  it('FE-MOB-TRSH-021: keeps the last booking on screen while the sheet animates out', () => {
    const planner = makePlanner()
    const shell = makeShell()
    const { rerender } = render(<MTransportSheet planner={planner} shell={shell} />)
    expect(screen.getByText('FRA → HND')).toBeInTheDocument()
    rerender(<MTransportSheet planner={makePlanner({ reservations: [] })} shell={shell} />)
    expect(screen.getByText('FRA → HND')).toBeInTheDocument()
  })

  const layover = (): Reservation => ({
    ...FLIGHT,
    metadata: JSON.stringify({
      airline: 'Lufthansa', flight_number: 'LH 716',
      legs: [
        { from: 'FRA', to: 'BER', airline: 'Lufthansa', flight_number: 'LH 716', confirmation_number: 'ABC123' },
        { from: 'BER', to: 'HND', airline: 'ANA', flight_number: 'NH 204' },
      ],
    }),
  } as unknown as Reservation)

  it('FE-MOB-TRSH-023: lists the booking code of every segment that has its own (#1943)', () => {
    render(<MTransportSheet planner={makePlanner({ reservations: [layover()] })} shell={makeShell()} />)
    // The booking's own reference keeps its row above.
    expect(screen.getByText('#QW7788')).toBeInTheDocument()
    expect(screen.getByText('FRA → BER')).toBeInTheDocument()
    expect(screen.getByText('#ABC123')).toBeInTheDocument()
    // A segment without one contributes no row.
    expect(screen.queryByText('BER → HND')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRSH-024: a segment code is blurred until it is tapped', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, blur_booking_codes: true } })
    render(<MTransportSheet planner={makePlanner({ reservations: [layover()] })} shell={makeShell()} />)
    const code = screen.getByText('#ABC123')
    expect(code.className).toContain('blur-[4px]')
    fireEvent.click(code)
    expect(screen.getByText('#ABC123').className).not.toContain('blur-[4px]')
  })

  it('FE-MOB-TRSH-022: closes from the header button', () => {
    const shell = makeShell()
    render(<MTransportSheet planner={makePlanner()} shell={shell} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
  })

  /**
   * #2456: the phone map is one day's picture, so "On map" has to land on a day the
   * booking runs on. The Transports tab lists the whole trip, and the day the chips hold
   * can be any other day: switched on from there, the route went to a map that frames,
   * and (once booking routes follow the day) draws, a different day.
   *
   * The booking's day goes in after the view switch: entering the map re-selects the day
   * the shell still holds (MTripShell.toggleView), so it has to come last to win.
   */
  describe('On map lands on a day the booking runs on (#2456)', () => {
    const DAYS = [
      { id: 3, trip_id: 1, day_number: 1, date: '2026-05-01' },
      { id: 4, trip_id: 1, day_number: 2, date: '2026-05-02' },
      { id: 5, trip_id: 1, day_number: 3, date: '2026-05-03' },
    ]

    it("FE-MOB-TRSH-025: from another day, switches the map to the booking's own day", () => {
      const planner = makePlanner({ days: DAYS, selectedDayId: 5 })
      const shell = makeShell({ trTab: 'transports', view: 'plan' })
      render(<MTransportSheet planner={planner} shell={shell} />)

      fireEvent.click(screen.getByRole('button', { name: 'On map' }))

      expect(planner.toggleConnection).toHaveBeenCalledWith(7)
      expect(planner.handleSelectDay).toHaveBeenCalledWith(3, false)
      expect(planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([3]))
      const viewSwitch = vi.mocked(shell.toggleView).mock.invocationCallOrder[0]
      const daySwitches = vi.mocked(planner.handleSelectDay).mock.invocationCallOrder
      expect(daySwitches[daySwitches.length - 1]).toBeGreaterThan(viewSwitch)
    })

    it("FE-MOB-TRSH-026: with the map already in front, still moves it to the booking's day", () => {
      const planner = makePlanner({ days: DAYS, selectedDayId: 5 })
      const shell = makeShell({ trTab: 'transports', view: 'map' })
      render(<MTransportSheet planner={planner} shell={shell} />)

      fireEvent.click(screen.getByRole('button', { name: 'On map' }))

      expect(shell.toggleView).not.toHaveBeenCalled()
      expect(planner.handleSelectDay).toHaveBeenCalledWith(3, false)
      expect(planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([3]))
    })

    it("FE-MOB-TRSH-027: keeps the selected day while it is one of the booking's days", () => {
      // Overnight: departs on day 3, lands on day 4, which the chips hold.
      const overnight = { ...FLIGHT, end_day_id: 4 } as unknown as Reservation
      const planner = makePlanner({ days: DAYS, selectedDayId: 4, reservations: [overnight] })
      render(<MTransportSheet planner={planner} shell={makeShell({ trTab: 'plan', view: 'plan' })} />)

      fireEvent.click(screen.getByRole('button', { name: 'On map' }))

      expect(planner.toggleConnection).toHaveBeenCalledWith(7)
      expect(planner.handleSelectDay).not.toHaveBeenCalled()
      expect(planner.setExpandedDayIds).not.toHaveBeenCalled()
    })

    it('FE-MOB-TRSH-028: leaves the all days view and a booking bound to no day alone', () => {
      const unbound = { ...FLIGHT, day_id: null, end_day_id: null } as unknown as Reservation
      const allDays = makePlanner({ days: DAYS, selectedDayId: null })
      const { unmount } = render(<MTransportSheet planner={allDays} shell={makeShell({ trTab: 'transports', view: 'map' })} />)
      fireEvent.click(screen.getByRole('button', { name: 'On map' }))
      expect(allDays.handleSelectDay).not.toHaveBeenCalled()
      unmount()

      const noDay = makePlanner({ days: DAYS, selectedDayId: 5, reservations: [unbound] })
      render(<MTransportSheet planner={noDay} shell={makeShell({ trTab: 'transports', view: 'plan' })} />)
      fireEvent.click(screen.getByRole('button', { name: 'On map' }))
      expect(noDay.toggleConnection).toHaveBeenCalledWith(7)
      expect(noDay.handleSelectDay).not.toHaveBeenCalled()
    })

    // A booking already switched on is still left off another day's map, which is also
    // where "Always show booking routes" leaves every booking. The button follows the map
    // there, and a tap takes it to the booking rather than switching the route off unseen.
    it('FE-MOB-TRSH-029: a booking switched on but not drawn on this day reads off and a tap moves to its day', () => {
      const planner = makePlanner({ days: DAYS, selectedDayId: 5, visibleConnections: [7] })
      const shell = makeShell({ trTab: 'transports', view: 'plan' })
      render(<MTransportSheet planner={planner} shell={shell} />)

      const btn = screen.getByRole('button', { name: 'On map' })
      expect(btn).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(btn)

      expect(planner.toggleConnection).not.toHaveBeenCalled()
      expect(shell.closeSheet).toHaveBeenCalledTimes(1)
      expect(shell.setTrTab).toHaveBeenCalledWith('plan')
      expect(planner.handleSelectDay).toHaveBeenCalledWith(3, false)
      expect(planner.setExpandedDayIds).toHaveBeenCalledWith(new Set([3]))
    })

    it("FE-MOB-TRSH-030: on one of the booking's days a switched-on route reads on and a tap hides it in place", () => {
      const overnight = { ...FLIGHT, end_day_id: 4 } as unknown as Reservation
      const planner = makePlanner({ days: DAYS, selectedDayId: 4, reservations: [overnight], visibleConnections: [7] })
      const shell = makeShell({ trTab: 'plan', view: 'map' })
      render(<MTransportSheet planner={planner} shell={shell} />)

      const btn = screen.getByRole('button', { name: 'On map' })
      expect(btn).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(btn)

      expect(planner.toggleConnection).toHaveBeenCalledWith(7)
      expect(shell.closeSheet).not.toHaveBeenCalled()
      expect(planner.handleSelectDay).not.toHaveBeenCalled()
    })
  })
})
