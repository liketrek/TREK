import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ReservationImportController } from '../../../../src/nest/reservation-import/reservation-import.controller';
import type { BookingImportService } from '../../../../src/nest/booking-import/booking-import.service';
import type { User } from '../../../../src/types';

const user = { id: 1, role: 'user' } as User;
const file = (name = 'a.pdf') => ({ originalname: name, buffer: Buffer.from('x') } as Express.Multer.File);

function make(over: Partial<BookingImportService> = {}) {
  const svc = {
    verifyTripAccess: vi.fn(() => ({ user_id: 1 })),
    canEdit: vi.fn(() => true),
    isAvailable: vi.fn(() => true),
    aiAvailable: vi.fn(() => true),
    preview: vi.fn(async () => ({ items: [], warnings: [], files: [] })),
    ...over,
  } as unknown as BookingImportService;
  // airtrailImport is the third slot; these cases never reach it.
  return { c: new ReservationImportController(svc, undefined as never, undefined as never), svc };
}

async function status(fn: () => Promise<unknown>): Promise<number> {
  try { await fn(); } catch (e) { expect(e).toBeInstanceOf(HttpException); return (e as HttpException).getStatus(); }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('ReservationImportController.preview', () => {
  it('rejects an invalid mode with 400', async () => {
    const { c } = make();
    expect(await status(() => c.preview(user, 't1', [file()], { mode: 'bogus' }))).toBe(400);
  });

  it('returns 409 for force-ai when AI is not configured', async () => {
    const { c } = make({ aiAvailable: vi.fn(() => false) as any });
    expect(await status(() => c.preview(user, 't1', [file()], { mode: 'force-ai' }))).toBe(409);
  });

  it('returns 503 for no-ai when the extractor is unavailable', async () => {
    const { c } = make({ isAvailable: vi.fn(() => false) as any });
    expect(await status(() => c.preview(user, 't1', [file()], { mode: 'no-ai' }))).toBe(503);
  });

  it('returns 400 when no files are uploaded', async () => {
    const { c } = make();
    expect(await status(() => c.preview(user, 't1', [], { mode: 'no-ai' }))).toBe(400);
  });

  it('passes the parsed mode and user id through to the service', async () => {
    const { c, svc } = make();
    await c.preview(user, 't1', [file()], { mode: 'fallback-on-empty' });
    expect(svc.preview).toHaveBeenCalledWith([expect.anything()], 'fallback-on-empty', 1);
  });

  it('defaults the mode to no-ai when omitted', async () => {
    const { c, svc } = make();
    await c.preview(user, 't1', [file()], {});
    expect(svc.preview).toHaveBeenCalledWith([expect.anything()], 'no-ai', 1);
  });
});
