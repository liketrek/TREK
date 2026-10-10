import React from 'react'
import { AlertTriangle, Ban, Spline } from 'lucide-react'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatDate } from '../../utils/formatters'
import { formatDurationShort } from './roadtripModel'
import { destinationCount } from './roadtripRowModel'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'
import { missedRide } from './carrierRide'
import { dayColor } from './dayColors'
import { FS } from './typeScale'
import { DAY_BADGE, STAT_LABEL } from './RoadtripSidebar.constants'

/** The quiet half of a measurement: the unit, and anything after the decimal point. */
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
 * Distance, driving time and stops for the whole trip: the head the left column never
 * had, above the day cards and reading as one card with them.
 *
 * Three equal centred columns with hairlines between them, rather than three labelled
 * rows: the labels are the quiet part and the numbers are what the head exists for, so
 * the numbers get the size and the labels get the letter-spacing.
 *
 * Pulled narrow, the stops go first, with their hairline: they are the figure the rail
 * itself shows best, one row per stop, while distance and time are only summed up here.
 */
export function TripSummary({ routes, narrow }: { routes: RoadtripRoutes; narrow: boolean }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const cells: [string, string][] = [
    // `totalStops` already leaves the service stops out, so the head and the day badges
    // below count the same thing without either of them recounting the other's stops.
    [t('roadtrip.summary.distance'), formatDistance(routes.totalDistance / 1000, distanceUnit)],
    [t('roadtrip.summary.driving'), formatDurationShort(routes.totalDuration)],
    ...(narrow ? [] : [[t('roadtrip.summary.stops'), String(routes.totalStops)] as [string, string]]),
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
 * A day card's head: its name and title, its facts as badges, and the fold control.
 *
 * Rendered as the bare `<header>` with nothing around it, so the card's markup is the same
 * as when the card drew it inline. At module scope on purpose: declared inside the card it
 * would remount on every render and drop the keyboard focus on the fold control.
 */
export function DayHeader({ day, collapsed, onToggle, narrow, onFollowTrack, viaCount, trackName }: Readonly<{
  day: RoadtripDay
  /** Folded down to the header, and off the map with it. */
  collapsed?: boolean
  onToggle?: () => void
  /** The rail is pulled too narrow for every badge; the stop count gives way. */
  narrow?: boolean
  onFollowTrack?: (dayId: number) => void
  viaCount?: number
  trackName?: string
}>): React.ReactElement {
  const { t, language } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  // A ride the drive gets to too late is said in the header too, where a folded day still shows it.
  const missed = missedRide(day, t, is12h)
  // The colour the map draws this day in, or none at all while the map is drawing one
  // blue line for the whole trip.
  const dayColorsOn = useRoadtripSettings(s => !!s.roadtrip_day_colors)
  const tint = dayColorsOn ? dayColor(day.dayNumber).line : null
  return (
    // Centred, with the day's facts as badges beneath its name: at this width a row
    // of label-and-value pairs breaks awkwardly, while three short badges wrap
    // gracefully and stay readable in every language.
    //
    // A tint of its own, not just a hairline: the header holds the day's summed facts
    // and the list below holds its stops, and `--bg-hover` at 40% is 1% black in light
    // mode, a separation nobody could see. `--bg-secondary` lifts off the card in
    // both themes while staying a step under the badges sitting on it.
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
      // under them. Folded, they left a white strip of card below the tinted header,
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
        {/* A day that is only the night booked for it has no drive to sum up and no
            stop to count; the hotel row below says everything it has to say. */}
        {day.legs.length > 0 ? (
          <span className={`${DAY_BADGE} bg-surface-card`} style={{ fontSize: FS.label }}>
            {t('roadtrip.leg.driveText', {
              distance: formatDistance(day.distance / 1000, distanceUnit),
              time: formatDurationShort(day.duration),
            })}
          </span>
        ) : null}
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
        {missed ? (
          <Tooltip label={missed.hint}>
            <span className={`${DAY_BADGE} gap-1 bg-warning-soft text-warning`} style={{ fontSize: FS.label }}>
              <AlertTriangle size={10} className="shrink-0" aria-hidden />
              {missed.label}
            </span>
          </Tooltip>
        ) : null}
        {/* Nor does a day whose drive runs from one hotel to the next with no stop of its
            own: "0 stops" beside the drive reads as the stops having gone missing. */}
        {day.legs.length > 0 && destinationCount(day) > 0 && !narrow ? (
          <span className={`${DAY_BADGE} bg-surface-card`} style={{ fontSize: FS.label }}>
            {t('roadtrip.day.stopCount', { count: destinationCount(day) })}
          </span>
        ) : null}
        {/* The other half of "where possible". The setting is a weighting, so a day
            with no untolled crossing comes back on the toll road, and the only thing
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
  )
}
