/**
 * Which places along a tour are its highlights: the ones people know.
 *
 * Fame is read from QRank, the page views of a place's Wikidata item across
 * the Wikimedia projects, as the TREK places service carries it on its
 * OpenStreetMap layer. A place without a Wikidata item has no rank and is
 * never a highlight; that says nothing about whether it is worth a visit.
 */

/** A place at least this well known is a highlight wherever it lies. */
export const TOUR_HIGHLIGHT_MIN_QRANK = 40_000;

/**
 * A route through quieter streets still shows its best known places: when
 * fewer than {@link TOUR_HIGHLIGHT_MIN_COUNT} reach the bar above, the best
 * known ones down to this rank fill up to that many.
 */
export const TOUR_HIGHLIGHT_FALLBACK_MIN_QRANK = 5_000;

/** How many highlights the fallback fills up to. */
export const TOUR_HIGHLIGHT_MIN_COUNT = 3;

/**
 * The ids of the highlights among places with a rank, best known first. Ties
 * keep the order they came in, so the same answer marks the same places.
 */
export function tourHighlightIds(ranked: ReadonlyArray<{ id: string; qrank: number }>): string[] {
  const best = [...ranked].filter((row) => Number.isFinite(row.qrank)).sort((a, b) => b.qrank - a.qrank);
  const famous = best.filter((row) => row.qrank >= TOUR_HIGHLIGHT_MIN_QRANK);
  if (famous.length >= TOUR_HIGHLIGHT_MIN_COUNT) return famous.map((row) => row.id);
  return best
    .filter((row) => row.qrank >= TOUR_HIGHLIGHT_FALLBACK_MIN_QRANK)
    .slice(0, TOUR_HIGHLIGHT_MIN_COUNT)
    .map((row) => row.id);
}
