import React from 'react'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'

/**
 * A fact on a stop's second line: what it is in the quiet ink (an icon or a word), then
 * the figure. The day plan's white pill, the one its transports wear for their times, so
 * a stop and the ride beside it carry their facts the same way.
 *
 * One component because the shell had been typed out six times, the stay, the walk, the
 * fill-up, the two findings and the limits button each carrying their own copy, and the
 * copies had started to drift.
 */
const TONES = {
  neutral: { lead: 'text-content-faint', value: 'text-content-secondary' },
  warning: { lead: 'text-warning', value: 'text-warning' },
  /** A confirmed booking: the word in the success colour, the figure plain. */
  success: { lead: 'text-success', value: 'text-content-secondary' },
  /** A booking still pending: the word in the warning colour, the figure plain. */
  pending: { lead: 'text-warning', value: 'text-content-secondary' },
} as const

// White with a light shadow and a hairline, so it still stands off the white card it sits on.
const PILL = 'inline-flex h-[20px] flex-none items-center gap-1 self-start whitespace-nowrap rounded-full bg-surface-card px-2 font-geist font-normal leading-none tabular-nums shadow-sm ring-1 ring-inset ring-edge-faint'

interface FigureBadgeProps {
  /** An icon, or a word (`caption`). */
  lead: React.ReactNode
  /** The figure. Absent draws the lead alone, a badge that is only a sign. */
  value?: React.ReactNode
  tone?: 'neutral' | 'warning' | 'success' | 'pending'
  tooltip?: string
  /** The lead is a word rather than an icon, set in capitals like the day plan's phase pills. */
  caption?: boolean
  /** The figure in the quiet ink: an invitation, or a value inherited rather than set. */
  faint?: boolean
  valueSize?: 'label' | 'micro'
  /** May give up width to the pills beside it, its words cut short rather than wrapping the row. */
  shrink?: boolean
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
  lead, value, tone = 'neutral', tooltip, caption, faint, dir, onActivate, ariaLabel, shrink,
}: FigureBadgeProps): React.ReactElement {
  const colours = TONES[tone]
  const pill = shrink ? PILL.replace('flex-none', 'min-w-0 shrink overflow-hidden') : PILL
  const body = (
    <>
      <span
        className={`flex min-w-0 items-center gap-1 ${value === undefined && (tone === 'neutral' || tone === 'warning') ? colours.value : colours.lead} ${caption ? 'uppercase tracking-[.05em]' : ''}`}
        style={caption ? fs(9.5) : undefined}
      >
        {lead}
      </span>
      {value === undefined ? null : (
        <>
          {/* A straight cut between what it is and the figure, the split the dialogs' pills use. */}
          <span aria-hidden className="mx-0.5 h-2.5 w-px flex-none bg-edge" />
          <span className={`flex items-center ${faint ? 'text-content-faint' : colours.value}`}>{value}</span>
        </>
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
      className={`${pill} cursor-pointer transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      style={fs(10.5)}
    >
      {body}
    </span>
  ) : (
    <span dir={dir} className={pill} style={fs(10.5)}>{body}</span>
  )
  return tooltip ? <Tooltip label={tooltip}>{badge}</Tooltip> : badge
}
