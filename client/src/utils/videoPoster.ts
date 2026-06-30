/**
 * Capture a poster frame and duration from a video file entirely in the browser
 * (#823). This avoids any server-side transcoding: the picked video is decoded by
 * the browser, a frame is drawn to a canvas and exported as a JPEG that is
 * uploaded alongside the video and stored as its thumbnail.
 *
 * Resolves with a null poster (and best-effort duration) if anything fails — the
 * caller still uploads the video; the gallery just shows a placeholder tile.
 */
export async function captureVideoPoster(file: File): Promise<{ poster: Blob | null; durationMs: number | null }> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') { resolve({ poster: null, durationMs: null }); return }
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url

    let settled = false
    const finish = (poster: Blob | null, durationMs: number | null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve({ poster, durationMs })
    }
    // Don't hang forever on a codec the browser can't decode.
    const timer = setTimeout(() => finish(null, null), 10_000)

    video.onerror = () => { clearTimeout(timer); finish(null, null) }
    video.onloadedmetadata = () => {
      const durationMs = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null
      // Seek slightly in to dodge an all-black first frame.
      const target = Math.min(0.1, (video.duration || 1) / 2)
      video.onseeked = () => {
        clearTimeout(timer)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 360
          const ctx = canvas.getContext('2d')
          if (!ctx) return finish(null, durationMs)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => finish(blob, durationMs), 'image/jpeg', 0.8)
        } catch {
          finish(null, durationMs)
        }
      }
      try { video.currentTime = target } catch { clearTimeout(timer); finish(null, durationMs) }
    }
  })
}

/** True for a File the user picked that should go through the video upload path. */
export function isVideoFile(file: File): boolean {
  return typeof file.type === 'string' && file.type.startsWith('video/')
}
