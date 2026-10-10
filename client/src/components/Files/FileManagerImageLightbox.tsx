import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, Download, X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { TripFile } from '../../types'
import { getAuthUrl } from '../../api/authUrl'
import { openFile as openFileUrl } from '../../utils/fileDownload'
import { triggerDownload, isVideo } from './FileManager.helpers'
import { useMediaLightbox } from './useMediaLightbox'
import VideoPlayer from '../Journey/VideoPlayerLazy'
import { Tooltip } from '../shared/Tooltip'

/** The round buttons on the dark backdrop, the same as the note preview's. */
const LIGHTBOX_BTN = 'grid h-9 w-9 place-items-center rounded-full bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.22)]' // theme-lint-disable: the lightbox is dark in every scheme

// Image lightbox with gallery navigation
interface ImageLightboxProps {
  files: (TripFile & { url: string })[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ files, initialIndex, onClose }: ImageLightboxProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(initialIndex)
  const { file, imgSrc, fileIsVideo, hasPrev, hasNext, goPrev, goNext, onTouchStart, onTouchEnd } = useMediaLightbox({
    files,
    index,
    onIndexChange: setIndex,
    onClose,
  })

  if (!file) return null

  const navBtn = (side: 'left' | 'right', onClick: () => void, show: boolean): React.ReactNode => show ? (
    <button type="button" onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        position: 'absolute', top: '50%', [side]: 12, transform: 'translateY(-50%)', zIndex: 10,
        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 40, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        color: 'rgba(255,255,255,0.8)', transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.75)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}>
      {side === 'left' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  ) : null

  // A portal, as the two document previews are. Rendered in place, the overlay
  // sits inside the trip page's stacking context, below the navbar's z-[200],
  // which then covered the header and its buttons.
  return createPortal(
    <div
      // Backdrop only — Escape and the header's close button do the same job for
      // the keyboard. Closing on the backdrop's own clicks (rather than letting
      // every child stop the bubble) keeps the chrome free of click handlers.
      role="presentation"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', paddingBottom: 'var(--bottom-nav-h)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {file.original_name}
          <span style={{ marginInlineStart: 8, color: 'rgba(255,255,255,0.4)' }}>{index + 1} / {files.length}</span>
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Tooltip label={t('files.openTab')}>
            <button type="button"
              onClick={() => openFileUrl(file.url, file.original_name).catch(() => {})}
              aria-label={t('files.openTab')} className={LIGHTBOX_BTN}>
              <ExternalLink size={16} />
            </button>
          </Tooltip>
          <Tooltip label={t('files.download') || 'Download'}>
            <button type="button"
              onClick={() => triggerDownload(file.url, file.original_name)}
              aria-label={t('files.download') || 'Download'} className={LIGHTBOX_BTN}>
              <Download size={16} />
            </button>
          </Tooltip>
          <Tooltip label={t('common.close')}>
            <button type="button" onClick={onClose} aria-label={t('common.close')} className={LIGHTBOX_BTN}>
              <X size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main image + nav */}
      <div role="presentation" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        {navBtn('left', goPrev, hasPrev)}
        {fileIsVideo ? (
          <div>
            <VideoPlayer src={file.url} style={{ maxWidth: '85vw', maxHeight: '80vh', borderRadius: 8 }} />
          </div>
        ) : (
          imgSrc && <img src={imgSrc} alt={file.original_name} style={{ maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
        )}
        {navBtn('right', goNext, hasNext)}
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '10px 16px', flexShrink: 0, overflowX: 'auto' }}>
          {files.map((f, i) => (
            <ThumbImg key={f.id} file={f} active={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}

function ThumbImg({ file, active, onClick }: { file: TripFile & { url: string }; active: boolean; onClick: () => void }) {
  const fileIsVideo = isVideo(file.mime_type)
  const [src, setSrc] = useState('')
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  // Each thumbnail costs its own one-shot download token, so the strip only
  // mints them for the thumbs that actually scroll into view.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') { setVisible(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Videos have no stored thumbnail and can't render as an <img>; show a play
  // placeholder and don't mint a download token for them (#823).
  useEffect(() => {
    if (!visible || fileIsVideo) return
    let current = true
    void getAuthUrl(file.url, 'download').then(u => { if (current) setSrc(u) })
    return () => { current = false }
  }, [file.url, fileIsVideo, visible])

  return (
    <button type="button" ref={ref} onClick={onClick} style={{
      width: 48, height: 48, borderRadius: 6, overflow: 'hidden', border: active ? '2px solid #fff' : '2px solid transparent',
      opacity: active ? 1 : 0.5, cursor: 'pointer', padding: 0, background: '#111', flexShrink: 0, transition: 'opacity 0.15s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)',
    }}>
      {fileIsVideo
        ? <Play size={16} fill="currentColor" />
        : (src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />)}
    </button>
  )
}
