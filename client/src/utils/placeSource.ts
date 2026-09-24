/**
 * Which index a place came from, as a short mark beside it.
 *
 * A result list can be two indexes interleaved, so the source belongs on the
 * row rather than above the list: with the TREK index and OpenStreetMap
 * answering together, "one of these came from somewhere" is not an answer
 * anyone can use.
 *
 * Here rather than beside one screen because both the desktop form and the
 * mobile sheet show the same lists, and a mark that says TREK on one and
 * nothing on the other is worse than either alone.
 */

import type { TranslationFn } from '../types'

/**
 * Proper nouns, so they are not translated. A source without a name people
 * already know would need a string in 23 languages to say less than nothing.
 */
export const SOURCE_LABELS: Record<string, string> = {
  'trek-places': 'TREK',
  openstreetmap: 'OpenStreetMap',
  nominatim: 'OpenStreetMap',
  google: 'Google',
}

/**
 * The one name that changes with the reader: 高德地图 to the people it exists
 * for, Amap to everyone else. Hence a locale string rather than a fourth noun.
 */
const SOURCE_KEYS: Record<string, string> = {
  amap: 'places.source.amap',
}

/**
 * Whether a search can reach Google on this install at all.
 *
 * A stored key is not enough. The server walks the Google key chain only while
 * the admin's provider choice leaves Google the keyed slot, which is `auto` or
 * `google`; under Amap or OpenStreetMap the key still serves photos and
 * details, but a search sent to Google is answered by the index as before.
 * Anything unrecognised reads as `auto`, the way the server reads it.
 */
export function googleHoldsSlot(hasMapsKey: boolean, placesProvider: string): boolean {
  return hasMapsKey && placesProvider !== 'amap' && placesProvider !== 'openstreetmap'
}

/** The same question asked of the auth store, for `useAuthStore(selectGoogleHoldsSlot)`. */
export const selectGoogleHoldsSlot = (s: { hasMapsKey: boolean; placesProvider: string }): boolean =>
  googleHoldsSlot(s.hasMapsKey, s.placesProvider)

/**
 * Whether a result list can be sent to Google instead.
 *
 * The index and OpenStreetMap answer first, and Google is only asked when they
 * find nothing, so a list that has the wrong place on it never reaches Google
 * on its own. The link that sends it there is offered when Google holds the
 * keyed slot (googleHoldsSlot above) and this list did not already come from
 * Google: a list Google produced, alone or as the empty-case fallback, has
 * nowhere further to go, and the offline cache is not a search at all.
 */
export function offersGoogleRetry(listSource: string, googleAnswers: boolean): boolean {
  if (!googleAnswers || !listSource) return false
  return !listSource.split('+').includes('google') && listSource !== 'offline-cache'
}

/**
 * The line under the admin's "Search with Google only" switch.
 *
 * Two ways the switch can be a promise the search cannot keep, and they ask
 * different things of the admin: paste a key, or hand the keyed slot back to
 * Google. The subtitle that says what the switch does is only true of the
 * third state.
 */
export function placesGoogleOnlyHint(hasMapsKey: boolean, placesProvider: string): string {
  if (!hasMapsKey) return 'admin.placesGoogleOnly.missingKey'
  if (!googleHoldsSlot(hasMapsKey, placesProvider)) return 'admin.placesGoogleOnly.otherProvider'
  return 'admin.placesGoogleOnly.subtitle'
}

/**
 * The label for one row.
 *
 * A place carries its own source when the index that produced it says so, which
 * is what makes an interleaved list readable. Everything else falls back to what
 * answered the call: Google never marks its places, and a merged list marks only
 * the index side, so an unmarked row in one is OpenStreetMap by elimination.
 */
export function sourceLabelFor(place: unknown, listSource: string, t: TranslationFn): string | null {
  const own = (place as { source?: unknown } | null)?.source
  const source = typeof own === 'string' && own
    ? own
    : listSource.includes('openstreetmap') ? 'openstreetmap' : listSource
  if (SOURCE_KEYS[source]) return t(SOURCE_KEYS[source])
  return SOURCE_LABELS[source] ?? null
}
