import { ReactNode } from 'react'

interface MGlassBarProps {
  /** Pins the bar below the status bar (default). Pass false to embed it in flow. */
  floating?: boolean
  /**
   * The width the screen's content column stops at on a wide window, as the
   * same class the content uses (`wide:max-w-[1280px]`). The floating bar then
   * stands in that column with the content's own padding, so their edges line
   * up at every width.
   */
  column?: string
  className?: string
  children: ReactNode
}

/** Top bar glass pill: blur 26 / saturate 1.7 on --m-glass with --m-gbr border. */
export default function MGlassBar({ floating = true, column = '', className = '', children }: MGlassBarProps) {
  const bar = (
    <div
      className={`pointer-events-auto flex items-center gap-[11px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-[14px] py-2 backdrop-blur-[26px] backdrop-saturate-[1.7] shadow-[0_14px_34px_-16px_rgba(0,0,0,.22)] ${className}`}
    >
      {children}
    </div>
  )
  if (!floating) return bar
  // The page column (m-span-x), padded and capped like the content under it.
  return (
    <div className="m-span-x pointer-events-none fixed top-[var(--m-safe-top,12px)] z-30">
      <div className={`px-4 wide:mx-auto wide:px-6 ${column}`}>{bar}</div>
    </div>
  )
}
