import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTripStore } from '../../../src/store/tripStore';
import { buildReservation } from '../../helpers/factories';
import { resetAllStores } from '../../helpers/store';

/**
 * Stays live in page-local planner state, so a stay written elsewhere (the
 * assistant, a fellow traveller, a plugin, a booking import) cannot be applied
 * to the store. The handler asks the planner to read them again instead; the
 * planner's useStaysRefresh folds the asks of a burst into one reload.
 */
describe('remoteEventHandler > accommodations', () => {
  const refresh = vi.fn();

  beforeEach(() => {
    resetAllStores();
    refresh.mockClear();
    window.addEventListener('accommodations:refresh', refresh);
  });

  afterEach(() => {
    window.removeEventListener('accommodations:refresh', refresh);
  });

  it.each([
    ['accommodation:created', { accommodation: { id: 8, trip_id: 1 } }],
    ['accommodation:created', {}],
    ['accommodation:updated', { accommodation: { id: 8, trip_id: 1 } }],
    ['accommodation:deleted', { accommodationId: 8 }],
  ])('FE-WSEVT-STAY-001: %s from elsewhere asks the planner once to reload its stays', (type, payload) => {
    const reservations = [buildReservation({ id: 3 })];
    useTripStore.setState({ reservations });

    useTripStore.getState().handleRemoteEvent({ type, ...payload });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(useTripStore.getState().reservations).toBe(reservations);
  });

  it('FE-WSEVT-STAY-002: a booking change that is no stay leaves the stays alone', () => {
    const reservation = buildReservation({ id: 3 });
    useTripStore.setState({ reservations: [reservation] });

    useTripStore
      .getState()
      .handleRemoteEvent({ type: 'reservation:updated', reservation: { ...reservation, title: 'Moved' } });
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:deleted', reservationId: 3 });

    expect(refresh).not.toHaveBeenCalled();
  });
});
