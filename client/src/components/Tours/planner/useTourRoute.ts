import type {
  BikeProfile,
  HikingPreferences,
  PaddleBoatType,
  PaddleLakeStyle,
  PlannableTourType,
  RunProfile,
  TourMaxHikingDifficulty,
} from '@trek/shared';
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { randomId } from '../../../utils/randomId';
import type { SkiChoice } from '../ski/skiChoice';
import { planPaddleStep, type PaddleTourRoute } from './paddleRouting';
import { routeSkiTour, skiRouteKey, type SkiTourRoute } from './skiRouting';
import {
  normalizePlannerWaypoints,
  routeInputsKey,
  tourWaypointKey,
  type TourPlannerWaypoint,
} from './tourPlannerWaypoints';
import { isTourRoute, type TourRouteGap, type TourRouteUnreachable } from './tourRouteOutcome';
import {
  enrichTourElevations,
  rideTour,
  routeBikeTour,
  routeCityWalk,
  routeRun,
  routeWalkingTour,
  type TourElevationPoint,
  type TourRoutePart,
  type WalkFerryCrossing,
} from './tourRouting';
import type { TourPlannerStatus } from './useTourPlanner';

const ROUTE_DEBOUNCE_MS = 450;

/** What the route of a draft is planned from: its points, its type and the choices the router is asked for. */
export interface TourRouteInputs {
  tripId: number | string;
  waypoints: TourPlannerWaypoint[];
  tourType: PlannableTourType;
  maxHikingDifficulty: TourMaxHikingDifficulty;
  hikingPreferences: HikingPreferences | null;
  bikeProfile: BikeProfile;
  /** RUN-01: the profile a run is routed for. */
  runProfile: RunProfile;
  paddleBoat: PaddleBoatType | null;
  paddleLakeStyle: PaddleLakeStyle;
  /** SKI-02: a ski tour's discipline, technique and piste router options, what its legs are laid for. */
  skiChoice: SkiChoice;
  /** Raised to plan the same points again. */
  retryToken: number;
  /** The planner's error, so a point found unreachable is only named while that is the error. */
  error: string | null;
  setStatus: Dispatch<SetStateAction<TourPlannerStatus>>;
  setError: (error: string | null) => void;
  onCleared: () => void;
  /** Points the router set itself (a paddle tour's), laid in without a step of the history. */
  patchWaypoints: (next: TourPlannerWaypoint[]) => void;
}

/** A route as planned, and what it was planned for (`forKey`). */
interface PlannedRoute {
  route: [number, number][] | null;
  routeParts: TourRoutePart[] | null;
  paddleRoute: PaddleTourRoute | null;
  /** SKI-02: a ski tour's legs as the piste router answered them. */
  skiRoute: SkiTourRoute | null;
  enrichedGeometry: TourElevationPoint[] | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  /** CW-12: a city walk's crossings by boat; null where it takes none. */
  ferries: WalkFerryCrossing[] | null;
  forKey: string | null;
  /** The run it was planned in: its points with what was planned along them, its choices and the retry. */
  forRun: string | null;
}

const NO_ROUTE: PlannedRoute = {
  route: null,
  routeParts: null,
  paddleRoute: null,
  skiRoute: null,
  enrichedGeometry: null,
  distanceMeters: null,
  durationSeconds: null,
  ferries: null,
  forKey: null,
  forRun: null,
};

/**
 * A route planned whole: a paddle route without a failed leg, a ski tour too,
 * a ski tour opened as it was saved, a route on land with its heights.
 */
function routeComplete(planned: PlannedRoute): boolean {
  if (planned.paddleRoute) return planned.paddleRoute.failures.length === 0;
  if (planned.skiRoute?.saved) return true;
  if (planned.skiRoute && planned.skiRoute.problems.length > 0) return false;
  return hasCompleteElevation(planned.enrichedGeometry);
}

/** SKI-02: a saved ski tour's route, for the points and the ski choice it was saved with. */
export interface SavedSkiSeed {
  route: SkiTourRoute;
  waypointKey: string;
  skiKey: string;
}

/** SKI-02: a ski tour's route as the planner shows it, planned in this run or opened as it was saved. */
function skiPlanned(route: SkiTourRoute, plannedKey: string, runKey: string): PlannedRoute {
  return {
    route: route.coordinates,
    routeParts: route.parts,
    paddleRoute: null,
    skiRoute: route,
    enrichedGeometry: route.elevations,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    ferries: null,
    forKey: plannedKey,
    forRun: runKey,
  };
}

/** SKI-02: what a saved ski tour's route must match to be shown as it was saved. */
interface SavedSkiMatch {
  tourType: PlannableTourType;
  waypointKey: string;
  skiChoice: SkiChoice;
}

/**
 * SKI-02: a saved ski tour's route held for the run that plans its points
 * (none for a tour that opens to be planned afresh). That run takes it whether
 * it fits or not; it gets the route only for the points and the ski choice the
 * tour was saved with.
 */
function useSavedSkiSeed() {
  const savedSkiRef = useRef<SavedSkiSeed | null>(null);
  const openSavedSkiRoute = useCallback((seed: SavedSkiSeed | null) => {
    savedSkiRef.current = seed;
  }, []);
  const takeSavedSki = useCallback(({ tourType, waypointKey, skiChoice }: SavedSkiMatch) => {
    const seed = savedSkiRef.current;
    savedSkiRef.current = null;
    if (!seed || tourType !== 'ski' || seed.waypointKey !== waypointKey) return null;
    return seed.skiKey === skiRouteKey(skiChoice) ? seed.route : null;
  }, []);
  return { openSavedSkiRoute, takeSavedSki };
}

type RunRefs = [generationRef: RefObject<number>, abortRef: RefObject<AbortController | null>];

/** Any answer still on its way is stale from here on; `next` is the run that takes over, if one does. */
function interruptRuns([generationRef, abortRef]: RunRefs, next: AbortController | null = null): number {
  generationRef.current += 1;
  abortRef.current?.abort();
  abortRef.current = next;
  return generationRef.current;
}

/** A new run, stale once it is called off or another one starts. */
function startRun(refs: RunRefs) {
  const controller = new AbortController();
  const generation = interruptRuns(refs, controller);
  return { controller, stale: () => controller.signal.aborted || generation !== refs[0].current };
}

/** One planning run: what it plans from, whether it went stale, and where it writes. */
interface RouteRun {
  inputs: Omit<TourRouteInputs, 'retryToken' | 'error' | 'onCleared'>;
  plannedKey: string;
  runKey: string;
  signal: AbortSignal;
  stale: () => boolean;
  setPlanned: (next: PlannedRoute | ((current: PlannedRoute) => PlannedRoute)) => void;
  setUnreachable: (unreachable: TourRouteUnreachable | TourRouteGap | null) => void;
}

// PAD-11: a paddle tour is planned on the water by the server's router; its heights are no concern.
async function routePaddle({ inputs, plannedKey, runKey, signal, stale, setPlanned }: RouteRun) {
  const { waypoints, tripId, paddleBoat, paddleLakeStyle, setStatus, setError } = inputs;
  setStatus('routing');
  const profile = { boat: paddleBoat ?? 'kayak', lakeStyle: paddleLakeStyle } as const;
  const step = await planPaddleStep(waypoints, tripId, profile, signal, randomId);
  if (stale()) return;
  if ('points' in step) return inputs.patchWaypoints(normalizePlannerWaypoints(step.points, 'kayak'));
  const planned = step.route;
  setPlanned({
    route: planned.coordinates,
    routeParts: planned.parts,
    paddleRoute: planned,
    skiRoute: null,
    enrichedGeometry: planned.coordinates.map(([lat, lng]): [number, number, number] => [lat, lng, 0]),
    distanceMeters: planned.distanceMeters,
    durationSeconds: null,
    ferries: null,
    forKey: plannedKey,
    forRun: runKey,
  });
  const failed = planned.failures.length > 0;
  setStatus(failed ? 'routing-failed' : 'ready');
  setError(failed ? 'paddle-route' : null);
}

/**
 * A route on land for the type of the draft: a bike tour and a run for their
 * profile, a city walk, a hike within its limit, and a ride (HOR-01) put
 * together from its sections, never routed.
 */
async function routeLand(inputs: RouteRun['inputs'], signal: AbortSignal) {
  const { waypoints, tourType, bikeProfile, runProfile, maxHikingDifficulty, hikingPreferences } = inputs;
  if (tourType === 'horse') return rideTour(waypoints);
  if (tourType === 'bike') return await routeBikeTour(waypoints, bikeProfile, signal);
  if (tourType === 'run') return await routeRun(waypoints, runProfile, signal);
  if (tourType === 'walk') return await routeCityWalk(waypoints, signal);
  return await routeWalkingTour(waypoints, signal, maxHikingDifficulty, hikingPreferences);
}

// A hike, a run, a city walk, a bike tour or a ride on land, then the heights along it.
async function routeOnLand({ inputs, plannedKey, runKey, signal, stale, setPlanned, setUnreachable }: RouteRun) {
  const { setStatus, setError } = inputs;
  setStatus('routing');
  const routed = await routeLand(inputs, signal);
  if (stale()) return;
  if (!isTourRoute(routed)) {
    // A failure keeps the route planned before; it no longer stands for these points (CW-12: no way at all is a gap).
    setUnreachable(routed);
    setStatus('routing-failed');
    setError(!routed ? 'routing' : 'gap' in routed ? 'walk-gap' : 'unreachable');
    return;
  }
  setUnreachable(null);
  setPlanned({
    route: routed.coordinates,
    routeParts: routed.parts,
    paddleRoute: null,
    skiRoute: null,
    enrichedGeometry: null,
    distanceMeters: routed.distanceMeters,
    durationSeconds: routed.durationSeconds,
    ferries: routed.ferries ?? null,
    forKey: plannedKey,
    forRun: runKey,
  });
  setStatus('enriching-elevation');

  const enriched = await enrichTourElevations(routed.coordinates, signal);
  if (stale()) return;
  if (enriched) setPlanned((current) => ({ ...current, enrichedGeometry: enriched }));
  if (!hasCompleteElevation(enriched)) {
    setStatus('elevation-failed');
    setError('elevation');
    return;
  }
  setStatus('ready');
  setError(null);
}

/**
 * Heights straight between the known ones along the line, where the elevation
 * source has none: an estimate. Before the first known height and after the
 * last, the nearest one holds. One walk along the line, however long it is.
 */
export function interpolatedHeights(points: readonly TourElevationPoint[]): [number, number, number][] | null {
  const known = points.flatMap((point, index) => (point.length === 3 && Number.isFinite(point[2]) ? [index] : []));
  if (known.length === 0) return null;
  const height = (k: number) => (points[k] as [number, number, number])[2];
  let next = 0;
  return points.map((point, index): [number, number, number] => {
    // The first known height at or after this point; past the last one, the last.
    while (next < known.length - 1 && (known[next] as number) < index) next += 1;
    const after = known[next] as number;
    const before = after <= index || next === 0 ? after : (known[next - 1] as number);
    const share = after === before ? 0 : (index - before) / (after - before);
    return [point[0], point[1], height(before) + (height(after) - height(before)) * share];
  });
}

// SKI-02: a ski tour on the piste router's legs; heights from the piste data where it has them all, else the terrain.
async function routeSki({ inputs, plannedKey, runKey, signal, stale, setPlanned }: RouteRun) {
  const { waypoints, tripId, skiChoice, setStatus, setError } = inputs;
  setStatus('routing');
  const planned = await routeSkiTour(waypoints, skiChoice, tripId, signal);
  if (stale()) return;
  if (!planned) {
    setStatus('routing-failed');
    setError('routing');
    return;
  }
  setPlanned(skiPlanned(planned, plannedKey, runKey));
  if (!planned.elevations) {
    setStatus('enriching-elevation');
    const enriched = await enrichTourElevations(planned.coordinates, signal);
    if (stale()) return;
    // The terrain answered for some points or none: the rest are estimated between the ones known.
    const heights = hasCompleteElevation(enriched) ? enriched : interpolatedHeights(enriched ?? planned.coordinates);
    if (!heights) {
      setStatus('elevation-failed');
      setError('elevation');
      return;
    }
    setPlanned((current) => ({ ...current, enrichedGeometry: heights }));
  }
  setStatus('ready');
  setError(null);
}

/**
 * Plans a run a moment from now, on the water, on the pistes or on land; a
 * failure that is still the current run says the route could not be planned.
 * Returns the way to call it off before it starts.
 */
function scheduleRoute(run: RouteRun): () => void {
  const timer = window.setTimeout(() => {
    const { tourType } = run.inputs;
    const plan = tourType === 'kayak' ? routePaddle(run) : tourType === 'ski' ? routeSki(run) : routeOnLand(run);
    plan.catch(() => {
      if (run.stale()) return;
      run.inputs.setStatus('routing-failed');
      run.inputs.setError('routing');
    });
  }, ROUTE_DEBOUNCE_MS);
  return () => window.clearTimeout(timer);
}

/**
 * What a route was planned for: its points and the choices besides them, as a
 * route of another type or profile is not this one's. A ski tour's choice
 * counts as far as its routing lays the legs by it (nothing while they are
 * drawn straight).
 */
function plannedKeyOf(waypointKey: string, inputs: TourRouteInputs): string {
  const choices = [
    inputs.tourType,
    inputs.bikeProfile,
    inputs.runProfile,
    inputs.maxHikingDifficulty,
    inputs.hikingPreferences,
    inputs.paddleBoat,
    inputs.paddleLakeStyle,
    skiRouteKey(inputs.skiChoice),
  ];
  return `${waypointKey}#${JSON.stringify(choices)}`;
}

/**
 * The route of the planner's draft, planned again a moment after its points
 * or its choices change: a hike on foot within its limit, a bike tour and a
 * run for their profile (BIK-01, RUN-01), a paddle tour on the water by the
 * server's router, a ride put together from its horse route sections and
 * manual legs (HOR-01), a ski tour on the piste router (SKI-02). Every tour on
 * land then gets its heights; a later
 * change makes an answer still on its way stale, and a failure keeps the last
 * route that was planned.
 */
export function useTourRoute(inputs: TourRouteInputs) {
  const {
    tripId,
    waypoints,
    tourType,
    maxHikingDifficulty,
    hikingPreferences,
    bikeProfile,
    runProfile,
    paddleBoat,
    paddleLakeStyle,
    skiChoice,
    retryToken,
    error,
    setStatus,
    setError,
    onCleared,
    patchWaypoints,
  } = inputs;
  const [planned, setPlanned] = useState<PlannedRoute>(NO_ROUTE);
  // A point no way of the tour's type reaches, and how far off the router would have bound it; or a walk's leg no way joins.
  const [unreachable, setUnreachable] = useState<TourRouteUnreachable | TourRouteGap | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const { openSavedSkiRoute, takeSavedSki } = useSavedSkiSeed();

  /** Any answer still on its way is stale from here on. */
  const interruptRouting = useCallback(() => void interruptRuns([generationRef, abortRef]), []);

  /** No route at all, as for an empty draft. */
  const clearRoute = useCallback(() => setPlanned(NO_ROUTE), []);

  const waypointKey = useMemo(() => tourWaypointKey(waypoints), [waypoints]);
  const plannedKey = plannedKeyOf(waypointKey, inputs);
  // CW-02, CW-03: a station's own fields and the keys a save answered are no part of what a route is planned from,
  // so a change to them alone plans nothing again.
  const routeInputs = useMemo(() => routeInputsKey(waypoints), [waypoints]);
  const runKey = `${plannedKey}#${routeInputs}#${retryToken}`;
  // The points as they are when a run starts, their station fields included, read without making them a reason to run.
  const currentPoints = useEffectEvent(() => waypoints);
  // The route shown was planned whole for exactly this run, so a change that leaves it as it is plans nothing again.
  const routeStands = useEffectEvent(() => planned.forRun === runKey && routeComplete(planned));
  // SKI-02: a saved ski tour opened as it was saved, its line, time and build shown until something of it changes.
  const takeSavedSkiRoute = useEffectEvent(() => {
    const route = takeSavedSki({ tourType, waypointKey, skiChoice });
    if (!route) return false;
    setUnreachable(null);
    setPlanned(skiPlanned(route, plannedKey, runKey));
    setStatus('ready');
    setError(null);
    return true;
  });

  useEffect(() => {
    const points = currentPoints();
    if (points.length < 2) {
      interruptRouting();
      setStatus(points.length === 0 ? 'empty' : 'dirty');
      clearRoute();
      onCleared();
      setError(null);
      return;
    }
    if (takeSavedSkiRoute()) return;
    if (routeStands()) {
      setStatus((current) => (current === 'dirty' ? 'ready' : current));
      return;
    }

    const { controller, stale } = startRun([generationRef, abortRef]);
    const run: RouteRun = {
      inputs: {
        tripId,
        waypoints: points,
        tourType,
        maxHikingDifficulty,
        hikingPreferences,
        bikeProfile,
        runProfile,
        paddleBoat,
        paddleLakeStyle,
        skiChoice,
        setStatus,
        setError,
        patchWaypoints,
      },
      plannedKey,
      runKey,
      signal: controller.signal,
      stale,
      setPlanned,
      setUnreachable,
    };

    const cancelTimer = scheduleRoute(run);
    return () => {
      cancelTimer();
      controller.abort();
    };
  }, [
    bikeProfile,
    clearRoute,
    hikingPreferences,
    interruptRouting,
    maxHikingDifficulty,
    onCleared,
    paddleBoat,
    paddleLakeStyle,
    patchWaypoints,
    plannedKey,
    retryToken,
    routeInputs,
    runKey,
    runProfile,
    setError,
    setStatus,
    skiChoice,
    tourType,
    tripId,
  ]);

  const { forKey, forRun: _run, ...shown } = planned;
  return {
    ...shown,
    /** The route shown was planned for these points and these choices. */
    routeCurrent: forKey === plannedKey,
    unreachable: error === 'unreachable' && unreachable && 'unreachable' in unreachable ? unreachable : null,
    /** CW-12: the leg of a city walk no way joins, while that is the error. */
    walkGap: error === 'walk-gap' && unreachable && 'gap' in unreachable ? unreachable.gap : null,
    interruptRouting,
    clearRoute,
    openSavedSkiRoute,
  };
}

export function hasCompleteElevation(points: TourElevationPoint[] | null): points is [number, number, number][] {
  return !!points && points.every((point) => point.length === 3 && Number.isFinite(point[2]));
}
