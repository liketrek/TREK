import { formatDurationShort } from './roadtripModel'
import { ALT_PRIMARY, ALT_SECONDARY, ALT_LABEL_PRIMARY_BG, ALT_LABEL_SECONDARY_BG } from './alternativeColors'
import type { RouteAlternative, RouteEngine } from '../Map/RouteCalculator'
import type { LegAlternatives } from './useRouteAlternatives'

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
  /**
   * True when this route's figures came from the other engine, so they cannot be read
   * against the rest of the list. Nothing derived from a comparison is filled in for
   * such a route: it takes no part in electing the quickest and its
   * `slowerThanQuickest` stays zero.
   */
  otherEngine: boolean
  /** The engine that priced this route, which names the other engine when it is one. */
  engine: RouteEngine
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
 *
 * `railEngine` is the engine the rail drives this leg with. Only routes that engine
 * priced can be read against the road being driven; every other one is marked as the
 * other engine's and takes part in no comparison.
 */
export function buildAlternativeOverlays(
  routes: (RouteAlternative & { current?: boolean; direct?: boolean })[] | undefined,
  labels: { fastest: string; current: string; noMotorway: string; noToll: string; noFerry: string },
  railEngine: RouteEngine = 'osrm',
): AlternativeOverlay[] {
  if (!routes?.length) return []
  // A single answer is not a choice; drawing it would just double the route already there.
  if (routes.length < 2) return []

  // The quickest of what came back, which is what Apple calls out — not necessarily the
  // first entry, since the road currently driven is put at the top.
  //
  // Only among the routes the rail's own engine priced, the current road included. An
  // offer from another engine runs on a speed model that differs by up to a seventh
  // either way depending on the region, so letting it into this election decides which
  // road is fastest and how much slower every other road is called on nothing but that
  // gap. On a Spanish motorway leg that is enough to crown a toll-free B-road detour and
  // label the motorway somebody is actually driving as the slower way round.
  //
  // Index 0 is the fallback rather than -1: the first entry is the road being driven
  // when there is one and the router's own pick otherwise, so if a list ever held
  // nothing the rail's engine priced, that is still the one to call primary.
  const engineOf = (route: RouteAlternative): RouteEngine => route.engine ?? 'osrm'
  const comparable = routes.map((r, i) => (engineOf(r) === railEngine ? i : -1)).filter(i => i >= 0)
  const quickest = comparable.length
    ? comparable.reduce((best, i) => (routes[i].duration < routes[best].duration ? i : best), comparable[0])
    : 0
  const anyCurrent = routes.some(r => r.current)

  return routes.map((route, index) => {
    const others = routes.filter((_, i) => i !== index).map(r => r.coordinates)
    const at = mostDistinctPoint(route.coordinates, others)
    // Blue is the road you are on, which the picker always lists as the current one,
    // however slow it is. Only a list without it (none is built that way any more) falls
    // back to the quickest. Everything else is the pale blue of an offer.
    const primary = anyCurrent ? !!route.current : index === quickest
    const otherEngine = engineOf(route) !== railEngine
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
            : route.avoids === 'ferry'
              ? labels.noFerry
              : index === quickest ? labels.fastest : '',
      duration: route.duration,
      distance: route.distance,
      // Left at zero for a route the other engine priced, and for every route when
      // that is the only thing to measure against. The bar reads a zero as "no
      // difference worth printing" and falls back to naming what the road is, which
      // for these is always the class left out of it.
      slowerThanQuickest: otherEngine || engineOf(routes[quickest]) !== railEngine
        ? 0
        : Math.max(0, Math.round(route.duration - routes[quickest].duration)),
      otherEngine,
      engine: engineOf(route),
      labelBg: primary ? ALT_LABEL_PRIMARY_BG : ALT_LABEL_SECONDARY_BG,
      at: at ?? { lat: 0, lng: 0 },
    }
  })
}

/** What a picker has to say about one leg, whichever shell draws it. */
export type AlternativesPhase = 'loading' | 'failed' | 'onlyOne' | 'choose'

/**
 * Which of its four states a picker is in.
 *
 * Both bars branch on this, so the desk and the phone cannot disagree about when a leg has
 * a choice. Asking wins over a failure, because a new question replaces the old answer
 * and its error with it. A failure wins over an empty list, so a router that will not
 * answer is never read as a leg with only one sensible way. Fewer than two overlays is
 * that single way: `buildAlternativeOverlays` draws nothing for one answer, and one road
 * is not a choice.
 */
export function alternativesPhase(
  open: Pick<LegAlternatives, 'loading' | 'error'>,
  overlays: readonly AlternativeOverlay[],
): AlternativesPhase {
  if (open.loading) return 'loading'
  if (open.error) return 'failed'
  return overlays.length < 2 ? 'onlyOne' : 'choose'
}

/**
 * The second line an offer is listed with: what this way is, or else how much slower.
 *
 * Its own note wins, for the reason the note exists: a road offered because the motorway
 * was left out of it is taken for that, not for its minutes. Without one the line is the
 * difference to the quickest, worded by the caller (a translation this module stays free
 * of). The desk bar's docstring tells what two copies of one figure once did, the driven
 * road called "Fastest" beside an offer called quicker, so both bars read this line here
 * instead of each keeping its own.
 */
export function alternativeSubline(alt: AlternativeOverlay, slower: (time: string) => string): string {
  if (alt.note) return alt.note
  // Another engine's road has no difference to the quickest, only its own time: a "0 min
  // slower" under it would read as a tie that nobody measured.
  if (alt.otherEngine) return alt.label
  return slower(formatDurationShort(alt.slowerThanQuickest))
}

/**
 * What a route another engine timed says about it, as a translation key: which engine it
 * was. Null for a route the rail's own engine timed.
 *
 * Both bars used to call every such route the avoidance router's. A leg a route provider
 * plugin drives is offered OSRM's ways, and a leg OSRM drew while the avoidance router did
 * not answer heads its list with OSRM's line, so the note named an engine that had nothing
 * to do with either. One reading for the desk and the phone.
 */
export function otherEngineNote(alt: Pick<AlternativeOverlay, 'otherEngine' | 'engine'>): string | null {
  if (!alt.otherEngine) return null
  if (alt.engine === 'valhalla') return 'roadtrip.alt.otherEngine'
  // No offer comes from a plugin: only the rail's own line on a plugin leg is one's.
  return alt.engine === 'osrm' ? 'roadtrip.alt.otherEngineStandard' : null
}

/**
 * Whether a choice is being checked and saved, so neither bar takes another one meanwhile.
 * One reading for the desk and the phone, which both stand still while it runs.
 */
export function alternativesBusy(open: Pick<LegAlternatives, 'proving'> | null | undefined): boolean {
  return open?.proving != null
}
