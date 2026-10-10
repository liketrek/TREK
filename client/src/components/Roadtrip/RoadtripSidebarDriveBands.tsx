import React from 'react'
import { Bike, CarFront, Footprints, Moon, Shuffle, Zap, type LucideIcon } from 'lucide-react'
import MDancingTrek from '../../mobile/components/MDancingTrek'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatClockTime } from '../../utils/formatters'
import { formatDurationShort } from './roadtripModel'
import { isHop } from './roadtripRowModel'
import { isCarrierMode, type CarrierTerminal } from '@trek/shared/roadtrip'
import type { SpillMark } from './nightSpill'
import type { RouteSegment } from '../../types'
import { carrierIcon, rideDuration } from './carrierRide'
import { FS } from './typeScale'
import { RAIL_DASH, RAIL_GRID } from './RoadtripSidebar.constants'

const MODE_ICON: Record<string, LucideIcon> = {
  driving: CarFront,
  walking: Footprints,
  cycling: Bike,
}

/**
 * The drive between two stops, or between a stop and the charger halfway along it.
 *
 * Both numbers are rebuilt from the raw metres and seconds instead of the router's
 * pre-formatted strings: those spell a full hour "1 h 0 min", and they carry whichever
 * unit the leg was fetched with, so a km/mi switch showed stale text until the refetch
 * landed. One sentence rather than two values: "152 km in 1 h 38 min" is how the
 * distance and the time belong together, and it leaves the row's right edge for the
 * button instead of a second number.
 */
export function DriveBand({ leg, carrier, onAskAlternatives, alternativesOpen }: {
  leg: RouteSegment | undefined
  /** The booking, when the leg is a ride and not a road: the join into the day it lands on. */
  carrier?: CarrierTerminal
  /** Asks for other ways of driving this leg. Absent means the route is not editable. */
  onAskAlternatives?: () => void
  alternativesOpen?: boolean
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const mode = leg?.mode ?? 'driving'
  // A ride reads as the ride block's head does: the booking and its minutes under the
  // booking's icon. Through the road branches it was a car driving no distance for nine
  // hours, and a ride without a timetable was short enough to pass for a hop.
  const ride = isCarrierMode(mode)
  const duration = ride ? rideDuration(leg) : null
  const Icon = ride ? carrierIcon(mode) : mode.startsWith('plugin:') ? Zap : MODE_ICON[mode] ?? CarFront
  // A hop (the hire desk beside the terminal) keeps the line and drops the pill: there is
  // nothing to say about it and no other way to drive it.
  if (!ride && isHop(leg)) {
    return (
      <div className="grid" style={RAIL_GRID}>
        <span className="relative z-[1] flex min-h-[10px] flex-col items-center" aria-hidden>
          <span className="flex-1" style={RAIL_DASH} />
        </span>
        <span />
      </div>
    )
  }
  // The band's contents, shared by the clickable and the read-only shape so the two can
  // never drift apart in what they say.
  // A ride's minutes stand apart from its title and never truncate: a long booking title
  // would otherwise cut off the one figure the band exists for.
  const band = (
    <>
      <Icon size={12} strokeWidth={1.7} className="shrink-0" aria-hidden />
      {leg && ride ? (
        <>
          {carrier ? <span className="min-w-0 truncate font-medium" style={{ fontSize: FS.meta }}>{carrier.title}</span> : null}
          {duration ? <span className="shrink-0 font-medium tabular-nums" style={{ fontSize: FS.meta }}>{duration}</span> : null}
        </>
      ) : (
        <span className="min-w-0 truncate font-medium tabular-nums" style={{ fontSize: FS.meta }}>
          {!leg
            ? t('roadtrip.leg.pending')
            : t('roadtrip.leg.driveText', {
              distance: formatDistance(leg.distance / 1000, distanceUnit),
              time: formatDurationShort(leg.duration),
            })}
        </span>
      )}
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
            the gesture people try first. The shuffle mark stays as the sign that it can
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
                nothing at all: it read as a button that had been pressed and stuck. */}
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
 * What a night drive leaves on the next morning's card.
 *
 * The one thing in the rail that is not the day it sits under. A drive leaving at 21:00
 * and arriving at 01:23 arrives tomorrow, and the rail draws it there: under tomorrow's
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
export function SpillBlock({ spill, children }: {
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
      // right of every other number and line in the card, which reads as two lists
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
        {/* The drive itself, in the band the rail uses everywhere else: this is the
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
                reading in the one place the eye does not look for one, and gave the
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
                  The stop it leaves from is not named: it is drawn on yesterday's card
                  directly above, and a second row for it would read as a stop made
                  twice. */}
              {departure ? (
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
