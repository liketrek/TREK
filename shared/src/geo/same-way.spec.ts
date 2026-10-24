// SAME-WAY-001 to SAME-WAY-008: whether two routed lines are one way, the other ways among a
// router's offers, and the fewest pins that make the router keep to one.
import { furthestFrom, otherWaysOf, pinWay, sameRoad, type RoadLine, type WayPin } from './same-way';

import { describe, expect, it, vi } from 'vitest';

type Line = [number, number][];

const RAIL: Line = [
  [53.55, 9.99],
  [53.0, 11.5],
  [52.52, 13.4],
];
const DETOUR: Line = [
  [53.55, 9.99],
  [53.4, 11.5],
  [53.3, 12.8],
  [52.52, 13.4],
];
const road = (coordinates: Line, over: Partial<RoadLine> = {}): RoadLine => ({
  coordinates,
  distance: 300_000,
  duration: 11_000,
  ...over,
});

describe('sameRoad', () => {
  it('SAME-WAY-001: a road that runs the whole of another and turns off to a point and back is not that road', () => {
    const plainRoad = road(
      [
        [61, 10],
        [61, 11],
        [61, 12],
      ],
      { distance: 100_000, duration: 3600 },
    );
    const spur = road(
      [
        [61, 10],
        [61, 11],
        [61.3, 11],
        [61, 11],
        [61, 12],
      ],
      { distance: 166_000, duration: 5400 },
    );
    expect(sameRoad(plainRoad, spur)).toBe(false);
    expect(sameRoad(spur, plainRoad)).toBe(false);
    expect(sameRoad(plainRoad, { ...plainRoad, distance: 104_000, duration: 3900 })).toBe(true);
  });

  it('SAME-WAY-002: one road drawn with a different spacing of points is still one road', () => {
    const dense = Array.from({ length: 2001 }, (_, i): [number, number] => [50, i * 0.005]);
    const sparse: Line = [
      [50, 0],
      ...Array.from({ length: 200 }, (_, i): [number, number] => [50, 0.025 + i * 0.05]),
      [50, 10],
    ];
    expect(sameRoad(road(dense), road(sparse))).toBe(true);
    const off = furthestFrom([[50.02, 5]], dense);
    expect(off?.index).toBe(0);
    expect(off?.km).toBeCloseTo(2.22, 1);
  });

  it('SAME-WAY-003: lines without a shape are compared by their figures', () => {
    expect(furthestFrom([], RAIL)).toBeNull();
    expect(sameRoad(road([]), road([], { distance: 300_100, duration: 11_030 }))).toBe(true);
    expect(sameRoad(road([]), road([], { distance: 301_000 }))).toBe(false);
  });
});

describe('otherWaysOf', () => {
  it('SAME-WAY-004: the router’s first answer and repeats of a way are no other ways, and there are at most so many', () => {
    const current = { coordinates: RAIL };
    const far: Line = [
      [53.55, 9.99],
      [52.6, 11.5],
      [52.52, 13.4],
    ];
    const offers = [{ coordinates: DETOUR }, { coordinates: RAIL }, { coordinates: DETOUR }, { coordinates: far }];
    expect(otherWaysOf(current, offers, 3).map((offer) => offer.coordinates)).toEqual([DETOUR, far]);
    expect(otherWaysOf(current, offers, 1).map((offer) => offer.coordinates)).toEqual([DETOUR]);
    expect(otherWaysOf(current, [{ coordinates: DETOUR }], 3)).toEqual([]);
  });
});

describe('pinWay', () => {
  it('SAME-WAY-005: the router’s own preference is asked with no pin, any other offer from where it strays furthest', async () => {
    const route = vi.fn(async (_pins: WayPin[]) => road(DETOUR));
    expect(await pinWay({ offer: { ...road(DETOUR), direct: true }, current: road(RAIL), route })).toMatchObject({
      held: true,
      pins: [],
    });
    expect(route.mock.calls[0]?.[0]).toEqual([]);
    expect(await pinWay({ offer: road(DETOUR), current: road(RAIL), route })).toMatchObject({
      held: true,
      pins: [{ lat: 53.3, lng: 12.8 }],
    });
  });

  it('SAME-WAY-006: an answer that is not the offer adds the point it missed, in the order the offer runs', async () => {
    const route = vi
      .fn(async (_pins: WayPin[]) => road(DETOUR))
      .mockResolvedValueOnce(
        road([
          [53.55, 9.99],
          [53.0, 11.5],
          [53.3, 12.8],
          [52.52, 13.4],
        ]),
      );
    const proof = await pinWay({ offer: road(DETOUR), current: road(RAIL), route });
    expect(route).toHaveBeenCalledTimes(2);
    expect(proof?.pins).toEqual([
      { lat: 53.4, lng: 11.5 },
      { lat: 53.3, lng: 12.8 },
    ]);
  });

  it('SAME-WAY-007: a way the router does not keep to within the pins, or an answer of a stand-in, holds nothing', async () => {
    const never = vi.fn(async (_pins: WayPin[]) => road(RAIL));
    const refused = await pinWay({ offer: road(DETOUR), current: road(RAIL), route: never, maxPins: 1 });
    expect(refused).toMatchObject({ held: false, pins: [], fellBack: false });
    const standIn = vi.fn(async (_pins: WayPin[]) => ({ ...road(DETOUR), fellBack: true }));
    expect(await pinWay({ offer: road(DETOUR), current: road(RAIL), route: standIn })).toMatchObject({
      held: false,
      fellBack: true,
    });
  });

  it('SAME-WAY-008: nothing is asked once the check is called off', async () => {
    const route = vi.fn(async (_pins: WayPin[]) => road(DETOUR));
    expect(await pinWay({ offer: road(DETOUR), current: road(RAIL), route, signal: { aborted: true } })).toBeNull();
    expect(route).not.toHaveBeenCalled();
  });
});
