import {
  bikeCosting,
  hikingCosting,
  runCosting,
  TOURS_MAX_HIKING_DIFFICULTY,
  type BikeProfile,
  type HikingPreferences,
  type RunProfile,
  type SkiColourScheme,
  type SkiRunDifficulty,
  type SkiSegmentKind,
  type TourFixedLeg,
} from '@trek/shared'
import type { Waypoint } from '../../../types'
import {
  valhallaBase,
  valhallaPost,
  valhallaRun,
  valhallaRunOnFoot,
  type CostingOptions,
  type FerrySpan,
  type SearchFilter,
  type ValhallaLeg,
  type ValhallaNoPath,
  type ValhallaRun,
} from '../../Map/valhallaRoute'
import { densifyLine, lineLengthM } from './tourFixedLegs'
import { MAX_TOUR_SNAP_M, type TourRouteGap, type TourRouteUnreachable } from './tourRouteOutcome'

export interface TourRoutePart {
  coordinates: [number, number][]
  /** Drawn by hand: no router planned or checked it. */
  free: boolean
  /** PAD-03: carried over land, a portage of a paddle tour; absent on water and on a hike. */
  land?: boolean
  /**
   * PAD-11: on a routed paddle tour, a stretch the paddler should look at:
   * whitewater or a boat pass, a gap in the data the router bridged, or a leg
   * it could not plan (drawn straight, and nothing checked it). CW-12: on a
   * city walk, a crossing by boat, which is no walking.
   */
  mark?: 'rapids' | 'gap' | 'unrouted' | 'ferry'
  /** SKI-02: a stretch of a ski tour the piste router planned, coloured by what it is; `summer` a summer path. */
  ski?: { kind: SkiSegmentKind | 'summer'; difficulty: SkiRunDifficulty | null; scheme?: SkiColourScheme }
}

/**
 * CW-12: a city walk's crossing by boat, on the leg from one point to the
 * next: the leg's line, where on it the boat runs, and the boat's own length
 * and time apart from the walk to it and on from it. `accepted` once the
 * travellers took it as a ferry leg of the walk; until then the walk is not
 * saved.
 */
export interface WalkFerryCrossing {
  /** The leg, by the place along the tour of the point it starts at. */
  leg: number
  geometry: [number, number][]
  /** Each stretch of `geometry` by boat, as the points the boat leaves from and lands at, in order. */
  crossings: Array<[number, number]>
  metres: number
  /** Null where the router gave no time for the boat. */
  seconds: number | null
  walkSeconds: number
  accepted: boolean
}

export interface TourRouteResult {
  coordinates: [number, number][]
  /** The same line cut where it changes between routed and hand-drawn, for the map to tell them apart. */
  parts: TourRoutePart[]
  distanceMeters: number
  /** Null where no time is worked out at all: a ride (HOR-01). On a city walk, the walking alone (CW-12). */
  durationSeconds: number | null
  /** CW-12: a city walk's crossings by boat, in the order of its legs; absent where it takes none. */
  ferries?: WalkFerryCrossing[]
}

/** How fast a fixed leg is reckoned until the heights are in: a via ferrata climbs slowly, a free leg is walked. */
const FIXED_LEG_KM_PER_HOUR = { ferrata: 1.5, free: 4, portage: 2 } as const
/** A leg drawn by hand on a bike tour is reckoned at an easy riding pace: no router saw it. */
const FREE_LEG_RIDING_KM_PER_HOUR = 15

type LandWaypoint = Pick<Waypoint, 'lat' | 'lng'> & { fixedLeg?: TourFixedLeg | null }

/**
 * Tours deliberately bypasses the OSRM-first RouteCalculator. A waypoint whose
 * leg is fixed (a via ferrata on the tour) hands its own line over for that
 * leg; the router only plans the runs between fixed legs, one request each.
 */
export async function routeWalkingTour(
  waypoints: LandWaypoint[],
  signal?: AbortSignal,
  maxHikingDifficulty = TOURS_MAX_HIKING_DIFFICULTY,
  preferences: HikingPreferences | null = null,
): Promise<TourRouteResult | TourRouteUnreachable | null> {
  return routeOnLand(waypoints, 'walking', hikingCosting(maxHikingDifficulty, preferences), signal)
}

/**
 * CW-01, CW-12: a city walk, on foot between its stations. No hiking limit is
 * sent, so the router keeps to the ways it takes for walking anyway (T1), and
 * no route choice of a hike. Ferries are avoided: a walk is walked, and with
 * the router's default Venice was crossed on the vaporetto lines instead of
 * the bridges (the reported Piazza San Marco to Hotel Moresco walk came back
 * as 3.29 km and 37 min with 1.24 km of it on the San Tomà boat; avoided, it
 * is 2.79 km over the bridges). No station is bound to a boat line either.
 * Where no way on land exists the router still takes the ferry, and the walk
 * says so (`ferries`); where no way exists at all, the leg is named (`gap`).
 */
export async function routeCityWalk(
  waypoints: LandWaypoint[],
  signal?: AbortSignal,
): Promise<TourRouteResult | TourRouteUnreachable | TourRouteGap | null> {
  return routeOnLand(waypoints, 'walking', CITY_WALK_COSTING, signal, CITY_WALK_BINDING)
}

const CITY_WALK_COSTING: Readonly<CostingOptions> = { use_ferry: 0 }
const CITY_WALK_BINDING: Readonly<SearchFilter> = { exclude_ferry: true }

/** RUN-01, RUN-02: a run, on foot for its profile; a leg drawn by hand is kept as drawn. */
export async function routeRun(
  waypoints: LandWaypoint[],
  profile: RunProfile,
  signal?: AbortSignal,
): Promise<TourRouteResult | TourRouteUnreachable | null> {
  return routeOnLand(waypoints, 'walking', runCosting(profile), signal)
}

/** BIK-01: a bike tour, routed for its profile; a leg drawn by hand is kept as drawn. */
export async function routeBikeTour(
  waypoints: LandWaypoint[],
  profile: BikeProfile,
  signal?: AbortSignal,
): Promise<TourRouteResult | TourRouteUnreachable | null> {
  return routeOnLand(waypoints, 'cycling', bikeCosting(profile), signal)
}

/**
 * HOR-01: a ride, put together from its legs as they are: a section of a horse
 * route keeps its own line, a leg drawn by hand is sampled along its length so
 * its heights follow the ground. No router is asked, nothing between the legs
 * is filled in, and no riding time is worked out. Null while a leg has no line
 * of its own, which a ride never keeps.
 */
export function rideTour(waypoints: LandWaypoint[]): TourRouteResult | null {
  return drawnTour(waypoints)
}

/**
 * A tour put together from the lines its legs carry, with no router asked and
 * no time worked out: a ride (HOR-01) and a ski tour (SKI-02) are. A section of
 * a horse route keeps its own line; any other leg is sampled along its length
 * so its heights follow the ground. Null while a leg has no line of its own.
 */
export function drawnTour(waypoints: LandWaypoint[]): TourRouteResult | null {
  const lines: TourRoutePart[] = []
  for (const point of waypoints.slice(0, -1)) {
    const leg = point.fixedLeg
    if (!leg) return null
    const drawn = leg.geometry.map(([lat, lng]): [number, number] => [lat, lng])
    const section = leg.kind === 'horse_route'
    lines.push({ coordinates: section ? drawn : densifyLine(drawn), free: !section })
  }
  if (lines.length === 0) return null
  const coordinates = lines.flatMap((line, index) => (index === 0 ? line.coordinates : line.coordinates.slice(1)))
  const distanceMeters = lines.reduce((sum, line) => sum + lineLengthM(line.coordinates), 0)
  return { coordinates, parts: mergeParts(lines), distanceMeters, durationSeconds: null }
}

/** CW-12: the line of a leg cut where the boat runs, the crossing marked as no walking. */
function splitAtCrossings(coordinates: [number, number][], spans: readonly Pick<FerrySpan, 'from' | 'to'>[]): TourRoutePart[] {
  const parts: TourRoutePart[] = []
  let at = 0
  for (const { from, to } of spans) {
    if (from > at) parts.push({ coordinates: coordinates.slice(at, from + 1), free: false })
    parts.push({ coordinates: coordinates.slice(from, to + 1), free: false, mark: 'ferry' })
    at = to
  }
  if (at < coordinates.length - 1) parts.push({ coordinates: coordinates.slice(at), free: false })
  return parts
}

/** The length of a leg's stretches by boat, measured along its line. */
function boatMetresOf(geometry: [number, number][], crossings: ReadonlyArray<[number, number]>): number {
  return crossings.reduce((sum, [from, to]) => sum + lineLengthM(geometry.slice(from, to + 1)), 0)
}

/**
 * CW-12: the crossing of a routed leg, each of its stretches by boat kept on
 * its own, so a walk between two boats stays walking. The walk on the leg is
 * the router's time less the boat's; where the router gave the boat no time,
 * the walk is the leg's time shared out by the length walked.
 */
function crossingOf(leg: ValhallaLeg, index: number): WalkFerryCrossing | null {
  const spans = leg.ferrySpans ?? []
  if (spans.length === 0) return null
  const crossings = spans.map(({ from, to }): [number, number] => [from, to])
  const metres = spans.reduce((sum, span) => sum + span.metres, 0) || boatMetresOf(leg.coordinates, crossings)
  const seconds = spans.every((span) => span.seconds !== null)
    ? spans.reduce((sum, span) => sum + (span.seconds ?? 0), 0)
    : null
  const length = lineLengthM(leg.coordinates)
  const walkSeconds = seconds !== null
    ? Math.max(0, leg.duration - seconds)
    : length > 0 ? leg.duration * Math.max(0, 1 - metres / length) : 0
  return { leg: index, geometry: leg.coordinates, crossings, metres, seconds, walkSeconds, accepted: false }
}

/** CW-12: a ferry leg the travellers took, as the walk counts it: the boat apart from the walk. */
function acceptedCrossing(leg: Extract<TourFixedLeg, { kind: 'ferry' }>, index: number): WalkFerryCrossing {
  const geometry = leg.geometry.map(([lat, lng]): [number, number] => [lat, lng])
  const crossings = leg.crossings.map(([from, to]): [number, number] => [from, to])
  return {
    leg: index,
    geometry,
    crossings,
    metres: boatMetresOf(geometry, crossings),
    seconds: leg.minutes === null ? null : leg.minutes * 60,
    walkSeconds: leg.walk_minutes * 60,
    accepted: true,
  }
}

/**
 * CW-12: the leg of a run no way joins, found by halving the run: whichever
 * half the router still finds no way through holds it. Null where every piece
 * answers after all, where the router stops answering at all (a host that is
 * down says nothing about the way), or once the run is called off.
 */
async function gapOf(
  run: Array<Pick<Waypoint, 'lat' | 'lng'>>,
  first: number,
  ask: (points: Array<Pick<Waypoint, 'lat' | 'lng'>>) => Promise<ValhallaRun | ValhallaNoPath | null>,
  signal?: AbortSignal,
): Promise<TourRouteGap | null> {
  let low = 0
  let high = run.length - 1
  let failed = false
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    const answer = await ask(run.slice(low, middle + 1))
    if (!answer || signal?.aborted) return null
    if ('noPath' in answer) {
      high = middle
      failed = true
    } else {
      low = middle
    }
  }
  if (!failed) {
    const last = await ask(run.slice(low, high + 1))
    if (!last || !('noPath' in last)) return null
  }
  return signal?.aborted ? null : { gap: first + low }
}

// Only a walk bound off the boat lines (CW-12) names a leg no way joins; every other tour fails as before.
function routeOnLand(
  waypoints: LandWaypoint[],
  mode: 'walking' | 'cycling',
  costingOptions: Readonly<CostingOptions>,
  signal?: AbortSignal,
): Promise<TourRouteResult | TourRouteUnreachable | null>
function routeOnLand(
  waypoints: LandWaypoint[],
  mode: 'walking' | 'cycling',
  costingOptions: Readonly<CostingOptions>,
  signal: AbortSignal | undefined,
  searchFilter: Readonly<SearchFilter>,
): Promise<TourRouteResult | TourRouteUnreachable | TourRouteGap | null>
async function routeOnLand(
  waypoints: LandWaypoint[],
  mode: 'walking' | 'cycling',
  costingOptions: Readonly<CostingOptions>,
  signal?: AbortSignal,
  searchFilter: Readonly<SearchFilter> | null = null,
): Promise<TourRouteResult | TourRouteUnreachable | TourRouteGap | null> {
  const lines: TourRoutePart[] = []
  const ferries: WalkFerryCrossing[] = []
  let distanceMeters = 0
  let durationSeconds = 0
  let unreachable: TourRouteUnreachable | TourRouteGap | null = null
  // A city walk binds no point to a boat line (CW-12); no other type asks for that.
  const ask = (points: Array<Pick<Waypoint, 'lat' | 'lng'>>): Promise<ValhallaRun | ValhallaNoPath | null> => {
    const asked = points.map(({ lat, lng }) => ({ lat, lng }))
    return searchFilter
      ? valhallaRunOnFoot(asked, signal, costingOptions, searchFilter)
      : valhallaRun(asked, mode, [], signal, costingOptions)
  }
  // `first`: where the run starts along the tour, so a point it cannot reach is named by its place in the tour.
  const routeRun = async (run: Array<Pick<Waypoint, 'lat' | 'lng'>>, first: number) => {
    if (run.length < 2) return true
    const routed = await ask(run)
    if (!routed || 'noPath' in routed) {
      // Only the router's own "no way" names a leg; no answer at all stays a routing failure, with its retry.
      if (routed && !signal?.aborted) unreachable = await gapOf(run, first, ask, signal)
      return false
    }
    const far = routed.snapped.findIndex((point) => point.meters > MAX_TOUR_SNAP_M)
    if (far >= 0) {
      unreachable = { unreachable: first + far, snappedMeters: Math.round(routed.snapped[far].meters) }
      return false
    }
    const crossings = searchFilter
      ? (routed.legs ?? []).flatMap((leg, index) => crossingOf(leg, first + index) ?? [])
      : []
    lines.push(...(crossings.length
      ? splitAtCrossings(routed.total.coordinates, routed.total.ferrySpans ?? [])
      : [{ coordinates: routed.total.coordinates, free: false }]))
    ferries.push(...crossings)
    distanceMeters += routed.total.distance
    durationSeconds += routed.total.duration
      - crossings.reduce((sum, crossing) => sum + (routed.legs[crossing.leg - first]?.duration ?? 0) - crossing.walkSeconds, 0)
    return true
  }

  let run: Array<Pick<Waypoint, 'lat' | 'lng'>> = waypoints.slice(0, 1)
  let runStart = 0
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const leg = waypoints[i].fixedLeg
    if (!leg) {
      run.push(waypoints[i + 1])
      continue
    }
    // A section of a horse route is a ride's (HOR-01), which no router plans and no clock times.
    if (leg.kind === 'horse_route') return null
    if (!(await routeRun(run, runStart))) return unreachable
    if (leg.kind === 'ferry') {
      const crossing = acceptedCrossing(leg, i)
      lines.push(...splitAtCrossings(crossing.geometry, crossing.crossings.map(([from, to]) => ({ from, to }))))
      ferries.push(crossing)
      distanceMeters += lineLengthM(crossing.geometry)
      durationSeconds += crossing.walkSeconds
      run = [waypoints[i + 1]]
      runStart = i + 1
      continue
    }
    const drawn = leg.geometry.map(([lat, lng]): [number, number] => [lat, lng])
    // A hand-drawn leg is sampled along its length, so its heights follow the ground between its ends.
    const line = leg.kind === 'ferrata' ? drawn : densifyLine(drawn)
    const length = lineLengthM(line)
    const kmPerHour = mode === 'cycling' && leg.kind === 'free' ? FREE_LEG_RIDING_KM_PER_HOUR : FIXED_LEG_KM_PER_HOUR[leg.kind]
    lines.push({ coordinates: line, free: leg.kind !== 'ferrata', ...(leg.kind === 'portage' ? { land: true } : {}) })
    distanceMeters += length
    durationSeconds += (length / 1000 / kmPerHour) * 3600
    run = [waypoints[i + 1]]
    runStart = i + 1
  }
  if (!(await routeRun(run, runStart))) return unreachable
  if (lines.length === 0) return null

  // One line: each part after the first starts where the one before it ended, so its first point goes.
  const coordinates = lines.flatMap((line, index) => (index === 0 ? line.coordinates : line.coordinates.slice(1)))
  return { coordinates, parts: mergeParts(lines), distanceMeters, durationSeconds, ...(ferries.length ? { ferries } : {}) }
}

/**
 * Neighbouring parts of the same kind as one, so a run of hand-drawn legs is
 * one dotted line and a portage one line on land; a crossing by boat stays a
 * line of its own.
 */
function mergeParts(parts: TourRoutePart[]): TourRoutePart[] {
  const merged: TourRoutePart[] = []
  for (const part of parts) {
    const previous = merged[merged.length - 1]
    if (previous && previous.free === part.free && !!previous.land === !!part.land && previous.mark === part.mark) {
      previous.coordinates = [...previous.coordinates, ...part.coordinates.slice(1)]
    } else {
      merged.push({
        coordinates: [...part.coordinates],
        free: part.free,
        ...(part.land ? { land: true } : {}),
        ...(part.mark ? { mark: part.mark } : {}),
      })
    }
  }
  return merged
}

const HEIGHT_CHUNK_SIZE = 500

export type TourElevationPoint = [number, number] | [number, number, number]

type HeightResponse = {
  range_height?: unknown
}

export function parseValhallaElevation(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseElevations(data: HeightResponse, expected: number): (number | null)[] | null {
  if (!Array.isArray(data.range_height) || data.range_height.length !== expected) return null
  return data.range_height.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) return null
    return parseValhallaElevation(entry[1])
  })
}

/**
 * Ask Valhalla's independent /height stage for every routed vertex. Chunks
 * overlap by one point so full route resolution is retained without inventing
 * elevations when a host rejects a large request.
 */
export async function enrichTourElevations(
  coordinates: [number, number][],
  signal?: AbortSignal,
): Promise<TourElevationPoint[] | null> {
  const base = valhallaBase()
  if (!base || coordinates.length < 2) return null

  const elevations: (number | null)[] = Array(coordinates.length).fill(null)
  for (let offset = 0; offset < coordinates.length; offset += HEIGHT_CHUNK_SIZE - 1) {
    if (signal?.aborted) return null
    const chunk = coordinates.slice(offset, offset + HEIGHT_CHUNK_SIZE)
    if (chunk.length === 1 && offset > 0) break
    try {
      // The route came from the same host a moment ago, and the public one allows a
      // request a second: valhallaPost waits that turn, or the first height question is
      // refused and the tour cannot be saved for want of elevation.
      const response = await valhallaPost(base, 'height', {
        shape: chunk.map(([lat, lng]) => ({ lat, lon: lng })),
        range: true,
      }, signal)
      if (!response.ok) break
      const chunkElevations = parseElevations(await response.json() as HeightResponse, chunk.length)
      if (!chunkElevations) break
      chunkElevations.forEach((elevation, index) => {
        const routeIndex = offset + index
        if (offset > 0 && index === 0 && elevations[routeIndex] !== null) return
        elevations[routeIndex] = elevation
      })
    } catch {
      if (signal?.aborted) return null
      break
    }
  }

  return coordinates.map(([lat, lng], index) => {
    const elevation = elevations[index]
    return elevation === null ? [lat, lng] : [lat, lng, elevation]
  })
}
