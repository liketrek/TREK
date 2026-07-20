import type { CSSProperties } from 'react'
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
 */
export default function EmptyState({
  scene = 'idle',
  mood,
  title,
  size = 104,
  surface = 'var(--bg-card)',
  className = '',
}: {
  scene?: TrekScene
  mood?: TrekMood
  title: string
  size?: number
  surface?: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}
      style={{ '--m-ink': 'var(--text-primary)', '--m-bg': surface } as CSSProperties}
    >
      <MDancingTrek scene={scene} mood={mood} size={size} />
      <p className="text-[15px] font-semibold text-content-secondary">{title}</p>
    </div>
  )
}
