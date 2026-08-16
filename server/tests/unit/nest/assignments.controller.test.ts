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
    dayExists: vi.fn().mockReturnValue(true), placeExists: vi.fn().mockReturnValue(true), reconcile: vi.fn(),
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
  // The 404 "Trip not found" and 403 "No permission" cases moved to
  // trip-access.guard.test.ts with the check itself.
  it('404 day on GET', () => {
    const s = svc({ dayExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>);
    expect(thrown(() => new DayAssignmentsController(s).list(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Day not found' } });
  });

  it('GET returns assignments (access-only, no permission gate)', () => {
    const s = svc({ canEdit: vi.fn().mockReturnValue(false), listDayAssignments: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AssignmentsService>);
    expect(new DayAssignmentsController(s).list(user, '5', '3')).toEqual({ assignments: [{ id: 1 }] });
  });

  describe('POST', () => {
    it('404 place not found; then creates + hooks', () => {
      expect(thrown(() => new DayAssignmentsController(svc({ placeExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).create(user, '5', '3', { place_id: 2 }))).toEqual({ status: 404, body: { error: 'Place not found' } });
      const createAssignment = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn(); const reconcile = vi.fn();
      const s = svc({ createAssignment, broadcast, reconcile } as Partial<AssignmentsService>);
      expect(new DayAssignmentsController(s).create(user, '5', '3', { place_id: 2, notes: 'n' }, 'sock')).toEqual({ assignment: { id: 9 } });
      expect(createAssignment).toHaveBeenCalledWith('3', 2, 'n');
      expect(broadcast).toHaveBeenCalledWith('5', 'assignment:created', { assignment: { id: 9 } }, 'sock');
      expect(reconcile).toHaveBeenCalledWith('5', 'sock');
    });
  });

  it('PUT /reorder 404 day, else reorders + broadcasts', () => {
    expect(thrown(() => new DayAssignmentsController(svc({ dayExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).reorder(user, '5', '3', { orderedIds: [1, 2] }))).toEqual({ status: 404, body: { error: 'Day not found' } });
    const reorderAssignments = vi.fn(); const broadcast = vi.fn();
    expect(new DayAssignmentsController(svc({ reorderAssignments, broadcast } as Partial<AssignmentsService>)).reorder(user, '5', '3', { orderedIds: [2, 1] }, 'sock')).toEqual({ success: true });
    expect(reorderAssignments).toHaveBeenCalledWith('3', [2, 1]);
    expect(broadcast).toHaveBeenCalledWith('5', 'assignment:reordered', { dayId: 3, orderedIds: [2, 1] }, 'sock');
  });

  it('DELETE /:id 404 when not in day, else success', () => {
    expect(thrown(() => new DayAssignmentsController(svc({ assignmentExistsInDay: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).remove(user, '5', '3', '9'))).toEqual({ status: 404, body: { error: 'Assignment not found' } });
    const reconcile = vi.fn();
    const s = svc({ assignmentExistsInDay: vi.fn().mockReturnValue(true), deleteAssignment: vi.fn(), reconcile } as Partial<AssignmentsService>);
    expect(new DayAssignmentsController(s).remove(user, '5', '3', '9', 'sock')).toEqual({ success: true });
    expect(reconcile).toHaveBeenCalledWith('5', 'sock');
  });
});

describe('AssignmentOpsController (parity with the per-assignment op routes)', () => {
  it('PUT /:id/move 404 assignment, 404 target day, else moves', () => {
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue(undefined) } as Partial<AssignmentsService>)).move(user, '5', '9', { new_day_id: 4 }))).toEqual({ status: 404, body: { error: 'Assignment not found' } });
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ day_id: 3 }), dayExists: vi.fn().mockReturnValue(false) } as Partial<AssignmentsService>)).move(user, '5', '9', { new_day_id: 4 }))).toEqual({ status: 404, body: { error: 'Target day not found' } });
    const moveAssignment = vi.fn().mockReturnValue({ assignment: { id: 9 }, oldDayId: 3 }); const broadcast = vi.fn(); const reconcile = vi.fn();
    const s = svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ day_id: 3 }), moveAssignment, broadcast, reconcile } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).move(user, '5', '9', { new_day_id: 4, order_index: 0 }, 'sock')).toEqual({ assignment: { id: 9 } });
    expect(moveAssignment).toHaveBeenCalledWith('9', 4, 0);
    expect(broadcast).toHaveBeenCalledWith('5', 'assignment:moved', { assignment: { id: 9 }, oldDayId: 3, newDayId: 4 }, 'sock');
    expect(reconcile).toHaveBeenCalledWith('5', 'sock');
  });

  it('GET /:id/participants 404 when the assignment is on another trip, else returns participants (access-only)', () => {
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue(undefined) } as Partial<AssignmentsService>)).participants(user, '5', '9')))
      .toEqual({ status: 404, body: { error: 'Assignment not found' } });
    const s = svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ id: 9 }), getParticipants: vi.fn().mockReturnValue([{ user_id: 2 }]) } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).participants(user, '5', '9')).toEqual({ participants: [{ user_id: 2 }] });
  });

  it('PUT /:id/time 404 missing, else updates', () => {
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue(undefined) } as Partial<AssignmentsService>)).time(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'Assignment not found' } });
    const updateTime = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn(); const reconcile = vi.fn();
    const s = svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ id: 9 }), updateTime, broadcast, reconcile } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).time(user, '5', '9', { place_time: '10:00' }, 'sock')).toEqual({ assignment: { id: 9 } });
    expect(updateTime).toHaveBeenCalledWith('9', '10:00', undefined);
    expect(reconcile).toHaveBeenCalledWith('5', 'sock');
  });

  it('PUT /:id/participants 404 on a foreign assignment, else sets + broadcasts (non-array bodies are the Zod pipe\'s 400, covered in e2e)', () => {
    const setParticipants = vi.fn().mockReturnValue([{ user_id: 2 }]); const broadcast = vi.fn();
    expect(thrown(() => new AssignmentOpsController(svc({ getAssignmentForTrip: vi.fn().mockReturnValue(undefined), setParticipants } as Partial<AssignmentsService>)).setParticipants(user, '5', '9', { user_ids: [2] })))
      .toEqual({ status: 404, body: { error: 'Assignment not found' } });
    expect(setParticipants).not.toHaveBeenCalled();
    const s = svc({ getAssignmentForTrip: vi.fn().mockReturnValue({ id: 9 }), setParticipants, broadcast } as Partial<AssignmentsService>);
    expect(new AssignmentOpsController(s).setParticipants(user, '5', '9', { user_ids: [2] }, 'sock')).toEqual({ participants: [{ user_id: 2 }] });
    // The trip comes along so the service can confine the ids to its roster.
    expect(setParticipants).toHaveBeenCalledWith('9', [2], '5');
    expect(broadcast).toHaveBeenCalledWith('5', 'assignment:participants', { assignmentId: 9, participants: [{ user_id: 2 }] }, 'sock');
  });
});
