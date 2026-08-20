import { calculateRouteWithLegs } from '../Map/RouteCalculator'

/**
 * The roads between a book's stops.
 *
 * ── Why this is fetched here and frozen, rather than stored ──────────────
 *
 * TREK already asks OSRM for road geometry every time the planner draws a
 * driving day, and then throws it away: it lives in React state and a tab-local
 * cache, is never persisted, and no endpoint accepts it. Rather than build the
 * table, the write path, the read path and the migration that would keep it,
 * this asks the same router the planner asks, once, when somebody turns the
 * option on — and writes the answer into the document like every other travel
 * figure. The book then prints the same line offline, next year, on a machine
 * that has never heard of OSRM.
 *
 * ── What it refuses to route ─────────────────────────────────────────────
 *
 * A leg is only sent if a road answer is plausible. Two reasons, and both are
 * about honesty rather than about cost: a router asked for Reykjavík to Lisbon
 * either fails or answers with three days of driving and a ferry, and neither
 * is the flight that was actually taken. Past the ceiling the leg keeps the
 * bow, which is how a printed map has always said "this part was flown".
 *
 * ── And why it is polite about it ────────────────────────────────────────
 *
 * The public router is a community service, asked from the designer's own
 * browser with no identifying header, one request per leg. So the legs go one
 * at a time with a pause between them, the way the transport-booking hook
 * already paces itself, and a failure is an answer rather than an error: that
 * leg simply has no road, and the map draws the line it drew before.
 */

/** Past this, a leg is a flight rather than a drive. */
const ROAD_CEILING_KM = 1200

/** A pause between legs, so a long journey is not a burst. */
const PACE_MS = 120

/**
 * What a printed leg can resolve.
 *
 * A hundred and twenty, not four hundred, and the reason is bytes rather than
 * looks: the whole book travels in one request on every autosave, and four
 * hundred points a leg puts a thirteen-leg journey over a hundred kilobytes on
 * its own. At page size a road with this many points is already smoother than
 * the press can resolve — the extra detail was costing the save, not the map.
 */
const MAX_POINTS_PER_LEG = 120

/**
 * Five decimals, which is about a metre.
 *
 * OSRM answers with six or seven, and the last two describe a position more
 * precisely than the road is wide. Rounding here rather than at draw time is
 * what keeps them out of the document, where they would be paid for on every
 * save for the rest of the book's life.
 */
const round5 = (n: number): number => Math.round(n * 1e5) / 1e5

export interface RoadStop {
  lat: number
  lng: number
}

function km(a: RoadStop, b: RoadStop): number {
  const r = (d: number) => (d * Math.PI) / 180
  const dLat = r(b.lat - a.lat)
  const dLng = r(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Thin a leg to what a printed line can show.
 *
 * Evenly spaced and keeping both ends, the same rule the journey's own route
 * thinning uses: dropping a run out of the middle would cut the shape of the
 * road out, while every n-th point keeps it and loses only detail no press can
 * resolve.
 */
function thin(points: [number, number][]): [number, number][] {
  if (points.length <= MAX_POINTS_PER_LEG) return points
  const out: [number, number][] = []
  const step = (points.length - 1) / (MAX_POINTS_PER_LEG - 1)
  for (let i = 0; i < MAX_POINTS_PER_LEG; i++) out.push(points[Math.round(i * step)])
  return out
}

/**
 * The road for every leg, or null where there is none.
 *
 * Always as long as `stops.length - 1`, so entry `i` is unambiguously the way
 * from stop `i` to stop `i + 1` — a shorter array would leave the renderer
 * guessing which legs it had answers for.
 */
export async function fetchRoads(
  stops: RoadStop[],
  opts: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<([number, number][] | null)[]> {
  const legs = Math.max(0, stops.length - 1)
  const out: ([number, number][] | null)[] = new Array(legs).fill(null)

  for (let i = 0; i < legs; i++) {
    if (opts.signal?.aborted) break
    const a = stops[i]
    const b = stops[i + 1]

    if (km(a, b) > ROAD_CEILING_KM) {
      opts.onProgress?.(i + 1, legs)
      continue
    }

    try {
      const r = await calculateRouteWithLegs([a, b], { signal: opts.signal, profile: 'driving' })
      // Two points back is the straight line the caller already draws, so it is
      // not a road and storing it would only cost bytes.
      if (r.coordinates.length > 2) {
        out[i] = thin(r.coordinates).map(([lat, lng]) => [round5(lat), round5(lng)])
      }
    } catch {
      // A leg with no road keeps the line it had. Not an error worth a message:
      // an island, a closed border and a router having a bad day all look the
      // same from here, and all three mean the same thing for the drawing.
    }

    opts.onProgress?.(i + 1, legs)
    if (i < legs - 1 && PACE_MS) await new Promise(resolve => { setTimeout(resolve, PACE_MS) })
  }

  return out
}
