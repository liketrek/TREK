import { Suspense } from 'react';

import { lazyWithRetry } from '../../utils/lazyWithRetry';
import ErrorBoundary from '../shared/ErrorBoundary';
import { Spinner } from '../shared/Spinner';
import type { AssistantSurfaceProps } from './AssistantSurface';

/**
 * The chat, loaded when it is first shown: the window and the phone screen
 * mount this, and the chat runtime arrives in one chunk of its own (kept out
 * of the offline precache, the assistant needs the network anyway).
 */
const AssistantSurface = lazyWithRetry(() => import('./AssistantSurface'));

export default function AssistantSurfaceLazy(props: AssistantSurfaceProps) {
  const waiting = (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="h-5 w-5 border-2 border-edge border-t-[color:var(--text-primary)]" />
    </div>
  );
  return (
    // Boundary outside the Suspense, as in VideoPlayerLazy: a rejected chunk flies past Suspense.
    <ErrorBoundary
      boundaryId="assistant"
      level="panel"
      variant={props.variant === 'fullscreen' ? 'mobile' : 'desktop'}
      resetKeys={[props.tripId]}
    >
      <Suspense fallback={waiting}>
        <AssistantSurface key={props.tripId} {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
