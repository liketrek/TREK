import type { AssignmentPlace, Place } from '../../types'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'

type PlaceLike = Pick<Place | AssignmentPlace, 'name' | 'lat' | 'lng' | 'google_place_id' | 'google_ftid'>

export type NavigationAppId = 'google' | 'waze' | 'apple'

export interface NavigationTarget {
  id: NavigationAppId
  /** Product name. Not translated in any language, so it carries no i18n key. */
  label: string
  url: string
}

/**
 * Whether Apple Maps is worth offering. The entry is dead weight on Android and
 * Windows, so it only shows where the app exists.
 *
 * iPadOS 13 and later report themselves as "Macintosh", which is why the Mac
 * branch is not narrowed by touch: a real Mac has Apple Maps too, so both sides
 * of that ambiguity are correct.
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
}

/**
 * The map apps a place can be opened in, in the order they are offered.
 *
 * Google keeps the precise link it always had: `getGoogleMapsUrlForPlace` walks
 * ftid, then place id, then the details URL, and only falls back to coordinates,
 * so it lands on the right entry inside a mall rather than on the roof. Waze and
 * Apple Maps have no equivalent — they take coordinates and nothing else — which
 * is why they are absent for a place TREK has no position for.
 *
 * The two coordinate apps open with navigation armed, because that is what they
 * are for. Google stays on the place view it has always opened, so nobody's
 * habit changes.
 */
export function getNavigationTargets(
  place: PlaceLike | null | undefined,
  detailsUrl?: string | null,
): NavigationTarget[] {
  if (!place) return []
  const targets: NavigationTarget[] = []

  const googleUrl = getGoogleMapsUrlForPlace(place, detailsUrl)
  if (googleUrl) targets.push({ id: 'google', label: 'Google Maps', url: googleUrl })

  if (place.lat != null && place.lng != null) {
    targets.push({
      id: 'waze',
      label: 'Waze',
      url: `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`,
    })
    if (isApplePlatform()) {
      targets.push({
        id: 'apple',
        label: 'Apple Maps',
        url: `https://maps.apple.com/?daddr=${place.lat},${place.lng}`,
      })
    }
  }

  return targets
}

/** Opens a target the way every external link in the planner is opened. */
export function openNavigationTarget(target: NavigationTarget): void {
  window.open(target.url, '_blank', 'noopener,noreferrer')
}
