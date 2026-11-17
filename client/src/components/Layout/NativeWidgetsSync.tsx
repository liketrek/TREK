/**
 * NativeWidgetsSync: keeps the iOS widgets and the travel-day Live Activity in
 * step with the trips stored on this device (native/widgets.ts). Runs at start,
 * whenever the app comes back to the foreground and every quarter hour while it
 * is open, so the next stop moves on through the day. The paired Apple Watch
 * gets the hero trip in full alongside (native/watch.ts), and what is ticked
 * off on the watch comes back here and goes through the trip store's toggles.
 * Renders nothing; outside an iOS binary with the widgets it does nothing.
 */
import { App } from '@capacitor/app';
import { useEffect, useRef } from 'react';
import { offlineDb } from '../../db/offlineDb';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';
import { TrekShell } from '../../native/trekShell';
import { applyWatchActions, buildWatchSnapshot, publishWatch, takeWatchActions, watchActive } from '../../native/watch';
import { onWatchListsChange } from '../../native/watchListChanges';
import { bookingsAhead, packingSummary, todosSummary, tripPlace } from '../../native/widgetExtras';
import { widgetFlight } from '../../native/widgetFlight';
import { widgetCover, widgetWeather } from '../../native/widgetMedia';
import { atlasSummary, collabSummary, packingDetail, type WidgetAtlas } from '../../native/widgetOnline';
import {
  buildSnapshot,
  liveDayDue,
  liveFlightOf,
  pickTrip,
  publishWidgets,
  todayOf,
  tripDayState,
  widgetTripChoices,
  widgetsActive,
  withBookings,
  type TripWidgetSnapshot,
  type WidgetLabels,
} from '../../native/widgets';
import { useAuthStore } from '../../store/authStore';
import { useFlightLiveStore } from '../../store/flightLiveStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Day, Place, Reservation, TranslationFn, Trip } from '../../types';
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
    missing: t('native.widget.missing'),
    countries: t('native.widget.countries'),
    world: t('native.widget.world'),
    group: t('native.widget.group'),
    poll: t('native.widget.poll'),
    votes: t('native.widget.votes'),
    noMessages: t('native.widget.noMessages'),
    departure: t('native.widget.departure'),
    flight: t('reservations.type.flight'),
    flightDeparts: t('flightLive.departsIn'),
    flightInAir: t('flightLive.airborne'),
    flightLands: t('flightLive.landsIn'),
    flightLanded: t('flightLive.landed'),
    flightOnTime: t('flightLive.onTime'),
    flightLate: t('flightLive.late'),
    flightEarly: t('flightLive.early'),
    flightEstimated: t('flightLive.estimated'),
    flightReady: t('flightLive.taxiing'),
    noFlight: t('flightLive.noFlight'),
    durDaysHours: t('flightLive.durDaysHours'),
    durHoursMinutes: t('flightLive.durHoursMinutes'),
    durMinutes: t('flightLive.durMinutes'),
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
  timeFormat: string;
}

/**
 * The trip's next or current flight for the flight widget, from the live
 * states the server worked out (its schedule in UTC, the feed's position). Read
 * fresh before the snapshot when the trip has flights and the device is online;
 * offline the last states held in memory serve.
 */
async function flightOf(trip: Trip, reservations: Reservation[], path: string, context: SyncContext) {
  if (!reservations.some((r) => r.type === 'flight')) return undefined;
  await useFlightLiveStore.getState().load(trip.id);
  const legs = Object.values(useFlightLiveStore.getState().trips[trip.id]?.legs ?? {});
  return widgetFlight(legs, Date.now(), path, { locale: context.language, timeFormat: context.timeFormat });
}

async function tripExtras(trip: Trip, days: Day[], context: SyncContext) {
  const { today, language, unit, time } = context;
  const [places, reservations, todos, packing, memberRows] = await Promise.all([
    offlineDb.places.where('trip_id').equals(trip.id).toArray(),
    offlineDb.reservations.where('trip_id').equals(trip.id).toArray(),
    offlineDb.todoItems.where('trip_id').equals(trip.id).toArray(),
    offlineDb.packingItems.where('trip_id').equals(trip.id).toArray(),
    offlineDb.tripMembers.where('tripId').equals(trip.id).toArray(),
  ]);
  const members = memberRows.length;
  const names = [trip.owner_username, ...memberRows.map((m) => m.username)].filter((n): n is string => !!n);
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
  const [weather, cover, bags, collab, flight] = await Promise.all([
    spot && inRange ? widgetWeather(spot, { date: weatherDate, lang: language, unit, place }) : Promise.resolve(null),
    widgetCover(trip.cover_image),
    packingDetail(trip.id, packing),
    collabSummary(
      trip.id,
      `/trips/${trip.id}?tab=collab`,
      [...new Set(names)],
      useAuthStore.getState().user?.id ?? null
    ),
    flightOf(trip, reservations, path, context),
  ]);
  const packed = packingSummary(packing, `/trips/${trip.id}?tab=listen`);
  const dayDates = new Map(days.map((d) => [d.id, (d.date ?? '').slice(0, 10)]));
  return {
    reservations,
    lists: { places, packing, todos },
    extras: {
      place,
      cover,
      placeCount: places.length,
      // The members table lists the others; the owner comes on top.
      memberCount: members > 0 ? members + 1 : 0,
      weather,
      bookings: bookingsAhead(reservations, { dayDates, today, tripPath: path, formatTime: time }),
      todos: todosSummary(todos, `${path}?tab=listen`),
      packing: packed && bags ? { ...packed, ...bags } : packed,
      collab,
      flight,
    },
  };
}

export default function NativeWidgetsSync(): null {
  const { t, language } = useTranslation();
  const { caps } = useNativeCapabilities();
  const timeFormat = useSettingsStore((s) => s.settings.time_format);
  const unit = useSettingsStore((s) => s.settings.temperature_unit);
  /** The ids of the watch's ticks applied in this session, which the watch drops from its pending ones. */
  const applied = useRef<string[]>([]);

  useEffect(() => {
    if (!widgetsActive()) return;
    let cancelled = false;

    /** One trip's snapshot with its day, as the widgets set to that trip show it. */
    const tripSnapshot = async (trip: Trip | null, context: SyncContext, atlas: WidgetAtlas | null) => {
      const days = trip ? await offlineDb.days.where('trip_id').equals(trip.id).toArray() : [];
      const extra = trip ? await tripExtras(trip, days, context) : null;
      const plain = trip
        ? todayOf(trip, days, context.today, (n, m) => t('native.widget.dayOf', { n, m }), context.time)
        : null;
      const day = plain ? withBookings(plain, extra?.reservations ?? [], context.today, context.time) : null;
      return { day, days, extra, snapshot: buildSnapshot(trip, day, labels(t), { ...extra?.extras, atlas }) };
    };

    /** The hero trip in full for the watch, with the ticks from it applied so far. */
    const publishToWatch = async (trip: Trip | null, main: Awaited<ReturnType<typeof tripSnapshot>>, today: string) => {
      if (!watchActive()) return;
      const lists = main.extra?.lists;
      await publishWatch(
        buildWatchSnapshot({
          trip,
          days: main.days,
          places: lists?.places ?? [],
          reservations: main.extra?.reservations ?? [],
          packing: lists?.packing ?? [],
          todos: lists?.todos ?? [],
          today,
          hour12: timeFormat === '12h',
          place: main.extra?.extras.place,
          cover: main.extra?.extras.cover,
          weather: main.extra?.extras.weather,
          applied: applied.current,
        })
      );
    };

    const sync = async () => {
      const now = new Date();
      const today = localDateStr(now.getFullYear(), now.getMonth(), now.getDate());
      const context: SyncContext = {
        today,
        language,
        unit,
        time: (value) => formatTime(value, language, timeFormat),
        timeFormat: timeFormat || '24h',
      };
      const trips = await offlineDb.trips.toArray();
      const hero = pickTrip(trips, today);
      // The countries do not depend on a trip: the atlas widget fills without one.
      const atlas = await atlasSummary(language);
      const main = await tripSnapshot(hero, context, atlas);
      // Every trip running or ahead also gets its own, for widgets set to it in Edit Widget.
      const choices: TripWidgetSnapshot[] = [];
      for (const trip of widgetTripChoices(trips, today)) {
        const own = trip.id === hero?.id ? main : await tripSnapshot(trip, context, null);
        choices.push({
          id: trip.id,
          title: trip.title,
          start: trip.start_date ?? '',
          end: trip.end_date ?? '',
          snapshot: own.snapshot,
        });
      }
      if (cancelled) return;
      // The Live Activity from three hours before the day's first timed stop, not all day long.
      const minutes = now.getHours() * 60 + now.getMinutes();
      const flight = liveFlightOf(main.extra?.extras.flight, Math.round(now.getTime() / 1000));
      const day =
        main.day && liveDayDue(main.day, minutes) ? tripDayState(main.day, minutes, t('native.widget.dayDone')) : null;
      // A flight near or in the air holds the activity as a boarding pass.
      const live = day ? { ...day, ...(flight ? { flight } : {}) } : null;
      await publishWidgets(main.snapshot, live, choices);
      await publishToWatch(hero, main, today);
    };

    /** The ticks made on the watch, written like a tap in the app, then the watch told. */
    const drainWatch = async () => {
      const actions = await takeWatchActions();
      if (cancelled || actions.length === 0) return;
      const { togglePackingItem, toggleTodoItem } = useTripStore.getState();
      const ids = await applyWatchActions(actions, { packing: togglePackingItem, todo: toggleTodoItem });
      applied.current = [...applied.current, ...ids].slice(-50);
      await sync();
    };

    void sync().then(drainWatch);
    const timer = window.setInterval(() => void sync(), REFRESH_MS);
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void sync().then(drainWatch);
    });
    const watchListener = watchActive() ? TrekShell.addListener('watchAction', () => void drainWatch()) : null;
    // A tick here, or one another member made, reaches the watch at once rather than on the next refresh.
    const stopListWatch = watchActive() ? onWatchListsChange(() => void sync()) : null;
    return () => {
      cancelled = true;
      stopListWatch?.();
      window.clearInterval(timer);
      void listener.then((handle) => handle.remove());
      void watchListener?.then((handle) => handle.remove());
    };
  }, [caps, t, language, timeFormat, unit]);

  return null;
}
