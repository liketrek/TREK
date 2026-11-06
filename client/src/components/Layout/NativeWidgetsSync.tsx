/**
 * NativeWidgetsSync: keeps the iOS home-screen widget and the travel-day Live
 * Activity in step with the trips stored on this device (native/widgets.ts).
 * Runs at start, whenever the app comes back to the foreground and every
 * quarter hour while it is open, so the next stop moves on through the day.
 * Renders nothing; outside an iOS binary with the widgets it does nothing.
 */
import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { offlineDb } from '../../db/offlineDb';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';
import { buildSnapshot, pickTrip, publishWidgets, todayOf, tripDayState, widgetsActive } from '../../native/widgets';
import { useSettingsStore } from '../../store/settingsStore';
import { formatTime } from '../../utils/formatters';
import { localDateStr } from '../../vacay/monthGrid';

const REFRESH_MS = 15 * 60 * 1000;

export default function NativeWidgetsSync(): null {
  const { t, language } = useTranslation();
  const { caps } = useNativeCapabilities();
  const timeFormat = useSettingsStore((s) => s.settings.time_format);

  useEffect(() => {
    if (!widgetsActive()) return;
    let cancelled = false;

    const sync = async () => {
      const now = new Date();
      const today = localDateStr(now.getFullYear(), now.getMonth(), now.getDate());
      const trips = await offlineDb.trips.toArray();
      const trip = pickTrip(trips, today);
      const days = trip ? await offlineDb.days.where('trip_id').equals(trip.id).toArray() : [];
      const day = trip
        ? todayOf(
            trip,
            days,
            today,
            (n, m) => t('native.widget.dayOf', { n, m }),
            (time) => formatTime(time, language, timeFormat)
          )
        : null;
      if (cancelled) return;
      const snapshot = buildSnapshot(trip, day, {
        nextTrip: t('dashboard.nextTrip'),
        today: t('native.widget.today'),
        noTrip: t('native.widget.noTrip'),
        inDays: t('native.widget.inDays'),
        tomorrow: t('native.widget.tomorrow'),
        nothingPlanned: t('native.widget.nothingPlanned'),
      });
      const live = day ? tripDayState(day, now.getHours() * 60 + now.getMinutes(), t('native.widget.dayDone')) : null;
      await publishWidgets(snapshot, live);
    };

    void sync();
    const timer = window.setInterval(() => void sync(), REFRESH_MS);
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void sync();
    });
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      void listener.then((handle) => handle.remove());
    };
  }, [caps, t, language, timeFormat]);

  return null;
}
