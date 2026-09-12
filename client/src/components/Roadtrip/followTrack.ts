import { haversineKm, projectOntoRoute, type LatLng } from './corridor'

/**
 * Making a day's drive follow an imported track.
 *
 * A GPX track is a shape, not a route: a list of positions with no idea which roads they
 * were recorded on. Drawing it beside the day is easy and useless — the distance, the
 * drive time and every warning still belong to the motorway the router picked, so the
 * plan says four hours while the road nobody is taking says seven. Norway publishes its
 * scenic routes this way, and so does every touring club worth importing from.
 *
 * What turns a shape into a route the day actually takes is a handful of vias placed on
 * it, because a via is the one thing a router treats as "go through here". Placing them
 * is the whole problem. Every point of the track would route exactly and take a hundred
 * requests; two would route in seconds and follow nothing.
 *
 * So this refines: route through what we have, find the point of the track the road
 * misses by the most, make that point a via, and go again. Each round roughly halves the
 * worst miss, because the new via lands in the middle of whatever the last one left
 * unfollowed — which is why a scenic route usually fits inside ten of them, and why the
 * loop stops when the road is close enough rather than after a fixed count.
 *
 * Everything here is pure apart from the injected router: no React, no store, no api.
 */

/** Track points kept for measuring — enough to catch a hairpin, few enough to be fast. */
const MEASURE_POINTS = 400

/** Routed points kept for measuring. Coarser: it is the thing being measured against. */
const ROUTE_POINTS = 2000

/**
 * How close a via may sit to a stop, or to another via, before it is pointless.
 *
 * A via a hundred metres from a stop tells the router nothing it did not already know
 * from the stop, and two vias in the same lay-by cost a waypoint each to say one thing.
 */
const MIN_GAP_KM = 0.6

export interface FollowTrackOptions {
  /** How close the road must come to the track before the plan is done, in kilometres. */
  toleranceKm?: number
  /** The most vias the plan may lay down. */
  maxVias?: number
  /** The most routing round trips it may spend. */
  maxRounds?: number
}

export interface TrackVia {
  /** The stop the via hangs behind, as an index into the day's stops. */
  after_order_index: number
  lat: number
  lng: number
}

export interface FollowTrackPlan {
  /** The vias to write, in driving order, each already on the leg it shapes. */
  vias: TrackVia[]
  /** The legs the track runs along — cleared first, so applying twice does not stack. */
  legs: number[]
  /** How far the road still strays from the track at its worst point, in kilometres. */
  strayKm: number
  /** Routing round trips spent. */
  rounds: number
  /** True when it ran out of vias or rounds before the road fitted the track. */
  capped: boolean
}

const EMPTY_PLAN: FollowTrackPlan = { vias: [], legs: [], strayKm: 0, rounds: 0, capped: false }

/**
 * The points of a stored track.
 *
 * `route_geometry` is the column the GPX and KML importers write, holding `[lat, lng]`
 * pairs or `[lat, lng, ele]` triples depending on whether every point carried an
 * elevation. Anything else in there is somebody else's data — a malformed track is worth
 * skipping, never worth throwing over.
 */
export function parseTrack(routeGeometry: string | null | undefined): LatLng[] {
  if (!routeGeometry) return []
  try {
    const raw: unknown = JSON.parse(routeGeometry)
    if (!Array.isArray(raw)) return []
    const out: LatLng[] = []
    for (const point of raw) {
      if (!Array.isArray(point) || point.length < 2) continue
      const lat = Number(point[0])
      const lng = Number(point[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      out.push({ lat, lng })
    }
    return out
  } catch {
    return []
  }
}

/** How long a polyline is, in kilometres. */
export function lineLengthKm(line: LatLng[]): number {
  let km = 0
  for (let i = 1; i < line.length; i++) km += haversineKm(line[i - 1], line[i])
  return km
}

/**
 * Every nth point, keeping both ends.
 *
 * Deliberately not the Douglas-Peucker in `corridor.ts`: that one is recursive and slices
 * the array at every step, which is fine for a routed leg and quadratic on a recorded
 * track of thirty thousand points. Taking a stride loses a little accuracy on a hairpin
 * and none of the shape, and the tolerance this feeds is measured in kilometres.
 */
export function thin(line: LatLng[], max: number): LatLng[] {
  if (line.length <= max) return line
  const stride = Math.ceil(line.length / max)
  const out: LatLng[] = []
  for (let i = 0; i < line.length; i += stride) out.push(line[i])
  const last = line[line.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

/** Index of the point of `line` closest to `p`. */
export function nearestIndex(line: LatLng[], p: LatLng): number {
  let best = Number.POSITIVE_INFINITY
  let at = 0
  for (let i = 0; i < line.length; i++) {
    const d = haversineKm(line[i], p)
    if (d < best) {
      best = d
      at = i
    }
  }
  return at
}

/** How far a point lies from a line, in kilometres. Infinite for a line of one point. */
export function offLineKm(line: LatLng[], p: LatLng): number {
  return projectOntoRoute(p, line)?.offRouteKm ?? Number.POSITIVE_INFINITY
}

/**
 * The track pointing the way the day is driven.
 *
 * A recorded track has a direction, and it is whichever way the person who recorded it
 * happened to drive. Half of Norway's scenic routes are published southbound. Reversed
 * where the day's last stop comes before its first, so everything downstream can treat a
 * higher index as "further along the drive".
 */
export function orient(track: LatLng[], stops: LatLng[]): LatLng[] {
  if (track.length < 2 || stops.length < 2) return track
  const start = nearestIndex(track, stops[0])
  const end = nearestIndex(track, stops[stops.length - 1])
  return end < start ? [...track].reverse() : track
}

/**
 * Where each stop sits on the track, as an index.
 *
 * Forced not to go backwards. A stop nowhere near the track still gets its nearest point,
 * and on a track that doubles back that point can land before the previous stop's —
 * which would put a via on the wrong leg and send the day round the loop twice.
 */
export function stopIndices(track: LatLng[], stops: LatLng[]): number[] {
  let floor = 0
  return stops.map(stop => {
    const at = Math.max(floor, nearestIndex(track, stop))
    floor = at
    return at
  })
}

/** The leg an anchor belongs to: the last stop it comes after. */
function legFor(anchor: number, stopIdx: number[]): number {
  let leg = 0
  for (let k = 0; k + 1 < stopIdx.length; k++) if (stopIdx[k] <= anchor) leg = k
  return leg
}

/** The stops with the anchors threaded in between, in the order they are driven. */
function waypointsFor(stops: LatLng[], anchors: number[], track: LatLng[], stopIdx: number[]): LatLng[] {
  const out: LatLng[] = []
  for (let k = 0; k < stops.length; k++) {
    out.push(stops[k])
    if (k + 1 >= stops.length) continue
    for (const anchor of anchors) if (legFor(anchor, stopIdx) === k) out.push(track[anchor])
  }
  return out
}

/**
 * The point of the track the road misses by the most — among the ones worth fixing.
 *
 * Points already anchored are skipped because the router is going through them, and
 * points hard against a stop or an existing via are skipped because a via there would
 * buy nothing. What is left is the miss the next round can actually close.
 */
function worstMiss(
  track: LatLng[],
  road: LatLng[],
  span: { from: number; to: number },
  anchors: number[],
  stops: LatLng[],
): { index: number; km: number } | null {
  const taken = new Set(anchors)
  let best: { index: number; km: number } | null = null
  for (let i = span.from; i <= span.to; i++) {
    if (taken.has(i)) continue
    const point = track[i]
    if (stops.some(s => haversineKm(s, point) < MIN_GAP_KM)) continue
    if (anchors.some(a => haversineKm(track[a], point) < MIN_GAP_KM)) continue
    const km = offLineKm(road, point)
    if (!Number.isFinite(km)) continue
    if (!best || km > best.km) best = { index: i, km }
  }
  return best
}

export interface TrackPlanInput {
  /** The track's points, as stored. */
  track: LatLng[]
  /** The day's stops, in driving order. */
  stops: LatLng[]
  /** Routes through the given waypoints and answers with the road it drew. */
  route: (waypoints: LatLng[]) => Promise<LatLng[]>
  options?: FollowTrackOptions
  /** Called after each round, so a dialog can say how far it has got. */
  onRound?: (round: number, strayKm: number) => void
  signal?: AbortSignal
}

/**
 * How much of a day a track has anything to say about.
 *
 * A trip full of imported tracks needs an order to offer them in, and "how far this one
 * runs from that drive" is the answer — measured from the stops rather than from the
 * routed line, so it holds for a day that has not routed yet.
 */
export function trackGapKm(track: LatLng[], stops: LatLng[]): number {
  if (!track.length || !stops.length) return Number.POSITIVE_INFINITY
  const line = thin(track, MEASURE_POINTS)
  if (line.length < 2) return haversineKm(line[0], stops[0])
  let best = Number.POSITIVE_INFINITY
  for (const stop of stops) best = Math.min(best, offLineKm(line, stop))
  return best
}

/**
 * Vias that pull a day's drive onto a track.
 *
 * Routes the whole day per round rather than one leg at a time: the day is a single
 * request to begin with, and asking per leg would multiply every round by the number of
 * legs against a host that answers one request a second.
 */
export async function planTrack({
  track,
  stops,
  route,
  options = {},
  onRound,
  signal,
}: TrackPlanInput): Promise<FollowTrackPlan> {
  const toleranceKm = options.toleranceKm ?? 1
  const maxVias = options.maxVias ?? 12
  const maxRounds = options.maxRounds ?? 10
  if (track.length < 2 || stops.length < 2) return EMPTY_PLAN

  const measured = orient(thin(track, MEASURE_POINTS), stops)
  const stopIdx = stopIndices(measured, stops)
  const span = { from: stopIdx[0], to: stopIdx[stopIdx.length - 1] }
  // A track the day only touches at one point is a track for some other day.
  if (span.to - span.from < 2) return EMPTY_PLAN

  // The legs the track runs along. Read off the stops, not off the anchors, so applying
  // a track twice clears what the first pass laid down instead of stacking on it — and
  // so a track that already fits still says which legs it owns.
  const legs: number[] = []
  for (let k = 0; k + 1 < stops.length; k++) {
    if (stopIdx[k + 1] > span.from && stopIdx[k] < span.to) legs.push(k)
  }

  const anchors: number[] = []
  let strayKm = 0
  let rounds = 0
  let capped = false

  for (;;) {
    if (signal?.aborted) break
    const drawn = await route(waypointsFor(stops, anchors, measured, stopIdx))
    if (drawn.length < 2) throw new Error('The router answered without a road')
    rounds += 1

    const miss = worstMiss(measured, thin(drawn, ROUTE_POINTS), span, anchors, stops)
    // No candidate left to fix is as finished as being inside the tolerance: everything
    // that remains sits against a stop or against a via that is already there.
    strayKm = miss?.km ?? 0
    onRound?.(rounds, strayKm)
    if (!miss || miss.km <= toleranceKm) break
    if (anchors.length >= maxVias || rounds >= maxRounds) {
      capped = true
      break
    }
    anchors.push(miss.index)
    anchors.sort((a, b) => a - b)
  }

  return {
    vias: anchors.map(i => ({
      after_order_index: legFor(i, stopIdx),
      lat: measured[i].lat,
      lng: measured[i].lng,
    })),
    legs,
    strayKm,
    rounds,
    capped,
  }
}
