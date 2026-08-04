import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildDay, buildAssignment, buildDayNote, buildTrip } from '../../helpers/factories';

beforeEach(() => {
  resetAllStores();
});

describe('remoteEventHandler > days', () => {
  const seedData = () => {
    useTripStore.setState({
      days: [buildDay({ id: 10 }), buildDay({ id: 20 })],
      assignments: {
        '10': [buildAssignment({ id: 100, day_id: 10 })],
        '20': [],
      },
      dayNotes: {
        '10': [buildDayNote({ id: 1, day_id: 10 })],
        '20': [],
      },
    });
  };

  it('FE-WSEVT-DAY-001: day:created adds day to days array', () => {
    seedData();
    const newDay = buildDay({ id: 30 });
    useTripStore.getState().handleRemoteEvent({ type: 'day:created', day: newDay });
    const { days } = useTripStore.getState();
    expect(days).toHaveLength(3);
    expect(days.find(d => d.id === 30)).toBeDefined();
  });

  it('FE-WSEVT-DAY-002: day:created is idempotent — no duplicate if same ID', () => {
    seedData();
    const duplicate = buildDay({ id: 10 });
    useTripStore.getState().handleRemoteEvent({ type: 'day:created', day: duplicate });
    const { days } = useTripStore.getState();
    expect(days).toHaveLength(2);
  });

  it('FE-WSEVT-DAY-003: day:updated replaces day in days array', () => {
    seedData();
    const updated = buildDay({ id: 10, title: 'New Title' });
    useTripStore.getState().handleRemoteEvent({ type: 'day:updated', day: updated });
    const { days } = useTripStore.getState();
    const day10 = days.find(d => d.id === 10);
    expect(day10?.title).toBe('New Title');
  });

  it('FE-WSEVT-DAY-004: day:deleted removes day from days array', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'day:deleted', dayId: 10 });
    const { days } = useTripStore.getState();
    expect(days).toHaveLength(1);
    expect(days.find(d => d.id === 10)).toBeUndefined();
  });

  it('FE-WSEVT-DAY-005: day:deleted removes the assignments key for deleted day', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'day:deleted', dayId: 10 });
    const { assignments } = useTripStore.getState();
    expect('10' in assignments).toBe(false);
  });

  it('FE-WSEVT-DAY-006: day:deleted removes the dayNotes key for deleted day', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'day:deleted', dayId: 10 });
    const { dayNotes } = useTripStore.getState();
    expect('10' in dayNotes).toBe(false);
  });

  it('FE-WSEVT-DAY-007: day:deleted does not remove other days assignments/dayNotes', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'day:deleted', dayId: 10 });
    const { assignments, dayNotes } = useTripStore.getState();
    expect('20' in assignments).toBe(true);
    expect('20' in dayNotes).toBe(true);
  });

  // The reorder is applied optimistically from orderedIds, then the authoritative
  // dates + re-stamped booking times are pulled (#589).
  describe('day:reordered', () => {
    const stubRefresh = () => {
      const refreshDays = vi.fn(async () => {});
      const loadReservations = vi.fn(async () => {});
      useTripStore.setState({ refreshDays, loadReservations });
      return { refreshDays, loadReservations };
    };

    const seedThreeDays = () => {
      useTripStore.setState({
        trip: buildTrip({ id: 7 }),
        days: [
          buildDay({ id: 10, day_number: 1 }),
          buildDay({ id: 20, day_number: 2 }),
          buildDay({ id: 30, day_number: 3 }),
        ],
      });
    };

    it('FE-WSEVT-DAY-008: applies the new order and renumbers day_number', () => {
      seedThreeDays();
      stubRefresh();
      useTripStore.getState().handleRemoteEvent({ type: 'day:reordered', orderedIds: [30, 10, 20] });
      const { days } = useTripStore.getState();
      expect(days.map(d => d.id)).toEqual([30, 10, 20]);
      expect(days.map(d => d.day_number)).toEqual([1, 2, 3]);
    });

    it('FE-WSEVT-DAY-009: pulls the authoritative days + reservations after a reorder', () => {
      seedThreeDays();
      const { refreshDays, loadReservations } = stubRefresh();
      useTripStore.getState().handleRemoteEvent({ type: 'day:reordered', orderedIds: [30, 10, 20] });
      expect(refreshDays).toHaveBeenCalledWith(7);
      expect(loadReservations).toHaveBeenCalledWith(7);
    });

    it('FE-WSEVT-DAY-010: a partial orderedIds list leaves the order untouched', () => {
      seedThreeDays();
      stubRefresh();
      useTripStore.getState().handleRemoteEvent({ type: 'day:reordered', orderedIds: [30, 10] });
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([10, 20, 30]);
    });

    it('FE-WSEVT-DAY-011: an unknown day id leaves the order untouched', () => {
      seedThreeDays();
      stubRefresh();
      useTripStore.getState().handleRemoteEvent({ type: 'day:reordered', orderedIds: [30, 10, 999] });
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([10, 20, 30]);
    });

    it('FE-WSEVT-DAY-012: a missing orderedIds payload is a no-op', () => {
      seedThreeDays();
      stubRefresh();
      useTripStore.getState().handleRemoteEvent({ type: 'day:reordered' });
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([10, 20, 30]);
    });

    it('FE-WSEVT-DAY-013: without a loaded trip nothing is refetched', () => {
      useTripStore.setState({ trip: null, days: [buildDay({ id: 10 }), buildDay({ id: 20 })] });
      const { refreshDays, loadReservations } = stubRefresh();
      useTripStore.getState().handleRemoteEvent({ type: 'day:reordered', orderedIds: [20, 10] });
      expect(refreshDays).not.toHaveBeenCalled();
      expect(loadReservations).not.toHaveBeenCalled();
    });
  });
});
