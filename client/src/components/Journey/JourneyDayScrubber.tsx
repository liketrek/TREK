import { useRef } from 'react'
import { useTranslation } from '../../i18n'
import type { JourneyDay } from './journeyCard'

/**
 * The day bar above the phone timeline.
 *
 * A horizontal carousel of cards tells you what happened but never where you are
 * in the trip: scrolling for a while gives no sense of having crossed from the
 * second day into the third, and there is no way to reach day nine except by
 * swiping past days three to eight (discussion #2299). One segment per day fixes
 * both — it says how long the journey is, how far in you are, and it takes you
 * anywhere in one tap or one drag along it.
 *
 * The segment colours are the same `DAY_COLORS` the map markers and the card
 * edges use, so the bar is a legend for the whole screen rather than a fourth
 * thing to learn.
 */

interface Props {
  days: JourneyDay[]
  activeDate: string | null
  onPick: (date: string) => void
}

export default function JourneyDayScrubber({ days, activeDate, onPick }: Props) {
  const { t, locale } = useTranslation()
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastPicked = useRef<string | null>(null)

  // One day is not a journey to scrub through, and the bar would say nothing the
  // card's own date does not already say.
  if (days.length < 2) return null

  const long = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })

  const activeIndex = activeDate ? days.findIndex(d => d.date === activeDate) : -1
  const shown = activeIndex >= 0 ? days[activeIndex] : days[0]

  /**
   * The day under a given screen x, measured across the bar.
   *
   * Measured against the bar even while the finger is on the date above it, so a
   * drag that starts on the label still lands on the right day.
   */
  const pickAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const ratio = (clientX - rect.left) / rect.width
    const index = Math.min(days.length - 1, Math.max(0, Math.floor(ratio * days.length)))
    const day = days[index]
    if (!day || day.date === lastPicked.current) return
    lastPicked.current = day.date
    onPick(day.date)
  }

  return (
    // touch-none, and the events stop here: the whole thing lies on a map that
    // pans, and a drag along the days must not drag the world with it.
    <div
      className="pointer-events-auto touch-none px-4 pb-[6px] select-none"
      onPointerDown={e => {
        dragging.current = true
        lastPicked.current = shown.date
        e.currentTarget.setPointerCapture?.(e.pointerId)
        e.stopPropagation()
        pickAt(e.clientX)
      }}
      onPointerMove={e => {
        if (!dragging.current) return
        e.stopPropagation()
        pickAt(e.clientX)
      }}
      onPointerUp={e => {
        dragging.current = false
        e.currentTarget.releasePointerCapture?.(e.pointerId)
      }}
      onPointerCancel={() => { dragging.current = false }}
    >
      {/* The date, and the handle: press it and slide sideways to run through the
          days. "Day 3" stood beside it for a while and was the same fact told
          twice, since the bar below already shows how far along that is. */}
      <div className="mb-[5px] flex items-baseline">
        <span className="cursor-grab rounded-full bg-black/55 px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap text-white backdrop-blur-[3px] active:cursor-grabbing">
          {long(shown.date)}
        </span>
      </div>
      {/* Buttons as well as the drag, because a tap is the whole gesture for most
          people and a button is the only version of this a keyboard can reach.
          The bar you see is a few pixels tall; the button around it is 20, because
          a 3px target on a phone is not a target. */}
      <div ref={barRef} className="flex items-stretch gap-[3px]">
        {days.map(day => {
          const on = day.date === shown.date
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onPick(day.date)}
              aria-label={t('journey.detail.jumpToDay', { date: long(day.date) })}
              aria-current={on ? 'true' : undefined}
              className="flex min-w-[6px] flex-1 items-end py-[7px]"
            >
              <span
                className="block w-full rounded-full transition-all duration-150"
                style={{
                  height: on ? 6 : 3,
                  background: day.color,
                  opacity: on ? 1 : 0.42,
                  boxShadow: on ? '0 0 0 1.5px rgba(255,255,255,.75)' : '0 0 0 1px rgba(0,0,0,.18)',
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
