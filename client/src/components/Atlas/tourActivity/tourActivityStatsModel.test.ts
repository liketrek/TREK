// FE-STA2-MODEL-001 to FE-STA2-MODEL-007
// STA-02: the periods and types the Atlas offers for the user's tour
// activities, and how a sum reads when some tours do not know the value.
import type { TourActivityStatsEntry } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  periodOptions,
  periodRange,
  periodYear,
  splitMeasure,
  sumReading,
  typeOptions,
} from './tourActivityStatsModel';

const TODAY = '2026-10-20';

function entry(overrides: Partial<TourActivityStatsEntry> = {}): TourActivityStatsEntry {
  return {
    place_id: 1,
    name: 'Ridge',
    tour_type: 'hike',
    trip: { id: 5, title: 'Alps' },
    derived_from_place_id: null,
    date: '2026-07-02',
    basis: 'plan',
    track: null,
    day_count: 1,
    distance_km: 10,
    ascent_m: 500,
    descent_m: 400,
    excluded: false,
    ...overrides,
  };
}

describe('tourActivityStatsModel', () => {
  it('FE-STA2-MODEL-001: each period covers its days, both ends included', () => {
    expect(periodRange('all', TODAY)).toEqual({ from: null, to: null });
    expect(periodRange('thisYear', TODAY)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(periodRange('last12', TODAY)).toEqual({ from: '2025-10-20', to: TODAY });
    expect(periodRange('year:2024', TODAY)).toEqual({ from: '2024-01-01', to: '2024-12-31' });
  });

  it('FE-STA2-MODEL-002: offers the earlier years a done tour is in, the newest first, and no empty one', () => {
    const entries = [
      entry({ date: '2023-05-01' }),
      entry({ date: '2025-08-01' }),
      entry({ date: '2025-09-01' }),
      entry({ date: '2026-03-01' }),
    ];
    expect(periodOptions(entries, TODAY)).toEqual(['all', 'thisYear', 'last12', 'year:2025', 'year:2023']);
    expect(periodOptions([], TODAY)).toEqual(['all', 'thisYear', 'last12']);
  });

  it('FE-STA2-MODEL-003: offers the types of done tours only, in planning order, older types after them', () => {
    const entries = [
      entry({ tour_type: 'kayak' }),
      entry({ tour_type: 'run' }),
      entry({ tour_type: 'hike' }),
      entry({ tour_type: 'bike', date: '2026-12-01' }),
    ];
    expect(typeOptions(entries, TODAY)).toEqual(['all', 'hike', 'run', 'kayak']);
  });

  it('FE-STA2-MODEL-004: reads the year of a year period only', () => {
    expect(periodYear('year:2024')).toBe(2024);
    expect(periodYear('thisYear')).toBeNull();
  });

  it('FE-STA2-MODEL-005: a sum nobody knows says nothing, a short one says at least', () => {
    const km = (value: number) => `${value} km`;
    expect(sumReading({ value: null, known: 0, of: 2 }, km)).toBeNull();
    expect(sumReading({ value: 12, known: 2, of: 2 }, km)).toEqual({ text: '12 km', partial: false });
    expect(sumReading({ value: 12, known: 1, of: 2 }, km)).toEqual({ text: '≥ 12 km', partial: true });
  });

  it('FE-STA2-MODEL-006: splits a measure into its number and unit', () => {
    expect(splitMeasure('128.4 km')).toEqual({ value: '128.4', unit: 'km' });
    expect(splitMeasure('≥ 12 km')).toEqual({ value: '≥ 12', unit: 'km' });
    expect(splitMeasure('12')).toEqual({ value: '12', unit: '' });
  });

  it('FE-STA2-MODEL-007: a tour still ahead offers neither its year nor its type', () => {
    expect(periodOptions([entry({ date: '2025-01-01' }), entry({ date: '2027-01-01' })], TODAY)).toEqual([
      'all',
      'thisYear',
      'last12',
      'year:2025',
    ]);
    expect(typeOptions([entry({ tour_type: 'walk', date: TODAY })], TODAY)).toEqual(['all']);
  });

  it('FE-STA2-MODEL-008: a planned ski tour is a type of its own, after the types planned before it', () => {
    const entries = [entry({ tour_type: 'ski' }), entry({ tour_type: 'horse' }), entry({ tour_type: 'hike' })];
    expect(typeOptions(entries, TODAY)).toEqual(['all', 'hike', 'horse', 'ski']);
  });
});
