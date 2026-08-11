import type { AssignmentPlace, Place } from '../../types'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'
import { getOpenStreetMapUrlForPlace } from './placeOpenStreetMap'

type PlaceLike = Pick<Place | AssignmentPlace, 'name' | 'lat' | 'lng' | 'google_place_id' | 'google_ftid'>

export type NavigationAppId = 'google' | 'waze' | 'apple' | 'osm'

export interface NavigationTarget {
  id: NavigationAppId
  /** Product name. Not translated in any language, so it carries no i18n key. */
  label: string
  url: string
}

/**
 * Whether Apple Maps is worth offering.
 *
 * Apple platforms open the installed app. Everywhere else the link still works,
 * because Apple Maps has had a web version since 2024, so a Windows or Linux
 * desktop gets a perfectly usable map rather than a dead end.
 *
 * Android is the one place it stays hidden: the web version works there too,
 * but nobody navigating from an Android phone reaches for Apple Maps, and the
 * row of choices is short for a reason.
 *
 * iPadOS 13 and later report themselves as "Macintosh", which is why the Mac
 * branch is not narrowed by touch: a real Mac has the app, an iPad has the app,
 * so both sides of that ambiguity are correct.
 */
export function showsAppleMaps(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Macintosh/.test(ua)) return true
  return !/Android/i.test(ua)
}

/**
 * The map apps a place can be opened in, in the order they are offered.
 *
 * None of them gets bare coordinates. Waze and Apple Maps both take a query
 * alongside the position (`q` in each case, documented by both), and the pair
 * is what makes the destination legible: the coordinates anchor which place is
 * meant, the name is what the driver sees on the screen instead of a number.
 * Without the position a name alone would be a gamble — there are a lot of
 * places called "Bahnhof" — so a place TREK has no coordinates for reaches
 * neither app.
 *
 * Google is the exception and keeps the link it always had, because it can do
 * better than a name: `getGoogleMapsUrlForPlace` walks ftid, then place id,
 * then the details URL, which lands on the right entry inside a mall rather
 * than on the roof.
 *
 * Waze arms navigation, since driving is the only thing it does. The other
 * three open the place, which is what Google has always done here, and starting
 * navigation from there is one tap.
 */
export function getNavigationTargets(
  place: PlaceLike | null | undefined,
  detailsUrl?: string | null,
): NavigationTarget[] {
  if (!place) return []
  const targets: NavigationTarget[] = []
  const name = place.name?.trim()

  const googleUrl = getGoogleMapsUrlForPlace(place, detailsUrl)
  if (googleUrl) targets.push({ id: 'google', label: 'Google Maps', url: googleUrl })

  if (place.lat != null && place.lng != null) {
    const ll = `${place.lat},${place.lng}`
    const q = name ? `q=${encodeURIComponent(name)}&` : ''
    targets.push({
      id: 'waze',
      label: 'Waze',
      url: `https://waze.com/ul?${q}ll=${ll}&navigate=yes`,
    })
    if (showsAppleMaps()) {
      targets.push({
        id: 'apple',
        label: 'Apple Maps',
        url: `https://maps.apple.com/?${q}ll=${ll}`,
      })
    }
  }

  const osmUrl = getOpenStreetMapUrlForPlace(place)
  if (osmUrl) targets.push({ id: 'osm', label: 'OpenStreetMap', url: osmUrl })

  return targets
}

/** Opens a target the way every external link in the planner is opened. */
export function openNavigationTarget(target: NavigationTarget): void {
  window.open(target.url, '_blank', 'noopener,noreferrer')
}
