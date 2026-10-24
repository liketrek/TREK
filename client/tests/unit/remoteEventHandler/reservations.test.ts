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

  it('FE-WSEVT-RESERV-006: reservation:updated leaves the other reservations untouched', () => {
    useTripStore.setState({
      reservations: [buildReservation({ id: 1, title: 'Hotel' }), buildReservation({ id: 2, title: 'Flight' })],
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:updated',
      reservation: buildReservation({ id: 2, title: 'Flight (rebooked)' }),
    });
    const { reservations } = useTripStore.getState();
    expect(reservations[0].title).toBe('Hotel');
    expect(reservations[1].title).toBe('Flight (rebooked)');
  });

  // Traveler assignment (#1517) arrives as its own event carrying only the list.
  it('FE-WSEVT-RESERV-007: reservation:travelers-updated replaces travelers on the addressed booking', () => {
    useTripStore.setState({
      reservations: [buildReservation({ id: 1 }), buildReservation({ id: 2 })],
    });
    const travelers = [{ user_id: 3, username: 'ada' }, { user_id: 4, username: 'grace' }];
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:travelers-updated',
      reservationId: 2,
      travelers,
    });
    const { reservations } = useTripStore.getState();
    expect(reservations[1].travelers).toEqual(travelers);
    expect(reservations[0].travelers).toBeUndefined();
  });

  it('FE-WSEVT-RESERV-008: reservation:travelers-updated for an unknown booking changes nothing', () => {
    useTripStore.setState({ reservations: [buildReservation({ id: 1 })] });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:travelers-updated',
      reservationId: 999,
      travelers: [{ user_id: 3, username: 'ada' }],
    });
    expect(useTripStore.getState().reservations[0].travelers).toBeUndefined();
  });

  // #2631: a collaborator moving a booking on a day sends only the new slots. Ignored,
  // their stops arrived in the new order and the bookings stayed between the old ones.
  it('FE-WSEVT-RESERV-009: reservation:positions with day_id writes the slot for that day', () => {
    useTripStore.setState({
      reservations: [buildReservation({ id: 1, day_positions: { 7: 0.5 } }), buildReservation({ id: 2 })],
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:positions',
      positions: [{ id: 1, day_plan_position: 2.5 }],
      day_id: 8,
    });
    const [moved, other] = useTripStore.getState().reservations;
    expect(moved.day_positions).toEqual({ 7: 0.5, 8: 2.5 });
    expect(moved.day_plan_position).toBe(2.5);
    expect(other.day_positions).toBeUndefined();
  });

  it('FE-WSEVT-RESERV-010: reservation:positions from the MCP tool names the day dayId', () => {
    useTripStore.setState({ reservations: [buildReservation({ id: 1 })] });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:positions',
      positions: [{ id: 1, day_plan_position: 3 }],
      dayId: 4,
    });
    expect(useTripStore.getState().reservations[0].day_positions).toEqual({ 4: 3 });
  });

  it('FE-WSEVT-RESERV-011: reservation:positions without a day moves the global slot only', () => {
    useTripStore.setState({ reservations: [buildReservation({ id: 1, day_positions: { 4: 1 } })] });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:positions',
      positions: [{ id: 1, day_plan_position: 6.5 }, { id: 1 }],
      day_id: undefined,
    });
    const [r] = useTripStore.getState().reservations;
    expect(r.day_plan_position).toBe(6.5);
    expect(r.day_positions).toEqual({ 4: 1 });
  });

  it('FE-WSEVT-RESERV-012: reservation:updated without day slots keeps the ones the booking had', () => {
    useTripStore.setState({ reservations: [buildReservation({ id: 1, day_positions: { 4: 1.5 } })] });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:updated',
      reservation: buildReservation({ id: 1, title: 'Train (rebooked)' }),
    });
    const [r] = useTripStore.getState().reservations;
    expect(r.title).toBe('Train (rebooked)');
    expect(r.day_positions).toEqual({ 4: 1.5 });
  });

  it('FE-WSEVT-RESERV-013: reservation:updated with day slots takes them, null included', () => {
    useTripStore.setState({ reservations: [buildReservation({ id: 1, day_positions: { 4: 1.5 } })] });
    useTripStore.getState().handleRemoteEvent({
      type: 'reservation:updated',
      reservation: buildReservation({ id: 1, day_positions: null }),
    });
    expect(useTripStore.getState().reservations[0].day_positions).toBeNull();
  });
});
