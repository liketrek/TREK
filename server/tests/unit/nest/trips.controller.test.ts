import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
const { isDemoEmail } = vi.hoisted(() => ({ isDemoEmail: vi.fn(() => false) }));
vi.mock('../../../src/nest/common/demo', () => ({ isDemoEmail }));
// Mock the Unsplash cover internalisation so the controller test never hits the
// network; isUnsplashCoverUrl keeps its real (host-based) logic.
vi.mock('../../../src/services/unsplashService', () => ({
  isUnsplashCoverUrl: (v: unknown) => typeof v === 'string' && v.startsWith('https://images.unsplash.com/'),
  saveUnsplashCover: vi.fn().mockResolvedValue('mock-cover.jpg'),
}));

import { TripsController } from '../../../src/nest/trips/trips.controller';
import type { TripsService } from '../../../src/nest/trips/trips.service';
import { NotFoundError, ValidationError } from '../../../src/nest/trips/trips.service';
import type { User } from '../../../src/types';
import { tripCreateRequestSchema, tripTransferOwnershipRequestSchema } from '@trek/shared';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const req = { headers: {} } as Request;

// AuditService is constructor-injected since the auditLog DI migration; the
// wrapper keeps the historical construction sites positional.
const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;
const tc = (s: TripsService) => new TripsController(s, audit);

function svc(o: Partial<TripsService> = {}): TripsService {
  return {
    canAccessTrip: vi.fn().mockReturnValue({ user_id: 1 }),
    can: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    notifyInvite: vi.fn(),
    ...o,
  } as unknown as TripsService;
}

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
      tc(svc({ create } as Partial<TripsService>)).create(user, { title: 'T', end_date: '2026-07-07', day_count: '40' }, req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ start_date: '2026-07-01', end_date: '2026-07-07', day_count: 40 }));
    });

    it('clamps a non-numeric day_count to the default of 7', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      tc(svc({ create } as Partial<TripsService>)).create(user, { title: 'T', day_count: 'abc' }, req);
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

  describe('members', () => {
    it('GET 404 without access, else owner+members+current_user_id', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).members(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ listMembers: vi.fn().mockReturnValue({ owner: { id: 1 }, members: [] }) } as Partial<TripsService>);
      expect(tc(s).members(user, '9')).toEqual({ owner: { id: 1 }, members: [], current_user_id: 1 });
    });

    it('POST 403 without member_manage, else adds + notifies', () => {
      expect(thrown(() => tc(svc({ can: vi.fn().mockReturnValue(false) })).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 403, body: { error: 'No permission to manage members' } });
      const addMember = vi.fn().mockReturnValue({ member: { id: 2, email: 'bob@x.y' }, targetUserId: 2, tripTitle: 'T' });
      const notifyInvite = vi.fn();
      const s = svc({ addMember, notifyInvite } as Partial<TripsService>);
      expect(tc(s).addMember(user, '9', { identifier: 'bob@x.y' })).toEqual({ member: { id: 2, email: 'bob@x.y' } });
      expect(notifyInvite).toHaveBeenCalledWith('9', user, 2, 'T', 'bob@x.y');
    });

    it('POST 404 without trip access', () => {
      const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
      expect(thrown(() => tc(s).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('POST maps NotFoundError to 404, ValidationError to 400, re-throws others', () => {
      const nf = svc({ addMember: vi.fn().mockImplementation(() => { throw new NotFoundError('no user'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(nf).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 404, body: { error: 'no user' } });
      const ve = svc({ addMember: vi.fn().mockImplementation(() => { throw new ValidationError('already a member'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(ve).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 400, body: { error: 'already a member' } });
      const other = svc({ addMember: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
      expect(() => tc(other).addMember(user, '9', { identifier: 'bob@x.y' })).toThrow('boom');
    });

    it('DELETE 404 without trip access', () => {
      const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
      expect(thrown(() => tc(s).removeMember(user, '9', '2'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('DELETE self needs no permission; removing others needs member_manage', () => {
      const removeMember = vi.fn();
      const s = svc({ can: vi.fn().mockReturnValue(false), removeMember } as Partial<TripsService>);
      // self-removal (targetId === user.id) bypasses the permission check
      expect(tc(s).removeMember(user, '9', '1')).toEqual({ success: true });
      expect(thrown(() => tc(s).removeMember(user, '9', '2'))).toEqual({ status: 403, body: { error: 'No permission to remove members' } });
    });
  });

  describe('POST /:id/transfer (#973)', () => {
    it('404 without trip access', () => {
      const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
      expect(thrown(() => tc(s).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('403 when the requester is not the owner', () => {
      // access.user_id (5) differs from the requesting user (1)
      const s = svc({ canAccessTrip: vi.fn().mockReturnValue({ user_id: 5 }) });
      expect(thrown(() => tc(s).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({ status: 403, body: { error: 'Only the owner can transfer ownership' } });
    });

    it('a non-numeric newOwnerId 400s in the ZodValidationPipe', () => {
      // The hand-rolled 'newOwnerId is required' 400 moved into the global
      // pipe (trips DTO ratchet) — the schema rejects non-numeric ids.
      expect(tripTransferOwnershipRequestSchema.safeParse({ newOwnerId: 'nope' }).success).toBe(false);
      expect(tripTransferOwnershipRequestSchema.safeParse({}).success).toBe(false);
    });

    it('transfers, audits and broadcasts the refreshed trip', () => {
      const transferOwnership = vi.fn().mockReturnValue({ tripTitle: 'Roadtrip', fromEmail: 'a@x.y', toEmail: 'b@x.y' });
      const get = vi.fn().mockReturnValue({ id: 9, user_id: 2 });
      const broadcast = vi.fn();
      const s = svc({ transferOwnership, get, broadcast } as Partial<TripsService>);
      expect(tc(s).transferOwnership(user, '9', { newOwnerId: 2 }, req, 'sock')).toEqual({ success: true });
      expect(transferOwnership).toHaveBeenCalledWith('9', 2, user.id);
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9, user_id: 2 } }, 'sock');
    });

    it('maps NotFoundError to 404 and ValidationError to 400', () => {
      const nf = svc({ transferOwnership: vi.fn().mockImplementation(() => { throw new NotFoundError('User not found'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(nf).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({ status: 404, body: { error: 'User not found' } });
      const ve = svc({ transferOwnership: vi.fn().mockImplementation(() => { throw new ValidationError('New owner must be a trip member'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(ve).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({ status: 400, body: { error: 'New owner must be a trip member' } });
    });
  });

  describe('guests (#1362)', () => {
    it('404 without access, 403 for a non-owner, 400 without a name; else creates', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).createGuest(user, '9', { name: 'Anna' }))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      // access.user_id (5) ≠ requester (1) → not the owner
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue({ user_id: 5 }) })).createGuest(user, '9', { name: 'Anna' }))).toEqual({ status: 403, body: { error: 'Only the owner can manage guests' } });
      // A whitespace-only name still 400s with the legacy body — the service
      // throws after trimming (the schema only enforces 1..50 chars).
      const wsGuest = svc({ createGuest: vi.fn().mockImplementation(() => { throw new ValidationError('Guest name is required'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(wsGuest).createGuest(user, '9', { name: '  ' }))).toEqual({ status: 400, body: { error: 'Guest name is required' } });
      const createGuest = vi.fn().mockReturnValue({ member: { id: 7, username: 'Anna', is_guest: true } });
      const s = svc({ createGuest } as Partial<TripsService>);
      expect(tc(s).createGuest(user, '9', { name: 'Anna' })).toEqual({ member: { id: 7, username: 'Anna', is_guest: true } });
      expect(createGuest).toHaveBeenCalledWith('9', 'Anna', user.id);
    });

    it('rename: 403 non-owner, 404 when the guest is missing, else success', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue({ user_id: 5 }) })).renameGuest(user, '9', '7', { name: 'Bob' }))).toEqual({ status: 403, body: { error: 'Only the owner can manage guests' } });
      const miss = svc({ renameGuest: vi.fn().mockReturnValue(false) } as Partial<TripsService>);
      expect(thrown(() => tc(miss).renameGuest(user, '9', '7', { name: 'Bob' }))).toEqual({ status: 404, body: { error: 'Guest not found' } });
      const ok = svc({ renameGuest: vi.fn().mockReturnValue(true) } as Partial<TripsService>);
      expect(tc(ok).renameGuest(user, '9', '7', { name: 'Bob' })).toEqual({ success: true });
    });

    it('delete: 403 non-owner, 404 when the guest is missing, else success', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue({ user_id: 5 }) })).deleteGuest(user, '9', '7'))).toEqual({ status: 403, body: { error: 'Only the owner can manage guests' } });
      const miss = svc({ deleteGuest: vi.fn().mockReturnValue(false) } as Partial<TripsService>);
      expect(thrown(() => tc(miss).deleteGuest(user, '9', '7'))).toEqual({ status: 404, body: { error: 'Guest not found' } });
      const ok = svc({ deleteGuest: vi.fn().mockReturnValue(true) } as Partial<TripsService>);
      expect(tc(ok).deleteGuest(user, '9', '7')).toEqual({ success: true });
    });

    it('maps a ValidationError from createGuest to 400', () => {
      const ve = svc({ createGuest: vi.fn().mockImplementation(() => { throw new ValidationError('Guest name must be 50 characters or fewer'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(ve).createGuest(user, '9', { name: 'x'.repeat(60) }))).toEqual({ status: 400, body: { error: 'Guest name must be 50 characters or fewer' } });
    });
  });

  it('GET /:id/bundle 404 then aggregates', () => {
    expect(thrown(() => tc(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).bundle(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const bundle = vi.fn().mockReturnValue({ trip: { id: 9 }, days: [] });
    const s = svc({ get: vi.fn().mockReturnValue({ user_id: 1 }), bundle } as Partial<TripsService>);
    expect(tc(s).bundle(user, '9')).toEqual({ trip: { id: 9 }, days: [] });
  });

  describe('POST /:id/cover', () => {
    const file = { filename: 'abc.jpg' } as Express.Multer.File;
    it('404 without access, 403 without permission, 404 raw trip, 400 no file, else returns url', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).cover(user, '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(thrown(() => tc(svc({ can: vi.fn().mockReturnValue(false) })).cover(user, '9', file))).toEqual({ status: 403, body: { error: 'No permission to change the cover image' } });
      expect(thrown(() => tc(svc({ getRaw: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).cover(user, '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(thrown(() => tc(svc({ getRaw: vi.fn().mockReturnValue({ cover_image: null }) } as Partial<TripsService>)).cover(user, '9', undefined))).toEqual({ status: 400, body: { error: 'No image uploaded' } });
      const deleteOldCover = vi.fn(); const updateCoverImage = vi.fn();
      const s = svc({ getRaw: vi.fn().mockReturnValue({ cover_image: '/old.jpg' }), deleteOldCover, updateCoverImage } as Partial<TripsService>);
      expect(tc(s).cover(user, '9', file)).toEqual({ cover_image: '/uploads/covers/abc.jpg' });
      expect(deleteOldCover).toHaveBeenCalledWith('/old.jpg');
      expect(updateCoverImage).toHaveBeenCalledWith('9', '/uploads/covers/abc.jpg');
    });

    it('403 in demo mode for a demo account', () => {
      const prev = process.env.DEMO_MODE;
      process.env.DEMO_MODE = 'true';
      isDemoEmail.mockReturnValueOnce(true);
      try {
        expect(thrown(() => tc(svc()).cover(user, '9', file))).toEqual({
          status: 403, body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' },
        });
      } finally {
        if (prev === undefined) delete process.env.DEMO_MODE;
        else process.env.DEMO_MODE = prev;
      }
    });
  });

  describe('GET /:id/export.ics', () => {
    function makeRes() { return { setHeader: vi.fn(), send: vi.fn() } as never; }
    it('404 without access, else sends the calendar with headers', () => {
      expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).exportIcs(user, '9', makeRes()))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const res = { setHeader: vi.fn(), send: vi.fn() };
      const s = svc({ exportICS: vi.fn().mockReturnValue({ ics: 'BEGIN:VCALENDAR', filename: 'trip.ics' }) } as Partial<TripsService>);
      tc(s).exportIcs(user, '9', res as never);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="trip.ics"');
      expect(res.send).toHaveBeenCalledWith('BEGIN:VCALENDAR');
    });

    it('maps a NotFoundError from the export to 404 and re-throws others', () => {
      const nf = svc({ exportICS: vi.fn().mockImplementation(() => { throw new NotFoundError('gone'); }) } as Partial<TripsService>);
      expect(thrown(() => tc(nf).exportIcs(user, '9', makeRes()))).toEqual({ status: 404, body: { error: 'gone' } });
      const other = svc({ exportICS: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
      expect(() => tc(other).exportIcs(user, '9', makeRes())).toThrow('boom');
    });
  });

  it('POST /:id/copy maps a copy failure to 500', () => {
    const s = svc({ copy: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
    expect(thrown(() => tc(s).copy(user, '9', {}, req))).toEqual({ status: 500, body: { error: 'Failed to copy trip' } });
  });
});
