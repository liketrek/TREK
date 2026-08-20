import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';

// Mock the heavy side-effect imports so the service module loads cleanly; the
// preview() path under test only touches the extractor + llmParse deps.
vi.mock('../../../../src/db/database', () => ({
  db: { prepare: vi.fn() }, closeDb: () => {}, reinitialize: () => {},
  // Trip access reaches these through DatabaseService; preview() never calls
  // them, but the module-level import has to resolve.
  canAccessTrip: vi.fn(), isOwner: () => false, getPlaceWithTags: () => null,
}));
import { db as dbConn } from '../../../../src/db/database';
import { DatabaseService } from '../../../../src/nest/database/database.service';
vi.mock('../../../../src/websocket', () => ({ broadcast: vi.fn() }));
const permissionsStub = { checkPermission: vi.fn(() => true) };

import { BookingImportService } from '../../../../src/nest/booking-import/booking-import.service';

const HOTEL_KI = { '@type': 'LodgingReservation', reservationNumber: 'ABC', reservationFor: { name: 'Hotel X' }, checkinTime: '2026-06-11T15:00', checkoutTime: '2026-06-12T11:00' };
const file = (name = 'a.pdf') => ({ buffer: Buffer.from('x'), originalname: name } as any);

function make(opts: { kit?: boolean; ai?: boolean; extract?: any; parse?: any }) {
  const extractor = { isAvailable: () => opts.kit ?? false, extract: vi.fn(opts.extract ?? (async () => [])) };
  const llmParse = { isAvailable: () => opts.ai ?? false, parse: vi.fn(opts.parse ?? (async () => ({ kiItems: [], warnings: [] }))) };
  const reservations = { create: vi.fn() };
  // budget/addons/realtime/maps ride the confirm() path only — the preview()
  // tests never reach them, so stubs beyond the positional slots aren't needed.
  const maps = { searchNominatim: vi.fn() };
  // Places became a constructor dep with the place DI fold (was a path mock of
  // services/placeService); only confirm() reaches it, so a bare create stub does.
  const places = { create: vi.fn() };
  return { svc: new BookingImportService(extractor as any, llmParse as any, new DatabaseService(dbConn), reservations as never, permissionsStub as never, undefined as never, undefined as never, undefined as never, maps as never, places as never), extractor, llmParse, reservations, maps, places };
}

beforeEach(() => vi.clearAllMocks());

describe('BookingImportService.preview', () => {
  it('no-ai: maps kitinerary items, does not force needs_review, reports aiUsed:false', async () => {
    const { svc, llmParse } = make({ kit: true, ai: false, extract: async () => [HOTEL_KI] });
    const res = await svc.preview([file()], 'no-ai', 1);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].needs_review).toBeFalsy();
    expect(res.files).toEqual([{ fileName: 'a.pdf', aiAvailable: false, aiUsed: false }]);
    expect(llmParse.parse).not.toHaveBeenCalled();
  });

  it('throws 503 when neither parser is available', async () => {
    const { svc } = make({ kit: false, ai: false });
    try {
      await svc.preview([file()], 'no-ai', 1);
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(503);
    }
  });

  it('fallback-on-empty: runs the LLM when kitinerary finds nothing and flags needs_review', async () => {
    const { svc, extractor, llmParse } = make({
      kit: true, ai: true,
      extract: async () => [],
      parse: async () => ({ kiItems: [HOTEL_KI], warnings: [] }),
    });
    const res = await svc.preview([file()], 'fallback-on-empty', 1);
    expect(extractor.extract).toHaveBeenCalled();
    expect(llmParse.parse).toHaveBeenCalled();
    expect(res.items).toHaveLength(1);
    expect(res.items[0].needs_review).toBe(true);
    expect(res.files![0]).toEqual({ fileName: 'a.pdf', aiAvailable: true, aiUsed: true });
  });

  it('fallback-on-empty: skips the LLM when kitinerary already found items', async () => {
    const { svc, llmParse } = make({ kit: true, ai: true, extract: async () => [HOTEL_KI] });
    const res = await svc.preview([file()], 'fallback-on-empty', 1);
    expect(llmParse.parse).not.toHaveBeenCalled();
    expect(res.files![0].aiUsed).toBe(false);
  });

  it('force-ai: skips kitinerary entirely and uses the LLM', async () => {
    const { svc, extractor, llmParse } = make({
      kit: true, ai: true,
      parse: async () => ({ kiItems: [HOTEL_KI], warnings: [] }),
    });
    const res = await svc.preview([file()], 'force-ai', 1);
    expect(extractor.extract).not.toHaveBeenCalled();
    expect(llmParse.parse).toHaveBeenCalled();
    expect(res.items[0].needs_review).toBe(true);
  });
});

/**
 * Endpoints that arrive without coordinates (#1969).
 *
 * kitinerary and the LLM name stations, stops, terminals and rental desks but
 * rarely geo-locate them — only airports come with coordinates, from the
 * mapper's own table. `reservation_endpoints.lat`/`lng` are NOT NULL, so
 * `saveEndpoints` drops anything without them.
 *
 * The lookup that was meant to fill them in lived in confirm(), which nothing
 * calls: both the desktop planner and mobile go preview -> review form ->
 * ordinary save. So a named endpoint showed up in the review step's From -> To
 * summary and then vanished on save, with nothing logged and nothing shown.
 *
 * These run against preview(), because that is the path that exists.
 */
describe('BookingImportService.preview endpoint geocoding (#1969)', () => {
  const TRAIN_KI = {
    '@type': 'TrainReservation',
    reservationNumber: 'TR1',
    reservationFor: {
      trainNumber: 'ICE 597',
      departureStation: { name: 'Berlin Hbf' },
      arrivalStation: { name: 'München Hbf' },
      departureTime: '2026-06-11T08:00:00',
      arrivalTime: '2026-06-11T12:00:00',
    },
  };

  const hit = (lat: number, lng: number) => [{ lat, lng, display_name: 'x' }];

  it('gives a named station coordinates, so it survives the save', async () => {
    const { svc, maps } = make({ kit: true, extract: async () => [TRAIN_KI] });
    maps.searchNominatim.mockResolvedValue(hit(52.525, 13.369));

    const res = await svc.preview([file()], 'no-ai', 1);
    const endpoints = (res.items[0] as { endpoints?: { lat: number | null }[] }).endpoints ?? [];
    expect(endpoints.length).toBeGreaterThan(0);
    for (const ep of endpoints) expect(ep.lat).not.toBeNull();
  });

  it('asks the same station only once, however often it appears', async () => {
    const { svc, maps } = make({
      kit: true,
      // Two legs out of and back into the same station.
      extract: async () => [TRAIN_KI, TRAIN_KI],
    });
    maps.searchNominatim.mockResolvedValue(hit(52.525, 13.369));

    await svc.preview([file()], 'no-ai', 1);
    // Two distinct names across four endpoints — Nominatim allows about one
    // request a second on this lane, so repeats have to come from the cache.
    expect(maps.searchNominatim).toHaveBeenCalledTimes(2);
  });

  /*
   * The half that made this so hard to notice: the endpoint disappeared without
   * a word. It stays on the item now, so the review form can still show and
   * edit it, and the preview says what it could not place.
   */
  it('keeps an endpoint it cannot place, and says so', async () => {
    const { svc, maps } = make({ kit: true, extract: async () => [TRAIN_KI] });
    maps.searchNominatim.mockResolvedValue([]);

    const res = await svc.preview([file()], 'no-ai', 1);
    const endpoints = (res.items[0] as { endpoints?: { name: string }[] }).endpoints ?? [];
    expect(endpoints.map(e => e.name)).toContain('Berlin Hbf');
    expect(res.warnings.some(w => w.includes('Berlin Hbf'))).toBe(true);
  });

  it('survives a geocoder that throws, rather than failing the import', async () => {
    const { svc, maps } = make({ kit: true, extract: async () => [TRAIN_KI] });
    maps.searchNominatim.mockRejectedValue(new Error('nominatim down'));

    const res = await svc.preview([file()], 'no-ai', 1);
    expect(res.items).toHaveLength(1);
  });

  it('does not look up an endpoint that already knows where it is', async () => {
    const withGeo = {
      ...TRAIN_KI,
      reservationFor: {
        ...TRAIN_KI.reservationFor,
        departureStation: { name: 'Berlin Hbf', geo: { latitude: 52.525, longitude: 13.369 } },
        arrivalStation: { name: 'München Hbf', geo: { latitude: 48.140, longitude: 11.558 } },
      },
    };
    const { svc, maps } = make({ kit: true, extract: async () => [withGeo] });

    await svc.preview([file()], 'no-ai', 1);
    expect(maps.searchNominatim).not.toHaveBeenCalled();
  });
});
