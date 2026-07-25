import { ReactNode } from 'react'
import { useMatch } from 'react-router-dom'
import BottomNav from '../components/Layout/BottomNav'
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
 * split-screen) instead of remounting. The content area keeps the exact
 * scroll semantics of the legacy ProtectedRoute wrapper, so not-yet-migrated
 * pages render unchanged inside.
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
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="m-root flex h-dvh min-h-dvh flex-col bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] text-m-ink">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {!inTripPlanner && <MBottomNav />}
      <MToastHost />
      <div id="m-sheet-root" />
    </div>
  )
}
