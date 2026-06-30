import React from 'react'

/**
 * Lightweight video player for gallery/lightbox playback (#823). Uses the native
 * <video> element with controls — local videos stream with HTTP Range (seeking
 * works out of the box) and the source carries the correct video MIME from the
 * server. Kept as a thin wrapper so the player can later be re-skinned (e.g. Plyr)
 * without touching every call site.
 */
export default function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  style,
}: {
  src: string
  poster?: string
  autoPlay?: boolean
  style?: React.CSSProperties
}): React.ReactElement {
  return (
    <video
      key={src}
      src={src}
      poster={poster}
      controls
      playsInline
      autoPlay={autoPlay}
      preload="metadata"
      style={{
        maxWidth: '92vw',
        maxHeight: '92vh',
        borderRadius: 4,
        background: '#000',
        animation: 'fadeIn 0.15s ease',
        ...style,
      }}
    />
  )
}
