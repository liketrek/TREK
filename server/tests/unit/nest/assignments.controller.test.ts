import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { DayAssignmentsController, AssignmentOpsController } from '../../../src/nest/assignments/assignments.controller';
import type { AssignmentsService } from '../../../src/nest/assignments/assignments.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { user_id: 1 };

function svc(o: Partial<AssignmentsService> = {}): AssignmentsService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip), canEdit: vi.fn().mockReturnValue(true), broadcast: vi.fn(),
    dayExists: vi.fn().mockReturnValue(true), placeExists: vi.fn().mockReturnValue(true), notifyPlaceCreated: vi.fn(),
    ...o,
  } as unknown as AssignmentsService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('DayAssignmentsController (parity with the legacy day-assignments routes)', () => {
  it('404 trip, then 404 day on GET', () => {
    expect(thrown(() => new DayAssignmentsController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).list(user, '5', '3'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    expect(thrown(() => new DayAssignmentsController(svc({ dayExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).list(user, '5', '3'))).toEqual({ status: 404, body: { error: 'Day not found' } });
  });

  it('GET returns assignments (access-only, no permission gate)', () => {
    const s = svc({ canEdit: vi.fn().mockReturnValue(false), listDayAssignments: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AssignmentsService>);
    expect(new DayAssignmentsController(s).list(user, '5', '3')).toEqual({ assignments: [{ id: 1 }] });
  });

  describe('POST', () => {
    it('403 without day_edit; 404 place not found; then creates + hooks', () => {
      expect(thrown(() => new DayAssignmentsController(svc({ canEdit: vi.fn().mockReturnValue(false) })).create(user, '5', '3', { place_id: 2 }))).toEqual({ status: 403, body: { error: 'No permission' } });
      expect(thrown(() => new DayAssignmentsController(svc({ placeExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).create(user, '5', '3', { place_id: 2 }))).toEqual({ status: 404, body: { error: 'Place not found' } });
      const createAssignment = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn(); const notifyPlaceCreated = vi.fn();
      const s = svc({ createAssignment, broadcast, notifyPlaceCreated } as Partial<AssignmentsService>);
      expect(new DayAssignmentsController(s).create(user, '5', '3', { place_id: 2, notes: 'n' }, 'sock')).toEqual({ assignment: { id: 9 } });
      expect(createAssignment).toHaveBeenCalledWith('3', 2, 'n');
      expect(broadcast).toHaveBeenCalledWith('5', 'assignment:created', { assignment: { id: 9 } }, 'sock');
      expect(notifyPlaceCreated).toHaveBeenCalledWith('5', 2);
    });
  });

  it('PUT /reorder 404 day, else reorders + broadcasts', () => {
    expect(thrown(() => new DayAssignmentsController(svc({ dayExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).reorder(user, '5', '3', [1, 2]))).toEqual({ status: 404, body: { error: 'Day not found' } });
    const reorderAssignments = vi.fn(); const broadcast = vi.fn();
    expect(new DayAssignmentsController(svc({ reorderAssignments, broadcast } as Partial<AssignmentsService>)).reorder(user, '5', '3', [2, 1], 'sock')).toEqual({ success: true });
    expect(broadcast).toHaveBeenCalledWith('5', 'assignment:reordered', { dayId: 3, orderedIds: [2, 1] }, 'sock');
  });

  it('DELETE /:id 404 when not in day, else success', () => {
    expect(thrown(() => new DayAssignmentsController(svc({ assignmentExistsInDay: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).remove(user, '5', '3', '9'))).toEqual({ status: 404, body: { error: 'Assignment not found' } });
    const s = svc({ assignmentExistsInDay: vi.fn().mockReturnValue(true), deleteAssignment: vi.fn() } as Partial<AssignmentsService>);
    expect(new DayAssignmentsController(s).remove(user, '5', '3', '9')).toEqual({ success: true });
  });
});

describe('AssignmentOpsController (parity with the per-assignment op routes)', () => {
  it('PUT /:id/move 404 assignment, 404 target day, else moves', () => {
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue(undefined) } as Partial<AssignmentsService>)).move(user, '5', '9', { new_day_id: 4 }))).toEqual({ status: 404, body: { error: 'Assignment not found' } });
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ day_id: 3 }), dayExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).move(user, '5', '9', { new_day_id: 4 }))).toEqual({ status: 404, body: { error: 'Target day not found' } });
    const moveAssignment = vi.fn().mockReturnValue({ assignment: { id: 9 } }); const broadcast = vi.fn();
    const s = svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ day_id: 3 }), moveAssignment, broadcast } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).move(user, '5', '9', { new_day_id: 4, order_index: 0 }, 'sock')).toEqual({ assignment: { id: 9 } });
    expect(moveAssignment).toHaveBeenCalledWith('9', 4, 0, 3);
    expect(broadcast).toHaveBeenCalledWith('5', 'assignment:moved', { assignment: { id: 9 }, oldDayId: 3, newDayId: 4 }, 'sock');
  });

  it('GET /:id/participants returns participants (access-only)', () => {
    const s = svc({ getParticipants: vi.fn().mockReturnValue([{ user_id: 2 }]) } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).participants(user, '5', '9')).toEqual({ participants: [{ user_id: 2 }] });
  });

  it('PUT /:id/time 404 missing, else updates', () => {
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue(undefined) } as Partial<AssignmentsService>)).time(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'Assignment not found' } });
    const updateTime = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn();
    const s = svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ id: 9 }), updateTime, broadcast } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).time(user, '5', '9', { place_time: '10:00' }, 'sock')).toEqual({ assignment: { id: 9 } });
    expect(updateTime).toHaveBeenCalledWith('9', '10:00', undefined);
  });

  it('PUT /:id/participants 400 not array, else sets + broadcasts', () => {
    expect(thrown(() => new AssignmentOpsController(svc()).setParticipants(user, '5', '9', 'no'))).toEqual({ status: 400, body: { error: 'user_ids must be an array' } });
    const setParticipants = vi.fn().mockReturnValue([{ user_id: 2 }]); const broadcast = vi.fn();
    expect(new AssignmentOpsController(svc({ setParticipants, broadcast } as Partial<AssignmentsService>)).setParticipants(user, '5', '9', [2], 'sock')).toEqual({ participants: [{ user_id: 2 }] });
    expect(broadcast).toHaveBeenCalledWith('5', 'assignment:participants', { assignmentId: 9, participants: [{ user_id: 2 }] }, 'sock');
  });
});
