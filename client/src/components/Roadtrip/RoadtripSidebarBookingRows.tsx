import React from 'react'
import { AlertTriangle, Clock, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatClockTime } from '../../utils/formatters'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import type { BookendReading } from './roadtripRowModel'
import { BOOKEND_DISC, BOOKEND_ICON, bookendBadge } from './nightBookend'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { Reservation, RouteSegment } from '../../types'
import { bookingOpens, carrierIcon, rideReading, terminalReading, type CheckInReading, type RideEnd } from './carrierRide'
import FigureBadge from './FigureBadge'
import { bookingClock, bookingIcon } from './stopBookings'
import { FS } from './typeScale'
import { DISC, RAIL_GRID } from './RoadtripSidebar.constants'
import { Arrival, DayCarry, DriveFindingBadge, LateBadge } from './RoadtripSidebarBadges'

/** The rail's dash laid on its side: the ride between two terminals, drawn like a leg. */
const RIDE_DASH: React.CSSProperties = {
  height: 1.5,
  backgroundImage: 'repeating-linear-gradient(90deg, var(--border-primary) 0 4px, transparent 4px 8px)',
}

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
export function TerminalStop({ stop, entry, late, continues, starts, onOpen }: {
  stop: RoadtripStop
  entry: ScheduleEntry | undefined
  late: ScheduleWarning[]
  continues: boolean
  starts?: boolean
  onOpen?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const { end, desk, checkIn } = terminalReading(stop, entry, late, t, is12h)
  const place = <span className="min-w-0 truncate font-semibold text-content" style={{ fontSize: FS.name }}>{end.place}</span>
  return (
    <DiscRow Icon={carrierIcon(stop.carrier!.type)} starts={starts} continues={continues} onOpen={onOpen} opens={onOpen ? t('roadtrip.ride.open') : undefined}>
      <span className="flex min-w-0 items-start gap-2 rounded-lg px-1.5 pb-1 pt-0.5 transition-colors group-hover:bg-surface-hover">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5 leading-6">
            {end.code ? <CodeChip text={end.code} /> : null}
            {onOpen ? <Tooltip label={t('roadtrip.ride.open')}>{place}</Tooltip> : place}
          </span>
          {desk || checkIn ? (
            <span className="flex flex-wrap items-center gap-1">
              {desk ? <span className="text-content-muted" style={{ fontSize: FS.meta }}>{desk}</span> : null}
              {checkIn ? <CheckInBadge checkIn={checkIn} /> : null}
            </span>
          ) : null}
        </span>
        {end.clock ? <TimetableClock end={end} className="leading-6" /> : entry?.arrival ? <Arrival entry={entry} /> : null}
      </span>
    </DiscRow>
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
              lead={badge.warning ? <><AlertTriangle size={9} aria-hidden />{badge.lead}</> : badge.lead}
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

/** A terminal's code, or the name of one without it, in the chip the ride's ends stand in. */
function CodeChip({ text }: { text: string }): React.ReactElement {
  return (
    <span
      className="block h-[16px] min-w-0 max-w-[9rem] shrink-0 truncate rounded border border-edge bg-surface-card px-1 font-geist font-semibold leading-[14px] text-content"
      style={{ fontSize: FS.label }}
    >
      {text}
    </span>
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
        className={`shrink-0 whitespace-nowrap font-semibold tabular-nums text-content-secondary ${className}`}
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
      lead={warning ? <><AlertTriangle size={9} aria-hidden />{checkIn.lead}</> : checkIn.lead}
      value={checkIn.value}
      tooltip={checkIn.hint}
    />
  )
}

/**
 * A ride that leaves and lands on the same day, as one thing in the chain. One block on
 * one disc rather than three rows, because it IS one thing, a flight, and three rows read
 * as three places the day went to.
 *
 * Four lines, each fact once: the booking; the two codes with their timetable clocks and
 * the ride drawn between them as a leg; the places; and the check-in, which carries the
 * finding when the drive gets there late, beside the minutes the ride takes. A ride the
 * drive cannot catch edges the block in the warning colour. The whole block opens the
 * booking; the road resumes below it as usual.
 */
export function RideBlock({ departure, arrival, entries, late, seg, continues, starts, onOpen }: {
  departure: RoadtripStop
  arrival: RoadtripStop
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
  const title = <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={{ fontSize: FS.meta }}>{ride.title}</span>
  return (
    <DiscRow Icon={carrierIcon(departure.carrier!.type)} starts={starts} continues={continues} onOpen={onOpen} opens={onOpen ? t('roadtrip.ride.open') : undefined}>
      <span
        className={`my-0.5 flex min-w-0 flex-col gap-1 rounded-lg border bg-surface-tertiary px-2 pb-1.5 pt-1 transition-colors group-hover:bg-surface-selected ${
          ride.checkIn?.state === 'missed' ? 'border-warning' : 'border-edge-faint'
        }`}
      >
        <span className="flex min-w-0 items-center">
          {onOpen ? <Tooltip label={t('roadtrip.ride.open')}>{title}</Tooltip> : title}
        </span>
        <span className="grid min-w-0 items-center gap-1.5" style={{ gridTemplateColumns: 'auto auto minmax(12px, 1fr) auto auto' }}>
          <CodeChip text={ride.from.chip} />
          {ride.from.clock ? <TimetableClock end={ride.from} /> : <span />}
          <span style={RIDE_DASH} aria-hidden />
          {ride.to.clock ? <TimetableClock end={ride.to} /> : <span />}
          <CodeChip text={ride.to.chip} />
        </span>
        {ride.from.placeLine || ride.to.placeLine ? (
          <span className="flex min-w-0 justify-between gap-2 text-content-muted" style={{ fontSize: FS.meta }}>
            <span className="min-w-0 truncate">{ride.from.placeLine}</span>
            <span className="min-w-0 truncate text-end">{ride.to.placeLine}</span>
          </span>
        ) : null}
        {ride.checkIn || ride.duration ? (
          <span className="flex flex-wrap items-center gap-1">
            {ride.checkIn ? <CheckInBadge checkIn={ride.checkIn} /> : null}
            {ride.duration ? (
              <FigureBadge lead={<Clock size={9} aria-hidden />} value={ride.duration} tooltip={t('roadtrip.ride.duration')} />
            ) : null}
          </span>
        ) : null}
      </span>
    </DiscRow>
  )
}

/**
 * The bookings a stop carries, under its row: the table, the tickets, the tour, each a
 * chip with the booking panel's icon, its name and the clock it starts at. Chips because
 * a booking is a fact about the stop, not a stop of its own: the count, the numbering
 * and the drive are none the different for it. Each opens its booking.
 *
 * Under the stop's button rather than inside it, because a button cannot hold buttons.
 * The rail keeps its line through the row so the chain reads unbroken.
 */
export function BookingChips({ bookings, continues, canEdit, onOpen }: {
  bookings: Reservation[]
  continues: boolean
  /** Whether a table's or a ticket's editor opens for this reader; see `bookingOpens`. */
  canEdit: boolean
  onOpen?: (reservationId: number) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  return (
    <div className="grid" style={RAIL_GRID}>
      <span className="flex flex-col items-center" aria-hidden>
        {continues ? <span className="w-[1.5px] flex-1 rounded-sm bg-edge" /> : null}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1 px-1.5 pb-1.5">
        {bookings.map(r => {
          const Icon = bookingIcon(r.type)
          const clock = bookingClock(r)
          const body = (
            <>
              <Icon size={10} strokeWidth={2} className="shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{r.title}</span>
              {clock ? <span className="shrink-0 font-medium tabular-nums text-content-faint">{formatClockTime(clock, is12h)}</span> : null}
            </>
          )
          const chip = 'inline-flex h-[20px] max-w-full items-center gap-1 rounded-md border border-edge bg-surface-card px-1.5 text-content-secondary'
          return onOpen && bookingOpens(r, canEdit) ? (
            <Tooltip key={r.id} label={t('roadtrip.ride.open')}>
              <button
                type="button"
                onClick={() => onOpen(r.id)}
                className={`${chip} transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                style={{ fontSize: FS.meta }}
              >
                {body}
              </button>
            </Tooltip>
          ) : (
            <span key={r.id} className={chip} style={{ fontSize: FS.meta }}>{body}</span>
          )
        })}
      </div>
    </div>
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
