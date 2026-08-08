// FE-TSLICE-DAYS-001 to FE-TSLICE-DAYS-008 (whole-day reorder + insert, #589)
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildDay, buildReservation } from '../../../tests/helpers/factories';
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
});
