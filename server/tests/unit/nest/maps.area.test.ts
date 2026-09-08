/**
 * MAPS-AREA-001..006 — the trip's area, handed to the client for offline use.
 *
 * The one maps call that is not driven by something a user just typed: it runs
 * inside an offline sync, which is why every failure path here ends in null
 * rather than an exception.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockArea } = vi.hoisted(() => ({
  mockArea: vi.fn(async (): Promise<unknown> => ({ results: [], truncated: false, count: 0 })),
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesArea: mockArea,
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { MapsService } from '../../../src/nest/maps/maps.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

const BOX = { minLat: 54, minLng: 12, maxLat: 54.2, maxLng: 12.3 };

const PLACE = {
  gers: 'abc-123',
  name: "L'Osteria",
  lat: 54.0879,
  lng: 12.1408,
  category: 'restaurant',
  categoryPath: 'eat_and_drink>restaurant',
  confidence: 1,
  address: { freeform: 'Steinstrasse 9', locality: 'Rostock', postcode: '18055', region: null, country: 'DE' },
  contact: { website: 'https://losteria.net/', phone: null, email: null, socials: null },
  brand: null,
  source: 'overture',
  hours: null,
};

const ORIGINAL_TREK_PLACES = process.env.TREK_PLACES_ENABLED;

afterEach(() => {
  if (ORIGINAL_TREK_PLACES === undefined) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = ORIGINAL_TREK_PLACES;
});

// The index is an operator switch, not an admin row, so switching it off means
// moving the env rather than stubbing a settings lookup. The service reads the
// flag per call, which is why the restore above belongs in afterEach.
function make(enabled = true) {
  if (enabled) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = 'false';
  const database = { get: vi.fn(() => undefined) } as unknown as DatabaseService;
  return new MapsService(database, {} as PlacePhotoCacheService);
}

beforeEach(() => {
  mockArea.mockReset();
  mockArea.mockResolvedValue({ results: [PLACE], truncated: false, count: 1 });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('MapsService.placesInArea', () => {
  it('MAPS-AREA-001: hands back records in the shape the client already reads', async () => {
    const out = await make().placesInArea(BOX, 500);
    expect(mockArea).toHaveBeenCalledWith(BOX, 500);
    expect(out?.results[0]).toMatchObject({
      osm_id: 'gers:abc-123',
      name: "L'Osteria",
      source: 'trek-places',
    });
  });

  it('MAPS-AREA-002: passes truncation through instead of smoothing it over', async () => {
    // A client that believed it had the whole area would search offline and
    // quietly miss places.
    mockArea.mockResolvedValue({ results: [PLACE], truncated: true, count: 1 });
    expect((await make().placesInArea(BOX))?.truncated).toBe(true);
  });

  it('MAPS-AREA-003: returns null when the operator switched the index off', async () => {
    expect(await make(false).placesInArea(BOX)).toBeNull();
    expect(mockArea).not.toHaveBeenCalled();
  });

  it('MAPS-AREA-004: a service failure is a null, not a thrown sync', async () => {
    mockArea.mockRejectedValue(new Error('places api down'));
    await expect(make().placesInArea(BOX)).resolves.toBeNull();
  });

  it('MAPS-AREA-005: an empty area is an answer, not a failure', async () => {
    mockArea.mockResolvedValue({ results: [], truncated: false, count: 0 });
    expect(await make().placesInArea(BOX)).toEqual({ results: [], truncated: false });
  });

  it('MAPS-AREA-006: leaves the limit to the caller when none is given', async () => {
    await make().placesInArea(BOX);
    expect(mockArea).toHaveBeenCalledWith(BOX, undefined);
  });
});
