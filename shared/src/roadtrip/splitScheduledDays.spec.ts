import type { SpillChain } from './nightSpill';
import type { RoadtripStop, RoutedLeg } from './planning-types';
import { splitScheduledDays } from './splitScheduledDays';

import { describe, expect, it } from 'vitest';

const chain = (): SpillChain => ({
  dayId: 2,
  dayNumber: 2,
  date: '2026-09-12',
  title: null,
  stops: [0, 1, 2].map((i) => ({ placeId: i + 1, dwellMinutes: 60, time: null }) as RoadtripStop),
  schedule: {
    entries: [
      { arrival: '22:12', departure: '23:12', anchored: false, dayOffset: 0 },
      ...[1, 2].map(() => ({ arrival: null, departure: null, anchored: false, dayOffset: 0 })),
    ],
    warnings: [],
  },
  spills: [],
});
const lookup = (): RoutedLeg =>
  ({
    seg: {
      duration: 198 * 60,
      distance: 300000,
      from: [0, 0],
      to: [1, 1],
      mid: [0.5, 0.5],
      walkingText: '',
      drivingText: '',
      distanceText: '300 km',
    },
    line: [
      [0, 0],
      [1, 1],
    ],
    vias: [],
  }) as RoutedLeg;
describe('scheduled day overflow', () => {
  it('creates a display day for the stops after midnight', () => {
    const source = chain();
    const days = splitScheduledDays([source], [source], lookup);
    expect(days.map((day) => day.dayNumber)).toEqual([2, 3]);
    expect(days[1]!.dayId).toBe(-1000000003);
    expect(days[1]!.date).toBe('2026-09-13');
    expect(days[1]!.schedule.entries.map((entry) => entry.arrival)).toEqual(['02:30', '06:48']);
    expect(days[1]!.schedule.entries.every((entry) => entry.dayOffset === 0)).toBe(true);
    expect(days[1]!.spills[0]).toMatchObject({ fromDayNumber: 2, at: 0, count: 2, departure: '23:12' });
    expect(source.stops).toHaveLength(3);
  });
  it('uses an existing empty day and keeps an earlier spill group', () => {
    const source = chain();
    source.spills = [
      { at: 0, count: 1, fromDayNumber: 1, departure: '18:00', leg: undefined, line: [], fromStop: undefined },
    ];
    const days = splitScheduledDays(
      [source],
      [source, { dayId: 99, dayNumber: 3, date: '2026-09-13', title: 'Rome', stops: [] }],
      lookup,
    );
    expect(days[1]!.dayId).toBe(99);
    expect(days[0]!.spills[0]!.fromDayNumber).toBe(1);
    expect(days[1]!.spills[0]!.fromDayNumber).toBe(2);
  });
});
