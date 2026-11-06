import type { Day, Trip } from '../types';
import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';

/**
 * What the home-screen widget and the travel-day Live Activity show, built from
 * the trips this device keeps offline (db/offlineDb) and handed to the app
 * (TrekShell.setWidgetSnapshot, syncTripDay). The texts go along translated, so
 * the widget speaks the app's language without localising anything itself.
 */
export interface WidgetLabels {
  nextTrip: string;
  today: string;
  noTrip: string;
  /** Contains "{n}". */
  inDays: string;
  tomorrow: string;
  nothingPlanned: string;
}

interface WidgetStop {
  time: string | null;
  name: string;
  /** Minutes after midnight, for picking the next stop; not sent to the widget. */
  minutes: number | null;
}

export interface WidgetSnapshot {
  trip: { title: string; start: string; end: string; path: string } | null;
  today: { dayLabel: string; stops: { time: string | null; name: string }[] } | null;
  labels: WidgetLabels;
}

export interface TripDay {
  tripTitle: string;
  path: string;
  dayLabel: string;
  stops: WidgetStop[];
}

export function widgetsActive(): boolean {
  return isNativeIos() && hasNativeFeature('widgets');
}

function minutesOf(time: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * The running trip if there is one, else the next to start. Trips without dates
 * and trips already over are not candidates.
 */
export function pickTrip(trips: Trip[], today: string): Trip | null {
  const dated = trips.flatMap((t) =>
    t.start_date && t.end_date && !t.is_archived ? [{ trip: t, start: t.start_date, end: t.end_date }] : []
  );
  const running = dated.find((d) => d.start <= today && d.end >= today);
  if (running) return running.trip;
  const upcoming = dated.filter((d) => d.start > today).sort((a, b) => a.start.localeCompare(b.start));
  return upcoming[0]?.trip ?? null;
}

/** Today's day of the trip with its stops in plan order, if the trip runs today. */
export function todayOf(
  trip: Trip,
  days: Day[],
  today: string,
  dayLabel: (index: number, total: number) => string,
  formatTime: (time: string) => string
): TripDay | null {
  const ordered = days.filter((d) => d.trip_id === trip.id).sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));
  const index = ordered.findIndex((d) => (d.date ?? '').slice(0, 10) === today);
  if (index < 0) return null;
  const day = ordered[index];
  const stops = [...(day.assignments ?? [])]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .flatMap((a) =>
      a.place?.name
        ? [
            {
              name: a.place.name,
              time: a.place.place_time ? formatTime(a.place.place_time.slice(0, 5)) : null,
              minutes: minutesOf(a.place.place_time),
            },
          ]
        : []
    );
  return { tripTitle: trip.title, path: `/trips/${trip.id}`, dayLabel: dayLabel(index + 1, ordered.length), stops };
}

export function buildSnapshot(trip: Trip | null, day: TripDay | null, labels: WidgetLabels): WidgetSnapshot {
  return {
    trip: trip
      ? { title: trip.title, start: trip.start_date ?? '', end: trip.end_date ?? '', path: `/trips/${trip.id}` }
      : null,
    today: day ? { dayLabel: day.dayLabel, stops: day.stops.map(({ time, name }) => ({ time, name })) } : null,
    labels,
  };
}

/** The Live Activity's state: the first stop whose time is still ahead, else the last. */
export function tripDayState(day: TripDay, nowMinutes: number, allDone: string) {
  const timed = day.stops.filter((s) => s.minutes != null);
  const nextIndex = day.stops.findIndex((s) => s.minutes != null && s.minutes >= nowMinutes);
  const done = nextIndex < 0 ? timed.length : day.stops.slice(0, nextIndex).filter((s) => s.minutes != null).length;
  const next = nextIndex >= 0 ? day.stops[nextIndex] : null;
  return {
    tripTitle: day.tripTitle,
    path: day.path,
    dayLabel: day.dayLabel,
    nextName: next?.name ?? allDone,
    nextTime: next?.time ?? undefined,
    done,
    total: timed.length,
  };
}

export async function publishWidgets(
  snapshot: WidgetSnapshot,
  liveDay: ReturnType<typeof tripDayState> | null
): Promise<void> {
  if (!widgetsActive()) return;
  await TrekShell.setWidgetSnapshot({ json: JSON.stringify(snapshot) }).catch(reportNativeFailure);
  if (!hasNativeFeature('liveActivity')) return;
  if (liveDay && liveDay.total > 0) await TrekShell.syncTripDay(liveDay).catch(reportNativeFailure);
  else await TrekShell.endTripDay().catch(reportNativeFailure);
}
