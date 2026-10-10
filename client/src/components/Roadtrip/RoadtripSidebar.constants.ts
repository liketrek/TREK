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
 * The small capitalised caption over a number, and the badges in a day's header.
 *
 * Wide letter-spacing and uppercase rather than a size change: the labels have to stay
 * legible at a third of the column's width in 23 languages, and shrinking them further
 * was what made "Driving time" unreadable before it was ever clipped.
 */
export const STAT_LABEL = 'font-geist font-semibold uppercase tracking-[0.15em] text-content-faint'

/**
 * A day-header badge: the date, the drive, the count.
 *
 * Medium weight in the quiet ink, not semibold in the strong one. Three uppercase badges
 * with wide tracking already carry as much emphasis as a line can take; adding weight and
 * contrast on top made the day's supporting facts shout louder than the day's own name.
 */
export const DAY_BADGE = 'inline-flex h-[20px] items-center rounded-lg px-2 font-geist font-medium uppercase tracking-[0.09em] text-content-muted'
