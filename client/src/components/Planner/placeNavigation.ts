import { isOutsideChina } from '@trek/shared'
import type { AssignmentPlace, Place } from '../../types'
import { getAmapUrlForPlace } from './placeAmap'
import { getCoMapsUrlForPlace } from './placeCoMaps'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'
import { getOpenStreetMapUrlForPlace } from './placeOpenStreetMap'
import { useSettingsStore } from '../../store/settingsStore'
import { isInstalledApp } from '../../utils/resumeRoute'

type PlaceLike = Pick<Place | AssignmentPlace, 'name' | 'address' | 'lat' | 'lng' | 'google_place_id' | 'google_ftid'>

export type NavigationAppId = 'google' | 'waze' | 'apple' | 'osm' | 'comaps' | 'amap' | 'geo'

export interface NavigationTarget {
  id: NavigationAppId
  /** Product name. Not translated in any language, so it carries no i18n key. */
  label: string
  /** Set for the one entry that is no product (#1406): its label is this key's translation. */
  labelKey?: string
  url: string
}

type Translate = (key: string) => string

/** What a target is called on screen: its product name, or the translated name of the generic entry. */
export function navigationTargetLabel(target: NavigationTarget, t: Translate): string {
  return target.labelKey ? t(target.labelKey) : target.label
}

/**
 * Whether the generic `geo:` link is worth offering (#1406). Android hands it to
 * whichever map app the traveller installed (OsmAnd, Organic Maps, Magic Earth…);
 * desktop browsers and iOS have no handler, so there the entry would lead nowhere.
 */
export function showsGeoUri(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
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
  return withPreferredApp(allNavigationTargets(place, detailsUrl), useSettingsStore.getState().settings.preferred_nav_app)
}

/**
 * The traveller's preferred map app (#2423), when they picked one in settings:
 * just that target, so every navigate button opens it straight away. Unset, or
 * an app this place cannot be opened in (Amap outside China, Waze without
 * coordinates), keeps the full list.
 */
export function withPreferredApp(targets: NavigationTarget[], preferred: string | null | undefined): NavigationTarget[] {
  if (!preferred) return targets
  const match = targets.find(target => target.id === preferred)
  return match ? [match] : targets
}

/**
 * The apps the settings picker offers (#2423), narrowed by platform the same
 * way the list on a place is: Apple Maps not on Android, the generic geo: entry
 * only there. Amap stays in, it is simply skipped for places outside China.
 */
export function navigationAppChoices(): { id: NavigationAppId; label: string; labelKey?: string }[] {
  const choices: { id: NavigationAppId; label: string; labelKey?: string }[] = [
    { id: 'google', label: 'Google Maps' },
    { id: 'waze', label: 'Waze' },
  ]
  if (showsAppleMaps()) choices.push({ id: 'apple', label: 'Apple Maps' })
  choices.push({ id: 'osm', label: 'OpenStreetMap' }, { id: 'comaps', label: 'CoMaps' }, { id: 'amap', label: '高德地图' })
  if (showsGeoUri()) choices.push({ id: 'geo', label: 'geo:', labelKey: 'inspector.otherMapApp' })
  return choices
}

/** The settings options (#2423): "ask every time" first, then each app from navigationAppChoices. */
export function preferredNavAppOptions(t: Translate): { value: string; label: string }[] {
  return [
    { value: '', label: t('settings.preferredNavAppAsk') },
    ...navigationAppChoices().map(app => ({ value: app.id, label: app.labelKey ? t(app.labelKey) : app.label })),
  ]
}

function allNavigationTargets(
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

  // Last, beside the OSM entry it shares a map source with: CoMaps is the offline
  // end of this list, the one that still works with no signal.
  const coMapsUrl = getCoMapsUrlForPlace(place)
  if (coMapsUrl) targets.push({ id: 'comaps', label: 'CoMaps', url: coMapsUrl })

  // Offered by WHERE the place is, not by who is looking at it. Amap only has a
  // map of China, so it is the right choice for a stop in Shanghai whoever is
  // planning the trip, and dead weight for one in Lisbon whoever is planning it —
  // and this row is deliberately short. showsAppleMaps() above narrows by
  // platform for the same reason; this one narrows by geography because that is
  // what decides whether the link leads anywhere.
  if (place.lat != null && place.lng != null && !isOutsideChina(place.lat, place.lng)) {
    const amapUrl = getAmapUrlForPlace(place)
    if (amapUrl) targets.push({ id: 'amap', label: '高德地图', url: amapUrl })
  }

  if (place.lat != null && place.lng != null && showsGeoUri()) {
    const label = name ? `(${encodeURIComponent(name)})` : ''
    targets.push({
      id: 'geo',
      label: 'geo:',
      labelKey: 'inspector.otherMapApp',
      url: `geo:${place.lat},${place.lng}?q=${place.lat},${place.lng}${label}`,
    })
  }

  return targets
}

/**
 * Hands the place over to a maps application.
 *
 * In a browser tab this opens a tab, which is what a link should do. In an
 * installed app it must not: the maps application takes over from the new
 * context before it paints, so what the user comes back to is an empty window
 * they have to dismiss before TREK is usable again (#2218). Navigating the
 * current context instead means the handover happens from the page the user is
 * already on, and returning lands them back where they were, because the app
 * shell was never replaced by the time the platform switched away.
 */
export function openNavigationTarget(target: NavigationTarget): void {
  // A geo: link is handed to the system, which asks for the app; a new tab would stay blank.
  if (target.id === 'geo' || isInstalledApp()) window.location.href = target.url
  else window.open(target.url, '_blank', 'noopener,noreferrer')
}
