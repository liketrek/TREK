import { useState, useEffect } from 'react'
import { ExternalLink, Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { TripFile } from '../../types'
import { getAuthUrl } from '../../api/authUrl'
import { openFile as openFileUrl } from '../../utils/fileDownload'
import { triggerDownload } from './FileManager.helpers'

// Image lightbox with gallery navigation
interface ImageLightboxProps {
  files: (TripFile & { url: string })[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ files, initialIndex, onClose }: ImageLightboxProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(initialIndex)
  const [imgSrc, setImgSrc] = useState('')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const file = files[index]

  useEffect(() => {
    setImgSrc('')
    if (file) getAuthUrl(file.url, 'download').then(setImgSrc)
  }, [file?.url])

  const goPrev = () => setIndex(i => Math.max(0, i - 1))
  const goNext = () => setIndex(i => Math.min(files.length - 1, i + 1))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!file) return null

  const hasPrev = index > 0
  const hasNext = index < files.length - 1
  const navBtn = (side: 'left' | 'right', onClick: () => void, show: boolean): React.ReactNode => show ? (
    <button onClick={e => { e.stopPropagation(); onClick() }}
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

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', paddingBottom: 'var(--bottom-nav-h)' }}
      onClick={onClose}
      onTouchStart={e => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStart === null) return
        const diff = e.changedTouches[0].clientX - touchStart
        if (diff > 60) goPrev()
        else if (diff < -60) goNext()
        setTouchStart(null)
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {file.original_name}
          <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.4)' }}>{index + 1} / {files.length}</span>
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => openFileUrl(file.url, file.original_name).catch(() => {})}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 4 }}
            title={t('files.openTab')}>
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => triggerDownload(file.url, file.original_name)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 4 }}
            title={t('files.download') || 'Download'}>
            <Download size={16} />
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main image + nav */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        {navBtn('left', goPrev, hasPrev)}
        {imgSrc && <img src={imgSrc} alt={file.original_name} style={{ maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, display: 'block' }} onClick={e => e.stopPropagation()} />}
        {navBtn('right', goNext, hasNext)}
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '10px 16px', flexShrink: 0, overflowX: 'auto' }} onClick={e => e.stopPropagation()}>
          {files.map((f, i) => (
            <ThumbImg key={f.id} file={f} active={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ThumbImg({ file, active, onClick }: { file: TripFile & { url: string }; active: boolean; onClick: () => void }) {
  const [src, setSrc] = useState('')
  useEffect(() => { getAuthUrl(file.url, 'download').then(setSrc) }, [file.url])
  return (
    <button onClick={onClick} style={{
      width: 48, height: 48, borderRadius: 6, overflow: 'hidden', border: active ? '2px solid #fff' : '2px solid transparent',
      opacity: active ? 1 : 0.5, cursor: 'pointer', padding: 0, background: '#111', flexShrink: 0, transition: 'opacity 0.15s',
    }}>
      {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
    </button>
  )
}
