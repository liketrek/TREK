// FE-COMP-DEVNOTIF-HOOK-001 to -008: the shared dev notification tester behind both admin shells.
import { act, renderHook, waitFor } from '@testing-library/react';

import { buildUser } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { adminApi, tripsApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useDevNotifications } from './useDevNotifications';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const ME = buildUser({ id: 7, username: 'tester' });
const TRIPS = [
  { id: 11, title: 'Paris' },
  { id: 12, title: 'Tokyo' },
];
const USERS = [
  { id: 21, username: 'alice', email: 'alice@example.com' },
  { id: 22, username: 'bob', email: 'bob@example.com' },
];

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: ME, isAuthenticated: true });
  vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: TRIPS });
  vi.spyOn(adminApi, 'users').mockResolvedValue({ users: USERS });
  vi.spyOn(adminApi, 'sendTestNotification').mockResolvedValue({});
  toast.success.mockReset();
  toast.error.mockReset();
});
afterEach(() => vi.restoreAllMocks());

async function loaded(options?: Parameters<typeof useDevNotifications>[0]) {
  const hook = renderHook(() => useDevNotifications(options));
  await waitFor(() => expect(hook.result.current.selectedUserId).toBe(21));
  await waitFor(() => expect(hook.result.current.selectedTripId).toBe(11));
  return hook;
}

describe('useDevNotifications', () => {
  it('FE-COMP-DEVNOTIF-HOOK-001: loads trips and users and preselects the first of each', async () => {
    const { result } = await loaded();
    expect(result.current.trips).toEqual(TRIPS);
    expect(result.current.users).toEqual(USERS);
    expect(result.current.tripInviteId).toBe('trip_invite-21');
    expect(result.current.vacayInviteId).toBe('vacay_invite-21');
  });

  it('FE-COMP-DEVNOTIF-HOOK-002: a failed load leaves the lists empty and nothing selected', async () => {
    vi.mocked(tripsApi.list).mockRejectedValue(new Error('down'));
    vi.mocked(adminApi.users).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useDevNotifications());
    await waitFor(() => expect(adminApi.users).toHaveBeenCalled());
    expect(result.current.trips).toEqual([]);
    expect(result.current.selectedTripId).toBeNull();
    expect(result.current.selectedUserId).toBeNull();
  });

  it('FE-COMP-DEVNOTIF-HOOK-003: a self-addressed send targets the signed-in user and toasts the label', async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.send.booleanMe();
    });
    expect(adminApi.sendTestNotification).toHaveBeenCalledWith({
      event: 'test_boolean',
      scope: 'user',
      targetId: 7,
      params: {},
      inApp: {
        type: 'boolean',
        positiveCallback: { action: 'test_approve', payload: {} },
        negativeCallback: { action: 'test_deny', payload: {} },
      },
    });
    expect(toast.success).toHaveBeenCalledWith('Sent: boolean-me');
    expect(result.current.sending).toBeNull();
  });

  it('FE-COMP-DEVNOTIF-HOOK-004: trip events carry the selected trip, its title and the actor', async () => {
    const { result } = await loaded();
    act(() => result.current.setSelectedTripId(12));
    await act(async () => {
      await result.current.send.photosShared();
    });
    expect(adminApi.sendTestNotification).toHaveBeenCalledWith({
      event: 'photos_shared',
      scope: 'trip',
      targetId: 12,
      params: { actor: 'tester', trip: 'Tokyo', count: '5', tripId: '12' },
    });
  });

  it('FE-COMP-DEVNOTIF-HOOK-005: user events go to the selected recipient under an id naming them', async () => {
    const { result } = await loaded();
    act(() => result.current.setSelectedUserId(22));
    await act(async () => {
      await result.current.send.tripInvite();
    });
    expect(adminApi.sendTestNotification).toHaveBeenCalledWith({
      event: 'trip_invite',
      scope: 'user',
      targetId: 22,
      params: { actor: 'tester', trip: 'Paris', invitee: 'bob@example.com', tripId: '11' },
    });
    expect(toast.success).toHaveBeenCalledWith('Sent: trip_invite-22');
  });

  it('FE-COMP-DEVNOTIF-HOOK-006: trip and user events do nothing while nothing is selected', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue({ trips: [] });
    vi.mocked(adminApi.users).mockResolvedValue({ users: [] });
    const { result } = renderHook(() => useDevNotifications());
    await waitFor(() => expect(adminApi.users).toHaveBeenCalled());
    await act(async () => {
      await result.current.send.bookingChange();
      await result.current.send.vacayInvite();
    });
    expect(adminApi.sendTestNotification).not.toHaveBeenCalled();
  });

  it('FE-COMP-DEVNOTIF-HOOK-007: by default a failure toasts the server error field, else Failed', async () => {
    const { result } = await loaded();
    vi.mocked(adminApi.sendTestNotification).mockRejectedValueOnce({ response: { data: { error: 'No channel' } } });
    await act(async () => {
      await result.current.send.versionAvailable();
    });
    expect(toast.error).toHaveBeenLastCalledWith('No channel');
    vi.mocked(adminApi.sendTestNotification).mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await result.current.send.versionAvailable();
    });
    expect(toast.error).toHaveBeenLastCalledWith('Failed');
    expect(result.current.sending).toBeNull();
  });

  it('FE-COMP-DEVNOTIF-HOOK-008: a shell can word the failure toast itself', async () => {
    const { result } = await loaded({ errorMessage: (err) => (err instanceof Error ? err.message : 'Failed') });
    vi.mocked(adminApi.sendTestNotification).mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await result.current.send.simpleAdmins();
    });
    expect(toast.error).toHaveBeenCalledWith('boom');
  });
});
