import type { PlacePhotoCandidate } from '@trek/shared'

/** The name to put under a picture. Google gives no author, so it gets its own name. */
export function creditOf(photo: PlacePhotoCandidate): string {
  return photo.attribution || sourceLabelFor(photo.source)
}

/**
 * The provider a picture came from, for the pictures that hand us no author.
 * Proper names, so they are not translated.
 */
export function sourceLabelFor(source: PlacePhotoCandidate['source']): string {
  if (source === 'google') return 'Google'
  if (source === 'wikipedia') return 'Wikipedia'
  return 'Wikimedia Commons'
}

/** Author and licence joined for a single-line caption. */
export function photoCaption(photo: PlacePhotoCandidate): string {
  const credit = creditOf(photo)
  return photo.license ? `${credit} · ${photo.license}` : credit
}
