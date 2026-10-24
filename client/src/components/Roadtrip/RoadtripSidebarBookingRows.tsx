import React from 'react'
import { AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatClockTime } from '../../utils/formatters'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import type { BookendReading } from './roadtripRowModel'
import { BOOKEND_DISC, BOOKEND_ICON, bookendBadge } from './nightBookend'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { Reservation, RouteSegment } from '../../types'
import { bookingOpens, rideReading, terminalReading, type CheckInReading, type RideEnd } from './carrierRide'
import FigureBadge from './FigureBadge'
import { tintOf } from '../Planner/planParts'
import { typeInfo } from '../Planner/bookings/bookingsModel'
import { bookingClock, bookingIcon } from './stopBookings'
import { FS } from './typeScale'
import { DISC, RAIL_GRID } from './RoadtripSidebar.constants'
import { Arrival, DayCarry, DriveFindingBadge, LateBadge } from './RoadtripSidebarBadges'

/**
 * One end of a ride on a row of its own: a terminal whose ride lands on another day, or a
 * hire car's desk.
 *
 * No number, no stay, no kind picker and no drag handle: it is not a stop anybody chose
 * and cannot be moved or turned into anything, it is where the booking puts the
 * traveller. Built from the ride block's pieces: the code, the place, the timetable's clock
 * on the right, and on a departure the check-in with whatever the drive makes of it. A desk
 * has no other end beside it, so it says which one it is. The whole row opens the booking.
 */
export function TerminalStop({ stop, booking, entry, late, continues, starts, onOpen }: {
  stop: RoadtripStop
  /** The booking the terminal belongs to, for its type colour and title. */
  booking?: Reservation
  entry: ScheduleEntry | undefined
  late: ScheduleWarning[]
  continues: boolean
  starts?: boolean
  onOpen?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const { end, desk, checkIn } = terminalReading(stop, entry, late, t, is12h)
  return (
    <TransportCard
      type={booking?.type ?? stop.carrier!.type}
      title={booking?.title ?? end.place}
      clock={end.clock ? <TimetableClock end={end} /> : entry?.arrival ? <Arrival entry={entry} /> : null}
      checkIn={checkIn?.state === 'ok' ? checkIn : null}
      starts={starts}
      continues={continues}
      onOpen={onOpen}
    >
      {desk ? <FigureBadge caption lead={desk} /> : end.code ? <FigureBadge caption lead={end.code} /> : null}
    </TransportCard>
  )
}

/**
 * A booking on the rail drawn the way the day plan draws it: a card in the type's colour
 * with the booking's title and its time and phase as the day plan's pills. Its icon sits
 * on the line in the disc a stop's number takes, so the chain reads stop, ride, stop in
 * one column.
 */
function TransportCard({ type, title, clock, checkIn, starts, continues, onOpen, warn, children }: {
  type: string
  title: string
  /** The time on the right, in the column every stop's arrival reads down. */
  clock?: React.ReactNode
  /** The check-in, as the last pill of the row. */
  checkIn?: CheckInReading | null
  starts?: boolean
  continues: boolean
  onOpen?: () => void
  /** The ride is missed: the card takes the warning edge. */
  warn?: boolean
  children?: React.ReactNode
}): React.ReactElement {
  const { t } = useTranslation()
  const info = typeInfo(type)
  const color = info.color
  const pills = React.Children.toArray(children).filter(Boolean)
  return (
    <div className="grid" style={RAIL_GRID}>
      <span className="flex flex-col items-center" aria-hidden>
        <span className={`w-[1.5px] flex-1 rounded-sm ${starts ? '' : 'bg-edge'}`} />
        <span className={`${DISC} my-1 bg-surface-tertiary text-content-secondary`}>
          <info.Icon size={13} strokeWidth={2} />
        </span>
        <span className={`w-[1.5px] flex-1 rounded-sm ${continues ? 'bg-edge' : ''}`} />
      </span>
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        onMouseEnter={e => { e.currentTarget.style.background = tintOf(color, 12) }}
        onMouseLeave={e => { e.currentTarget.style.background = tintOf(color, 7) }}
        className="my-0.5 flex min-w-0 flex-col gap-0.5 rounded-xl px-2 pb-1 pt-0.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default"
        style={{ background: tintOf(color, 7), border: `1px solid ${warn ? 'var(--warning)' : tintOf(color, 24)}` }}
      >
        {/* The name in the stop size with the clock on the right in the arrival column,
            and under both the facts as pills across the whole card. */}
        <span className="flex w-full min-w-0 items-start gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold leading-6 tracking-[-0.012em] text-content" style={{ fontSize: FS.name }}>
            {title}
          </span>
          {clock}
        </span>
        {pills.length || checkIn ? (
          <span className="flex w-full min-w-0 flex-nowrap items-center gap-1 pb-0.5">
            {pills}
            {checkIn ? <CheckInBadge checkIn={checkIn} /> : null}
          </span>
        ) : null}
        {onOpen ? <span className="sr-only">{t('roadtrip.ride.open')}</span> : null}
      </button>
    </div>
  )
}

/**
 * A row of the rail that is one button on a disc: a terminal, a ride, a booked night.
 * The line runs in from above unless the chain starts here, and on below while it goes on.
 *
 * What pressing it does is said after the row's own content rather than instead of it: an
 * aria-label on the button would be all a screen reader heard, and a ride block holds the
 * clocks and the warning somebody needs to hear first.
 */
function DiscRow({ Icon, face, starts, continues, onOpen, opens, children }: {
  Icon: LucideIcon
  /** The disc's own colours, for a row that stands for something with a face of its own. */
  face?: React.CSSProperties
  starts?: boolean
  continues: boolean
  onOpen?: () => void
  opens?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className="group grid w-full rounded-lg text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-default"
      style={RAIL_GRID}
    >
      <span className="flex flex-col items-center">
        {starts ? null : <span className="w-[1.5px] flex-1 rounded-sm bg-edge" aria-hidden />}
        <span className={`${DISC} my-1 ${face ? '' : 'bg-surface-tertiary text-content-secondary'}`} style={face}>
          <Icon size={13} strokeWidth={2} aria-hidden />
        </span>
        {continues ? <span className="w-[1.5px] flex-1 rounded-sm bg-edge" aria-hidden /> : null}
      </span>
      {children}
      {opens ? <span className="sr-only">{opens}</span> : null}
    </button>
  )
}

/**
 * A booked night at the edge of the day: the hotel the day sets out from, or the one it
 * ends at (`seatNightBookends`).
 *
 * On the hotel stop's own disc, so the same hotel wears one face whether the day checks
 * in, sets out from it or comes back to it. Otherwise flat, with no number, stay, kind
 * picker or drag handle: it is the stay's place and no stop of the day, so nothing about it
 * is changed here. Under its line the latest hour the room is handed back, on the morning
 * it is, and whatever the drive into it runs over; on the right the time the chain has the
 * traveller there. The whole row opens the booking behind the night, or the hotel's place
 * when there is none to open.
 */
export function BookendStop({ reading, entry, late, driveFindings, continues, starts, onOpen }: {
  reading: BookendReading
  entry: ScheduleEntry | undefined
  late: ScheduleWarning[]
  driveFindings: ScheduleWarning[]
  continues: boolean
  starts?: boolean
  onOpen?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const badge = bookendBadge(reading, entry, t, is12h)
  return (
    <DiscRow Icon={BOOKEND_ICON} face={BOOKEND_DISC} starts={starts} continues={continues} onOpen={onOpen}>
      <span className="flex min-w-0 items-start gap-2 rounded-lg px-1.5 pb-1 pt-0.5 transition-colors group-hover:bg-surface-hover">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="min-w-0 break-words font-semibold leading-6 tracking-[-0.012em] text-content" style={{ fontSize: FS.name }}>
            {reading.name}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            <FigureBadge
              tone={badge.warning ? 'warning' : 'neutral'}
              caption
              lead={badge.warning ? <><AlertTriangle size={10} aria-hidden />{badge.lead}</> : badge.lead}
              value={badge.value ?? undefined}
              tooltip={badge.hint ?? undefined}
            />
            {driveFindings.map(w => <DriveFindingBadge key={w.code} warning={w} />)}
            {late.map(w => <LateBadge key={w.code} late={w} />)}
          </span>
        </span>
        {entry?.arrival ? <Arrival entry={entry} /> : null}
      </span>
    </DiscRow>
  )
}

/**
 * The timetable's clock at one end of a ride. Weighted like a pinned arrival because the
 * booking fixes it, and named for what it is: the time a clock in this column otherwise
 * means is when the drive arrives.
 */
function TimetableClock({ end, className = '' }: { end: RideEnd; className?: string }): React.ReactElement {
  return (
    <Tooltip label={end.label ?? ''}>
      <span
        dir="ltr"
        className={`shrink-0 whitespace-nowrap font-semibold leading-6 tabular-nums text-content-secondary ${className}`}
        style={{ fontSize: FS.time }}
      >
        <span aria-hidden>{end.clock}</span>
        <DayCarry days={end.dayOffset} />
        <span className="sr-only">{end.label}</span>
      </span>
    </Tooltip>
  )
}

/**
 * The check-in, as one badge that carries its own finding: on time it reads the hour, late
 * it reads by how much, and too late to catch the ride it says so and when the drive gets
 * there. Measured against the pin and set beside the departure's timetable clock, the old
 * "+9 h 39 min" read as a delay to that clock and never said the ride was gone.
 */
function CheckInBadge({ checkIn }: { checkIn: CheckInReading }): React.ReactElement {
  const warning = checkIn.state !== 'ok'
  return (
    <FigureBadge
      tone={warning ? 'warning' : 'neutral'}
      caption
      lead={warning ? <><AlertTriangle size={10} aria-hidden />{checkIn.lead}</> : checkIn.lead}
      value={checkIn.value}
      tooltip={checkIn.hint}
    />
  )
}

/**
 * A ride that leaves and lands on the same day, as one thing in the chain: one card on one
 * disc rather than three rows, because it IS one thing, a flight, and three rows read as
 * three places the day went to. Both timetable clocks sit in the arrival column, the
 * route and the check-in under the title. A ride the drive cannot catch edges the card in
 * the warning colour. The whole card opens the booking; the road resumes below it.
 */
export function RideBlock({ departure, arrival, booking, entries, late, seg, continues, starts, onOpen }: {
  departure: RoadtripStop
  arrival: RoadtripStop
  /** The booking the ride is, for its type colour and title. */
  booking?: Reservation
  entries: [ScheduleEntry | undefined, ScheduleEntry | undefined]
  late: ScheduleWarning[]
  seg: RouteSegment | undefined
  continues: boolean
  starts?: boolean
  onOpen?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const ride = rideReading({ departure, arrival, entries, warnings: late, seg }, t, is12h)
  const clock = ride.from.clock || ride.to.clock ? (
    <Tooltip label={[ride.from.label, ride.to.label].filter(Boolean).join(', ')}>
      <span dir="ltr" className="shrink-0 whitespace-nowrap font-semibold leading-6 tabular-nums text-content-secondary" style={{ fontSize: FS.time }}>
        {ride.from.clock}<DayCarry days={ride.from.dayOffset} />
        {ride.to.clock ? <>{' \u2013 '}{ride.to.clock}<DayCarry days={ride.to.dayOffset} /></> : null}
      </span>
    </Tooltip>
  ) : null
  const places = [ride.from.placeLine ?? ride.from.place, ride.to.placeLine ?? ride.to.place].join(' \u2192 ')
  return (
    <TransportCard
      type={booking?.type ?? departure.carrier!.type}
      title={booking?.title ?? ride.title}
      clock={clock}
      checkIn={ride.checkIn?.state === 'ok' ? ride.checkIn : null}
      starts={starts}
      continues={continues}
      onOpen={onOpen}
    >
      <FigureBadge
        shrink
        caption
        lead={(
          <span dir="ltr" className="flex min-w-0 items-center gap-1">
            <span className="min-w-0 truncate">{ride.from.chip}</span>
            <ArrowRight size={10} strokeWidth={2.2} className="flex-none" aria-hidden />
            <span className="min-w-0 truncate">{ride.to.chip}</span>
          </span>
        )}
        tooltip={places}
      />
    </TransportCard>
  )
}

/**
 * The bookings a stop carries, under its row the way the day plan hangs them under a
 * place: a pill in the status colour with the booking's icon, then its time. A booking
 * is a fact about the stop, not a stop of its own, so it takes no line, no disc and no
 * card. Each pill opens its booking.
 *
 * Under the stop's button rather than inside it, because a button cannot hold buttons.
 */
export function BookingChips({ bookings, continues, canEdit, onOpen }: {
  bookings: Reservation[]
  continues: boolean
  /** Whether a table's or a ticket's editor opens for this reader; see `bookingOpens`. */
  canEdit: boolean
  onOpen?: (reservationId: number) => void
}): React.ReactElement {
  return (
    <div className="grid" style={RAIL_GRID}>
      <span className="flex flex-col items-center" aria-hidden>
        {continues ? <span className="w-[1.5px] flex-1 rounded-sm bg-edge" /> : null}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-1 px-1.5 pb-1.5">
        {bookings.map(r => <ReservationPill key={r.id} booking={r} canEdit={canEdit} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

/**
 * A booking on a stop's badge row: the status colour, the booking's icon and the word,
 * like the day plan's pill under a place, with its time only when that is not already the
 * arrival on the right. A span with the button role, because the stop row around it is a
 * button already.
 */
export function ReservationPill({ booking, arrival, canEdit, onOpen }: {
  booking: Reservation
  /** The stop's arrival as the row prints it, so a time equal to it is not said twice. */
  arrival?: string | null
  canEdit: boolean
  onOpen?: (reservationId: number) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const icon = React.createElement(bookingIcon(booking.type), { size: 10, strokeWidth: 2.2, 'aria-hidden': true })
  const confirmed = booking.status === 'confirmed'
  const status = confirmed ? t('reservations.confirmed') : t('reservations.pending')
  const clock = bookingClock(booking)
  const time = clock ? formatClockTime(clock, is12h) : null
  const shownTime = time && time !== arrival ? time : null
  const open = onOpen && bookingOpens(booking, canEdit) ? () => onOpen(booking.id) : undefined
  // The same pill as the stay and the check-in: the word in capitals, a straight cut, the time.
  return (
    <FigureBadge
      caption
      tone={confirmed ? 'success' : 'pending'}
      lead={<>{icon}{t('places.formReservation')}</>}
      value={shownTime ?? undefined}
      tooltip={`${booking.title} (${status})`}
      onActivate={open ? () => open() : undefined}
      ariaLabel={`${booking.title}, ${status}`}
    />
  )
}

/**
 * The rides the drive leaves out because they are on no day (#2461).
 *
 * The map draws such a booking's arc between its terminals all the same, so without this
 * the ferry looked planned while the rail drove round it by road. One line each, with the
 * booking a click away, since the fix is a date in the booking itself.
 */
export function UndatedRides({ rides, onOpenBooking }: {
  rides: readonly Reservation[]
  onOpenBooking?: (reservationId: number) => void
}): React.ReactElement | null {
  const { t } = useTranslation()
  if (!rides.length) return null
  return (
    <div role="status" className="mx-3.5 mt-2 rounded-xl bg-warning-soft p-3 text-caption text-content">
      <ul className="flex flex-col gap-1.5">
        {rides.map(ride => (
          <li key={ride.id} className="flex items-start gap-2">
            <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
            <span className="min-w-0 flex-1">{t('roadtrip.ride.undated', { title: ride.title })}</span>
            {onOpenBooking ? (
              <button
                type="button"
                onClick={() => onOpenBooking(ride.id)}
                className="shrink-0 font-semibold text-content underline underline-offset-2 hover:text-content-secondary"
              >
                {t('roadtrip.ride.open')}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
