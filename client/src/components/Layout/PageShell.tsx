import React from 'react'
import Navbar from './Navbar'

interface PageShellProps {
  children: React.ReactNode
  /** Tailwind classes for the full-height root (e.g. "bg-zinc-50 dark:bg-zinc-950"). */
  className?: string
  /** Inline `background` for the root, for pages that theme via CSS vars (e.g. "var(--bg-secondary)"). */
  background?: string
  /** Props forwarded to the shared Navbar (trip title, back button, …). */
  navbar?: React.ComponentProps<typeof Navbar>
  /** paddingTop offset that clears the fixed Navbar. Defaults to the global --nav-h. */
  navOffset?: string
  /** Classes/style for the nav-offset content wrapper. */
  contentClassName?: string
  contentStyle?: React.CSSProperties
}

/**
 * The standard authenticated page chrome: a full-height themed root, the shared
 * fixed Navbar, and a content wrapper offset by the navbar height. Both the web
 * app and the PWA shell render through this so the offset/background handling
 * lives in one place instead of being copy-pasted into every page.
 */
export default function PageShell({
  children,
  className,
  background,
  navbar,
  navOffset = 'var(--nav-h)',
  contentClassName,
  contentStyle,
}: PageShellProps): React.ReactElement {
  return (
    <div className={`min-h-screen${className ? ' ' + className : ''}`} style={background ? { background } : undefined}>
      <Navbar {...navbar} />
      <div className={contentClassName} style={{ paddingTop: navOffset, ...contentStyle }}>
        {children}
      </div>
    </div>
  )
}
