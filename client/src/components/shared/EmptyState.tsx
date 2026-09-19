import type { CSSProperties, ReactNode } from 'react'
import MDancingTrek, { type TrekScene, type TrekMood } from '../../mobile/components/MDancingTrek'

/**
 * The one desktop empty state: the TREK mascot acting out the page's scene with
 * a single title beneath it — no subtitle, one uniform look everywhere.
 *
 * The mascot is monochrome and drives its colours off two mobile tokens
 * (`--m-ink` body / `--m-bg` cutouts) that only exist inside the mobile shell,
 * so we map them onto the desktop palette here. Its `.trek-*` choreography is
 * global CSS, so it animates outside the shell as-is. `surface` should match the
 * background the state sits on so the cut-out eyes read as holes (default: card).
 *
 * `layout="row"` puts the mascot beside the title with tight padding, for short
 * content-sized panels (the Atlas glass pill) where the stacked look towers over
 * the sibling states.
 */
export default function EmptyState({
  scene = 'idle',
  mood,
  title,
  size = 104,
  surface = 'var(--bg-card)',
  layout = 'stack',
  compact = false,
  fill = false,
  className = '',
  action,
}: {
  scene?: TrekScene
  mood?: TrekMood
  title: string
  size?: number
  surface?: string
  layout?: 'stack' | 'row'
  /**
   * Quieter type for a state inside a narrow column rather than on a page.
   *
   * The sidebar's empty state sits under its own controls, so a line at the page size
   * competes with them for the eye; at the caption tier it reads as what it is, a note
   * about why the list below is blank.
   */
  compact?: boolean
  /**
   * Fill the parent and sit in the middle of it.
   *
   * The stack already centres what it contains, but with no height of its own
   * `justify-center` has nothing to centre inside, so the state lands under
   * whatever sits above it. A state that stands for a whole empty column wants
   * the middle of that column; one that sits inline in a page does not, which is
   * why this is a choice rather than the default. The parent has to be the one
   * with the height, which every scroll container here already is.
   *
   * Optically centred rather than geometrically: the extra room goes underneath,
   * which lands the mascot slightly above the middle. In a column you can scroll,
   * dead centre reads as "fell to the bottom" the moment the list is short.
   */
  fill?: boolean
  className?: string
  /** Optional call to action under the title, for states that have an obvious next step. */
  action?: ReactNode
}) {
  const layoutClasses = layout === 'row'
    ? 'flex flex-row items-center justify-center gap-3 px-6 py-3'
    : `flex flex-col items-center justify-center gap-3 px-6 text-center ${fill ? 'min-h-full pt-4 pb-14' : 'py-12'}`
  return (
    <div
      className={`${layoutClasses} ${className}`}
      style={{ '--m-ink': 'var(--text-primary)', '--m-bg': surface } as CSSProperties}
    >
      <MDancingTrek scene={scene} mood={mood} size={size} />
      <p className={compact ? 'text-caption text-content-muted' : 'text-[15px] font-semibold text-content-secondary'}>{title}</p>
      {action}
    </div>
  )
}
