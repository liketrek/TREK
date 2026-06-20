import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { DaysController } from '../../../src/nest/days/days.controller';
import { DayNotesController } from '../../../src/nest/days/day-notes.controller';
import { DayReorderError } from '../../../src/services/dayService';
import type { DaysService } from '../../../src/nest/days/days.service';
import type { DayNotesService } from '../../../src/nest/days/day-notes.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { user_id: 1 };

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

function daysSvc(o: Partial<DaysService> = {}): DaysService {
  return { verifyTripAccess: vi.fn().mockReturnValue(trip), canEdit: vi.fn().mockReturnValue(true), broadcast: vi.fn(), ...o } as unknown as DaysService;
}
function notesSvc(o: Partial<DayNotesService> = {}): DayNotesService {
  return { verifyTripAccess: vi.fn().mockReturnValue(trip), canEdit: vi.fn().mockReturnValue(true), broadcast: vi.fn(), ...o } as unknown as DayNotesService;
}

describe('DaysController (parity with the legacy /api/trips/:tripId/days route)', () => {
  it('404 when trip not accessible', () => {
    const svc = daysSvc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => new DaysController(svc).list(user, '5'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('GET / returns the list service result verbatim (the { days } envelope)', () => {
    const svc = daysSvc({ list: vi.fn().mockReturnValue({ days: [{ id: 1 }] }) } as Partial<DaysService>);
    expect(new DaysController(svc).list(user, '5')).toEqual({ days: [{ id: 1 }] });
  });

  it('POST / 403 without day_edit, then creates + broadcasts', () => {
    expect(thrown(() => new DaysController(daysSvc({ canEdit: vi.fn().mockReturnValue(false) })).create(user, '5', {}))).toEqual({ status: 403, body: { error: 'No permission' } });
    const create = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn();
    expect(new DaysController(daysSvc({ create, broadcast } as Partial<DaysService>)).create(user, '5', { date: '2026-07-01' }, 'sock')).toEqual({ day: { id: 9 } });
    expect(create).toHaveBeenCalledWith('5', '2026-07-01', undefined);
    expect(broadcast).toHaveBeenCalledWith('5', 'day:created', { day: { id: 9 } }, 'sock');
  });

  it('POST / 404 when the trip is not accessible', () => {
    const svc = daysSvc({ verifyTripAccess: vi.fn().mockReturnValue(null) });
    expect(thrown(() => new DaysController(svc).create(user, '5', {}))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('POST / with a position inserts + broadcasts day:reordered', () => {
    const insert = vi.fn().mockReturnValue({ id: 12 }); const create = vi.fn(); const broadcast = vi.fn();
    const svc = daysSvc({ insert, create, broadcast } as Partial<DaysService>);
    expect(new DaysController(svc).create(user, '5', { position: 0 }, 'sock')).toEqual({ day: { id: 12 } });
    expect(insert).toHaveBeenCalledWith('5', 0);
    expect(create).not.toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledWith('5', 'day:reordered', { day: { id: 12 } }, 'sock');
  });

  describe('PUT /reorder', () => {
    it('404 when the trip is not accessible', () => {
      const svc = daysSvc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) });
      expect(thrown(() => new DaysController(svc).reorder(user, '5', { orderedIds: [1, 2] }))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    });

    it('403 without day_edit', () => {
      const svc = daysSvc({ canEdit: vi.fn().mockReturnValue(false) });
      expect(thrown(() => new DaysController(svc).reorder(user, '5', { orderedIds: [1, 2] }))).toEqual({ status: 403, body: { error: 'No permission' } });
    });

    it('400 when orderedIds is missing', () => {
      expect(thrown(() => new DaysController(daysSvc()).reorder(user, '5', {}))).toEqual({ status: 400, body: { error: 'orderedIds must be an array' } });
    });

    it('400 when orderedIds is not an array', () => {
      expect(thrown(() => new DaysController(daysSvc()).reorder(user, '5', { orderedIds: 'nope' as never }))).toEqual({ status: 400, body: { error: 'orderedIds must be an array' } });
    });

    it('maps a DayReorderError to 400 with its message', () => {
      const reorder = vi.fn(() => { throw new DayReorderError('orderedIds must be a permutation of the trip day ids.'); });
      const svc = daysSvc({ reorder } as Partial<DaysService>);
      expect(thrown(() => new DaysController(svc).reorder(user, '5', { orderedIds: [9] }))).toEqual({
        status: 400, body: { error: 'orderedIds must be a permutation of the trip day ids.' },
      });
    });

    it('rethrows a non-DayReorderError unchanged', () => {
      const boom = new Error('db is down');
      const reorder = vi.fn(() => { throw boom; });
      const svc = daysSvc({ reorder } as Partial<DaysService>);
      expect(() => new DaysController(svc).reorder(user, '5', { orderedIds: [1, 2] })).toThrow(boom);
    });

    it('reorders and broadcasts day:reordered', () => {
      const reorder = vi.fn(); const broadcast = vi.fn();
      const svc = daysSvc({ reorder, broadcast } as Partial<DaysService>);
      expect(new DaysController(svc).reorder(user, '5', { orderedIds: [2, 1] }, 'sock')).toEqual({ success: true });
      expect(reorder).toHaveBeenCalledWith('5', [2, 1]);
      expect(broadcast).toHaveBeenCalledWith('5', 'day:reordered', { orderedIds: [2, 1] }, 'sock');
    });
  });

  it('PUT /:id 404 when the day is missing, else updates', () => {
    expect(thrown(() => new DaysController(daysSvc({ getDay: vi.fn().mockReturnValue(undefined) } as Partial<DaysService>)).update(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'Day not found' } });
    const update = vi.fn().mockReturnValue({ id: 9, title: 'T' });
    const svc = daysSvc({ getDay: vi.fn().mockReturnValue({ id: 9 }), update } as Partial<DaysService>);
    expect(new DaysController(svc).update(user, '5', '9', { title: 'T' })).toEqual({ day: { id: 9, title: 'T' } });
  });

  it('DELETE /:id 404 when missing, else success', () => {
    expect(thrown(() => new DaysController(daysSvc({ getDay: vi.fn().mockReturnValue(undefined) } as Partial<DaysService>)).remove(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Day not found' } });
    const svc = daysSvc({ getDay: vi.fn().mockReturnValue({ id: 9 }), remove: vi.fn() } as Partial<DaysService>);
    expect(new DaysController(svc).remove(user, '5', '9')).toEqual({ success: true });
  });
});

describe('DayNotesController (parity with the legacy /api/.../days/:dayId/notes route)', () => {
  it('400 on an over-long text BEFORE the trip-access check (middleware order)', () => {
    const verifyTripAccess = vi.fn().mockReturnValue(undefined); // would 404 if reached
    const svc = notesSvc({ verifyTripAccess });
    expect(thrown(() => new DayNotesController(svc).create(user, '5', '3', { text: 'x'.repeat(501) }))).toEqual({
      status: 400, body: { error: 'text must be 500 characters or less' },
    });
    expect(verifyTripAccess).not.toHaveBeenCalled();
  });

  it('400 on an over-long time', () => {
    expect(thrown(() => new DayNotesController(notesSvc()).create(user, '5', '3', { text: 'ok', time: 'y'.repeat(251) }))).toEqual({
      status: 400, body: { error: 'time must be 250 characters or less' },
    });
  });

  it('404 trip, 403 permission, 404 day, 400 empty text, then creates', () => {
    expect(thrown(() => new DayNotesController(notesSvc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).create(user, '5', '3', { text: 'ok' }))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    expect(thrown(() => new DayNotesController(notesSvc({ canEdit: vi.fn().mockReturnValue(false) })).create(user, '5', '3', { text: 'ok' }))).toEqual({ status: 403, body: { error: 'No permission' } });
    expect(thrown(() => new DayNotesController(notesSvc({ dayExists: vi.fn().mockReturnValue(false) } as Partial<DayNotesService>)).create(user, '5', '3', { text: 'ok' }))).toEqual({ status: 404, body: { error: 'Day not found' } });
    expect(thrown(() => new DayNotesController(notesSvc({ dayExists: vi.fn().mockReturnValue(true) } as Partial<DayNotesService>)).create(user, '5', '3', { text: '  ' }))).toEqual({ status: 400, body: { error: 'Text required' } });
    const create = vi.fn().mockReturnValue({ id: 7 }); const broadcast = vi.fn();
    const svc = notesSvc({ dayExists: vi.fn().mockReturnValue(true), create, broadcast } as Partial<DayNotesService>);
    expect(new DayNotesController(svc).create(user, '5', '3', { text: 'Lunch', time: '12:00' }, 'sock')).toEqual({ note: { id: 7 } });
    expect(create).toHaveBeenCalledWith('3', '5', 'Lunch', '12:00', undefined, undefined);
    expect(broadcast).toHaveBeenCalledWith('5', 'dayNote:created', { dayId: 3, note: { id: 7 } }, 'sock');
  });

  it('GET / returns notes; PUT/DELETE 404 when the note is missing', () => {
    const svc = notesSvc({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<DayNotesService>);
    expect(new DayNotesController(svc).list(user, '5', '3')).toEqual({ notes: [{ id: 1 }] });
    expect(thrown(() => new DayNotesController(notesSvc({ getNote: vi.fn().mockReturnValue(undefined) } as Partial<DayNotesService>)).update(user, '5', '3', '9', { text: 'x' }))).toEqual({ status: 404, body: { error: 'Note not found' } });
    expect(thrown(() => new DayNotesController(notesSvc({ getNote: vi.fn().mockReturnValue(undefined) } as Partial<DayNotesService>)).remove(user, '5', '3', '9'))).toEqual({ status: 404, body: { error: 'Note not found' } });
  });

  it('PUT/DELETE update + delete a note with broadcasts', () => {
    const update = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn();
    const u = notesSvc({ getNote: vi.fn().mockReturnValue({ id: 9 }), update, broadcast } as Partial<DayNotesService>);
    expect(new DayNotesController(u).update(user, '5', '3', '9', { text: 'x' }, 'sock')).toEqual({ note: { id: 9 } });
    expect(broadcast).toHaveBeenCalledWith('5', 'dayNote:updated', { dayId: 3, note: { id: 9 } }, 'sock');
    const remove = vi.fn(); const b2 = vi.fn();
    const d = notesSvc({ getNote: vi.fn().mockReturnValue({ id: 9 }), remove, broadcast: b2 } as Partial<DayNotesService>);
    expect(new DayNotesController(d).remove(user, '5', '3', '9', 'sock')).toEqual({ success: true });
    expect(b2).toHaveBeenCalledWith('5', 'dayNote:deleted', { noteId: 9, dayId: 3 }, 'sock');
  });
});
