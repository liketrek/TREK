import { haversineKm, projectOntoRoute, type LatLng } from './corridor'
import type { Poi } from '../Map/poiCategories'

/**
 * Picking a filling station for a tank that is about to run out.
 *
 * Pure: no React, no network. The caller does the one request and hands the answers
 * here, which keeps the judgement — which of these can the car actually reach — testable
 * without a server.
 */

/** A candidate, with the two figures that decide whether it is any use. */
export interface RefuelCandidate extends Poi {
  /** Kilometres along the day's driving line, in the same space as the dry point. */
  alongKm: number
  /** How far off the road it sits. */
  offRouteKm: number
  /** Kilometres of range still in the tank when the car draws level with it. */
  spareKm: number
}

/**
 * How much of the last drop to keep back, in kilometres.
 *
 * Arriving at a pump with nothing left is not a plan, and the range figure a traveller
 * types is a round number from a manual rather than a measurement. Ten kilometres is
 * small enough not to move the suggestion and large enough not to promise the
 * impossible.
 */
const RESERVE_KM = 10

/**
 * The stations that can actually be reached, nearest to the dry point first.
 *
 * Three filters, and each one exists because its absence produces a wrong answer rather
 * than an untidy one:
 *
 *  - Only what lies BEFORE the point the tank empties. A station 20 km past it is on the
 *    far side of an empty tank, and offering it is offering a walk.
 *  - The detour counts double. A pump 8 km off the road is 16 km of driving, and on a
 *    tank this close to empty that is the difference between arriving and not.
 *  - What is left has to fit in the range that remains, minus a reserve.
 *
 * Sorted by the detour, not by how far along the road it sits. Measured against a real
 * day: the station that got furthest was 9.2 km off the road for one kilometre more of
 * range, while one 0.9 km off sat almost as late. Everything in this list is already
 * reachable, so what separates them is what the stop costs, and that is the detour. Ties
 * go to the later one, because filling up early wastes the tank you already paid for.
 */
export function reachableRefuels(
  pois: Poi[],
  line: LatLng[],
  dryAlongKm: number,
  { existing = [] }: { existing?: { lat: number; lng: number }[] } = {},
): RefuelCandidate[] {
  const out: RefuelCandidate[] = []
  for (const poi of pois) {
    const hit = projectOntoRoute({ lat: poi.lat, lng: poi.lng }, line)
    if (!hit) continue
    // Reached before the tank empties, once the detour out and back is paid for.
    const spareKm = dryAlongKm - hit.alongKm - hit.offRouteKm * 2 - RESERVE_KM
    if (spareKm < 0) continue
    // Already planned. Matched on position rather than on id: the same pump added by
    // hand, or from another source, carries a different osm_id and would otherwise be
    // suggested next to itself.
    if (existing.some(e => haversineKm(e, { lat: poi.lat, lng: poi.lng }) < 0.15)) continue
    out.push({ ...poi, alongKm: hit.alongKm, offRouteKm: hit.offRouteKm, spareKm })
  }
  return oneEach(out.sort((a, b) => a.offRouteKm - b.offRouteKm || a.spareKm - b.spareKm))
}

/**
 * What a search actually established, as opposed to what it returned.
 *
 * An empty list means one of two very different things, and saying the wrong one is
 * worse than saying nothing: either there is no filling station on this stretch, or we
 * never managed to look. The server flags the second case itself (`truncated` when it
 * hit its own ceiling, `clamped` when it narrowed the area), and a failed request is the
 * third. Only `none` is a statement about the road.
 */
export type RefuelOutcome = 'found' | 'none' | 'incomplete' | 'failed'

export function outcomeOf(
  candidates: RefuelCandidate[],
  answer: { truncated?: boolean; clamped?: boolean } | null,
): RefuelOutcome {
  if (!answer) return 'failed'
  if (candidates.length) return 'found'
  return answer.truncated || answer.clamped ? 'incomplete' : 'none'
}

/**
 * One entry per filling station, not one per pump.
 *
 * A charging site is mapped in OSM as a node per socket and a forecourt often as one per
 * pump, all with the same name a few metres apart. Deduplicating by id keeps every one of
 * them, which is right on a map and wrong in a list of three offers: measured on a real
 * day, the top three were the same "autostrom plus GmbH" three times over.
 *
 * Same name and within half a kilometre counts as the same place. Both halves matter:
 * not position alone, because two operators do share a motorway services, and not name
 * alone, because a chain has a branch in every town.
 *
 * Half a kilometre comes from the data rather than from taste. In one 25 km search the
 * four nodes of one charging site sat in two pairs, 6 m and 7 m apart, with 450 m between
 * the pairs — while genuinely different branches of the same chain were 18 to 36 km
 * apart. Anything from 500 m to a few kilometres separates those two cases; the lower end
 * is the safer place to stand.
 */
const SAME_PLACE_KM = 0.5

function oneEach(sorted: RefuelCandidate[]): RefuelCandidate[] {
  const kept: RefuelCandidate[] = []
  for (const poi of sorted) {
    const twin = kept.some(k =>
      k.name === poi.name && haversineKm(k, { lat: poi.lat, lng: poi.lng }) < SAME_PLACE_KM)
    if (!twin) kept.push(poi)
  }
  return kept
}
