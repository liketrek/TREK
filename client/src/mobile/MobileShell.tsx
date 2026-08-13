import { ReactNode } from 'react'
import { useMatch } from 'react-router'
import BottomNav from '../components/Layout/BottomNav'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import MBottomNav from './components/MBottomNav'
import MToastHost from './components/MToastHost'
import './mobile.css'

interface MobileShellProps {
  isPhone: boolean
  children: ReactNode
}

/**
 * Shell around every protected page. Below the md breakpoint it is the root
 * of the new mobile experience: scopes the --m-* design tokens, paints the
 * screen gradient, hosts the bottom dock, the sheet portal target and the
 * mobile toast presenter. From 768px up it renders the exact legacy wrapper
 * unchanged. Both branches share the div > div > children shape so pages keep
 * their state when the viewport crosses the breakpoint (rotation,
 * split-screen) instead of remounting.
 *
 * On the phone the shell deliberately owns no scroll container (#1809): the
 * document is the scroller, because that is the only movement iOS Safari
 * minimises its address bar for. Screens that want a full-viewport layout
 * (map screens, the trip planner) set their own height instead of borrowing
 * one from here.
 */
export default function MobileShell({ isPhone, children }: MobileShellProps) {
  // The trip planner (/trips/:id) is a full-screen takeover that ships its own
  // in-trip dock (MTripShell). The global dock must not render underneath it:
  // on iOS Safari a position:fixed nav paints THROUGH the trip overlay's higher
  // stacking context, so the wrong (global) bar shows on top of the trip screen.
  const inTripPlanner = useMatch('/trips/:id')

  if (!isPhone) {
    return (
      <div className="flex flex-col h-dvh md:block md:h-auto">
        <div className="flex-1 overflow-y-auto md:overflow-visible">{children}</div>
        <ErrorBoundary boundaryId="chrome:bottom-nav" fallback={null}><BottomNav /></ErrorBoundary>
      </div>
    )
  }

  return (
    // min-h-svh, not min-h-dvh: dvh grows while Safari's toolbar retracts, so a
    // dvh page length would chase the animation it just triggered.
    <div className="m-root flex min-h-svh flex-col text-m-ink">
      {/* Background and screen gradient live on their own viewport-sized layer.
          The shell root is as tall as the document now, and --m-scr is a radial
          gradient measured against its element box, so on it the light cone would
          be stretched over the whole scroll length.

          It stays on a NEGATIVE z-index, and the content wrapper stays unpositioned
          on purpose. Lifting the layer into the positioned range means the content
          has to be positioned too, which makes it a stacking context and clamps
          every fixed overlay a screen renders inside it: the vacay view/edit FAB
          (z-50) ended up underneath the dock (z-40) that way. For the negative
          layer to be visible, body must not paint over it, which index.css handles
          for this breakpoint. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[color:var(--m-bg)] bg-[image:var(--m-scr)]" />
      <div className="flex-1">{children}</div>
      {!inTripPlanner && <ErrorBoundary boundaryId="chrome:m-bottom-nav" fallback={null}><MBottomNav /></ErrorBoundary>}
      <ErrorBoundary boundaryId="chrome:m-toast" fallback={null}><MToastHost /></ErrorBoundary>
      <div id="m-sheet-root" />
    </div>
  )
}
