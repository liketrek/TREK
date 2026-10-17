import type { ReactNode } from 'react'
import { fs } from '../shared/DialogShell'

/**
 * The pieces the two columns beside the place form share: the Place details
 * column on the left and the saved places on the right. Both are grey panels
 * with white cards on them, the look of the booking editors' route panels, so
 * the three columns of the add place dialog read as one piece.
 */

/**
 * The frame of a column. Its width is the caller's: the same sm:w-80 (320 px) on
 * both sides of the form, so neither column reads as the more important one.
 */
export const SIDE_COLUMN = 'flex w-full shrink-0 flex-col self-stretch overflow-hidden rounded-[14px] border border-edge-faint bg-surface-secondary'

/** The eyebrow a column opens with, its icon on a small white disc. */
export function ColumnHead({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-none items-center gap-2 px-3.5 pb-2.5 pt-3">
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm">{icon}</span>
      <h3 className="m-0 min-w-0 truncate font-geist font-bold uppercase tracking-[.08em] text-content-muted" style={fs(10)}>{children}</h3>
    </div>
  )
}

/** A white card on the grey column, the frame every block of it sits in. */
export const COLUMN_CARD = 'rounded-[12px] border border-edge-faint bg-surface-card'

/**
 * A quiet line in place of content: nothing picked yet, still loading, nothing
 * found. Small on purpose, so an empty column waits instead of shouting, and it
 * leaves the column its width so the dialog does not move when content arrives.
 */
export function HintCard({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-dashed border-edge px-3 py-2.5 text-content-muted" style={fs(12, 'body')}>
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-faint shadow-sm">{icon}</span>
      <span className="min-w-0 leading-snug">{children}</span>
    </div>
  )
}

/** A white action across the width of a column or a field, like the dialog's secondary buttons. */
export const WHITE_BUTTON = 'flex w-full items-center justify-center gap-2 rounded-[10px] bg-surface-card px-3 py-2 font-semibold text-content shadow-sm ring-1 ring-edge-faint transition-colors hover:bg-surface-hover disabled:cursor-default disabled:opacity-50 disabled:hover:bg-surface-card'
