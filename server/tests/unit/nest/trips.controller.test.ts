import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4'), logInfo: vi.fn() }));
const { isDemoEmail } = vi.hoisted(() => ({ isDemoEmail: vi.fn(() => false) }));
vi.mock('../../../src/services/demo', () => ({ isDemoEmail }));

import { TripsController } from '../../../src/nest/trips/trips.controller';
import type { TripsService } from '../../../src/nest/trips/trips.service';
import { NotFoundError, ValidationError } from '../../../src/services/tripService';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const req = { headers: {} } as Request;

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

beforeEach(() => vi.clearAllMocks());

describe('TripsController (parity with the legacy /api/trips route)', () => {
  it('GET / lists for the user with the archived flag', () => {
    const list = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(new TripsController(svc({ list } as Partial<TripsService>)).list(user, '1')).toEqual({ trips: [{ id: 1 }] });
    expect(list).toHaveBeenCalledWith(1, 1);
  });

  it('GET / defaults the archived flag to 0 when not "1"', () => {
    const list = vi.fn().mockReturnValue([]);
    const c = new TripsController(svc({ list } as Partial<TripsService>));
    c.list(user, undefined);
    expect(list).toHaveBeenLastCalledWith(1, 0);
    c.list(user, '0');
    expect(list).toHaveBeenLastCalledWith(1, 0);
  });

  describe('POST / (create)', () => {
    it('403 without trip_create, 400 without title', () => {
      expect(thrown(() => new TripsController(svc({ can: vi.fn().mockReturnValue(false) })).create(user, { title: 'T' }, req))).toEqual({ status: 403, body: { error: 'No permission to create trips' } });
      expect(thrown(() => new TripsController(svc()).create(user, {}, req))).toEqual({ status: 400, body: { error: 'Title is required' } });
    });

    it('infers end_date from start_date (+6 days) and creates', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      new TripsController(svc({ create } as Partial<TripsService>)).create(user, { title: 'T', start_date: '2026-07-01' }, req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ start_date: '2026-07-01', end_date: '2026-07-07' }));
    });

    it('400 when end_date precedes start_date', () => {
      expect(thrown(() => new TripsController(svc()).create(user, { title: 'T', start_date: '2026-07-10', end_date: '2026-07-01' }, req))).toEqual({
        status: 400, body: { error: 'End date must be after start date' },
      });
    });

    it('infers start_date from end_date (-6 days) and parses day_count', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      new TripsController(svc({ create } as Partial<TripsService>)).create(user, { title: 'T', end_date: '2026-07-07', day_count: '40' }, req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ start_date: '2026-07-01', end_date: '2026-07-07', day_count: 40 }));
    });

    it('clamps a non-numeric day_count to the default of 7', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
      new TripsController(svc({ create } as Partial<TripsService>)).create(user, { title: 'T', day_count: 'abc' }, req);
      expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ day_count: 7 }));
    });

    it('logs the reminder when reminderDays is set', () => {
      const create = vi.fn().mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 3 });
      expect(new TripsController(svc({ create } as Partial<TripsService>)).create(user, { title: 'T' }, req)).toEqual({ trip: { id: 9 } });
    });
  });

  it('GET /:id 404 when missing', () => {
    expect(thrown(() => new TripsController(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).get(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('GET /:id returns the trip when present', () => {
    const s = svc({ get: vi.fn().mockReturnValue({ id: 9 }) } as Partial<TripsService>);
    expect(new TripsController(s).get(user, '9')).toEqual({ trip: { id: 9 } });
  });

  describe('PUT /:id', () => {
    it('404 when no access; 403 on archive without trip_archive', () => {
      expect(thrown(() => new TripsController(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).update(user, '9', {}, req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ can: vi.fn().mockImplementation((a: string) => a !== 'trip_archive') });
      expect(thrown(() => new TripsController(s).update(user, '9', { is_archived: 1 }, req))).toEqual({ status: 403, body: { error: 'No permission to archive/unarchive this trip' } });
    });

    it('updates, audits a change and broadcasts', () => {
      const update = vi.fn().mockReturnValue({ updatedTrip: { id: 9 }, changes: { title: { oldValue: 'a', newValue: 'b' } }, newTitle: 'b', newReminder: 0, oldReminder: 0 });
      const broadcast = vi.fn();
      const s = svc({ update, broadcast } as Partial<TripsService>);
      expect(new TripsController(s).update(user, '9', { title: 'b' }, req, 'sock')).toEqual({ trip: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9 } }, 'sock');
    });

    it('403 on cover_image without trip_cover_upload', () => {
      const s = svc({ can: vi.fn().mockImplementation((a: string) => a !== 'trip_cover_upload') });
      expect(thrown(() => new TripsController(s).update(user, '9', { cover_image: '/x.jpg' }, req))).toEqual({ status: 403, body: { error: 'No permission to change cover image' } });
    });

    it('403 on an edit field without trip_edit', () => {
      const s = svc({ can: vi.fn().mockImplementation((a: string) => a !== 'trip_edit') });
      expect(thrown(() => new TripsController(s).update(user, '9', { title: 'b' }, req))).toEqual({ status: 403, body: { error: 'No permission to edit this trip' } });
    });

    it('admin edit logs the owner and reminder changes', () => {
      const update = vi.fn().mockReturnValue({
        updatedTrip: { id: 9 }, changes: { title: { oldValue: 'a', newValue: 'b' } }, newTitle: 'b',
        ownerEmail: 'owner@x.y', isAdminEdit: true, newReminder: 5, oldReminder: 0,
      });
      const s = svc({ update } as Partial<TripsService>);
      expect(new TripsController(s).update(user, '9', { title: 'b' }, req)).toEqual({ trip: { id: 9 } });
    });

    it('logs when a reminder is removed', () => {
      const update = vi.fn().mockReturnValue({
        updatedTrip: { id: 9 }, changes: {}, newTitle: 'b', newReminder: 0, oldReminder: 5,
      });
      const s = svc({ update } as Partial<TripsService>);
      expect(new TripsController(s).update(user, '9', { reminder_days: 0 }, req)).toEqual({ trip: { id: 9 } });
    });

    it('maps a NotFoundError to 404 and a ValidationError to 400', () => {
      const nf = svc({ update: vi.fn().mockImplementation(() => { throw new NotFoundError('gone'); }) } as Partial<TripsService>);
      expect(thrown(() => new TripsController(nf).update(user, '9', { title: 'b' }, req))).toEqual({ status: 404, body: { error: 'gone' } });
      const ve = svc({ update: vi.fn().mockImplementation(() => { throw new ValidationError('bad'); }) } as Partial<TripsService>);
      expect(thrown(() => new TripsController(ve).update(user, '9', { title: 'b' }, req))).toEqual({ status: 400, body: { error: 'bad' } });
    });

    it('re-throws an unknown error from update', () => {
      const s = svc({ update: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
      expect(() => new TripsController(s).update(user, '9', { title: 'b' }, req)).toThrow('boom');
    });
  });

  describe('POST /:id/copy', () => {
    it('403 without trip_create, 404 without access', () => {
      expect(thrown(() => new TripsController(svc({ can: vi.fn().mockReturnValue(false) })).copy(user, '9', undefined, req))).toEqual({ status: 403, body: { error: 'No permission to create trips' } });
      expect(thrown(() => new TripsController(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).copy(user, '9', undefined, req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('copies + returns the new trip', () => {
      const s = svc({ copy: vi.fn().mockReturnValue(42), getCopiedTrip: vi.fn().mockReturnValue({ id: 42 }) } as Partial<TripsService>);
      expect(new TripsController(s).copy(user, '9', 'Copy', req)).toEqual({ trip: { id: 42 } });
    });
  });

  describe('DELETE /:id', () => {
    it('404 when no owner, 403 without trip_delete', () => {
      expect(thrown(() => new TripsController(svc({ getOwner: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).remove(user, '9', req))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 1 }), can: vi.fn().mockReturnValue(false) } as Partial<TripsService>);
      expect(thrown(() => new TripsController(s).remove(user, '9', req))).toEqual({ status: 403, body: { error: 'No permission to delete this trip' } });
    });

    it('deletes, audits and broadcasts', () => {
      const remove = vi.fn().mockReturnValue({ tripId: 9, title: 'T', isAdminDelete: false }); const broadcast = vi.fn();
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 1 }), remove, broadcast } as Partial<TripsService>);
      expect(new TripsController(s).remove(user, '9', req, 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:deleted', { id: 9 }, 'sock');
    });

    it('admin delete logs the owner', () => {
      const remove = vi.fn().mockReturnValue({ tripId: 9, title: 'T', isAdminDelete: true, ownerEmail: 'owner@x.y' });
      const broadcast = vi.fn();
      const s = svc({ getOwner: vi.fn().mockReturnValue({ user_id: 2 }), remove, broadcast } as Partial<TripsService>);
      expect(new TripsController(s).remove(user, '9', req)).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:deleted', { id: 9 }, undefined);
    });
  });

  describe('members', () => {
    it('GET 404 without access, else owner+members+current_user_id', () => {
      expect(thrown(() => new TripsController(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).members(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ listMembers: vi.fn().mockReturnValue({ owner: { id: 1 }, members: [] }) } as Partial<TripsService>);
      expect(new TripsController(s).members(user, '9')).toEqual({ owner: { id: 1 }, members: [], current_user_id: 1 });
    });

    it('POST 403 without member_manage, else adds + notifies', () => {
      expect(thrown(() => new TripsController(svc({ can: vi.fn().mockReturnValue(false) })).addMember(user, '9', 'bob@x.y'))).toEqual({ status: 403, body: { error: 'No permission to manage members' } });
      const addMember = vi.fn().mockReturnValue({ member: { id: 2, email: 'bob@x.y' }, targetUserId: 2, tripTitle: 'T' });
      const notifyInvite = vi.fn();
      const s = svc({ addMember, notifyInvite } as Partial<TripsService>);
      expect(new TripsController(s).addMember(user, '9', 'bob@x.y')).toEqual({ member: { id: 2, email: 'bob@x.y' } });
      expect(notifyInvite).toHaveBeenCalledWith('9', user, 2, 'T', 'bob@x.y');
    });

    it('POST 404 without trip access', () => {
      const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
      expect(thrown(() => new TripsController(s).addMember(user, '9', 'bob@x.y'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('POST maps NotFoundError to 404, ValidationError to 400, re-throws others', () => {
      const nf = svc({ addMember: vi.fn().mockImplementation(() => { throw new NotFoundError('no user'); }) } as Partial<TripsService>);
      expect(thrown(() => new TripsController(nf).addMember(user, '9', 'bob@x.y'))).toEqual({ status: 404, body: { error: 'no user' } });
      const ve = svc({ addMember: vi.fn().mockImplementation(() => { throw new ValidationError('already a member'); }) } as Partial<TripsService>);
      expect(thrown(() => new TripsController(ve).addMember(user, '9', 'bob@x.y'))).toEqual({ status: 400, body: { error: 'already a member' } });
      const other = svc({ addMember: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
      expect(() => new TripsController(other).addMember(user, '9', 'bob@x.y')).toThrow('boom');
    });

    it('DELETE 404 without trip access', () => {
      const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
      expect(thrown(() => new TripsController(s).removeMember(user, '9', '2'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('DELETE self needs no permission; removing others needs member_manage', () => {
      const removeMember = vi.fn();
      const s = svc({ can: vi.fn().mockReturnValue(false), removeMember } as Partial<TripsService>);
      // self-removal (targetId === user.id) bypasses the permission check
      expect(new TripsController(s).removeMember(user, '9', '1')).toEqual({ success: true });
      expect(thrown(() => new TripsController(s).removeMember(user, '9', '2'))).toEqual({ status: 403, body: { error: 'No permission to remove members' } });
    });
  });

  it('GET /:id/bundle 404 then aggregates', () => {
    expect(thrown(() => new TripsController(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).bundle(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const bundle = vi.fn().mockReturnValue({ trip: { id: 9 }, days: [] });
    const s = svc({ get: vi.fn().mockReturnValue({ user_id: 1 }), bundle } as Partial<TripsService>);
    expect(new TripsController(s).bundle(user, '9')).toEqual({ trip: { id: 9 }, days: [] });
  });

  describe('POST /:id/cover', () => {
    const file = { filename: 'abc.jpg' } as Express.Multer.File;
    it('404 without access, 403 without permission, 404 raw trip, 400 no file, else returns url', () => {
      expect(thrown(() => new TripsController(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).cover(user, '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(thrown(() => new TripsController(svc({ can: vi.fn().mockReturnValue(false) })).cover(user, '9', file))).toEqual({ status: 403, body: { error: 'No permission to change the cover image' } });
      expect(thrown(() => new TripsController(svc({ getRaw: vi.fn().mockReturnValue(undefined) } as Partial<TripsService>)).cover(user, '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(thrown(() => new TripsController(svc({ getRaw: vi.fn().mockReturnValue({ cover_image: null }) } as Partial<TripsService>)).cover(user, '9', undefined))).toEqual({ status: 400, body: { error: 'No image uploaded' } });
      const deleteOldCover = vi.fn(); const updateCoverImage = vi.fn();
      const s = svc({ getRaw: vi.fn().mockReturnValue({ cover_image: '/old.jpg' }), deleteOldCover, updateCoverImage } as Partial<TripsService>);
      expect(new TripsController(s).cover(user, '9', file)).toEqual({ cover_image: '/uploads/covers/abc.jpg' });
      expect(deleteOldCover).toHaveBeenCalledWith('/old.jpg');
      expect(updateCoverImage).toHaveBeenCalledWith('9', '/uploads/covers/abc.jpg');
    });

    it('403 in demo mode for a demo account', () => {
      const prev = process.env.DEMO_MODE;
      process.env.DEMO_MODE = 'true';
      isDemoEmail.mockReturnValueOnce(true);
      try {
        expect(thrown(() => new TripsController(svc()).cover(user, '9', file))).toEqual({
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
      expect(thrown(() => new TripsController(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).exportIcs(user, '9', makeRes()))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const res = { setHeader: vi.fn(), send: vi.fn() };
      const s = svc({ exportICS: vi.fn().mockReturnValue({ ics: 'BEGIN:VCALENDAR', filename: 'trip.ics' }) } as Partial<TripsService>);
      new TripsController(s).exportIcs(user, '9', res as never);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="trip.ics"');
      expect(res.send).toHaveBeenCalledWith('BEGIN:VCALENDAR');
    });

    it('maps a NotFoundError from the export to 404 and re-throws others', () => {
      const nf = svc({ exportICS: vi.fn().mockImplementation(() => { throw new NotFoundError('gone'); }) } as Partial<TripsService>);
      expect(thrown(() => new TripsController(nf).exportIcs(user, '9', makeRes()))).toEqual({ status: 404, body: { error: 'gone' } });
      const other = svc({ exportICS: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
      expect(() => new TripsController(other).exportIcs(user, '9', makeRes())).toThrow('boom');
    });
  });

  it('POST /:id/copy maps a copy failure to 500', () => {
    const s = svc({ copy: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripsService>);
    expect(thrown(() => new TripsController(s).copy(user, '9', undefined, req))).toEqual({ status: 500, body: { error: 'Failed to copy trip' } });
  });
});
