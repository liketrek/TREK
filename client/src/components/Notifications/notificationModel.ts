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
