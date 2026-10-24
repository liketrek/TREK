import {
  paddleGeometryPoints,
  paddleObstacleKeyOf,
  type PaddleCoverageRegion,
  type PaddleCoverageState,
  type PaddleFeature,
  type RelatedObstacle,
} from '@trek/shared';
import { create } from 'zustand';

/** A request to move the camera onto an area, numbered so the newest one wins. */
export interface PaddleFocus {
  seq: number;
  points: [number, number][];
}

/** Whether the obstacles around the open paddle tour are there to show, and if not, why. */
export type PaddleObstacleStatus = 'idle' | 'loading' | 'ready' | 'offline' | 'error';

interface PaddleObstacleState {
  status: PaddleObstacleStatus;
  /** Every object read around the route. */
  features: PaddleFeature[];
  /** The ones on or near the route, in the order the route reaches them. */
  related: RelatedObstacle[];
  /** The length of the route the relations were measured along, in metres: what each `alongM` is a part of. */
  routeLengthM: number;
  coverage: PaddleCoverageState;
  regions: PaddleCoverageRegion[];
  truncated: boolean;
  /** The object whose card is open, by OSM reference; the map and the checklist show the same one. */
  selectedRef: string | null;
  /** Where the checklist last asked the camera to go (PAD-06): a click in the rail moves it, one on the map does not. */
  focus: PaddleFocus | null;
}

const EMPTY: PaddleObstacleState = {
  status: 'idle',
  features: [],
  related: [],
  routeLengthM: 0,
  coverage: 'none',
  regions: [],
  truncated: false,
  selectedRef: null,
  focus: null,
};

/** The margin round a focused area, in degrees: about 150 m, so an object never sits on the edge. */
const FOCUS_MARGIN_DEG = 0.0015;

/**
 * PAD-05B: the paddle obstacles of the tour open in the planner, shared by
 * the map that draws them and the rails that list them. One sync hook writes
 * it; everything else reads.
 */
export const usePaddleObstacleStore = create<PaddleObstacleState>(() => EMPTY);

export function publishPaddleObstacles(next: Omit<PaddleObstacleState, 'selectedRef' | 'focus'>): void {
  usePaddleObstacleStore.setState((state) => ({
    ...next,
    // A selection that is no longer among the objects is dropped with them.
    selectedRef: next.features.some((feature) => feature.ref === state.selectedRef) ? state.selectedRef : null,
  }));
}

export function selectPaddleObstacle(ref: string | null): void {
  usePaddleObstacleStore.setState({ selectedRef: ref });
}

export function clearPaddleObstacles(): void {
  usePaddleObstacleStore.setState(EMPTY);
}

/** The corners of the points' bounds, widened by the margin. */
function framed(points: readonly (readonly [number, number])[]): [number, number][] {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  return [
    [Math.min(...lats) - FOCUS_MARGIN_DEG, Math.min(...lngs) - FOCUS_MARGIN_DEG],
    [Math.max(...lats) + FOCUS_MARGIN_DEG, Math.max(...lngs) + FOCUS_MARGIN_DEG],
  ];
}

/** Moves the camera onto an area, the newest request winning over a search result picked before it. */
export function focusPaddleArea(points: readonly (readonly [number, number])[]): void {
  if (points.length === 0) return;
  usePaddleObstacleStore.setState((state) => ({ focus: { seq: (state.focus?.seq ?? 0) + 1, points: framed(points) } }));
}

/**
 * Selects an object and moves the camera onto it and the other parts of its
 * lock; false when the map does not hold the object (offline, or gone from the data).
 */
export function focusPaddleObstacle(ref: string): boolean {
  const { features } = usePaddleObstacleStore.getState();
  const feature = features.find((candidate) => candidate.ref === ref);
  if (!feature) return false;
  const key = paddleObstacleKeyOf(feature);
  const points = features
    .filter((candidate) => paddleObstacleKeyOf(candidate) === key)
    .flatMap((candidate) => paddleGeometryPoints(candidate.geometry));
  usePaddleObstacleStore.setState((state) => ({
    selectedRef: ref,
    focus: { seq: (state.focus?.seq ?? 0) + 1, points: framed(points) },
  }));
  return true;
}
