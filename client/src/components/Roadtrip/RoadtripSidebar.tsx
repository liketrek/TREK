import ChargingInfo from './ChargingInfo'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import React, { useState } from 'react'
import {
  CarFront, Footprints, Bike, Zap, AlertTriangle,
  ParkingSquare, Shuffle, Fuel, Clock, Spline, Ban, Plus, RotateCcw, X, BatteryCharging, Moon, Milestone,
  type LucideIcon,
} from 'lucide-react'
import MDancingTrek from '../../mobile/components/MDancingTrek'
import type { RefuelSearch } from './useRefuelSearch'
import type { RefuelCandidate } from './refuelSuggestion'
import type { DryPoint } from './roadtripModel'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatDate, formatClockTime } from '../../utils/formatters'
import { formatDurationShort, isServiceStopType, serviceColor, type ScheduleEntry, type ScheduleWarning, refuelsRange } from './roadtripModel'
import { STOP_KIND_BY_KEY } from './stopKinds'
import { spurWorthLabelling } from './accessSpur'
import StopKindPicker from './StopKindPicker'
import StopFillPicker from './StopFillPicker'
import { useVehicleRange } from './useVehicleRange'
import type { RoadtripStopType } from '@trek/shared'
import type { QuietDay, RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { SpillMark } from './nightSpill'
import { dayColor } from './dayColors'
import type { RouteVia } from '../../types'
import { FS } from './typeScale'
import type { RouteSegment } from '../../types'
import EmptyState from '../shared/EmptyState'
import AutomaticDayStop from './AutomaticDayStop'

interface RoadtripSidebarProps {
  onFocusPoint?: (lat: number, lng: number) => void
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
  /**
   * The one-shot search for somewhere to fill up before the tank runs out.
   *
   * Absent leaves the range findings as they were, a warning and nothing else — which is
   * also what a viewer sees, since accepting one writes a stop.
   */
  refuel?: RefuelSearch
  onAskRefuel?: (dayId: number, dry: DryPoint & { lat: number; lng: number }) => void
  onAcceptRefuel?: (dayId: number, poi: RefuelCandidate, dry: DryPoint & { lat: number; lng: number }) => void
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
  /**
   * How full one stop fills the tank, 1-100, or null to follow the traveller's own
   * setting. Absent leaves the badge readable but not editable.
   */
  onSetStopFill?: (placeId: number, percent: number | null) => Promise<void> | void
  /**
   * Opens the dialog that makes a day follow an imported track (#1797).
   *
   * Absent leaves the rail read-only on that count, which is also what a viewer sees.
   */
  onFollowTrack?: (dayId: number) => void
  /**
   * How many vias each day carries, so a day whose shape was chosen by hand says so.
   *
   * A count rather than the points: the rail draws none of them — they are the router's
   * business — but "this drive is not the one the router would have picked" is exactly
   * what somebody reading the day needs to know.
   */
  viaCounts?: Record<number, number>
  /** The name of the track each day follows, so the badge can say which road it is. */
  trackNames?: Record<number, string>
  /**
   * Days folded down to their header, by id.
   *
   * A long trip is a long rail, and reading the shape of one day means scrolling past the
   * four before it. Folding is also what takes that day OFF the map: a card with nothing
   * under its header would otherwise still be drawing its road.
   */
  collapsedDayIds?: Set<number>
  /** Absent leaves every card open and its header unclickable. */
  onToggleDay?: (dayId: number) => void
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

/**
 * A figure in the two-part shell the rail uses everywhere: what it is on the left, the
 * number on the right, one hairline between them.
 *
 * Named because more than one place builds it now — the walk from the road, and the two
 * figures on a refuel offer — and a second copy is how the two drift apart.
 */
const FIGURE_BADGE = 'inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-edge'

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

/**
 * What a fill-up here actually puts in, beside the stay it takes.
 *
 * Only on a stop that refuels, because it is the only stop where the answer changes
 * anything. It reads as the second half of the stay badge because that is what it is —
 * how long you stand here, and what you get for it.
 *
 * The figure is the stop's own when it has one and the traveller's default otherwise, so
 * what the badge says is always what the range budget will actually use. With neither it
 * shows a "+", the same invitation the stay badge makes when nothing is planned yet: this
 * badge is the only way into the per-stop figure, and a badge that hid itself until a
 * value existed could never be used to create one.
 */
/**
 * What a stop will actually fill to: its own figure, else the traveller's default.
 *
 * Null means nothing worth saying — no per-stop figure and a default that fills right up,
 * which is what the budget did before any of this existed. An explicit 100 on the stop is
 * NOT null: on a trip whose default is 80 %, "this one goes right up" is a decision, and
 * hiding it would leave the traveller reading 80 on a stop that fills to 100.
 */
function effectiveFill(own: number | null | undefined, setting: number | undefined): number | null {
  if (own !== null && own !== undefined) return own
  return setting && setting > 0 && setting < 100 ? setting : null
}

function FillBadge({ percent, own, onEdit }: {
  /** What this stop will actually fill to, inherited or not. Null when nothing says. */
  percent: number | null
  /** Whether that figure is the stop's own rather than the traveller's default. */
  own: boolean
  onEdit?: (anchor: HTMLElement) => void
}): React.ReactElement | null {
  const { t } = useTranslation()
  if (percent === null && !onEdit) return null

  const shell = 'inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-edge'
  const icon = (
    <span
      className="flex items-center bg-surface-tertiary px-1 text-content-faint"
      style={{ fontSize: FS.micro }}
    >
      <BatteryCharging size={9} aria-hidden />
    </span>
  )
  const value = (
    <span
      className={`flex items-center border-s border-edge bg-surface-card px-1.5 font-semibold tabular-nums ${
        percent === null ? 'text-content-faint' : own ? 'text-content-secondary' : 'text-content-faint'
      }`}
      style={{ fontSize: FS.micro }}
    >
      {percent === null ? '+' : `${percent} %`}
    </span>
  )

  if (!onEdit) return <span className={shell}>{icon}{value}</span>
  // A span carrying the button role, not a <button>: the whole stop row is already one,
  // and a button inside a button is invalid HTML that React warns about and that browsers
  // resolve by dropping the inner element.
  return (
    <Tooltip label={percent === null ? t('roadtrip.stop.fillSet') : t('roadtrip.limit.fillBadge', { percent })}>
      <span
        role="button"
        tabIndex={0}
        // Stops the click reaching the row, which would select the stop and move the map
        // out from under the panel that is about to open.
        onClick={e => { e.stopPropagation(); onEdit(e.currentTarget as HTMLElement) }}
        onKeyDown={e => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          onEdit(e.currentTarget as HTMLElement)
        }}
        className={`${shell} cursor-pointer transition-colors hover:border-content-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      >
        {icon}{value}
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

/**
 * Where the tank runs out on this leg, and somewhere to do something about it.
 *
 * Sits under the drive band rather than on the stop that carries the range warning,
 * because those are two different places: the warning is filed where somebody finds out,
 * this is where the fuel actually ends. A filling station offered at the warning is one
 * the car cannot reach.
 *
 * Nothing is searched until it is asked for. Every press is a real request against a
 * shared service, which is the same reason the corridor search next door is manual.
 */
function RefuelBand({ dry, refuel, dayId, onAsk, onAccept }: {
  dry: DryPoint & { lat: number; lng: number }
  refuel: RefuelSearch
  dayId: number
  onAsk: () => void
  onAccept?: (poi: RefuelCandidate) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  // What the traveller drives, so the band says the right word and offers the right
  // thing. An electric car does not run out of TANK, and a lamp shaped like a pump on a
  // band about a battery is the kind of detail that makes the rest look careless.
  const { vehicleKind } = useVehicleRange()
  const electric = vehicleKind === 'electric'
  const DryIcon = electric ? Zap : Fuel
  const key = `${dayId}:${dry.legIndex}`
  const open = refuel.openFor === key
  const settled = open && !refuel.loading && refuel.outcome

  return (
    <div className="min-w-0">
      {/* Across the whole rail, marker column included, the way the day change used to
          be drawn. It belongs to no stop: the tank runs out between two of them, and
          hanging it off the one after would put it where somebody finds out rather than
          where it happens. Full width is also what makes it the ONLY thing saying this —
          the per-stop "so far on this tank" badge stands down wherever a search can be
          run, because after the band has said where the fuel ends, every later stop
          repeating it with a bigger number is the same message again. */}
      <div
        className="my-1.5 flex flex-col gap-1 overflow-hidden rounded-xl border px-2 py-1.5"
        style={{
          borderColor: 'color-mix(in srgb, var(--danger) 22%, transparent)',
          // Danger, not warning. The rail's amber says "this is more than you asked
          // for" — a day over its driving budget, a leg longer than allowed, all of
          // which are still plans that work. An empty tank is the point the drive stops
          // being possible, which is the one thing in the rail that is not a matter of
          // degree.
          //
          // The make-up is the night block's, a step quieter. That one is a break in the
          // day and can afford to lift off the card; this sits between two stops in a
          // running chain, and lit as hard it pulled the eye off everything around it.
          // Shallow tint, no drop shadow, the top edge only just catching the light.
          backgroundImage: 'linear-gradient(180deg, color-mix(in srgb, var(--danger) 11%, var(--bg-card)) 0%, color-mix(in srgb, var(--danger) 4%, var(--bg-card)) 70%, var(--bg-card) 100%)',
          boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--danger) 20%, transparent)',
          // The mascot draws itself in `--m-ink` and cuts its eyes out in `--m-bg`, so
          // both have to be named here: the ink is the band's warning colour, and the
          // ground has to be OPAQUE or the eyes show the body through them.
          '--m-ink': 'var(--danger)',
          '--m-bg': 'color-mix(in srgb, var(--danger) 11%, var(--bg-card))',
        } as React.CSSProperties}
      >
          <div className="flex items-center gap-2">
            {/* Out of fuel is a thing that happens to the DRIVE, so the mascot is the one
                with the vehicle, and it is not enjoying it. */}
            <MDancingTrek scene="transport" mood="sad" size={26} />
            <div className="min-w-0 flex-1">
              <div
                className="truncate font-geist font-semibold uppercase tracking-[0.16em] text-danger"
                style={{ fontSize: FS.label }}
              >
                {t(electric ? 'roadtrip.refuel.dryElectric' : 'roadtrip.refuel.dry')}
              </div>
              {/* How far INTO this leg, where a drive band keeps its figures. Not the
                  range that was crossed: that is the traveller's own setting, says
                  nothing about where, and made every band on a day read the same
                  number. */}
              <div className="truncate tabular-nums text-content-muted" style={{ fontSize: FS.meta }}>
                {t('roadtrip.refuel.after', { distance: formatDistance(Math.round(dry.intoLegKm), distanceUnit) })}
              </div>
            </div>
            {/* The low-fuel lamp IS the button.
                It was a lamp beside a magnifier, which is the same thing said twice: the
                lamp says the tank is empty and the magnifier offers to do something
                about it, and nobody reads a dashboard warning as decoration. So the lamp
                glows, and pressing it goes looking. Larger than the 18px marks a drive
                band carries, because unlike those it is the one thing in the band worth
                pressing. What it does is in the tooltip and in the screen reader label.

                Once a search is open the lamp steps aside for the state that matters:
                the way to close the answer, or the way to ask again. An answer that
                found nothing leaves a button rather than a dead end — the place search
                is a shared public service that does time out, and "it did not answer"
                with no way to retry reads as broken rather than as busy. */}
            {open && (refuel.loading || refuel.results.length) ? (
              <Tooltip label={t('common.close')}>
                <button
                  type="button"
                  onClick={refuel.close}
                  aria-label={t('common.close')}
                  className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg text-content-muted transition-colors hover:bg-surface-card hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={13} aria-hidden />
                </button>
              </Tooltip>
            ) : (
              <Tooltip label={settled && refuel.outcome !== 'found'
                ? t('roadtrip.refuel.again')
                : t(electric ? 'roadtrip.refuel.findElectric' : 'roadtrip.refuel.find')}>
                <button
                  type="button"
                  onClick={onAsk}
                  aria-label={settled && refuel.outcome !== 'found'
                    ? t('roadtrip.refuel.again')
                    : t(electric ? 'roadtrip.refuel.findElectric' : 'roadtrip.refuel.find')}
                  className="group/fuel grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {settled && refuel.outcome !== 'found'
                    ? <RotateCcw size={13} strokeWidth={2} aria-hidden />
                    : (
                      /* The glow stops under the pointer: a lamp that keeps blinking
                         while it is being aimed at reads as unresponsive. */
                      <DryIcon
                        size={14}
                        strokeWidth={2}
                        className="trek-lowfuel group-hover/fuel:[animation-play-state:paused]"
                        aria-hidden
                      />
                    )}
                </button>
              </Tooltip>
            )}
          </div>

          {open && refuel.loading ? (
            <span className="text-content-muted" style={{ fontSize: FS.meta }}>{t('roadtrip.refuel.looking')}</span>
          ) : null}

          {settled ? (
            refuel.results.length ? (
              <ul className="flex flex-col gap-1">
                {/* Three at most. This is an offer beside a plan, not a list to browse;
                    the corridor panel is where somebody goes to see all of them.

                    Each one on its own surface rather than as bare text in the band: the
                    band is the problem and these are the answers, and a row somebody is
                    meant to press has to look like it can be. Two lines, because one was
                    not enough to tell them apart — measured on a real day the top three
                    came back as "Vattenfall InCharge" three times over, identical but for
                    a number nobody could see the meaning of. */}
                {refuel.results.slice(0, 3).map(poi => {
                  const kind = STOP_KIND_BY_KEY[poi.category]
                  const KindIcon = kind?.Icon ?? Fuel
                  return (
                    <li key={poi.osm_id}>
                      {/* Logical padding, not left/right: the rail runs the other way in Arabic and
                          the disc has to keep its distance from the reading edge either way. */}
                      <div className="flex items-center gap-2 rounded-lg bg-surface-card py-1 pe-1.5 ps-2.5">
                        <span
                          className={`${DISC} h-[22px] w-[22px] shrink-0`}
                          style={{ background: `color-mix(in srgb, ${kind?.color ?? 'var(--danger)'} 16%, transparent)`, color: kind?.color }}
                          aria-hidden
                        >
                          <KindIcon size={12} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-content" style={{ fontSize: FS.name }}>
                            {poi.name}
                          </span>
                          {/* The two figures that decide it, in the order they decide it,
                              and as two badges rather than one line with a middot in it.
                              No value in this rail is ever joined to another that way:
                              they are separate facts, and a separator invites them to be
                              read as one number about one thing.

                              The detour is what the list is SORTED by — everything here
                              is reachable already, so what separates them is what the
                              stop costs — and it is also the only thing telling three
                              branches of one chain apart. What is left in the tank when
                              the car draws level comes second, with the detour already
                              counted into it. The badge carries the figure and the
                              tooltip says which one it is, which is how two numbers stay
                              legible in a column this narrow. */}
                          <span className="mt-0.5 flex items-center gap-1">
                            <Tooltip label={t('roadtrip.poi.offRoute', { distance: formatDistance(poi.offRouteKm, distanceUnit) })}>
                              <span className={FIGURE_BADGE}>
                                <span className="flex items-center bg-surface-tertiary px-1 text-content-faint">
                                  <Milestone size={9} aria-hidden />
                                </span>
                                <span
                                  className="flex items-center border-s border-edge bg-surface-card px-1.5 font-semibold tabular-nums text-content-secondary"
                                  style={{ fontSize: FS.label }}
                                >
                                  {formatDistance(poi.offRouteKm, distanceUnit)}
                                </span>
                              </span>
                            </Tooltip>
                            <Tooltip label={t('roadtrip.refuel.spare', { distance: formatDistance(Math.round(poi.spareKm), distanceUnit) })}>
                              <span className={FIGURE_BADGE}>
                                <span className="flex items-center bg-surface-tertiary px-1 text-content-faint">
                                  <DryIcon size={9} aria-hidden />
                                </span>
                                <span
                                  className="flex items-center border-s border-edge bg-surface-card px-1.5 font-semibold tabular-nums text-content-secondary"
                                  style={{ fontSize: FS.label }}
                                >
                                  {formatDistance(Math.round(poi.spareKm), distanceUnit)}
                                </span>
                              </span>
                            </Tooltip>
                          </span>
                        </span>
                        {onAccept ? (
                          <Tooltip label={t(electric ? 'roadtrip.refuel.addElectric' : 'roadtrip.refuel.add', { name: poi.name })}>
                            <button
                              type="button"
                              onClick={() => onAccept(poi)}
                              aria-label={t(electric ? 'roadtrip.refuel.addElectric' : 'roadtrip.refuel.add', { name: poi.name })}
                              className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg bg-surface-secondary text-content-secondary transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <Plus size={13} strokeWidth={2.2} aria-hidden />
                            </button>
                          </Tooltip>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              /* Three different sentences for three different facts. "Nothing on this
                 stretch" after a request that failed or was cut short states something
                 that was never checked, which is worse than saying nothing. */
              <span className="text-content-muted" style={{ fontSize: FS.meta }}>
                {refuel.outcome === 'none'
                  ? t('roadtrip.refuel.none')
                  : refuel.outcome === 'incomplete'
                    ? t('roadtrip.refuel.incomplete')
                    : t('roadtrip.refuel.failed')}
              </span>
            )
          ) : null}
      </div>
    </div>
  )
}

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
function ServiceStop({ stop, entry, late, driveFindings, selected, onSelect, onEditStay, onPickKind, onPickFill }: {
  stop: RoadtripStop
  entry: ScheduleEntry | undefined
  /** How late the drive reaches a time pinned on this pause, the same finding a numbered
   *  stop shows. A fuel or charging halt can carry a pinned time like anything else. */
  late: ScheduleWarning | undefined
  /** Findings about the drive that ARRIVES here. A charging halt is a stop like any other
   *  as far as the tank is concerned, so it carries them the same way a numbered one does. */
  driveFindings?: ScheduleWarning[]
  /** Opens the kind picker on the disc. Absent leaves the rail read-only. */
  onPickKind?: (anchor: HTMLElement) => void
  /** Opens the panel that sets how full THIS stop fills, hung under the badge. */
  onPickFill?: (anchor: HTMLElement) => void
  selected: boolean
  onSelect?: () => void
  /** Opens the dialog for how long this pause takes. Absent means the rail is read-only. */
  onEditStay?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  // Read here rather than threaded down: both stop shapes need the same two, and the
  // badge is the only thing in the rail that depends on them.
  const fillPercent = useRoadtripSettings(s => s.roadtrip_fill_percent)
  const { vehicleKind } = useVehicleRange()
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
              style={{ background: serviceColor(stop.stopType), color: '#fff' }} // theme-lint-disable — road-signage palette
            >
              <Icon size={12} strokeWidth={2.1} aria-hidden />
            </span>
          </Tooltip>
        ) : (
          <span
            className={DISC}
            // theme-lint-disable — same palette, read-only.
            style={{ background: serviceColor(stop.stopType), color: '#fff' }} // theme-lint-disable — road-signage palette
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
            className="flex min-w-0 items-center gap-2 font-semibold leading-6 tracking-[-0.012em] text-content-secondary"
            style={{ fontSize: FS.name }}
          >
            <span className="min-w-0 truncate">{stop.name}</span>{stop.stopType === 'charging' && <ChargingInfo placeId={stop.placeId} compact />}<CheckoutDeparture stop={stop} entry={entry} />
          </span>
          <span className="flex flex-wrap items-center gap-1">
            <StayBadge minutes={stop.dwellMinutes} onEdit={onEditStay} />
            {refuelsRange(stop.stopType, vehicleKind) ? (
              <FillBadge
                percent={effectiveFill(stop.fillPercent, fillPercent)}
                own={stop.fillPercent !== null && stop.fillPercent !== undefined}
                onEdit={onPickFill}
              />
            ) : null}
            {spurWorthLabelling(stop.offRoadMeters) ? <OffRoadBadge meters={stop.offRoadMeters ?? 0} /> : null}
            {(driveFindings ?? []).map(w => <DriveFindingBadge key={w.code} warning={w} />)}
            <LateBadge late={late} />
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
 * The arrival — the one value in the rail the user may have decided themselves.
 *
 * A pinned time is filled, pilled and carries the clock; a computed one is bare text.
 * Fill, shape and icon are three signals where a font weight used to be one, and this is
 * the state the whole view gets opened for. It is also the only filled accent left in the
 * rail: selection moved to the row's own background, so nothing else competes with it.
 */
function CheckoutDeparture({ stop, entry }: { stop: RoadtripStop; entry?: ScheduleEntry }): React.ReactElement | null {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  if (stop.checkoutAt === undefined || !entry?.departure) return null
  return <Tooltip label={t('roadtrip.spill.departs', { time: formatClockTime(entry.departure, is12h) })}>
    <span dir="ltr" tabIndex={0} className="inline-flex shrink-0 items-center gap-1 rounded bg-surface-secondary px-1 py-0.5 align-middle whitespace-nowrap font-medium text-[length:calc(10px*var(--fs-scale-caption,1))] leading-none tabular-nums text-content-muted">
      <Clock size={10} aria-hidden />{formatClockTime(entry.departure, is12h)}
    </span>
  </Tooltip>
}

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

function Stop({ stop, number, entry, late, driveFindings, selected, continues, starts, onSelect, onMove, canMove, onEditStay, onPickKind, onPickFill }: {
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
  /** Opens the panel that sets how full THIS stop fills, hung under the badge. */
  onPickFill?: (anchor: HTMLElement) => void
  onSelect?: () => void
  /** Moves this stop by one place. Absent means the chain is read-only. */
  onMove?: (delta: number) => void
  /** Whether there is anywhere to move in each direction, so the ends say so. */
  canMove?: { up: boolean; down: boolean }
  /** Opens the dialog for how long this stop takes. Absent means the rail is read-only. */
  onEditStay?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  // Read here rather than threaded down: both stop shapes need the same two, and the
  // badge is the only thing in the rail that depends on them.
  const fillPercent = useRoadtripSettings(s => s.roadtrip_fill_percent)
  const { vehicleKind } = useVehicleRange()
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
            className="flex min-w-0 items-center gap-2 font-semibold leading-6 tracking-[-0.012em] text-content"
            style={{ fontSize: FS.name }}
          >
            <span className={stop.stopType === 'charging' || stop.checkoutAt !== undefined ? 'min-w-0 truncate' : 'min-w-0 break-words'}>{stop.name}</span>{stop.stopType === 'charging' && <ChargingInfo placeId={stop.placeId} compact />}<CheckoutDeparture stop={stop} entry={entry} />
          </span>
          {/* Two halves under one border: the word says what the number means, so the
              number needs no unit of explanation beside it. */}
          {/* One row, wrapping: the stay and the walk from the road are both answers to
              "what does this stop cost", and the second only appears when the gap is far
              enough to change the plan. The dashed line on the map already says there is
              one; the number is for luggage, a gate, a track a hire car should not be on. */}
          <span className="flex flex-wrap items-center gap-1">
            <StayBadge minutes={stop.dwellMinutes} onEdit={onEditStay} />
            {refuelsRange(stop.stopType, vehicleKind) ? (
              <FillBadge
                percent={effectiveFill(stop.fillPercent, fillPercent)}
                own={stop.fillPercent !== null && stop.fillPercent !== undefined}
                onEdit={onPickFill}
              />
            ) : null}
            {spurWorthLabelling(stop.offRoadMeters) ? <OffRoadBadge meters={stop.offRoadMeters ?? 0} /> : null}
            {(driveFindings ?? []).map(w => <DriveFindingBadge key={w.code} warning={w} />)}
            <LateBadge late={late} />
          </span>
        </span>
        {entry?.arrival ? <Arrival entry={entry} /> : null}
      </span>
    </button>
  )
}

/**
 * How far past the time you set this stop is reached. Its own component because a pause
 * runs late exactly like a numbered stop does: the schedule computes the finding for both
 * (roadtripModel restarts the chain at any anchor, whatever kind of stop carries it), and
 * drawing it in only one of them threw the other one's away.
 *
 * It sits in the badge row beside the stay and the drive findings rather than on a line of
 * its own: they are all answers to "what does this stop cost", and a warning on its own row
 * pushed every following stop down for a finding that fits in a pill.
 */
function LateBadge({ late }: { late: ScheduleWarning | undefined }): React.ReactElement | null {
  const { t } = useTranslation()
  if (!late) return null
  const label = t('roadtrip.warn.late', { minutes: late.minutes ?? 0 })
  return (
    <Tooltip label={label}>
      <span
        dir="ltr"
        // The same two-part shell the stay and the drive findings wear, so a row of badges
        // reads as one set instead of a pill among boxes. Warning-coloured edge like the
        // drive finding: at this size a tinted edge disappears into the card.
        className="inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-warning"
      >
        <span className="flex items-center bg-warning-soft px-1 text-warning" style={{ fontSize: FS.micro }}>
          <AlertTriangle size={9} aria-label={label} />
        </span>
        <span
          className="flex items-center border-s border-warning bg-surface-card px-1.5 font-semibold tabular-nums text-warning"
          style={{ fontSize: FS.label }}
        >
          {`+${formatDurationShort((late.minutes ?? 0) * 60)}`}
        </span>
      </span>
    </Tooltip>
  )
}

/**
 * What a night drive leaves on the next morning's card.
 *
 * The one thing in the rail that is not the day it sits under. A drive leaving at 21:00
 * and arriving at 01:23 arrives tomorrow, and the rail draws it there — under tomorrow's
 * date, with the night it came through kept in front of it so the kilometres reach the
 * stops rather than being left on a day nobody drives them on.
 *
 * Nothing has been written to say so. The stops still belong to the day they were planned
 * on and the day plan still shows them there; this is the arrangement the arrival times
 * imply, worked out again every time they change. Shorten the stay before the night drive
 * and the first stop crosses back on its own.
 *
 * The ground fades from night at the head to the card's own surface at the foot, because
 * that is what the block is: the end of one day handed to the beginning of the next.
 */
function SpillBlock({ spill, children }: {
  spill: SpillMark
  children: React.ReactNode
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const leg = spill.leg
  const departure = spill.departure
  // Mixed against the card rather than laid over it with alpha: the mascot cuts its eyes
  // out in the colour behind it, and a translucent ground would show its body through
  // them. The same reason the old overnight band mixed instead of tinting.
  const night = 'color-mix(in srgb, var(--info) 11%, var(--bg-card))'
  const dawn = 'color-mix(in srgb, var(--info) 4%, var(--bg-card))'
  const edge = 'color-mix(in srgb, var(--info) 22%, transparent)'
  return (
    <li
      // Pulled out by exactly the padding it puts back inside, so the stops in here sit
      // on the SAME left edge as the day's own stops below. Otherwise the block indents
      // them by its own padding and their numbers and dashed line stand a few pixels
      // right of every other number and line in the card — which reads as two lists
      // rather than as one chain with a night in it.
      className="trek-spill-in -mx-2 mb-1.5 mt-0.5 overflow-hidden rounded-xl border"
      style={{
        borderColor: edge,
        backgroundImage: `linear-gradient(180deg, ${night} 0%, ${dawn} 58%, var(--bg-card) 100%)`,
        // A lit pixel along the top edge, and nothing under it. The shadow that used to
        // lift the block off the card made it the loudest thing on a screen where it is
        // only ever context: what matters here are the stops inside it, not the frame.
        boxShadow: `inset 0 1px 0 color-mix(in srgb, var(--info) 20%, transparent)`,
      }}
    >
      <div className="px-2 pb-1 pt-2">
        <div className="flex items-center gap-2 text-info">
          <MDancingTrek scene="idle" mood="sleepy" size={26} />
          <span
            className="min-w-0 flex-1 truncate font-geist font-semibold uppercase tracking-[0.16em]"
            style={{ fontSize: FS.label }}
          >
            {t('roadtrip.spill.title', { number: spill.fromDayNumber })}
          </span>
          {/* Three z's on one baseline, each starting a third of the loop after the last,
              so one is always on its way up. Decorative: the line beside it already says
              what the block is. */}
          <span className="trek-doze flex items-end gap-[3px] self-start" aria-hidden>
            <span style={{ fontSize: FS.micro }}>z</span>
            <span style={{ fontSize: FS.label }}>z</span>
            <span style={{ fontSize: FS.meta }}>z</span>
          </span>
        </div>
        {/* The drive itself, in the band the rail uses everywhere else — this is the
            reason the block exists, and the kilometres on it are the ones the card's
            header now counts. Not clickable: alternatives are asked for on the day the
            leg is stored on, and offering the same leg twice would be two answers. */}
        <div className={spill.automatic ? 'hidden' : 'grid'} style={RAIL_GRID}>
          <span className="relative z-[1] flex flex-col items-center" aria-hidden>
            <span className="flex-1" style={RAIL_DASH} />
          </span>
          <div className="min-w-0">
            {/* Shaped like every other drive in the rail: what it cost on the left, the
                clock on the right, in the column every arrival in this card already
                reads down. The time used to sit inside the sentence, which put a
                reading in the one place the eye does not look for one — and gave the
                row two competing figures with no order between them. */}
            <div
              className="my-1.5 flex w-full items-center gap-2 rounded-lg py-1 pe-2 ps-2"
              style={{ background: 'color-mix(in srgb, var(--info) 12%, transparent)', color: 'var(--info)' }}
            >
              <Moon size={12} strokeWidth={1.7} className="shrink-0" aria-hidden />
              <span className="min-w-0 truncate font-medium tabular-nums" style={{ fontSize: FS.meta }}>
                {leg
                  ? t('roadtrip.leg.driveText', {
                      distance: formatDistance((leg.distance ?? 0) / 1000, distanceUnit),
                      time: formatDurationShort(leg.duration ?? 0),
                    })
                  : t('roadtrip.leg.pending')}
              </span>
              {/* Departure, not arrival, so it says so in words: everything else in this
                  column is a time of arrival, and a bare 23:57 there would read as one.
                  The stop it leaves from is not named — it is drawn on yesterday's card
                  directly above, and a second row for it would read as a stop made
                  twice. */}
              {departure && spill.fromStop?.checkoutAt === undefined ? (
                <span
                  dir="ltr"
                  className="ms-auto shrink-0 whitespace-nowrap font-semibold leading-6 tabular-nums"
                  style={{ fontSize: FS.time }}
                >
                  {t('roadtrip.spill.departs', { time: formatClockTime(departure, is12h) })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {/* Seven, not eight: the block is pulled out by 8 and draws a 1px border, so the
          inside edge lands one pixel in unless the padding gives that pixel back. It is
          the difference between the numbers in here standing on the same line as the ones
          below and standing almost on it. */}
      <ol className="px-[7px] pb-2">{children}</ol>
    </li>
  )
}

/**
 * One day, one card: its own numbers in its own head, its stops chained below.
 *
 * Stops count from one inside the day because that is what the map badges on its markers
 * (`dayOrderMap` numbers the selected day's assignments from 1). A rail counting across
 * the trip would put "17" beside a pin the map calls "3".
 *
 * A card is no longer one stored day. It is one DATE, and it draws whatever is reached on
 * it — which on the morning after a night drive means a stretch that is stored on
 * yesterday. Every stop keeps the day it is stored on in `block.source`, so a reorder, a
 * move, a stay edit or a refuel offer still names the day the server knows it by. See
 * `nightSpill.ts`.
 */
function DaySection({ day, selectedAssignmentId, onSelectStop, onReorderStop, onMoveStopToDay, drag, onAskAlternatives, openAlternatives, onEditStay, onSetStopKind, onSetStopFill, onFollowTrack, viaCount, trackName, refuel, onAskRefuel, onAcceptRefuel, loading, collapsed, onToggle, onFocusPoint }: {
  onFocusPoint?: RoadtripSidebarProps['onFocusPoint']
  day: RoadtripDay
  /** Folded down to the header, and off the map with it. */
  collapsed?: boolean
  onToggle?: () => void
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
  onSetStopFill?: RoadtripSidebarProps['onSetStopFill']
  onFollowTrack?: RoadtripSidebarProps['onFollowTrack']
  viaCount?: number
  trackName?: string
  refuel?: RefuelSearch
  onAskRefuel?: RoadtripSidebarProps['onAskRefuel']
  onAcceptRefuel?: RoadtripSidebarProps['onAcceptRefuel']
  /** True while any day is still routing; the range findings are not settled until then. */
  loading?: boolean
}): React.ReactElement {
  const { from, setFrom, dropAt, setDropAt } = drag
  // Which disc the picker hangs under, and for which stop. One at a time: two open
  // popovers over the same rail is two answers to one question.
  const [picking, setPicking] = useState<{ anchor: HTMLElement; stop: RoadtripStop } | null>(null)
  const [filling, setFilling] = useState<{ anchor: HTMLElement; stop: RoadtripStop } | null>(null)
  const { t, language } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  // The colour the map draws this day in, or none at all while the map is drawing one
  // blue line for the whole trip.
  const dayColorsOn = useRoadtripSettings(s => !!s.roadtrip_day_colors)
  const tint = dayColorsOn ? dayColor(day.dayNumber).line : null
  const last = day.stops.length - 1
  const findingsFor = (i: number) =>
    day.driveWarnings.filter(w => w.index === i && w.code !== 'range')
  // The running number a stop wears, with the service stops passed over — so a day with a
  // charger halfway through still counts one, two, three the way its map pins do.
  let counted = 0

  /**
   * One row of the chain: the stop, the drive leaving it, whatever hangs off that drive.
   *
   * The day's own index `i` addresses everything that belongs to this DATE — the leg, the
   * schedule entry, the dry points. Everything that WRITES uses `stop.ownerDayId` and
   * `stop.ownerIndex` instead, because a stop driven onto this date through the night is
   * still stored on the day it set off from (`nightSpill.ts`).
   */
  const renderStopContent = (stop: RoadtripStop, i: number): React.ReactElement => {
    if (stop.automaticNight) return (
      <li key={stop.assignmentId}>
        <AutomaticDayStop stop={stop} entry={day.schedule.entries[i]} onFocus={onFocusPoint} />
        {i < last && day.legs[i]?.distance !== 0 ? <DriveBand leg={day.legs[i]} /> : null}
        {refuel && !loading ? (day.dryPoints ?? []).filter(dry => dry.legIndex === i).map(dry => (
          <RefuelBand key={`dry-${dry.legIndex}`} dry={dry} dayId={day.dayId} refuel={refuel}
            onAsk={() => onAskRefuel?.(day.dayId, dry)}
            onAccept={onAcceptRefuel ? poi => onAcceptRefuel(day.dayId, poi, dry) : undefined} />
        )) : null}
        {i < last ? (day.legVias[i] ?? []).map((via, vi) => (
          <RouteViaStop key={`via-${vi}-${via.lat},${via.lng}`} via={via} />
        )) : null}
      </li>
    )
    const service = isServiceStopType(stop.stopType)
    if (!service) counted += 1
    // Every finding at this index is read on its own. Taking the first match let an
    // overnight crossing swallow the "you arrive late" flag without a trace.
    const marks = day.schedule.warnings.filter(w => w.index === i)
    const ownDay = stop.ownerDayId
    const ownIndex = stop.ownerIndex
    return (
      <li
        key={stop.assignmentId}
        draggable={!!onReorderStop}
        onDragStart={onReorderStop ? e => {
          setFrom({ dayId: ownDay, index: ownIndex, assignmentId: stop.assignmentId })
          e.dataTransfer.effectAllowed = 'move'
          // Firefox refuses to start a drag without payload, even an unused one.
          e.dataTransfer.setData('text/plain', String(stop.assignmentId))
        } : undefined}
        onDragEnd={() => { setFrom(null); setDropAt(null) }}
        onDragOver={onReorderStop && from ? e => {
          e.preventDefault()
          if (dropAt?.dayId !== ownDay || dropAt.index !== ownIndex) setDropAt({ dayId: ownDay, index: ownIndex })
        } : undefined}
        onDrop={onReorderStop && from ? e => {
          e.preventDefault()
          const src = from
          setFrom(null)
          setDropAt(null)
          if (src.dayId === ownDay) {
            if (src.index !== ownIndex) onReorderStop(ownDay, src.assignmentId, ownIndex)
          } else {
            onMoveStopToDay?.(src.dayId, src.assignmentId, ownDay, ownIndex)
          }
        } : undefined}
        className={`rounded-lg transition-opacity ${from?.dayId === ownDay && from.index === ownIndex ? 'opacity-40' : ''} ${
          dropAt?.dayId === ownDay && dropAt.index === ownIndex && from && !(from.dayId === ownDay && from.index === ownIndex)
            ? 'ring-2 ring-inset ring-accent'
            : ''
        }`}
      >
        {service ? (
          <ServiceStop
            stop={stop}
            entry={day.schedule.entries[i]}
            late={marks.find(w => w.code === 'late')}
            driveFindings={findingsFor(i)}
            selected={selectedAssignmentId === stop.assignmentId}
            onSelect={onSelectStop ? () => onSelectStop(stop.placeId, stop.assignmentId) : undefined}
            onEditStay={onEditStay ? () => onEditStay({ placeId: stop.placeId, name: stop.name, minutes: stop.dwellMinutes, arrival: day.schedule.entries[i]?.arrival ?? null }) : undefined}
            onPickKind={onSetStopKind ? anchor => setPicking({ anchor, stop }) : undefined}
            onPickFill={onSetStopFill ? anchor => setFilling({ anchor, stop }) : undefined}
          />
        ) : (
          <Stop
            stop={stop}
            number={counted}
            entry={day.schedule.entries[i]}
            late={marks.find(w => w.code === 'late')}
            driveFindings={findingsFor(i)}
            selected={selectedAssignmentId === stop.assignmentId}
            continues={i < last}
            starts={i === 0}
            onSelect={onSelectStop ? () => onSelectStop(stop.placeId, stop.assignmentId) : undefined}
            onMove={onReorderStop ? delta => onReorderStop(ownDay, stop.assignmentId, ownIndex + delta) : undefined}
            canMove={{ up: i > 0, down: i < last }}
            onEditStay={onEditStay ? () => onEditStay({ placeId: stop.placeId, name: stop.name, minutes: stop.dwellMinutes, arrival: day.schedule.entries[i]?.arrival ?? null }) : undefined}
            onPickKind={onSetStopKind ? anchor => setPicking({ anchor, stop }) : undefined}
            onPickFill={onSetStopFill ? anchor => setFilling({ anchor, stop }) : undefined}
          />
        )}
        {i < last && (!day.stops[i + 1].automaticNight || day.legs[i]?.distance !== 0) ? (
          <DriveBand
            leg={day.legs[i]}
            onAskAlternatives={onAskAlternatives && !day.stops[i + 1].automaticNight ? () => onAskAlternatives(day.dayId, i) : undefined}
            alternativesOpen={openAlternatives?.dayId === day.dayId && openAlternatives.index === i}
          />
        ) : null}
        {/* Only on the leg the fuel actually runs out on, and only once the day has
            finished routing: the warnings are republished after every routing task
            and the early ones are wrong, so an offer that appears and moves while
            the trip loads reads as a fault. */}
        {refuel && !loading
          ? (day.dryPoints ?? [])
              .filter(dry => dry.legIndex === i)
              .map(dry => (
                <RefuelBand
                  key={`dry-${dry.legIndex}`}
                  dry={dry}
                  // The card's day, not the stop's stored one. This is the key the open
                  // search is filed under, and the hook is asked with the same number —
                  // a band inside a borrowed stretch had them differ, so the results
                  // arrived, drew on the map, and the band they belonged to never opened.
                  dayId={day.dayId}
                  refuel={refuel}
                  onAsk={() => onAskRefuel?.(day.dayId, dry)}
                  onAccept={onAcceptRefuel ? poi => onAcceptRefuel(day.dayId, poi, dry) : undefined}
                />
              ))
          : null}
        {/* After the band, because a plugin halt happens on the drive it describes
            rather than before setting off. */}
        {i < last ? (day.legVias[i] ?? []).map((via, vi) => (
          <RouteViaStop key={`via-${vi}-${via.lat},${via.lng}`} via={via} />
        )) : null}
      </li>
    )
  }

  /**
   * The chain in runs: the stretches driven onto this date through the night, and the
   * day's own stops between and after them.
   *
   * Built rather than mapped straight through, because a spill is drawn inside a block of
   * its own and a block cannot be opened halfway down a `map`.
   */
  const renderStop = (stop: RoadtripStop, i: number): React.ReactElement => (
    <React.Fragment key={stop.assignmentId}>
      {refuel && !loading ? (day.dryPoints ?? []).filter(dry => dry.legIndex === -i - 1).map(dry => (
        <li key={`inbound-${i}`}>
          <RefuelBand dry={dry} dayId={day.dayId} refuel={refuel}
            onAsk={() => onAskRefuel?.(day.dayId, dry)}
            onAccept={onAcceptRefuel ? poi => onAcceptRefuel(day.dayId, poi, dry) : undefined} />
        </li>
      )) : null}
      {renderStopContent(stop, i)}
    </React.Fragment>
  )
  const runs: { spill: SpillMark | null; from: number; to: number }[] = []
  {
    let at = 0
    for (const spill of day.spills ?? []) {
      if (spill.at > at) runs.push({ spill: null, from: at, to: spill.at })
      runs.push({ spill, from: spill.at, to: spill.at + spill.count })
      at = spill.at + spill.count
    }
    if (at < day.stops.length) runs.push({ spill: null, from: at, to: day.stops.length })
  }

  return (
    <section className="mx-3.5 shrink-0 overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
      {/* Centred, with the day's facts as badges beneath its name: at this width a row
          of label-and-value pairs breaks awkwardly, while three short badges wrap
          gracefully and stay readable in every language. */}
      {/* A tint of its own, not just a hairline: the header holds the day's summed facts
          and the list below holds its stops, and `--bg-hover` at 40% is 1% black in light
          mode — a separation nobody could see. `--bg-secondary` lifts off the card in
          both themes while staying a step under the badges sitting on it. */}
      <header
        // A button when there is something to fold, a plain header when there is not, so
        // a read-only rail never offers a control that does nothing. The whole header is
        // the target and the hover is the only sign of it: a chevron or a "fold" label
        // beside the day's own facts read as a fourth fact about the day rather than as a
        // control, and the header is what somebody is already looking at when they decide
        // to put a day away.
        {...(onToggle ? {
          role: 'button' as const,
          tabIndex: 0,
          'aria-expanded': !collapsed,
          onClick: onToggle,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
          },
        } : {})}
        // The margin and the bottom rule belong to the header only while there is a list
        // under them. Folded, they left a white strip of card below the tinted header —
        // and once the day is tinted, that strip is the one thing on the card that is not.
        className={`border-edge-faint bg-surface-secondary px-3.5 pb-2.5 pt-3 ${collapsed ? '' : 'mb-1 border-b'} ${
          onToggle ? 'cursor-pointer transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent' : ''
        }`}
        // Washed with the colour this day is drawn in, and only while the map is drawing
        // days in colour: on the map the colour is what tells one day from the next, and
        // a rail that ignored it would leave the reader matching a green line to a card
        // that gives no sign of being the green one. A tenth of the hue is enough to
        // recognise and quiet enough that the day's own facts still read first.
        style={tint ? {
          backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${tint} 13%, var(--bg-secondary)), color-mix(in srgb, ${tint} 5%, var(--bg-secondary)))`,
          borderBottomColor: `color-mix(in srgb, ${tint} 30%, transparent)`,
        } : undefined}
      >
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
            <time dateTime={day.date} className={`${DAY_BADGE} border border-edge bg-surface-card`} style={{ fontSize: FS.label }}>
              {formatDate(day.date, language)}
            </time>
          ) : null}
          <span className={`${DAY_BADGE} bg-surface-card`} style={{ fontSize: FS.label }}>
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
          <span className={`${DAY_BADGE} bg-surface-card`} style={{ fontSize: FS.label }}>
            {t('roadtrip.day.stopCount', { count: day.stops.filter(s => !s.automaticNight && !isServiceStopType(s.stopType)).length })}
          </span>
          {/* The other half of "where possible". The setting is a weighting, so a day
              with no untolled crossing comes back on the toll road — and the only thing
              worse than not avoiding it is not avoiding it silently, which reads as the
              switch being broken. Among the day's facts because that is what it is: a
              fact about this day's roads, not a warning about the plan. */}
          {day.avoidMissed?.length ? (
            <Tooltip label={t('roadtrip.avoid.missedHint')}>
              <span className={`${DAY_BADGE} gap-1 bg-surface-card text-content-secondary`} style={{ fontSize: FS.label }}>
                <Ban size={10} className="shrink-0" aria-hidden />
                {t('roadtrip.avoid.missed', {
                  classes: day.avoidMissed.map(cls => t(`roadtrip.avoid.${cls}`)).join(', '),
                })}
              </span>
            </Tooltip>
          ) : null}
          {/* Among the day's facts rather than beside its title, because "which road this
              day takes" is one of them. Tinted once the day carries vias: the rail draws
              none of them, so this badge is the only place a drive shaped by hand differs
              from one the router picked on its own. */}
          {onFollowTrack ? (
            <Tooltip label={trackName ? t('roadtrip.track.current', { name: trackName }) : t('roadtrip.track.hint')}>
              <button
                type="button"
                onClick={() => onFollowTrack(day.dayId)}
                className={`${DAY_BADGE} gap-1 transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  viaCount ? 'bg-accent-subtle text-content' : 'bg-surface-card hover:bg-surface-hover'
                }`}
                style={{ fontSize: FS.label }}
              >
                <Spline size={10} className="shrink-0" aria-hidden />
                {t('roadtrip.track.badge')}
              </button>
            </Tooltip>
          ) : null}
        </div>
      </header>
      {/* One list item per stop, with the drive that follows it inside — the chain is a
          list of places, not of alternating places and connectors. A service stop owns
          the drive leaving it in exactly the same way, which is what splits its leg into
          band, marker, band without the list needing a second shape. */}
      {/* Folded to the header, and with it off the map: what is not listed here is not
          drawn there either, which is the whole point of putting a day away. */}
      <ol className="px-3.5 pb-3 pt-3" hidden={collapsed}>
        {runs.map(run => (
          run.spill ? (
            <SpillBlock key={`spill-${run.from}`} spill={run.spill}>
              {day.stops.slice(run.from, run.to).map((stop, n) => renderStop(stop, run.from + n))}
            </SpillBlock>
          ) : (
            <React.Fragment key={`run-${run.from}`}>
              {day.stops.slice(run.from, run.to).map((stop, n) => renderStop(stop, run.from + n))}
            </React.Fragment>
          )
        ))}
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
      {filling ? (
        <StopFillPicker
          anchor={filling.anchor}
          current={filling.stop.fillPercent ?? null}
          onClose={() => setFilling(null)}
          onPick={percent => {
            setFilling(null)
            void onSetStopFill?.(filling.stop.placeId, percent)
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
  onSetStopKind, onSetStopFill, onFollowTrack, viaCounts, trackNames, refuel, onAskRefuel, onAcceptRefuel,
  collapsedDayIds, onToggleDay, onFocusPoint,
}: RoadtripSidebarProps): React.ReactElement {
  const { t } = useTranslation()
  // One drag state for the whole rail rather than one per day: a stop that cannot leave
  // its own day is exactly the move a road trip needs when a leg turns out too long.
  const [from, setFrom] = React.useState<DragState['from']>(null)
  const [dropAt, setDropAt] = React.useState<DragState['dropAt']>(null)
  const drag: DragState = { from, setFrom, dropAt, setDropAt }

  // Nothing to total up, so nothing pretends to: no "0 km" standing above "No route yet".
  if (routes.days.length === 0) {
    // Centred in the rail rather than sitting at its top: the state is about the
    // whole column being empty, and a mascot pinned under the header reads as a
    // header decoration.
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
        {/* The mascot rather than a pin and two lines of instructions. The rail
            is empty because the trip has no days with places yet, which is a
            state, not a task list: the same look every other empty state in TREK
            has. */}
        <EmptyState
          scene="transport"
          mood="sad"
          title={t('roadtrip.empty.title')}
          size={96}
          surface="var(--bg-secondary)"
        />
      </div>
    )
  }

  return (
    // The totals hold still while the days move under them: they are the answer to "how
    // long is this trip", and an answer that scrolls away is one you have to go back for.
    <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
      <div className="shrink-0">
        <TripSummary routes={routes} />
        {routes.dayWindowIssue ? (
          <p role="status" className="mx-3.5 mt-2 rounded-xl bg-warning-soft p-3 text-caption text-content">
            {t(`roadtrip.window.${routes.dayWindowIssue}`)}
          </p>
        ) : null}
      </div>
      <div className="roadtrip-rail-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-3.5">
        {routes.days.map(day => (
          <DaySection
            key={day.dayId}
            day={day}
            onFocusPoint={onFocusPoint}
            selectedAssignmentId={selectedAssignmentId}
            onSelectStop={onSelectStop}
            onReorderStop={onReorderStop}
            onMoveStopToDay={onMoveStopToDay}
            drag={drag}
            onAskAlternatives={onAskAlternatives}
            openAlternatives={openAlternatives}
            onEditStay={onEditStay}
            onSetStopKind={onSetStopKind}
            onSetStopFill={onSetStopFill}
            onFollowTrack={day.dayId < 0 ? undefined : onFollowTrack}
            viaCount={viaCounts?.[day.dayId] ?? 0}
            trackName={trackNames?.[day.dayId]}
            refuel={refuel}
            onAskRefuel={onAskRefuel}
            onAcceptRefuel={onAcceptRefuel}
            loading={routes.loading}
            collapsed={collapsedDayIds?.has(day.dayId)}
            onToggle={onToggleDay ? () => onToggleDay(day.dayId) : undefined}
          />
        ))}
        {routes.quietDays.map(day => (
          <QuietDaySection key={`quiet-${day.dayId}`} day={day} onMoveStopToDay={onMoveStopToDay} drag={drag} />
        ))}
      </div>
    </div>
  )
}
