import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));

import { TripMembersController } from '../../../src/nest/trip-members/trip-members.controller';
import { TripMembersModule } from '../../../src/nest/trip-members/trip-members.module';
import type { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import { NotFoundError, ValidationError } from '../../../src/nest/common/domain-errors';
import type { User } from '../../../src/types';
import { tripTransferOwnershipRequestSchema } from '@trek/shared';
import { expectRegisteredController } from '../../helpers/module-providers';

/**
 * The member/guest routes, moved out of trips.controller.test.ts with the
 * controller they cover. Every assertion is unchanged: the routes kept their
 * paths, their status codes and their error bodies.
 */
const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const req = { headers: {} } as Request;

const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;
const tc = (s: TripMembersService) => new TripMembersController(s, audit);

function svc(o: Partial<TripMembersService> = {}): TripMembersService {
  return {
    canAccessTrip: vi.fn().mockReturnValue({ user_id: 1 }),
    can: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    notifyInvite: vi.fn(),
    getTripForViewer: vi.fn().mockReturnValue({ id: 9 }),
    ...o,
  } as unknown as TripMembersService;
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

describe('TripMembersController', () => {
describe('members', () => {
  it('GET 404 without access, else owner+members+current_user_id', () => {
    expect(thrown(() => tc(svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) })).members(user, '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const s = svc({ listMembers: vi.fn().mockReturnValue({ owner: { id: 1 }, members: [] }) } as Partial<TripMembersService>);
    expect(tc(s).members(user, '9')).toEqual({ owner: { id: 1 }, members: [], current_user_id: 1 });
  });

  it('POST 403 without member_manage, else adds + notifies', () => {
    expect(thrown(() => tc(svc({ can: vi.fn().mockReturnValue(false) })).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 403, body: { error: 'No permission to manage members' } });
    const addMember = vi.fn().mockReturnValue({ member: { id: 2, email: 'bob@x.y' }, targetUserId: 2, tripTitle: 'T' });
    const notifyInvite = vi.fn();
    const s = svc({ addMember, notifyInvite } as Partial<TripMembersService>);
    expect(tc(s).addMember(user, '9', { identifier: 'bob@x.y' })).toEqual({ member: { id: 2, email: 'bob@x.y' } });
    expect(notifyInvite).toHaveBeenCalledWith('9', user, 2, 'T', 'bob@x.y');
  });

  it('POST 404 without trip access', () => {
    const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => tc(s).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('POST maps NotFoundError to 404, ValidationError to 400, re-throws others', () => {
    const nf = svc({ addMember: vi.fn().mockImplementation(() => { throw new NotFoundError('no user'); }) } as Partial<TripMembersService>);
    expect(thrown(() => tc(nf).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 404, body: { error: 'no user' } });
    const ve = svc({ addMember: vi.fn().mockImplementation(() => { throw new ValidationError('already a member'); }) } as Partial<TripMembersService>);
    expect(thrown(() => tc(ve).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({ status: 400, body: { error: 'already a member' } });
    const other = svc({ addMember: vi.fn().mockImplementation(() => { throw new Error('boom'); }) } as Partial<TripMembersService>);
    expect(() => tc(other).addMember(user, '9', { identifier: 'bob@x.y' })).toThrow('boom');
  });

  it('DELETE 404 without trip access', () => {
    const s = svc({ canAccessTrip: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => tc(s).removeMember(user, '9', '2'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('DELETE self needs no permission; removing others needs member_manage', () => {
    const removeMember = vi.fn();
    const s = svc({ can: vi.fn().mockReturnValue(false), removeMember } as Partial<TripMembersService>);
    // self-removal (targetId === user.id) bypasses the permission check
    expect(tc(s).removeMember(user, '9', '1')).toEqual({ success: true });
    expect(thrown(() => tc(s).removeMember(user, '9', '2'))).toEqual({ status: 403, body: { error: 'No permission to remove members' } });
  });
});

describe('POST /:id/transfer (#973)', () => {

  // The 404-without-access and 403-for-a-non-owner cases moved to
  // trip-owner.guard.test.ts (OWNER-001..010) with the check itself: the route
  // carries @RequireTripOwner('Only the owner can transfer ownership') now, and
  // a guard runs before the handler this file constructs by hand.

  it('a non-numeric newOwnerId 400s in the ZodValidationPipe', () => {
    // The hand-rolled 'newOwnerId is required' 400 moved into the global
    // pipe (trips DTO ratchet) — the schema rejects non-numeric ids.
    expect(tripTransferOwnershipRequestSchema.safeParse({ newOwnerId: 'nope' }).success).toBe(false);
    expect(tripTransferOwnershipRequestSchema.safeParse({}).success).toBe(false);
  });

  it('transfers, audits and broadcasts the refreshed trip', () => {
    const transferOwnership = vi.fn().mockReturnValue({ tripTitle: 'Roadtrip', fromEmail: 'a@x.y', toEmail: 'b@x.y' });
    const getTripForViewer = vi.fn().mockReturnValue({ id: 9, user_id: 2 });
    const broadcast = vi.fn();
    const s = svc({ transferOwnership, getTripForViewer, broadcast } as Partial<TripMembersService>);
    expect(tc(s).transferOwnership(user, '9', { newOwnerId: 2 }, req, 'sock')).toEqual({ success: true });
    expect(transferOwnership).toHaveBeenCalledWith('9', 2, user.id);
    expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9, user_id: 2 } }, 'sock');
  });

  it('maps NotFoundError to 404 and ValidationError to 400', () => {
    const nf = svc({ transferOwnership: vi.fn().mockImplementation(() => { throw new NotFoundError('User not found'); }) } as Partial<TripMembersService>);
    expect(thrown(() => tc(nf).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({ status: 404, body: { error: 'User not found' } });
    const ve = svc({ transferOwnership: vi.fn().mockImplementation(() => { throw new ValidationError('New owner must be a trip member'); }) } as Partial<TripMembersService>);
    expect(thrown(() => tc(ve).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({ status: 400, body: { error: 'New owner must be a trip member' } });
  });
});

describe('guests (#1362)', () => {
  // Ownership is TripOwnerGuard's job now (OWNER-002 pins the exact message).
  it('400 without a name; else creates', () => {
    // A whitespace-only name still 400s with the legacy body — the service
    // throws after trimming (the schema only enforces 1..50 chars).
    const wsGuest = svc({ createGuest: vi.fn().mockImplementation(() => { throw new ValidationError('Guest name is required'); }) } as Partial<TripMembersService>);
    expect(thrown(() => tc(wsGuest).createGuest(user, '9', { name: '  ' }))).toEqual({ status: 400, body: { error: 'Guest name is required' } });
    const createGuest = vi.fn().mockReturnValue({ member: { id: 7, username: 'Anna', is_guest: true } });
    const s = svc({ createGuest } as Partial<TripMembersService>);
    expect(tc(s).createGuest(user, '9', { name: 'Anna' })).toEqual({ member: { id: 7, username: 'Anna', is_guest: true } });
    expect(createGuest).toHaveBeenCalledWith('9', 'Anna', user.id);
  });

  it('rename: 404 when the guest is missing, else success', () => {
    const miss = svc({ renameGuest: vi.fn().mockReturnValue(false) } as Partial<TripMembersService>);
    expect(thrown(() => tc(miss).renameGuest(user, '9', '7', { name: 'Bob' }))).toEqual({ status: 404, body: { error: 'Guest not found' } });
    const ok = svc({ renameGuest: vi.fn().mockReturnValue(true) } as Partial<TripMembersService>);
    expect(tc(ok).renameGuest(user, '9', '7', { name: 'Bob' })).toEqual({ success: true });
  });

  it('delete: 404 when the guest is missing, else success', () => {
    const miss = svc({ deleteGuest: vi.fn().mockReturnValue(false) } as Partial<TripMembersService>);
    expect(thrown(() => tc(miss).deleteGuest(user, '9', '7'))).toEqual({ status: 404, body: { error: 'Guest not found' } });
    const ok = svc({ deleteGuest: vi.fn().mockReturnValue(true) } as Partial<TripMembersService>);
    expect(tc(ok).deleteGuest(user, '9', '7')).toEqual({ success: true });
  });

  it('maps a ValidationError from createGuest to 400', () => {
    const ve = svc({ createGuest: vi.fn().mockImplementation(() => { throw new ValidationError('Guest name must be 50 characters or fewer'); }) } as Partial<TripMembersService>);
    expect(thrown(() => tc(ve).createGuest(user, '9', { name: 'x'.repeat(60) }))).toEqual({ status: 400, body: { error: 'Guest name must be 50 characters or fewer' } });
  });
});

  it('MEMBERS-CTRL-001: the module registers the controller, so the routes cannot go missing', () => {
    expectRegisteredController(TripMembersModule, TripMembersController);
    expect(Reflect.getMetadata('path', TripMembersController)).toBe('api/trips');
  });
});
