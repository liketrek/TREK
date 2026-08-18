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
  // budget/addons/realtime ride the confirm() path only — the preview() tests never
  // reach them, so stubs beyond the positional slots aren't needed. maps IS reached:
  // preview() geocodes uncoordinated endpoints.
  const maps = { searchNominatim: vi.fn(async (): Promise<{ lat: number | null; lng: number | null }[]> => []) };
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

// A rental car is the clearest case: kitinerary gives the desk a name and an address
// but no geo, so every endpoint arrives uncoordinated. Without geocoding here they are
// dropped at save time by saveEndpoints() (reservation_endpoints.lat/lng are NOT NULL).
const carKi = (pickup: Record<string, unknown>) => ({
  '@type': 'RentalCarReservation',
  reservationNumber: 'CAR1',
  reservationFor: { name: 'Midsize SUV', rentalCompany: { name: 'Acme' } },
  pickupTime: '2026-09-10T14:00:00',
  dropoffTime: '2026-09-12T14:00:00',
  pickupLocation: pickup,
});

describe('BookingImportService.preview — endpoint geocoding', () => {
  it('geocodes an uncoordinated endpoint by name, on the background lane', async () => {
    const { svc, maps } = make({ kit: true, extract: async () => [carKi({ name: 'Eastport Central Depot' })] });
    maps.searchNominatim.mockResolvedValue([{ lat: 10, lng: 20 }]);

    const res = await svc.preview([file()], 'no-ai', 1);

    expect(res.items[0].endpoints).toEqual([expect.objectContaining({ name: 'Eastport Central Depot', lat: 10, lng: 20 })]);
    expect(maps.searchNominatim).toHaveBeenCalledTimes(1);
    expect(maps.searchNominatim).toHaveBeenCalledWith('Eastport Central Depot', undefined, 'background');
  });

  it('falls back to the address when the name alone does not resolve', async () => {
    const { svc, maps } = make({
      kit: true,
      extract: async () => [carKi({ name: 'Curbside Counter 7', address: '1 Terminal Way, Eastport' })],
    });
    maps.searchNominatim
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ lat: 11, lng: 21 }]);

    const res = await svc.preview([file()], 'no-ai', 1);

    expect(res.items[0].endpoints![0]).toEqual(expect.objectContaining({ lat: 11, lng: 21 }));
    expect(maps.searchNominatim).toHaveBeenNthCalledWith(2, '1 Terminal Way, Eastport', undefined, 'background');
  });

  it('keeps an unresolvable endpoint and warns that it will not be saved', async () => {
    const { svc, maps } = make({
      kit: true,
      extract: async () => [carKi({ name: 'Curbside Counter 7', address: 'somewhere unmappable' })],
    });
    maps.searchNominatim.mockResolvedValue([]);

    const res = await svc.preview([file('rental.pdf')], 'no-ai', 1);

    // Kept, not filtered: it still shows in the review form's From→To so the user
    // can set the location by hand.
    expect(res.items[0].endpoints).toHaveLength(1);
    expect(res.items[0].endpoints![0]).toEqual(expect.objectContaining({ name: 'Curbside Counter 7', lat: null, lng: null }));
    expect(res.warnings.some(w => w.includes('could not locate "Curbside Counter 7"'))).toBe(true);
  });

  it('does not re-query an endpoint that already has coordinates', async () => {
    const { svc, maps } = make({
      kit: true,
      extract: async () => [carKi({ name: 'Eastport Depot', geo: { latitude: 1, longitude: 2 } })],
    });

    const res = await svc.preview([file()], 'no-ai', 1);

    expect(maps.searchNominatim).not.toHaveBeenCalled();
    expect(res.items[0].endpoints![0]).toEqual(expect.objectContaining({ lat: 1, lng: 2 }));
  });

  it('treats a geocoder failure as non-fatal and still returns the booking', async () => {
    const { svc, maps } = make({ kit: true, extract: async () => [carKi({ name: 'Eastport Central Depot' })] });
    maps.searchNominatim.mockRejectedValue(new Error('nominatim unreachable'));

    const res = await svc.preview([file()], 'no-ai', 1);

    expect(res.items).toHaveLength(1);
    expect(res.items[0].endpoints![0]).toEqual(expect.objectContaining({ lat: null, lng: null }));
    expect(res.warnings.some(w => w.includes('could not locate'))).toBe(true);
  });

  it('strips the transient address so the response matches the wire contract', async () => {
    const { svc, maps } = make({
      kit: true,
      extract: async () => [carKi({ name: 'Curbside Counter 7', address: '1 Terminal Way, Eastport' })],
    });
    maps.searchNominatim.mockResolvedValue([{ lat: 1, lng: 2 }]);

    const res = await svc.preview([file()], 'no-ai', 1);

    expect(res.items[0].endpoints![0]).not.toHaveProperty('address');
  });
});
