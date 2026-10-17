import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Loader2, Upload, X } from 'lucide-react'
import PlaceAvatar from './PlaceAvatar'
import { Tooltip } from './Tooltip'
import { useToast } from './Toast'
import { useTranslation, translateApiError } from '../../i18n'
import { fetchImageAsBlob } from '../../api/authUrl'
import { usePlaceImagePick } from '../Planner/usePlaceActions'
import type { Place, TripFile } from '../../types'

interface Category {
  color?: string
  icon?: string
}

interface PlaceAvatarUploadProps {
  place: Pick<Place, 'id' | 'name' | 'image_url' | 'google_place_id' | 'osm_id' | 'lat' | 'lng'>
  category?: Category | null
  size?: number
  onUpload: (file: File) => Promise<void>
  /** Clears the custom image; the auto-fetched default thumbnail then returns (#1136). */
  onRemove: () => Promise<void> | void
  /** Pictures already attached to the place, offered as its image beside an upload (#1242). */
  attachedImages?: TripFile[]
  onPickAttached?: (fileId: number) => Promise<void>
}

const PICKABLE = /^image\/(jpeg|png|gif|webp)$/

/** The images among a place's files that can stand as its picture. */
export function pickableImages(files: TripFile[]): TripFile[] {
  return files.filter(f => PICKABLE.test(f.mime_type || ''))
}

/**
 * A PlaceAvatar the user can click to set a custom thumbnail (#1136): hover reveals
 * a camera overlay with a tooltip, clicking opens the file picker, and when a custom
 * upload is present a small corner button removes it (falling back to the default).
 */
export default function PlaceAvatarUpload({ place, category, size = 52, onUpload, onRemove, attachedImages = [], onPickAttached }: PlaceAvatarUploadProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const { busy, setBusy, pickImage: handleFile } = usePlaceImagePick(onUpload, toast)
  const [chooserOpen, setChooserOpen] = useState(false)
  const hasCustom = Boolean(place.image_url)
  const offersAttached = !!onPickAttached && attachedImages.length > 0
  // With pictures on the place the click asks where from; without, it goes straight to the device.
  const openPicker = () => { if (busy) return; if (offersAttached) setChooserOpen(o => !o); else fileRef.current?.click() }

  const pickAttached = async (fileId: number) => {
    setChooserOpen(false)
    setBusy(true)
    try {
      await onPickAttached!(fileId)
    } catch (err: unknown) {
      toast.error(translateApiError(t, err, 'places.imageUploadError'))
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setBusy(true)
    try {
      await onRemove()
    } catch (err: unknown) {
      toast.error(translateApiError(t, err, 'places.imageUploadError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <Tooltip label={hasCustom ? t('places.changeImage') : t('places.uploadImage')} placement="top">
        <div
          className="group"
          style={{ position: 'relative', width: size, height: size, borderRadius: '50%', cursor: busy ? 'default' : 'pointer' }}
          ref={anchorRef}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          aria-haspopup={offersAttached ? 'dialog' : undefined}
          aria-expanded={offersAttached ? chooserOpen : undefined}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() } }}
          aria-label={hasCustom ? t('places.changeImage') : t('places.uploadImage')}
        >
          <PlaceAvatar place={place} category={category} size={size} />

          {/* Hover overlay — a camera cue that this thumbnail is editable. */}
          <div
            className="opacity-0 group-hover:opacity-100"
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.15s', pointerEvents: 'none',
            }}
          >
            {busy ? <Loader2 size={Math.round(size * 0.34)} className="animate-spin" color="#fff" /> : <Camera size={Math.round(size * 0.34)} color="#fff" />}
          </div>
        </div>
      </Tooltip>

      {/* Remove button — only when a custom upload is set. */}
      {hasCustom && !busy && (
        <Tooltip label={t('places.removeImage')} placement="top">
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t('places.removeImage')}
            style={{
              position: 'absolute', top: -3, insetInlineEnd: -3, width: 18, height: 18, borderRadius: '50%',
              background: '#ef4444', color: '#fff', border: '2px solid var(--bg-elevated, #fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 1,
            }}
          >
            <X size={10} strokeWidth={3} />
          </button>
        </Tooltip>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif" style={{ display: 'none' }} onChange={handleFile} />
      {chooserOpen && (
        <ImageChooser
          anchor={anchorRef.current}
          images={attachedImages}
          onUpload={() => { setChooserOpen(false); fileRef.current?.click() }}
          onPick={id => { void pickAttached(id) }}
          onClose={() => setChooserOpen(false)}
        />
      )}
    </div>
  )
}

/** Upload from the device, or one of the pictures already on the place (#1242). */
function ImageChooser({ anchor, images, onUpload, onPick, onClose }: {
  anchor: HTMLElement | null
  images: TripFile[]
  onUpload: () => void
  onPick: (fileId: number) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!anchor) return
    const r = anchor.getBoundingClientRect()
    const width = 264
    setPos({ top: r.bottom + 8, left: Math.min(Math.max(12, r.left), window.innerWidth - width - 12) })
  }, [anchor])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!ref.current?.contains(target) && !anchor?.contains(target)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [anchor, onClose])

  if (!pos) return null
  return createPortal(
    <div ref={ref} role="dialog" aria-label={t('places.chooseImage')}
      className="trek-popover-enter fixed z-[var(--z-toast)] flex w-[264px] flex-col gap-2 rounded-[14px] border border-edge-secondary bg-surface-card p-2 shadow-popover"
      style={{ top: pos.top, left: pos.left }}>
      <button type="button" onClick={onUpload}
        className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-start text-body font-semibold text-content hover:bg-surface-hover">
        <Upload size={14} strokeWidth={2.2} className="text-content-muted" />
        {t('places.uploadFromDevice')}
      </button>
      <div className="px-2.5 text-caption font-semibold uppercase tracking-[0.04em] text-content-faint">{t('places.fromAttachedFiles')}</div>
      <div className="grid grid-cols-4 gap-1.5 px-1 pb-1">
        {images.map(f => <AttachedThumb key={f.id} file={f} onPick={() => onPick(f.id)} />)}
      </div>
    </div>,
    document.body,
  )
}

function AttachedThumb({ file, onPick }: { file: TripFile; onPick: () => void }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let current = true
    fetchImageAsBlob(file.url).then(u => { if (current) setSrc(u) }).catch(() => {})
    return () => { current = false }
  }, [file.url])
  return (
    <Tooltip label={file.original_name} placement="top">
      <button type="button" onClick={onPick} aria-label={file.original_name}
        className="aspect-square overflow-hidden rounded-[9px] bg-surface-secondary ring-1 ring-edge-faint transition-shadow hover:ring-2 hover:ring-accent">
        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      </button>
    </Tooltip>
  )
}
