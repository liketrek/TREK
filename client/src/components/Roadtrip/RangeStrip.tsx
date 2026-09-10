import React from 'react'
import { useTranslation } from '../../i18n/TranslationContext'
import { convertDistance, formatDistance, getDistanceUnitLabel } from '../../utils/units'
import type { DistanceUnit } from '../../types'
import { FS } from './typeScale'

/**
 * How far the car goes on one fill, drawn as the tank it leaves the factory with.
 *
 * The figure above it is the answer; this is the argument that the figure is right. It
 * carries the two things a bare number cannot say on its own:
 *
 *  - The filled part is what a stop actually puts back in. Nobody charges to 100 % on the
 *    road, and a traveller who set 80 % is looking at four fifths of a bar, which is the
 *    honest picture of what the next leg has.
 *  - The hatched tail is what age has taken off an electric car's battery. It is already
 *    out of the number above, so without the tail that figure looks like an unexplained
 *    disagreement with the car's own data sheet.
 *
 * Widths animate because this sits directly under the fields that feed it: typing a
 * consumption and watching the bar move is what makes the two ways of stating a range
 * visibly the same thing.
 *
 * No box, no border, no tinted panel. It used to sit in a card of its own, which made it
 * a second surface inside a dialog whose whole point is one plain column — and the box
 * was doing nothing the bar was not already doing better.
 */

/**
 * One reading of the figure above it.
 *
 * `bg-surface-secondary` rather than the card's own colour: these sit ON the card, so the
 * chip has to be a step away from it in whichever scheme is on, and a white literal would
 * be a step the wrong way in the dark one.
 */
const NOTE_CHIP = 'inline-flex items-center rounded-lg bg-surface-secondary px-2 py-1 text-caption leading-snug text-content-secondary'

/** How many kilometres one block of the bar stands for. */
const BLOCK_KM = 50

/**
 * The bar, cut into blocks of a fixed distance rather than into quarters.
 *
 * Quarters divide a bar; blocks measure a road. With one block per fifty kilometres the
 * bar for a 240 km car is visibly shorter than the bar for a 600 km one, which is the
 * comparison somebody typing a consumption is actually making — and it turns the bar into
 * something countable rather than something to eyeball.
 *
 * Cut as a MASK rather than painted over: the old quarter marks were drawn in the panel's
 * own colour to look like gaps, which tied them to that panel and left them visible as
 * stripes anywhere else. A mask makes real holes, so whatever is behind the bar shows
 * through and nothing has to know the background.
 *
 * Exported for its own test rather than checked through the bar: jsdom supports no mask
 * property at all, so React writes neither of the two and the element reaches a test
 * carrying no style whatsoever. Through the DOM the rule is unobservable.
 */
export function blockMask(rangeKm: number | null): string | undefined {
  if (!rangeKm) return undefined
  const blocks = Math.round(rangeKm / BLOCK_KM)
  // Below three the cuts read as damage rather than as measure, and above about thirty
  // the gaps eat the bar. Outside that the bar is simply solid, which is honest: at that
  // range the blocks were never going to be counted.
  if (blocks < 3 || blocks > 30) return undefined
  const step = 100 / blocks
  // Straight, not slanted. The slant was tried and read as a decorative texture rather
  // than as a measure: on a bar this thin the lean is legible only as fuzz on the seams.
  //
  // The colour is opacity here, not paint: black is "keep", transparent is "cut".
  return `repeating-linear-gradient(90deg, #000 0 calc(${step}% - 2px), transparent calc(${step}% - 2px) ${step}%)` // theme-lint-disable — mask stencil, not a colour
}

export default function RangeStrip({ rangeKm, fillPercent, wearPercent, unit, electric }: {
  rangeKm: number | null
  fillPercent: number | null
  wearPercent: number | null
  unit: DistanceUnit
  electric: boolean
}): React.ReactElement {
  const { t } = useTranslation()
  // Capped where the arithmetic caps it, so the picture cannot claim a battery is gone.
  const wear = rangeKm ? Math.min(90, Math.max(0, wearPercent ?? 0)) : 0
  const fill = fillPercent && fillPercent > 0 && fillPercent < 100 ? fillPercent : 100
  const usable = 100 - wear
  const filled = rangeKm ? (usable * fill) / 100 : 0
  const rest = 100 - wear - filled
  // Split rather than formatted whole, so the unit can sit smaller beside the figure. The
  // rounding is formatDistance's own, because the badge on the trigger uses that and the
  // two must not disagree by a tenth.
  const shown = rangeKm ? Math.round(convertDistance(rangeKm, unit) * 10) / 10 : null
  const stripes = 'repeating-linear-gradient(135deg, var(--border-primary) 0 3px, transparent 3px 6px)'
  const mask = blockMask(rangeKm)

  const note = shown === null
    ? t('roadtrip.limit.rangeEmptyHint')
    : fill < 100
      ? t('roadtrip.limit.afterFill', { percent: fill, distance: formatDistance((rangeKm! * fill) / 100, unit) })
      : t('roadtrip.limit.fullNote')

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-edge-faint bg-surface-card px-3 py-2.5">
      {/* The figure and what it is a figure OF, on one baseline. Wrapping rather than
          truncating: "per charge" is three words in English and six in Hungarian. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="flex items-baseline gap-1">
          <span className="font-semibold tabular-nums leading-none text-content" style={{ fontSize: FS.total }}>
            {shown ?? '—'}
          </span>
          {shown !== null ? (
            <span className="font-semibold leading-none text-content-muted" style={{ fontSize: FS.totalUnit }}>
              {getDistanceUnitLabel(unit)}
            </span>
          ) : null}
        </span>
        <span className="text-caption text-content-faint">
          {shown === null
            ? t('roadtrip.limit.rangeEmpty')
            : t(electric ? 'roadtrip.limit.perCharge' : 'roadtrip.limit.perFill')}
        </span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface"
        role="img"
        aria-label={shown === null ? note : `${shown} ${getDistanceUnitLabel(unit)} — ${note}`}
      >
        <div className="flex h-full w-full" style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined} aria-hidden>
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${filled}%`, background: 'linear-gradient(90deg, var(--accent-hover), var(--accent))' }}
          />
          <div className="h-full transition-[width] duration-500 ease-out" style={{ width: `${rest}%` }} />
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${wear}%`, backgroundImage: stripes }}
          />
        </div>
      </div>

      {/* Three readings of this one figure — what a stop actually puts in, what one block
          on the bar stands for, what age has taken off — each on its own chip inside the
          card the number and the bar already share. As prose on one line they ran into
          each other; given the card to themselves they looked like four separate answers.
          Chips inside the card are both: three facts, one answer. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={NOTE_CHIP}>{note}</span>
        {mask ? (
          <span className={NOTE_CHIP}>{t('roadtrip.limit.blockNote', { distance: formatDistance(BLOCK_KM, unit) })}</span>
        ) : null}
        {/* The swatch is what ties the chip to the tail of the bar. Without it the
            hatching is an unexplained stripe and the sentence an unexplained loss. */}
        {wear > 0 ? (
          <span className={`${NOTE_CHIP} gap-1.5`}>
            <span className="h-2 w-3.5 shrink-0 rounded-sm" style={{ backgroundImage: stripes }} aria-hidden />
            {t('roadtrip.limit.wearNote', { percent: wear })}
          </span>
        ) : null}
      </div>
    </div>
  )
}
