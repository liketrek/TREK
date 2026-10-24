// FE-STORE-PADDLE-001 to FE-STORE-PADDLE-004: the camera focus of the paddle obstacle store (PAD-06). A click in
// the checklist selects an object and frames it with the other parts of its lock; an area is framed as asked; each
// focus is numbered so the newest wins; publishing new objects keeps it, clearing the store drops it.
import type { PaddleFeature, PaddleGeometry } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearPaddleObstacles,
  focusPaddleArea,
  focusPaddleObstacle,
  publishPaddleObstacles,
  usePaddleObstacleStore,
} from './paddleObstacleStore';

const point = (lng: number, lat: number): PaddleGeometry => ({ type: 'Point', coordinates: [lng, lat] });

function feature(ref: string, geometry: PaddleGeometry, groupKey: string | null = null): PaddleFeature {
  return {
    ref,
    kind: 'lock',
    group_key: groupKey,
    name: null,
    geometry,
    tags: {},
    tag_hash: ref,
    region_id: 'oberpfalz',
  };
}

const LOCK = [
  feature('node/3', point(12.001, 49.2), 'lock:node/3'),
  feature('node/4', point(12.003, 49.201), 'lock:node/3'),
];
const WEIR = feature('node/9', point(12.01, 49.21));

function publish(features: PaddleFeature[]): void {
  publishPaddleObstacles({
    status: 'ready',
    features,
    related: [],
    routeLengthM: 1000,
    coverage: 'covered',
    regions: [],
    truncated: false,
  });
}

beforeEach(() => {
  clearPaddleObstacles();
});

describe('paddleObstacleStore focus', () => {
  it('FE-STORE-PADDLE-001: focusing a lock part selects it and frames every part with a margin', () => {
    publish([...LOCK, WEIR]);
    expect(focusPaddleObstacle('node/4')).toBe(true);
    const { selectedRef, focus } = usePaddleObstacleStore.getState();
    expect(selectedRef).toBe('node/4');
    expect(focus?.seq).toBe(1);
    const [[south, west], [north, east]] = focus?.points ?? [
      [0, 0],
      [0, 0],
    ];
    expect(south).toBeCloseTo(49.2 - 0.0015, 6);
    expect(west).toBeCloseTo(12.001 - 0.0015, 6);
    expect(north).toBeCloseTo(49.201 + 0.0015, 6);
    expect(east).toBeCloseTo(12.003 + 0.0015, 6);
  });

  it('FE-STORE-PADDLE-002: an object the store does not hold is not focused', () => {
    publish([WEIR]);
    expect(focusPaddleObstacle('node/404')).toBe(false);
    expect(usePaddleObstacleStore.getState()).toMatchObject({ selectedRef: null, focus: null });
  });

  it('FE-STORE-PADDLE-003: an area is framed as asked, each focus numbered after the last, none for no points', () => {
    focusPaddleArea([[49.2, 12.005]]);
    focusPaddleArea([]);
    focusPaddleArea([
      [49.2, 12],
      [49.3, 12.1],
    ]);
    const { focus } = usePaddleObstacleStore.getState();
    expect(focus?.seq).toBe(2);
    expect(focus?.points[1]?.[0]).toBeCloseTo(49.3015, 6);
  });

  it('FE-STORE-PADDLE-004: publishing new objects keeps the focus, clearing the store drops it', () => {
    publish([WEIR]);
    focusPaddleObstacle('node/9');
    publish([WEIR, ...LOCK]);
    expect(usePaddleObstacleStore.getState().focus?.seq).toBe(1);
    clearPaddleObstacles();
    expect(usePaddleObstacleStore.getState().focus).toBeNull();
  });
});
