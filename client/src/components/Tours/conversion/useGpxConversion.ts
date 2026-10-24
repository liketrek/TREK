import type { TourMaxHikingDifficulty } from '@trek/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { freeLegBetween } from '../planner/tourRouteActions';
import { isTourRoute } from '../planner/tourRouteOutcome';
import { routeBikeTour, routeRun, routeWalkingTour } from '../planner/tourRouting';
import { paddleFieldsOf } from '../planner/usePaddleFields';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { skiChoiceOf } from '../ski/skiChoice';
import { compareRoutes, deriveControlPoints, type RouteComparison, type TrackPoint } from './gpxConversion';

/** The grade a planned version routes with when the import carries none: the paths a T3 walk may take. */
const DEFAULT_DIFFICULTY: TourMaxHikingDifficulty = 3;
/** Where a hike without a grade is routed once the default found no way: a recorded T4 or T5 route needs its paths. */
const WIDEST_DIFFICULTY: TourMaxHikingDifficulty = 6;

type GpxConversionStatus = 'idle' | 'analyzing' | 'ready' | 'failed';

interface ConversionState {
  /** The import the analysis belongs to; another import shown means it is idle again. */
  placeId: number | null;
  status: GpxConversionStatus;
  points: TrackPoint[];
  line: [number, number][] | null;
  comparison: RouteComparison | null;
  /** Why it failed: the track is too short to plan from, or the router found no way. */
  error: 'track' | 'routing' | null;
  /** The hiking grade the suggestion was routed with; null until it was. */
  routedDifficulty: TourMaxHikingDifficulty | null;
}

const IDLE: ConversionState = {
  placeId: null,
  status: 'idle',
  points: [],
  line: null,
  comparison: null,
  error: null,
  routedDifficulty: null,
};

/**
 * Planning an editable tour from an import shown in the tour planner (PR1-05A/B).
 * The analysis starts only when asked: control points from the track, a route
 * through them by the planner's own router, and how far that route strays from
 * the track. Nothing is stored. Adopting hands the points to the planner as a
 * new draft that remembers the import; only saving that draft creates a tour,
 * and the import stays as it is.
 */
export function useGpxConversion(planner: TourPlannerController) {
  const [state, setState] = useState<ConversionState>(IDLE);
  const abort = useRef<AbortController | null>(null);
  const tour = planner.mode.type === 'view-gpx' ? (planner.readOnlyGpxTour?.tour ?? null) : null;
  const track = planner.readOnlyGpxAnalysis?.routeCoordinates ?? null;
  const current = tour !== null && state.placeId === tour.place_id ? state : IDLE;
  const difficulty = (tour?.max_hiking_difficulty ?? DEFAULT_DIFFICULTY) as TourMaxHikingDifficulty;
  // A paddle import is planned as a paddle tour is: every leg drawn by hand, no router asked.
  const paddle = tour?.tour_type === 'kayak';
  // BIK-01: a bike import is planned for its profile.
  const bikeProfile = tour?.tour_type === 'bike' ? (tour.bike_profile ?? 'touring') : null;
  // RUN-01: a run import is planned as a run for its profile, at the pace it holds; a fresh
  // import holds none, so its pace is the runner's to enter.
  const runProfile = tour?.tour_type === 'run' ? (tour.run_profile ?? 'running') : null;
  // SKI-02: a ski import is planned as a ski tour of its discipline, its legs drawn as the planner draws them.
  const ski = useMemo(() => (tour?.tour_type === 'ski' ? skiChoiceOf(tour) : null), [tour]);
  const drawn = paddle || ski !== null;

  useEffect(() => () => abort.current?.abort(), []);

  const analyze = useCallback(async () => {
    if (!tour || !track) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const trackPoints = track.map(([lat, lng]) => ({ lat, lng }));
    const points = deriveControlPoints(trackPoints);
    const base = { ...IDLE, placeId: tour.place_id, points };
    if (points.length < 2) {
      setState({ ...base, status: 'failed', error: 'track' });
      return;
    }
    setState({ ...base, status: 'analyzing' });
    const legs = drawn
      ? points.map((point, index) => ({
          ...point,
          fixedLeg: index < points.length - 1 ? freeLegBetween(point, points[index + 1]) : null,
        }))
      : points;
    let routedDifficulty = difficulty;
    let routed = bikeProfile
      ? await routeBikeTour(legs, bikeProfile, controller.signal)
      : runProfile
        ? await routeRun(legs, runProfile, controller.signal)
        : await routeWalkingTour(legs, controller.signal, difficulty);
    // A recorded hike without a grade is routed with the default T3 first; when that finds no way, the
    // paths of a harder hike are allowed rather than leaving the walker with no suggestion to compare.
    if (
      !isTourRoute(routed) &&
      !controller.signal.aborted &&
      !bikeProfile &&
      !runProfile &&
      tour.tour_type === 'hike' &&
      tour.max_hiking_difficulty == null
    ) {
      routedDifficulty = WIDEST_DIFFICULTY;
      routed = await routeWalkingTour(legs, controller.signal, routedDifficulty);
    }
    if (controller.signal.aborted) return;
    if (!isTourRoute(routed)) {
      setState({ ...base, status: 'failed', error: 'routing' });
      return;
    }
    const suggestion = routed.coordinates.map(([lat, lng]) => ({ lat, lng }));
    setState({
      ...base,
      status: 'ready',
      line: routed.coordinates,
      comparison: compareRoutes(trackPoints, suggestion),
      routedDifficulty,
    });
  }, [bikeProfile, difficulty, drawn, runProfile, tour, track]);

  const cancel = useCallback(() => {
    abort.current?.abort();
    setState(IDLE);
  }, []);

  const { startDerivedTour } = planner;
  /**
   * The suggestion as a draft in the planner: the import planned over in place
   * (`replace`), or a new tour beside it. True once the planner took it.
   */
  const adopt = useCallback(
    (how: 'replace' | 'new') => {
      if (!tour || current.status !== 'ready') return false;
      const started = startDerivedTour({
        name: tour.name,
        description: tour.description ?? null,
        website: tour.website ?? null,
        difficulty: current.routedDifficulty ?? difficulty,
        points: current.points,
        sourcePlaceId: tour.place_id,
        inPlace: how === 'replace',
        revision: tour.revision,
        ...(paddle ? { tourType: 'kayak' as const, paddle: paddleFieldsOf(tour) } : {}),
        ...(bikeProfile ? { tourType: 'bike' as const, bikeProfile } : {}),
        ...(runProfile
          ? { tourType: 'run' as const, runProfile, runPaceSecondsPerKm: tour.run_pace_seconds_per_km ?? null }
          : {}),
        ...(ski ? { tourType: 'ski' as const, ski } : {}),
      });
      if (started) setState(IDLE);
      return started;
    },
    [
      bikeProfile,
      current.points,
      current.routedDifficulty,
      current.status,
      difficulty,
      paddle,
      runProfile,
      ski,
      startDerivedTour,
      tour,
    ]
  );

  return useMemo(
    () => ({
      ...current,
      /**
       * The import shown can be planned from: it has a track and the user may add tours. A ski
       * track (SKI-02) is planned as a ski tour with its legs drawn; one saved before it named a
       * discipline is offered too, and the planner asks for the discipline before it saves.
       * A ride (HOR-01) never: no router plans one, and walking it again on foot would be no ride.
       */
      available: tour !== null && tour.tour_type !== 'horse' && (track?.length ?? 0) >= 2 && planner.canEdit,
      difficulty,
      /** The import is a paddle or a ski tour: its version is drawn with straight legs, not routed. */
      paddle: drawn,
      /** SKI-02: the import is a ski track, planned as a ski tour of its discipline. */
      ski: ski !== null,
      analyze,
      cancel,
      adopt,
    }),
    [adopt, analyze, cancel, current, difficulty, drawn, planner.canEdit, ski, tour, track]
  );
}

export type GpxConversion = ReturnType<typeof useGpxConversion>;
