import {
  tourStopInsertRequestSchema,
  tourStopInsertResultSchema,
  tourStopRemoveRequestSchema,
  tourStopRemoveResultSchema,
} from './tour-stop.schema';

import { describe, expect, it } from 'vitest';

const stop = { lat: 47.6, lng: 11.3, name: 'Herzogstandhaus', poi_category: 'shelter' };
const tour = {
  place_id: 4,
  name: 'Herzogstand',
  tour_type: 'hike',
  revision: 3,
  distance_km: 9.1,
  minutes: 210,
  route_pending: false,
};

describe('a stop taken into a saved tour (P6)', () => {
  it('TOUR-STOP-SCHEMA-001: takes a stop against the revision, after a key or where it lies along the way', () => {
    expect(tourStopInsertRequestSchema.safeParse({ placeId: 4, expected_revision: 2, stop }).success).toBe(true);
    const after = { placeId: 4, expected_revision: 2, stop, after_key: 'abc123' };
    expect(tourStopInsertRequestSchema.safeParse(after).success).toBe(true);
    expect(tourStopInsertRequestSchema.safeParse({ placeId: 4, stop }).success).toBe(false);
    expect(tourStopInsertRequestSchema.safeParse({ ...after, after_key: 'no spaces' }).success).toBe(false);
  });

  it('TOUR-STOP-SCHEMA-002: refuses a stop off the globe and fields it does not know', () => {
    const off = { placeId: 4, expected_revision: 2, stop: { ...stop, lat: 91 } };
    expect(tourStopInsertRequestSchema.safeParse(off).success).toBe(false);
    const extra = { placeId: 4, expected_revision: 2, stop: { ...stop, stay: 5 } };
    expect(tourStopInsertRequestSchema.safeParse(extra).success).toBe(false);
    expect(tourStopInsertRequestSchema.safeParse({ placeId: 4, expected_revision: 2, stop, x: 1 }).success).toBe(false);
  });

  it('TOUR-STOP-SCHEMA-003: takes a stop out by its key, against the revision', () => {
    expect(tourStopRemoveRequestSchema.safeParse({ placeId: 4, expected_revision: 3, key: 'abc123' }).success).toBe(
      true,
    );
    expect(tourStopRemoveRequestSchema.safeParse({ placeId: 4, key: 'abc123' }).success).toBe(false);
    expect(tourStopRemoveRequestSchema.safeParse({ placeId: 4, expected_revision: 0, key: 'abc123' }).success).toBe(
      false,
    );
  });

  it('TOUR-STOP-SCHEMA-004: describes what an insert and a removal answer', () => {
    const point = { key: 'abc123', ...stop };
    const inserted = {
      tour,
      stop: { ...point, after_key: 'start1', after_name: 'Parking' },
      before: { distance_km: 8.2, minutes: 190 },
    };
    expect(tourStopInsertResultSchema.safeParse(inserted).success).toBe(true);
    expect(tourStopRemoveResultSchema.safeParse({ tour, removed: { ...point, after_key: null } }).success).toBe(true);
    expect(tourStopRemoveResultSchema.safeParse({ tour: { ...tour, tour_type: 'bike' }, removed: point }).success).toBe(
      false,
    );
  });
});
