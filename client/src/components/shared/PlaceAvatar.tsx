import React, { useState, useEffect, useRef } from 'react'
import { getCategoryIcon } from './categoryIcons'
import { getCached, isLoading, fetchPhoto, onThumbReady, onPhotoLoaded } from '../../services/photoService'
import { useAuthStore } from '../../store/authStore'
import type { Place } from '../../types'

interface Category {
  color?: string
  icon?: string
}

interface PlaceAvatarProps {
  place: Pick<Place, 'id' | 'name' | 'image_url' | 'google_place_id' | 'osm_id' | 'lat' | 'lng'>
  size?: number
  category?: Category | null
}

export default React.memo(function PlaceAvatar({ place, size = 32, category }: PlaceAvatarProps) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(place.image_url || null)
  // Bumped to remount the <img> when the photo should be loaded again from the
  // same URL, which a src change alone cannot do.
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [visible, setVisible] = useState(false)
  const imageUrlFailed = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  const placesPhotosEnabled = useAuthStore(s => s.placesPhotosEnabled)

  // Observe visibility — fetch photo only when avatar enters viewport
  useEffect(() => {
    if (place.image_url) { setVisible(true); return }
    if (!placesPhotosEnabled) return
    const el = ref.current
    if (!el) return
    // Check if already cached — show immediately without waiting for intersection
    const photoId = place.google_place_id || place.osm_id
    const cacheKey = photoId || `${place.lat},${place.lng}`
    if (cacheKey && getCached(cacheKey)) { setVisible(true); return }

    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [place.id])

  useEffect(() => {
    // A new place or a new picture gets its own self-heal below.
    imageUrlFailed.current = false
    if (!visible) return
    if (place.image_url) { setPhotoSrc(place.image_url); return }
    if (!placesPhotosEnabled) return
    const photoId = place.google_place_id || place.osm_id
    if (!photoId && !(place.lat && place.lng)) { setPhotoSrc(null); return }

    const cacheKey = photoId || `${place.lat},${place.lng}`

    const cached = getCached(cacheKey)
    if (cached) {
      setPhotoSrc(cached.thumbDataUrl || cached.photoUrl)
      if (!cached.thumbDataUrl && cached.photoUrl) {
        return onThumbReady(cacheKey, thumb => setPhotoSrc(thumb))
      }
      return
    }

    if (isLoading(cacheKey)) {
      // Another view started this fetch. Take its photo as soon as it lands,
      // and the thumb when that follows; a failed thumb must not leave the
      // category icon standing in for a photo that loaded.
      const offPhoto = onPhotoLoaded(cacheKey, entry => setPhotoSrc(entry.thumbDataUrl || entry.photoUrl))
      const offThumb = onThumbReady(cacheKey, thumb => setPhotoSrc(thumb))
      return () => { offPhoto(); offThumb() }
    }

    fetchPhoto(cacheKey, photoId || `coords:${place.lat}:${place.lng}`, place.lat, place.lng, place.name,
      entry => { setPhotoSrc(entry.thumbDataUrl || entry.photoUrl) }
    )
    return onThumbReady(cacheKey, thumb => setPhotoSrc(thumb))
  }, [visible, place.id, place.image_url, place.google_place_id, place.osm_id])

  const bgColor = category?.color || '#6366f1'
  const IconComp = getCategoryIcon(category?.icon)
  const iconSize = Math.round(size * 0.46)

  const containerStyle: React.CSSProperties = {
    width: size, height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: bgColor,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  if (photoSrc) {
    return (
      <div ref={ref} style={containerStyle}>
        <img
          key={loadAttempt}
          src={photoSrc}
          alt={place.name}
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => {
            if (!imageUrlFailed.current && photoSrc === place.image_url && (place.google_place_id || place.osm_id)) {
              imageUrlFailed.current = true
              const photoId = place.google_place_id || place.osm_id!
              const cacheKey = `refetch:${photoId}`
              // The server answers a missing cache file with an empty 204 and
              // fetches the photo again on this call. It hands back the same
              // proxy URL, so the <img> has to be remounted to ask once more;
              // setting an unchanged src would leave it broken (5.0.0-pre.1
              // feedback). A second failure ends on the category icon.
              fetchPhoto(cacheKey, photoId, place.lat ?? undefined, place.lng ?? undefined, place.name,
                entry => {
                  setPhotoSrc(entry.thumbDataUrl || entry.photoUrl)
                  setLoadAttempt(n => n + 1)
                }
              )
            } else {
              setPhotoSrc(null)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div ref={ref} style={containerStyle}>
      <IconComp size={iconSize} strokeWidth={1.8} color="rgba(255,255,255,0.92)" />
    </div>
  )
})
