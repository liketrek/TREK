import React from 'react'
import { MapPin, Clock, Car, Footprints, Bike, Milestone, Flag, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatDate } from '../../utils/formatters'
import { formatDurationShort, type ScheduleEntry, type ScheduleWarning } from './roadtripModel'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'

interface RoadtripSidebarProps {
  /** Legs and totals for the whole trip, computed once in the planner hook. */
  routes: RoadtripRoutes
  selectedAssignmentId?: number | null
  onSelectStop?: (placeId: number, assignmentId: number) => void
}

const MODE_ICON: Record<string, typeof Car> = {
  driving: Car,
  walking: Footprints,
  cycling: Bike,
}

function Totals({ distance, duration, stops }: { distance: number; duration: number; stops: number }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const cells: [typeof Milestone, string, string][] = [
    [Milestone, t('roadtrip.summary.distance'), formatDistance(distance / 1000, distanceUnit)],
    [Clock, t('roadtrip.summary.driving'), formatDurationShort(duration)],
    [Flag, t('roadtrip.summary.stops'), String(stops)],
  ]
  return (
    <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
      {cells.map(([Icon, label, value]) => (
        <div key={label} className="rounded-xl bg-surface-card border border-edge-faint px-2.5 py-2">
          <div className="flex items-start gap-1.5 text-content-faint">
            <Icon size={12} className="shrink-0 mt-[3px]" aria-hidden />
            {/* Wraps rather than truncates: "Driving time" and its translations do not
                fit one line in a third of the rail, and a clipped label reads as a bug. */}
            <span className="text-caption leading-tight">{label}</span>
          </div>
          <div className="text-body font-semibold text-content tabular-nums mt-0.5 truncate">{value}</div>
        </div>
      ))}
    </div>
  )
}

function Leg({ leg }: { leg: RouteSegment | undefined }): React.ReactElement {
  const { t } = useTranslation()
  const Icon = MODE_ICON[leg?.mode ?? 'driving'] ?? Car
  return (
    <div className="flex items-center gap-2 pl-[10px] py-1">
      <span className="w-px self-stretch bg-edge-secondary ml-[5px]" aria-hidden />
      <Icon size={12} className="text-content-faint shrink-0 ml-1.5" aria-hidden />
      <span className="text-caption text-content-muted tabular-nums truncate">
        {leg ? `${leg.distanceText} · ${leg.durationText}` : t('roadtrip.leg.pending')}
      </span>
    </div>
  )
}

function Stop({ stop, index, entry, warning, selected, onSelect }: {
  stop: RoadtripStop
  index: number
  entry: ScheduleEntry | undefined
  warning: ScheduleWarning | undefined
  selected: boolean
  onSelect?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const late = warning?.code === 'late'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-2.5 text-left rounded-lg px-1.5 py-1.5 transition-colors ${selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'}`}
      aria-current={selected ? 'true' : undefined}
    >
      <span
        className="shrink-0 w-[20px] h-[20px] rounded-full grid place-items-center text-caption font-semibold tabular-nums"
        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-on)' }}
      >
        {index + 1}
      </span>
      <span className="flex-1 min-w-0 truncate text-body text-content">{stop.name}</span>
      {late ? (
        <AlertTriangle
          size={13}
          className="shrink-0 text-warning"
          aria-label={t('roadtrip.warn.late', { minutes: warning?.minutes ?? 0 })}
        />
      ) : null}
      {stop.dwellMinutes ? (
        <span className="shrink-0 text-caption text-content-faint tabular-nums" title={t('roadtrip.stop.stay')}>
          {formatDurationShort(stop.dwellMinutes * 60)}
        </span>
      ) : null}
      {entry?.arrival ? (
        // A pinned time is what the user decided; a computed one is what the drive implies.
        // Same slot, different weight, so the chain reads as one column of times.
        <span
          className={`shrink-0 text-caption tabular-nums ${entry.anchored ? 'font-semibold text-content' : 'text-content-muted'}`}
          title={entry.anchored ? t('roadtrip.stop.pinned') : t('roadtrip.stop.computed')}
        >
          {entry.arrival}
        </span>
      ) : null}
    </button>
  )
}

function DaySection({ day, selectedAssignmentId, onSelectStop }: {
  day: RoadtripDay
  selectedAssignmentId?: number | null
  onSelectStop?: (placeId: number, assignmentId: number) => void
}): React.ReactElement {
  const { t, language } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  return (
    <section className="px-2 pb-2">
      <header className="flex items-baseline gap-2 px-1.5 py-1.5">
        <h3 className="text-body font-semibold text-content">{t('roadtrip.day', { number: day.dayNumber })}</h3>
        {day.date ? <span className="text-caption text-content-faint truncate">{formatDate(day.date, language)}</span> : null}
        <span className="ml-auto text-caption text-content-muted tabular-nums shrink-0">
          {formatDistance(day.distance / 1000, distanceUnit)} · {formatDurationShort(day.duration)}
        </span>
      </header>
      <div className="rounded-xl bg-surface-card border border-edge-faint px-1.5 py-1.5">
        {day.stops.map((stop, i) => (
          <React.Fragment key={stop.assignmentId}>
            <Stop
              stop={stop}
              index={i}
              entry={day.schedule.entries[i]}
              warning={day.schedule.warnings.find(w => w.index === i)}
              selected={selectedAssignmentId === stop.assignmentId}
              onSelect={onSelectStop ? () => onSelectStop(stop.placeId, stop.assignmentId) : undefined}
            />
            {i < day.stops.length - 1 ? <Leg leg={day.legs[i]} /> : null}
          </React.Fragment>
        ))}
      </div>
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
 */
export default function RoadtripSidebar({
  routes, selectedAssignmentId, onSelectStop,
}: RoadtripSidebarProps): React.ReactElement {
  const { t } = useTranslation()

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <Totals distance={routes.totalDistance} duration={routes.totalDuration} stops={routes.totalStops} />
      {routes.days.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <MapPin size={20} className="mx-auto mb-2.5 text-content-faint" aria-hidden />
          <h3 className="text-body font-semibold text-content">{t('roadtrip.empty.title')}</h3>
          <p className="text-caption text-content-muted mt-1">{t('roadtrip.empty.body')}</p>
        </div>
      ) : (
        routes.days.map(day => (
          <DaySection
            key={day.dayId}
            day={day}
            selectedAssignmentId={selectedAssignmentId}
            onSelectStop={onSelectStop}
          />
        ))
      )}
    </div>
  )
}
