import {
  TOUR_VISIT_STATUSES,
  tourVisitListResponseSchema,
  tourVisitSchema,
  tourVisitUpdateRequestSchema,
  WALK_IMPORT_REFUSALS,
  WALK_IMPORT_STATIONS_MAX,
  WALK_IMPORT_URL_MAX,
  walkImportPreviewRequestSchema,
  walkImportPreviewResponseSchema,
  walkImportRefusalResponseSchema,
  walkImportRefusalSchema,
  walkImportStationSchema,
} from './tour-walk.schema';
import { TOUR_STATION_NAME_MAX } from './tours.schema';

import { describe, expect, it } from 'vitest';

describe('city walk visits (CW-03)', () => {
  const visit = { assignment_id: 9, station_key: 'stop-cathedral', status: 'visited' };

  it('reads a visit of a station on a day, visited or skipped', () => {
    expect(TOUR_VISIT_STATUSES).toEqual(['visited', 'skipped']);
    expect(tourVisitListResponseSchema.parse({ visits: [visit, { ...visit, status: 'skipped' }] }).visits).toHaveLength(
      2,
    );
    expect(tourVisitListResponseSchema.parse({ visits: [] })).toEqual({ visits: [] });
  });

  it('refuses a visit that is planned, has no assignment or names no station key', () => {
    expect(tourVisitSchema.safeParse({ ...visit, status: 'planned' }).success).toBe(false);
    expect(tourVisitSchema.safeParse({ ...visit, assignment_id: 0 }).success).toBe(false);
    expect(tourVisitSchema.safeParse({ ...visit, station_key: 'a/b' }).success).toBe(false);
  });

  it('takes a station back to planned, marks it visited or skipped, and takes nothing else', () => {
    for (const status of ['planned', 'visited', 'skipped']) {
      expect(tourVisitUpdateRequestSchema.parse({ status })).toEqual({ status });
    }
    expect(tourVisitUpdateRequestSchema.safeParse({ status: 'done' }).success).toBe(false);
    expect(tourVisitUpdateRequestSchema.safeParse({}).success).toBe(false);
    expect(tourVisitUpdateRequestSchema.safeParse({ status: 'visited', note: 'late' }).success).toBe(false);
  });
});

describe('city walk import preview contract (CW-06, CW-07)', () => {
  it('takes one link, trimmed, up to its length, and nothing else', () => {
    expect(walkImportPreviewRequestSchema.parse({ url: '  https://maps.app.goo.gl/abc  ' })).toEqual({
      url: 'https://maps.app.goo.gl/abc',
    });
    expect(walkImportPreviewRequestSchema.safeParse({ url: '   ' }).success).toBe(false);
    expect(walkImportPreviewRequestSchema.safeParse({ url: 'x'.repeat(WALK_IMPORT_URL_MAX) }).success).toBe(true);
    expect(walkImportPreviewRequestSchema.safeParse({ url: 'x'.repeat(WALK_IMPORT_URL_MAX + 1) }).success).toBe(false);
    expect(walkImportPreviewRequestSchema.safeParse({ url: 'https://maps.app.goo.gl/abc', mode: 'walk' }).success).toBe(
      false,
    );
  });

  it('answers the stops the link names, a stop without coordinates left without them', () => {
    const answer = walkImportPreviewResponseSchema.parse({
      stations: [
        { name: 'Cathedral', lat: 48.1, lng: 11.5 },
        { name: null, lat: null, lng: null },
      ],
      resolved_url: 'https://www.google.com/maps/dir/...',
    });
    expect(answer.stations[1]).toEqual({ name: null, lat: null, lng: null });
    expect(
      walkImportPreviewResponseSchema.safeParse({ stations: [{ name: 'X', lat: 91, lng: 0 }], resolved_url: '' })
        .success,
    ).toBe(false);
  });

  it('holds a stop name to what a station takes, and its position to the globe', () => {
    expect(walkImportStationSchema.safeParse({ name: 'x'.repeat(TOUR_STATION_NAME_MAX), lat: 1, lng: 2 }).success).toBe(
      true,
    );
    expect(
      walkImportStationSchema.safeParse({ name: 'x'.repeat(TOUR_STATION_NAME_MAX + 1), lat: 1, lng: 2 }).success,
    ).toBe(false);
    expect(walkImportStationSchema.safeParse({ name: 'X', lat: 0, lng: 181 }).success).toBe(false);
    expect(walkImportStationSchema.safeParse({ name: 'X', lat: -91, lng: 0 }).success).toBe(false);
  });

  it('answers two stops at least, the most a link may bring at most, and the link it read', () => {
    const stop = { name: 'Stop', lat: 41.14, lng: -8.61 };
    const answer = (count: number, resolved_url = 'https://www.google.com/maps/dir/A/B') =>
      walkImportPreviewResponseSchema.safeParse({ stations: Array.from({ length: count }, () => stop), resolved_url });
    expect(answer(2).success).toBe(true);
    expect(answer(WALK_IMPORT_STATIONS_MAX).success).toBe(true);
    expect(answer(1).success).toBe(false);
    expect(answer(WALK_IMPORT_STATIONS_MAX + 1).success).toBe(false);
    expect(answer(2, 'not a link').success).toBe(false);
  });

  it('names every reason a link is refused for, and a refusal carries its text and its reason', () => {
    expect(WALK_IMPORT_REFUSALS).toEqual([
      'not_google_maps',
      'not_a_route',
      'not_walking',
      'mode_unknown',
      'short_link_refused',
      'short_link_failed',
      'short_link_unknown',
      'too_few_stops',
      'too_many_stops',
    ]);
    expect(walkImportRefusalSchema.safeParse('driving').success).toBe(false);
    expect(walkImportRefusalResponseSchema.parse({ error: 'Not on foot.', reason: 'not_walking' })).toEqual({
      error: 'Not on foot.',
      reason: 'not_walking',
    });
    expect(walkImportRefusalResponseSchema.safeParse({ error: 'Not on foot.' }).success).toBe(false);
  });
});
