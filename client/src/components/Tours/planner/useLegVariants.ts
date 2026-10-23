import {
  hikingCosting,
  type HikingPreferences,
  type PlannableTourType,
  type TourMaxHikingDifficulty,
} from '@trek/shared';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CostingOptions } from '../../Map/valhallaRoute';
import { pinAlternative } from '../../Roadtrip/alternativePins';
import { askOtherWays, routeSection, type OtherWaysAnswer } from './legVariantRouting';
import {
  comparedLegOf,
  currentVariantOf,
  isComparableLeg,
  type ComparedLeg,
  type LegVariant,
  type LegVariantKey,
} from './legVariants';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import type { TourElevationPoint } from './tourRouting';
import { useAppliedWayHint } from './useAppliedWayHint';

/** Why the last choice changed nothing: the router does not keep to it, it did not answer, or the section changed meanwhile. */
type LegVariantNotice = 'notHeld' | 'failed' | 'stale';

/** One comparison asked: its section as it stood, and the way it took then. */
interface Request {
  token: number;
  leg: ComparedLeg;
  current: LegVariant;
}

/** What the open comparison shows: its section, where the answer stands, the ways and the choice. */
export interface LegComparison {
  leg: ComparedLeg;
  phase: 'loading' | OtherWaysAnswer['phase'];
  variants: LegVariant[];
  selected: LegVariantKey | null;
  /** True while a choice is checked against the router before it is written. */
  proving: boolean;
  notice: LegVariantNotice | null;
}

export interface LegVariantsOptions {
  waypoints: TourPlannerWaypoint[];
  route: [number, number][] | null;
  enrichedGeometry: TourElevationPoint[] | null;
  /** The route drawn was planned for these points and choices. */
  routeCurrent: boolean;
  tourType: PlannableTourType;
  maxHikingDifficulty: TourMaxHikingDifficulty;
  hikingPreferences: HikingPreferences | null;
  /** Sets the shaping points that hold a way, as one step of the history; their ids, or null when refused. */
  insertShapingPoints: (
    afterId: string,
    beforeId: string,
    spots: ReadonlyArray<{ lat: number; lng: number }>
  ) => string[] | null;
  undo: () => void;
  /** Whether the route may change now: the permission held and no save under way. */
  mayEdit: () => boolean;
}

/**
 * A checked choice written into the tour, held by its pins as one step of the
 * history. Every way offered leaves the router's own (see `offeredVariants`),
 * so a held one always has a pin. `stale` when the section is another one by
 * now, so nothing lands where it was not asked.
 */
function writeChoice(
  leg: ComparedLeg,
  pins: ReadonlyArray<{ lat: number; lng: number }>,
  { options, costing }: { options: LegVariantsOptions; costing: CostingOptions }
): 'written' | 'stale' {
  if (comparedLegOf(options.waypoints, leg.fromId, options.tourType, costing)?.key !== leg.key) return 'stale';
  return options.insertShapingPoints(leg.fromId, leg.toId, pins) ? 'written' : 'stale';
}

const sameRequest = <T extends { token: number }>(value: T | null, request: Request | null): value is T =>
  !!value && !!request && value.token === request.token;

/**
 * RTE-02: other ways for one routed section of a hike, compared and taken on
 * purpose. The section and the rules it is routed under are fixed when it is
 * asked; once the tour makes it another section (a point moved, one set in
 * between, another limit), the comparison closes, so an answer worked out for
 * one section never lands in another. Showing and closing change nothing; a
 * choice is checked against the router and held by shaping points as one step
 * of the history, or the section stays as it was and the card says why.
 */
export function useLegVariants(options: LegVariantsOptions) {
  const { waypoints, route, enrichedGeometry, routeCurrent, tourType, maxHikingDifficulty, hikingPreferences } =
    options;
  const costing = useMemo(
    () => hikingCosting(maxHikingDifficulty, hikingPreferences),
    [hikingPreferences, maxHikingDifficulty]
  );
  const [request, setRequest] = useState<Request | null>(null);
  const [answer, setAnswer] = useState<(OtherWaysAnswer & { token: number }) | null>(null);
  const [choice, setChoice] = useState<{ token: number; key: LegVariantKey } | null>(null);
  const [proof, setProof] = useState<{ token: number; state: 'proving' | LegVariantNotice } | null>(null);
  const [hovered, setHovered] = useState<LegVariantKey | null>(null);
  const tokenRef = useRef(0);
  // The open comparison's own signal: it ends the questions and a check of a choice alike.
  const askRef = useRef<AbortController | null>(null);
  // The latest of what a choice is written into, read after the router answered.
  const latest = useRef({ options, costing });
  useLayoutEffect(() => {
    latest.current = { options, costing };
  });
  const { note: noteApplied, view: appliedHint } = useAppliedWayHint(waypoints, options.undo);

  // The section changed under the comparison: it is another one now, so the comparison goes.
  const legNow = request ? comparedLegOf(waypoints, request.leg.fromId, tourType, costing) : null;
  if (request && legNow?.key !== request.leg.key) setRequest(null);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    askRef.current = controller;
    void askOtherWays(request.leg, request.current, controller.signal, (found) =>
      setAnswer({ ...found, token: request.token })
    );
    return () => controller.abort();
  }, [request]);

  const canCompare = useCallback(
    (id: string) => {
      const index = waypoints.findIndex((point) => point.id === id);
      return routeCurrent && !!route && isComparableLeg(waypoints, index, tourType);
    },
    [route, routeCurrent, tourType, waypoints]
  );

  const compare = useCallback(
    (id: string) => {
      const leg = comparedLegOf(waypoints, id, tourType, costing);
      const index = waypoints.findIndex((point) => point.id === id);
      const current = routeCurrent ? currentVariantOf(waypoints, index, route, enrichedGeometry) : null;
      if (!leg || !current) return;
      tokenRef.current += 1;
      setHovered(null);
      setRequest({ token: tokenRef.current, leg, current });
    },
    [costing, enrichedGeometry, route, routeCurrent, tourType, waypoints]
  );

  const close = useCallback(() => {
    setRequest(null);
    setHovered(null);
  }, []);

  const select = useCallback(
    (key: LegVariantKey) => {
      if (request) setChoice({ token: request.token, key });
    },
    [request]
  );

  // The way taken now as the route has it at this moment, its heights included once they are in.
  const liveCurrent = useMemo(() => {
    if (!request) return null;
    const index = waypoints.findIndex((point) => point.id === request.leg.fromId);
    return currentVariantOf(waypoints, index, route, enrichedGeometry);
  }, [enrichedGeometry, request, route, waypoints]);

  // The way taken as it was when the comparison was asked for, read here so the memo below depends on it by name.
  const askedCurrent = request?.current ?? null;
  const comparison = useMemo((): LegComparison | null => {
    if (!request || !askedCurrent) return null;
    const found = sameRequest(answer, request) ? answer : null;
    const current = liveCurrent ?? askedCurrent;
    const checked = sameRequest(proof, request) ? proof.state : null;
    return {
      leg: request.leg,
      phase: found?.phase ?? 'loading',
      variants: (found?.variants ?? [askedCurrent]).map((variant) => (variant.current ? current : variant)),
      selected: sameRequest(choice, request) ? choice.key : null,
      proving: checked === 'proving',
      notice: checked === 'proving' ? null : checked,
    };
  }, [answer, askedCurrent, choice, liveCurrent, proof, request]);

  const apply = useCallback(async () => {
    const selected = comparison?.selected;
    const chosen = comparison?.variants.find((variant) => variant.key === selected);
    const signal = askRef.current?.signal;
    if (!request || !comparison || comparison.proving || !chosen || chosen.current || !signal) return;
    if (!latest.current.options.mayEdit()) return;
    const settle = (state: 'proving' | LegVariantNotice) => setProof({ token: request.token, state });
    settle('proving');
    try {
      const pinned = await pinAlternative({
        offer: {
          coordinates: chosen.coordinates,
          distance: chosen.distanceM,
          duration: 0,
          divergence: null,
        },
        current: { coordinates: request.current.coordinates, distance: request.current.distanceM, duration: 0 },
        route: (pins, routeSignal) => routeSection(request.leg, pins, routeSignal),
        signal,
      });
      if (signal.aborted) return;
      const before = latest.current.options.waypoints;
      const outcome = pinned.held ? writeChoice(request.leg, pinned.pins, latest.current) : 'notHeld';
      if (outcome !== 'written') {
        settle(outcome);
        return;
      }
      noteApplied(before);
      close();
    } catch {
      if (!signal.aborted) settle('failed');
    }
  }, [close, comparison, noteApplied, request]);

  const variantKeys = comparison?.variants.map((variant) => variant.key) ?? [];
  const focus = hovered && variantKeys.includes(hovered) ? hovered : (comparison?.selected ?? null);

  return { comparison, focus, canCompare, compare, select, hover: setHovered, apply, close, appliedHint };
}
