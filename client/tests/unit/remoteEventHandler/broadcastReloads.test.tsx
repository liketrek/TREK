import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { journeyApi, packingApi } from '../../../src/api/client';
import { collectionsApi } from '../../../src/api/collections';
import { addListener, removeListener } from '../../../src/api/websocket';
import { useSaveToCollection } from '../../../src/components/Collections/useSaveToCollection';
import { useBagTotalsPing } from '../../../src/components/Packing/useBagTotalsPing';
import { usePackingCategoryAssignees } from '../../../src/components/Packing/usePackingCategoryAssignees';
import { useInAppNotificationListener } from '../../../src/hooks/useInAppNotificationListener';
import { useJourney } from '../../../src/pages/journey/useJourney';
import { useTripRosterSync } from '../../../src/pages/tripPlanner/useTripRosterSync';
import { useAuthStore } from '../../../src/store/authStore';
import { useInAppNotificationStore, type InAppNotification } from '../../../src/store/inAppNotificationStore';
import { useJourneyStore } from '../../../src/store/journeyStore';
import { useSaveToCollectionStore } from '../../../src/store/saveToCollectionStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';

/**
 * The views that read their data again after a change written elsewhere (plan
 * 2.8): every one folds a burst into one read, because one assistant step can
 * apply up to fifty changes, each its own event.
 */

const nav = vi.hoisted(() => ({ navigate: vi.fn() }));
const toast = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() }));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => nav.navigate,
}));
vi.mock('../../../src/components/shared/Toast', () => ({ useToast: () => toast }));

/** A bell row as the notification store holds it. */
function note(id: number, isRead: boolean): InAppNotification {
  return {
    id,
    type: 'simple',
    scope: 'trip',
    target: 5,
    sender_id: null,
    sender_username: null,
    sender_avatar: null,
    recipient_id: 7,
    title_key: 'notif.title',
    title_params: {},
    text_key: 'notif.text',
    text_params: {},
    positive_text_key: null,
    negative_text_key: null,
    response: null,
    navigate_text_key: null,
    navigate_target: null,
    is_read: isRead,
    created_at: '2026-10-01T09:00:00Z',
  };
}

/** The same row as the server sends it, read state as a number. */
const wire = (id: number, isRead: boolean) => ({ ...note(id, isRead), is_read: Number(isRead) }) as never;

/** Deliver an event to every listener still registered, the way the socket layer does. */
function emit(event: Record<string, unknown>): void {
  const removed = new Set(vi.mocked(removeListener).mock.calls.map(([fn]) => fn));
  for (const [fn] of vi.mocked(addListener).mock.calls) if (!removed.has(fn)) fn(event);
}

/** Past the 250ms window useServerPing collects a burst in. */
async function settle(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

beforeEach(() => {
  resetAllStores();
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
  nav.navigate.mockClear();
  toast.info.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('broadcast reloads', () => {
  it('FE-BCAST-010: the bag events and the totals ping of one burst are one read of the bags', async () => {
    const reload = vi.fn(async () => {});
    renderHook(() => useBagTotalsPing(true, reload));
    act(() => {
      emit({ type: 'packing:bag-created', bag: { id: 1 } });
      emit({ type: 'packing:bag-members-updated', bagId: 1, members: [] });
      emit({ type: 'packing:bag-updated', bag: { id: 1 } });
      emit({ type: 'packing:bag-totals' });
      emit({ type: 'packing:bag-deleted', bagId: 2 });
      emit({ type: 'packing:created', item: { id: 9 } });
    });
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-011: category assignees set elsewhere are read again', async () => {
    const get = vi
      .spyOn(packingApi, 'getCategoryAssignees')
      .mockResolvedValueOnce({ assignees: {} })
      .mockResolvedValueOnce({ assignees: { Camp: [{ user_id: 3, username: 'anna' }] } });
    const { result } = renderHook(() =>
      usePackingCategoryAssignees({ tripId: 7, t: (k: string) => k, toast: { error: vi.fn() } })
    );
    await settle();
    act(() => {
      emit({ type: 'packing:assignees', category: 'Camp', assignees: [] });
      emit({ type: 'packing:assignees', category: 'Food', assignees: [] });
    });
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current.categoryAssignees).toEqual({ Camp: [{ user_id: 3, username: 'anna' }] });
  });

  it('FE-BCAST-012: a notification read or unread elsewhere moves the unread count', () => {
    const fetchUnreadCount = vi.fn(async () => {});
    useInAppNotificationStore.setState({
      notifications: [note(1, false), note(2, true)],
      unreadCount: 1,
      fetchUnreadCount,
    });
    const store = useInAppNotificationStore.getState();
    store.handleUpdatedNotification(wire(1, true));
    expect(useInAppNotificationStore.getState().unreadCount).toBe(0);
    store.handleUpdatedNotification(wire(2, false));
    store.handleUpdatedNotification(wire(1, false));
    expect(useInAppNotificationStore.getState().unreadCount).toBe(2);
    // One this tab never loaded says nothing about its old state: the count is asked for.
    store.handleUpdatedNotification(wire(77, true));
    expect(fetchUnreadCount).toHaveBeenCalledTimes(1);
    expect(useInAppNotificationStore.getState().unreadCount).toBe(2);
  });

  it('FE-BCAST-013: notification:read-all clears the bell, settings and tags are read again once per burst', async () => {
    const loadSettings = vi.fn(async () => {});
    const reloadTags = vi.fn(async () => {});
    useAuthStore.setState({ isAuthenticated: true });
    useSettingsStore.setState({ loadSettings });
    useTripStore.setState({ reloadTags });
    useInAppNotificationStore.setState({
      notifications: [note(1, false), note(2, false)],
      unreadCount: 2,
    });
    renderHook(() => useInAppNotificationListener());
    act(() => {
      emit({ type: 'notification:read-all' });
      emit({ type: 'settings:updated', keys: ['dark_mode'] });
      emit({ type: 'settings:updated', keys: ['week_start'] });
      emit({ type: 'tags:changed' });
      emit({ type: 'tags:changed' });
    });
    const bell = useInAppNotificationStore.getState();
    expect(bell.unreadCount).toBe(0);
    expect(bell.notifications.every((n) => n.is_read)).toBe(true);
    await settle();
    expect(loadSettings).toHaveBeenCalledTimes(1);
    expect(reloadTags).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-014: member events read the roster again, once per burst', async () => {
    const refresh = vi.fn(async () => {});
    renderHook(() => useTripRosterSync(5, refresh));
    act(() => {
      emit({ type: 'member:added', tripId: 5, member: { id: 3 } });
      emit({ type: 'member:updated', tripId: 5, member: { id: 3, username: 'Ana' } });
      emit({ type: 'member:removed', tripId: 5, userId: 3 });
    });
    await settle();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-015: a trip that went away is left for the trip list with a notice', () => {
    renderHook(() => useTripRosterSync(5, async () => {}));
    act(() => useTripStore.setState({ tripGone: { tripId: 6, reason: 'deleted' } }));
    expect(nav.navigate).not.toHaveBeenCalled();
    act(() => useTripStore.setState({ tripGone: { tripId: 5, reason: 'removed' } }));
    expect(toast.info).toHaveBeenCalledWith('trip.toast.accessLost');
    expect(nav.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    expect(useTripStore.getState().tripGone).toBeNull();
  });

  it('FE-BCAST-016: a trip deleted elsewhere says so', () => {
    renderHook(() => useTripRosterSync(5, async () => {}));
    act(() => useTripStore.setState({ tripGone: { tripId: 5, reason: 'deleted' } }));
    expect(toast.info).toHaveBeenCalledWith('dashboard.toast.deleted');
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-019: a place saved elsewhere re-checks the membership and the inspector bookmark once', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ collections: [], incomingInvites: [] } as never);
    const membership = vi.spyOn(collectionsApi, 'membership').mockResolvedValue({ saved: false, lists: [] } as never);
    useSaveToCollectionStore.getState().open({ name: 'Louvre', lat: 48.86, lng: 2.34 });
    renderHook(() => useSaveToCollection());
    await settle();
    membership.mockClear();
    const version = useSaveToCollectionStore.getState().version;
    act(() => {
      for (let i = 0; i < 3; i++) emit({ type: 'collections:updated', collectionId: 4 });
      emit({ type: 'collections:invite', collectionId: 5, from: { id: 2, username: 'bo' } });
    });
    await settle();
    expect(membership).toHaveBeenCalledTimes(1);
    expect(useSaveToCollectionStore.getState().version).toBe(version + 1);
  });

  it('FE-BCAST-021: the journey list reads itself again after journeys change elsewhere, once per burst', async () => {
    vi.spyOn(journeyApi, 'suggestions').mockResolvedValue({ trips: [] } as never);
    const loadJourneys = vi.fn(async () => {});
    useJourneyStore.setState({ loadJourneys });
    renderHook(() => useJourney(), { wrapper: MemoryRouter });
    await settle();
    loadJourneys.mockClear();
    act(() => {
      emit({ type: 'journey:updated', journeyId: 3 });
      emit({ type: 'journey:deleted', journeyId: 4 });
      emit({ type: 'journey:entry:created', journeyId: 3, entry: { id: 8 } });
    });
    await settle();
    expect(loadJourneys).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-029: a contributor taken off a journey elsewhere reads the journey list again', async () => {
    vi.spyOn(journeyApi, 'suggestions').mockResolvedValue({ trips: [] } as never);
    const loadJourneys = vi.fn(async () => {});
    useJourneyStore.setState({ loadJourneys });
    renderHook(() => useJourney(), { wrapper: MemoryRouter });
    await settle();
    loadJourneys.mockClear();
    act(() => emit({ type: 'journey:contributor:changed', journeyId: 3, targetUserId: 2, role: null }));
    await settle();
    expect(loadJourneys).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-023: opening a trip (a room join) re-reads trip data, never the account-wide state', async () => {
    const loadSettings = vi.fn(async () => {});
    const reloadTags = vi.fn(async () => {});
    const refresh = vi.fn(async () => {});
    useAuthStore.setState({ isAuthenticated: true });
    useSettingsStore.setState({ loadSettings });
    useTripStore.setState({ reloadTags });
    renderHook(() => useInAppNotificationListener());
    renderHook(() => useSaveToCollection());
    renderHook(() => useTripRosterSync(5, refresh));
    const version = useSaveToCollectionStore.getState().version;
    act(() => emit({ type: 'joined', tripId: 5 }));
    await settle();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(loadSettings).not.toHaveBeenCalled();
    expect(reloadTags).not.toHaveBeenCalled();
    expect(useSaveToCollectionStore.getState().version).toBe(version);
  });

  it('FE-BCAST-028: accepting an invite to a list elsewhere re-checks the bookmark too', async () => {
    renderHook(() => useSaveToCollection());
    const version = useSaveToCollectionStore.getState().version;
    act(() => emit({ type: 'collections:accepted', collectionId: 4 }));
    await settle();
    expect(useSaveToCollectionStore.getState().version).toBe(version + 1);
  });
});
