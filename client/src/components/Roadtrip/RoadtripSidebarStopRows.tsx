import React from 'react'
import { ParkingSquare, Zap } from 'lucide-react'
import ChargingInfo from './ChargingInfo'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { formatDurationShort, refuelsRange, serviceColor, type ScheduleEntry, type ScheduleWarning } from './roadtripModel'
import { STOP_KIND_BY_KEY } from './stopKinds'
import { spurWorthLabelling } from './accessSpur'
import { useVehicleRange } from './useVehicleRange'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { RouteVia } from '../../types'
import { readStay } from './stayReading'
import { FS } from './typeScale'
import { DISC, RAIL_DASH, RAIL_GRID } from './RoadtripSidebar.constants'
import { Arrival, DriveFindingBadge, FillBadge, LateBadge, NightCheckIn, OffRoadBadge, StayBadge } from './RoadtripSidebarBadges'

/**
 * What a stop will actually fill to: its own figure, else the traveller's default.
 *
 * Null means nothing worth saying: no per-stop figure and a default that fills right up,
 * which is what the budget did before any of this existed. An explicit 100 on the stop is
 * NOT null: on a trip whose default is 80 %, "this one goes right up" is a decision, and
 * hiding it would leave the traveller reading 80 on a stop that fills to 100.
 */
function effectiveFill(own: number | null | undefined, setting: number | undefined): number | null {
  if (own !== null && own !== undefined) return own
  return setting && setting > 0 && setting < 100 ? setting : null
}

/**
 * The badges under a stop's name, shared by both stop shapes so the two cannot drift
 * apart. It renders the bare span and nothing around it, so a stop's markup is exactly
 * what it was when each shape drew the row itself.
 */
function StopBadgeRow({ stop, entry, late, driveFindings, onEditStay, onPickFill }: Readonly<{
  stop: RoadtripStop
  entry: ScheduleEntry | undefined
  late: ScheduleWarning[]
  driveFindings?: ScheduleWarning[]
  onEditStay?: () => void
  onPickFill?: (anchor: HTMLElement) => void
}>): React.ReactElement {
  // Read here rather than threaded down from the rail: the fill badge is the only thing in
  // it that depends on them.
  const fillPercent = useRoadtripSettings(s => s.roadtrip_fill_percent)
  const { vehicleKind } = useVehicleRange()
  return (
    <span className="flex flex-wrap items-center gap-1">
      <NightCheckIn stop={stop} />
      <StayBadge stay={readStay(stop, entry)} onEdit={onEditStay} />
      {refuelsRange(stop.stopType, vehicleKind) ? (
        <FillBadge
          percent={effectiveFill(stop.fillPercent, fillPercent)}
          own={stop.fillPercent !== null && stop.fillPercent !== undefined}
          onEdit={onPickFill}
        />
      ) : null}
      {spurWorthLabelling(stop.offRoadMeters) ? <OffRoadBadge meters={stop.offRoadMeters ?? 0} /> : null}
      {(driveFindings ?? []).map(w => <DriveFindingBadge key={w.code} warning={w} />)}
      {late.map(w => <LateBadge key={w.code} late={w} />)}
    </span>
  )
}

/**
 * A charger, a filling station or a rest stop: a stop that interrupts the drive.
 *
 * It sits inside the leg with the dashed line running through it, carries no number and
 * is left out of every count, because that is the difference between it and the places
 * the trip is actually for. Its own icon on one flat disc: three kinds of pause that all
 * mean "we are still driving", and the icon is what tells them apart.
 */
export function ServiceStop({ stop, entry, late, driveFindings, selected, onSelect, onEditStay, onPickKind, onPickFill }: {
  stop: RoadtripStop
  entry: ScheduleEntry | undefined
  /** How late the drive reaches a time pinned on this pause, or the time it was set to
   *  be left at: the same findings a numbered stop shows. A fuel or charging halt can
   *  carry a pinned time like anything else. */
  late: ScheduleWarning[]
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
  // Icon and name both come from the one stop-kind table. The rail used to keep its own
  // copy of each, and its rest_area icon had drifted away from the popup's.
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
              // theme-lint-disable: the road-signage palette in `roadtripModel`, shared
              // with the corridor list and the map pin so one kind of stop looks like
              // itself wherever it turns up.
              style={{ background: serviceColor(stop.stopType), color: '#fff' }} // theme-lint-disable: road-signage palette
            >
              <Icon size={12} strokeWidth={2.1} aria-hidden />
            </span>
          </Tooltip>
        ) : (
          <span
            className={DISC}
            // theme-lint-disable: same palette, read-only.
            style={{ background: serviceColor(stop.stopType), color: '#fff' }} // theme-lint-disable: road-signage palette
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
              on the map pin, whereas a place's name is the row's whole reason to exist. */}
          <span
            className="flex min-w-0 items-center gap-2 font-semibold leading-6 tracking-[-0.012em] text-content-secondary"
            style={{ fontSize: FS.name }}
          >
            <span className="min-w-0 truncate">{stop.name}</span>{stop.stopType === 'charging' && <ChargingInfo placeId={stop.placeId} compact />}
          </span>
          <StopBadgeRow stop={stop} entry={entry} late={late} driveFindings={driveFindings} onEditStay={onEditStay} onPickFill={onPickFill} />
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
export function RouteViaStop({ via }: { via: RouteVia }): React.ReactElement {
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

export function Stop({ stop, number, entry, late, driveFindings, selected, continues, starts, onSelect, onMove, canMove, onEditStay, onPickKind, onPickFill }: {
  stop: RoadtripStop
  /** Position within the day: the same count the map badges its markers with. */
  number: number
  entry: ScheduleEntry | undefined
  /** Arriving after a pinned time, or after the time this stop was set to be left at. */
  late: ScheduleWarning[]
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
            <span className={stop.stopType === 'charging' ? 'min-w-0 truncate' : 'min-w-0 break-words'}>{stop.name}</span>{stop.stopType === 'charging' && <ChargingInfo placeId={stop.placeId} compact />}
          </span>
          {/* Two halves under one border: the word says what the number means, so the
              number needs no unit of explanation beside it. */}
          {/* One row, wrapping: the stay and the walk from the road are both answers to
              "what does this stop cost", and the second only appears when the gap is far
              enough to change the plan. The dashed line on the map already says there is
              one; the number is for luggage, a gate, a track a hire car should not be on. */}
          <StopBadgeRow stop={stop} entry={entry} late={late} driveFindings={driveFindings} onEditStay={onEditStay} onPickFill={onPickFill} />
        </span>
        {entry?.arrival ? <Arrival entry={entry} /> : null}
      </span>
    </button>
  )
}
