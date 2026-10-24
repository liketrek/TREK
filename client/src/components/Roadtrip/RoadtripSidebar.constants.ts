import type { CSSProperties } from 'react'

// The rail's shared geometry and type styles. A plain module rather than exports beside
// the components, so every component file of the rail stays a Fast Refresh boundary.

/** The column the markers and the line share, and the gap to the content beside it. */
export const RAIL_GRID: CSSProperties = { gridTemplateColumns: '24px 1fr', columnGap: 10 }

/**
 * The line between two stops.
 *
 * A repeating gradient rather than a dashed border: a 1px dashed border renders as a
 * smear at this width, and the gradient keeps the dash length exact.
 */
export const RAIL_DASH: CSSProperties = {
  width: 1.5,
  backgroundImage: 'repeating-linear-gradient(var(--border-primary) 0 4px, transparent 4px 8px)',
}

/** A 24px disc: a stop's number, or a service stop's icon. */
export const DISC = 'grid h-6 w-6 shrink-0 place-items-center rounded-full'

/**
 * The small caption over a number: the eyebrow the planner's dialogs and cards use, so
 * the trip head reads like the cards beside it.
 */
export const STAT_LABEL = 'font-geist font-bold uppercase tracking-[.08em] text-content-faint'

/**
 * A pill in a day's head: the date, the drive, the count, a finding.
 *
 * The day plan's pill: round, sentence case, quiet ink on the card colour with a soft
 * shadow, so a day head reads the same in both tabs.
 */
export const DAY_BADGE = 'inline-flex h-[20px] items-center gap-1 rounded-full px-2 font-geist font-normal uppercase tracking-[.05em] text-content-secondary'
