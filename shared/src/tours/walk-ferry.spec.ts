import { boatSpansOf, boatsAlong, ferryCrossingsOf, ferryLegsOf, walkFerryMinutesOf } from './walk-ferry';
import { stationArrivals, stationShares } from './walk-hours';

import { describe, expect, it } from 'vitest';

const line: Array<[number, number, number]> = [
  [45.4296, 12.3264, 2],
  [45.4291, 12.3266, 1],
  [45.4275, 12.3282, 1],
  [45.4268, 12.33, 2],
];

describe('ferry legs of a city walk (CW-12)', () => {
  it('reads the boat part of each ferry leg, and nothing of any other leg', () => {
    expect(
      ferryCrossingsOf([
        {
          fixed_leg: {
            kind: 'free',
            geometry: [
              [1, 1],
              [2, 2],
            ],
          },
        },
        {
          fixed_leg: {
            kind: 'ferry',
            geometry: line.map(([lat, lng]): [number, number] => [lat, lng]),
            crossings: [[1, 2]],
            minutes: 7,
            walk_minutes: 2,
          },
        },
        {},
      ]),
    ).toEqual([
      [
        [45.4291, 12.3266],
        [45.4275, 12.3282],
      ],
    ]);
  });

  it('finds each crossing on the saved line by its own points, and leaves out one it cannot find', () => {
    const crossing: Array<[number, number]> = [
      [45.4291, 12.3266],
      [45.4275, 12.3282],
    ];
    expect(boatSpansOf(line, [crossing])).toEqual([[1, 2]]);
    expect(
      boatSpansOf(line, [
        [
          [1, 1],
          [2, 2],
        ],
      ]),
    ).toEqual([]);
  });

  it('keeps two stretches by boat of one leg apart, the walk between them walking', () => {
    const points = [
      {
        fixed_leg: {
          kind: 'ferry' as const,
          geometry: line.map(([lat, lng]): [number, number] => [lat, lng]),
          crossings: [
            [0, 1],
            [2, 3],
          ] as [number, number][],
          minutes: 9,
          walk_minutes: 2,
        },
      },
    ];
    expect(ferryCrossingsOf(points)).toHaveLength(2);
    expect(ferryLegsOf(points)[0]?.minutes).toBe(9);
    expect(walkFerryMinutesOf(points)).toBe(9);
    expect(walkFerryMinutesOf([{}])).toBeUndefined();
    expect(boatsAlong(line, ferryLegsOf(points))).toEqual({
      spans: [
        [0, 1],
        [2, 3],
      ],
      landings: [{ at: 3, minutes: 9 }],
    });
  });

  it('reaches a stop after the boat lands that many minutes later, and only as a lower bound without its time', () => {
    const stops = [
      { lat: 45.4296, lng: 12.3264, stayMinutes: 0 },
      { lat: 45.4275, lng: 12.3282, stayMinutes: 0 },
      { lat: 45.4268, lng: 12.33, stayMinutes: 0 },
    ];
    const boats = { spans: [[1, 2]] as Array<[number, number]>, landings: [{ at: 2, minutes: 12 }] };
    const walked = stationArrivals(stops, line, 600, 20, { ...boats, landings: [] }) ?? [];
    const crossed = stationArrivals(stops, line, 600, 20, boats) ?? [];
    expect(crossed[0]).toEqual(walked[0]);
    expect(crossed[1]?.arrival).toBe((walked[1]?.arrival ?? 0) + 12);
    expect(crossed[2]?.arrival).toBe((walked[2]?.arrival ?? 0) + 12);
    const unknown = stationArrivals(stops, line, 600, 20, { ...boats, landings: [{ at: 2, minutes: null }] }) ?? [];
    expect(unknown.map((arrival) => arrival.atLeast)).toEqual([false, true, true]);
  });

  it('counts no distance along a stretch crossed by boat when sharing a walk out', () => {
    const stops = [
      { lat: 45.4296, lng: 12.3264 },
      { lat: 45.4275, lng: 12.3282 },
    ];
    const walked = stationShares(stops, line)?.[1] ?? 0;
    // The stop where the boat lands is passed after the walk to the pier only.
    const byBoat = stationShares(stops, line, [[1, 2]])?.[1] ?? 0;
    expect(byBoat).toBeLessThan(walked);
    expect(stationShares(stops, line, [])).toEqual(stationShares(stops, line));
  });
});
