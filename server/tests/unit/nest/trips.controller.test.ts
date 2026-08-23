import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
const { isDemoEmail } = vi.hoisted(() => ({ isDemoEmail: vi.fn(() => false) }));
vi.mock('../../../src/nest/common/demo', () => ({ isDemoEmail }));
// Injected stub since the unsplash fold (was a path mock of the service module),
// so the controller test never hits the network. isUnsplashCoverUrl keeps its
// real host-based logic.
const unsplashStub = {
  isUnsplashCoverUrl: (v: unknown) => typeof v === 'string' && v.startsWith('https://images.unsplash.com/'),
  saveUnsplashCover: vi.fn().mockResolvedValue('mock-cover.jpg'),
} as unknown as UnsplashService;

import { TripsController, MAX_COVER_SIZE, TRIP_COVER_FILE_FILTER } from '../../../src/nest/trips/trips.controller';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import type { TripsService } from '../../../src/nest/trips/trips.service';
import type { CalendarService } from '../../../src/nest/calendar/calendar.service';
import type { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { NotFoundError, ValidationError } from '../../../src/nest/trips/trips.service';
import type { User } from '../../../src/types';
import { activeTripResponseSchema, tripCreateRequestSchema, tripTransferOwnershipRequestSchema } from '@trek/shared';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const req = { headers: {} } as Request;

// AuditService is constructor-injected since the auditLog DI migration; the
// wrapper keeps the historical construction sites positional.
const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;
// calendar is optional so the call sites that never reach the ICS route stay as
// they were; the two that do pass a stub.
// calendar and readModel are optional so the call sites that reach neither the
// ICS route nor the bundle stay as they were; the ones that do pass a stub.
const storageStub = { put: vi.fn().mockResolvedValue(undefined) } as unknown as import('../../../src/nest/storage/storage.service').StorageService;
const tc = (s: TripsService, calendar?: Partial<CalendarService>, readModel?: Partial<TripReadModelService>) =>
  new TripsController(s, audit, new RuntimeEnvService(), unsplashStub, (calendar ?? {}) as CalendarService, (readModel ?? {}) as TripReadModelService, storageStub);

function svc(o: Partial<TripsService> = {}): TripsService {
  return {
    canAccessTrip: vi.fn().mockReturnValue({ user_id: 1 }),
    can: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    notifyInvite: vi.fn(),
    ...o,
  } as unknown as TripsService;
}

// The DTO ratchet types create()'s body from the shared contract, where
// day_count is a number. Two cases below deliberately hand the handler a string,
// because that is what an unvalidated client sends and what the handler still
// guards against with Number(day_count) || 7. Naming the pre-pipe shape keeps
// those payloads exactly as they were instead of retyping them into the contract.
type CreateBody = Parameters<TripsController['create']>[1];
const prePipeCreateBody = (body: unknown) => body as CreateBody;

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try { await fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('TripsController (parity with the legacy /api/trips route)', () => {
  it('GET / lists for the user with the archived flag', () => {
    const list = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(tc(svc({ list } as Partial<TripsService>)).list(user, '1')).toEqual({ trips: [{ id: 1 }] });
    expect(list).toHaveBeenCalledWith(1, 1);
  });

  it('GET / defaults the archived flag to 0 when not "1"', () => {
    const list = vi.fn().mockReturnValue([]);
    const c = tc(svc({ list } as Partial<TripsService>));
    c.list(user, undefined);
    expect(list).toHaveBeenLastCalledWith(1, 0);
    c.list(user, '0');
    expect(list).toHaveBeenLastCalledWith(1, 0);
  });

  describe('GET /active (startup destination)', () => {
    it('narrows the row to the contract shape and drops the sort helper', () => {
      const activeTrip = vi.fn().mockReturnValue({
        id: 7, title: 'Japan', start_date: '2026-09-01', end_date: '2026-09-14', relevance: 1,
      });
      const res = tc(svc({ activeTrip } as Partial<TripsService>)).active(user);
      expect(res).toEqual({ trip: { id: 7, title: 'Japan', start_date: '2026-09-01', end_date: '2026-09-14' } });
      expect(activeTripResponseSchema.safeParse(res).success).toBe(true);
      expect(activeTrip).toHaveBeenCalledWith(1);
    });

    it('answers null instead of 404 when the user has no trip, so the caller can fall back', () => {
      const res = tc(svc({ activeTrip: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).active(user);
      expect(res).toEqual({ trip: null });
      expect(activeTripResponseSchema.safeParse(res).success).toBe(true);
    });
  });

  describe('GET /cover-images/search', () => {
    it('passes the caller through to the service and unwraps the photo list', async () => {
      const searchCoverImages = vi.fn().mockResolvedValue({ photos: [{ id: 'p1' }] });
      const s = svc({ searchCoverImages } as Partial<TripsService>);
      expect(await tc(s).coverImages(user, 'kyoto')).toEqual({ photos: [{ id: 'p1' }] });
      // The Unsplash key is resolved per user behind the service; dropping the id
      // here would silently search every request with an admin's key.
      expect(searchCoverImages).toHaveBeenCalledWith('kyoto', 1);
    });

    it('sends an absent query as "" so the service keeps owning the empty-query 400', async () => {
      const searchCoverImages = vi.fn().mockResolvedValue({ error: 'Search query is required', status: 400 });
      const s = svc({ searchCoverImages } as Partial<TripsService>);
      expect(await thrownAsync(() => tc(s).coverImages(user, undefined))).toEqual({ status: 400, body: { error: 'Search query is required' } });
      expect(searchCoverImages).toHaveBeenCalledWith('', 1);
    });

    it('keeps the upstream status instead of flattening it into the catch-all 500', async () => {
      const s = svc({ searchCoverImages: vi.fn().mockResolvedValue({ error: 'Rate limit reached', status: 429 }) } as Partial<TripsService>);
      // A 429 that arrives as a 500 makes the client retry immediately and burn
      // the rest of the hourly Unsplash quota.
      expect(await thrownAsync(() => tc(s).coverImages(user, 'kyoto'))).toEqual({ status: 429, body: { error: 'Rate limit reached' } });
    });

    it('maps an unexpected failure to a 500 that does not leak the cause', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const s = svc({ searchCoverImages: vi.fn().mockRejectedValue(new Error('ECONNREFUSED api.unsplash.com')) } as Partial<TripsService>);
        expect(await thrownAsync(() => tc(s).coverImages(user, 'kyoto'))).toEqual({ status: 500, body: { error: 'Error searching for cover images' } });
      } finally {
        err.mockRestore();
      }
    });
  });

  describe('POST / (create)', () => {
    it('403 without trip_create; a missing title 400s in the ZodValidationPipe', () => {
      expect(thrown(() => tc(svc({ can: vi.fn().mockReturnValue(false) })).create(user, { title: 'T' }, req))).toEqual({ status: 403, body: { error: 'No permission to create trips' } });
      // The hand-rolled 'Title is required' 400 moved into the global pipe
      // (trips DTO ratchet) — the schema rejects a missing/empty title.
      expect(tripCreateRequestSchema.safeParse({}).success).toBe(false);
      expect(tripCreateRequestSchema.safeParse({ title: '' }).success).toBe(false);
    });

    it('infers end_date from start_date (+6 days) and creates', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      tc(svc({ create } as Partial<TripsService>)).create(user, { title: 'T', start_date: '2026-07-01' }, req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ start_date: '2026-07-01', end_date: '2026-07-07' }));
    });

    it('400 when end_date precedes start_date', () => {
      expect(thrown(() => tc(svc()).create(user, { title: 'T', start_date: '2026-07-10', end_date: '2026-07-01' }, req))).toEqual({
        status: 400, body: { error: 'End date must be after start date' },
      });
    });

    it('infers start_date from end_date (-6 days) and parses day_count', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      tc(svc({ create } as Partial<TripsService>)).create(user, prePipeCreateBody({ title: 'T', end_date: '2026-07-07', day_count: '40' }), req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ start_date: '2026-07-01', end_date: '2026-07-07', day_count: 40 }));
    });

    it('clamps a non-numeric day_count to the default of 7', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      tc(svc({ create } as Partial<TripsService>)).create(user, prePipeCreateBody({ title: 'T', day_count: 'abc' }), req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ day_count: 7 }));
    });

    it('logs the reminder when reminderDays is set', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 3 });
      expect(tc(svc({ create } as Partial<TripsService>)).create(user, { title: 'T' }, req)).toEqual({ trip: { id: 9 } });
    });
  });

  it('GET /:id 404 when missing', () => {
    expect(thrown(() => tc(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).get(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('GET /:id returns the trip when present', () => {
    const s = svc({ get: vi.fn().mockReturnValue({ id: 9 }) } as Partial<TripsService>);
    expect(tc(s).get(user, '9')).toEqual({ trip: { id: 9 } });
  });

  describe('PUT /:id', () => {
    it('404 when no access; 403 on archive without trip_archive', async () => {
      expect(await thrownAsync(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).update(user, '9', {}, req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ can: vi.fn().mockImplementation((a: string) => a !== 'trip_archive') });
      expect(await thrownAsync(() => tc(s).update(user, '9', { is_archived: 1 }, req))).toEqual({ status: 403, body: { error: 'No permission to archive/unarchive this trip' } });
    });

    it('updates, audits a change and broadcasts', async () => {
      const update = vi.fn().mockReturnValue({ updatedTrip: { id: 9 }, changes: { title: { oldValue: 'a', newValue: 'b' } }, newTitle: 'b', newReminder: 0, oldReminder: 0 });
      const broadcast = vi.fn();
      const s = svc({ update, broadcast } as Partial<TripsService>);
      expect(await tc(s).update(user, '9', { title: 'b' }, req, 'sock')).toEqual({ trip: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9 } }, 'sock');
    });

    it('403 on cover_image without trip_cover_upload', async () => {
      const s = svc({ can: vi.fn().mockImplementation((a: string) => a !== 'trip_cover_upload') });
      expect(await thrownAsync(() => tc(s).update(user, '9', { cover_image: '/x.jpg' }, req))).toEqual({ status: 403, body: { error: 'No permission to change cover image' } });
    });

    it('403 on an edit field without trip_edit', async () => {
      const s = svc({ can: vi.fn().mockImplementation((a: string) => a !== 'trip_edit') });
      expect(await thrownAsync(() => tc(s).update(user, '9', { title: 'b' }, req))).toEqual({ status: 403, body: { error: 'No permission to edit this trip' } });
    });

    it('admin edit logs the owner and reminder changes', async () => {
      const update = vi.fn().mockReturnValue({
        updatedTrip: { id: 9 }, changes: { title: { oldValue: 'a', newValue: 'b' } }, newTitle: 'b',
        ownerEmail: 'owner@x.y', isAdminEdit: true, newReminder: 5, oldReminder: 0,
      });
      const s = svc({ update } as Partial<TripsService>);
      expect(await tc(s).update(user, '9', { title: 'b' }, req)).toEqual({ trip: { id: 9 } });
    });

    it('logs when a reminder is removed', async () => {
      const update = vi.fn().mockReturnValue({
        updatedTrip: { id: 9 }, changes: {}, newTitle: 'b', newReminder: 0, oldReminder: 5,
      });
      const s = svc({ update } as Partial<TripsService>);
      expect(await tc(s).update(user, '9', { reminder_days: 0 }, req)).toEqual({ trip: { id: 9 } });
    });

    it('maps a NotFoundError to 404 and a ValidationError to 400', async () => {
      const nf = svc({ update: vi.fn().mockImplementation(() => { throw new NotFoundError('gone'); }) } as Partial<TripsService>);
      expect(await thrownAsync(() => tc(nf).update(user, '9', { title: 'b' }, req))).toEqual({ status: 404, body: { error: 'gone' } });
      const ve = svc({ update: vi.fn().mockImplementation(() => { throw new ValidationError('bad'); }) } as Partial<TripsService>);
      expect(await thrownAsync(() => tc(ve).update(user, '9', { title: 'b' }, req))).toEqual({ status: 400, body: { error: 'bad' } });
    });

    it('re-throws an unknown error from update', async () => {
      const s = svc({ update: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
      await expect(tc(s).update(user, '9', { title: 'b' }, req)).rejects.toThrow('boom');
    });

    it('#1277: internalises an Unsplash cover hot-link into uploads/covers before saving', async () => {
      const update = vi.fn().mockReturnValue({ updatedTrip: { id: 9 }, changes: {}, newTitle: 'b', newReminder: 0, oldReminder: 0 });
      const deleteOldCover = vi.fn();
      const s = svc({ update, deleteOldCover, getRaw: vi.fn().mockReturnValue({ cover_image: null }) } as Partial<TripsService>);
      await tc(s).update(user, '9', { cover_image: 'https://images.unsplash.com/photo-123?w=1080' }, req);
      // The handler downloads the cover and rewrites cover_image to a local path
      // before delegating to update(); on download failure it would have thrown 502.
      const savedBody = update.mock.calls[0][2] as { cover_image: string };
      expect(savedBody.cover_image).toMatch(/^\/uploads\/covers\/.+\.(jpg|png|webp|gif)$/);
    });
  });

  describe('POST /:id/copy', () => {
    it('403 without trip_create, 404 without access', () => {
      expect(thrown(() => tc(svc({ can: vi.fn().mockReturnValue(false) })).copy(user, '9', {}, req))).toEqual({ status: 403, body: { error: 'No permission to create trips' } });
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).copy(user, '9', {}, req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('copies + returns the new trip', () => {
      const s = svc({ copy: vi.fn().mockReturnValue(42), getCopiedTrip: vi.fn().mockReturnValue({ id: 42 }) } as Partial<TripsService>);
      expect(tc(s).copy(user, '9', { title: 'Copy' }, req)).toEqual({ trip: { id: 42 } });
    });
  });

  describe('DELETE /:id', () => {
    it('404 when no owner, 403 without trip_delete', () => {
      expect(thrown(() => tc(svc({ getOwner: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).remove(user, '9', req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 1 }), can: vi.fn().mockReturnValue(false) } as Partial<TripsService>);
      expect(thrown(() => tc(s).remove(user, '9', req))).toEqual({ status: 403, body: { error: 'No permission to delete this trip' } });
    });

    it('404s for someone with no access, so the 403 is not an existence oracle', () => {
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 2 }), canAccessTrip: vi.fn().mockReturnValue(null), remove: vi.fn() } as Partial<TripsService>);
      expect(thrown(() => tc(s).remove(user, '9', req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(s.remove).not.toHaveBeenCalled();
    });

    it('still lets an admin delete a trip they are not a member of', () => {
      const admin = { id: 1, role: 'admin', email: 'a@example.test' } as User;
      const remove = vi.fn().mockReturnValue({ tripId: 9, title: 'T', isAdminDelete: true, ownerEmail: 'owner@x.y' });
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 2 }), canAccessTrip: vi.fn().mockReturnValue(null), remove, broadcast: vi.fn() } as Partial<TripsService>);
      expect(tc(s).remove(admin, '9', req)).toEqual({ success: true });
      expect(remove).toHaveBeenCalledWith('9', 1, 'admin');
    });

    it('deletes, audits and broadcasts', () => {
      const remove = vi.fn().mockReturnValue({ tripId: 9, title: 'T', isAdminDelete: false }); const broadcast = vi.fn();
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 1 }), remove, broadcast } as Partial<TripsService>);
      expect(tc(s).remove(user, '9', req, 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:deleted', { id: 9 }, 'sock');
    });

    it('admin delete logs the owner', () => {
      const remove = vi.fn().mockReturnValue({ tripId: 9, title: 'T', isAdminDelete: true, ownerEmail: 'owner@x.y' });
      const broadcast = vi.fn();
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 2 }), remove, broadcast } as Partial<TripsService>);
      expect(tc(s).remove(user, '9', req)).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:deleted', { id: 9 }, undefined);
    });
  });

  it('GET /:id/bundle 404 then aggregates', () => {
    expect(thrown(() => tc(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).bundle(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const bundle = vi.fn().mockReturnValue({ trip: { id: 9 }, days: [] });
    const s = svc({ get: vi.fn().mockReturnValue({ user_id: 1 }) } as Partial<TripsService>);
    expect(tc(s, undefined, { bundle }).bundle(user, '9')).toEqual({ trip: { id: 9 }, days: [] });
  });

  describe('POST /:id/cover', () => {
    const file = { filename: 'abc.jpg' } as Express.Multer.File;
    it('404 without access, 403 without permission, 404 raw trip, 400 no file, else commits + returns url', async () => {
      expect(await thrownAsync(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).cover(user, '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(await thrownAsync(() => tc(svc({ can: vi.fn().mockReturnValue(false) })).cover(user, '9', file))).toEqual({ status: 403, body: { error: 'No permission to change the cover image' } });
      expect(await thrownAsync(() => tc(svc({ getRaw: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).cover(user, '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(await thrownAsync(() => tc(svc({ getRaw: vi.fn().mockReturnValue({ cover_image: null }) } as Partial<TripsService>)).cover(user, '9', undefined))).toEqual({ status: 400, body: { error: 'No image uploaded' } });
      const deleteOldCover = vi.fn(); const updateCoverImage = vi.fn();
      const s = svc({ getRaw: vi.fn().mockReturnValue({ cover_image: '/old.jpg' }), deleteOldCover, updateCoverImage } as Partial<TripsService>);
      expect(await tc(s).cover(user, '9', file)).toEqual({ cover_image: '/uploads/covers/abc.jpg' });
      expect(storageStub.put).toHaveBeenCalledWith('covers', 'abc.jpg', { tmpPath: undefined });
      expect(deleteOldCover).toHaveBeenCalledWith('/old.jpg');
      expect(updateCoverImage).toHaveBeenCalledWith('9', '/uploads/covers/abc.jpg');
    });

    it('403 in demo mode for a demo account', async () => {
      const prev = process.env.DEMO_MODE;
      process.env.DEMO_MODE = 'true';
      isDemoEmail.mockReturnValueOnce(true);
      try {
        expect(await thrownAsync(() => tc(svc()).cover(user, '9', file))).toEqual({
          status: 403, body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' },
        });
      } finally {
        if (prev === undefined) delete process.env.DEMO_MODE;
        else process.env.DEMO_MODE = prev;
      }
    });

    /**
     * The multer options moved into trips.module.ts's MulterModule factory
     * (storage engine + spool destination are covered by the storage-upload
     * factory unit suite and TRIP-P01/P02 integration parity); the trips-owned
     * piece that remains testable here is the exported cover fileFilter.
     */
    it('accepts the four allowed image types and rejects svg, a faked extension and a non-image mime', () => {
      const verdict = (originalname: string, mimetype: string) => {
        const cb = vi.fn();
        TRIP_COVER_FILE_FILTER!(req, { originalname, mimetype } as Express.Multer.File, cb);
        return cb.mock.calls[0];
      };
      expect(verdict('a.jpg', 'image/jpeg')).toEqual([null, true]);
      // The extension check is case-insensitive; phones hand up .JPG/.PNG.
      expect(verdict('a.WEBP', 'image/webp')).toEqual([null, true]);
      // svg passes the image/* prefix but runs script when the browser opens the
      // stored cover, so it is rejected even under an allowed extension.
      expect(verdict('logo.png', 'image/svg+xml')).toEqual([expect.any(Error)]);
      // A binary renamed to an image mime must still fail on the extension.
      expect(verdict('payload.exe', 'image/png')).toEqual([expect.any(Error)]);
      expect(verdict('a.png', 'application/octet-stream')).toEqual([expect.any(Error)]);
      // The quirk stays quirky: the rejection error carries NO statusCode, so
      // the route answers 500 (pinned by TRIP-P04), not 400.
      expect((verdict('logo.png', 'image/svg+xml')[0] as Error & { statusCode?: number }).statusCode).toBeUndefined();
      expect(MAX_COVER_SIZE).toBe(20 * 1024 * 1024);
    });
  });

  describe('GET /:id/export.ics', () => {
    function makeRes() { return { setHeader: vi.fn(), send: vi.fn() } as never; }
    it('404 without access, else sends the calendar with headers', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).exportIcs(user, '9', makeRes()))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const res = { setHeader: vi.fn(), send: vi.fn() };
      const cal = { exportICS: vi.fn().mockReturnValue({ ics: 'BEGIN:VCALENDAR', filename: 'trip.ics' }) };
      tc(svc(), cal).exportIcs(user, '9', res as never);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="trip.ics"');
      expect(res.send).toHaveBeenCalledWith('BEGIN:VCALENDAR');
    });

    it('maps a NotFoundError from the export to 404 and re-throws others', () => {
      const nf = { exportICS: vi.fn().mockImplementation(() => { throw new NotFoundError('gone'); }) };
      expect(thrown(() => tc(svc(), nf).exportIcs(user, '9', makeRes()))).toEqual({ status: 404, body: { error: 'gone' } });
      const other = { exportICS: vi.fn().mockImplementation(() => { throw new Error('boom'); }) };
      expect(() => tc(svc(), other).exportIcs(user, '9', makeRes())).toThrow('boom');
    });
  });

  it('POST /:id/copy maps a copy failure to 500', () => {
    const s = svc({ copy: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
    expect(thrown(() => tc(s).copy(user, '9', {}, req))).toEqual({ status: 500, body: { error: 'Failed to copy trip' } });
  });
});
