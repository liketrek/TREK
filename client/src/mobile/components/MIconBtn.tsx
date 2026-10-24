import { type AriaAttributes, ReactNode } from 'react'

interface MIconBtnProps {
  onClick?: () => void
  ariaLabel: string
  /** glass = topbar-style glass circle, neutral = flat --m-ic circle (sheet close) */
  variant?: 'glass' | 'neutral'
  /** Diameter in px (topbar 38, sheet close 34) */
  size?: number
  className?: string
  /** Dimmed and inert. For a button whose position should stay put even when it cannot act. */
  disabled?: boolean
  /** For a button that opens a panel: whether it is open now, said to a screen reader. */
  ariaExpanded?: boolean
  /** For a button that opens a panel: what kind it is (`menu` for a menu). */
  ariaHaspopup?: AriaAttributes['aria-haspopup']
  children: ReactNode
}

/** Round icon button used in the top bar (glass) and sheet headers (neutral). */
export default function MIconBtn({
  onClick,
  ariaLabel,
  variant = 'glass',
  size = 38,
  className = '',
  disabled = false,
  ariaExpanded,
  ariaHaspopup,
  children,
}: MIconBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      disabled={disabled}
      className={`relative flex flex-none items-center justify-center rounded-full text-m-ink disabled:opacity-35 ${
        variant === 'glass'
          ? 'border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)]'
          : 'bg-[color:var(--m-ic)]'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  )
}
