/**
 * NativeWidgetsSync: keeps the iOS widgets and the travel-day Live Activity in
 * step with the trips stored on this device (native/widgets.ts). Runs at start,
 * whenever the app comes back to the foreground and every quarter hour while it
 * is open, so the next stop moves on through the day. Renders nothing; outside
 * an iOS binary with the widgets it does nothing.
 */
import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { offlineDb } from '../../db/offlineDb';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';
import { bookingsAhead, packingSummary, todosSummary, tripPlace } from '../../native/widgetExtras';
import { widgetCover, widgetWeather } from '../../native/widgetMedia';
import {
  buildSnapshot,
  pickTrip,
  publishWidgets,
  todayOf,
  tripDayState,
  widgetsActive,
  withBookings,
  type WidgetLabels,
} from '../../native/widgets';
import { useSettingsStore } from '../../store/settingsStore';
import type { Day, Place, TranslationFn, Trip } from '../../types';
import { formatTime } from '../../utils/formatters';
import { localDateStr } from '../../vacay/monthGrid';

const REFRESH_MS = 15 * 60 * 1000;
/** The forecast reaches about two weeks ahead; past that the widget shows no weather. */
const FORECAST_DAYS = 14;

function labels(t: TranslationFn): WidgetLabels {
  return {
    nextTrip: t('dashboard.nextTrip'),
    today: t('native.widget.today'),
    noTrip: t('native.widget.noTrip'),
    inDays: t('native.widget.inDays'),
    tomorrow: t('native.widget.tomorrow'),
    nothingPlanned: t('native.widget.nothingPlanned'),
    days: t('atlas.days'),
    bookings: t('assistant.card.tripChat.phase.upcoming'),
    noBookings: t('native.widget.noBookings'),
    todos: t('todo.subtab.todo'),
    noTodos: t('native.widget.noTodos'),
    packing: t('packing.title'),
    confirmed: t('reservations.confirmed'),
    pending: t('reservations.pending'),
    todayShort: t('native.widget.today'),
    tomorrowShort: t('native.widget.tomorrow'),
    now: t('native.widget.now'),
    places: t('dashboard.places'),
    travellers: t('native.widget.travellers'),
    allDone: t('native.widget.dayDone'),
  };
}

/** Where to ask for the weather: today's first place with coordinates, else any of the trip's. */
function weatherSpot(day: Day | undefined, places: Place[]): { lat: number; lng: number } | null {
  const planned = (day?.assignments ?? []).map((a) => a.place).find((p) => p?.lat != null && p?.lng != null);
  if (planned?.lat != null && planned.lng != null) return { lat: planned.lat, lng: planned.lng };
  const any = places.find((p) => p.lat != null && p.lng != null);
  return any?.lat != null && any.lng != null ? { lat: any.lat, lng: any.lng } : null;
}

interface SyncContext {
  today: string;
  language: string;
  unit: string | undefined;
  time: (value: string) => string;
}

async function tripExtras(trip: Trip, days: Day[], { today, language, unit, time }: SyncContext) {
  const [places, reservations, todos, packing, members] = await Promise.all([
    offlineDb.places.where('trip_id').equals(trip.id).toArray(),
    offlineDb.reservations.where('trip_id').equals(trip.id).toArray(),
    offlineDb.todoItems.where('trip_id').equals(trip.id).toArray(),
    offlineDb.packingItems.where('trip_id').equals(trip.id).toArray(),
    offlineDb.tripMembers.where('tripId').equals(trip.id).count(),
  ]);
  const path = `/trips/${trip.id}`;
  const place = tripPlace(places);
  // While the trip runs, today where it is; before, its first day, once that is in forecast range.
  const start = trip.start_date ?? today;
  const weatherDate = start > today ? start : today;
  const inRange = (Date.parse(weatherDate) - Date.parse(today)) / 86_400_000 <= FORECAST_DAYS;
  const spot = weatherSpot(
    days.find((d) => (d.date ?? '').slice(0, 10) === weatherDate),
    places
  );
  const [weather, cover] = await Promise.all([
    spot && inRange ? widgetWeather(spot, { date: weatherDate, lang: language, unit, place }) : Promise.resolve(null),
    widgetCover(trip.cover_image),
  ]);
  const dayDates = new Map(days.map((d) => [d.id, (d.date ?? '').slice(0, 10)]));
  return {
    reservations,
    extras: {
      place,
      cover,
      placeCount: places.length,
      // The members table lists the others; the owner comes on top.
      memberCount: members > 0 ? members + 1 : 0,
      weather,
      bookings: bookingsAhead(reservations, { dayDates, today, tripPath: path, formatTime: time }),
      todos: todosSummary(todos, `${path}?tab=listen`),
      packing: packingSummary(packing, `${path}?tab=listen`),
    },
  };
}

export default function NativeWidgetsSync(): null {
  const { t, language } = useTranslation();
  const { caps } = useNativeCapabilities();
  const timeFormat = useSettingsStore((s) => s.settings.time_format);
  const unit = useSettingsStore((s) => s.settings.temperature_unit);

  useEffect(() => {
    if (!widgetsActive()) return;
    let cancelled = false;

    const sync = async () => {
      const now = new Date();
      const today = localDateStr(now.getFullYear(), now.getMonth(), now.getDate());
      const time = (value: string) => formatTime(value, language, timeFormat);
      const trips = await offlineDb.trips.toArray();
      const trip = pickTrip(trips, today);
      const days = trip ? await offlineDb.days.where('trip_id').equals(trip.id).toArray() : [];
      const extra = trip ? await tripExtras(trip, days, { today, language, unit, time }) : null;
      const plain = trip ? todayOf(trip, days, today, (n, m) => t('native.widget.dayOf', { n, m }), time) : null;
      const day = plain ? withBookings(plain, extra?.reservations ?? [], today, time) : null;
      if (cancelled) return;
      const snapshot = buildSnapshot(trip, day, labels(t), extra?.extras);
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
  }, [caps, t, language, timeFormat, unit]);

  return null;
}
