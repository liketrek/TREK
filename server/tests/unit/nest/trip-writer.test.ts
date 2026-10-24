import { DomainError } from '../../../src/nest/common/domain-error';
import {
  requireTripWrite,
  restTripEvents,
  restTripWriter,
  tripNotFound,
  tripPermissionDenied,
  type TripWriter,
} from '../../../src/nest/common/trip-writer';

import { describe, it, expect, vi } from 'vitest';

describe('restTripEvents', () => {
  it('sends a room event skipping the sender, with the four arguments the routes always passed', () => {
    const broadcast = vi.fn();
    restTripEvents(broadcast, '5', 'sock').emit('packing:deleted', { itemId: 3 });
    expect(broadcast.mock.calls).toEqual([['5', 'packing:deleted', { itemId: 3 }, 'sock']]);
  });

  it('treats null as the room too', () => {
    const broadcast = vi.fn();
    restTripEvents(broadcast, 5, undefined).emit('packing:deleted', { itemId: 3 }, null);
    expect(broadcast.mock.calls).toEqual([[5, 'packing:deleted', { itemId: 3 }, undefined]]);
  });

  it('scopes a restricted event to each named user once', () => {
    const broadcast = vi.fn();
    restTripEvents(broadcast, '5', 'sock').emit('packing:deleted', { itemId: 3 }, [1, 2, 1]);
    expect(broadcast.mock.calls).toEqual([
      ['5', 'packing:deleted', { itemId: 3 }, 'sock', 1],
      ['5', 'packing:deleted', { itemId: 3 }, 'sock', 2],
    ]);
  });

  it('sends emitAll to every socket, the sender included', () => {
    const broadcast = vi.fn();
    restTripEvents(broadcast, '5', 'sock').emitAll('reservation:created', {});
    expect(broadcast.mock.calls).toEqual([['5', 'reservation:created', {}, undefined]]);
  });
});

describe('restTripWriter', () => {
  it('takes the user, the socket and RealtimeService.broadcast bound to its instance', () => {
    const realtime = {
      calls: [] as unknown[][],
      broadcast(this: { calls: unknown[][] }, ...args: unknown[]) {
        this.calls.push(args);
      },
    };
    const writer = restTripWriter(realtime, '5', { id: 7, role: 'admin' }, 'sock');
    expect(writer).toMatchObject({ userId: 7, role: 'admin', socketId: 'sock', surface: 'rest' });
    writer.events.emit('packing:deleted', { itemId: 1 });
    expect(realtime.calls).toEqual([['5', 'packing:deleted', { itemId: 1 }, 'sock']]);
  });
});

describe('requireTripWrite', () => {
  const writer = (userId = 1): TripWriter => ({
    userId,
    role: 'user',
    surface: 'mcp',
    events: { emit: vi.fn(), emitAll: vi.fn() },
  });

  it('answers the trip when it is visible and the action is allowed', async () => {
    const trip = { user_id: 1 };
    const checkPermission = vi.fn().mockResolvedValue(true);
    const findAccessible = vi.fn().mockResolvedValue(trip);
    expect(
      await requireTripWrite(
        { access: { findAccessible }, permissions: { checkPermission } },
        'day_edit',
        '5',
        writer(),
      ),
    ).toBe(trip);
    // The id reaches the lookup as given; the owner is no member of their own trip.
    expect(findAccessible).toHaveBeenCalledWith('5', 1);
    expect(checkPermission).toHaveBeenCalledWith('day_edit', 'user', 1, 1, false);
  });

  it('refuses an invisible trip with 404, before asking about the permission', async () => {
    const checkPermission = vi.fn();
    const err = await requireTripWrite(
      { access: { findAccessible: vi.fn().mockResolvedValue(undefined) }, permissions: { checkPermission } },
      'day_edit',
      5,
      writer(),
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).getStatus()).toBe(404);
    expect(checkPermission).not.toHaveBeenCalled();
  });

  it('refuses a member without the action with 403', async () => {
    const err = await requireTripWrite(
      {
        access: { findAccessible: vi.fn().mockResolvedValue({ user_id: 2 }) },
        permissions: { checkPermission: vi.fn().mockResolvedValue(false) },
      },
      'packing_edit',
      5,
      writer(),
    ).catch((e: unknown) => e);
    expect((err as DomainError).getStatus()).toBe(403);
  });
});

describe('trip refusals', () => {
  it("carry REST's guard bodies and the wording MCP always answered with", () => {
    expect(tripNotFound().toBody()).toEqual({ error: 'Trip not found' });
    expect(tripNotFound().mcpMessage).toBe('Trip not found or access denied.');
    expect(tripPermissionDenied().toBody()).toEqual({ error: 'No permission' });
    expect(tripPermissionDenied().mcpMessage).toBe('You do not have permission to perform this action on this trip.');
  });
});
