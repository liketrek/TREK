import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import PlaceAvatar from './PlaceAvatar'
import { normalizeImageFile } from '../../utils/convertHeic'
import { useToast } from './Toast'
import { useTranslation, translateApiError } from '../../i18n'
import type { Place } from '../../types'

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
}

/**
 * A PlaceAvatar the user can click to set a custom thumbnail (#1136): hover reveals
 * a camera overlay, clicking opens the file picker, and when a custom upload is
 * present a small corner button removes it (falling back to the default photo/icon).
 */
export default function PlaceAvatarUpload({ place, category, size = 52, onUpload, onRemove }: PlaceAvatarUploadProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const hasCustom = Boolean(place.image_url)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      await onUpload(await normalizeImageFile(file))
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
    <div
      className="group"
      style={{ position: 'relative', width: size, height: size, cursor: busy ? 'default' : 'pointer' }}
      onClick={() => { if (!busy) fileRef.current?.click() }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); fileRef.current?.click() } }}
      aria-label={hasCustom ? t('places.changeImage') : t('places.uploadImage')}
      title={hasCustom ? t('places.changeImage') : t('places.uploadImage')}
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

      {/* Remove button — only when a custom upload is set. */}
      {hasCustom && !busy && (
        <button
          type="button"
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100"
          aria-label={t('places.removeImage')}
          title={t('places.removeImage')}
          style={{
            position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%',
            background: '#ef4444', color: '#fff', border: '2px solid var(--bg-elevated, #fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'opacity 0.15s', padding: 0,
          }}
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}
