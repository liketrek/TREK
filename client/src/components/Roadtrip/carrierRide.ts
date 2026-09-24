import { Bus, Car, Plane, Sailboat, Ship, Train, type LucideIcon } from 'lucide-react'
import { formatClock, formatDurationShort, parseClock, type ScheduleEntry, type ScheduleWarning } from './roadtripModel'
import { formatClockTime } from '../../utils/formatters'
import { stripAirportCode } from '../../utils/flightLegs'
import { TRANSPORT_TYPES } from '../../utils/dayMerge'
import { CARRIER_TYPES, type RoadtripDay, type RoadtripStop, type RouteSegment } from '@trek/shared/roadtrip'
import type { Reservation, TranslationFn } from '../../types'

/**
 * How a ride and its two terminals, and a hire car's two desks, read on the rail and in
 * the phone chain (#2428), and which of the bookings under a stop open there.
 *
 * One module for both shells, because the two would otherwise carry the same icon table,
 * the same reading of the timetable against the drive and the same sentences each, and the
 * duplication budget does not stretch to that. The shells only draw what comes out of here.
 * The icons are the booking panel's for the same types, so a flight looks like a flight
 * wherever the trip shows it.
 */
const CARRIER_ICON: Record<string, LucideIcon> = {
  flight: Plane,
  train: Train,
  ferry: Sailboat,
  cruise: Ship,
  bus: Bus,
  car: Car,
}

export function carrierIcon(type: string): LucideIcon {
  return CARRIER_ICON[type] ?? Plane
}

/**
 * How long the ride takes on the timetable: the leg's own text, or its seconds when the
 * text is not in yet. Null for a ride the timetable gives no minutes for.
 */
export function rideDuration(seg: RouteSegment | undefined): string | null {
  const seconds = seg && Number.isFinite(seg.duration) ? seg.duration : 0
  return seg?.durationText || (seconds > 0 ? formatDurationShort(seconds) : null)
}

/** One end of a ride, or a hire car's desk, as a row or the route strip of a block reads it. */
export interface RideEnd {
  /** IATA or station code, when the booking carries one. */
  code: string | null
  /** The terminal's name without the code the airport forms append to it. */
  place: string
  /** What the route strip's chip holds: the code, or the name of a terminal without one. */
  chip: string
  /** The name under the chip, or null when the chip already is the name. */
  placeLine: string | null
  /** The timetable's clock here, in the reader's format. Null when the booking names none. */
  clock: string | null
  /** Days past the card's own that the clock falls on, for the timetable's "+1". */
  dayOffset: number
  /** The clock in words, "Departure 15:15", for its tooltip and a screen reader. */
  label: string | null
}

/**
 * The departure measured against the drive that gets there.
 *
 * `ok` is the drive arriving by the check-in, `tight` after it but still before the ride
 * leaves, `missed` after it has left. The ride keeps its day either way (`scheduleStopOf`
 * pins it `dated`), so a drive a day late reads as missed rather than as tomorrow's ride.
 */
export type RideState = 'ok' | 'tight' | 'missed'

export interface CheckInReading {
  state: RideState
  /** The badge's word: check-in, boarding for a train or a bus, or that the ride is missed. */
  lead: string
  /** Its figure: the check-in clock, how late the drive gets there, or when it does. */
  value: string
  /** The sentence behind the badge, with the timetable in it. */
  hint: string
}

export interface RideReading {
  title: string
  duration: string | null
  from: RideEnd
  to: RideEnd
  checkIn: CheckInReading | null
}

export interface TerminalReading {
  end: RideEnd
  /** A hire car's desk says which one it is, having no other end beside it to say it. */
  desk: string | null
  checkIn: CheckInReading | null
}

const DAY_MINUTES = 24 * 60

/** Trains and buses are boarded, the rest is checked in for (`CHECK_IN_MINUTES`). */
const BOARDED = new Set(['train', 'bus'])
const SAILS = new Set(['ferry', 'cruise'])

/** Which of the three timetable sentences a ride takes: they differ in the verb and the word for the check-in. */
function sentenceOf(type: string): 'Flight' | 'Ship' | 'Boarding' {
  if (BOARDED.has(type)) return 'Boarding'
  return SAILS.has(type) ? 'Ship' : 'Flight'
}

/** Minutes from the card's midnight as a clock, in the timetable's "+1" form past it. */
function clockOf(minutes: number, is12h: boolean): string {
  const days = Math.floor(minutes / DAY_MINUTES)
  const clock = formatClockTime(formatClock(minutes), is12h)
  return days > 0 ? `${clock}+${days}` : clock
}

function rideEnd(stop: RoadtripStop, entry: ScheduleEntry | undefined, t: TranslationFn, is12h: boolean): RideEnd {
  const carrier = stop.carrier!
  const place = stripAirportCode(stop.name)
  const clock = carrier.at ? formatClockTime(carrier.at, is12h) : null
  // German, among others, has a word of its own for a plane leaving.
  const key = carrier.role === 'departure' && carrier.type === 'flight' ? 'roadtrip.ride.departureFlight' : `roadtrip.ride.${carrier.role}`
  return {
    code: carrier.code,
    place,
    chip: carrier.code ?? place,
    placeLine: carrier.code && carrier.code !== place ? place : null,
    clock,
    dayOffset: entry?.dayOffset ?? 0,
    label: clock ? t(key, { time: clock }) : null,
  }
}

/**
 * The check-in against the drive, read off the departure's pin and the schedule's `late`
 * finding at it: the pin is the timetable minus the check-in (`terminalStop`), and the
 * finding is how far past the pin the chain gets there.
 */
function checkInOf(
  departure: RoadtripStop,
  warnings: readonly ScheduleWarning[],
  t: TranslationFn,
  is12h: boolean,
): CheckInReading | null {
  const carrier = departure.carrier
  if (carrier?.role !== 'departure') return null
  const departs = parseClock(carrier.at)
  const pinned = parseClock(departure.time)
  if (departs === null || pinned === null) return null
  const late = warnings.find(w => w.code === 'late')
  const sentence = sentenceOf(carrier.type)
  const word = t(sentence === 'Boarding' ? 'roadtrip.ride.boarding' : 'roadtrip.ride.checkIn')
  const pin = clockOf(pinned, is12h)
  const facts = { title: carrier.title, departs: clockOf(departs, is12h), pin }
  if (!late) return { state: 'ok', lead: word, value: pin, hint: t(`roadtrip.ride.hint${sentence}`, facts) }

  const reach = pinned + (late.minutes ?? 0)
  const time = clockOf(reach, is12h)
  const hint = t(`roadtrip.ride.lateHint${sentence}`, { ...facts, place: stripAirportCode(departure.name), time })
  if (reach > departs) return { state: 'missed', lead: t('roadtrip.ride.missed'), value: t('roadtrip.ride.reachedAt', { time }), hint }
  return { state: 'tight', lead: word, value: t('roadtrip.ride.lateBy', { time: formatDurationShort((reach - pinned) * 60) }), hint }
}

/**
 * A ride that leaves and lands on the same day, as its block reads it: the booking, its
 * minutes, both ends and the check-in with whatever the drive makes of it.
 */
export function rideReading(
  ride: {
    departure: RoadtripStop
    arrival: RoadtripStop
    entries: readonly [ScheduleEntry | undefined, ScheduleEntry | undefined]
    /** The schedule's findings at the departure. */
    warnings: readonly ScheduleWarning[]
    seg: RouteSegment | undefined
  },
  t: TranslationFn,
  is12h: boolean,
): RideReading {
  return {
    title: ride.departure.carrier!.title,
    duration: rideDuration(ride.seg),
    from: rideEnd(ride.departure, ride.entries[0], t, is12h),
    to: rideEnd(ride.arrival, ride.entries[1], t, is12h),
    checkIn: checkInOf(ride.departure, ride.warnings, t, is12h),
  }
}

/** A terminal on a row of its own, its ride landing on another day, or a hire car's desk. */
export function terminalReading(
  stop: RoadtripStop,
  entry: ScheduleEntry | undefined,
  warnings: readonly ScheduleWarning[],
  t: TranslationFn,
  is12h: boolean,
): TerminalReading {
  const role = stop.carrier!.role
  return {
    end: rideEnd(stop, entry, t, is12h),
    desk: role === 'pickup' || role === 'return' ? t(`reservations.span.${role}`) : null,
    checkIn: checkInOf(stop, warnings, t, is12h),
  }
}

/**
 * The first ride of the day the drive reaches too late to catch, as the day's header names
 * it, so a folded day still says so. Null while every ride is caught.
 */
export function missedRide(
  day: Pick<RoadtripDay, 'stops' | 'schedule'>,
  t: TranslationFn,
  is12h: boolean,
): { label: string; hint: string } | null {
  for (let i = 0; i < day.stops.length; i++) {
    const stop = day.stops[i]!
    const checkIn = checkInOf(stop, day.schedule.warnings.filter(w => w.index === i), t, is12h)
    if (checkIn?.state !== 'missed') continue
    const type = (CARRIER_TYPES as readonly string[]).includes(stop.carrier!.type) ? stop.carrier!.type : 'flight'
    return { label: t(`roadtrip.day.rideMissed.${type}`), hint: checkIn.hint }
  }
  return null
}

/**
 * Whether a booking chip opens for this reader. A transport has a detail view anybody
 * may look at; a table or a ticket has only its editor, the split the planner page makes
 * when it opens one. Without the right to edit bookings the chip stays a plain chip,
 * the way the place inspector's booking strip stays inert (#2012).
 */
export function bookingOpens(booking: Pick<Reservation, 'type'>, canEditBookings: boolean): boolean {
  return TRANSPORT_TYPES.has(booking.type) || canEditBookings
}
