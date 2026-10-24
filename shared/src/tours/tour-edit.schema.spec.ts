import { tourChangeRequestSchema } from './tour-change.schema';
import {
  horseRoutesToolRequestSchema,
  obstacleDecisionsToolRequestSchema,
  skiClassifyToolRequestSchema,
  tourCopyToolRequestSchema,
  tourDetailsUpdateRequestSchema,
  tourRefToolRequestSchema,
  tourRouteColorRequestSchema,
} from './tour-edit.schema';
import { tourUpdateRequestSchema } from './tour-hike.schema';

import { describe, expect, it } from 'vitest';

describe('the words and times of a saved tour (P8)', () => {
  it('takes any of its fields with the revision, null clearing one', () => {
    const body = {
      placeId: 4,
      expected_revision: 2,
      website: 'https://example.org/tour',
      break_additional_minutes: 45,
      planned_duration_minutes: null,
      description: null,
    };
    expect(tourDetailsUpdateRequestSchema.parse(body)).toEqual(body);
  });

  it('refuses a change of nothing, a plain http page, breaks past a day and a field it does not take', () => {
    const refused = [
      { placeId: 4, expected_revision: 2 },
      { placeId: 4, expected_revision: 2, website: 'http://example.org' },
      { placeId: 4, expected_revision: 2, break_additional_minutes: 1441 },
      { placeId: 4, expected_revision: 2, name: 'Ridge', route_color: '#fff' },
      { placeId: 4, name: 'Ridge' },
    ];
    for (const body of refused) {
      expect(tourDetailsUpdateRequestSchema.safeParse(body).success, JSON.stringify(body)).toBe(false);
    }
  });

  it('takes a route colour as hex or null, and a copy by its name', () => {
    expect(tourRouteColorRequestSchema.parse({ placeId: 1, route_color: '#e11d48' }).route_color).toBe('#e11d48');
    expect(tourRouteColorRequestSchema.parse({ placeId: 1, route_color: null }).route_color).toBeNull();
    expect(tourRouteColorRequestSchema.safeParse({ placeId: 1, route_color: 'red' }).success).toBe(false);
    expect(tourCopyToolRequestSchema.parse({ placeId: 1, name: ' Short way ' }).name).toBe('Short way');
    expect(tourCopyToolRequestSchema.safeParse({ placeId: 1, name: '' }).success).toBe(false);
  });
});

describe('the writes of a ski or paddle tour and the reads beside them (P9)', () => {
  it('takes a ski classification, a decision about an obstacle, a tour and a map view', () => {
    expect(
      skiClassifyToolRequestSchema.parse({ placeId: 3, ski_discipline: 'cross_country', ski_technique: 'classic' }),
    ).toMatchObject({ ski_technique: 'classic' });
    expect(skiClassifyToolRequestSchema.safeParse({ placeId: 3, ski_discipline: 'sledge' }).success).toBe(false);
    const op = { key: 'node/12', op: 'note', decision: null, note: 'portage on the left', basis: null };
    expect(obstacleDecisionsToolRequestSchema.parse({ placeId: 3, ops: [op] }).ops).toEqual([op]);
    expect(obstacleDecisionsToolRequestSchema.safeParse({ placeId: 3, ops: [] }).success).toBe(false);
    expect(tourRefToolRequestSchema.safeParse({ placeId: 3, extra: true }).success).toBe(false);
    expect(horseRoutesToolRequestSchema.parse({ bbox: '47.5,11.2,47.7,11.5' }).bbox).toBe('47.5,11.2,47.7,11.5');
  });
});

describe('the new changes of a saved city walk and a hike (P8)', () => {
  it('takes an edit of at least one field, a reverse and a close_loop', () => {
    const changes = [
      { op: 'edit', key: 'stop-museum', stay_minutes: 0, importance: null, protected: false },
      { op: 'reverse' },
      { op: 'close_loop' },
    ];
    expect(tourChangeRequestSchema.parse({ changes })).toEqual({ changes });
  });

  it('refuses an edit of nothing, of a field no station has, or a reverse naming a station', () => {
    const refused = [
      [{ op: 'edit', key: 'stop-museum' }],
      [{ op: 'edit', key: 'stop-museum', lat: 48 }],
      [{ op: 'edit', key: 'stop-museum', stay_minutes: -1 }],
      [{ op: 'edit', key: 'stop-museum', name: '' }],
      [{ op: 'reverse', key: 'stop-museum' }],
    ];
    for (const changes of refused) {
      expect(tourChangeRequestSchema.safeParse({ changes }).success, JSON.stringify(changes)).toBe(false);
    }
  });

  it('takes a hike reshaped without new points, never with them', () => {
    expect(tourUpdateRequestSchema.parse({ placeId: 2, expected_revision: 1, reshape: 'reverse' }).reshape).toBe(
      'reverse',
    );
    const both = {
      placeId: 2,
      expected_revision: 1,
      reshape: 'close_loop',
      waypoints: [
        { lat: 47, lng: 11 },
        { lat: 47.1, lng: 11 },
      ],
    };
    expect(tourUpdateRequestSchema.safeParse(both).success).toBe(false);
    expect(tourUpdateRequestSchema.safeParse({ placeId: 2, expected_revision: 1, reshape: 'flip' }).success).toBe(
      false,
    );
  });
});
