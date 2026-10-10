import { useEffect, useState } from 'react';

import { adminApi, tripsApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';

interface DevTrip {
  id: number;
  title: string;
}

interface DevAppUser {
  id: number;
  username: string;
  email: string;
}

interface UseDevNotificationsOptions {
  /** The error toast text for a failed send. Defaults to the server's `error` field, else 'Failed'. */
  errorMessage?: (err: unknown) => string;
}

const serverErrorMessage = (err: unknown) => getApiErrorMessage(err, 'Failed');

/**
 * The dev-only notification tester behind both admin shells (the desktop panel and the
 * phone panel render their own buttons over it). Loads the trips and users to pick a
 * target from, and builds and sends each test event. Every handler is named after the
 * button that calls it; `sending` holds the id of the send in flight.
 */
export function useDevNotifications({ errorMessage = serverErrorMessage }: UseDevNotificationsOptions = {}) {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const [sending, setSending] = useState<string | null>(null);
  const [trips, setTrips] = useState<DevTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [users, setUsers] = useState<DevAppUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    tripsApi
      .list()
      .then((data) => {
        const list = (data.trips || data || []) as DevTrip[];
        setTrips(list);
        if (list.length > 0) setSelectedTripId(list[0].id);
      })
      .catch(() => {});
    adminApi
      .users()
      .then((data) => {
        const list = (data.users || data || []) as DevAppUser[];
        setUsers(list);
        if (list.length > 0) setSelectedUserId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const fire = async (label: string, payload: Record<string, unknown>) => {
    setSending(label);
    try {
      await adminApi.sendTestNotification(payload);
      toast.success(`Sent: ${label}`);
    } catch (err: unknown) {
      toast.error(errorMessage(err));
    } finally {
      setSending(null);
    }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const username = user?.username || 'Admin';
  const tripTitle = selectedTrip?.title || 'Test Trip';
  const tripInviteId = `trip_invite-${selectedUserId}`;
  const vacayInviteId = `vacay_invite-${selectedUserId}`;

  const send = {
    simpleMe: () =>
      fire('simple-me', {
        event: 'test_simple',
        scope: 'user',
        targetId: user?.id,
        params: {},
      }),
    booleanMe: () =>
      fire('boolean-me', {
        event: 'test_boolean',
        scope: 'user',
        targetId: user?.id,
        params: {},
        inApp: {
          type: 'boolean',
          positiveCallback: { action: 'test_approve', payload: {} },
          negativeCallback: { action: 'test_deny', payload: {} },
        },
      }),
    navigateMe: () =>
      fire('navigate-me', {
        event: 'test_navigate',
        scope: 'user',
        targetId: user?.id,
        params: {},
      }),
    simpleAdmins: () =>
      fire('simple-admins', {
        event: 'test_simple',
        scope: 'admin',
        targetId: 0,
        params: {},
      }),
    bookingChange: () =>
      selectedTripId &&
      fire('booking_change', {
        event: 'booking_change',
        scope: 'trip',
        targetId: selectedTripId,
        params: {
          actor: username,
          trip: tripTitle,
          booking: 'Test Hotel',
          type: 'hotel',
          tripId: String(selectedTripId),
        },
      }),
    tripReminder: () =>
      selectedTripId &&
      fire('trip_reminder', {
        event: 'trip_reminder',
        scope: 'trip',
        targetId: selectedTripId,
        params: { trip: tripTitle, tripId: String(selectedTripId) },
      }),
    photosShared: () =>
      selectedTripId &&
      fire('photos_shared', {
        event: 'photos_shared',
        scope: 'trip',
        targetId: selectedTripId,
        // A string on purpose: notification params are Record<string, string> end to end, the server
        // sends count: String(added), and resolveTemplate reads a numeric string as the plural count.
        params: { actor: username, trip: tripTitle, count: '5', tripId: String(selectedTripId) },
      }),
    collabMessage: () =>
      selectedTripId &&
      fire('collab_message', {
        event: 'collab_message',
        scope: 'trip',
        targetId: selectedTripId,
        params: {
          actor: username,
          trip: tripTitle,
          preview: 'This is a test message preview.',
          tripId: String(selectedTripId),
        },
      }),
    packingTagged: () =>
      selectedTripId &&
      fire('packing_tagged', {
        event: 'packing_tagged',
        scope: 'trip',
        targetId: selectedTripId,
        params: { actor: username, trip: tripTitle, category: 'Clothing', tripId: String(selectedTripId) },
      }),
    tripInvite: () =>
      selectedUserId &&
      fire(tripInviteId, {
        event: 'trip_invite',
        scope: 'user',
        targetId: selectedUserId,
        params: {
          actor: username,
          trip: tripTitle,
          invitee: selectedUser?.email || '',
          tripId: String(selectedTripId ?? 0),
        },
      }),
    vacayInvite: () =>
      selectedUserId &&
      fire(vacayInviteId, {
        event: 'vacay_invite',
        scope: 'user',
        targetId: selectedUserId,
        params: { actor: username, planId: '1' },
      }),
    versionAvailable: () =>
      fire('version_available', {
        event: 'version_available',
        scope: 'admin',
        targetId: 0,
        params: { version: '9.9.9-test' },
      }),
  };

  return {
    sending,
    trips,
    selectedTripId,
    setSelectedTripId,
    users,
    selectedUserId,
    setSelectedUserId,
    tripInviteId,
    vacayInviteId,
    send,
  };
}
