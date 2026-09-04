import React, { useState } from 'react'
import {
  MapPin, CarFront, Footprints, Bike, Zap, AlertTriangle, Moon,
  ParkingSquare, Shuffle, Fuel, Clock,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatDate, formatClockTime } from '../../utils/formatters'
import { formatDurationShort, isServiceStopType, serviceColor, type ScheduleEntry, type ScheduleWarning } from './roadtripModel'
import { STOP_KIND_BY_KEY } from './stopKinds'
import { spurWorthLabelling } from './accessSpur'
import StopKindPicker from './StopKindPicker'
import type { RoadtripStopType } from '@trek/shared'
import type { QuietDay, RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { RouteVia } from '../../types'
import { FS } from './typeScale'
import type { RouteSegment } from '../../types'

interface RoadtripSidebarProps {
  /** Legs and totals for the whole trip, computed once in the planner hook. */
  routes: RoadtripRoutes
  selectedAssignmentId?: number | null
  onSelectStop?: (placeId: number, assignmentId: number) => void
  /**
   * Moves a stop within its day. Absent means the chain is read-only, which is also how
   * a viewer sees it — no handles, no drop targets.
   */
  onReorderStop?: (dayId: number, assignmentId: number, toIndex: number) => void
  /** Moves a stop onto a different day. Absent means moves stay inside their own day. */
  onMoveStopToDay?: (fromDayId: number, assignmentId: number, toDayId: number, toIndex: number) => void
  /** Asks for other ways of driving one leg (#1797). */
  onAskAlternatives?: (dayId: number, legIndex: number) => void
  /** Which leg's alternatives are on show, so the rail can mark it. */
  openAlternatives?: { dayId: number; index: number } | null
  /**
   * Opens the dialog for how long a stop takes. Absent leaves every stay read-only —
   * which is also what a viewer sees.
   */
  onEditStay?: (stop: { placeId: number; name: string; minutes: number | null; arrival: string | null }) => void
  /**
   * Turns a stop into a pause on the drive, or back into a destination.
   *
   * Absent leaves every disc read-only, which is also what a viewer sees.
   */
  onSetStopKind?: (placeId: number, kind: RoadtripStopType | null) => Promise<void> | void
}

const MODE_ICON: Record<string, LucideIcon> = {
  driving: CarFront,
  walking: Footprints,
  cycling: Bike,
}

// Icon and name both come from the one stop-kind table now. This file used to keep its
// own copy of each, and its rest_area icon had drifted away from the popup's.


/** The column the markers and the line share, and the gap to the content beside it. */
const RAIL_GRID: React.CSSProperties = { gridTemplateColumns: '24px 1fr', columnGap: 10 }

/**
 * The line between two stops.
 *
 * A repeating gradient rather than a dashed border: a 1px dashed border renders as a
 * smear at this width, and the gradient keeps the dash length exact.
 */
const RAIL_DASH: React.CSSProperties = {
  width: 1.5,
  backgroundImage: 'repeating-linear-gradient(var(--border-primary) 0 4px, transparent 4px 8px)',
}

/** A 24px disc — a stop's number, or a service stop's icon. */
const DISC = 'grid h-6 w-6 shrink-0 place-items-center rounded-full'

/**
 * The small capitalised caption over a number, and the badges in a day's header.
 *
 * Wide letter-spacing and uppercase rather than a size change: the labels have to stay
 * legible at a third of the column's width in 23 languages, and shrinking them further
 * was what made "Driving time" unreadable before it was ever clipped.
 */
const STAT_LABEL = 'font-geist font-semibold uppercase tracking-[0.15em] text-content-faint'

/**
 * A day-header badge: the date, the drive, the count.
 *
 * Medium weight in the quiet ink, not semibold in the strong one. Three uppercase badges
 * with wide tracking already carry as much emphasis as a line can take; adding weight and
 * contrast on top made the day's supporting facts shout louder than the day's own name.
 */
const DAY_BADGE = 'inline-flex h-[20px] items-center rounded-lg px-2 font-geist font-medium uppercase tracking-[0.09em] text-content-muted'

/**
 * How long the traveller stays here, and the way to change it.
 *
 * On every stop, not only the ones that already carry a time: the value has never been
 * editable anywhere in TREK, so a stop that has none needs somewhere to say so before it
 * can get one. Unset it reads as a plus in the slot the number will occupy, which keeps
 * the two states the same shape and the same width — a row does not jump when a stay is
 * added to it.
 *
 * Read-only for someone who cannot edit the trip: then it is a label, and a stop without
 * a stay shows nothing at all rather than an invitation that leads nowhere.
 */
/**
 * How far the road stops short of the place, in the same two-part shell the stay wears.
 *
 * Beside the stay rather than under it: both answer "what does this stop cost you", one
 * in time and one in a walk, and two badges on one line read as one fact about the stop
 * instead of two unrelated notes stacked up.
 */
function OffRoadBadge({ meters }: { meters: number }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  return (
    <Tooltip label={t('roadtrip.stop.offRoad', { distance: formatDistance(meters / 1000, distanceUnit) })}>
      <span className="inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-edge">
        <span
          className="flex items-center bg-surface-tertiary px-1 text-content-faint"
          style={{ fontSize: FS.micro }}
        >
          <Footprints size={9} aria-hidden />
        </span>
        <span
          className="flex items-center border-s border-edge bg-surface-card px-1.5 font-semibold tabular-nums text-content-secondary"
          style={{ fontSize: FS.label }}
        >
          {formatDistance(meters / 1000, distanceUnit)}
        </span>
      </span>
    </Tooltip>
  )
}

function StayBadge({ minutes, onEdit }: { minutes: number | null; onEdit?: () => void }): React.ReactElement | null {
  const { t } = useTranslation()
  const text = minutes ? formatDurationShort(minutes * 60) : null
  if (!text && !onEdit) return null

  const shell = 'inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-edge'
  const label = (
    <span
      className="flex items-center bg-surface-tertiary px-1 font-geist font-semibold uppercase tracking-[0.12em] text-content-faint"
      style={{ fontSize: FS.micro }}
    >
      {t('roadtrip.stop.stayShort')}
    </span>
  )
  const value = (
    <span
      className={`flex items-center border-s border-edge bg-surface-card px-1.5 font-semibold tabular-nums ${
        text ? 'text-content-secondary' : 'text-content-faint'
      }`}
      style={{ fontSize: FS.label }}
    >
      {text ?? '+'}
    </span>
  )

  if (!onEdit) return <span className={shell}>{label}{value}</span>
  // A span carrying the button role, not a <button>: the whole stop row is already one,
  // and a button inside a button is invalid HTML that React warns about and that browsers
  // resolve by dropping the inner element.
  return (
    <Tooltip label={t('roadtrip.stop.stay')}>
      <span
        role="button"
        tabIndex={0}
        // Stops the click reaching the row, which would select the stop and move the map
        // out from under the dialog that is about to open.
        onClick={e => { e.stopPropagation(); onEdit() }}
        onKeyDown={e => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          onEdit()
        }}
        aria-label={text ? `${t('roadtrip.stop.stay')}: ${text}` : t('roadtrip.stay.add')}
        className={`${shell} cursor-pointer transition-colors hover:border-content-faint`}
      >
        {label}{value}
      </span>
    </Tooltip>
  )
}

/** The quiet half of a measurement — the unit, and anything after the decimal point. */
function Unit({ children }: { children: React.ReactNode }): React.ReactElement {
  return <span className="font-medium text-content-muted" style={{ fontSize: FS.totalUnit }}>{children}</span>
}

/**
 * Sets the whole numbers of a measurement apart from everything else in it.
 *
 * "691.6 km" reads as six-hundred-and-ninety-one, roughly; "9 h 4 min" as nine and four.
 * Those are the digits worth the size, and the decimal tail belongs with the unit rather
 * than with them. Purely presentational and deliberately forgiving: a bare count comes
 * back as one big number, and a language that puts its unit first still splits correctly
 * because the split is driven by the digits, not by position.
 */
function splitValue(value: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /(\d+)([.,]\d+)?/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) parts.push(<Unit key={key++}>{value.slice(last, m.index)}</Unit>)
    parts.push(<React.Fragment key={key++}>{m[1]}</React.Fragment>)
    if (m[2]) parts.push(<Unit key={key++}>{m[2]}</Unit>)
    last = m.index + m[0].length
  }
  if (last < value.length) parts.push(<Unit key={key}>{value.slice(last)}</Unit>)
  return parts.length ? parts : value
}

/**
 * Distance, driving time and stops for the whole trip — the head the left column never
 * had, above the day cards and reading as one card with them.
 *
 * Three equal centred columns with hairlines between them, rather than three labelled
 * rows: the labels are the quiet part and the numbers are what the head exists for, so
 * the numbers get the size and the labels get the letter-spacing.
 */
function TripSummary({ routes }: { routes: RoadtripRoutes }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const cells: [string, string][] = [
    // `totalStops` already leaves the service stops out, so the head and the day badges
    // below count the same thing without either of them recounting the other's stops.
    [t('roadtrip.summary.distance'), formatDistance(routes.totalDistance / 1000, distanceUnit)],
    [t('roadtrip.summary.driving'), formatDurationShort(routes.totalDuration)],
    [t('roadtrip.summary.stops'), String(routes.totalStops)],
  ]
  return (
    <header className="mx-3.5 rounded-2xl border border-edge-faint bg-surface-card px-3 pb-3 pt-3.5">
      <div className="flex items-center justify-between text-center">
        {cells.map(([label, value], i) => (
          <React.Fragment key={label}>
            {i > 0 ? <span className="h-[28px] w-px shrink-0 bg-edge-faint" aria-hidden /> : null}
            <div className="flex flex-1 flex-col items-center gap-1.5 px-1">
              <span className={STAT_LABEL} style={{ fontSize: FS.label }}>{label}</span>
              <span
                className="font-semibold leading-none tracking-[-0.03em] tabular-nums text-content"
                style={{ fontSize: FS.total }}
              >
                {splitValue(value)}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {/* Legs land one request at a time, so until the last is in, every number above is
          a partial sum. A total that looks final and is not is worse than a slow one. */}
      {routes.loading ? (
        <p className="mt-2 break-words text-center text-content-faint" style={{ fontSize: FS.meta }}>
          {t('roadtrip.summary.partial')}
        </p>
      ) : null}
    </header>
  )
}

/**
 * The drive between two stops — or between a stop and the charger halfway along it.
 *
 * Both numbers are rebuilt from the raw metres and seconds instead of the router's
 * pre-formatted strings: those spell a full hour "1 h 0 min", and they carry whichever
 * unit the leg was fetched with, so a km/mi switch showed stale text until the refetch
 * landed. One sentence rather than two values — "152 km in 1 h 38 min" is how the
 * distance and the time belong together, and it leaves the row's right edge for the
 * button instead of a second number.
 */
function DriveBand({ leg, onAskAlternatives, alternativesOpen }: {
  leg: RouteSegment | undefined
  /** Asks for other ways of driving this leg. Absent means the route is not editable. */
  onAskAlternatives?: () => void
  alternativesOpen?: boolean
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const mode = leg?.mode ?? 'driving'
  const Icon = mode.startsWith('plugin:') ? Zap : MODE_ICON[mode] ?? CarFront
  // The band's contents, shared by the clickable and the read-only shape so the two can
  // never drift apart in what they say.
  const band = (
    <>
      <Icon size={12} strokeWidth={1.7} className="shrink-0" aria-hidden />
      <span className="min-w-0 truncate font-medium tabular-nums" style={{ fontSize: FS.meta }}>
        {leg
          ? t('roadtrip.leg.driveText', {
            distance: formatDistance(leg.distance / 1000, distanceUnit),
            time: formatDurationShort(leg.duration),
          })
          : t('roadtrip.leg.pending')}
      </span>
    </>
  )
  return (
    <div className="grid" style={RAIL_GRID}>
      <span className="relative z-[1] flex flex-col items-center" aria-hidden>
        {/* Dashed between stops, solid at them: the eye reads the gap as travel. */}
        <span className="flex-1" style={RAIL_DASH} />
      </span>
      <div className="min-w-0">
        {/* The whole band is the target, not the 18px square at its end. Asking for other
            ways of driving a leg is what the band is for, and a click anywhere on it is
            the gesture people try first — the shuffle mark stays as the sign that it can
            be clicked, and as where the open state shows. */}
        {onAskAlternatives && leg ? (
          <Tooltip label={t('roadtrip.alt.ask')}>
          <button
            type="button"
            onClick={onAskAlternatives}
            aria-pressed={alternativesOpen}
            className={`group/leg my-1.5 flex w-full items-center gap-1.5 rounded-lg py-1 pe-1 ps-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
              alternativesOpen
                ? 'bg-surface-selected text-content'
                : 'bg-surface-tertiary text-content-muted hover:bg-surface-selected'
            }`}
          >
            {band}
            {/* The open leg darkens its ink, not its box. A filled accent square here put
                a black chip in the middle of a rail whose only other filled thing is
                nothing at all — it read as a button that had been pressed and stuck. */}
            <span
              className={`ms-auto grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md transition-colors ${
                alternativesOpen ? 'text-content' : 'text-content-faint group-hover/leg:text-content'
              }`}
            >
              <Shuffle size={12} strokeWidth={1.9} aria-label={t('roadtrip.alt.ask')} />
            </span>
          </button>
          </Tooltip>
        ) : (
          <div className="my-1.5 flex items-center gap-1.5 rounded-lg bg-surface-tertiary py-1 pe-2 ps-2 text-content-muted">
            {band}
          </div>
        )}
        {/* What a plugin route attached to this leg ("25 min charge"): free text, so it
            takes a line of its own rather than being forced into the row above. */}
        {leg?.noteText ? (
          <p className="-mt-0.5 mb-1.5 break-words px-1 text-content-faint" style={{ fontSize: FS.meta }}>
            {leg.noteText}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A charger, a filling station or a rest stop — a stop that interrupts the drive.
 *
 * It sits inside the leg with the dashed line running through it, carries no number and
 * is left out of every count, because that is the difference between it and the places
 * the trip is actually for. Its own icon on one flat disc: three kinds of pause that all
 * mean "we are still driving", and the icon is what tells them apart.
 */
function ServiceStop({ stop, entry, driveFindings, selected, onSelect, onEditStay, onPickKind }: {
  stop: RoadtripStop
  entry: ScheduleEntry | undefined
  /** Findings about the drive that ARRIVES here. A charging halt is a stop like any other
   *  as far as the tank is concerned, so it carries them the same way a numbered one does. */
  driveFindings?: ScheduleWarning[]
  /** Opens the kind picker on the disc. Absent leaves the rail read-only. */
  onPickKind?: (anchor: HTMLElement) => void
  selected: boolean
  onSelect?: () => void
  /** Opens the dialog for how long this pause takes. Absent means the rail is read-only. */
  onEditStay?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const kind = STOP_KIND_BY_KEY[stop.stopType ?? '']
  const Icon = kind?.Icon ?? ParkingSquare
  const label = t(kind?.labelKey ?? 'roadtrip.poi.rest')
  return (
    <div className="grid items-stretch" style={RAIL_GRID}>
      <span className="relative z-[1] flex flex-col items-center">
        <span className="flex-1" style={RAIL_DASH} aria-hidden />
        {onPickKind ? (
          // The same control the other way round: the disc says what this is, and it is
          // also where it stops being that.
          <Tooltip label={t('roadtrip.stop.changeKind')}>
            <span
              role="button"
              tabIndex={0}
              aria-label={t('roadtrip.stop.changeKind')}
              onClick={e => { e.stopPropagation(); onPickKind(e.currentTarget as HTMLElement) }}
              onKeyDown={e => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                e.stopPropagation()
                onPickKind(e.currentTarget as HTMLElement)
              }}
              className={`${DISC} cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
              // theme-lint-disable — the road-signage palette in `roadtripModel`, shared
              // with the corridor list and the map pin so one kind of stop looks like
              // itself wherever it turns up.
              style={{ background: serviceColor(stop.stopType), color: '#fff' }}
            >
              <Icon size={12} strokeWidth={2.1} aria-hidden />
            </span>
          </Tooltip>
        ) : (
          <span
            className={DISC}
            // theme-lint-disable — same palette, read-only.
            style={{ background: serviceColor(stop.stopType), color: '#fff' }}
          >
            <Icon size={12} strokeWidth={2.1} aria-label={label} />
          </span>
        )}
        <span className="flex-1" style={RAIL_DASH} aria-hidden />
      </span>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        // The same inset as a numbered stop's content, so the two kinds of name start on
        // one vertical line instead of the service one sitting a few pixels nearer the rail.
        className={`flex min-w-0 items-start gap-2 rounded-lg px-1.5 pb-1 pt-0.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
          selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'
        }`}
      >
        {/* Laid out exactly like a numbered stop: how long the pause takes is a stay like
            any other and sits under the name, and the right edge stays the arrival column
            all the way down the rail. Only the disc says this one is a pause. */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Truncated, not wrapped: a service stop is a waypoint, and its full name lives
              on the map pin — where a place's name is the row's whole reason to exist. */}
          <span
            className="min-w-0 truncate font-semibold leading-6 tracking-[-0.012em] text-content-secondary"
            style={{ fontSize: FS.name }}
          >
            {stop.name}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            <StayBadge minutes={stop.dwellMinutes} onEdit={onEditStay} />
            {spurWorthLabelling(stop.offRoadMeters) ? <OffRoadBadge meters={stop.offRoadMeters ?? 0} /> : null}
            {(driveFindings ?? []).map(w => <DriveFindingBadge key={w.code} warning={w} />)}
          </span>
        </span>
        {entry?.arrival ? <Arrival entry={entry} /> : null}
      </button>
    </div>
  )
}

/**
 * A halt a routing plugin put on this leg, such as a charge on the way.
 *
 * Read-only, and that is the point rather than a shortcut. The halt belongs to the
 * provider, not to the traveller: it is not a place in the database, it has no number, no
 * editable stay and no arrival time. Writing it back would send it out as a waypoint on
 * the next run, and the plugin would then plan around its own charging stop.
 *
 * No clock on purpose. The stay is already inside the leg duration the plugin reported,
 * so the arrivals in the rail already account for it; printing a time here would mean
 * guessing how the plugin split the driving, and driving time is not linear in distance.
 */
function RouteViaStop({ via }: { via: RouteVia }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="grid items-stretch" style={RAIL_GRID}>
      <span className="relative z-[1] flex flex-col items-center">
        <span className="flex-1" style={RAIL_DASH} aria-hidden />
        {/* Hollow rather than filled: everything filled on this rail is something the
            traveller put there. */}
        <span
          className={`${DISC} border-2 border-dashed border-edge bg-surface text-content-faint`}
        >
          <Zap size={11} strokeWidth={2.1} aria-hidden />
        </span>
        <span className="flex-1" style={RAIL_DASH} aria-hidden />
      </span>
      <span className="flex min-w-0 items-start gap-2 px-1.5 pb-1 pt-0.5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className="min-w-0 truncate leading-6 text-content-secondary"
            style={{ fontSize: FS.name }}
          >
            {via.label || t('roadtrip.via.plugin')}
          </span>
          {via.dwellSeconds != null ? (
            <span className="w-fit text-content-faint" style={{ fontSize: FS.label }}>
              {formatDurationShort(via.dwellSeconds)}
            </span>
          ) : null}
        </span>
      </span>
    </div>
  )
}

/**
 * A finding about the drive leaving this stop: too long at the wheel in one go, or the
 * tank running out before anywhere to fill it.
 *
 * Wears the same two-part shell as the stay and the walk, in warning colours, and sits in
 * the same row: all of them say what this stop costs, and one row of badges reads as one
 * answer rather than as notes stacked under each other. The index is the stop the leg
 * LEAVES, so the badge means "the drive from here".
 *
 * Neither finding names a time of day. With no stop pinned to a clock the cascade
 * produces no times at all, so both are durations and distances, which exist as soon as
 * the leg has routed.
 */
function DriveFindingBadge({ warning }: { warning: ScheduleWarning }): React.ReactElement | null {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const text = warning.code === 'leg'
    ? t('roadtrip.limit.legOver', { time: formatDurationShort((warning.overMinutes ?? 0) * 60) })
    : warning.code === 'range'
      ? t('roadtrip.limit.range', { distance: formatDistance(warning.sinceKm ?? 0, distanceUnit) })
      : null
  if (!text) return null
  const Icon = warning.code === 'range' ? Fuel : Clock
  return (
    <Tooltip label={text}>
    <span
      // The border is the warning colour itself, not its soft tint: at this size a tinted
      // edge disappears into the card and the badge loses the shell the other two wear.
      className="inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-warning"
    >
      <span className="flex items-center bg-warning-soft px-1 text-warning" style={{ fontSize: FS.micro }}>
        <Icon size={9} aria-hidden />
      </span>
      <span
        className="flex items-center border-s border-warning bg-surface-card px-1.5 font-semibold tabular-nums text-warning"
        style={{ fontSize: FS.label }}
      >
        {warning.code === 'range'
          ? formatDistance(warning.sinceKm ?? 0, distanceUnit)
          : `+${formatDurationShort((warning.overMinutes ?? 0) * 60)}`}
      </span>
    </span>
    </Tooltip>
  )
}

/**
 * Midnight, marked where it happens — in the chain, between the two stops the drive runs
 * between, rather than as a fourth badge hanging off one of them.
 *
 * The schedule has carried this since it was written and nothing ever drew it: a day
 * running past midnight showed "02:30" as if it were tonight.
 */
function OvernightBreak(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="grid items-center" style={RAIL_GRID}>
      <span className="flex flex-col items-center" aria-hidden>
        <span className="h-full" style={RAIL_DASH} />
      </span>
      <span
        className="my-1 inline-flex w-fit items-center gap-1 rounded-full bg-info-soft px-1.5 py-0.5 font-medium text-info"
        style={{ fontSize: FS.label }}
      >
        <Moon size={10} className="shrink-0" aria-hidden />
        {t('roadtrip.warn.overnight')}
      </span>
    </div>
  )
}

/**
 * The arrival — the one value in the rail the user may have decided themselves.
 *
 * A pinned time is filled, pilled and carries the clock; a computed one is bare text.
 * Fill, shape and icon are three signals where a font weight used to be one, and this is
 * the state the whole view gets opened for. It is also the only filled accent left in the
 * rail: selection moved to the row's own background, so nothing else competes with it.
 */
function Arrival({ entry }: { entry: ScheduleEntry }): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const text = formatClockTime(entry.arrival, is12h)
  // The timetable convention: past midnight the clock keeps reading small numbers, so the
  // day it belongs to travels with it instead of sitting a line away as a separate note.
  const carry = entry.dayOffset > 0 ? (
    <span className="ms-0.5">
      {`+${entry.dayOffset}`}
      <span className="sr-only">{` ${t('roadtrip.warn.overnight')}`}</span>
    </span>
  ) : null

  // Every arrival is plain text at the row's right edge, pinned or not. The pinned one
  // used to be a filled pill with a clock, which made a column of quiet clock readings
  // look like it had a button in it. What is left of the distinction is weight and ink —
  // enough to see which time somebody chose, without a second shape in the rail.
  return (
    <Tooltip label={entry.anchored ? t('roadtrip.stop.pinned') : t('roadtrip.stop.computed')}>
    <span
      dir="ltr"
      // The same line box as the stop name beside it, so the two sit on one line however
      // far apart their sizes are — the row reads across, not in two staggered halves.
      className={`shrink-0 whitespace-nowrap leading-6 tabular-nums ${
        entry.anchored ? 'font-semibold text-content-secondary' : 'font-medium text-content-faint'
      }`}
      style={{ fontSize: FS.time }}
    >
      {text}
      {carry}
    </span>
    </Tooltip>
  )
}

function Stop({ stop, number, entry, late, driveFindings, selected, continues, starts, onSelect, onMove, canMove, onEditStay, onPickKind }: {
  stop: RoadtripStop
  /** Position within the day — the same count the map badges its markers with. */
  number: number
  entry: ScheduleEntry | undefined
  late: ScheduleWarning | undefined
  /** Findings about the drive LEAVING this stop, when the limits are set and it goes over. */
  driveFindings?: ScheduleWarning[]
  selected: boolean
  /** Whether the chain goes on below, so the marker keeps hold of the line. */
  continues: boolean
  /** First row of the day: no line above it, because the chain starts here. */
  starts?: boolean
  /** Opens the kind picker on the number. Absent leaves the rail read-only. */
  onPickKind?: (anchor: HTMLElement) => void
  onSelect?: () => void
  /** Moves this stop by one place. Absent means the chain is read-only. */
  onMove?: (delta: number) => void
  /** Whether there is anywhere to move in each direction, so the ends say so. */
  canMove?: { up: boolean; down: boolean }
  /** Opens the dialog for how long this stop takes. Absent means the rail is read-only. */
  onEditStay?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const lateText = late ? t('roadtrip.warn.late', { minutes: late.minutes ?? 0 }) : null
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      // Alt plus an arrow moves the stop. Dragging is the obvious gesture but it is only
      // a gesture: without this the chain could not be reordered from a keyboard at all,
      // and the row is already a button, so it is focusable anyway.
      onKeyDown={onMove ? e => {
        if (!e.altKey) return
        if (e.key === 'ArrowUp' && canMove?.up) { e.preventDefault(); onMove(-1) }
        if (e.key === 'ArrowDown' && canMove?.down) { e.preventDefault(); onMove(1) }
      } : undefined}
      className="group grid w-full rounded-lg text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      style={RAIL_GRID}
    >
      {/* The marker sits level with the middle of the row rather than at its top, the
          way the corridor list already places its own badges: a number pinned to the
          first line drifts away from the row as soon as a stop carries a stay and a walk
          under its name. The line grows above and below it, so the chain still runs
          unbroken from stop to stop. */}
      <span className="flex flex-col items-center">
        {starts ? null : <span className="w-[1.5px] flex-1 rounded-sm bg-edge" aria-hidden />}
        {onPickKind ? (
          // The number is the control, because the number is what changes: a service stop
          // has none. Clicking the 3 and picking the pump turns the 3 into an orange disc
          // and renumbers everything below it.
          <Tooltip label={t('roadtrip.stop.makeService')}>
            <span
              role="button"
              tabIndex={0}
              aria-label={t('roadtrip.stop.makeService')}
              onClick={e => { e.stopPropagation(); onPickKind(e.currentTarget as HTMLElement) }}
              onKeyDown={e => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                e.stopPropagation()
                onPickKind(e.currentTarget as HTMLElement)
              }}
              className={`${DISC} my-1 cursor-pointer bg-surface-tertiary font-geist font-semibold tabular-nums text-content-secondary transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
              style={{ fontSize: FS.marker }}
            >
              {number}
            </span>
          </Tooltip>
        ) : (
          <span
            className={`${DISC} my-1 bg-surface-tertiary font-geist font-semibold tabular-nums text-content-secondary`}
            style={{ fontSize: FS.marker }}
          >
            {number}
          </span>
        )}
        {continues ? <span className="w-[1.5px] flex-1 rounded-sm bg-edge" aria-hidden /> : null}
      </span>

      {/* The fill stops at the rail: the number is part of the chain, not part of the row
          you picked, and tinting it made the marker look selected too. */}
      <span
        className={`flex min-w-0 items-start gap-2 rounded-lg px-1.5 pb-1 pt-0.5 transition-colors ${
          selected ? 'bg-surface-selected' : 'group-hover:bg-surface-hover'
        }`}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Wraps rather than truncates: the name is what the row is for, and thirty of
              them cut off mid-word is a list nobody reads. */}
          <span
            className="min-w-0 break-words font-semibold leading-6 tracking-[-0.012em] text-content"
            style={{ fontSize: FS.name }}
          >
            {stop.name}
          </span>
          {/* Two halves under one border: the word says what the number means, so the
              number needs no unit of explanation beside it. */}
          {/* One row, wrapping: the stay and the walk from the road are both answers to
              "what does this stop cost", and the second only appears when the gap is far
              enough to change the plan. The dashed line on the map already says there is
              one; the number is for luggage, a gate, a track a hire car should not be on. */}
          <span className="flex flex-wrap items-center gap-1">
            <StayBadge minutes={stop.dwellMinutes} onEdit={onEditStay} />
            {spurWorthLabelling(stop.offRoadMeters) ? <OffRoadBadge meters={stop.offRoadMeters ?? 0} /> : null}
            {(driveFindings ?? []).map(w => <DriveFindingBadge key={w.code} warning={w} />)}
          </span>
          {lateText ? (
            <Tooltip label={lateText}>
              <span
                dir="ltr"
                className="mt-0.5 inline-flex w-fit items-center gap-1 self-start rounded-full bg-warning-soft px-1.5 py-0.5 font-semibold tabular-nums text-warning"
                style={{ fontSize: FS.label }}
              >
                <AlertTriangle size={10} className="shrink-0" aria-label={lateText} />
                {`+${formatDurationShort((late?.minutes ?? 0) * 60)}`}
              </span>
            </Tooltip>
          ) : null}
        </span>
        {entry?.arrival ? <Arrival entry={entry} /> : null}
      </span>
    </button>
  )
}

/**
 * One day, one card: its own numbers in its own head, its stops chained below.
 *
 * Stops count from one inside the day because that is what the map badges on its markers
 * (`dayOrderMap` numbers the selected day's assignments from 1). A rail counting across
 * the trip would put "17" beside a pin the map calls "3".
 */
function DaySection({ day, selectedAssignmentId, onSelectStop, onReorderStop, onMoveStopToDay, drag, onAskAlternatives, openAlternatives, onEditStay, onSetStopKind }: {
  day: RoadtripDay
  selectedAssignmentId?: number | null
  onSelectStop?: (placeId: number, assignmentId: number) => void
  onReorderStop?: (dayId: number, assignmentId: number, toIndex: number) => void
  onMoveStopToDay?: RoadtripSidebarProps['onMoveStopToDay']
  /** What is being dragged right now, shared across days so a stop can leave its own. */
  drag: DragState
  onAskAlternatives?: RoadtripSidebarProps['onAskAlternatives']
  openAlternatives?: RoadtripSidebarProps['openAlternatives']
  onEditStay?: RoadtripSidebarProps['onEditStay']
  onSetStopKind?: RoadtripSidebarProps['onSetStopKind']
}): React.ReactElement {
  const { from, setFrom, dropAt, setDropAt } = drag
  const dragging = from?.dayId === day.dayId ? from.index : null
  // Which disc the picker hangs under, and for which stop. One at a time: two open
  // popovers over the same rail is two answers to one question.
  const [picking, setPicking] = useState<{ anchor: HTMLElement; stop: RoadtripStop } | null>(null)
  const { t, language } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const last = day.stops.length - 1
  // The running number a stop wears, with the service stops passed over — so a day with a
  // charger halfway through still counts one, two, three the way its map pins do.
  let counted = 0
  return (
    <section className="mx-3.5 shrink-0 overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
      {/* Centred, with the day's facts as badges beneath its name: at this width a row
          of label-and-value pairs breaks awkwardly, while three short badges wrap
          gracefully and stay readable in every language. */}
      {/* A tint of its own, not just a hairline: the header holds the day's summed facts
          and the list below holds its stops, and `--bg-hover` at 40% is 1% black in light
          mode — a separation nobody could see. `--bg-secondary` lifts off the card in
          both themes while staying a step under the badges sitting on it. */}
      <header className="mb-1 border-b border-edge-faint bg-surface-secondary px-3.5 pb-2.5 pt-3">
        <h3
          className="text-center font-semibold tracking-[-0.015em] text-content"
          style={{ fontSize: FS.dayTitle }}
        >
          {t('roadtrip.day', { number: day.dayNumber })}
        </h3>
        {/* Read by the hook since it was written, never drawn until now. */}
        {day.title ? (
          <p className="mt-0.5 break-words text-center text-content-secondary" style={{ fontSize: FS.meta }}>
            {day.title}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {day.date ? (
            <time dateTime={day.date} className={`${DAY_BADGE} border border-edge`} style={{ fontSize: FS.label }}>
              {formatDate(day.date, language)}
            </time>
          ) : null}
          <span className={`${DAY_BADGE} bg-surface-tertiary`} style={{ fontSize: FS.label }}>
            {t('roadtrip.leg.driveText', {
              distance: formatDistance(day.distance / 1000, distanceUnit),
              time: formatDurationShort(day.duration),
            })}
          </span>
          {day.dayWarning ? (
            <Tooltip label={t('roadtrip.limit.hint')}>
              <span className={`${DAY_BADGE} gap-1 bg-warning-soft text-warning`} style={{ fontSize: FS.label }}>
                <AlertTriangle size={10} className="shrink-0" aria-hidden />
                {t('roadtrip.limit.dayOver', {
                  time: formatDurationShort((day.dayWarning.minutes - day.dayWarning.limitMinutes) * 60),
                })}
              </span>
            </Tooltip>
          ) : null}
          <span className={`${DAY_BADGE} bg-surface-tertiary`} style={{ fontSize: FS.label }}>
            {t('roadtrip.day.stopCount', { count: day.stops.filter(s => !isServiceStopType(s.stopType)).length })}
          </span>
        </div>
      </header>
      {/* One list item per stop, with the drive that follows it inside — the chain is a
          list of places, not of alternating places and connectors. A service stop owns
          the drive leaving it in exactly the same way, which is what splits its leg into
          band, marker, band without the list needing a second shape. */}
      <ol className="px-3.5 pb-3 pt-3">
        {day.stops.map((stop, i) => {
          const service = isServiceStopType(stop.stopType)
          if (!service) counted += 1
          // Every finding at this index is read on its own. Taking the first match let an
          // overnight crossing swallow the "you arrive late" flag without a trace.
          const marks = day.schedule.warnings.filter(w => w.index === i)
          return (
            <li
              key={stop.assignmentId}
              draggable={!!onReorderStop}
              onDragStart={onReorderStop ? e => {
                setFrom({ dayId: day.dayId, index: i, assignmentId: stop.assignmentId })
                e.dataTransfer.effectAllowed = 'move'
                // Firefox refuses to start a drag without payload, even an unused one.
                e.dataTransfer.setData('text/plain', String(stop.assignmentId))
              } : undefined}
              onDragEnd={() => { setFrom(null); setDropAt(null) }}
              onDragOver={onReorderStop && from ? e => {
                e.preventDefault()
                if (dropAt?.dayId !== day.dayId || dropAt.index !== i) setDropAt({ dayId: day.dayId, index: i })
              } : undefined}
              onDrop={onReorderStop && from ? e => {
                e.preventDefault()
                const src = from
                setFrom(null)
                setDropAt(null)
                if (src.dayId === day.dayId) {
                  if (src.index !== i) onReorderStop(day.dayId, src.assignmentId, i)
                } else {
                  onMoveStopToDay?.(src.dayId, src.assignmentId, day.dayId, i)
                }
              } : undefined}
              className={`rounded-lg transition-opacity ${dragging === i ? 'opacity-40' : ''} ${
                dropAt?.dayId === day.dayId && dropAt.index === i && from && !(from.dayId === day.dayId && from.index === i)
                  ? 'ring-2 ring-inset ring-accent'
                  : ''
              }`}
            >
              {marks.some(w => w.code === 'overnight') ? <OvernightBreak /> : null}
              {service ? (
                <ServiceStop
                  stop={stop}
                  entry={day.schedule.entries[i]}
                  driveFindings={day.driveWarnings.filter(w => w.index === i)}
                  selected={selectedAssignmentId === stop.assignmentId}
                  onSelect={onSelectStop ? () => onSelectStop(stop.placeId, stop.assignmentId) : undefined}
                  onEditStay={onEditStay ? () => onEditStay({ placeId: stop.placeId, name: stop.name, minutes: stop.dwellMinutes, arrival: day.schedule.entries[i]?.arrival ?? null }) : undefined}
                  onPickKind={onSetStopKind ? anchor => setPicking({ anchor, stop }) : undefined}
                />
              ) : (
                <Stop
                  stop={stop}
                  number={counted}
                  entry={day.schedule.entries[i]}
                  late={marks.find(w => w.code === 'late')}
                  driveFindings={day.driveWarnings.filter(w => w.index === i)}
                  selected={selectedAssignmentId === stop.assignmentId}
                  continues={i < last}
                  starts={i === 0}
                  onSelect={onSelectStop ? () => onSelectStop(stop.placeId, stop.assignmentId) : undefined}
                  onMove={onReorderStop ? delta => onReorderStop(day.dayId, stop.assignmentId, i + delta) : undefined}
                  canMove={{ up: i > 0, down: i < last }}
                  onEditStay={onEditStay ? () => onEditStay({ placeId: stop.placeId, name: stop.name, minutes: stop.dwellMinutes, arrival: day.schedule.entries[i]?.arrival ?? null }) : undefined}
                  onPickKind={onSetStopKind ? anchor => setPicking({ anchor, stop }) : undefined}
                />
              )}
              {i < last ? (
                <DriveBand
                  leg={day.legs[i]}
                  onAskAlternatives={onAskAlternatives ? () => onAskAlternatives(day.dayId, i) : undefined}
                  alternativesOpen={openAlternatives?.dayId === day.dayId && openAlternatives.index === i}
                />
              ) : null}
              {/* After the band, because a plugin halt happens on the drive it describes
                  rather than before setting off. */}
              {i < last ? (day.legVias[i] ?? []).map((via, vi) => (
                <RouteViaStop key={`via-${vi}-${via.lat},${via.lng}`} via={via} />
              )) : null}
            </li>
          )
        })}
      </ol>
      {picking ? (
        <StopKindPicker
          anchor={picking.anchor}
          current={picking.stop.stopType}
          onClose={() => setPicking(null)}
          onPick={kind => {
            setPicking(null)
            void onSetStopKind?.(picking.stop.placeId, kind)
          }}
        />
      ) : null}
    </section>
  )
}

/** The stop in flight and the row it is hovering, shared by every day in the rail. */
interface DragState {
  from: { dayId: number; index: number; assignmentId: number } | null
  setFrom: (v: DragState['from']) => void
  dropAt: { dayId: number; index: number } | null
  setDropAt: (v: DragState['dropAt']) => void
}

/**
 * A day the rail draws no drive for, shown only so a stop can be moved onto it.
 *
 * Without it a one-stop day is invisible, and "this leg is too long, push the last stop
 * to tomorrow" has nowhere to land — which is the move a road trip needs most.
 */
function QuietDaySection({ day, onMoveStopToDay, drag }: {
  day: QuietDay
  onMoveStopToDay?: RoadtripSidebarProps['onMoveStopToDay']
  drag: DragState
}): React.ReactElement | null {
  const { t, language } = useTranslation()
  const { from, dropAt, setFrom, setDropAt } = drag
  // Only while something is in flight: an empty day is not worth a row of its own
  // otherwise, and the rail is about the drive.
  if (!from || !onMoveStopToDay) return null
  const over = dropAt?.dayId === day.dayId
  return (
    <section
      onDragOver={e => { e.preventDefault(); if (!over) setDropAt({ dayId: day.dayId, index: day.stops.length }) }}
      onDrop={e => {
        e.preventDefault()
        const src = from
        setFrom(null)
        setDropAt(null)
        if (src.dayId !== day.dayId) onMoveStopToDay(src.dayId, src.assignmentId, day.dayId, day.stops.length)
      }}
      className={`mx-3.5 shrink-0 rounded-2xl border border-dashed px-3.5 py-3 transition-colors ${
        over ? 'border-accent bg-accent-subtle' : 'border-edge-secondary'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="font-semibold tracking-[-0.015em] text-content" style={{ fontSize: FS.dayTitle }}>
          {t('roadtrip.day', { number: day.dayNumber })}
        </h3>
        {day.date ? (
          <time dateTime={day.date} className={`${DAY_BADGE} ms-auto border border-edge`} style={{ fontSize: FS.label }}>
            {formatDate(day.date, language)}
          </time>
        ) : null}
      </div>
      <p className="mt-1.5 text-content-muted" style={{ fontSize: FS.meta }}>
        {day.stops.length === 1
          ? t('roadtrip.quietDay.one', { name: day.stops[0].name })
          : t('roadtrip.quietDay.empty')}
      </p>
    </section>
  )
}

/**
 * The road trip rail: the whole trip as one chain of stops with the driving distance
 * and time between them.
 *
 * Takes the day plan's place in the left column while road trip mode is on, because a
 * road trip is read across days — which day a stop sits on matters less than how far
 * apart the stops are (#1797, #435). Legs come from the same routing cache the map
 * uses, so switching modes costs no extra requests.
 *
 * Three levels, three surfaces: the trip is a card at the head, a day is a card, a stop
 * is a row inside it. The stop's name and its arrival carry the weight and everything
 * else is quiet support — no value is ever joined to another with a middot, and none of
 * them is a pill just for being a number.
 */
export default function RoadtripSidebar({
  routes, selectedAssignmentId, onSelectStop, onReorderStop, onMoveStopToDay, onAskAlternatives, openAlternatives, onEditStay,
  onSetStopKind,
}: RoadtripSidebarProps): React.ReactElement {
  const { t } = useTranslation()
  // One drag state for the whole rail rather than one per day: a stop that cannot leave
  // its own day is exactly the move a road trip needs when a leg turns out too long.
  const [from, setFrom] = React.useState<DragState['from']>(null)
  const [dropAt, setDropAt] = React.useState<DragState['dropAt']>(null)
  const drag: DragState = { from, setFrom, dropAt, setDropAt }

  // Nothing to total up, so nothing pretends to: no "0 km" standing above "No route yet".
  if (routes.days.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 py-8 text-center">
          <MapPin size={18} className="mx-auto mb-2 text-content-faint" aria-hidden />
          <h3 className="font-semibold text-content" style={{ fontSize: FS.name }}>{t('roadtrip.empty.title')}</h3>
          <p className="mt-1 text-content-muted" style={{ fontSize: FS.meta }}>{t('roadtrip.empty.body')}</p>
        </div>
      </div>
    )
  }

  return (
    // The totals hold still while the days move under them: they are the answer to "how
    // long is this trip", and an answer that scrolls away is one you have to go back for.
    <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
      <div className="shrink-0">
        <TripSummary routes={routes} />
      </div>
      <div className="roadtrip-rail-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-3.5">
        {routes.days.map(day => (
          <DaySection
            key={day.dayId}
            day={day}
            selectedAssignmentId={selectedAssignmentId}
            onSelectStop={onSelectStop}
            onReorderStop={onReorderStop}
            onMoveStopToDay={onMoveStopToDay}
            drag={drag}
            onAskAlternatives={onAskAlternatives}
            openAlternatives={openAlternatives}
            onEditStay={onEditStay}
            onSetStopKind={onSetStopKind}
          />
        ))}
        {routes.quietDays.map(day => (
          <QuietDaySection key={`quiet-${day.dayId}`} day={day} onMoveStopToDay={onMoveStopToDay} drag={drag} />
        ))}
      </div>
    </div>
  )
}
