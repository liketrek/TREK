import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import type { CarrierTerminal } from '@trek/shared/roadtrip'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import type { BookendReading } from './roadtripRowModel'
import type { Reservation, RouteSegment } from '../../types'
import { BookendStop, BookingChips, RideBlock, TerminalStop, UndatedRides } from './RoadtripSidebarBookingRows'
import { tooltipOf } from '../../../tests/helpers/roadtripRail'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

function settings(over: { time_format?: '12h' | '24h' } = {}): void {
  useSettingsStore.setState({ settings: { distance_unit: 'metric', time_format: '24h', ...over } as never })
}

beforeEach(() => settings())
afterEach(() => { vi.useRealTimers() })

const carrier = (over: Partial<CarrierTerminal> = {}): CarrierTerminal =>
  ({ reservationId: 7, type: 'flight', role: 'departure', title: 'LH 2078', code: 'HAM', at: '15:15', ...over })

function stop(over: Partial<RoadtripStop> = {}): RoadtripStop {
  return {
    assignmentId: 1, ownerDayId: 1, ownerIndex: 0, placeId: 10, name: 'Hamburg Airport', lat: 53.6, lng: 10,
    time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    ...over,
  }
}

const entry = (over: Partial<ScheduleEntry> = {}): ScheduleEntry =>
  ({ arrival: null, departure: null, anchored: false, dayOffset: 0, ...over })

const warning = (over: Partial<ScheduleWarning> & Pick<ScheduleWarning, 'code'>): ScheduleWarning => ({ index: 0, ...over })

const reading = (over: Partial<BookendReading> = {}): BookendReading => ({
  phase: 'morning', variant: 'checkOut', name: 'Hotel Alster', until: '10:00', from: null,
  reservationId: 31, accommodationId: 4, placeId: 40,
  ...over,
})

const booking = (over: Partial<Reservation> & Pick<Reservation, 'id' | 'type' | 'title'>): Reservation =>
  ({ reservation_time: null, ...over }) as Reservation

/** The rail column of a disc row: the line above, the disc, the line below. */
const railOf = (row: Element): Element => row.firstElementChild!
const lines = (row: Element): number => railOf(row).querySelectorAll(':scope > .w-\\[1\\.5px\\]').length

/**
 * A booking card keeps its rail beside the button rather than inside it: both line
 * stubs are always drawn, and only the ones that carry the chain take the edge colour.
 */
const cardLines = (card: Element): number =>
  ((card.parentElement as Element).firstElementChild as Element).querySelectorAll(':scope > .w-\\[1\\.5px\\].bg-edge').length

describe('TerminalStop', () => {
  it('FE-ROADTRIP-BOOKINGROWS-001: a departure on a row of its own reads its place, its code as a pill, its timetable clock and the check-in, and opens the booking', () => {
    const onOpen = vi.fn()
    const { container } = wrap(
      <TerminalStop
        stop={stop({ time: '13:15', carrier: carrier() })}
        entry={entry({ dayOffset: 1 })}
        late={[]}
        continues
        onOpen={onOpen}
      />,
    )
    const card = screen.getByRole('button')
    expect(card).toBeEnabled()
    expect(screen.getByText('HAM')).toBeInTheDocument()
    expect(screen.getByText('Hamburg Airport')).toBeInTheDocument()
    // The timetable's clock, its day carry and its words for a screen reader.
    expect(screen.getByText('15:15')).toHaveAttribute('aria-hidden')
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Departure 15:15')).toHaveClass('sr-only')
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('13:15')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-plane')).not.toBeNull()
    // What pressing it does comes after the card's own content.
    expect(card.lastElementChild).toHaveTextContent('Open booking')
    expect(card.lastElementChild).toHaveClass('sr-only')
    expect(cardLines(card)).toBe(2)
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-BOOKINGROWS-001b: with its booking at hand the card reads the booking title, as the day plan does', () => {
    wrap(
      <TerminalStop
        stop={stop({ time: '13:15', carrier: carrier() })}
        booking={booking({ id: 7, type: 'flight', title: 'Lufthansa to Munich' })}
        entry={entry()}
        late={[]}
        continues
      />,
    )
    expect(screen.getByText('Lufthansa to Munich')).toBeInTheDocument()
    expect(screen.queryByText('Hamburg Airport')).toBeNull()
    expect(screen.getByText('HAM')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-BOOKINGROWS-001c: a check-in the drive cannot make takes no pill on the card, neither the check-in nor that it is missed', () => {
    wrap(
      <TerminalStop
        stop={stop({ time: '13:15', carrier: carrier() })}
        entry={entry()}
        late={[warning({ code: 'late', minutes: 180 })]}
        continues
      />,
    )
    expect(screen.queryByText('Check-in')).toBeNull()
    expect(screen.queryByText('Missed')).toBeNull()
    expect(screen.getByText('HAM')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-BOOKINGROWS-002: a hire desk says which one it is, falls back to the arrival clock and stays inert without a booking to open', () => {
    const desk = carrier({ type: 'car', role: 'pickup', code: null, at: null, title: 'Sixt' })
    const first = wrap(
      <TerminalStop stop={stop({ name: 'Sixt Hamburg', carrier: desk })} entry={entry({ arrival: '09:40' })} late={[]} continues={false} starts />,
    )
    const card = screen.getByRole('button')
    expect(card).toBeDisabled()
    expect(screen.getByText('Pickup')).toBeInTheDocument()
    expect(screen.getByText('09:40')).toBeInTheDocument()
    expect(screen.queryByText('Open booking')).toBeNull()
    expect(first.container.querySelector('svg.lucide-car')).not.toBeNull()
    // The first row of the day on the last stop of it: no line either way.
    expect(cardLines(card)).toBe(0)
    first.unmount()

    // Neither a timetable nor a drive arrival: the clock column stays empty.
    wrap(<TerminalStop stop={stop({ name: 'Sixt Hamburg', carrier: desk })} entry={undefined} late={[]} continues />)
    expect(screen.getByRole('button')).not.toHaveTextContent(/\d/)
  })
})

describe('BookendStop', () => {
  it('FE-ROADTRIP-BOOKINGROWS-003: leaving after the room is handed back turns the badge into the warning, with the drive findings and lateness beside it', () => {
    const onOpen = vi.fn()
    const { container } = wrap(
      <BookendStop
        reading={reading()}
        entry={entry({ arrival: '12:30' })}
        late={[warning({ code: 'late', minutes: 20 })]}
        driveFindings={[warning({ code: 'leg', overMinutes: 45 })]}
        continues
        starts
        onOpen={onOpen}
      />,
    )
    expect(screen.getByText('Hotel Alster')).toBeInTheDocument()
    expect(screen.getByText('Check-out')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-triangle-alert, svg.lucide-alert-triangle')).not.toBeNull()
    expect(tooltipOf(screen.getByText('10:00').parentElement!)).toBe('Leaves after check-out')
    expect(screen.getByText('+45 min')).toBeInTheDocument()
    expect(screen.getByLabelText('Arrives 20 min after the time you set')).toBeInTheDocument()
    expect(screen.getByText('12:30')).toBeInTheDocument()
    // The bed on the hotel's own disc, starting the chain.
    const row = screen.getByRole('button')
    expect(container.querySelector('svg.lucide-bed-double')).not.toBeNull()
    expect(lines(row)).toBe(1)
    expect(screen.queryByText('Open booking')).toBeNull()
    fireEvent.click(row)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-BOOKINGROWS-004: a check-in evening reads the hour the room is ready, plainly, with no clock of its own', () => {
    const { container } = wrap(
      <BookendStop
        reading={reading({ phase: 'evening', variant: 'checkIn', until: null, from: '15:00' })}
        entry={undefined}
        late={[]}
        driveFindings={[]}
        continues={false}
      />,
    )
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('15:00')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-triangle-alert, svg.lucide-alert-triangle')).toBeNull()
    expect(screen.getByRole('button')).toBeDisabled()
    expect(lines(screen.getByRole('button'))).toBe(1)
  })
})

describe('RideBlock', () => {
  const departure = stop({ name: 'Hamburg Airport (HAM)', time: '13:15', carrier: carrier() })
  const arrival = stop({
    assignmentId: 2, name: 'Munich Airport', carrier: carrier({ role: 'arrival', code: 'MUC', at: '16:30' }),
  })
  const seg = { distance: 600000, duration: 4500, durationText: '1 h 15 min', mode: 'flight' } as RouteSegment

  it('FE-ROADTRIP-BOOKINGROWS-005: a ride on one day is one card: its title, both clocks in the arrival column, the route as one pill and the check-in', () => {
    const onOpen = vi.fn()
    wrap(
      <RideBlock
        departure={departure}
        arrival={arrival}
        entries={[entry(), entry()]}
        late={[]}
        seg={seg}
        continues
        onOpen={onOpen}
      />,
    )
    const card = screen.getByRole('button')
    expect(screen.getByText('LH 2078')).toBeInTheDocument()
    // Both ends in one route pill, the places behind it as its tooltip.
    const route = screen.getByText('HAM').parentElement!
    expect(route).toContainElement(screen.getByText('MUC'))
    expect(tooltipOf(route.closest('.rounded-full') as Element)).toBe('Hamburg Airport \u2192 Munich Airport')
    const clock = screen.getByText('15:15 \u2013 16:30')
    expect(tooltipOf(clock)).toBe('Departure 15:15, Arrival 16:30')
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('13:15')).toBeInTheDocument()
    // The minutes the ride takes are the booking's business, not the rail's.
    expect(screen.queryByText('1 h 15 min')).toBeNull()
    expect(card.lastElementChild).toHaveTextContent('Open booking')
    expect(card.lastElementChild).toHaveClass('sr-only')
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-BOOKINGROWS-005b: with its booking at hand the card reads the booking title', () => {
    wrap(
      <RideBlock
        departure={departure}
        arrival={arrival}
        booking={booking({ id: 7, type: 'flight', title: 'Hamburg to Munich' })}
        entries={[entry(), entry()]}
        late={[]}
        seg={seg}
        continues
      />,
    )
    expect(screen.getByText('Hamburg to Munich')).toBeInTheDocument()
    expect(screen.queryByText('LH 2078')).toBeNull()
  })

  it('FE-ROADTRIP-BOOKINGROWS-006: a ride the drive cannot catch shows neither its check-in nor that it is missed on its card', () => {
    wrap(
      <RideBlock
        departure={departure}
        arrival={arrival}
        entries={[entry(), entry()]}
        late={[warning({ code: 'late', minutes: 180 })]}
        seg={undefined}
        continues={false}
        starts
      />,
    )
    const card = screen.getByRole('button')
    expect(card).toBeDisabled()
    expect(screen.queryByText('Missed')).toBeNull()
    expect(screen.queryByText('Check-in')).toBeNull()
    // The route pill stands alone on the card's second line.
    expect(((screen.getByText('HAM').closest('.rounded-full') as Element).parentElement as Element).children).toHaveLength(1)
    expect(cardLines(card)).toBe(0)
  })

  it('FE-ROADTRIP-BOOKINGROWS-007: a booking with no codes, no clocks and no minutes keeps its title and the route between the names', () => {
    wrap(
      <RideBlock
        departure={stop({ name: 'Kiel', carrier: carrier({ type: 'ferry', code: null, at: null, title: 'Color Line' }) })}
        arrival={stop({ assignmentId: 2, name: 'Oslo', carrier: carrier({ type: 'ferry', role: 'arrival', code: null, at: null }) })}
        entries={[undefined, undefined]}
        late={[]}
        seg={undefined}
        continues
      />,
    )
    const card = screen.getByRole('button')
    // The title line and the pill line, and no sentence for a screen reader without a booking to open.
    expect(card.children).toHaveLength(2)
    const [titleLine, pills] = Array.from(card.children)
    // No clock beside the title.
    expect(titleLine.children).toHaveLength(1)
    expect(titleLine).toHaveTextContent('Color Line')
    expect(pills.children).toHaveLength(1)
    expect(screen.getByText('Kiel').parentElement).toContainElement(screen.getByText('Oslo'))
  })

  it('FE-ROADTRIP-BOOKINGROWS-008: a timetable with only a departure reads that clock alone, with no check-in and no minutes', () => {
    wrap(
      <RideBlock
        departure={stop({ name: 'Kiel', carrier: carrier({ type: 'ferry', code: null, at: '14:00' }) })}
        arrival={stop({ assignmentId: 2, name: 'Oslo', carrier: carrier({ type: 'ferry', role: 'arrival', code: null, at: null }) })}
        entries={[entry(), entry()]}
        late={[]}
        seg={{ ...seg, durationText: '' }}
        continues
      />,
    )
    expect(screen.queryByText('Check-in')).toBeNull()
    expect(screen.queryByText('1 h 15 min')).toBeNull()
    expect(screen.getByText('14:00')).toBeInTheDocument()
  })
})

describe('BookingChips', () => {
  const table = booking({ id: 1, type: 'restaurant', title: 'Fischereihafen', reservation_time: '2026-06-01T19:30' })
  const train = booking({ id: 2, type: 'train', title: 'ICE 1007', status: 'confirmed' })

  it('FE-ROADTRIP-BOOKINGROWS-009: a pill opens when this reader may open it, and the rest stay plain pills that name their booking in the tooltip', () => {
    const onOpen = vi.fn()
    const { container } = wrap(<BookingChips bookings={[table, train]} continues canEdit={false} onOpen={onOpen} />)
    // Each pill says it is a reservation and carries its time; the title is in its name.
    expect(screen.getAllByText('Reservation')).toHaveLength(2)
    expect(screen.getByText('19:30')).toBeInTheDocument()
    // The table has only its editor, which this reader may not open; the train has a view.
    expect(screen.queryByRole('button', { name: /Fischereihafen/ })).toBeNull()
    expect(tooltipOf(screen.getByText('19:30').parentElement!)).toBe('Fischereihafen (Pending)')
    const ride = screen.getByRole('button', { name: 'ICE 1007, Confirmed' })
    fireEvent.click(ride)
    expect(onOpen).toHaveBeenCalledWith(2)
    expect(container.querySelector('.w-\\[1\\.5px\\]')).not.toBeNull()
  })

  it('FE-ROADTRIP-BOOKINGROWS-009b: the word takes the status colour, green once confirmed and amber while pending', () => {
    wrap(<BookingChips bookings={[table, train]} continues={false} canEdit={false} />)
    const [pending, confirmed] = screen.getAllByText('Reservation')
    expect(pending).toHaveClass('text-warning')
    expect(confirmed).toHaveClass('text-success')
  })

  it('FE-ROADTRIP-BOOKINGROWS-010: an editor opens every pill, and without a way to open any they are all plain', () => {
    const onOpen = vi.fn()
    const editor = wrap(<BookingChips bookings={[table, train]} continues={false} canEdit onOpen={onOpen} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Fischereihafen, Pending' }))
    expect(onOpen).toHaveBeenCalledWith(1)
    expect(editor.container.querySelector('.w-\\[1\\.5px\\]')).toBeNull()
    editor.unmount()

    wrap(<BookingChips bookings={[table, train]} continues={false} canEdit />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getAllByText('Reservation')).toHaveLength(2)
  })

  it('FE-ROADTRIP-BOOKINGROWS-011: the clock follows the traveller\'s format', () => {
    settings({ time_format: '12h' })
    wrap(<BookingChips bookings={[table]} continues={false} canEdit={false} />)
    expect(screen.getByText('7:30 PM')).toBeInTheDocument()
  })
})

describe('UndatedRides', () => {
  const ferry = booking({ id: 9, type: 'ferry', title: 'Stena Line' })

  it('FE-ROADTRIP-BOOKINGROWS-012: nothing on no day draws nothing', () => {
    const { container } = wrap(<UndatedRides rides={[]} onOpenBooking={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-ROADTRIP-BOOKINGROWS-013: each ride on no day is a line, with its booking a click away when it can be opened', () => {
    const onOpenBooking = vi.fn()
    const open = wrap(<UndatedRides rides={[ferry]} onOpenBooking={onOpenBooking} />)
    expect(screen.getByRole('status')).toHaveTextContent('Stena Line is on none of this trip’s days, so the drive does not use it.')
    fireEvent.click(screen.getByRole('button', { name: 'Open booking' }))
    expect(onOpenBooking).toHaveBeenCalledWith(9)
    open.unmount()

    wrap(<UndatedRides rides={[ferry]} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
