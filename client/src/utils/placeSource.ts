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

/**
 * The three names are proper nouns, so they are not translated, and that is
 * also why there is no fourth: a source without a name people already know
 * would need a string in 23 languages to say less than nothing.
 */
export const SOURCE_LABELS: Record<string, string> = {
  'trek-places': 'TREK',
  openstreetmap: 'OpenStreetMap',
  nominatim: 'OpenStreetMap',
  google: 'Google',
}

/**
 * The label for one row.
 *
 * A place carries its own source when the index that produced it says so, which
 * is what makes an interleaved list readable. Everything else falls back to what
 * answered the call: Google never marks its places, and a merged list marks only
 * the index side, so an unmarked row in one is OpenStreetMap by elimination.
 */
export function sourceLabelFor(place: unknown, listSource: string): string | null {
  const own = (place as { source?: unknown } | null)?.source
  if (typeof own === 'string' && own) return SOURCE_LABELS[own] ?? null
  if (listSource.includes('openstreetmap')) return SOURCE_LABELS.openstreetmap
  return SOURCE_LABELS[listSource] ?? null
}
