import React, { Suspense } from 'react'
import ErrorBoundary from '../../components/shared/ErrorBoundary'

/**
 * One tab panel, with its own net.
 *
 * The boundary sits outside the Suspense, not inside: Suspense owns the pending
 * promise, a rejected one throws straight past it. And it has to be per panel:
 * a single boundary around the whole content area would already be mounted with
 * the visible tab, so switching tabs would swap the entire planner for the
 * placeholder instead of just the part that is still loading.
 *
 * No label: ErrorBoundary lets label win over the panel level and would title a
 * broken packing list "This plugin could not be shown".
 */
export function LazyPanel({ id, children, overlay }: Readonly<{ id: string; children: React.ReactNode; overlay?: boolean }>): React.ReactElement {
  return (
    <ErrorBoundary boundaryId={`planner-panel:${id}`}>
      {/* A panel holds its place with a skeleton while its chunk arrives; a dialog has no
          place to hold. Drawn in the page flow, that skeleton was a pale block flashing
          under the planner the first time each dialog was ever opened, and never again
          once the chunk was cached. Nothing is the right placeholder for something that
          is about to cover the screen anyway. */}
      <Suspense fallback={overlay ? null : <div className="h-full w-full min-h-[180px] rounded-xl bg-surface-secondary animate-pulse" />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
