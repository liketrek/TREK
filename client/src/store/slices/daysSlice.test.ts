// FE-TSLICE-DAYS-001 to FE-TSLICE-DAYS-013 (whole-day reorder + insert, #589; delete; dated append)
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildAssignment, buildDay, buildDayNote, buildReservation, buildTrip } from '../../../tests/helpers/factories';
import { useTripStore } from '../tripStore';
import type { Day } from '../../types';

beforeEach(() => {
  resetAllStores();
  server.resetHandlers();
});

function datedDays(): Day[] {
  return [
    buildDay({ id: 1, trip_id: 1, day_number: 1, date: '2025-06-01', title: 'Arrival' }),
    buildDay({ id: 2, trip_id: 1, day_number: 2, date: '2025-06-02', title: 'Museums' }),
    buildDay({ id: 3, trip_id: 1, day_number: 3, date: '2025-06-03', title: 'Departure' }),
  ];
}

describe('daysSlice', () => {
  describe('reorderDays', () => {
    it('FE-TSLICE-DAYS-001: optimistically renumbers days and pins the dates to their slots', async () => {
      seedStore(useTripStore, { days: datedDays() });

      let optimistic: Day[] = [];
      server.use(
        http.put('/api/trips/1/days/reorder', () => {
          optimistic = useTripStore.getState().days;
          return HttpResponse.json({ success: true });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: datedDays() })),
      );

      await useTripStore.getState().reorderDays(1, [3, 1, 2]);

      expect(optimistic.map(d => d.id)).toEqual([3, 1, 2]);
      expect(optimistic.map(d => d.day_number)).toEqual([1, 2, 3]);
      // Content moves across the slots; the dates stay pinned to the slots.
      expect(optimistic.map(d => d.date)).toEqual(['2025-06-01', '2025-06-02', '2025-06-03']);
      expect(optimistic[0].title).toBe('Departure');
    });

    it('FE-TSLICE-DAYS-002: sends the requested order and refreshes days plus bookings', async () => {
      seedStore(useTripStore, { days: datedDays(), reservations: [] });

      let sent: number[] = [];
      const serverDays = [
        buildDay({ id: 3, trip_id: 1, day_number: 1, date: '2025-06-01', title: 'Departure' }),
        buildDay({ id: 1, trip_id: 1, day_number: 2, date: '2025-06-02', title: 'Arrival' }),
        buildDay({ id: 2, trip_id: 1, day_number: 3, date: '2025-06-03', title: 'Museums' }),
      ];
      server.use(
        http.put('/api/trips/1/days/reorder', async ({ request }) => {
          const body = await request.json() as { orderedIds: number[] };
          sent = body.orderedIds;
          return HttpResponse.json({ success: true });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: serverDays })),
        http.get('/api/trips/1/reservations', () =>
          HttpResponse.json({ reservations: [buildReservation({ id: 77, trip_id: 1, title: 'Re-stamped' })] }),
        ),
      );

      await useTripStore.getState().reorderDays(1, [3, 1, 2]);

      expect(sent).toEqual([3, 1, 2]);
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([3, 1, 2]);
      expect(useTripStore.getState().reservations.map(r => r.title)).toEqual(['Re-stamped']);
    });

    it('FE-TSLICE-DAYS-003: an undated trip keeps each day carrying its own date', async () => {
      const undated = [
        buildDay({ id: 1, trip_id: 1, day_number: 1, date: null }),
        buildDay({ id: 2, trip_id: 1, day_number: 2, date: null }),
      ];
      seedStore(useTripStore, { days: undated });

      let optimistic: Day[] = [];
      server.use(
        http.put('/api/trips/1/days/reorder', () => {
          optimistic = useTripStore.getState().days;
          return HttpResponse.json({ success: true });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: undated })),
      );

      await useTripStore.getState().reorderDays(1, [2, 1]);

      expect(optimistic.map(d => d.id)).toEqual([2, 1]);
      expect(optimistic.every(d => d.date === null)).toBe(true);
    });

    it('FE-TSLICE-DAYS-004: ids that are not in the store are dropped from the optimistic list', async () => {
      seedStore(useTripStore, { days: datedDays() });

      let optimistic: Day[] = [];
      server.use(
        http.put('/api/trips/1/days/reorder', () => {
          optimistic = useTripStore.getState().days;
          return HttpResponse.json({ success: true });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: datedDays() })),
      );

      await useTripStore.getState().reorderDays(1, [2, 999, 1, 3]);

      expect(optimistic.map(d => d.id)).toEqual([2, 1, 3]);
    });

    it('FE-TSLICE-DAYS-005: rolls back to the previous order and throws the server message', async () => {
      seedStore(useTripStore, { days: datedDays() });
      server.use(
        http.put('/api/trips/1/days/reorder', () =>
          HttpResponse.json({ error: 'Reorder rejected' }, { status: 409 }),
        ),
      );

      await expect(useTripStore.getState().reorderDays(1, [3, 1, 2])).rejects.toThrow('Reorder rejected');

      const days = useTripStore.getState().days;
      expect(days.map(d => d.id)).toEqual([1, 2, 3]);
      expect(days.map(d => d.title)).toEqual(['Arrival', 'Museums', 'Departure']);
    });
  });

  describe('insertDay', () => {
    it('FE-TSLICE-DAYS-006: appends a day, refreshes the list and returns the new day', async () => {
      seedStore(useTripStore, { days: datedDays() });
      const created = buildDay({ id: 4, trip_id: 1, day_number: 4, date: '2025-06-04' });

      let body: Record<string, unknown> = {};
      server.use(
        http.post('/api/trips/1/days', async ({ request }) => {
          body = await request.json() as Record<string, unknown>;
          return HttpResponse.json({ day: created });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: [...datedDays(), created] })),
      );

      const result = await useTripStore.getState().insertDay(1);

      expect(result?.id).toBe(4);
      expect(body.position).toBeUndefined();
      expect(useTripStore.getState().days).toHaveLength(4);
    });

    it('FE-TSLICE-DAYS-007: forwards the 1-based insert position', async () => {
      seedStore(useTripStore, { days: datedDays() });
      const created = buildDay({ id: 5, trip_id: 1, day_number: 2, date: '2025-06-02' });

      let body: Record<string, unknown> = {};
      server.use(
        http.post('/api/trips/1/days', async ({ request }) => {
          body = await request.json() as Record<string, unknown>;
          return HttpResponse.json({ day: created });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: [datedDays()[0], created] })),
      );

      await useTripStore.getState().insertDay(1, 2);

      expect(body.position).toBe(2);
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([1, 5]);
    });

    it('FE-TSLICE-DAYS-008: leaves the day list untouched and throws when the insert fails', async () => {
      seedStore(useTripStore, { days: datedDays() });
      server.use(
        http.post('/api/trips/1/days', () =>
          HttpResponse.json({ error: 'Trip is locked' }, { status: 403 }),
        ),
      );

      await expect(useTripStore.getState().insertDay(1, 2)).rejects.toThrow('Trip is locked');
      // The insert never writes optimistically, so a failure needs no rollback.
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([1, 2, 3]);
    });
  });

  describe('deleteDay', () => {
    const seedDayContent = () => seedStore(useTripStore, {
      trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-03' }),
      days: datedDays(),
      assignments: { '1': [], '2': [buildAssignment({ day_id: 2 })], '3': [] },
      dayNotes: { '1': [], '2': [buildDayNote({ day_id: 2 })], '3': [] },
      selectedDayId: 2,
    });

    it('FE-TSLICE-DAYS-009: closes the gap at once, keeps the dates on their slots and takes the trip it is answered with', async () => {
      seedDayContent();
      const serverDays = [
        buildDay({ id: 1, trip_id: 1, day_number: 1, date: '2025-06-01', title: 'Arrival' }),
        buildDay({ id: 3, trip_id: 1, day_number: 2, date: '2025-06-02', title: 'Departure' }),
      ];
      let optimistic: ReturnType<typeof useTripStore.getState> | null = null;
      server.use(
        http.delete('/api/trips/1/days/2', () => {
          optimistic = useTripStore.getState();
          return HttpResponse.json({ success: true, trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-02' }) });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: serverDays })),
        http.get('/api/trips/1/reservations', () => HttpResponse.json({ reservations: [buildReservation({ id: 5, trip_id: 1, title: 'Let go' })] })),
      );

      await useTripStore.getState().deleteDay(1, 2);

      const during = optimistic as unknown as ReturnType<typeof useTripStore.getState>;
      expect(during.days.map(d => [d.id, d.day_number, d.date])).toEqual([[1, 1, '2025-06-01'], [3, 2, '2025-06-02']]);
      expect('2' in during.assignments).toBe(false);
      expect('2' in during.dayNotes).toBe(false);
      const after = useTripStore.getState();
      expect(after.trip?.end_date).toBe('2025-06-02');
      expect(after.days.map(d => d.id)).toEqual([1, 3]);
      expect(after.reservations.map(r => r.title)).toEqual(['Let go']);
    });

    it('FE-TSLICE-DAYS-010: a refusal puts every field back and throws the server sentence', async () => {
      seedDayContent();
      server.use(http.delete('/api/trips/1/days/2', () => HttpResponse.json({ error: 'A trip needs at least one day.' }, { status: 400 })));

      await expect(useTripStore.getState().deleteDay(1, 2)).rejects.toThrow('A trip needs at least one day.');

      const state = useTripStore.getState();
      expect(state.days.map(d => d.id)).toEqual([1, 2, 3]);
      expect(state.assignments['2']).toHaveLength(1);
      expect(state.dayNotes['2']).toHaveLength(1);
      expect(state.selectedDayId).toBe(2);
      expect(state.trip?.end_date).toBe('2025-06-03');
    });

    it('FE-TSLICE-DAYS-011: a selection on the deleted day clears, one on another day stays', async () => {
      seedDayContent();
      server.use(
        http.delete('/api/trips/1/days/:id', () => HttpResponse.json({ success: true })),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: datedDays() })),
        http.get('/api/trips/1/reservations', () => HttpResponse.json({ reservations: [] })),
      );

      await useTripStore.getState().deleteDay(1, 2);
      expect(useTripStore.getState().selectedDayId).toBeNull();

      seedDayContent();
      await useTripStore.getState().deleteDay(1, 3);
      expect(useTripStore.getState().selectedDayId).toBe(2);
      // Answered without a trip, the store keeps the one it has.
      expect(useTripStore.getState().trip?.end_date).toBe('2025-06-03');
    });
  });

  describe('appendDatedDay', () => {
    it('FE-TSLICE-DAYS-012: asks for the next date, takes the grown trip and pulls the days, but not the bookings', async () => {
      seedStore(useTripStore, {
        trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-03' }),
        days: datedDays(),
      });
      const created = buildDay({ id: 4, trip_id: 1, day_number: 4, date: '2025-06-04' });
      const grown = buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-04', day_count: 4 });

      let body: Record<string, unknown> = {};
      let reservationsLoaded = false;
      server.use(
        http.post('/api/trips/1/days', async ({ request }) => {
          body = await request.json() as Record<string, unknown>;
          return HttpResponse.json({ day: created, trip: grown }, { status: 201 });
        }),
        http.get('/api/trips/1/days', () => HttpResponse.json({ days: [...datedDays(), created] })),
        http.get('/api/trips/1/reservations', () => {
          reservationsLoaded = true;
          return HttpResponse.json({ reservations: [] });
        }),
      );

      const day = await useTripStore.getState().appendDatedDay(1);

      expect(body).toEqual({ dated: true });
      expect(day).toMatchObject({ id: 4, date: '2025-06-04' });
      expect(useTripStore.getState().trip).toMatchObject({ end_date: '2025-06-04', day_count: 4 });
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([1, 2, 3, 4]);
      expect(reservationsLoaded).toBe(false);
    });

    it('FE-TSLICE-DAYS-013: a refusal leaves the trip and the days as they were and throws the server sentence', async () => {
      seedStore(useTripStore, {
        trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-03' }),
        days: datedDays(),
      });
      server.use(
        http.post('/api/trips/1/days', () => HttpResponse.json({ error: 'A trip can span at most 999 days' }, { status: 400 })),
      );

      await expect(useTripStore.getState().appendDatedDay(1)).rejects.toThrow('A trip can span at most 999 days');

      expect(useTripStore.getState().trip?.end_date).toBe('2025-06-03');
      expect(useTripStore.getState().days.map(d => d.id)).toEqual([1, 2, 3]);
    });
  });
});
