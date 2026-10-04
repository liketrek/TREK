import React from 'react'
import { Tooltip } from '../shared/Tooltip'
import { FS } from './typeScale'

/**
 * A figure in the two-part shell the rail uses everywhere: what it is on the left, the
 * number on the right, one hairline between them.
 *
 * One component because the shell had been typed out six times, the stay, the walk, the
 * fill-up, the two findings and the limits button each carrying their own copy, and the
 * copies had started to drift. The warning tone keeps the border in the warning colour
 * itself, not its soft tint: at this size a tinted edge disappears into the card.
 */
const TONES = {
  neutral: {
    shell: 'border-edge',
    lead: 'bg-surface-tertiary text-content-faint',
    value: 'border-edge text-content-secondary',
  },
  warning: {
    shell: 'border-warning',
    lead: 'bg-warning-soft text-warning',
    value: 'border-warning text-warning',
  },
} as const

interface FigureBadgeProps {
  /** An icon, or a word set as a caption (`caption`). */
  lead: React.ReactNode
  /** The figure. Absent draws the lead alone, a badge that is only a sign. */
  value?: React.ReactNode
  tone?: 'neutral' | 'warning'
  tooltip?: string
  /** The lead is a word, set small, wide and in capitals like the stay's. */
  caption?: boolean
  /** The figure in the quiet ink: an invitation, or a value inherited rather than set. */
  faint?: boolean
  valueSize?: 'label' | 'micro'
  dir?: 'ltr'
  /**
   * Makes the badge the control that changes its figure. A span with the button role, not
   * a <button>: the stop row around it is already one, and a button inside a button is
   * invalid HTML that browsers resolve by dropping the inner element. The press stops at
   * the badge, so the row does not select its stop and move the map from under the panel.
   */
  onActivate?: (anchor: HTMLElement) => void
  /** What a screen reader hears for the control, when the badge is one. */
  ariaLabel?: string
}

export default function FigureBadge({
  lead, value, tone = 'neutral', tooltip, caption, faint, valueSize = 'label', dir, onActivate, ariaLabel,
}: FigureBadgeProps): React.ReactElement {
  const colours = TONES[tone]
  const shell = `inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border ${colours.shell}`
  const body = (
    <>
      <span
        className={`flex items-center gap-0.5 px-1 ${colours.lead} ${caption ? 'font-geist font-semibold uppercase tracking-[0.12em]' : ''}`}
        style={{ fontSize: FS.micro }}
      >
        {lead}
      </span>
      {value === undefined ? null : (
        <span
          className={`flex items-center border-s bg-surface-card px-1.5 font-semibold tabular-nums ${faint ? 'border-edge text-content-faint' : colours.value}`}
          style={{ fontSize: FS[valueSize] }}
        >
          {value}
        </span>
      )}
    </>
  )
  const badge = onActivate ? (
    <span
      role="button"
      tabIndex={0}
      dir={dir}
      aria-label={ariaLabel}
      onClick={e => { e.stopPropagation(); onActivate(e.currentTarget) }}
      onKeyDown={e => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        e.stopPropagation()
        onActivate(e.currentTarget)
      }}
      className={`${shell} cursor-pointer transition-colors hover:border-content-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
    >
      {body}
    </span>
  ) : (
    <span dir={dir} className={shell}>{body}</span>
  )
  return tooltip ? <Tooltip label={tooltip}>{badge}</Tooltip> : badge
}
