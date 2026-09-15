import React from 'react'
import { Tooltip } from '../shared/Tooltip'

/**
 * One badge shape for everything Dawarich shows.
 *
 * Fixed height and a single radius, so a row of them lines up however many there
 * are; the tone is the only thing that varies, and it carries the meaning rather
 * than decorating it. `quiet` is for a fact worth stating and not worth looking
 * at twice.
 *
 * It lives in its own file because the review list, the accept dialog and the
 * Atlas dialog all use it, and three copies of a pill is how two of them end up
 * a pixel apart.
 */
export default function DawarichBadge({
  icon: Icon,
  tone = 'neutral',
  size = 'xs',
  title,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>
  tone?: 'neutral' | 'quiet' | 'accent' | 'success' | 'warning'
  /**
   * `xs` matches the places rail, where the panel sits beside rows of that size;
   * `sm` is for the dialogs, which are read at arm's length rather than scanned.
   */
  size?: 'xs' | 'sm'
  /** Hover text. Defaults to `label` when the badge is icon-only. */
  title?: string
  /**
   * The accessible name for an icon-only badge. Passing it instead of children
   * is what makes a flag a round dot of colour without turning a screen reader
   * into someone staring at an unlabelled icon.
   */
  label?: string
  children?: React.ReactNode
}): React.ReactElement {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-secondary text-content-secondary',
    quiet: 'bg-surface-secondary text-content-faint',
    accent: 'bg-accent-subtle text-accent-on',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
  }
  const metrics =
    size === 'sm'
      ? { style: { fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }, box: 'h-[20px]', icon: 'w-3 h-3' }
      : { style: { fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }, box: 'h-[18px]', icon: 'w-2.5 h-2.5' }
  const iconOnly = children === undefined
  const hint = title ?? label
  const badge = (
    <span
      aria-label={iconOnly ? label : undefined}
      role={iconOnly ? 'img' : undefined}
      style={metrics.style}
      className={`inline-flex ${metrics.box} max-w-full flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold ${
        iconOnly ? (size === 'sm' ? 'w-[20px] justify-center' : 'w-[18px] justify-center') : 'px-1.5'
      } ${tones[tone]}`}
    >
      {Icon && <Icon className={`${metrics.icon} flex-shrink-0`} />}
      {!iconOnly && <span className="truncate">{children}</span>}
    </span>
  )
  // TREK's own tooltip rather than the browser's: the native one ignores the
  // colour scheme, waits a second and a half, and cannot be read on a touch
  // device at all. A badge with nothing to add gets none.
  return hint ? <Tooltip label={hint} placement="top">{badge}</Tooltip> : badge
}
