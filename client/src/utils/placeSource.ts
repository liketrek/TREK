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
