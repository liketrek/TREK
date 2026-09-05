import { useEffect, useMemo, useRef, useState } from 'react'
import { getCached, isLoading, fetchPhoto, onThumbReady, getAllThumbs } from '../../services/photoService'
import { useAuthStore } from '../../store/authStore'
import { isCustomPlaceImage, photoCacheKey } from './placePhoto'
import type { Place } from '../../types'

/**
 * The marker photo thumbnails, keyed by photoCacheKey.
 *
 * Most places carry no image of their own: the picture on a pin is fetched at
 * runtime into the photo service's cache and keyed by provider id or
 * coordinates, which is why reading place.image_url alone leaves nearly every
 * pin blank. Extracted from MapViewGL so a second renderer gets the same
 * pictures from the same cache instead of a second copy of this logic drifting
 * from it.
 *
 * Arrivals are batched through one animation frame: a trip with thirty places
 * resolves thirty thumbs at once, and a setState each would be thirty renders.
 */
export function usePlacePhotos(places: Place[]): Record<string, string> {
  const placesPhotosEnabled = useAuthStore(s => s.placesPhotosEnabled)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>(getAllThumbs)
  const pendingThumbsRef = useRef<Record<string, string>>({})
  const thumbRafRef = useRef<number | null>(null)
  const placeIds = useMemo(() => places.map(p => p.id).join(','), [places])

  useEffect(() => {
    if (!places || places.length === 0 || !placesPhotosEnabled) return
    const cleanups: (() => void)[] = []

    const setThumb = (cacheKey: string, thumb: string) => {
      pendingThumbsRef.current[cacheKey] = thumb
      if (thumbRafRef.current !== null) return
      thumbRafRef.current = requestAnimationFrame(() => {
        thumbRafRef.current = null
        const pending = pendingThumbsRef.current
        pendingThumbsRef.current = {}
        setPhotoUrls(prev => {
          const hasChange = Object.entries(pending).some(([k, v]) => prev[k] !== v)
          return hasChange ? { ...prev, ...pending } : prev
        })
      })
    }

    for (const place of places) {
      // A custom uploaded image is shown directly — never auto-fetch a provider
      // photo for it (that request would 404 for OSM-only places and, worse, the
      // fetched thumb would shadow the user's own image). (#1136)
      if (isCustomPlaceImage(place.image_url)) continue
      const cacheKey = photoCacheKey(place)
      if (!cacheKey) continue
      const cached = getCached(cacheKey)
      if (cached?.thumbDataUrl) {
        setThumb(cacheKey, cached.thumbDataUrl)
        continue
      }
      cleanups.push(onThumbReady(cacheKey, thumb => setThumb(cacheKey, thumb)))
      if (!cached && !isLoading(cacheKey)) {
        const photoId =
          (place.image_url?.startsWith('/api/maps/place-photo/') ? place.image_url : null)
          || place.google_place_id
          || place.osm_id
          || place.image_url
        if (photoId || (place.lat && place.lng)) {
          fetchPhoto(cacheKey, photoId || `coords:${place.lat}:${place.lng}`, place.lat, place.lng, place.name)
        }
      }
    }

    return () => {
      cleanups.forEach(fn => fn())
      if (thumbRafRef.current !== null) {
        cancelAnimationFrame(thumbRafRef.current)
        thumbRafRef.current = null
      }
    }
  }, [placeIds, placesPhotosEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return photoUrls
}

/**
 * The image a pin should draw: a custom uploaded image wins over the
 * auto-fetched thumbnail, which in turn wins over a bare stored URL.
 */
export function placePhotoUrl(place: Place, photoUrls: Record<string, string>): string | null {
  if (isCustomPlaceImage(place.image_url)) return place.image_url!
  const key = photoCacheKey(place)
  return (key && photoUrls[key]) || place.image_url || null
}

/**
 * The image for the hover card, which is ~220px wide.
 *
 * placePhotoUrl returns what the pin draws, and the photo service downscales
 * that to 48px so a map full of markers stays cheap — fine inside a 36px circle,
 * visibly soft blown up in a card. The cache keeps the full-size source
 * alongside the thumbnail, so prefer that and fall back to the thumbnail only
 * when there is nothing better.
 */
export function placePopupPhotoUrl(place: Place, photoUrls: Record<string, string>): string | null {
  if (isCustomPlaceImage(place.image_url)) return place.image_url!

  const key = photoCacheKey(place)
  // Only our own proxy URLs are displayable straight from an <img src> — a bare
  // provider URL is a fetch seed, not something the card can render.
  const cachedFull = key ? getCached(key)?.photoUrl : null
  if (cachedFull?.startsWith('/api/maps/place-photo/')) return cachedFull
  if (place.image_url?.startsWith('/api/maps/place-photo/')) return place.image_url

  return (key && photoUrls[key]) || null
}

