/**
 * The booking import as the assistant uses it: what it refuses to read, how it
 * reads a file (the AI only where the extractor finds nothing, at most a
 * step's worth of bookings), and the checks a booking passes when the user
 * applies it, the same an MCP write runs.
 */
import { AssistantBookingImportService } from '../../../../src/nest/assistant/assistant-booking-import.service';
import { MAX_WRITES_PER_STEP } from '../../../../src/nest/assistant/assistant-tools.constants';
import { BookingImportService } from '../../../../src/nest/booking-import/booking-import.service';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { McpToolGuardsService } from '../../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import { Test } from '@nestjs/testing';
import type { BookingImportPreviewItem } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const ITEM: BookingImportPreviewItem = {
  type: 'train',
  title: 'ICE 123',
  reservation_time: '2026-06-11T08:00',
  source: { fileName: 'ice.pdf', index: 0 },
};

function file(name: string): Express.Multer.File {
  return { originalname: name, buffer: Buffer.from('x'), size: 1 } as Express.Multer.File;
}

interface Opts {
  extractor?: boolean;
  ai?: boolean;
  images?: boolean;
  demo?: boolean;
  trip?: boolean;
  right?: boolean;
}

async function make(opts: Opts = {}) {
  const bookingImport = {
    isAvailable: vi.fn(() => opts.extractor !== false),
    aiAvailable: vi.fn(async () => opts.ai === true),
    readsImages: vi.fn(async () => opts.images === true),
    preview: vi.fn(async (_files: Express.Multer.File[], _mode: string, _userId: number) => ({
      items: Array.from({ length: MAX_WRITES_PER_STEP + 2 }, (_, index) => ({ ...ITEM, title: `Leg ${index}` })),
      warnings: [],
    })),
    confirm: vi.fn(async () => ({ created: [{ id: 81, title: 'ICE 123', type: 'train', day_id: 31 }] })),
  };
  const trips = { findAccessible: vi.fn(async () => (opts.trip === false ? undefined : { id: 5, user_id: 7 })) };
  const guards = { hasTripPermission: vi.fn(async () => opts.right !== false) };
  const demo = { isDemoUserId: vi.fn(async () => opts.demo === true) };
  const moduleRef = await Test.createTestingModule({
    providers: [
      AssistantBookingImportService,
      { provide: BookingImportService, useValue: bookingImport },
      { provide: TripAccessService, useValue: trips },
      { provide: McpToolGuardsService, useValue: guards },
      { provide: DemoService, useValue: demo },
    ],
  }).compile();
  return { service: moduleRef.get(AssistantBookingImportService), bookingImport, trips, guards };
}

async function codeOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (err) {
    return err instanceof DomainError ? String(err.details?.code) : 'unexpected';
  }
}

describe('AssistantBookingImportService', () => {
  it('ASTBKI-001: refuses a file nothing here reads, and a photo the model cannot see', async () => {
    const readable = async (opts: Opts, name: string) =>
      codeOf((await make(opts)).service.ensureReadable(7, file(name)));
    expect(await readable({ extractor: false }, 'a.pdf')).toBe('import_unavailable');
    expect(await readable({ extractor: false, ai: true }, 'a.pdf')).toBeNull();
    expect(await readable({}, 'a.pdf')).toBeNull();
    expect(await readable({}, 'scan.jpg')).toBe('import_unavailable');
    expect(await readable({ ai: true }, 'scan.jpg')).toBe('import_unavailable');
    expect(await readable({ ai: true, images: true }, 'scan.jpg')).toBeNull();
  });

  it("ASTBKI-002: reads with the AI only as a fallback, and keeps a step's worth of bookings", async () => {
    const plain = await make();
    const items = await plain.service.read(7, file('a.pdf'));
    const given = expect.objectContaining({ originalname: 'a.pdf' });
    expect(plain.bookingImport.preview).toHaveBeenCalledWith([given], 'no-ai', 7);
    expect(items).toHaveLength(MAX_WRITES_PER_STEP);
    const ai = await make({ ai: true });
    await ai.service.read(7, file('a.pdf'));
    expect(ai.bookingImport.preview.mock.calls[0][1]).toBe('fallback-on-empty');
  });

  it('ASTBKI-003: an applied booking is created through the import, on the trip, without a socket', async () => {
    const t = await make();
    const run = await t.service.apply(7, 5, { ...ITEM });
    const reservation = { id: 81, title: 'ICE 123', type: 'train', day_id: 31 };
    expect(run).toEqual({ ok: true, value: { reservation } });
    expect(t.bookingImport.confirm).toHaveBeenCalledWith('5', [ITEM], undefined);
    expect(t.trips.findAccessible).toHaveBeenCalledWith(5, 7);
    expect(t.guards.hasTripPermission).toHaveBeenCalledWith('reservation_edit', 5, 7);
  });

  it('ASTBKI-004: refused for a demo account, off the trip, without the right, or when broken', async () => {
    const refused = async (opts: Parameters<typeof make>[0]) => {
      const t = await make(opts);
      expect(await t.service.apply(7, 5, { ...ITEM })).toEqual({
        ok: false,
        value: 'You are not allowed to add bookings to this trip.',
      });
      expect(t.bookingImport.confirm).not.toHaveBeenCalled();
    };
    await Promise.all([{ demo: true }, { trip: false }, { right: false }].map(refused));
    const broken = await make();
    expect(await broken.service.apply(7, 5, { title: '' })).toEqual({
      ok: false,
      value: 'This booking can no longer be read.',
    });
    const none = await make();
    none.bookingImport.confirm.mockResolvedValueOnce({ created: [] });
    const notAdded = await none.service.apply(7, 5, { ...ITEM });
    expect(notAdded).toEqual({ ok: false, value: 'The booking could not be added.' });
  });
});
