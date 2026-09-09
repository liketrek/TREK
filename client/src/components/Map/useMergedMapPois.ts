import { useMemo } from 'react'
import type { Poi } from './poiCategories'

/**
 * The findings the map should draw, when two searches can be running at once.
 *
 * In road trip mode the corridor search answers "what is along this drive". The category
 * pill answers a different question — "what is in view right now" — and a hotel at tonight's
 * stop is exactly the case where someone wants the second one without giving up the first,
 * so the two lists are drawn together rather than one replacing the other.
 *
 * Identity is `osm_id`, the same key the corridor search dedupes its own overlapping tiles
 * on: a hotel found both along the route and in the viewport is one pin, and the corridor's
 * copy wins because it carries how far along the drive it sits.
 *
 * Returns the input array itself whenever there is nothing to merge. The map redraws off
 * this reference, so handing it a fresh array on every render would rebuild every pin.
 */
export function useMergedMapPois(corridor: Poi[] | null, explore: Poi[]): Poi[] {
  return useMemo(() => {
    if (!corridor) return explore
    if (!explore.length) return corridor
    if (!corridor.length) return explore
    const seen = new Set(corridor.map(p => p.osm_id))
    const extra = explore.filter(p => !seen.has(p.osm_id))
    return extra.length ? [...corridor, ...extra] : corridor
  }, [corridor, explore])
}
