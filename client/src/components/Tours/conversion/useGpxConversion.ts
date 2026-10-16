import type { TourMaxHikingDifficulty } from '@trek/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { freeLegBetween } from '../planner/tourRouteActions';
import { routeWalkingTour } from '../planner/tourRouting';
import { paddleFieldsOf } from '../planner/usePaddleFields';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { compareRoutes, deriveControlPoints, type RouteComparison, type TrackPoint } from './gpxConversion';

/** The grade a planned version routes with when the import carries none: the paths a T3 walk may take. */
const DEFAULT_DIFFICULTY: TourMaxHikingDifficulty = 3;

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
}

const IDLE: ConversionState = { placeId: null, status: 'idle', points: [], line: null, comparison: null, error: null };

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
    const legs = paddle
      ? points.map((point, index) => ({
          ...point,
          fixedLeg: index < points.length - 1 ? freeLegBetween(point, points[index + 1]) : null,
        }))
      : points;
    const routed = await routeWalkingTour(legs, controller.signal, difficulty);
    if (controller.signal.aborted) return;
    if (!routed) {
      setState({ ...base, status: 'failed', error: 'routing' });
      return;
    }
    const suggestion = routed.coordinates.map(([lat, lng]) => ({ lat, lng }));
    setState({
      ...base,
      status: 'ready',
      line: routed.coordinates,
      comparison: compareRoutes(trackPoints, suggestion),
    });
  }, [difficulty, paddle, tour, track]);

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
        difficulty,
        points: current.points,
        sourcePlaceId: tour.place_id,
        inPlace: how === 'replace',
        ...(paddle ? { tourType: 'kayak' as const, paddle: paddleFieldsOf(tour) } : {}),
      });
      if (started) setState(IDLE);
      return started;
    },
    [current.points, current.status, difficulty, paddle, startDerivedTour, tour]
  );

  return useMemo(
    () => ({
      ...current,
      /** The import shown can be planned from: it has a track and the user may add tours. */
      available: tour !== null && (track?.length ?? 0) >= 2 && planner.canEdit,
      difficulty,
      /** The import is a paddle tour: its version is drawn with straight legs, not routed. */
      paddle,
      analyze,
      cancel,
      adopt,
    }),
    [adopt, analyze, cancel, current, difficulty, paddle, planner.canEdit, tour, track]
  );
}

export type GpxConversion = ReturnType<typeof useGpxConversion>;
