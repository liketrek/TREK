import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import VideoPlayer from './VideoPlayerLazy'
import { usePhotoZoom } from './usePhotoZoom'
import { Tooltip } from '../shared/Tooltip'
import { useTranslation } from '../../i18n'

interface LightboxPhoto {
  id: string
  src: string
  caption?: string | null
  provider?: string
  asset_id?: string | null
  owner_id?: number | null
  mediaType?: string | null
}

interface Props {
  photos: LightboxPhoto[]
  startIndex?: number
  onClose: () => void
}

/** The round glass buttons of the top bar. */
const ROUND_BTN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', cursor: 'pointer',
}

export default function PhotoLightbox({ photos, startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const { t } = useTranslation()

  const photo = photos[idx]
  // Zoom starts over on every photo (#1484).
  const zoom = usePhotoZoom(photo?.id)
  const isImage = !!photo && photo.mediaType !== 'video'
  const hasPrev = idx > 0
  const hasNext = idx < photos.length - 1

  const prev = useCallback(() => { if (hasPrev) setIdx(i => i - 1) }, [hasPrev])
  const next = useCallback(() => { if (hasNext) setIdx(i => i + 1) }, [hasNext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  // A pinch, a double tap or a pan of an enlarged photo belongs to the zoom; only
  // the rest is a swipe that turns the page or closes the lightbox.
  const onTouchStart = (e: React.TouchEvent) => {
    if (isImage && zoom.touchStart(e)) { touchStart.current = null; return }
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (isImage && zoom.touchMove(e)) touchStart.current = null
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (isImage && zoom.touchEnd(e)) { touchStart.current = null; return }
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y

    // swipe down to close
    if (dy > 80 && Math.abs(dx) < 60) {
      onClose()
      return
    }
    // horizontal swipe
    if (Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      if (dx < 0) next()
      else prev()
    }
    touchStart.current = null
  }

  if (!photo) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'var(--bottom-nav-h)',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Photo area — centered with nav overlays */}
      <div
        className="group/lightbox"
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500 }}>
            {idx + 1} / {photos.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isImage && (
            <>
              <Tooltip label={t('journey.lightbox.zoomOut')}>
                <button type="button" onClick={zoom.zoomOut} disabled={!zoom.zoomed} aria-label={t('journey.lightbox.zoomOut')} style={{ ...ROUND_BTN, opacity: zoom.zoomed ? 1 : 0.4 }}>
                  <ZoomOut size={17} />
                </button>
              </Tooltip>
              {zoom.zoomed && (
                <Tooltip label={t('journey.lightbox.zoomReset')}>
                  <button type="button" onClick={zoom.reset} aria-label={t('journey.lightbox.zoomReset')}
                    style={{ ...ROUND_BTN, width: 'auto', borderRadius: 99, padding: '0 12px', fontSize: 'calc(12px * var(--fs-scale-caption, 1))', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(zoom.zoom.scale * 100)}%
                  </button>
                </Tooltip>
              )}
              <Tooltip label={t('journey.lightbox.zoomIn')}>
                <button type="button" onClick={zoom.zoomIn} disabled={!zoom.canZoomIn} aria-label={t('journey.lightbox.zoomIn')} style={{ ...ROUND_BTN, opacity: zoom.canZoomIn ? 1 : 0.4 }}>
                  <ZoomIn size={17} />
                </button>
              </Tooltip>
            </>
          )}
          <button type="button" onClick={onClose} aria-label={t('common.close')} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer',
          }}>
            <X size={18} />
          </button>
          </div>
        </div>

        {/* Prev button — visible on hover (desktop), always visible (mobile) */}
        {hasPrev && (
          <button type="button" onClick={prev} className="flex sm:opacity-0 sm:group-hover/lightbox:opacity-100 transition-opacity" style={{
            position: 'absolute', left: 16, zIndex: 5,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer',
          }}>
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Photo or video */}
        {photo.mediaType === 'video' ? (
          <VideoPlayer key={photo.id} src={photo.src} />
        ) : (
          <img
            key={photo.id}
            ref={zoom.imgRef}
            src={photo.src}
            alt={photo.caption || ''}
            draggable={false}
            {...zoom.mouse}
            style={{
              maxWidth: '92vw', maxHeight: '92vh',
              objectFit: 'contain', borderRadius: 4,
              animation: 'fadeIn 0.15s ease',
              userSelect: 'none',
              ...zoom.style,
            }}
          />
        )}

        {/* Next button */}
        {hasNext && (
          <button type="button" onClick={next} className="flex sm:opacity-0 sm:group-hover/lightbox:opacity-100 transition-opacity" style={{
            position: 'absolute', right: 16, zIndex: 5,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer',
          }}>
            <ChevronRight size={22} />
          </button>
        )}

        {/* Caption — bottom center overlay */}
        {photo.caption && (
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 5, maxWidth: '70%', textAlign: 'center' }}>
            <p style={{
              fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontStyle: 'italic',
              color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5,
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
              padding: '6px 14px', borderRadius: 10,
            }}>{photo.caption}</p>
          </div>
        )}
      </div>
    </div>
  )
}
