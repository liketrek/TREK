import type { AuditService } from '../../../src/nest/audit/audit.service';
import { GUEST_HAS_PAYMENTS } from '../../../src/nest/budget/budget-departure.helpers';
import { DomainError } from '../../../src/nest/common/domain-error';
import { NotFoundError, ValidationError } from '../../../src/nest/common/domain-errors';
import type { TripWriter } from '../../../src/nest/common/trip-writer';
import type { TripMemberWritesService } from '../../../src/nest/trip-members/trip-member-writes.service';
import { TripMembersController } from '../../../src/nest/trip-members/trip-members.controller';
import { TripMembersModule } from '../../../src/nest/trip-members/trip-members.module';
import type { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import type { User } from '../../../src/types';
import { expectRegisteredController } from '../../helpers/module-providers';
import { HttpException } from '@nestjs/common';
import { tripTransferOwnershipRequestSchema } from '@trek/shared';

import type { Request } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

/**
 * The member/guest routes, moved out of trips.controller.test.ts with the
 * controller they cover. Every assertion is unchanged: the routes kept their
 * paths, their status codes and their error bodies.
 */
const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const req = { headers: {} } as Request;

const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;

/**
 * TripMemberWritesService over the stubbed roster: the roster routes hand their
 * writes to it, so it passes each on to the stub and records the writer the
 * route built. What the real one sends (member:added/removed/updated, the
 * invitation, the re-split expenses) is held by tools-trip-members.test.ts and
 * the broadcast parity suite.
 */
function writesFor(s: TripMembersService) {
  return {
    restWriter: vi.fn(
      (_tripId: string | number, u: User, socketId: string | undefined) =>
        ({ userId: u.id, role: u.role, socketId }) as TripWriter,
    ),
    addMember: vi.fn((tripId: string, identifier: string, ownerId: number, w: TripWriter) =>
      s.addMember(tripId, identifier, ownerId, w.userId),
    ),
    removeMember: vi.fn((tripId: number, userId: number, _w: TripWriter) => s.removeMember(tripId, userId)),
    createGuest: vi.fn((tripId: string, name: string, w: TripWriter) => s.createGuest(tripId, name, w.userId)),
    renameGuest: vi.fn((tripId: string, guestId: number, name: string, _w: TripWriter) =>
      s.renameGuest(tripId, guestId, name),
    ),
    deleteGuest: vi.fn((tripId: string, guestId: number, _w: TripWriter) => s.deleteGuest(tripId, guestId)),
  };
}
let writes: ReturnType<typeof writesFor>;
const tc = (s: TripMembersService) => {
  writes = writesFor(s);
  return new TripMembersController(s, audit, writes as unknown as TripMemberWritesService);
};
/** The writer a route builds for the user of these cases. */
const restWriter = (socketId?: string) => ({ userId: 1, role: 'user', socketId });

function svc(o: Partial<TripMembersService> = {}): TripMembersService {
  return {
    canAccessTrip: vi.fn().mockResolvedValue({ user_id: 1 }),
    can: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    notifyInvite: vi.fn(),
    getTripForViewer: vi.fn().mockReturnValue({ id: 9 }),
    ...o,
  } as unknown as TripMembersService;
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('TripMembersController', () => {
  describe('members', () => {
    it('GET 404 without access, else owner+members+current_user_id', async () => {
      expect(
        await thrown(() => tc(svc({ canAccessTrip: vi.fn().mockResolvedValue(undefined) })).members(user, '9')),
      ).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({
        listMembers: vi.fn().mockReturnValue({ owner: { id: 1 }, members: [] }),
      } as Partial<TripMembersService>);
      expect(await tc(s).members(user, '9')).toEqual({ owner: { id: 1 }, members: [], current_user_id: 1 });
    });

    it('POST 403 without member_manage, else adds through the roster writes', async () => {
      expect(
        await thrown(() =>
          tc(svc({ can: vi.fn().mockReturnValue(false) })).addMember(user, '9', { identifier: 'bob@x.y' }),
        ),
      ).toEqual({ status: 403, body: { error: 'No permission to manage members' } });
      expect(writes.addMember).not.toHaveBeenCalled();
      const addMember = vi
        .fn()
        .mockReturnValue({ member: { id: 2, email: 'bob@x.y' }, targetUserId: 2, tripTitle: 'T' });
      const s = svc({ addMember } as Partial<TripMembersService>);
      expect(await tc(s).addMember(user, '9', { identifier: 'bob@x.y' }, 'sock')).toEqual({
        member: { id: 2, email: 'bob@x.y' },
      });
      // The use case announces member:added and sends the invitation, as the MCP
      // tool does through the same method; the route only builds its writer.
      expect(writes.restWriter).toHaveBeenCalledWith('9', user, 'sock');
      expect(writes.addMember).toHaveBeenCalledWith('9', 'bob@x.y', 1, restWriter('sock'));
      expect(s.broadcast).not.toHaveBeenCalled();
    });

    it('POST 404 without trip access', async () => {
      const s = svc({ canAccessTrip: vi.fn().mockResolvedValue(undefined) });
      expect(await thrown(() => tc(s).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({
        status: 404,
        body: { error: 'Trip not found' },
      });
    });

    it('POST maps NotFoundError to 404, ValidationError to 400, re-throws others', async () => {
      const nf = svc({
        addMember: vi.fn().mockImplementation(() => {
          throw new NotFoundError('no user');
        }),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(nf).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({
        status: 404,
        body: { error: 'no user' },
      });
      const ve = svc({
        addMember: vi.fn().mockImplementation(() => {
          throw new ValidationError('already a member');
        }),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(ve).addMember(user, '9', { identifier: 'bob@x.y' }))).toEqual({
        status: 400,
        body: { error: 'already a member' },
      });
      const other = svc({
        addMember: vi.fn().mockImplementation(() => {
          throw new Error('boom');
        }),
      } as Partial<TripMembersService>);
      await expect(tc(other).addMember(user, '9', { identifier: 'bob@x.y' })).rejects.toThrow('boom');
    });

    it('DELETE 404 without trip access', async () => {
      const s = svc({ canAccessTrip: vi.fn().mockResolvedValue(undefined) });
      expect(await thrown(() => tc(s).removeMember(user, '9', '2'))).toEqual({
        status: 404,
        body: { error: 'Trip not found' },
      });
    });

    it('DELETE self needs no permission; removing others needs member_manage', async () => {
      const removeMember = vi.fn();
      const s = svc({ can: vi.fn().mockReturnValue(false), removeMember } as Partial<TripMembersService>);
      // self-removal (targetId === user.id) bypasses the permission check
      expect(await tc(s).removeMember(user, '9', '1', 'sock')).toEqual({ success: true });
      // The parsed trip id, as the removal itself takes it; member:removed goes out from the use case.
      expect(writes.removeMember).toHaveBeenCalledWith(9, 1, restWriter('sock'));
      expect(removeMember).toHaveBeenCalledWith(9, 1);
      expect(await thrown(() => tc(s).removeMember(user, '9', '2'))).toEqual({
        status: 403,
        body: { error: 'No permission to remove members' },
      });
      expect(writes.removeMember).not.toHaveBeenCalled();
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

    it('transfers, audits and broadcasts the refreshed trip', async () => {
      const transferOwnership = vi
        .fn()
        .mockReturnValue({ tripTitle: 'Roadtrip', fromEmail: 'a@x.y', toEmail: 'b@x.y' });
      const getTripForViewer = vi.fn().mockReturnValue({ id: 9, user_id: 2 });
      const broadcast = vi.fn();
      const s = svc({ transferOwnership, getTripForViewer, broadcast } as Partial<TripMembersService>);
      expect(await tc(s).transferOwnership(user, '9', { newOwnerId: 2 }, req, 'sock')).toEqual({ success: true });
      expect(transferOwnership).toHaveBeenCalledWith('9', 2, user.id);
      expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9, user_id: 2 } }, 'sock');
    });

    it('maps NotFoundError to 404 and ValidationError to 400', async () => {
      const nf = svc({
        transferOwnership: vi.fn().mockImplementation(() => {
          throw new NotFoundError('User not found');
        }),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(nf).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({
        status: 404,
        body: { error: 'User not found' },
      });
      const ve = svc({
        transferOwnership: vi.fn().mockImplementation(() => {
          throw new ValidationError('New owner must be a trip member');
        }),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(ve).transferOwnership(user, '9', { newOwnerId: 2 }, req))).toEqual({
        status: 400,
        body: { error: 'New owner must be a trip member' },
      });
    });
  });

  describe('guests (#1362)', () => {
    // Ownership is TripOwnerGuard's job now (OWNER-002 pins the exact message).
    it('400 without a name; else creates', async () => {
      // A whitespace-only name still 400s with the legacy body — the service
      // throws after trimming (the schema only enforces 1..50 chars).
      const wsGuest = svc({
        createGuest: vi.fn().mockImplementation(() => {
          throw new ValidationError('Guest name is required');
        }),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(wsGuest).createGuest(user, '9', { name: '  ' }))).toEqual({
        status: 400,
        body: { error: 'Guest name is required' },
      });
      const createGuest = vi.fn().mockReturnValue({ member: { id: 7, username: 'Anna', is_guest: true } });
      const s = svc({ createGuest } as Partial<TripMembersService>);
      expect(await tc(s).createGuest(user, '9', { name: 'Anna' }, 'sock')).toEqual({
        member: { id: 7, username: 'Anna', is_guest: true },
      });
      expect(createGuest).toHaveBeenCalledWith('9', 'Anna', user.id);
      // member:added goes out from the use case, to the room minus the asking tab.
      expect(writes.createGuest).toHaveBeenCalledWith('9', 'Anna', restWriter('sock'));
    });

    it('rename: 404 when the guest is missing, else success', async () => {
      const miss = svc({ renameGuest: vi.fn().mockReturnValue(false) } as Partial<TripMembersService>);
      expect(await thrown(() => tc(miss).renameGuest(user, '9', '7', { name: 'Bob' }))).toEqual({
        status: 404,
        body: { error: 'Guest not found' },
      });
      const ok = svc({ renameGuest: vi.fn().mockReturnValue(true) } as Partial<TripMembersService>);
      expect(await tc(ok).renameGuest(user, '9', '7', { name: 'Bob' }, 'sock')).toEqual({ success: true });
      expect(writes.renameGuest).toHaveBeenCalledWith('9', 7, 'Bob', restWriter('sock'));
    });

    it('delete: 404 when the guest is missing, else success', async () => {
      const miss = svc({ deleteGuest: vi.fn().mockResolvedValue(false) } as Partial<TripMembersService>);
      expect(await thrown(() => tc(miss).deleteGuest(user, '9', '7'))).toEqual({
        status: 404,
        body: { error: 'Guest not found' },
      });
      const ok = svc({ deleteGuest: vi.fn().mockResolvedValue(true) } as Partial<TripMembersService>);
      expect(await tc(ok).deleteGuest(user, '9', '7', 'sock')).toEqual({ success: true });
      expect(writes.deleteGuest).toHaveBeenCalledWith('9', 7, restWriter('sock'));
    });

    it('passes the 409 of a guest who moved money on as it stands, the text the MCP tool answers too (#2604)', async () => {
      const refused = svc({
        deleteGuest: vi
          .fn()
          .mockRejectedValue(new DomainError(409, GUEST_HAS_PAYMENTS, { code: 'guest_has_payments' })),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(refused).deleteGuest(user, '9', '7'))).toEqual({
        status: 409,
        body: { error: GUEST_HAS_PAYMENTS },
      });
    });

    it('maps a ValidationError from createGuest to 400', async () => {
      const ve = svc({
        createGuest: vi.fn().mockImplementation(() => {
          throw new ValidationError('Guest name must be 50 characters or fewer');
        }),
      } as Partial<TripMembersService>);
      expect(await thrown(() => tc(ve).createGuest(user, '9', { name: 'x'.repeat(60) }))).toEqual({
        status: 400,
        body: { error: 'Guest name must be 50 characters or fewer' },
      });
    });
  });

  it('MEMBERS-CTRL-001: the module registers the controller, so the routes cannot go missing', () => {
    expectRegisteredController(TripMembersModule, TripMembersController);
    expect(Reflect.getMetadata('path', TripMembersController)).toBe('api/trips');
  });
});
