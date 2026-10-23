import React from 'react'
import { useElementSize } from '../../hooks/useElementSize'
import { AlertTriangle, Ban, CarFront, ChevronDown, ChevronRight, MapPin, Spline } from 'lucide-react'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatDate } from '../../utils/formatters'
import { formatDurationShort } from './roadtripModel'
import { destinationCount } from './roadtripRowModel'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'
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
 * Distance, driving time and stops for the whole trip: the head above the day cards,
 * as three tiles in the cost tab's language, each a small eyebrow over its number.
 *
 * Pulled narrow, the stops go first: they are the figure the rail itself shows best, one
 * row per stop, while distance and time are only summed up here.
 */
export function TripSummary({ routes, narrow }: { routes: RoadtripRoutes; narrow: boolean }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit) || 'metric'
  const cells: [string, string][] = [
    // `totalStops` already leaves the service stops out, so the head and the day pills
    // below count the same thing without either of them recounting the other's stops.
    [t('roadtrip.summary.distance'), formatDistance(routes.totalDistance / 1000, distanceUnit)],
    [t('roadtrip.summary.driving'), formatDurationShort(routes.totalDuration)],
    ...(narrow ? [] : [[t('roadtrip.summary.stops'), String(routes.totalStops)] as [string, string]]),
  ]
  return (
    <header className="mx-3.5 overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
      <div className="grid gap-1.5 p-1.5" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
        {cells.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-1.5 rounded-xl px-2.5 pb-2 pt-2" style={{ background: NEUTRAL_TINT }}>
            <span className={`${STAT_LABEL} truncate`} style={fs(9.5)}>{label}</span>
            <span
              className="whitespace-nowrap font-semibold leading-none tracking-[-0.03em] tabular-nums text-content"
              style={fs(17, 'subtitle')}
            >
              {splitValue(value)}
            </span>
          </div>
        ))}
      </div>
      {/* Legs land one request at a time, so until the last is in, every number above is
          a partial sum. A total that looks final and is not is worse than a slow one. */}
      {routes.loading ? (
        <p className="m-0 break-words px-3 pb-2.5 text-center text-content-faint" style={{ fontSize: FS.meta }}>
          {t('roadtrip.summary.partial')}
        </p>
      ) : null}
    </header>
  )
}

/**
 * A date short enough for the day tile, in the order the reader's clock setting implies:
 * month first with the 12-hour clock ("10/5"), day first with the 24-hour one ("5.10.").
 */
function shortDate(iso: string, is12h: boolean): string {
  const [, m, d] = iso.split("-").map(Number)
  if (!m || !d) return iso
  return is12h ? `${m}/${d}` : `${d}.${m}.`
}


/**
 * Roughly how wide a day head pill is: its padding, its icon and the gap after it, and
 * its text in uppercase Geist at 10px with the pill's letter-spacing.
 */
function pillWidth(text: string): number {
  return 16 + 11 + 4 + text.length * 6.6
}

/**
 * How far the pill row gives way for its width: 0 shows everything, 1 the stop count
 * without its word, 2 the drive without its time as well, 3 no stop count at all. A null
 * drive or count is a pill the day does not show; an unmeasured row (0) fits everything.
 */
function pillStep(width: number, drive: { full: string; short: string } | null, count: { full: string; short: string } | null, others: string[]): number {
  const needed = (driveText: string | undefined, countText: string | undefined) =>
    [driveText, countText, ...others]
      .filter((x): x is string => x !== undefined)
      .reduce((sum, text, i) => sum + pillWidth(text) + (i ? 4 : 0), 0)
  const fits = (w: number) => width === 0 || w <= width
  if (fits(needed(drive?.full, count?.full))) return 0
  if (fits(needed(drive?.full, count?.short))) return 1
  return fits(needed(drive?.short, count?.short)) ? 2 : 3
}

/** The texts of the pills after the drive and the count, for reckoning the row's width. */
function flagTexts(day: RoadtripDay, followable: boolean, t: ReturnType<typeof useTranslation>['t']): string[] {
  return [
    day.dayWarning ? t('roadtrip.limit.dayOver', { time: formatDurationShort((day.dayWarning.minutes - day.dayWarning.limitMinutes) * 60) }) : null,
    day.avoidMissed?.length ? t('roadtrip.avoid.missed', { classes: day.avoidMissed.map(cls => t(`roadtrip.avoid.${cls}`)).join(', ') }) : null,
    followable ? t('roadtrip.track.badge') : null,
  ].filter((x): x is string => !!x)
}

/**
 * The day's number on a raised tile, the way the day plan badges a day, with its date
 * folded in under it where the day plan keeps the weather.
 */
export function DayTile({ day, tint }: { day: RoadtripDay; tint: string | null }): React.ReactElement {
  const { language } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === "12h"
  return (
    <span
      className="flex w-9 flex-none flex-col items-center overflow-hidden rounded-[10px] font-geist font-bold tabular-nums shadow-sm"
      style={{
        background: tint ? `color-mix(in srgb, ${tint} 22%, var(--bg-card))` : 'var(--bg-card)',
        color: tint ? 'var(--text-secondary)' : 'var(--text-muted)',
      }}
    >
      <span className={`grid w-full place-items-center ${day.date ? 'h-6' : 'h-8'}`} style={{ ...fs(12), lineHeight: 1 }}>
        {day.dayNumber}
      </span>
      {day.date ? (
        <>
          <span aria-hidden className="h-px w-[60%] flex-none bg-current opacity-25" />
          <time dateTime={day.date} aria-label={formatDate(day.date, language)} className="grid h-6 w-full place-items-center font-semibold" style={{ ...fs(9.5), lineHeight: 1 }}>
            {shortDate(day.date, is12h)}
          </time>
        </>
      ) : null}
    </span>
  )
}

/** The pills after the drive and the count: the limit, the missed avoidance and the track. */
function DayFlags({ day, pill, warn, onFollowTrack, viaCount, trackName }: {
  day: RoadtripDay
  pill: string
  warn: string
  onFollowTrack?: (dayId: number) => void
  viaCount?: number
  trackName?: string
}): React.ReactElement {
  const { t } = useTranslation()
  return (
    <>
      {day.dayWarning ? (
        <Tooltip label={t('roadtrip.limit.hint')}>
          <span className={warn}>
            <AlertTriangle size={11} className="shrink-0" aria-hidden />
            {t('roadtrip.limit.dayOver', {
              time: formatDurationShort((day.dayWarning.minutes - day.dayWarning.limitMinutes) * 60),
            })}
          </span>
        </Tooltip>
      ) : null}
      {/* The other half of "where possible": a day with no untolled crossing comes
          back on the toll road, and saying nothing reads as the switch being broken. */}
      {day.avoidMissed?.length ? (
        <Tooltip label={t('roadtrip.avoid.missedHint')}>
          <span className={pill}>
            <Ban size={11} className="shrink-0 text-content-faint" aria-hidden />
            {t('roadtrip.avoid.missed', {
              classes: day.avoidMissed.map(cls => t(`roadtrip.avoid.${cls}`)).join(', '),
            })}
          </span>
        </Tooltip>
      ) : null}
      {/* Which road this day takes is one of its facts. Filled once the day carries
          vias: the rail draws none of them, so this pill is the only place a drive
          shaped by hand differs from one the router picked on its own. */}
      {onFollowTrack ? (
        <Tooltip label={trackName ? t('roadtrip.track.current', { name: trackName }) : t('roadtrip.track.hint')}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onFollowTrack(day.dayId) }}
            className={`${DAY_BADGE} shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              viaCount ? 'bg-accent text-accent-text' : 'bg-surface-card hover:text-content'
            }`}
          >
            <Spline size={11} className="shrink-0" aria-hidden />
            {t('roadtrip.track.badge')}
          </button>
        </Tooltip>
      ) : null}
    </>
  )
}

/** The head band's resting and hover wash, the day plan's own. */
const HEAD_REST = NEUTRAL_TINT
const HEAD_HOVER = 'color-mix(in srgb, var(--accent) 10%, transparent)'

/**
 * A day card's head, in the day plan's language: the day's number on a raised tile, its
 * name and date on one line beside it, its facts as pills under them, and the fold
 * control at the end.
 *
 * At module scope on purpose: declared inside the card it would remount on every render
 * and drop the keyboard focus on the fold control.
 */
export function DayHeader({ day, collapsed, onToggle, onFollowTrack, viaCount, trackName, dayColors }: Readonly<{
  day: RoadtripDay
  /** Whether days wear their own colour, when the drive shown is not the trip's saved one. Absent reads the setting. */
  dayColors?: boolean
  /** Folded down to the header, and off the map with it. */
  collapsed?: boolean
  onToggle?: () => void
  /** Kept for the rail's call; the row now measures its own room. */
  narrow?: boolean
  onFollowTrack?: (dayId: number) => void
  viaCount?: number
  trackName?: string
}>): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit) || 'metric'
  // The colour the map draws this day in, or none while the map draws one blue line for
  // the whole trip. With it on, the tile wears the colour and the band a tenth of it, so
  // a green line on the map finds its card.
  const dayColorsOn = useRoadtripSettings(s => dayColors ?? !!s.roadtrip_day_colors)
  const tint = dayColorsOn ? dayColor(day.dayNumber).line : null
  const rest = tint ? `color-mix(in srgb, ${tint} 11%, transparent)` : HEAD_REST
  const hover = tint ? `color-mix(in srgb, ${tint} 17%, transparent)` : HEAD_HOVER
  const dayName = t('roadtrip.day', { number: day.dayNumber })
  const stops = destinationCount(day)
  const pill = `${DAY_BADGE} flex-none bg-surface-card shadow-sm`
  const warn = `${DAY_BADGE} flex-none bg-warning-soft text-warning`
  // The pills never wrap. When the row runs out of room they give way in steps:
  // 1 the stop count drops its word, 2 the drive drops its time, 3 the stop count goes.
  // The row's width is measured; each pill's is reckoned from its text, which at this
  // size is close enough to choose a step without rendering every step to try it.
  const { ref: rowRef, width: rowWidth } = useElementSize<HTMLDivElement>()
  const driveFull = t('roadtrip.leg.driveText', {
    distance: formatDistance(day.distance / 1000, distanceUnit),
    time: formatDurationShort(day.duration),
  })
  const driveShort = formatDistance(day.distance / 1000, distanceUnit)
  const stopsFull = t('roadtrip.day.stopCount', { count: stops })
  const hasDrive = day.legs.length > 0
  const compact = pillStep(
    rowWidth,
    hasDrive ? { full: driveFull, short: driveShort } : null,
    hasDrive && stops > 0 ? { full: stopsFull, short: String(stops) } : null,
    flagTexts(day, !!onFollowTrack, t),
  )
  return (
    <header
      // The whole band folds the day and the chevron at its end says so: the band is what
      // somebody is already looking at when they decide to put a day away.
      {...(onToggle ? {
        role: 'button' as const,
        // No press-scale: shrinking the band pulls its wash in from the card's edges.
        'data-no-press': true,
        tabIndex: 0,
        'aria-expanded': !collapsed,
        'aria-label': dayName,
        onClick: onToggle,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
        },
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = hover },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = rest },
      } : {})}
      className={`flex items-start gap-2.5 py-2.5 pe-2 ps-2.5 transition-colors ${
        onToggle ? 'cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent' : ''
      }`}
      style={{ background: rest }}
    >
      <DayTile day={day} tint={tint} />

      <div className="min-w-0 flex-1 pt-px">
        <h3 className="m-0 min-w-0 truncate font-bold text-content" style={fs(13.5, 'body')}>
          {day.title || dayName}
        </h3>
        <div ref={rowRef} className="mt-1.5 flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden" style={{ fontSize: FS.meta }}>
          {/* A day that is only the night booked for it has no drive to sum up and no
              stop to count; the hotel row below says everything it has to say. */}
          {day.legs.length > 0 ? (
            <span className={pill}>
              <CarFront size={11} strokeWidth={2} className="shrink-0 text-content-faint" aria-hidden />
              {compact >= 2 ? driveShort : driveFull}
            </span>
          ) : null}
          {/* Nor does a day whose drive runs from one hotel to the next with no stop of its
              own: "0 stops" beside the drive reads as the stops having gone missing. */}
          {day.legs.length > 0 && stops > 0 && compact < 3 ? (
            <span className={pill} aria-label={stopsFull}>
              <MapPin size={11} strokeWidth={2} className="shrink-0 text-content-faint" aria-hidden />
              {compact >= 1 ? stops : stopsFull}
            </span>
          ) : null}
          <DayFlags day={day} pill={pill} warn={warn} onFollowTrack={onFollowTrack} viaCount={viaCount} trackName={trackName} />
        </div>
      </div>

      {onToggle ? (
        <span aria-hidden className="grid h-7 w-7 flex-none place-items-center rounded-full text-content-muted">
          {collapsed ? <ChevronRight size={15} strokeWidth={2} className="rtl:rotate-180" /> : <ChevronDown size={15} strokeWidth={2} />}
        </span>
      ) : null}
    </header>
  )
}
