import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '../../../helpers/render'
import {
  RtAutoRow, RtBookendRow, RtBookingChips, RtDryRow, RtLegRow, RtRideRow, RtSpillRow, RtStopRow, type RowChrome,
} from '../../../../src/mobile/screens/trip/roadtrip/MRoadtripRows'
import type { BookendReading, RoadtripRow, StopRow } from '../../../../src/components/Roadtrip/roadtripRowModel'
import type { CarrierTerminal, RouteSegment, ScheduleWarning } from '@trek/shared/roadtrip'
import type { Reservation, TranslationFn } from '../../../../src/types'
import type { RefuelSearch } from '../../../../src/components/Roadtrip/useRefuelSearch'
import type { RefuelCandidate } from '../../../../src/components/Roadtrip/refuelSuggestion'

// FE-MOB-RTROW-001 to FE-MOB-RTROW-065

// Same echo strategy as tests/helpers/mobileTrip: assertions stay on keys, not copy.
const t: TranslationFn = (key, params) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

const chrome: RowChrome = { t, unit: 'metric', is12h: false }

function stopRow(over: Partial<StopRow> = {}): StopRow {
  return {
    kind: 'stop',
    stop: {
      assignmentId: 501, ownerDayId: 2, ownerIndex: 0, placeId: 101,
      name: 'Kyoto Station', lat: 34.98, lng: 135.75,
      time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    },
    number: 2,
    service: false,
    entry: undefined,
    time: '12:40',
    pinned: false,
    warning: null,
    dwellMinutes: null,
    offRoadMeters: null,
    ...over,
  } as StopRow
}

const SEG: RouteSegment = {
  mid: [35.4, 138.6], from: [35.7, 139.8], to: [34.98, 135.75],
  distance: 210_000, duration: 9_600,
  // The two differ on purpose: durationText is the routed time, drivingText the
  // fallback the older segments carry.
  walkingText: '42 h', drivingText: '2 h 55 min', distanceText: '210 km', durationText: '2 h 40 min',
}

describe('RtStopRow', () => {
  it('FE-MOB-RTROW-065: the own stop of a stay on its check-in day carries the check-in hour, other stops do not', () => {
    const hotel = { ...stopRow().stop, name: 'Gasthof Post', stopType: 'hotel', night: true, checkInTime: '15:00' }
    const first = render(<RtStopRow row={stopRow({ stop: hotel, service: true, number: null })} chrome={chrome} onOpen={vi.fn()} />)
    expect(screen.getByText('roadtrip.bookend.checkIn').parentElement).toHaveTextContent('15:00')
    first.unmount()

    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)
    expect(screen.queryByText('roadtrip.bookend.checkIn')).toBeNull()
  })

  it('FE-MOB-RTROW-001: gives a destination its number and no kind icon', () => {
    const { container } = render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(container.querySelector('.lucide-fuel')).toBeNull()
  })

  it('FE-MOB-RTROW-002: gives a service stop its kind symbol in the kind colour instead of a number', () => {
    const { container } = render(
      <RtStopRow
        row={stopRow({
          number: null,
          service: true,
          stop: { ...stopRow().stop, name: 'Shell Ebina', stopType: 'fuel' },
        })}
        chrome={chrome}
        onOpen={vi.fn()}
      />,
    )

    const disc = container.querySelector('.lucide-fuel')?.parentElement as HTMLElement
    expect(disc).toBeTruthy()
    // #E8590C is SERVICE_COLORS.fuel, the colour the stop wears on the map too.
    expect(disc).toHaveStyle({ background: '#E8590C' })
    expect(screen.queryByText('2')).toBeNull()
  })

  it('FE-MOB-RTROW-003: keeps at most two marks, a dwell and a warning push the road distance out', () => {
    const { container } = render(
      <RtStopRow
        row={stopRow({
          dwellMinutes: 45,
          warning: { index: 1, code: 'late', minutes: 25 },
          offRoadMeters: 120,
        })}
        chrome={chrome}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('+25 min')).toBeInTheDocument()
    expect(screen.queryByText('120 m')).toBeNull()
    expect(container.querySelector('.lucide-footprints')).toBeNull()
  })

  it('FE-MOB-RTROW-004: shows the road distance only when the row has neither dwell nor warning', () => {
    render(<RtStopRow row={stopRow({ offRoadMeters: 120 })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('120 m')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-005: gives a pinned time the pin and the full colour', () => {
    render(<RtStopRow row={stopRow({ pinned: true })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByLabelText('roadtrip.stop.pinned')).toBeInTheDocument()
    expect(screen.getByText('12:40').className).toContain('text-m-ink')
  })

  it('FE-MOB-RTROW-006: leaves a computed time unpinned and muted', () => {
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.queryByLabelText('roadtrip.stop.pinned')).toBeNull()
    const time = screen.getByText('12:40')
    expect(time.className).toContain('text-m-faint')
    expect(time.className).not.toContain('text-m-ink')
  })

  it('FE-MOB-RTROW-007: prints no clock for a stop the schedule could not time', () => {
    render(<RtStopRow row={stopRow({ time: null })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.queryByText('12:40')).toBeNull()
    expect(screen.getByText('Kyoto Station')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-008: opens the stop on a tap and on the keyboard', () => {
    const onOpen = vi.fn()
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={onOpen} />)

    const row = screen.getByRole('button')
    fireEvent.click(row)
    expect(onOpen).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(row, { key: ' ' })
    expect(onOpen).toHaveBeenCalledTimes(3)
  })

  it('FE-MOB-RTROW-009: ignores a key press that came from something inside the row', () => {
    const onOpen = vi.fn()
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={onOpen} />)

    fireEvent.keyDown(screen.getByText('Kyoto Station'), { key: 'Enter' })

    expect(onOpen).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTROW-010: writes a late warning as the minutes it costs', () => {
    const warning: ScheduleWarning = { index: 1, code: 'late', minutes: 25 }
    const { container } = render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('+25 min')).toBeInTheDocument()
    expect(container.querySelector('.lucide-alert-triangle')).not.toBeNull()
  })

  it('FE-MOB-RTROW-011: writes a range warning as the distance driven since the last fill', () => {
    const warning: ScheduleWarning = { index: 1, code: 'range', sinceKm: 520 }
    const { container } = render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('520 km')).toBeInTheDocument()
    expect(container.querySelector('.lucide-fuel')).not.toBeNull()
  })

  it('FE-MOB-RTROW-012: writes a leg warning as the time it runs over', () => {
    const warning: ScheduleWarning = { index: 1, code: 'leg', overMinutes: 35 }
    render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('35 min')).toBeInTheDocument()
  })

  // The disc as the control that switches a stop between a destination and a pause, the
  // way the desktop rail's own disc does.
  it('FE-MOB-RTROW-041: the disc is a button that asks for the kind, and the tap stops there', () => {
    const onOpen = vi.fn()
    const onPickKind = vi.fn()
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={onOpen} onPickKind={onPickKind} />)

    const disc = screen.getByRole('button', { name: 'roadtrip.stop.makeService' })
    expect(disc).toHaveTextContent('2')

    fireEvent.click(disc)

    expect(onPickKind).toHaveBeenCalledTimes(1)
    // The row opens the stop; a tap meant for the disc must not do both.
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTROW-042: the disc of a service stop asks the same question, named for what it already is', () => {
    const onPickKind = vi.fn()
    render(
      <RtStopRow
        row={stopRow({ number: null, service: true, stop: { ...stopRow().stop, stopType: 'fuel' } })}
        chrome={chrome}
        onOpen={vi.fn()}
        onPickKind={onPickKind}
      />,
    )

    const disc = screen.getByRole('button', { name: 'roadtrip.stop.kind' })
    // Still the kind's own symbol: the control is its own preview of what it changes.
    expect(disc.querySelector('.lucide-fuel')).not.toBeNull()

    fireEvent.click(disc)
    expect(onPickKind).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-043: without the handler the disc is not a button at all', () => {
    // A traveller who may not edit places gets no handler, and a disabled-looking control
    // for something they cannot do is worse than no control.
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'roadtrip.stop.makeService' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'roadtrip.stop.kind' })).toBeNull()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-047: a clock follows the reader twelve hour setting', () => {
    // The model hands clocks over as HH:MM, which is the shape the schedule computes in.
    // Printing that straight to the screen ignored the setting the desktop rail, the day
    // timeline and this tab's own sheets all honour.
    render(<RtStopRow row={stopRow({ time: '14:05' })} chrome={{ ...chrome, is12h: true }} onOpen={vi.fn()} />)

    expect(screen.getByText('2:05 PM')).toBeInTheDocument()
    expect(screen.queryByText('14:05')).toBeNull()
  })

  it('FE-MOB-RTROW-048: on a twenty four hour clock it stays exactly as the model wrote it', () => {
    render(<RtStopRow row={stopRow({ time: '14:05' })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('14:05')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-064: lateness reads in hours and minutes, and leaving after the time set is marked the same way', () => {
    const late = render(<RtStopRow row={stopRow({ warning: { index: 1, code: 'late', minutes: 579 } })} chrome={chrome} onOpen={vi.fn()} />)
    expect(screen.getByText('+9 h 39 min')).toBeInTheDocument()
    late.unmount()

    const { container } = render(<RtStopRow row={stopRow({ warning: { index: 1, code: 'missedLeave', minutes: 20 } })} chrome={chrome} onOpen={vi.fn()} />)
    expect(screen.getByText('+20 min')).toBeInTheDocument()
    expect(container.querySelector('.lucide-alert-triangle')).not.toBeNull()
    // It used to fall through to the night's word.
    expect(screen.queryByText('roadtrip.warn.overnight')).toBeNull()
  })

  it('FE-MOB-RTROW-013: writes an overnight warning as a word, since it has no figure', () => {
    const warning: ScheduleWarning = { index: 1, code: 'overnight' }
    const { container } = render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('roadtrip.warn.overnight')).toBeInTheDocument()
    expect(container.querySelector('.lucide-moon')).not.toBeNull()
  })

  it('FE-MOB-RTROW-050: a hire desk is a row on the road: the booking\'s clock under it, no number, and a disc nobody can turn into a pump', () => {
    const onPickKind = vi.fn()
    const desk = stopRow({
      number: null,
      time: '09:00',
      stop: { ...stopRow().stop, assignmentId: -3000000180, placeId: -90, name: 'Sixt Hauptbahnhof', carrier: carrier('pickup') },
    })
    const { container } = render(<RtStopRow row={desk} chrome={chrome} onOpen={vi.fn()} onPickKind={onPickKind} />)

    expect(screen.getByText('Sixt Hauptbahnhof')).toBeInTheDocument()
    // Which desk it is under the name, and the booking's clock once, on the right.
    expect(screen.getByText('reservations.span.pickup')).toBeInTheDocument()
    expect(screen.getAllByText('09:00')).toHaveLength(1)
    expect(screen.getByText('roadtrip.ride.pickup:09:00')).toHaveClass('sr-only')
    expect(screen.queryByText('2')).toBeNull()
    // The booking's own icon on the disc, and the disc is not a control even for an
    // editor: nobody turns a rental desk into a petrol station.
    expect(container.querySelector('.lucide-car')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'roadtrip.stop.makeService' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'roadtrip.stop.kind' })).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})

/** One end of a flight, or one desk of a hire car, as the routing round seams it in. */
function carrier(role: CarrierTerminal['role'], over: Partial<CarrierTerminal> = {}): CarrierTerminal {
  const car = role === 'pickup' || role === 'return'
  return {
    reservationId: car ? 90 : 70,
    type: car ? 'car' : 'flight',
    role,
    title: car ? 'Sixt Hamburg' : 'LH 2020',
    code: role === 'departure' ? 'HAM' : role === 'arrival' ? 'MUC' : null,
    at: { departure: '13:20', arrival: '14:30', pickup: '09:00', return: '11:30' }[role],
    ...over,
  }
}

const FLIGHT_SEG = { ...SEG, distance: 0, duration: 4200, distanceText: '', durationText: '1 h 10 min' }

/**
 * One end of LH 2020 as its row carries it: the departure pinned an hour ahead of the
 * timetable for the check-in, and `late` minutes past that pin when the drive gets there late.
 */
const rideEnd = (role: 'departure' | 'arrival', late?: number): StopRow => stopRow({
  number: null,
  time: role === 'departure' ? '12:20' : '14:30',
  pinned: true,
  warning: late ? { index: 1, code: 'late', minutes: late } : null,
  stop: {
    ...stopRow().stop,
    assignmentId: role === 'departure' ? -3000000140 : -3000000141,
    placeId: -70,
    name: role === 'departure' ? 'Hamburg Airport' : 'Munich Airport',
    time: role === 'departure' ? '12:20' : '14:30',
    carrier: carrier(role),
  },
})

function rideRow(over: Partial<Extract<RoadtripRow, { kind: 'ride' }>> = {}, late?: number): Extract<RoadtripRow, { kind: 'ride' }> {
  return { kind: 'ride', index: 1, carrier: carrier('departure'), seg: FLIGHT_SEG, departure: rideEnd('departure', late), arrival: rideEnd('arrival'), ...over }
}

describe('RtRideRow', () => {
  it('FE-MOB-RTROW-051: a ride is one block in four lines: the booking and its minutes, both codes with their timetable, the places, the check-in', () => {
    render(<RtRideRow row={rideRow()} chrome={chrome} />)

    expect(screen.getByText('LH 2020')).toBeInTheDocument()
    expect(screen.getByText('1 h 10 min')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).toBeNull()
    // Each code and each timetable clock once, the words for the clocks for a screen reader only.
    expect(screen.getAllByText('HAM')).toHaveLength(1)
    expect(screen.getAllByText('MUC')).toHaveLength(1)
    expect(screen.getAllByText('13:20')).toHaveLength(1)
    expect(screen.getAllByText('14:30')).toHaveLength(1)
    expect(screen.getByText('roadtrip.ride.departureFlight:13:20')).toHaveClass('sr-only')
    expect(screen.getByText('roadtrip.ride.arrival:14:30')).toHaveClass('sr-only')
    expect(screen.getByText('Hamburg Airport')).toBeInTheDocument()
    expect(screen.getByText('Munich Airport')).toBeInTheDocument()
    // The check-in, with its hour in the pill inside it and its sentence for a screen reader.
    const checkIn = screen.getByRole('img', { name: 'roadtrip.ride.hintFlight:LH 2020,13:20,12:20' })
    expect(checkIn).toHaveTextContent('roadtrip.ride.checkIn')
    expect(within(checkIn).getByText('12:20')).toBeInTheDocument()
    // The terminals take no number: Hamburg is 1 and Munich is 2 either side of them.
    expect(screen.queryByText('2')).toBeNull()
  })

  it('FE-MOB-RTROW-052: the block is one tap target that opens the booking, and plain without a handler', () => {
    const onOpen = vi.fn()
    const opens = render(<RtRideRow row={rideRow()} chrome={chrome} onOpen={onOpen} />)

    // One control for the whole ride, not one per terminal.
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByText('Hamburg Airport'))
    fireEvent.click(screen.getByText('LH 2020'))
    expect(onOpen).toHaveBeenCalledTimes(2)
    opens.unmount()

    render(<RtRideRow row={rideRow()} chrome={chrome} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Munich Airport')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-053: a ride the timetable gives no minutes for is still the booking, and its clocks follow the twelve hour setting', () => {
    render(<RtRideRow row={rideRow({ seg: undefined })} chrome={{ ...chrome, is12h: true }} />)

    expect(screen.getByText('LH 2020')).toBeInTheDocument()
    expect(screen.queryByText('1 h 10 min')).toBeNull()
    expect(screen.getByText('1:20 PM')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.ride.departureFlight:1:20 PM')).toBeInTheDocument()
    expect(screen.getByText('12:20 PM')).toBeInTheDocument()
    expect(screen.queryByText('13:20')).toBeNull()
  })

  it('FE-MOB-RTROW-060: a flight the drive reaches after take-off is missed, says when the drive gets there, and edges the block', () => {
    render(<RtRideRow row={rideRow({}, 579)} chrome={chrome} onOpen={vi.fn()} />)

    const mark = screen.getByRole('img', { name: 'roadtrip.ride.lateHintFlight:LH 2020,13:20,12:20,Hamburg Airport,21:59' })
    expect(mark).toHaveTextContent('roadtrip.ride.missed')
    expect(within(mark).getByText('roadtrip.ride.reachedAt:21:59')).toBeInTheDocument()
    expect(mark.querySelector('.lucide-alert-triangle')).not.toBeNull()
    expect(screen.getByRole('button').className).toContain('border-[color:var(--m-st-pending)]')
  })

  it('FE-MOB-RTROW-061: late for the check-in but in time for the flight says by how much, on the check-in word', () => {
    const { container } = render(<RtRideRow row={rideRow({}, 25)} chrome={chrome} />)

    const mark = screen.getByRole('img', { name: /^roadtrip\.ride\.lateHintFlight:/ })
    expect(mark).toHaveTextContent('roadtrip.ride.checkIn')
    expect(within(mark).getByText('roadtrip.ride.lateBy:25 min')).toBeInTheDocument()
    expect(container.querySelector('.border-transparent')).not.toBeNull()
  })

  it('FE-MOB-RTROW-062: a departure on a row of its own reads the block\'s pieces, and its lateness once, on the check-in', () => {
    const row = stopRow({
      number: null,
      time: '12:20',
      pinned: true,
      warning: { index: 1, code: 'late', minutes: 579 },
      stop: { ...stopRow().stop, assignmentId: -3000000140, placeId: -70, name: 'Hamburg (HAM)', time: '12:20', carrier: carrier('departure') },
    })
    render(<RtStopRow row={row} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('HAM')).toBeInTheDocument()
    expect(screen.getByText('Hamburg')).toBeInTheDocument()
    // The timetable on the right, not the pin with a glyph calling it a time somebody set.
    expect(screen.getByText('13:20')).toBeInTheDocument()
    expect(screen.queryByLabelText('roadtrip.stop.pinned')).toBeNull()
    expect(screen.getByRole('img', { name: /^roadtrip\.ride\.lateHintFlight:/ })).toHaveTextContent('roadtrip.ride.missed')
    expect(screen.queryByText('+9 h 39 min')).toBeNull()
  })
})

describe('RtBookingChips', () => {
  const booking = (over: Partial<Reservation> = {}): Reservation =>
    ({ id: 11, trip_id: 1, title: 'Tisch Bullerei', type: 'restaurant', status: 'confirmed', day_id: 2, reservation_time: '2026-10-05T19:30', ...over }) as Reservation

  it('FE-MOB-RTROW-054: a chip per booking with its name and its clock, each opening its booking, and plain without a handler', () => {
    const onOpen = vi.fn()
    const bookings = [booking(), booking({ id: 13, title: 'Elbphilharmonie', type: 'event', reservation_time: null })]
    const opens = render(<RtBookingChips bookings={bookings} chrome={{ ...chrome, is12h: true }} canEdit onOpen={onOpen} />)

    expect(screen.getByText('Tisch Bullerei')).toBeInTheDocument()
    // The clock in the reader's own format, and none at all for a booking without one.
    expect(screen.getByText('7:30 PM')).toBeInTheDocument()
    expect(screen.queryByText('19:30')).toBeNull()
    expect(screen.getByText('Elbphilharmonie')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByText('Tisch Bullerei'))
    expect(onOpen).toHaveBeenCalledWith(bookings[0])
    opens.unmount()

    render(<RtBookingChips bookings={bookings} chrome={chrome} canEdit />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('19:30')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-055: a reader who may not edit bookings gets a plain table chip and a transport chip that still opens', () => {
    const onOpen = vi.fn()
    const bookings = [booking(), booking({ id: 16, title: 'Taxi to the pier', type: 'taxi', reservation_time: null })]
    render(<RtBookingChips bookings={bookings} chrome={chrome} canEdit={false} onOpen={onOpen} />)

    // A transport has a detail view anybody may look at; a table has only its editor,
    // so the chip stays a chip rather than a button that does nothing (#2012).
    expect(screen.getByText('Tisch Bullerei').closest('button')).toBeNull()
    fireEvent.click(screen.getByText('Tisch Bullerei'))
    expect(onOpen).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Taxi to the pier'))
    expect(onOpen).toHaveBeenCalledWith(bookings[1])
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})

describe('RtLegRow', () => {
  it('FE-MOB-RTROW-014: without a way to ask for other roads the leg is not a control, no button, no role, nothing focusable', () => {
    const { container } = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[role]')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
  })

  it('FE-MOB-RTROW-015: prints the drive and the car icon for a routed leg, falling back to the driving text', () => {
    const bare = render(<RtLegRow seg={{ ...SEG, durationText: undefined }} mode="driving" chrome={chrome} />)
    expect(screen.getByText('roadtrip.leg.driveText:210 km,2 h 55 min')).toBeInTheDocument()
    bare.unmount()

    const { container } = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} />)

    expect(screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')).toBeInTheDocument()
    expect(container.querySelector('.lucide-car-front')).not.toBeNull()
  })

  it('FE-MOB-RTROW-016: says the leg is pending while no segment has come back', () => {
    render(<RtLegRow seg={undefined} mode="driving" chrome={chrome} />)

    expect(screen.getByText('roadtrip.leg.pending')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-044: a segment with no texts yet is read off its numbers, the way the desktop rail reads it', () => {
    // A segment can reach the chain before its routing round has landed: metres and
    // seconds are there, the pre-formatted texts are not.
    render(
      <RtLegRow
        seg={{ ...SEG, distanceText: '', durationText: undefined, drivingText: '' }}
        mode="driving"
        chrome={chrome}
      />,
    )

    expect(screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-045: a segment with neither texts nor numbers says pending, never a bare separator', () => {
    // This printed the template with both slots empty, so the pill read " in " and said
    // nothing at all. A leg that is not routed says so.
    render(
      <RtLegRow
        seg={{ ...SEG, distance: 0, duration: 0, distanceText: '', durationText: undefined, drivingText: '' }}
        mode="driving"
        chrome={chrome}
      />,
    )

    expect(screen.getByText('roadtrip.leg.pending')).toBeInTheDocument()
    expect(screen.queryByText(/driveText/)).toBeNull()
  })

  it('FE-MOB-RTROW-046: half a segment is pending too, rather than a figure with a hole beside it', () => {
    // A distance with no time would read "210 km in", which is worse than saying nothing:
    // it looks like a sentence that was cut off.
    render(
      <RtLegRow
        seg={{ ...SEG, duration: 0, durationText: undefined, drivingText: '' }}
        mode="driving"
        chrome={chrome}
      />,
    )

    expect(screen.getByText('roadtrip.leg.pending')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-017: swaps the icon for a walked leg and for a plugin mode', () => {
    const walk = render(<RtLegRow seg={SEG} mode="walking" chrome={chrome} />)
    expect(walk.container.querySelector('.lucide-footprints')).not.toBeNull()
    walk.unmount()

    const plugin = render(<RtLegRow seg={SEG} mode="plugin:rail" chrome={chrome} />)
    expect(plugin.container.querySelector('.lucide-zap')).not.toBeNull()
  })

  it('FE-MOB-RTROW-038: other ways are one round button beside the pill, and the pill stays text', () => {
    const onAlternatives = vi.fn()
    const { container } = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={onAlternatives} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    const ask = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(ask.querySelector('.lucide-shuffle')).not.toBeNull()
    // A separate 40px target: a tap that stops a scroll on the pill asks the router nothing.
    expect(ask.className).toContain('h-10')
    expect(ask.className).toContain('w-10')
    const drive = screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')
    expect(ask.contains(drive)).toBe(false)
    expect(drive.closest('[role]')).toBeNull()
    fireEvent.click(drive)
    expect(onAlternatives).not.toHaveBeenCalled()

    fireEvent.click(ask)
    expect(onAlternatives).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0)
  })

  it('FE-MOB-RTROW-039: shows pressed while its leg is open, in full ink rather than a filled button', () => {
    const closed = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={vi.fn()} />)
    const idle = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(idle).toHaveAttribute('aria-pressed', 'false')
    expect(idle.className).toContain('text-m-muted')
    closed.unmount()

    render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={vi.fn()} alternativesOpen />)
    const open = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(open).toHaveAttribute('aria-pressed', 'true')
    expect(open.className).toContain('text-m-ink')
    // A filled chip in a column of quiet rows reads as a button pressed and stuck.
    expect(open.className).not.toContain('bg-m-act')
  })

  it('FE-MOB-RTROW-056: the drive in from the day before names where it leaves, above its pill', () => {
    // The stop it leaves is on the card before, so the chain would open on a drive from
    // nowhere without it. Only a leg given an origin says one.
    const onAlternatives = vi.fn()
    render(<RtLegRow seg={SEG} mode="driving" origin="Hakone" chrome={chrome} onAlternatives={onAlternatives} />)

    const origin = screen.getByText('roadtrip.leg.arrivingFrom:Hakone')
    const drive = screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')
    expect(origin.compareDocumentPosition(drive) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(origin.closest('button')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.alt.ask' }))
    expect(onAlternatives).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-040: offline the button keeps its place but does nothing', () => {
    const onAlternatives = vi.fn()
    render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={onAlternatives} alternativesDisabled />)

    const ask = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(ask).toBeDisabled()
    fireEvent.click(ask)
    expect(onAlternatives).not.toHaveBeenCalled()
  })
})

describe('RtDryRow', () => {
  const idle = {
    openFor: null, loading: false, outcome: null, results: [], offered: [],
    ask: vi.fn(), close: vi.fn(),
  } as unknown as RefuelSearch
  const props = { intoLegKm: 82, chrome, electric: false, offline: false, refuel: idle, dayId: 7, legIndex: 1 }

  it('FE-MOB-RTROW-018: names the fuel wording and the distance into the leg for a combustion car', () => {
    const { container } = render(<RtDryRow {...props} onSearch={vi.fn()} />)

    expect(screen.getByText('roadtrip.refuel.dry')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.refuel.after:82 km')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.find' })).toBeInTheDocument()
    expect(container.querySelector('svg.trek--transport')).not.toBeNull()
  })

  it('FE-MOB-RTROW-019: swaps to the charging wording for an electric car', () => {
    render(<RtDryRow {...props} electric onSearch={vi.fn()} />)

    expect(screen.getByText('roadtrip.refuel.dryElectric')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.findElectric' })).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.refuel.dry')).toBeNull()
  })

  it('FE-MOB-RTROW-020: searches from the button', () => {
    const onSearch = vi.fn()
    render(<RtDryRow {...props} onSearch={onSearch} />)

    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.find' }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-021: disables the search offline and says why underneath it', () => {
    const onSearch = vi.fn()
    render(<RtDryRow {...props} offline onSearch={onSearch} />)

    const button = screen.getByRole('button', { name: 'roadtrip.refuel.find' })
    expect(button).toBeDisabled()
    expect(screen.getByText('mobileTrip.rtSearchOffline')).toBeInTheDocument()
    // The lamp stops glowing: a lamp that glows invites a press that cannot work.
    expect(button.querySelector('svg.lucide-fuel')).not.toBeNull()
    expect(button.querySelector('.trek-lowfuel')).toBeNull()

    fireEvent.click(button)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTROW-022: drops the button entirely without write permission, offline line included', () => {
    const { container } = render(<RtDryRow {...props} offline />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText('mobileTrip.rtSearchOffline')).toBeNull()
    // The warning itself stays: it is information, not an action. The reserve lamp too,
    // as a mark rather than a control.
    expect(screen.getByText('roadtrip.refuel.dry')).toBeInTheDocument()
    expect(container.querySelector('.trek-lowfuel')).not.toBeNull()
  })
  const offer = (over: Record<string, unknown> = {}) => ({
    osm_id: 'n1', name: 'Shell Ebina', lat: 35.44, lng: 139.39, category: 'fuel',
    poi_type: 'amenity=fuel', address: null, website: null, phone: null,
    opening_hours: null, cuisine: null, source: 'openstreetmap',
    offRouteKm: 0.4, alongKm: 70, spareKm: 22, ...over,
  }) as unknown as RefuelCandidate

  const answering = (over: Partial<RefuelSearch> = {}) => ({
    ...idle, openFor: '7:1', ...over,
  } as unknown as RefuelSearch)

  it('FE-MOB-RTROW-027: says it is looking while the search runs', () => {
    render(<RtDryRow {...props} refuel={answering({ loading: true })} onSearch={vi.fn()} />)

    expect(screen.getByText('roadtrip.refuel.looking')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-028: offers what it found, with the detour and what is left in the tank', () => {
    render(
      <RtDryRow
        {...props}
        refuel={answering({ outcome: 'found', results: [offer()] })}
        onSearch={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.offRoute:400 m · roadtrip.refuel.spare:22 km')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-029: an offer three legs away does not light up this band', () => {
    // One search is open at a time and it names the dry point it belongs to.
    render(
      <RtDryRow
        {...props}
        refuel={answering({ openFor: '7:4', outcome: 'found', results: [offer()] })}
        onSearch={vi.fn()}
      />,
    )

    expect(screen.queryByText('Shell Ebina')).toBeNull()
  })

  it('FE-MOB-RTROW-030: taking an offer goes through the planner, and never without permission', () => {
    const onAccept = vi.fn()
    const refuel = answering({ outcome: 'found', results: [offer()] })
    const view = render(<RtDryRow {...props} refuel={refuel} onSearch={vi.fn()} onAccept={onAccept} />)

    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.add:Shell Ebina' }))
    expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ osm_id: 'n1' }))
    view.unmount()

    render(<RtDryRow {...props} refuel={refuel} />)
    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.add:Shell Ebina' })).toBeNull()
    // The offer is still worth seeing: a reader can look up a station even if they
    // cannot put it on the trip.
    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-031: three sentences for three different facts, and none of them "nothing here"', () => {
    const none = render(<RtDryRow {...props} refuel={answering({ outcome: 'none' })} onSearch={vi.fn()} />)
    expect(screen.getByText('roadtrip.refuel.none')).toBeInTheDocument()
    none.unmount()

    const cut = render(<RtDryRow {...props} refuel={answering({ outcome: 'incomplete' })} onSearch={vi.fn()} />)
    expect(screen.getByText('roadtrip.refuel.incomplete')).toBeInTheDocument()
    cut.unmount()

    render(<RtDryRow {...props} refuel={answering({ outcome: 'failed' })} onSearch={vi.fn()} />)
    // A request that failed never checked the stretch, so it must not read as empty.
    expect(screen.getByText('roadtrip.refuel.failed')).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.refuel.none')).toBeNull()
  })

  it('FE-MOB-RTROW-032: the mascot rides the skateboard, sad, in the band colour and on an opaque ground', () => {
    const { container } = render(<RtDryRow {...props} onSearch={vi.fn()} />)

    const mascot = container.querySelector('svg.trek--transport') as SVGElement
    // Expression eyes, not the default open ones, bent down rather than up.
    expect(mascot.querySelectorAll('.trek-eye')).toHaveLength(0)
    const eyes = mascot.querySelectorAll('.trek-body g[stroke] path')
    expect(eyes).toHaveLength(2)
    const [, startY, controlY] = /^M[\d.]+ ([\d.]+) Q[\d.]+ ([\d.]+)/.exec(eyes[0].getAttribute('d') ?? '') ?? []
    expect(Number(controlY)).toBeGreaterThan(Number(startY))

    // Renamed on the mascot's own span, against an opaque surface so the cut out eyes
    // do not show the body through them.
    const wrapper = mascot.parentElement as HTMLElement
    expect(wrapper.style.getPropertyValue('--m-ink')).toBe('var(--m-st-danger)')
    expect(wrapper.style.getPropertyValue('--m-bg')).toContain('--m-sheetop')
    // And never on the band, where the offers read --m-ink and have to stay ink.
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--m-ink')).toBe('')
  })

  it('FE-MOB-RTROW-033: the reserve lamp is the button, with its words in the label only', () => {
    const fuel = render(<RtDryRow {...props} onSearch={vi.fn()} />)

    const lamp = screen.getByRole('button', { name: 'roadtrip.refuel.find' })
    expect(lamp.querySelector('svg.lucide-fuel.trek-lowfuel')).not.toBeNull()
    // Not the black pill it replaced, and no visible label beside the mascot and title.
    expect(lamp.className).not.toContain('bg-m-act')
    expect(screen.queryByText('roadtrip.refuel.find')).toBeNull()
    fuel.unmount()

    render(<RtDryRow {...props} electric onSearch={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.findElectric' }).querySelector('svg.lucide-zap')).not.toBeNull()
  })

  it('FE-MOB-RTROW-034: while the search runs or offers show, the lamp steps aside for a close', () => {
    // The map draws the offers, and the band is where somebody lets those pins go.
    const close = vi.fn()
    const running = render(<RtDryRow {...props} refuel={answering({ loading: true, close })} onSearch={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(close).toHaveBeenCalledTimes(1)
    running.unmount()

    const found = render(<RtDryRow {...props} refuel={answering({ outcome: 'found', results: [offer()], close })} onSearch={vi.fn()} />)
    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(close).toHaveBeenCalledTimes(2)
    found.unmount()

    // Offline the close still works, because closing is local, and with no dead control
    // in the slot the sentence explaining one stands down.
    render(<RtDryRow {...props} offline refuel={answering({ outcome: 'found', results: [offer()], close })} onSearch={vi.fn()} />)
    const closeOffline = screen.getByRole('button', { name: 'common.close' })
    expect(closeOffline).toBeEnabled()
    expect(screen.queryByText('mobileTrip.rtSearchOffline')).toBeNull()
    fireEvent.click(closeOffline)
    expect(close).toHaveBeenCalledTimes(3)
  })

  it('FE-MOB-RTROW-035: an empty answer leaves a retry rather than a dead end, and offline it waits', () => {
    const onSearch = vi.fn()
    const failed = render(<RtDryRow {...props} refuel={answering({ outcome: 'failed' })} onSearch={onSearch} />)

    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.again' }))
    expect(onSearch).toHaveBeenCalledTimes(1)
    failed.unmount()

    const none = render(<RtDryRow {...props} refuel={answering({ outcome: 'none' })} onSearch={onSearch} />)
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.again' })).toBeInTheDocument()
    none.unmount()

    render(<RtDryRow {...props} offline refuel={answering({ outcome: 'failed' })} onSearch={onSearch} />)
    const again = screen.getByRole('button', { name: 'roadtrip.refuel.again' })
    expect(again).toBeDisabled()
    fireEvent.click(again)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-036: lists three offers at most, however many came back', () => {
    const results = ['n1', 'n2', 'n3', 'n4'].map((id, i) => offer({ osm_id: id, name: `Station ${i + 1}` }))
    const { container } = render(<RtDryRow {...props} refuel={answering({ outcome: 'found', results })} onSearch={vi.fn()} />)

    expect(container.querySelectorAll('li')).toHaveLength(3)
    expect(screen.queryByText('Station 4')).toBeNull()
  })

  it('FE-MOB-RTROW-037: the battery wording carries through to taking an offer', () => {
    render(
      <RtDryRow
        {...props}
        electric
        refuel={answering({ outcome: 'found', results: [offer()] })}
        onSearch={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'roadtrip.refuel.addElectric:Shell Ebina' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.add:Shell Ebina' })).toBeNull()
  })
})

describe('RtAutoRow', () => {
  it('FE-MOB-RTROW-023: marks the end of a day with the moon and the time it stopped', () => {
    const { container } = render(<RtAutoRow phase="end" time="22:00" chrome={chrome} />)

    expect(screen.getByText('roadtrip.window.stop')).toBeInTheDocument()
    expect(screen.getByText('22:00')).toBeInTheDocument()
    expect(container.querySelector('.lucide-moon')).not.toBeNull()
  })

  it('FE-MOB-RTROW-024: marks the morning with the sunrise and no clock when there is none', () => {
    const { container } = render(<RtAutoRow phase="resume" time={null} chrome={chrome} />)

    expect(screen.getByText('roadtrip.window.resume')).toBeInTheDocument()
    expect(container.querySelector('.lucide-sunrise')).not.toBeNull()
    expect(screen.queryByText('22:00')).toBeNull()
  })
})

describe('RtSpillRow', () => {
  it('FE-MOB-RTROW-025: names the day the night drive came from and when it set off', () => {
    render(
      <RtSpillRow fromDayNumber={1} departs="23:10" chrome={chrome}>
        <span>Fuji Viewpoint</span>
      </RtSpillRow>,
    )

    expect(screen.getByText('roadtrip.spill.title:1')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.spill.departs:23:10')).toBeInTheDocument()
    expect(screen.getByText('Fuji Viewpoint')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-026: leaves the departure off when the night drive has no time', () => {
    render(<RtSpillRow fromDayNumber={1} departs={null} chrome={chrome} />)

    expect(screen.getByText('roadtrip.spill.title:1')).toBeInTheDocument()
    expect(screen.queryByText(/roadtrip\.spill\.departs/)).toBeNull()
  })

  it('FE-MOB-RTROW-049: the departure follows the reader twelve hour setting like every other clock in the chain', () => {
    // The band sits directly above stops that print their clocks through the same
    // setting, so a raw 21:30 over a 9:45 PM is two clocks on one screen.
    render(<RtSpillRow fromDayNumber={1} departs="21:30" chrome={{ ...chrome, is12h: true }} />)

    expect(screen.getByText('roadtrip.spill.departs:9:30 PM')).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.spill.departs:21:30')).toBeNull()
  })
})

describe('RtBookendRow', () => {
  const reading = (over: Partial<BookendReading> = {}): BookendReading => ({
    phase: 'morning',
    variant: 'checkOut',
    name: 'Hotel Alpenblick',
    until: '10:00',
    from: null,
    reservationId: 41,
    accommodationId: 5,
    placeId: 900,
    ...over,
  })
  const row = (over: Partial<StopRow> = {}) =>
    stopRow({ number: null, service: true, time: '08:40', stop: { ...stopRow().stop, name: 'Hotel Alpenblick', stopType: 'hotel' }, ...over })

  it('FE-MOB-RTROW-057: says which night it is on the bed a stay wears, with no number, and opens on a tap', () => {
    const onOpen = vi.fn()
    const { container } = render(<RtBookendRow row={row()} bookend={reading()} chrome={chrome} onOpen={onOpen} />)

    // The hotel is the name; the edge of the stay and its hour sit in one badge under it.
    expect(screen.getByText('Hotel Alpenblick')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.bookend.checkOut').parentElement).toHaveTextContent('10:00')
    expect(screen.queryByText(/·/)).toBeNull()
    expect(screen.getByText('08:40')).toBeInTheDocument()
    expect(container.querySelector('.lucide-bed-double')).not.toBeNull()
    expect(screen.queryByText('2')).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-RTROW-058: an evening says nothing under its name but what the drive into it ran over', () => {
    const warning: ScheduleWarning = { index: 3, code: 'leg', overMinutes: 30 }
    const quiet = render(<RtBookendRow row={row({ time: null })} bookend={reading({ phase: 'evening', variant: 'back', until: null })} chrome={chrome} onOpen={vi.fn()} />)
    expect(screen.getByText('Hotel Alpenblick')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.bookend.back')).toBeInTheDocument()
    expect(screen.queryByText('10:00')).toBeNull()
    expect(screen.queryByText('08:40')).toBeNull()
    quiet.unmount()

    render(<RtBookendRow row={row({ warning, time: '19:10' })} bookend={reading({ phase: 'evening', variant: 'back', until: null })} chrome={{ ...chrome, is12h: true }} onOpen={vi.fn()} />)
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('7:10 PM')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-063: the hotel wears the hotel stop\'s own disc, not a terminal\'s', () => {
    const edge = render(<RtBookendRow row={row()} bookend={reading()} chrome={chrome} onOpen={vi.fn()} />)
    const bookendDisc = edge.container.querySelector('.lucide-bed-double')!.parentElement as HTMLElement
    const bookendFace = [bookendDisc.style.background, bookendDisc.style.color]
    edge.unmount()

    const stay = render(<RtStopRow row={row({ number: null, service: true })} chrome={chrome} onOpen={vi.fn()} />)
    const stopDisc = stay.container.querySelector('.lucide-bed-double')!.parentElement as HTMLElement
    expect(bookendFace[0]).not.toBe('')
    expect(bookendFace[0]).toBe(stopDisc.style.background)
    // White on it, as the stop's bed is.
    expect(bookendFace[1]).toBe('rgb(255, 255, 255)')
    expect(stopDisc).toHaveClass('text-white')
  })

  it('FE-MOB-RTROW-059: a check-out morning the drive leaves after the room is handed back is marked', () => {
    const entry = (arrival: string) => ({ arrival, departure: arrival, anchored: false, dayOffset: 0 })
    const late = render(<RtBookendRow row={row({ time: '12:27', entry: entry('12:27') })} bookend={reading()} chrome={chrome} onOpen={vi.fn()} />)
    // The check-out badge itself turns and says why, instead of a second mark beside it.
    expect(screen.getByLabelText('roadtrip.bookend.checkOut 10:00 roadtrip.bookend.afterCheckOut')).toBeInTheDocument()
    late.unmount()

    render(<RtBookendRow row={row({ entry: entry('08:40') })} bookend={reading()} chrome={chrome} onOpen={vi.fn()} />)
    expect(screen.queryByLabelText(/roadtrip\.bookend\.afterCheckOut/)).toBeNull()
    expect(screen.getByText('roadtrip.bookend.checkOut')).toBeInTheDocument()
  })
})
