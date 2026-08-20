import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildReservation, buildTrip } from '../../helpers/factories';
import { isRoutableReservation } from '../../../src/utils/reservationRoutes';

/**
 * The reservation event that carries no reservation (#1979).
 *
 * `reservation:created` and `reservation:updated` come in two shapes: normally
 * they carry the row, but the accommodation cascade sends them empty as a
 * "something changed, go and look" ping, which the event contract allows.
 *
 * Reading the id off the empty one is how a trip broke for good. With no
 * reservations loaded yet, `.some()` never ran its callback, so the cast slid
 * through and the store became `[undefined]`. Every later render that walked
 * that list threw into the route error boundary, and because the store is
 * rebuilt from the same events on the next visit, the trip stayed unreachable.
 * The reporter could only escape it by clearing localStorage.
 *
 * So the cases below are about the empty shape specifically: it must change
 * nothing, it must not leave a hole in the list, and it must still cause the
 * new booking to appear.
 */

beforeEach(() => {
  resetAllStores();
});

const send = (type: string, payload: Record<string, unknown> = {}) =>
  useTripStore.getState().handleRemoteEvent({ type, ...payload } as never);

describe('a reservation event with no reservation on it', () => {
  it('leaves an empty list empty, rather than putting a hole in it', () => {
    useTripStore.setState({ reservations: [] });
    send('reservation:created');
    // Before the fix this was [undefined], and every render after it threw.
    expect(useTripStore.getState().reservations).toEqual([]);
  });

  it('leaves a loaded list untouched', () => {
    const existing = buildReservation({ id: 5 });
    useTripStore.setState({ reservations: [existing] });
    send('reservation:updated');
    expect(useTripStore.getState().reservations).toEqual([existing]);
  });

  it('still fetches the list, so a cascaded booking appears without a reload', () => {
    const loadReservations = vi.fn();
    useTripStore.setState({
      trip: buildTrip({ id: 42 }),
      reservations: [],
      loadReservations,
    } as never);

    send('reservation:created');
    expect(loadReservations).toHaveBeenCalledWith(42);
  });

  it('does not fetch when the event carries its reservation', () => {
    const loadReservations = vi.fn();
    useTripStore.setState({
      trip: buildTrip({ id: 42 }),
      reservations: [],
      loadReservations,
    } as never);

    send('reservation:created', { reservation: buildReservation({ id: 9 }) });
    expect(loadReservations).not.toHaveBeenCalled();
    expect(useTripStore.getState().reservations).toHaveLength(1);
  });
});

/*
 * The second half of the same crash: the predicate that walks the list is
 * handed straight to Array.filter, so it has to survive whatever is in there.
 * It guarded the property but not the element.
 */
describe('the routable-reservation predicate', () => {
  it('says no to nothing at all, rather than throwing', () => {
    expect(isRoutableReservation(undefined)).toBe(false);
    expect(isRoutableReservation(null)).toBe(false);
  });

  it('survives a list with a hole in it, which is the reported stack', () => {
    const list = [buildReservation({ id: 1, endpoints: [] }), undefined, buildReservation({ id: 2 })];
    expect(() => list.filter(isRoutableReservation)).not.toThrow();
  });

  it('still answers the ordinary questions the same way', () => {
    expect(isRoutableReservation(buildReservation({ id: 1, endpoints: [] }))).toBe(false);
    expect(isRoutableReservation({ endpoints: [{ id: 1 }, { id: 2 }] } as never)).toBe(true);
  });
});
