import type { LucideIcon } from 'lucide-react';
import {
  Backpack,
  Bell,
  BookmarkPlus,
  CalendarDays,
  Images,
  ListChecks,
  MessageCircle,
  Mountain,
  Plane,
  PlaneTakeoff,
  Sparkles,
  Ticket,
  TriangleAlert,
} from 'lucide-react';

import type { InAppNotification } from '../../store/inAppNotificationStore';

/** What a notification is about, read from its title key: it picks the symbol and colour of its tile. */
export type NotificationKind =
  | 'trip'
  | 'message'
  | 'booking'
  | 'flight'
  | 'packing'
  | 'todo'
  | 'vacay'
  | 'collection'
  | 'photos'
  | 'tour'
  | 'update'
  | 'alert'
  | 'other';

const KIND_BY_TITLE: Record<string, NotificationKind> = {
  'notif.trip_invite.title': 'trip',
  'notif.trip_reminder.title': 'trip',
  'notif.collab_message.title': 'message',
  'notif.booking_change.title': 'booking',
  'notif.flight_departed.title': 'flight',
  'notif.flight_delayed.title': 'flight',
  'notif.flight_landed.title': 'flight',
  'notif.mail_booking_added.title': 'booking',
  'notif.mail_booking_pending.title': 'booking',
  'notif.mail_ingest_paused.title': 'alert',
  'notif.packing_tagged.title': 'packing',
  'notif.todo_due.title': 'todo',
  'notif.vacay_invite.title': 'vacay',
  'notif.vacay_share.title': 'vacay',
  'notif.collection_invite.title': 'collection',
  'notif.photos_shared.title': 'photos',
  'notif.wanderer_source_hint.title': 'tour',
  'notif.paddle_region_requested.title': 'tour',
  'notif.version_available.title': 'update',
  'notifications.versionAvailable.title': 'update',
  'notif.replica_failure.title': 'alert',
  'notifications.synologySessionCleared.title': 'alert',
};

export function kindOf(titleKey: string): NotificationKind {
  return KIND_BY_TITLE[titleKey] ?? 'other';
}

/** The symbol of each kind and the tinted tile it sits on. */
export const KIND_LOOK: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  trip: { icon: Plane, tone: 'bg-info-soft text-info' },
  message: { icon: MessageCircle, tone: 'bg-success-soft text-success' },
  booking: { icon: Ticket, tone: 'bg-warning-soft text-warning' },
  flight: { icon: PlaneTakeoff, tone: 'bg-info-soft text-info' },
  packing: { icon: Backpack, tone: 'bg-warning-soft text-warning' },
  todo: { icon: ListChecks, tone: 'bg-success-soft text-success' },
  vacay: { icon: CalendarDays, tone: 'bg-info-soft text-info' },
  collection: { icon: BookmarkPlus, tone: 'bg-accent-subtle text-accent' },
  photos: { icon: Images, tone: 'bg-warning-soft text-warning' },
  tour: { icon: Mountain, tone: 'bg-success-soft text-success' },
  update: { icon: Sparkles, tone: 'bg-accent-subtle text-accent' },
  alert: { icon: TriangleAlert, tone: 'bg-danger-soft text-danger' },
  other: { icon: Bell, tone: 'bg-surface-secondary text-content-secondary' },
};

/**
 * When a notification was made. The server writes `YYYY-MM-DD HH:MM:SS` in UTC,
 * which a bare `new Date()` would read as local time.
 */
export function createdAt(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value) ? `${value.replace(' ', 'T')}Z` : value);
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const BARE_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The parameters of a notification's text as the reader's language writes
 * them. A day the server sends (a todo's due date) arrives as YYYY-MM-DD, which
 * would stand as "2026-11-05" in a German or Arabic sentence; it becomes the
 * short date of the language ("5. Nov.", "٥ نوفمبر"), with the year only when
 * it is not this one. Everything else passes through as it came.
 */
export function localizedParams(
  params: Record<string, string> | null | undefined,
  locale: string,
  now: Date = new Date()
): Record<string, string> {
  const out: Record<string, string> = { ...params };
  for (const [key, value] of Object.entries(out)) {
    const day = BARE_DAY.exec(value);
    if (!day) continue;
    const date = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
    out[key] = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
    }).format(date);
  }
  return out;
}

/**
 * The heading of the day a notification belongs to, in the reader's language:
 * today and yesterday by name, the rest of the week by weekday, anything older
 * by its date (with the year when it is not this one).
 */
export function dayLabel(date: Date, locale: string, now: Date = new Date()): string {
  const days = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (days <= 1) {
    const word = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.max(days, 0), 'day');
    return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);
  }
  if (days < 7) return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}

export interface NotificationGroup {
  key: string;
  label: string;
  items: InAppNotification[];
}

/** The list cut into days, in the order it came (newest first). */
export function groupByDay(list: InAppNotification[], locale: string, now: Date = new Date()): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  for (const n of list) {
    const date = createdAt(n.created_at);
    const key = String(dayStart(date));
    const current = groups[groups.length - 1];
    if (current?.key === key) current.items.push(n);
    else groups.push({ key, label: dayLabel(date, locale, now), items: [n] });
  }
  return groups;
}
