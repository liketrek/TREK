import { ReactNode } from 'react'

interface MGlassBarProps {
  /** Pins the bar below the status bar (default). Pass false to embed it in flow. */
  floating?: boolean
  className?: string
  children: ReactNode
}

/** Top bar glass pill: blur 26 / saturate 1.7 on --m-glass with --m-gbr border. */
export default function MGlassBar({ floating = true, className = '', children }: MGlassBarProps) {
  return (
    <div
      className={`flex items-center gap-[11px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-[14px] py-2 backdrop-blur-[26px] backdrop-saturate-[1.7] shadow-[0_14px_34px_-16px_rgba(0,0,0,.22)] ${
        floating ? 'fixed left-4 right-4 top-[var(--m-safe-top,12px)] z-30' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
