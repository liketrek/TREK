import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildTrip, buildPlace } from '../../helpers/factories';

beforeEach(() => {
  resetAllStores();
  vi.restoreAllMocks();
});

describe('remoteEventHandler > trip', () => {
  it('FE-WSEVT-TRIP-001: trip:updated replaces trip in state', () => {
    const originalTrip = buildTrip({ id: 1, title: 'Paris Trip' });
    useTripStore.setState({ trip: originalTrip });
    const updatedTrip = buildTrip({ id: 1, title: 'Paris & Lyon Trip' });
    useTripStore.getState().handleRemoteEvent({ type: 'trip:updated', trip: updatedTrip });
    const { trip } = useTripStore.getState();
    expect(trip?.title).toBe('Paris & Lyon Trip');
  });

  it('FE-WSEVT-TRIP-002: trip:updated does not affect other state fields', () => {
    const existingPlace = buildPlace({ id: 55, name: 'Eiffel Tower' });
    useTripStore.setState({
      trip: buildTrip({ id: 1, title: 'Original' }),
      places: [existingPlace],
    });
    const updatedTrip = buildTrip({ id: 1, title: 'Updated' });
    useTripStore.getState().handleRemoteEvent({ type: 'trip:updated', trip: updatedTrip });
    const { places } = useTripStore.getState();
    expect(places).toHaveLength(1);
    expect(places[0].id).toBe(55);
  });

  // A remote date-range change re-anchors bookings/accommodations server-side, so the
  // handler must pull authoritative days + reservations and nudge the planner (#1288).
  describe('date-range change refresh (#1288)', () => {
    const stubRefresh = () => {
      const refreshDays = vi.fn().mockResolvedValue(undefined);
      const loadReservations = vi.fn().mockResolvedValue(undefined);
      useTripStore.setState({ refreshDays, loadReservations });
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      return { refreshDays, loadReservations, dispatchSpy };
    };
    const firedAccommodationsRefresh = (spy: ReturnType<typeof vi.spyOn>) =>
      spy.mock.calls.some(([e]) => (e as Event).type === 'accommodations:refresh');

    it('FE-WSEVT-TRIP-003: trip:updated with a changed start_date refetches days + reservations and fires accommodations:refresh', () => {
      useTripStore.setState({ trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-05' }) });
      const { refreshDays, loadReservations, dispatchSpy } = stubRefresh();
      const updatedTrip = buildTrip({ id: 1, start_date: '2025-05-31', end_date: '2025-06-05' });
      useTripStore.getState().handleRemoteEvent({ type: 'trip:updated', trip: updatedTrip });
      expect(refreshDays).toHaveBeenCalledWith(1);
      expect(loadReservations).toHaveBeenCalledWith(1);
      expect(firedAccommodationsRefresh(dispatchSpy)).toBe(true);
    });

    it('FE-WSEVT-TRIP-004: a title-only trip:updated does not trigger any refetch', () => {
      useTripStore.setState({ trip: buildTrip({ id: 1, title: 'Old', start_date: '2025-06-01', end_date: '2025-06-05' }) });
      const { refreshDays, loadReservations, dispatchSpy } = stubRefresh();
      const updatedTrip = buildTrip({ id: 1, title: 'New', start_date: '2025-06-01', end_date: '2025-06-05' });
      useTripStore.getState().handleRemoteEvent({ type: 'trip:updated', trip: updatedTrip });
      expect(refreshDays).not.toHaveBeenCalled();
      expect(loadReservations).not.toHaveBeenCalled();
      expect(firedAccommodationsRefresh(dispatchSpy)).toBe(false);
    });

    it('FE-WSEVT-TRIP-005: a trip:updated for a different trip id does not trigger a refetch', () => {
      useTripStore.setState({ trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-05' }) });
      const { refreshDays, loadReservations } = stubRefresh();
      const updatedTrip = buildTrip({ id: 2, start_date: '2025-07-01', end_date: '2025-07-05' });
      useTripStore.getState().handleRemoteEvent({ type: 'trip:updated', trip: updatedTrip });
      expect(refreshDays).not.toHaveBeenCalled();
      expect(loadReservations).not.toHaveBeenCalled();
    });
  });
});
