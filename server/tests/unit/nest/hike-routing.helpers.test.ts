/**
 * The pure halves of a hike planned on the server: the routed line as one
 * line, the heights all or none, the height profile for display and the SAC
 * grades laid onto the line.
 */
import {
  addStretch,
  gradableWayIds,
  gradesAlong,
  heightsOrNone,
  joinedLine,
  metresAlong,
  profileOf,
} from '../../../src/nest/tours/hike-routing.helpers';
import type { HikeSacSegment, SacStep } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// HIKE-HELP-001 to HIKE-HELP-008

describe('the routed line of a hike', () => {
  it('HIKE-HELP-001: drops a point that repeats the one before it, and keeps a line that would be left with one point', () => {
    expect(
      joinedLine([
        [47, 11],
        [47.1, 11],
        [47.1, 11],
        [47.2, 11],
      ]),
    ).toEqual([
      [47, 11],
      [47.1, 11],
      [47.2, 11],
    ]);
    expect(
      joinedLine([
        [47, 11],
        [47, 11],
      ]),
    ).toEqual([
      [47, 11],
      [47, 11],
    ]);
  });

  it('HIKE-HELP-002: takes the heights only where every point of the line has one', () => {
    const flat: Array<[number, number]> = [
      [47, 11],
      [47.1, 11],
    ];
    expect(
      heightsOrNone(flat, [
        [47, 11, 600],
        [47.1, 11, 650],
      ]),
    ).toEqual([
      [47, 11, 600],
      [47.1, 11, 650],
    ]);
    expect(
      heightsOrNone(flat, [
        [47, 11, 600],
        [47.1, 11],
      ]),
    ).toEqual(flat);
    expect(heightsOrNone(flat, [[47, 11, 600]])).toEqual(flat);
    expect(heightsOrNone(flat, null)).toEqual(flat);
  });

  it('HIKE-HELP-003: draws the profile in whole metres along the line, and none without heights', () => {
    const line: Array<[number, number, number]> = [
      [47, 11, 600.4],
      [47.001, 11, 650.6],
      [47.002, 11, 640],
    ];
    expect(profileOf(line, 200)).toEqual([
      [0, 600],
      [111, 651],
      [222, 640],
    ]);
    expect(profileOf(line, 2)).toEqual([
      [0, 600],
      [222, 640],
    ]);
    expect(
      profileOf(
        [
          [47, 11, 600],
          [47.001, 11],
        ],
        200,
      ),
    ).toEqual([]);
    expect(profileOf([[47, 11, 600]], 200)).toEqual([]);
  });
});

describe('the SAC grades along a hike', () => {
  const T2 = 2 as SacStep;
  const T3 = 3 as SacStep;

  it('HIKE-HELP-004: asks for each graded way once, in the order walked, up to the limit', () => {
    const ways = [
      { wayId: 5, metres: 10 },
      { wayId: null, metres: 10 },
      { wayId: 5, metres: 10 },
      { wayId: 7, metres: 10 },
      { wayId: 9, metres: 10 },
    ];
    expect(gradableWayIds(ways, 10)).toEqual([5, 7, 9]);
    expect(gradableWayIds(ways, 2)).toEqual([5, 7]);
  });

  it('HIKE-HELP-005: joins neighbours of one grade, keeps grades apart where an unknown way lies between', () => {
    const ways = [
      { wayId: 1, metres: 100 },
      { wayId: 2, metres: 50 },
      { wayId: 3, metres: 25 },
      { wayId: 4, metres: 25 },
      { wayId: 5, metres: 0 },
      { wayId: 6, metres: 50 },
    ];
    const steps = new Map([
      [1, T2],
      [2, T2],
      [4, T3],
      [5, T2],
      [6, T3],
    ]);
    expect(gradesAlong(ways, steps, 250)).toEqual({
      // A way of no length between two of one grade does not part them.
      segments: [
        { from_m: 0, to_m: 150, sac: 2 },
        { from_m: 175, to_m: 250, sac: 3 },
      ],
      highest: 3,
      unknown_share: 0.1,
    });
  });

  it('HIKE-HELP-006: lays the described stretches onto the planned length', () => {
    const grades = gradesAlong(
      [
        { wayId: 1, metres: 90 },
        { wayId: null, metres: 10 },
      ],
      new Map([[1, T2]]),
      110,
    );
    expect(grades).toEqual({ segments: [{ from_m: 0, to_m: 99, sac: 2 }], highest: 2, unknown_share: 0.1 });
    // A planned length of nothing leaves the stretches as described.
    expect(gradesAlong([{ wayId: 1, metres: 90 }], new Map([[1, T2]]), 0).segments).toEqual([
      { from_m: 0, to_m: 90, sac: 2 },
    ]);
  });

  it('HIKE-HELP-007: reads a line with nothing graded, or of no length, as unknown throughout', () => {
    expect(gradesAlong([{ wayId: 1, metres: 40 }], new Map(), 40)).toEqual({
      segments: [],
      highest: null,
      unknown_share: 1,
    });
    expect(gradesAlong([{ wayId: 1, metres: 0 }], new Map([[1, T2]]), 40)).toEqual({
      segments: [],
      highest: null,
      unknown_share: 1,
    });
    expect(gradesAlong([], new Map(), 40)).toEqual({ segments: [], highest: null, unknown_share: 1 });
  });

  it('HIKE-HELP-008: measures a line point by point, and joins a stretch only to a touching one of its grade', () => {
    expect(
      metresAlong([
        [47, 11],
        [47.001, 11, 600],
        [47.002, 11],
      ]).map(Math.round),
    ).toEqual([0, 111, 222]);
    expect(metresAlong([])).toEqual([]);
    const given: HikeSacSegment = { from_m: 100, to_m: 150, sac: 2 };
    const stretches = [{ from_m: 0, to_m: 100, sac: 2 }];
    expect(addStretch(stretches, given)).toEqual([{ from_m: 0, to_m: 150, sac: 2 }]);
    // Another grade, or a gap of unknown grade between, keeps a stretch apart; the one given is never changed.
    expect(addStretch(stretches, { from_m: 150, to_m: 160, sac: 3 })).toHaveLength(2);
    expect(addStretch(stretches, { from_m: 170, to_m: 180, sac: 3 })).toHaveLength(3);
    expect(given).toEqual({ from_m: 100, to_m: 150, sac: 2 });
  });
});
