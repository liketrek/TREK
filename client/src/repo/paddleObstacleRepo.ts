import {
  PADDLE_OBSTACLES_MAX_SPAN_DEG,
  type PaddleCoverageRegion,
  type PaddleCoverageState,
  type PaddleFeature,
} from '@trek/shared';
import { paddleObstaclesApi } from '../api/paddleObstacles';
import { isEffectivelyOffline } from '../sync/networkMode';

export interface PaddleObstaclesAround {
  features: PaddleFeature[];
  coverage: PaddleCoverageState;
  regions: PaddleCoverageRegion[];
  truncated: boolean;
}

/** Thrown instead of asking while the app is offline, so the view can say so rather than show a failure. */
export class PaddleObstaclesOfflineError extends Error {
  constructor() {
    super('Paddle obstacles need a connection');
    this.name = 'PaddleObstaclesOfflineError';
  }
}

/** A margin around the line, in degrees, so an obstacle just off its ends is still asked for. */
const MARGIN_DEG = 0.01;
/** One request's side, a little under the server's cap. */
const TILE_DEG = PADDLE_OBSTACLES_MAX_SPAN_DEG * 0.8;

export interface Tile {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** The box around a line, with its margin, split into tiles the server takes. */
export function tilesAround(line: readonly (readonly [number, number])[]): Tile[] {
  if (line.length === 0) return [];
  let south = 90;
  let north = -90;
  let west = 180;
  let east = -180;
  for (const [lat, lng] of line) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }
  south -= MARGIN_DEG;
  north += MARGIN_DEG;
  west -= MARGIN_DEG;
  east += MARGIN_DEG;
  const tiles: Tile[] = [];
  for (let s = south; s < north; s += TILE_DEG) {
    for (let w = west; w < east; w += TILE_DEG) {
      tiles.push({ south: s, west: w, north: Math.min(north, s + TILE_DEG), east: Math.min(east, w + TILE_DEG) });
    }
  }
  return tiles;
}

const WORST: Record<PaddleCoverageState, number> = { none: 0, partial: 1, covered: 2 };

/**
 * PAD-05A/05B: the paddle objects around a route, online only. They are map
 * data read from OpenStreetMap, not trip data, so nothing is queued; offline
 * nothing is asked, and the planner says the data is out of reach rather
 * than showing a route free of obstacles.
 */
export const paddleObstacleRepo = {
  async around(line: readonly (readonly [number, number])[], signal?: AbortSignal): Promise<PaddleObstaclesAround> {
    return this.inTiles(tilesAround(line), signal);
  },

  /** The objects of these tiles, merged, with the weakest coverage among them. */
  async inTiles(tiles: readonly Tile[], signal?: AbortSignal): Promise<PaddleObstaclesAround> {
    if (isEffectivelyOffline()) throw new PaddleObstaclesOfflineError();
    const answers = await Promise.all(tiles.map((tile) => paddleObstaclesApi.inBox(tile, signal)));
    const features = new Map<string, PaddleFeature>();
    const regions = new Map<string, PaddleCoverageRegion>();
    let coverage: PaddleCoverageState = answers.length ? 'covered' : 'none';
    for (const answer of answers) {
      for (const feature of answer.features) features.set(`${feature.region_id}:${feature.ref}`, feature);
      for (const region of answer.coverage.regions) regions.set(region.id, region);
      if (WORST[answer.coverage.state] < WORST[coverage]) coverage = answer.coverage.state;
    }
    // Two regions overlap at a border: an object read from both is one object.
    const byRef = new Map<string, PaddleFeature>();
    for (const feature of features.values()) if (!byRef.has(feature.ref)) byRef.set(feature.ref, feature);
    return {
      features: [...byRef.values()],
      coverage,
      regions: [...regions.values()],
      truncated: answers.some((answer) => answer.truncated),
    };
  },
};
