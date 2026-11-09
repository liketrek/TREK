/**
 * NativeQuickActionsSync: keeps the app icon's quick actions (native/quickActions.ts)
 * in step with the trips on this device and the app's language. Runs at start,
 * on a change of language or account, and whenever the app comes back to the
 * foreground. Signed out, the icon offers nothing that would open a trip.
 * Renders nothing; outside an iOS binary with the feature it does nothing.
 */
import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { offlineDb } from '../../db/offlineDb';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';
import { publishQuickActions, quickActionsActive, quickActionsFor } from '../../native/quickActions';
import { pickTrip } from '../../native/widgets';
import { useAuthStore } from '../../store/authStore';
import { localDateStr } from '../../vacay/monthGrid';

export default function NativeQuickActionsSync() {
  const { t, language } = useTranslation();
  const { caps } = useNativeCapabilities();
  const userId = useAuthStore((s) => (s.isAuthenticated ? (s.user?.id ?? null) : null));

  useEffect(() => {
    if (!quickActionsActive()) return;
    let cancelled = false;

    const sync = async () => {
      if (userId === null) {
        await publishQuickActions([]);
        return;
      }
      const now = new Date();
      const today = localDateStr(now.getFullYear(), now.getMonth(), now.getDate());
      const trips = await offlineDb.trips.toArray();
      if (cancelled) return;
      await publishQuickActions(quickActionsFor(pickTrip(trips, today), today, t));
    };

    void sync();
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void sync();
    });
    return () => {
      cancelled = true;
      void listener.then((handle) => handle.remove());
    };
  }, [caps, t, language, userId]);

  return null;
}
