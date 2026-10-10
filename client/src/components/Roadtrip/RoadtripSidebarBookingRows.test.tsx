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

describe('TerminalStop', () => {
  it('FE-ROADTRIP-BOOKINGROWS-001: a departure on a row of its own reads its code, its timetable clock and the check-in, and opens the booking', () => {
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
    const row = screen.getByRole('button')
    expect(row).toBeEnabled()
    expect(screen.getByText('HAM')).toBeInTheDocument()
    expect(screen.getByText('Hamburg Airport')).toBeInTheDocument()
    // The timetable's clock, its day carry and its words for a screen reader.
    expect(screen.getByText('15:15')).toHaveAttribute('aria-hidden')
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Departure 15:15')).toHaveClass('sr-only')
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('13:15')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-plane')).not.toBeNull()
    // What pressing it does comes after the row's own content.
    expect(row.lastElementChild).toHaveTextContent('Open booking')
    expect(row.lastElementChild).toHaveClass('sr-only')
    expect(lines(row)).toBe(2)
    expect(tooltipOf(screen.getByText('Hamburg Airport'))).toBe('Open booking')
    fireEvent.click(row)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-BOOKINGROWS-002: a hire desk says which one it is, falls back to the arrival clock and stays inert without a booking to open', () => {
    const desk = carrier({ type: 'car', role: 'pickup', code: null, at: null, title: 'Sixt' })
    const first = wrap(
      <TerminalStop stop={stop({ name: 'Sixt Hamburg', carrier: desk })} entry={entry({ arrival: '09:40' })} late={[]} continues={false} starts />,
    )
    const row = screen.getByRole('button')
    expect(row).toBeDisabled()
    expect(screen.getByText('Pickup')).toBeInTheDocument()
    expect(screen.getByText('09:40')).toBeInTheDocument()
    expect(screen.queryByText('Open booking')).toBeNull()
    expect(first.container.querySelector('svg.lucide-car')).not.toBeNull()
    // The first row of the day on the last stop of it: no line either way.
    expect(lines(row)).toBe(0)
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

  it('FE-ROADTRIP-BOOKINGROWS-005: a ride on one day is one block: its title, both ends with their clocks, the places, the check-in and the minutes', () => {
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
    const row = screen.getByRole('button')
    const block = row.children[1]
    expect(block).toHaveClass('border-edge-faint')
    expect(screen.getByText('LH 2078')).toBeInTheDocument()
    expect(screen.getByText('HAM')).toBeInTheDocument()
    expect(screen.getByText('MUC')).toBeInTheDocument()
    expect(screen.getByText('Departure 15:15')).toHaveClass('sr-only')
    expect(screen.getByText('Arrival 16:30')).toHaveClass('sr-only')
    expect(screen.getByText('Hamburg Airport')).toBeInTheDocument()
    expect(screen.getByText('Munich Airport')).toHaveClass('text-end')
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('1 h 15 min')).toBeInTheDocument()
    expect(tooltipOf(screen.getByText('1 h 15 min').parentElement!)).toBe('Duration per the booking')
    expect(tooltipOf(screen.getByText('LH 2078'))).toBe('Open booking')
    fireEvent.click(row)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-BOOKINGROWS-006: a ride the drive cannot catch edges the block in the warning colour, its check-in standing alone without minutes', () => {
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
    const row = screen.getByRole('button')
    expect(row).toBeDisabled()
    expect(row.children[1]).toHaveClass('border-warning')
    expect(screen.getByText('Missed')).toBeInTheDocument()
    expect(screen.getByText('there at 16:15')).toBeInTheDocument()
    // No minutes on the timetable: the check-in stands alone.
    expect(screen.getByText('Missed').closest('.flex-wrap')!.children).toHaveLength(1)
    expect(lines(row)).toBe(0)
  })

  it('FE-ROADTRIP-BOOKINGROWS-007: a booking with no codes, no clocks and no minutes keeps its strip and drops the lines it has nothing for', () => {
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
    const block = screen.getByRole('button').children[1]
    // Title and strip only: no place line under chips that already are the names, and no
    // check-in or minutes row.
    expect(block.children).toHaveLength(2)
    const strip = block.children[1]
    expect(strip.children).toHaveLength(5)
    expect(strip.children[0]).toHaveTextContent('Kiel')
    expect(strip.children[1]).toBeEmptyDOMElement()
    expect(strip.children[3]).toBeEmptyDOMElement()
    expect(strip.children[4]).toHaveTextContent('Oslo')
  })

  it('FE-ROADTRIP-BOOKINGROWS-008: the minutes stand alone when the timetable gives no check-in', () => {
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
    expect(screen.getByText('1 h 15 min')).toBeInTheDocument()
    expect(screen.getByText('14:00')).toBeInTheDocument()
  })
})

describe('BookingChips', () => {
  const table = booking({ id: 1, type: 'restaurant', title: 'Fischereihafen', reservation_time: '2026-06-01T19:30' })
  const train = booking({ id: 2, type: 'train', title: 'ICE 1007' })

  it('FE-ROADTRIP-BOOKINGROWS-009: a chip opens when this reader may open it, and the rest stay plain chips', () => {
    const onOpen = vi.fn()
    const { container } = wrap(<BookingChips bookings={[table, train]} continues canEdit={false} onOpen={onOpen} />)
    expect(screen.getByText('19:30')).toBeInTheDocument()
    // The table has only its editor, which this reader may not open; the train has a view.
    expect(screen.getByText('Fischereihafen').closest('button')).toBeNull()
    const ride = screen.getByRole('button')
    expect(ride).toHaveTextContent('ICE 1007')
    fireEvent.click(ride)
    expect(onOpen).toHaveBeenCalledWith(2)
    expect(container.querySelector('.w-\\[1\\.5px\\]')).not.toBeNull()
  })

  it('FE-ROADTRIP-BOOKINGROWS-010: an editor opens every chip, and without a way to open any they are all plain', () => {
    const onOpen = vi.fn()
    const editor = wrap(<BookingChips bookings={[table, train]} continues={false} canEdit onOpen={onOpen} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByText('Fischereihafen'))
    expect(onOpen).toHaveBeenCalledWith(1)
    expect(editor.container.querySelector('.w-\\[1\\.5px\\]')).toBeNull()
    editor.unmount()

    wrap(<BookingChips bookings={[table, train]} continues={false} canEdit />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('ICE 1007')).toBeInTheDocument()
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
