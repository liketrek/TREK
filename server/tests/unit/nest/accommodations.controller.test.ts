import { AccommodationsController } from '../../../src/nest/accommodations/accommodations.controller';
import type { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';

import { describe, it, expect, vi } from 'vitest';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { user_id: 1 };
const refs = { place_id: 2, start_day_id: 10, end_day_id: 11 };
/** A write that left the day plan alone, which is what most of these cases are about. */
const noMirror = { created: null, removed: [], stamped: null };

function makeService(overrides: Partial<AccommodationsService> = {}): AccommodationsService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    announceMirror: vi.fn(),
    validateRefs: vi.fn().mockReturnValue([]),
    ...overrides,
  } as unknown as AccommodationsService;
}

async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('AccommodationsController (parity with the legacy accommodations sub-router)', () => {
  it('GET / lists (no permission gate)', async () => {
    const svc = makeService({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AccommodationsService>);
    expect(await new AccommodationsController(svc).list(user, '5')).toEqual({ accommodations: [{ id: 1 }] });
  });

  describe('POST /', () => {
    it('400 when refs are missing', async () => {
      expect(
        await thrownAsync(() => new AccommodationsController(makeService()).create(user, '5', { place_id: 2 })),
      ).toEqual({
        status: 400,
        body: { error: 'place_id, start_day_id, and end_day_id are required' },
      });
    });

    it('404 with the first validateRefs error message', async () => {
      const svc = makeService({
        validateRefs: vi.fn().mockReturnValue([{ field: 'place_id', message: 'Place not found' }]),
      } as Partial<AccommodationsService>);
      expect(await thrownAsync(() => new AccommodationsController(svc).create(user, '5', refs))).toEqual({
        status: 404,
        body: { error: 'Place not found' },
      });
    });

    it('creates and emits accommodation:created + reservation:created', async () => {
      const create = vi.fn().mockReturnValue({ accommodation: { id: 9 }, mirror: noMirror });
      const broadcast = vi.fn();
      const svc = makeService({ create, broadcast } as Partial<AccommodationsService>);
      expect(await new AccommodationsController(svc).create(user, '5', refs, 'sock')).toEqual({
        accommodation: { id: 9 },
        assignment: null,
      });
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:created', { accommodation: { id: 9 } }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:created', {}, 'sock');
    });

    it('ACC-CTL-001 hands the day stop back in the answer and announces it', async () => {
      // The stop reaches the session that booked the night over the socket as well;
      // the answer is what it has left when that socket is down.
      const stop = { id: 77, day_id: 10 };
      const create = vi
        .fn()
        .mockReturnValue({ accommodation: { id: 9 }, mirror: { created: stop, removed: [], stamped: null } });
      const announceMirror = vi.fn();
      const svc = makeService({ create, announceMirror } as Partial<AccommodationsService>);
      expect(await new AccommodationsController(svc).create(user, '5', refs, 'sock')).toEqual({
        accommodation: { id: 9 },
        assignment: stop,
      });
      expect(announceMirror).toHaveBeenCalledWith(
        '5',
        { created: stop, removed: [], stamped: null },
        expect.any(Function),
        'sock',
      );
    });
  });

  describe('PUT /:id', () => {
    it('404 when the accommodation is missing', async () => {
      const svc = makeService({ get: vi.fn().mockReturnValue(undefined) } as Partial<AccommodationsService>);
      expect(await thrownAsync(() => new AccommodationsController(svc).update(user, '5', '9', refs))).toEqual({
        status: 404,
        body: { error: 'Accommodation not found' },
      });
    });

    it('updates and broadcasts', async () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const update = vi.fn().mockReturnValue({ accommodation: { id: 9, notes: 'x' }, mirror: noMirror });
      const broadcast = vi.fn();
      const svc = makeService({ get, update, broadcast } as Partial<AccommodationsService>);
      expect(await new AccommodationsController(svc).update(user, '5', '9', refs, 'sock')).toEqual({
        accommodation: { id: 9, notes: 'x' },
        assignment: null,
        removedAssignments: [],
      });
      expect(broadcast).toHaveBeenCalledWith(
        '5',
        'accommodation:updated',
        { accommodation: { id: 9, notes: 'x' } },
        'sock',
      );
    });

    it('ACC-CTL-002 a booking moved to another day reports the stop it took with it', async () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const mirror = { created: { id: 78, day_id: 11 }, removed: [{ id: 77, dayId: 10 }], stamped: null };
      const update = vi.fn().mockReturnValue({ accommodation: { id: 9 }, mirror });
      const announceMirror = vi.fn();
      const svc = makeService({ get, update, announceMirror } as Partial<AccommodationsService>);
      expect(await new AccommodationsController(svc).update(user, '5', '9', refs, 'sock')).toEqual({
        accommodation: { id: 9 },
        assignment: mirror.created,
        removedAssignments: mirror.removed,
      });
      expect(announceMirror).toHaveBeenCalledWith('5', mirror, expect.any(Function), 'sock');
    });

    it('ACC-CTL-003 404s a place or day that is not on this trip, before the write', async () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const update = vi.fn();
      const validateRefs = vi.fn().mockReturnValue([{ message: 'Place not found' }]);
      const svc = makeService({ get, update, validateRefs } as Partial<AccommodationsService>);
      expect(await thrownAsync(() => new AccommodationsController(svc).update(user, '5', '9', refs))).toEqual({
        status: 404,
        body: { error: 'Place not found' },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('ACC-CTL-004 the mirror sender is the same broadcast, reaching the sender too', async () => {
      // announceMirror decides which events a stay write implies; the controller only
      // hands it the door out. That door must not skip the sender's socket: the day's
      // new order and its re-pinned vias are not in the answer, and a session that
      // takes the stop from the answer alone keeps the stops behind it on their old
      // numbers. The stop itself arriving twice is a duplicate the store drops.
      const get = vi.fn().mockReturnValue({ id: 9 });
      const mirror = { created: { id: 78, day_id: 11 }, removed: [{ id: 77, dayId: 10 }], stamped: null };
      const update = vi.fn().mockReturnValue({ accommodation: { id: 9 }, mirror });
      const broadcast = vi.fn();
      type Send = (event: string, payload: unknown) => void;
      const announceMirror = vi.fn(async (_tripId: string, m: typeof mirror, send: Send) => {
        for (const stop of m.removed) send('assignment:deleted', { assignmentId: stop.id, dayId: stop.dayId });
        if (m.created) send('assignment:created', { assignment: m.created });
        send('assignment:reordered', { dayId: 11, orderedIds: [70, 78, 71] });
        send('roadtripVia:changed', { dayId: 11, vias: [] });
      });
      const svc = makeService({ get, update, broadcast, announceMirror } as Partial<AccommodationsService>);
      await new AccommodationsController(svc).update(user, '5', '9', refs, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'assignment:deleted', { assignmentId: 77, dayId: 10 }, undefined);
      expect(broadcast).toHaveBeenCalledWith('5', 'assignment:created', { assignment: mirror.created }, undefined);
      expect(broadcast).toHaveBeenCalledWith(
        '5',
        'assignment:reordered',
        { dayId: 11, orderedIds: [70, 78, 71] },
        undefined,
      );
      expect(broadcast).toHaveBeenCalledWith('5', 'roadtripVia:changed', { dayId: 11, vias: [] }, undefined);
      // The booking's own event is still the sender's echo, and still suppressed, and
      // the journey reconcile behind announceMirror still gets the socket id (ACC-CTL-002).
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:updated', { accommodation: { id: 9 } }, 'sock');
    });
  });

  describe('DELETE /:id', () => {
    it('404 when missing', async () => {
      const svc = makeService({ get: vi.fn().mockReturnValue(undefined) } as Partial<AccommodationsService>);
      expect(await thrownAsync(() => new AccommodationsController(svc).remove(user, '5', '9'))).toEqual({
        status: 404,
        body: { error: 'Accommodation not found' },
      });
    });

    it('emits the linked reservation/budget cascade then accommodation:deleted', async () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const remove = vi.fn().mockReturnValue({
        linkedReservationId: 4,
        deletedBudgetItemId: 7,
        linkedReservationIds: [4],
        deletedBudgetItemIds: [7],
        mirror: noMirror,
      });
      const broadcast = vi.fn();
      const svc = makeService({ get, remove, broadcast } as Partial<AccommodationsService>);
      expect(await new AccommodationsController(svc).remove(user, '5', '9', 'sock')).toEqual({
        success: true,
        removedAssignments: [],
      });
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:deleted', { reservationId: 4 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:deleted', { itemId: 7 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:deleted', { accommodationId: 9 }, 'sock');
    });

    it('emits one event per booking when a stay carried more than one (#1869)', async () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const remove = vi.fn().mockReturnValue({
        linkedReservationId: 4,
        deletedBudgetItemId: null,
        linkedReservationIds: [4, 5],
        deletedBudgetItemIds: [],
        mirror: noMirror,
      });
      const broadcast = vi.fn();
      const svc = makeService({ get, remove, broadcast } as Partial<AccommodationsService>);
      await new AccommodationsController(svc).remove(user, '5', '9', 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:deleted', { reservationId: 4 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:deleted', { reservationId: 5 }, 'sock');
    });

    it('ACC-CTL-005 ?keepStop=true is what turns a night back into an ordinary pause', async () => {
      // The road trip popup switching the night off: the booking goes, the stop it
      // brought stays where it is in the drive. Nothing else may pass that flag, so
      // only the literal string counts.
      const get = vi.fn().mockReturnValue({ id: 9 });
      const remove = vi.fn().mockReturnValue({
        linkedReservationId: null,
        deletedBudgetItemId: null,
        linkedReservationIds: [],
        deletedBudgetItemIds: [],
        mirror: noMirror,
      });
      const svc = makeService({ get, remove } as Partial<AccommodationsService>);
      const controller = new AccommodationsController(svc);

      await controller.remove(user, '5', '9', 'sock', 'true');
      expect(remove).toHaveBeenLastCalledWith('9', { keepStop: true });

      await controller.remove(user, '5', '9', 'sock');
      expect(remove).toHaveBeenLastCalledWith('9', { keepStop: false });
    });
  });
});
