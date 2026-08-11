import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { DaysController } from '../../../src/nest/days/days.controller';
import { DayNotesController } from '../../../src/nest/day-notes/day-notes.controller';
import { DayNoteCreateDto, DayNoteUpdateDto } from '../../../src/nest/day-notes/day-notes.dto';
import { DayReorderError } from '../../../src/nest/days/days.service';
import type { DayReorderDto } from '../../../src/nest/days/days.dto';
import type { DaysService } from '../../../src/nest/days/days.service';
import type { DayNotesService } from '../../../src/nest/day-notes/day-notes.service';
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

// reorder() keeps the legacy raw-body guard on orderedIds, which DayReorderDto's type
// says can never fire: over HTTP the ZodValidationPipe rejects such a body first. These
// unit tests call the handler directly, so they can still reach the guard, and the
// payload is cast instead of being made to satisfy the DTO.
function rawReorderBody(body: Record<string, unknown>): DayReorderDto {
  return body as unknown as DayReorderDto;
}

describe('DaysController (parity with the legacy /api/trips/:tripId/days route)', () => {
  // The 404 "Trip not found" and 403 "No permission" cases moved to
  // trip-access.guard.test.ts with the check itself: TripAccessGuard resolves :tripId
  // for the whole controller now, so a handler is only ever reached for a trip the
  // user may see. What is left here is what the handlers themselves still decide.

  it('GET / returns the list service result verbatim (the { days } envelope)', () => {
    const svc = daysSvc({ list: vi.fn().mockReturnValue({ days: [{ id: 1 }] }) } as Partial<DaysService>);
    expect(new DaysController(svc).list(user, '5')).toEqual({ days: [{ id: 1 }] });
  });

  it('POST / creates + broadcasts', () => {
    const create = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn();
    expect(new DaysController(daysSvc({ create, broadcast } as Partial<DaysService>)).create(user, '5', { date: '2026-07-01' }, 'sock')).toEqual({ day: { id: 9 } });
    expect(create).toHaveBeenCalledWith('5', '2026-07-01', undefined);
    expect(broadcast).toHaveBeenCalledWith('5', 'day:created', { day: { id: 9 } }, 'sock');
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


    it('400 when orderedIds is missing', () => {
      expect(thrown(() => new DaysController(daysSvc()).reorder(user, '5', rawReorderBody({})))).toEqual({ status: 400, body: { error: 'orderedIds must be an array' } });
    });

    it('400 when orderedIds is not an array', () => {
      expect(thrown(() => new DaysController(daysSvc()).reorder(user, '5', rawReorderBody({ orderedIds: 'nope' })))).toEqual({ status: 400, body: { error: 'orderedIds must be an array' } });
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
  // The legacy in-controller length guard moved to the global ZodValidationPipe
  // (day-notes.dto.ts over the @trek/shared schemas) — like the old guard it
  // rejects before the trip-access check. The pipe path is exercised end-to-end
  // in tests/e2e/days.e2e.test.ts; here we pin the caps on the DTO schemas.
  it('DTO schemas carry the length caps and moveDayNote nulls', () => {
    expect(DayNoteCreateDto.schema.safeParse({ text: 'x'.repeat(501) }).success).toBe(false);
    // The body cap moved to 2000 with #1629 (formatted Markdown); the title did not.
    expect(DayNoteCreateDto.schema.safeParse({ text: 'ok', time: 'y'.repeat(2001) }).success).toBe(false);
    expect(DayNoteCreateDto.schema.safeParse({ text: 'ok', time: 'y'.repeat(2000) }).success).toBe(true);
    expect(DayNoteCreateDto.schema.safeParse({ text: 'ok', time: null, icon: null }).success).toBe(true);
    expect(DayNoteUpdateDto.schema.safeParse({ time: 'y'.repeat(2001) }).success).toBe(false);
    expect(DayNoteUpdateDto.schema.safeParse({ time: null }).success).toBe(true);
    expect(DayNoteUpdateDto.schema.safeParse({ color: '#dc2626' }).success).toBe(true);
  });

  // Trip access and day_edit are TripAccessGuard's now (trip-access.guard.test.ts);
  // what stays here is what this handler decides for itself.
  it('404 day, 400 empty text, then creates', () => {
    expect(thrown(() => new DayNotesController(notesSvc({ dayExists: vi.fn().mockReturnValue(false) } as Partial<DayNotesService>)).create(user, '5', '3', { text: 'ok' }))).toEqual({ status: 404, body: { error: 'Day not found' } });
    expect(thrown(() => new DayNotesController(notesSvc({ dayExists: vi.fn().mockReturnValue(true) } as Partial<DayNotesService>)).create(user, '5', '3', { text: '  ' }))).toEqual({ status: 400, body: { error: 'Text required' } });
    const create = vi.fn().mockReturnValue({ id: 7 }); const broadcast = vi.fn();
    const svc = notesSvc({ dayExists: vi.fn().mockReturnValue(true), create, broadcast } as Partial<DayNotesService>);
    expect(new DayNotesController(svc).create(user, '5', '3', { text: 'Lunch', time: '12:00' }, 'sock')).toEqual({ note: { id: 7 } });
    expect(create).toHaveBeenCalledWith('3', '5', 'Lunch', '12:00', undefined, undefined, undefined);
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
