import type { ReactNode } from 'react'

interface MBadgeProps {
  /**
   * `neutral` is MChip's resting look and the one to reach for. `strong` is MChip's active
   * look, for the single figure a surface is about, and never inside something tappable:
   * a filled pill in a button reads as a second control sitting in the first.
   */
  tone?: 'neutral' | 'strong'
  /** `xs` is 18px, for a second line under a title. `sm` is 22px, for a 34px pill. */
  size?: 'xs' | 'sm'
  /**
   * Caps with tracking by default, for words. A figure with a unit symbol passes false,
   * because m and M are different units, and so does a clock, which has no case to change.
   */
  caps?: boolean
  /**
   * Lets a long sentence break inside the pill instead of running past its container. A
   * figure keeps to one line, which is why this is off by default: the pill then stops at
   * the width it is given and grows in height with the text.
   */
  wrap?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * The non-interactive sibling of MChip: a fact, not a control.
 *
 * A span, because every place a badge sits in the road trip chrome is itself a button, and
 * a button inside a button is markup that no browser and no screen reader agree on. Caps
 * with tracking are the desktop day card's DAY_BADGE, set for a phone.
 *
 * Pills side by side lose the space between them when a screen reader builds a name out of
 * them, so a button made of badges carries its own aria-label (see stageBadges.badgeLabel).
 */
export default function MBadge({
  tone = 'neutral',
  size = 'xs',
  caps = true,
  wrap = false,
  icon,
  className = '',
  children,
}: MBadgeProps) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-[3px] rounded-full font-geist font-medium tabular-nums ${
        size === 'sm' ? 'px-[9px] text-[0.65625rem]' : 'px-[7px] text-[0.59375rem]'
      } ${
        wrap
          ? `max-w-full whitespace-normal py-[2px] leading-[1.15] ${size === 'sm' ? 'min-h-[22px]' : 'min-h-[18px]'}`
          : `whitespace-nowrap leading-none ${size === 'sm' ? 'h-[22px]' : 'h-[18px]'}`
      } ${caps ? 'uppercase tracking-[.07em]' : ''} ${
        tone === 'strong'
          ? 'bg-m-act text-m-actfg'
          : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
      } ${className}`}
    >
      {/* The icon only repeats what the label says, so it stays out of the name. */}
      {icon && <span aria-hidden="true" className="flex flex-none">{icon}</span>}
      {children}
    </span>
  )
}
