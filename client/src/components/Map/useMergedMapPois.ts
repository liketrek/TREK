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
 * `offered` is the third case: the handful of filling stations proposed where a tank runs
 * out. They belong on the map for a plain reason — somebody is being asked to accept a
 * stop, and a stop you cannot see is not one you can judge — but they are not a search
 * result and must not survive the panel being closed, which is why they arrive separately
 * rather than being folded into the corridor's own list.
 *
 * Returns the input array itself whenever there is nothing to merge. The map redraws off
 * this reference, so handing it a fresh array on every render would rebuild every pin.
 */
export function useMergedMapPois(corridor: Poi[] | null, explore: Poi[], offered: Poi[] = NONE): Poi[] {
  return useMemo(() => {
    const base = corridor === null ? explore : merge(corridor, explore)
    return merge(base, offered)
  }, [corridor, explore, offered])
}

/** Nothing offered, as one stable array, so the default never changes identity. */
const NONE: Poi[] = []

/** `a` with everything from `b` that it does not already carry, by `osm_id`. */
function merge(a: Poi[], b: Poi[]): Poi[] {
  if (!b.length) return a
  if (!a.length) return b
  const seen = new Set(a.map(p => p.osm_id))
  const extra = b.filter(p => !seen.has(p.osm_id))
  return extra.length ? [...a, ...extra] : a
}
