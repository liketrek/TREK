import { ReactNode } from 'react'

interface MIconBtnProps {
  onClick?: () => void
  ariaLabel: string
  /** glass = topbar-style glass circle, neutral = flat --m-ic circle (sheet close) */
  variant?: 'glass' | 'neutral'
  /** Diameter in px (topbar 38, sheet close 34) */
  size?: number
  className?: string
  children: ReactNode
}

/** Round icon button used in the top bar (glass) and sheet headers (neutral). */
export default function MIconBtn({
  onClick,
  ariaLabel,
  variant = 'glass',
  size = 38,
  className = '',
  children,
}: MIconBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative flex flex-none items-center justify-center rounded-full text-m-ink ${
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
