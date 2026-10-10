import React from 'react'
import { AlertTriangle, BatteryCharging, Clock, Footprints, Fuel } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatClockTime } from '../../utils/formatters'
import { formatDurationShort, type ScheduleEntry, type ScheduleWarning } from './roadtripModel'
import type { RoadtripStop } from './useRoadtripRoutes'
import { FS } from './typeScale'
import FigureBadge from './FigureBadge'
import { shownStay, type StayReading } from './stayReading'

/**
 * How far the road stops short of the place, in the same two-part shell the stay wears.
 *
 * Beside the stay rather than under it: both answer "what does this stop cost you", one
 * in time and one in a walk, and two badges on one line read as one fact about the stop
 * instead of two unrelated notes stacked up.
 */
export function OffRoadBadge({ meters }: { meters: number }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  return (
    <FigureBadge
      lead={<Footprints size={9} aria-hidden />}
      value={formatDistance(meters / 1000, distanceUnit)}
      tooltip={t('roadtrip.stop.offRoad', { distance: formatDistance(meters / 1000, distanceUnit) })}
    />
  )
}

/**
 * What a fill-up here actually puts in, beside the stay it takes.
 *
 * Only on a stop that refuels, because it is the only stop where the answer changes
 * anything. It reads as the second half of the stay badge because that is what it is:
 * how long you stand here, and what you get for it.
 *
 * The figure is the stop's own when it has one and the traveller's default otherwise, so
 * what the badge says is always what the range budget will actually use. With neither it
 * shows a "+", the same invitation the stay badge makes when nothing is planned yet: this
 * badge is the only way into the per-stop figure, and a badge that hid itself until a
 * value existed could never be used to create one.
 */
export function FillBadge({ percent, own, onEdit }: {
  /** What this stop will actually fill to, inherited or not. Null when nothing says. */
  percent: number | null
  /** Whether that figure is the stop's own rather than the traveller's default. */
  own: boolean
  onEdit?: (anchor: HTMLElement) => void
}): React.ReactElement | null {
  const { t } = useTranslation()
  if (percent === null && !onEdit) return null
  return (
    <FigureBadge
      lead={<BatteryCharging size={9} aria-hidden />}
      value={percent === null ? '+' : `${percent} %`}
      faint={percent === null || !own}
      valueSize="micro"
      tooltip={onEdit ? (percent === null ? t('roadtrip.stop.fillSet') : t('roadtrip.limit.fillBadge', { percent })) : undefined}
      onActivate={onEdit}
    />
  )
}

/**
 * The check-in of the night a stay's own stop begins, on the day it does: the hour the
 * room is ready, which is also what holds the arrival clock beside it when the drive gets
 * there first.
 */
export function NightCheckIn({ stop }: { stop: RoadtripStop }): React.ReactElement | null {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  if (!stop.night || !stop.checkInTime) return null
  return <FigureBadge caption lead={t('roadtrip.bookend.checkIn')} value={formatClockTime(stop.checkInTime, is12h)} />
}

/**
 * How long the traveller stays here, and the way to change it.
 *
 * On every stop, not only the ones that already carry a time: the value has never been
 * editable anywhere in TREK, so a stop that has none needs somewhere to say so before it
 * can get one. Unset it reads as a plus in the slot the number will occupy, which keeps
 * the two states the same shape and the same width: a row does not jump when a stay is
 * added to it.
 *
 * Read-only for someone who cannot edit the trip: then it is a label, and a stop without
 * a stay shows nothing at all rather than an invitation that leads nowhere.
 *
 * A stop the traveller leaves at a set time is stood at until then, so the badge reads the
 * stay the schedule made of that and says until when.
 */
export function StayBadge({ stay, onEdit }: { stay: StayReading; onEdit?: () => void }): React.ReactElement | null {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const shown = shownStay(stay)
  const text = shown === null ? null : formatDurationShort(shown * 60)
  const until = stay.until ? t('roadtrip.stay.until', { time: formatClockTime(stay.until, is12h) }) : null
  if (!text && !until && !onEdit) return null
  return (
    <FigureBadge
      caption
      lead={t('roadtrip.stop.stayShort')}
      value={(
        <>
          {text ?? (until ? null : '+')}
          {until ? <span className={`font-medium text-content-faint ${text ? 'ms-1' : ''}`}>{until}</span> : null}
        </>
      )}
      faint={!text}
      tooltip={onEdit ? t('roadtrip.stop.stay') : undefined}
      onActivate={onEdit}
      ariaLabel={onEdit
        ? text || until ? `${t('roadtrip.stop.stay')}: ${[text, until].filter(Boolean).join(' ')}` : t('roadtrip.stay.add')
        : undefined}
    />
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
export function DriveFindingBadge({ warning }: { warning: ScheduleWarning }): React.ReactElement | null {
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
    <FigureBadge
      tone="warning"
      lead={<Icon size={9} aria-hidden />}
      value={warning.code === 'range'
        ? formatDistance(warning.sinceKm ?? 0, distanceUnit)
        : `+${formatDurationShort((warning.overMinutes ?? 0) * 60)}`}
      tooltip={text}
    />
  )
}

/**
 * The timetable convention: past midnight the clock keeps reading small numbers, so the
 * day it belongs to travels with it instead of sitting a line away as a separate note.
 */
export function DayCarry({ days }: { days: number }): React.ReactElement | null {
  const { t } = useTranslation()
  if (days <= 0) return null
  return (
    <span className="ms-0.5">
      {`+${days}`}
      <span className="sr-only">{` ${t('roadtrip.warn.overnight')}`}</span>
    </span>
  )
}

export function Arrival({ entry }: { entry: ScheduleEntry }): React.ReactElement {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const text = formatClockTime(entry.arrival, is12h)
  const carry = <DayCarry days={entry.dayOffset} />

  // Every arrival is plain text at the row's right edge, pinned or not. The pinned one
  // used to be a filled pill with a clock, which made a column of quiet clock readings
  // look like it had a button in it. What is left of the distinction is weight and ink:
  // enough to see which time somebody chose, without a second shape in the rail.
  return (
    <Tooltip label={entry.anchored ? t('roadtrip.stop.pinned') : t('roadtrip.stop.computed')}>
    <span
      dir="ltr"
      // The same line box as the stop name beside it, so the two sit on one line however
      // far apart their sizes are, and the row reads across, not in two staggered halves.
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
export function LateBadge({ late }: { late: ScheduleWarning }): React.ReactElement {
  const { t } = useTranslation()
  const label = t(late.code === 'missedLeave' ? 'roadtrip.warn.missedLeave' : 'roadtrip.warn.late', { count: late.minutes ?? 0 })
  // The same two-part shell the stay and the drive findings wear, so a row of badges reads
  // as one set instead of a pill among boxes.
  return (
    <FigureBadge
      tone="warning"
      dir="ltr"
      lead={<AlertTriangle size={9} aria-label={label} />}
      value={`+${formatDurationShort((late.minutes ?? 0) * 60)}`}
      tooltip={label}
    />
  )
}
