import { formatDurationShort } from './roadtripModel'
import { ALT_PRIMARY, ALT_SECONDARY, ALT_LABEL_PRIMARY_BG, ALT_LABEL_SECONDARY_BG } from './alternativeColors'
import type { RouteAlternative } from '../Map/RouteCalculator'

/** One offered route, ready to draw: the line, its colour, and where its label sits. */
export interface AlternativeOverlay {
  index: number
  coordinates: [number, number][]
  color: string
  /** The drive time, the way Apple Maps puts it on the road itself. */
  label: string
  /** The second line under it — "Fastest", "Current" — or empty for the plain ones. */
  note: string
  /** How long this way takes and how far it is, for the list beside the map. */
  duration: number
  distance: number
  /** Seconds more than the quickest offer; negative never happens by construction. */
  slowerThanQuickest: number
  labelBg: string
  /** Where to hang the label — a point on this route and on no other. */
  at: { lat: number; lng: number }
}

/**
 * Squared distance between two points, in degrees, with longitude scaled by latitude.
 *
 * Only ever compared against other values from this same function, so degrees are fine
 * and a haversine would cost more for an answer nobody reads.
 */
function roughDist(a: [number, number], b: [number, number]): number {
  const dLat = a[0] - b[0]
  const dLng = (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180)
  return dLat * dLat + dLng * dLng
}

/**
 * The point of `line` that lies furthest from every one of `others`.
 *
 * This is where a route is unmistakably itself. Anchoring a label at the geometric
 * midpoint instead put it wherever that happened to fall — and on a pair of routes that
 * split early and rejoin, the midpoint sits on the shared stretch, so the label appeared
 * to be pinned to the wrong road.
 *
 * Sampled rather than exhaustive: alternatives differ over kilometres, and comparing two
 * thousand-point lines in full costs milliseconds for a pixel of accuracy.
 */
function mostDistinctPoint(
  line: [number, number][],
  others: [number, number][][],
): { lat: number; lng: number } | null {
  if (!line.length) return null
  if (!others.length) {
    const mid = line[Math.floor(line.length / 2)]
    return mid ? { lat: mid[0], lng: mid[1] } : null
  }
  const sample = (l: [number, number][]) => Math.max(1, Math.floor(l.length / 150))
  let best: [number, number] | null = null
  let bestScore = -1
  for (let i = 0; i < line.length; i += sample(line)) {
    // How far this point is from the NEAREST other route: a point close to any of them
    // is not distinctive, however far it sits from the rest.
    let nearestOfAll = Infinity
    for (const other of others) {
      let nearest = Infinity
      const step = sample(other)
      for (let j = 0; j < other.length; j += step) {
        const d = roughDist(line[i], other[j])
        if (d < nearest) nearest = d
      }
      if (nearest < nearestOfAll) nearestOfAll = nearest
    }
    if (nearestOfAll > bestScore) { bestScore = nearestOfAll; best = line[i] }
  }
  return best ? { lat: best[0], lng: best[1] } : null
}

/**
 * The routes as the map should draw them, built once so every renderer agrees.
 *
 * Each label hangs where its own route is furthest from all the others, so a label always
 * sits on a stretch only that route uses. Two routes that share their first and last
 * thirds still get their labels on the middle third, where they actually differ.
 */
export function buildAlternativeOverlays(
  routes: (RouteAlternative & { current?: boolean; direct?: boolean })[] | undefined,
  labels: { fastest: string; current: string; noMotorway: string; noToll: string },
): AlternativeOverlay[] {
  if (!routes?.length) return []
  // A single answer is not a choice; drawing it would just double the route already there.
  if (routes.length < 2) return []

  // The quickest of what came back, which is what Apple calls out — not necessarily the
  // first entry, since the road currently driven is put at the top when there is one.
  const quickest = routes.reduce((best, r, i) => (r.duration < routes[best].duration ? i : best), 0)
  const anyCurrent = routes.some(r => r.current)

  return routes.map((route, index) => {
    const others = routes.filter((_, i) => i !== index).map(r => r.coordinates)
    const at = mostDistinctPoint(route.coordinates, others)
    // Blue is the road you are on: the one currently driven, or the router's own pick
    // when nothing has been bent. Everything else is the pale blue of an offer.
    const primary = route.current || (!anyCurrent && index === quickest)
    return {
      index,
      coordinates: route.coordinates,
      color: primary ? ALT_PRIMARY : ALT_SECONDARY,
      label: formatDurationShort(route.duration),
      // What this way IS beats what it is not: a road offered because the motorway was
      // left out of it says so, rather than being labelled by how much slower it is —
      // that is the reason somebody would take it.
      note: route.current
        ? labels.current
        : route.avoids === 'motorway'
          ? labels.noMotorway
          : route.avoids === 'toll'
            ? labels.noToll
            : index === quickest ? labels.fastest : '',
      duration: route.duration,
      distance: route.distance,
      slowerThanQuickest: Math.max(0, Math.round(route.duration - routes[quickest].duration)),
      labelBg: primary ? ALT_LABEL_PRIMARY_BG : ALT_LABEL_SECONDARY_BG,
      at: at ?? { lat: 0, lng: 0 },
    }
  })
}
