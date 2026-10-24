import { distancesToLine, nearnessToLine } from './route-corridor';

import { describe, expect, it } from 'vitest';

describe('nearnessToLine', () => {
  // A line running north along 11° E for about 2.2 km.
  const line = [
    [47, 11],
    [47.01, 11],
    [47.02, 11],
  ];

  it('measures a point beside the line square to it, and how far along its foot lies', () => {
    const near = nearnessToLine({ lat: 47.015, lng: 11.001 }, line);
    expect(near?.distanceM).toBeGreaterThan(70);
    expect(near?.distanceM).toBeLessThan(80);
    expect(near?.alongM).toBeGreaterThan(1650);
    expect(near?.alongM).toBeLessThan(1690);
  });

  it('measures a point past an end from that end', () => {
    const near = nearnessToLine({ lat: 46.99, lng: 11 }, line);
    expect(near?.alongM).toBe(0);
    expect(near?.distanceM).toBeGreaterThan(1100);
    expect(near?.distanceM).toBeLessThan(1120);
  });

  it('takes heights along without minding them, and answers nothing for a line too short', () => {
    expect(
      nearnessToLine({ lat: 47, lng: 11 }, [
        [47, 11, 900],
        [47.01, 11, 950],
      ])?.distanceM,
    ).toBe(0);
    expect(nearnessToLine({ lat: 47, lng: 11 }, [[47, 11]])).toBeNull();
    expect(
      nearnessToLine({ lat: 47, lng: 11 }, [
        [47, 11],
        [47, 11],
      ])?.distanceM,
    ).toBe(0);
  });
});

describe('distancesToLine', () => {
  const line = [
    [47, 11],
    [47.01, 11],
    [47.02, 11],
  ];

  it('measures every point against the line, in their order, as nearnessToLine does one', () => {
    const points = [
      [47.015, 11.001],
      [47.005, 11],
      [46.99, 11, 900],
    ];
    const distances = distancesToLine(points, line);
    expect(distances).toHaveLength(3);
    points.forEach((point, index) => {
      expect(distances?.[index]).toBeCloseTo(
        nearnessToLine({ lat: Number(point[0]), lng: Number(point[1]) }, line)?.distanceM ?? -1,
        6,
      );
    });
    expect(distances?.[1]).toBe(0);
  });

  it('answers nothing for a line too short, and nothing to measure for no points', () => {
    expect(distancesToLine([[47, 11]], [[47, 11]])).toBeNull();
    expect(distancesToLine([], line)).toEqual([]);
  });
});
