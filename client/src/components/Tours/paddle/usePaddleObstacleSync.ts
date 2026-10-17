import { measuredRouteLengthM, relateObstaclesToRoute, type PaddleCoverageState } from '@trek/shared';
import { useEffect, useMemo, useState } from 'react';
import {
  PaddleObstaclesOfflineError,
  paddleObstacleRepo,
  tilesAround,
  type PaddleObstaclesAround,
  type Tile,
} from '../../../repo/paddleObstacleRepo';
import {
  clearPaddleObstacles,
  publishPaddleObstacles,
  type PaddleObstacleStatus,
} from '../../../store/paddleObstacleStore';

type Line = readonly (readonly [number, number])[];

/** The area a line asks for, as tiles snapped outward to a 0.05 degree grid, so moving a point a little asks nothing new. */
function tilesOf(line: Line): Tile[] {
  const snap = (value: number, outward: 'down' | 'up') =>
    (outward === 'down' ? Math.floor(value * 20) : Math.ceil(value * 20)) / 20;
  return tilesAround(line).map((tile) => ({
    south: snap(tile.south, 'down'),
    west: snap(tile.west, 'down'),
    north: snap(tile.north, 'up'),
    east: snap(tile.east, 'up'),
  }));
}

interface Loaded {
  key: string;
  status: PaddleObstacleStatus;
  data: PaddleObstaclesAround | null;
}

/**
 * PAD-05B: keeps the obstacle store in step with the paddle tour open in the
 * planner. It asks for the area around the line (again only when the line
 * leaves it), relates what came back to the line as it is now, and publishes
 * both; with no paddle tour open the store is emptied.
 */
export function usePaddleObstacleSync(line: Line | null, active: boolean) {
  const key = active && line && line.length >= 2 ? JSON.stringify(tilesOf(line)) : null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    paddleObstacleRepo
      .inTiles(JSON.parse(key) as Tile[], controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setLoaded({ key, status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ key, status: err instanceof PaddleObstaclesOfflineError ? 'offline' : 'error', data: null });
      });
    return () => controller.abort();
  }, [key]);

  const current = loaded && loaded.key === key ? loaded : null;
  const related = useMemo(
    () => (current?.data && line ? relateObstaclesToRoute(line, current.data.features) : []),
    [current, line]
  );
  const routeLengthM = useMemo(() => (line ? measuredRouteLengthM(line) : 0), [line]);

  useEffect(() => {
    if (!key) {
      clearPaddleObstacles();
      return;
    }
    const coverage: PaddleCoverageState = current?.data?.coverage ?? 'none';
    publishPaddleObstacles({
      status: current?.status ?? 'loading',
      features: current?.data?.features ?? [],
      related,
      routeLengthM,
      coverage,
      regions: current?.data?.regions ?? [],
      truncated: current?.data?.truncated ?? false,
    });
  }, [current, key, related, routeLengthM]);

  useEffect(() => () => clearPaddleObstacles(), []);
}
