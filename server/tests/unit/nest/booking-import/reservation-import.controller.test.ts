import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, type Type } from '@nestjs/common';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
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
    readsImages: vi.fn(async () => true),
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

  it('takes a photo when the model reads images, without asking otherwise', async () => {
    const { c, svc } = make();
    await c.preview(user, 't1', [file('ticket.JPG')], { mode: 'fallback-on-empty' });
    expect(svc.preview).toHaveBeenCalledWith([expect.anything()], 'fallback-on-empty', 1);
    (svc.readsImages as ReturnType<typeof vi.fn>).mockClear();
    await c.preview(user, 't1', [file('a.pdf')], { mode: 'fallback-on-empty' });
    expect(svc.readsImages).not.toHaveBeenCalled();
  });

  it('refuses a photo with 400 when the model does not read images, or AI is not asked', async () => {
    const { c, svc } = make({ readsImages: vi.fn(async () => false) });
    expect(await status(() => c.preview(user, 't1', [file('a.pdf'), file('ticket.png')], { mode: 'fallback-on-empty' }))).toBe(400);
    const { c: c2 } = make();
    expect(await status(() => c2.preview(user, 't1', [file('ticket.png')], { mode: 'no-ai' }))).toBe(400);
    expect(svc.preview).not.toHaveBeenCalled();
  });

  it('still refuses a file type it does not know, HEIC included', async () => {
    const { c } = make();
    expect(await status(() => c.preview(user, 't1', [file('IMG_1.heic')], { mode: 'fallback-on-empty' }))).toBe(400);
  });

  it('names the photo formats in that refusal too', async () => {
    const { c } = make();
    const err = await c.preview(user, 't1', [file('IMG_1.heic')], { mode: 'fallback-on-empty' }).catch((e: unknown) => e);
    expect((err as HttpException).getResponse()).toEqual({
      error: 'Unsupported file type: IMG_1.heic. Accepted: EML, PDF, PKPass, HTML, TXT, JPG, JPEG, PNG, WEBP (photos when the AI model reads images)',
    });
  });

  it('defaults the mode to no-ai when omitted', async () => {
    const { c, svc } = make();
    await c.preview(user, 't1', [file()], {});
    expect(svc.preview).toHaveBeenCalledWith([expect.anything()], 'no-ai', 1);
  });
});

/**
 * Multer decodes a multipart filename as latin1 unless told otherwise, and the
 * booking import did not tell it: "Bestätigung.pdf" reached the warnings as
 * "BestÃ¤tigung.pdf", and the review could not attach the file it no longer
 * recognised by name (#2477). Read off the interceptor both upload routes carry.
 */
describe('ReservationImportController upload options', () => {
  const multerOf = (handler: keyof ReservationImportController) => {
    const [Interceptor] = Reflect.getMetadata(INTERCEPTORS_METADATA, ReservationImportController.prototype[handler]) as Type<{ multer: { defParamCharset: string; limits: unknown } }>[];
    return new Interceptor().multer;
  };

  it.each(['preview', 'previewAsync'] as const)('%s decodes non-ASCII filenames as UTF-8', (handler) => {
    const multer = multerOf(handler);
    expect(multer.defParamCharset).toBe('utf8');
    expect(multer.limits).toEqual({ fileSize: 10 * 1024 * 1024, files: 5 });
  });
});
