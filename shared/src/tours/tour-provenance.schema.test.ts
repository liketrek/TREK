import {
  tourOriginSchema,
  tourProvenanceSchema,
  tourSourceCheckResponseSchema,
  type TourProvenance,
} from './tour-provenance.schema';
import { tourCopyRequestSchema, tourCreateResponseSchema, tourListItemSchema } from './tours.schema';

import { describe, expect, it } from 'vitest';

const planned: TourProvenance = {
  origin: 'trek',
  createdAt: '2026-10-15 10:00:00',
  source: { kind: 'trek' },
  derivedFrom: null,
  plannedOver: false,
  editedLocally: null,
};

describe('tour provenance contract (P2C-02)', () => {
  it('knows the three ways a tour comes in, and nothing else', () => {
    expect(tourOriginSchema.options).toEqual(['trek', 'gpx', 'wanderer']);
    expect(tourOriginSchema.safeParse('komoot').success).toBe(false);
  });

  it('holds a planned tour without inventing a source for it', () => {
    expect(tourProvenanceSchema.parse(planned)).toEqual(planned);
    expect(
      tourProvenanceSchema.safeParse({ ...planned, source: { kind: 'trek', fileName: 'x.gpx' } }).data?.source,
    ).toEqual({
      kind: 'trek',
    });
  });

  it('keeps what each source carries apart: a GPX file name, a wanderer identity', () => {
    const gpx = { ...planned, origin: 'gpx', source: { kind: 'gpx', fileName: null }, plannedOver: true };
    expect(tourProvenanceSchema.parse(gpx).source).toEqual({ kind: 'gpx', fileName: null });

    const wanderer = {
      ...planned,
      origin: 'wanderer',
      source: {
        kind: 'wanderer',
        instance: 'https://trails.example',
        externalId: 'abc123',
        externalUrl: null,
        externalUpdated: '2026-10-01 08:00:00Z',
        importedAt: null,
      },
      editedLocally: true,
    };
    expect(tourProvenanceSchema.parse(wanderer).source).toMatchObject({ kind: 'wanderer', externalId: 'abc123' });
    // A wanderer source without its identity is no wanderer source.
    expect(tourProvenanceSchema.safeParse({ ...wanderer, source: { kind: 'wanderer' } }).success).toBe(false);
  });

  it('names the import a tour was planned from by id and name', () => {
    const derived = { ...planned, derivedFrom: { placeId: 7, name: 'Ridge (GPX)' } };
    expect(tourProvenanceSchema.parse(derived).derivedFrom).toEqual({ placeId: 7, name: 'Ridge (GPX)' });
    expect(tourProvenanceSchema.safeParse({ ...planned, derivedFrom: { placeId: 0, name: 'x' } }).success).toBe(false);
  });

  it('is optional on the list and the detail, so a cache from before it still reads', () => {
    const item = {
      place_id: 1,
      tour_type: 'hike',
      distance: null,
      elevation_gain: null,
      elevation_loss: null,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: null,
      max_hiking_difficulty: null,
      name: 'Ridge',
      planned: false,
      caution: false,
    };
    expect(tourListItemSchema.parse(item).origin).toBeUndefined();
    expect(tourListItemSchema.parse({ ...item, origin: 'gpx' }).origin).toBe('gpx');
    expect(tourCreateResponseSchema.parse({ tour: item, waypoints: [] }).provenance).toBeUndefined();
    expect(tourCreateResponseSchema.parse({ tour: item, waypoints: [], provenance: planned }).provenance).toEqual(
      planned,
    );
  });
});

describe('source check answer (MF-03)', () => {
  it('says what changed and carries what a confirmed reimport sends', () => {
    const answer = {
      state: 'changed',
      changes: ['name', 'route'],
      externalUpdated: '2026-10-14 12:00:00Z',
      importedUpdated: '2026-10-01 08:00:00Z',
      editedLocally: false,
      reimport: { trailId: 'abc123', contentHash: 'h.h.h' },
    };
    expect(tourSourceCheckResponseSchema.parse(answer)).toEqual(answer);
  });

  it('refuses a state or a change it does not know', () => {
    const base = { changes: [], externalUpdated: null, importedUpdated: null, editedLocally: null, reimport: null };
    for (const state of ['unchanged', 'unavailable', 'not_connected', 'other_instance', 'unknown']) {
      expect(tourSourceCheckResponseSchema.safeParse({ ...base, state }).success).toBe(true);
    }
    expect(tourSourceCheckResponseSchema.safeParse({ ...base, state: 'synced' }).success).toBe(false);
    expect(tourSourceCheckResponseSchema.safeParse({ ...base, state: 'changed', changes: ['author'] }).success).toBe(
      false,
    );
  });
});

describe('save as new tour (P2C-07)', () => {
  it('takes a trimmed name and refuses an empty or overlong one', () => {
    expect(tourCopyRequestSchema.parse({ name: '  Ridge (copy) ' })).toEqual({ name: 'Ridge (copy)' });
    expect(tourCopyRequestSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(tourCopyRequestSchema.safeParse({ name: 'x'.repeat(256) }).success).toBe(false);
  });
});
