import type { PackingItem, Place, Reservation, TodoItem } from '../types';
import { splitReservationDateTime } from '../utils/formatters';

/**
 * The parts of the widget snapshot beyond the trip and today's stops: the
 * bookings ahead, the to-dos, the packing list, the destination's name, and
 * how a stop looks (its category's colour and an SF Symbol for its icon).
 * Pure, so the shapes the widgets get are tested here; the Swift side is in
 * client/ios/App/TREKWidgets/WidgetSnapshot.swift.
 */

export interface WidgetBooking {
  title: string;
  kind: string;
  date: string | null;
  time: string | null;
  detail: string | null;
  confirmed: boolean;
  path: string;
}

export interface WidgetTodos {
  open: number;
  total: number;
  items: { name: string; due: string | null; priority: number }[];
  path: string;
}

export interface WidgetPacking {
  packed: number;
  total: number;
  path: string;
}

/** The lucide icon names categories use (components/shared/categoryIcons.ts), as SF Symbols. */
const SYMBOLS: Record<string, string> = {
  MapPin: 'mappin',
  Building2: 'building.2.fill',
  BedDouble: 'bed.double.fill',
  UtensilsCrossed: 'fork.knife',
  Utensils: 'fork.knife',
  Landmark: 'building.columns.fill',
  ShoppingBag: 'bag.fill',
  Store: 'storefront.fill',
  Bus: 'bus.fill',
  Train: 'tram.fill',
  Car: 'car.fill',
  Plane: 'airplane',
  Ship: 'ferry.fill',
  Bike: 'bicycle',
  Activity: 'figure.run',
  Dumbbell: 'dumbbell.fill',
  Mountain: 'mountain.2.fill',
  Tent: 'tent.fill',
  Anchor: 'sailboat.fill',
  Coffee: 'cup.and.saucer.fill',
  Beer: 'mug.fill',
  Wine: 'wineglass.fill',
  Camera: 'camera.fill',
  Music: 'music.note',
  Theater: 'theatermasks.fill',
  Ticket: 'ticket.fill',
  TreePine: 'tree.fill',
  Waves: 'water.waves',
  Leaf: 'leaf.fill',
  Flower2: 'camera.macro',
  Sun: 'sun.max.fill',
  Globe: 'globe.europe.africa.fill',
  Compass: 'safari.fill',
  Flag: 'flag.fill',
  Navigation: 'location.north.fill',
  Map: 'map.fill',
  Church: 'building.columns.fill',
  Library: 'books.vertical.fill',
  Home: 'house.fill',
  Cross: 'cross.case.fill',
  Heart: 'heart.fill',
  Star: 'star.fill',
  CreditCard: 'creditcard.fill',
  Wifi: 'wifi',
  Luggage: 'suitcase.rolling.fill',
  Backpack: 'backpack.fill',
  Zap: 'bolt.fill',
  // The emoji icons of the categories older installs were seeded with.
  '🏨': 'bed.double.fill',
  '🍽️': 'fork.knife',
  '🏛️': 'building.columns.fill',
  '🛍️': 'bag.fill',
  '🚌': 'bus.fill',
  '🎯': 'figure.walk',
  '☕': 'cup.and.saucer.fill',
  '🏖️': 'beach.umbrella.fill',
  '🌿': 'leaf.fill',
  '📍': 'mappin',
};

const HEX = /^#[0-9a-f]{6}$/i;

/** A stop's colour and symbol from its place's category; nulls when it has none. */
export function stopLook(category: { color?: string | null; icon?: string | null } | null | undefined): {
  color: string | null;
  symbol: string | null;
} {
  return {
    color: category?.color && HEX.test(category.color) ? category.color : null,
    symbol: (category?.icon && SYMBOLS[category.icon]) || null,
  };
}

/** The booking kinds the widget draws; the rest of RESERVATION_TYPES fold into these. */
const KINDS: Record<string, string> = {
  flight: 'flight',
  train: 'train',
  transit: 'train',
  cable_car: 'train',
  bus: 'bus',
  car: 'car',
  taxi: 'car',
  bicycle: 'car',
  cruise: 'cruise',
  ferry: 'cruise',
  hotel: 'hotel',
  restaurant: 'restaurant',
  event: 'event',
  tour: 'tour',
  activity: 'tour',
};

function bookingDetail(r: Reservation): string | null {
  const legs = [...(r.endpoints ?? [])].sort((a, b) => a.sequence - b.sequence);
  const from = legs.find((e) => e.role === 'from');
  const to = [...legs].reverse().find((e) => e.role === 'to');
  if (from && to) return `${from.code || from.name} → ${to.code || to.name}`;
  return r.location?.trim() || r.accommodation_name || r.place_name || null;
}

/** Transport bookings open on the trip's transports tab, the rest on its bookings tab. */
const TRANSPORT_KINDS = new Set(['flight', 'train', 'bus', 'car', 'cruise']);

/** A booking with the day it falls on and its start time, as the widgets order them. */
interface DatedReservation {
  r: Reservation;
  /** yyyy-MM-dd: its own date, else the date of the day it is placed on. */
  day: string | null;
  /** HH:mm, 24 hours. */
  time: string | null;
}

/**
 * The trip's bookings from today on, soonest first: those without a date at
 * the end, cancelled ones and drafts an import still waits on left out. With
 * `running`, a booking that started before today but ends today or later (the
 * hotel the trip sleeps in) stays in.
 */
export function upcomingReservations(
  reservations: Reservation[],
  { dayDates, today, running = false }: { dayDates: Map<number, string>; today: string; running?: boolean }
): DatedReservation[] {
  const dayOf = (date: string | null, dayId: number | null | undefined) =>
    date ?? (dayId != null ? (dayDates.get(dayId) ?? null) : null);
  return reservations
    .filter((r) => r.status !== 'cancelled' && (r.ingest_state ?? 'live') === 'live')
    .map((r) => {
      const { date, time } = splitReservationDateTime(r.reservation_time);
      const day = dayOf(date, r.day_id);
      const end = running ? dayOf(splitReservationDateTime(r.reservation_end_time).date, r.end_day_id) : null;
      return { r, day, time, end };
    })
    .filter(({ day, end }) => day == null || day >= today || (end != null && end >= today))
    .sort((a, b) => {
      if (a.day !== b.day) return a.day == null ? 1 : b.day == null ? -1 : a.day.localeCompare(b.day);
      return (a.time ?? '99:99').localeCompare(b.time ?? '99:99');
    })
    .map(({ r, day, time }) => ({ r, day, time }));
}

/** The kind a booking type is drawn as. */
export function bookingKind(type: string): string {
  return KINDS[type] ?? 'other';
}

/** The trip's bookings from today on, soonest first, as the widgets show them. */
export function bookingsAhead(
  reservations: Reservation[],
  {
    dayDates,
    today,
    tripPath,
    formatTime,
    limit = 5,
  }: {
    /** The trip's day ids to their dates, for bookings placed on a day without a date of their own. */
    dayDates: Map<number, string>;
    today: string;
    tripPath: string;
    formatTime: (time: string) => string;
    limit?: number;
  }
): WidgetBooking[] {
  return upcomingReservations(reservations, { dayDates, today })
    .slice(0, limit)
    .map(({ r, day, time }) => {
      const kind = bookingKind(r.type);
      return {
        title: r.title,
        kind,
        date: day,
        time: time ? formatTime(time) : null,
        detail: bookingDetail(r),
        confirmed: r.status === 'confirmed',
        path: `${tripPath}?tab=${TRANSPORT_KINDS.has(kind) ? 'transports' : 'buchungen'}`,
      };
    });
}

/** Open to-dos first by due date (undated last), then by priority, highest first. */
export function todosSummary(items: TodoItem[], path: string, limit = 6): WidgetTodos {
  const open = items.filter((i) => !i.checked);
  const sorted = [...open].sort((a, b) => {
    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    return (b.priority ?? 0) - (a.priority ?? 0) || a.sort_order - b.sort_order;
  });
  return {
    open: open.length,
    total: items.length,
    items: sorted.slice(0, limit).map((i) => ({
      name: i.name,
      due: i.due_date ? i.due_date.slice(0, 10) : null,
      priority: Math.max(0, Math.min(3, i.priority ?? 0)),
    })),
    path,
  };
}

/** Packed items against all of them; null without a packing list. */
export function packingSummary(items: PackingItem[], path: string): WidgetPacking | null {
  if (items.length === 0) return null;
  return { packed: items.filter((i) => i.checked).length, total: items.length, path };
}

/**
 * Where the trip goes, in a few words: the town and country most of its
 * places share, read off their addresses ("…, 600-8216 Kyoto, Japan").
 */
export function tripPlace(places: Pick<Place, 'address'>[]): string | null {
  const counts = new Map<string, number>();
  for (const { address } of places) {
    const parts = (address ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;
    const country = parts[parts.length - 1];
    const town = parts[parts.length - 2].replace(/\b[\dA-Z]{0,4}[\d][\d\s-]*\b/g, '').trim();
    if (!town || /\d/.test(country)) continue;
    const key = `${town}, ${country}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let most = 0;
  for (const [key, count] of counts) {
    if (count > most) {
      best = key;
      most = count;
    }
  }
  return best;
}

/** Celsius to the user's unit, rounded. */
export function temperature(celsius: number, unit: string | undefined): number {
  return Math.round(unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius);
}
