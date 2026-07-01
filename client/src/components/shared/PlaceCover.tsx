import React, { useEffect, useRef, useState } from 'react'
import { getCached, isLoading, fetchPhoto, onThumbReady } from '../../services/photoService'
import { useAuthStore } from '../../store/authStore'
import { entityGradient } from '../../utils/gradients'
import type { Place } from '../../types'

interface PlaceCoverProps {
  place: Pick<Place, 'id' | 'name' | 'image_url' | 'google_place_id' | 'osm_id' | 'lat' | 'lng'>
}

/**
 * Full-bleed rectangular cover for a place card — the same photoService-backed
 * lazy fetch as PlaceAvatar, but rendered edge-to-edge (object-fit: cover)
 * instead of a circle. When there is no photo it falls back to a deterministic
 * vibrant gradient (entityGradient), matching the dashboard trip cards. The
 * parent supplies the aspect box + rounding via `.col-cover`.
 */
export default React.memo(function PlaceCover({ place }: PlaceCoverProps) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(place.image_url || null)
  const [visible, setVisible] = useState(false)
  const imageUrlFailed = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  const placesPhotosEnabled = useAuthStore(s => s.placesPhotosEnabled)

  // Fetch the photo only once the card scrolls near the viewport (or if it is
  // already cached / carries an image_url), so a long grid stays cheap.
  useEffect(() => {
    if (place.image_url) { setVisible(true); return }
    if (!placesPhotosEnabled) return
    const el = ref.current
    if (!el) return
    const photoId = place.google_place_id || place.osm_id
    const cacheKey = photoId || `${place.lat},${place.lng}`
    if (cacheKey && getCached(cacheKey)) { setVisible(true); return }

    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { rootMargin: '250px' })
    io.observe(el)
    return () => io.disconnect()
  }, [place.id])

  useEffect(() => {
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
      return onThumbReady(cacheKey, thumb => setPhotoSrc(thumb))
    }
    fetchPhoto(cacheKey, photoId || `coords:${place.lat}:${place.lng}`, place.lat, place.lng, place.name,
      entry => { setPhotoSrc(entry.thumbDataUrl || entry.photoUrl) })
    return onThumbReady(cacheKey, thumb => setPhotoSrc(thumb))
  }, [visible, place.id, place.image_url, place.google_place_id, place.osm_id])

  if (photoSrc) {
    return (
      <div ref={ref} className="col-cover-media">
        <img
          src={photoSrc}
          alt={place.name}
          decoding="async"
          loading="lazy"
          onError={() => {
            if (!imageUrlFailed.current && photoSrc === place.image_url && (place.google_place_id || place.osm_id)) {
              imageUrlFailed.current = true
              const photoId = place.google_place_id || place.osm_id!
              fetchPhoto(`refetch:${photoId}`, photoId, place.lat ?? undefined, place.lng ?? undefined, place.name,
                entry => { setPhotoSrc(entry.thumbDataUrl || entry.photoUrl) })
            } else {
              setPhotoSrc(null)
            }
          }}
        />
      </div>
    )
  }

  return <div ref={ref} className="col-cover-media col-cover-fallback" style={{ backgroundImage: entityGradient(place.id) }} />
})
