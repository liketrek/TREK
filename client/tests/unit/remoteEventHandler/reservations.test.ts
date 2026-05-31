import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildReservation } from '../../helpers/factories';

beforeEach(() => {
  resetAllStores();
});

describe('remoteEventHandler > reservations', () => {
  const seedData = () => {
    useTripStore.setState({
      reservations: [buildReservation({ id: 1, title: 'Hotel Paris' })],
    });
  };

  it('FE-WSEVT-RESERV-001: reservation:created prepends new reservation to array', () => {
    seedData();
    const newRes = buildReservation({ id: 99, title: 'Flight' });
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:created', reservation: newRes });
    const { reservations } = useTripStore.getState();
    expect(reservations).toHaveLength(2);
    expect(reservations[0].id).toBe(99); // prepended, so first
  });

  it('FE-WSEVT-RESERV-002: reservation:created is idempotent — no duplicate if same ID', () => {
    seedData();
    const duplicate = buildReservation({ id: 1, title: 'Hotel Paris Dup' });
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:created', reservation: duplicate });
    const { reservations } = useTripStore.getState();
    expect(reservations).toHaveLength(1);
    expect(reservations[0].title).toBe('Hotel Paris');
  });

  it('FE-WSEVT-RESERV-003: reservation:updated replaces reservation in array', () => {
    seedData();
    const updated = buildReservation({ id: 1, title: 'Hotel Lyon' });
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:updated', reservation: updated });
    const { reservations } = useTripStore.getState();
    expect(reservations[0].title).toBe('Hotel Lyon');
  });

  it('FE-WSEVT-RESERV-004: reservation:deleted removes reservation by ID', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:deleted', reservationId: 1 });
    const { reservations } = useTripStore.getState();
    expect(reservations).toHaveLength(0);
  });

  it('FE-WSEVT-RESERV-005: reservation:created ordering — newest is first', () => {
    seedData();
    const r2 = buildReservation({ id: 2, title: 'Second' });
    const r3 = buildReservation({ id: 3, title: 'Third' });
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:created', reservation: r2 });
    useTripStore.getState().handleRemoteEvent({ type: 'reservation:created', reservation: r3 });
    const { reservations } = useTripStore.getState();
    expect(reservations[0].id).toBe(3);
    expect(reservations[1].id).toBe(2);
    expect(reservations[2].id).toBe(1);
  });
});
