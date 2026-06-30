import React, { useEffect, useRef } from 'react'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

/**
 * Video player for gallery/lightbox playback (#823), built on Plyr over a native
 * <video>. Local videos stream with HTTP Range (seeking works out of the box) and
 * the source carries the correct video MIME from the server. The Plyr instance is
 * created once per mounted source and destroyed on unmount, so navigating away in
 * the lightbox stops playback.
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
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const player = new Plyr(el, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      autoplay: autoPlay,
      // Keep playback inline so the lightbox stays in control on mobile.
      clickToPlay: true,
    })
    return () => { try { player.destroy() } catch { /* already torn down */ } }
  }, [src, autoPlay])

  return (
    <div
      style={{
        width: 'min(92vw, 1100px)',
        maxHeight: '92vh',
        borderRadius: 4,
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease',
        ...style,
      }}
    >
      <video ref={videoRef} src={src} poster={poster} playsInline controls preload="metadata" />
    </div>
  )
}
