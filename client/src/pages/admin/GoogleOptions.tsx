import React from 'react'
import { ChevronRight } from 'lucide-react'
import { fs } from '../../components/shared/DialogShell'
import { StatusPill } from '../../components/Settings/settingsKit'

interface GoogleOptionsProps {
  /** "Google options" — the heading of the fold. */
  title: string
  /** Right-hand summary while folded, e.g. "4 of 5 on". */
  summary: string
  children: React.ReactNode
}

/**
 * The fold that holds what a Google key is allowed to be spent on.
 *
 * Only these switches fold away. The key fields above stay visible: a field you
 * have to go looking for is worse than a long page, and the keys are the reason
 * an admin opens this card at all. The switches are the opposite — set once,
 * then never touched, and there are five of them.
 *
 * A native <details> rather than a state hook: keyboard operable and announced
 * to screen readers without writing any of that, and it survives a re-render
 * without state. Drawn as a box of rows (settingsKit's SettingRows), the
 * summary being its first row.
 */
export default function GoogleOptions({ title, summary, children }: GoogleOptionsProps): React.ReactElement {
  return (
    <details className="group overflow-hidden rounded-[12px] border border-edge-faint bg-surface-secondary">
      <summary
        className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5 hover:bg-surface-hover
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--text-primary)]
                   [&::-webkit-details-marker]:hidden"
      >
        <ChevronRight
          size={15}
          strokeWidth={2}
          className="flex-none text-content-faint transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(13, 'body')}>{title}</span>
        <StatusPill>{summary}</StatusPill>
      </summary>
      <div className="divide-y divide-edge-faint border-t border-edge-faint bg-surface-card">{children}</div>
    </details>
  )
}
