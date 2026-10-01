import React from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * The one pill the help center is built from: section markers, counters,
 * breadcrumbs, step numbers. Tones map onto the appearance tokens so a user's
 * accent reaches every badge, and a badge can nest another (`count`) for the
 * "3 steps" pattern without a second component.
 */
export type HelpBadgeTone = 'neutral' | 'accent' | 'soft' | 'success' | 'warning' | 'outline'

const TONES: Record<HelpBadgeTone, string> = {
  neutral: 'bg-surface-tertiary text-content-secondary',
  accent: 'bg-accent text-accent-text',
  soft: 'bg-accent-subtle text-accent-on',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  outline: 'border border-edge bg-surface-card text-content-secondary',
}

/** The nested counter inverts against its parent so it reads as a badge in a badge. */
const COUNT_TONES: Record<HelpBadgeTone, string> = {
  neutral: 'bg-surface-card text-content',
  accent: 'bg-accent-text text-accent',
  soft: 'bg-surface-card text-content',
  success: 'bg-surface-card text-success',
  warning: 'bg-surface-card text-warning',
  outline: 'bg-surface-tertiary text-content',
}

export default function HelpBadge({
  tone = 'neutral',
  icon: Icon,
  count,
  uppercase = false,
  children,
  className = '',
}: {
  tone?: HelpBadgeTone
  icon?: LucideIcon
  /** A nested badge on the right, e.g. a number. */
  count?: React.ReactNode
  uppercase?: boolean
  children?: React.ReactNode
  className?: string
}): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-7 rounded-full pl-2.5 text-caption font-semibold leading-none whitespace-nowrap ${
        count === undefined ? 'pr-2.5' : 'pr-1'
      } ${uppercase ? 'uppercase tracking-[0.08em]' : ''} ${TONES[tone]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {children}
      {count !== undefined && (
        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-caption font-bold ${COUNT_TONES[tone]}`}>
          {count}
        </span>
      )}
    </span>
  )
}
