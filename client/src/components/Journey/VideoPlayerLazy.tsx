import { Suspense } from 'react'
import type React from 'react'
import { lazyWithRetry } from '../../utils/lazyWithRetry'
import ErrorBoundary from '../shared/ErrorBoundary'

/**
 * Plyr (112 kB raw / 33 kB gzip of JS plus 32 kB / 5 kB of CSS) hung statically off
 * three lightboxes, and through them off the FileManager, JournalBody and MTripShell
 * chunks — downloaded with the route, whether or not a lightbox was ever opened and
 * whether or not it held a video.
 *
 * The lightboxes only render the player on their video branch anyway, so the split
 * costs one frame of placeholder and nothing else.
 */
const VideoPlayer = lazyWithRetry(() => import('./VideoPlayer'))

export default function VideoPlayerLazy(props: React.ComponentProps<typeof VideoPlayer>) {
  // A black rectangle in the target geometry rather than null, so the lightbox does
  // not jump once the chunk lands.
  const placeholder = (
    <div
      style={{
        width: 'min(92vw, 1100px)',
        aspectRatio: '16 / 9',
        maxHeight: '92vh',
        borderRadius: 4,
        background: '#000',
        ...props.style,
      }}
    />
  )
  return (
    // Boundary outside the Suspense, as in MapViewAuto: Suspense owns the pending
    // promise, a rejected one flies past it and would otherwise take the whole
    // lightbox down with it.
    <ErrorBoundary boundaryId="lightbox:video" level="panel" fallback={placeholder}>
      <Suspense fallback={placeholder}>
        <VideoPlayer {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
