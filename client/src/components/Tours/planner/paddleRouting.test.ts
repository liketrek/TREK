// FE-PADDLE-ROUTING-001 to FE-PADDLE-ROUTING-011: a paddle tour's route put together from the water router's legs (PAD-11).
import type { PaddleRouteLeg, PaddleRouteSegment } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paddleRouteRepo } from '../../../repo/paddleRouteRepo';
import {
  adoptChangedPoints,
  materializePaddleLegs,
  planPaddleStep,
  pruneAutoPoints,
  routePaddleTour,
  type PaddlePoint,
} from './paddleRouting';

/** The item at `i`, or a failure that names the index instead of a later undefined. */
function at<T>(list: readonly T[], i: number): T {
  const item = list[i];
  if (item === undefined) throw new Error(`nothing at ${i}`);
  return item;
}

vi.mock('../../../repo/paddleRouteRepo', () => ({ paddleRouteRepo: { plan: vi.fn(), forget: vi.fn() } }));

const KAYAK = { boat: 'kayak' as const, lakeStyle: 'direct' as const };
const A: PaddlePoint = { id: 'a', lat: 49.1, lng: 12.1 };
const B: PaddlePoint = { id: 'b', lat: 49.05, lng: 12.12 };
const C: PaddlePoint = { id: 'c', lat: 49.0, lng: 12.1 };

function segment(kind: PaddleRouteSegment['kind'], from: number, to: number, extra: Partial<PaddleRouteSegment> = {}) {
  return { kind, from, to, name: null, source: null, osm_ref: null, grade: null, ...extra };
}

/** A routed leg through five points: water, a portage round a weir, water, a lock, water. */
const WEIR_AND_LOCK: PaddleRouteLeg = {
  status: 'ok',
  geometry: [
    [49.1, 12.1],
    [49.09, 12.11],
    [49.08, 12.11],
    [49.07, 12.115],
    [49.06, 12.118],
    [49.05, 12.12],
  ],
  segments: [
    segment('water', 0, 1),
    segment('portage', 1, 2, { source: 'tagged' }),
    segment('water', 2, 3),
    segment('lock', 3, 4, { name: 'Schleuse' }),
    segment('water', 4, 5),
  ],
  distance_m: 6100,
  snapped_m: { from: 0, to: 0 },
};

const straight = (from: PaddlePoint, to: PaddlePoint, distance = 1000): PaddleRouteLeg => ({
  status: 'ok',
  geometry: [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ],
  segments: [segment('water', 0, 1)],
  distance_m: distance,
  snapped_m: { from: 0, to: 0 },
});

let ids = 0;
const newId = () => `auto-${(ids += 1)}`;

beforeEach(() => {
  ids = 0;
  vi.mocked(paddleRouteRepo.plan).mockReset();
});

describe('routePaddleTour', () => {
  it('FE-PADDLE-ROUTING-001: asks only for the legs without a line, and keeps a drawn or carried leg as it is', async () => {
    vi.mocked(paddleRouteRepo.plan).mockResolvedValue([straight(B, C, 5500)]);
    const drawn = {
      kind: 'free' as const,
      geometry: [
        [A.lat, A.lng],
        [B.lat, B.lng],
      ] as [number, number][],
    };
    const route = await routePaddleTour([{ ...A, fixedLeg: drawn }, B, C], 7, KAYAK);

    expect(vi.mocked(paddleRouteRepo.plan).mock.calls[0]?.[1]).toEqual([{ from: B, to: C }]);
    expect(route.legs[0]).toBeNull();
    expect(route.legs[1]?.status).toBe('ok');
    expect(route.parts.map((part) => [part.free, !!part.land])).toEqual([
      [true, false],
      [false, false],
    ]);
    expect(route.legLengths[1]).toBe(5500);
    expect(route.distanceMeters).toBeCloseTo(at(route.legLengths, 0) + 5500);
    expect(route.coordinates[0]).toEqual([A.lat, A.lng]);
    expect(route.coordinates[route.coordinates.length - 1]).toEqual([C.lat, C.lng]);
  });

  it('FE-PADDLE-ROUTING-002: draws a portage as land, whitewater and a boat pass amber, a gap red, and merges the rest', async () => {
    const marked: PaddleRouteLeg = {
      ...WEIR_AND_LOCK,
      segments: [
        segment('water', 0, 1),
        segment('portage', 1, 2),
        segment('rapids', 2, 3, { grade: 2 }),
        segment('pass', 3, 4),
        segment('gap', 4, 5),
      ],
    };
    vi.mocked(paddleRouteRepo.plan).mockResolvedValue([marked]);
    const route = await routePaddleTour([A, B], 7, KAYAK);
    expect(route.parts.map((part) => part.land ?? part.mark ?? 'water')).toEqual(['water', true, 'rapids', 'gap']);
    // Whitewater and the boat pass next to it are one amber line.
    expect(route.parts[2]?.coordinates).toHaveLength(3);
  });

  it('FE-PADDLE-ROUTING-003: a leg the router could not plan stays a straight unrouted stretch, counted as a failure', async () => {
    vi.mocked(paddleRouteRepo.plan).mockResolvedValue([
      straight(A, B),
      { status: 'failed', code: 'not_on_water', at: { lat: C.lat, lng: C.lng } },
    ]);
    const route = await routePaddleTour([A, B, C], 7, KAYAK);
    expect(route.failures).toEqual([{ index: 1, code: 'not_on_water', at: { lat: C.lat, lng: C.lng } }]);
    expect(route.parts[route.parts.length - 1]).toMatchObject({
      mark: 'unrouted',
      coordinates: [
        [B.lat, B.lng],
        [C.lat, C.lng],
      ],
    });
    // The straight line counts in the length, so the time does not shrink while a leg waits.
    expect(route.legLengths[1]).toBeGreaterThan(5000);
  });

  it('FE-PADDLE-ROUTING-004: a leg the answer leaves out is unrouted, never silently straight water', async () => {
    vi.mocked(paddleRouteRepo.plan).mockResolvedValue([]);
    const route = await routePaddleTour([A, B], 7, KAYAK);
    expect(route.failures).toEqual([{ index: 0, code: 'no_water_path', at: null }]);
  });

  it('FE-PADDLE-ROUTING-005: a tour with every leg drawn asks nothing', async () => {
    const carried = {
      kind: 'portage' as const,
      geometry: [
        [A.lat, A.lng],
        [B.lat, B.lng],
      ] as [number, number][],
      extra_minutes: null,
    };
    const route = await routePaddleTour([{ ...A, fixedLeg: carried }, B], 7, KAYAK);
    expect(paddleRouteRepo.plan).not.toHaveBeenCalled();
    expect(route.parts[0]?.land).toBe(true);
  });
});

describe('automatic points', () => {
  it("FE-PADDLE-ROUTING-006: sets a portage pair and a lock where the router found them, on the paddler's own leg", () => {
    const points = materializePaddleLegs([A, B], { legs: [WEIR_AND_LOCK] }, newId);
    expect(points.map((point) => point.id)).toEqual(['a', 'auto-1', 'auto-2', 'auto-3', 'b']);
    expect(points[1]).toMatchObject({ lat: 49.09, lng: 12.11, fixedLeg: { kind: 'portage', extra_minutes: null } });
    expect(points[2]).toMatchObject({ lat: 49.08, lng: 12.11 });
    expect(points[2]?.fixedLeg).toBeUndefined();
    expect(points[3]).toMatchObject({ lock: { wait_minutes: null, transit_minutes: null } });
    expect(points[1]?.auto).toEqual({
      from: { id: 'a', lat: A.lat, lng: A.lng },
      to: { id: 'b', lat: B.lat, lng: B.lng },
    });
  });

  it('FE-PADDLE-ROUTING-007: planning the same leg again keeps the ids, and a leg at an automatic point adds nothing', () => {
    const once = materializePaddleLegs([A, B], { legs: [WEIR_AND_LOCK] }, newId);
    const legs = once.slice(0, -1).map(() => WEIR_AND_LOCK);
    const twice = materializePaddleLegs(once, { legs }, newId);
    expect(twice).toEqual(once);
  });

  it('FE-PADDLE-ROUTING-008: drops the automatic points of a leg whose end moved or went, and keeps them otherwise', () => {
    const points = materializePaddleLegs([A, B, C], { legs: [WEIR_AND_LOCK, straight(B, C)] }, newId);
    expect(pruneAutoPoints(points)).toEqual(points);
    const moved = points.map((point) => (point.id === 'b' ? { ...point, lat: point.lat + 0.01 } : point));
    expect(pruneAutoPoints(moved).map((point) => point.id)).toEqual(['a', 'b', 'c']);
    const shaped = [at(points, 0), { id: 's', lat: 49.095, lng: 12.105, shaping: true }, ...points.slice(1)];
    expect(pruneAutoPoints(shaped).map((point) => point.id)).toEqual(['a', 's', 'b', 'c']);
  });

  it('FE-PADDLE-ROUTING-009: a point the paddler moves or edits is theirs; an untouched one stays automatic', () => {
    const points = materializePaddleLegs([A, B], { legs: [WEIR_AND_LOCK] }, newId);
    const edited = points.map((point) =>
      point.id === 'auto-3' ? { ...point, lock: { wait_minutes: 20, transit_minutes: null } } : point
    );
    const adopted = adoptChangedPoints(points, edited);
    expect(adopted.find((point) => point.id === 'auto-3')?.auto).toBeUndefined();
    expect(adopted.find((point) => point.id === 'auto-1')?.auto).toBeDefined();
  });

  it('FE-PADDLE-ROUTING-011: an automatic point made a stage end belongs to the paddler and stays when its leg changes', () => {
    const points = materializePaddleLegs([A, B, C], { legs: [WEIR_AND_LOCK, straight(B, C)] }, newId);
    const marked = adoptChangedPoints(
      points,
      points.map((point) => (point.id === 'auto-3' ? { ...point, stageEnd: true } : point))
    );
    expect(marked.find((point) => point.id === 'auto-3')).toMatchObject({ stageEnd: true });
    expect(marked.find((point) => point.id === 'auto-3')?.auto).toBeUndefined();
    const moved = marked.map((point) => (point.id === 'b' ? { ...point, lat: point.lat + 0.01 } : point));
    expect(pruneAutoPoints(moved).map((point) => point.id)).toEqual(['a', 'auto-3', 'b', 'c']);
  });
});

describe('planPaddleStep', () => {
  it('FE-PADDLE-ROUTING-010: prunes first, then sets what the router found, then answers the route', async () => {
    const signal = new AbortController().signal;
    vi.mocked(paddleRouteRepo.plan).mockResolvedValue([WEIR_AND_LOCK]);
    const first = await planPaddleStep([A, B], 7, KAYAK, signal, newId);
    expect('points' in first && first.points).toHaveLength(5);

    const found = 'points' in first ? first.points : [];
    vi.mocked(paddleRouteRepo.plan).mockResolvedValue(found.slice(0, -1).map(() => straight(A, B, 1500)));
    const second = await planPaddleStep(found, 7, KAYAK, signal, newId);
    expect('route' in second && second.route.legLengths).toHaveLength(4);

    const stale = found.map((point) => (point.id === 'a' ? { ...point, lng: point.lng + 0.01 } : point));
    vi.mocked(paddleRouteRepo.plan).mockClear();
    const third = await planPaddleStep(stale, 7, KAYAK, signal, newId);
    expect('points' in third && third.points.map((point) => point.id)).toEqual(['a', 'b']);
    expect(paddleRouteRepo.plan).not.toHaveBeenCalled();
  });
});
