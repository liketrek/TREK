import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';

// Mock the heavy side-effect imports so the service module loads cleanly; the
// preview() path under test only touches the extractor + llmParse deps.
vi.mock('../../../../src/db/database', () => ({ db: { prepare: vi.fn() }, closeDb: () => {}, reinitialize: () => {} }));
import { db as dbConn } from '../../../../src/db/database';
import { DatabaseService } from '../../../../src/nest/database/database.service';
vi.mock('../../../../src/websocket', () => ({ broadcast: vi.fn() }));
const permissionsStub = { checkPermission: vi.fn(() => true) };
vi.mock('../../../../src/services/tripAccess', () => ({ verifyTripAccess: vi.fn() }));

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
