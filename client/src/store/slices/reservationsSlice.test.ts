// FE-STORE-RESERVATIONS-001 to FE-STORE-RESERVATIONS-005
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildBudgetItem, buildReservation } from '../../../tests/helpers/factories';
import { useTripStore } from '../tripStore';

beforeEach(() => {
  resetAllStores();
  server.resetHandlers();
});

describe('reservationsSlice', () => {
  it('FE-STORE-RESERVATIONS-001: setReservationTravelers patches travelers on matching reservation', async () => {
    const reservation = buildReservation({ id: 5, trip_id: 1, travelers: [] });
    seedStore(useTripStore, { reservations: [reservation] });

    const travelers = [{ user_id: 1, username: 'alice', avatar_url: null, avatar: null, is_guest: 0 }];
    server.use(
      http.put('/api/trips/1/reservations/5/travelers', () =>
        HttpResponse.json({ travelers })
      )
    );
    await useTripStore.getState().setReservationTravelers(1, 5, [1]);
    const stored = useTripStore.getState().reservations.find(r => r.id === 5);
    expect(stored?.travelers).toHaveLength(1);
    expect(stored?.travelers?.[0].user_id).toBe(1);
  });

  it('FE-STORE-RESERVATIONS-002: setReservationTravelers throws on API error', async () => {
    const reservation = buildReservation({ id: 6, trip_id: 1 });
    seedStore(useTripStore, { reservations: [reservation] });

    server.use(
      http.put('/api/trips/1/reservations/6/travelers', () =>
        HttpResponse.json({ error: 'forbidden' }, { status: 403 })
      )
    );
    await expect(useTripStore.getState().setReservationTravelers(1, 6, [1])).rejects.toThrow();
  });

  it('FE-STORE-RESERVATIONS-003: setReservationTravelers leaves other reservations untouched', async () => {
    const a = buildReservation({ id: 7, trip_id: 1, travelers: [] });
    const b = buildReservation({ id: 8, trip_id: 1, travelers: [] });
    seedStore(useTripStore, { reservations: [a, b] });

    const travelers = [{ user_id: 2, username: 'bob', avatar_url: null }];
    server.use(
      http.put('/api/trips/1/reservations/7/travelers', () =>
        HttpResponse.json({ travelers })
      )
    );
    await useTripStore.getState().setReservationTravelers(1, 7, [2]);
    expect(useTripStore.getState().reservations.find(r => r.id === 8)?.travelers).toEqual([]);
  });

  it('FE-STORE-RESERVATIONS-004: deleting a booking also drops the expenses linked to it (#2084)', async () => {
    const booking = buildReservation({ id: 12, trip_id: 1 });
    const other = buildReservation({ id: 13, trip_id: 1 });
    seedStore(useTripStore, {
      reservations: [booking, other],
      budgetItems: [
        buildBudgetItem({ id: 1, trip_id: 1, reservation_id: 12 }),
        buildBudgetItem({ id: 2, trip_id: 1, reservation_id: 12 }),
        buildBudgetItem({ id: 3, trip_id: 1, reservation_id: 13 }),
        buildBudgetItem({ id: 4, trip_id: 1 }),
      ],
    });
    server.use(http.delete('/api/trips/1/reservations/12', () => HttpResponse.json({ success: true })));

    await useTripStore.getState().deleteReservation(1, 12);

    expect(useTripStore.getState().reservations.map(r => r.id)).toEqual([13]);
    // The server deletes the booking's expenses with it; the other booking's and the unlinked one stay.
    expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([3, 4]);
  });

  it('FE-STORE-RESERVATIONS-005: a failed delete keeps the booking and its expenses', async () => {
    const booking = buildReservation({ id: 14, trip_id: 1 });
    seedStore(useTripStore, {
      reservations: [booking],
      budgetItems: [buildBudgetItem({ id: 5, trip_id: 1, reservation_id: 14 })],
    });
    server.use(http.delete('/api/trips/1/reservations/14', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));

    await expect(useTripStore.getState().deleteReservation(1, 14)).rejects.toThrow();

    expect(useTripStore.getState().reservations).toHaveLength(1);
    expect(useTripStore.getState().budgetItems).toHaveLength(1);
  });
});
