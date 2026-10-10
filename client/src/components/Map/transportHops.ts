// What a transport booking draws on the map, worked out once for both renderers.
//
// ReservationOverlay (Leaflet) and reservationsMapbox (GL) used to carry their own
// copy of this: which booking types count, the great-circle arcs per leg and the
// route/duration labels. The drawing itself stays in each renderer.

import { Bike, Bus, CableCar, Car, CarTaxiFront, Plane, Route, Sailboat, Ship, Train, TramFront } from 'lucide-react';
import type { Reservation, ReservationEndpoint } from '../../types';
import { haversineKm } from '../../utils/geo';
import { geodesicArcs } from './flightGeodesy';

export type TransportType =
  | 'flight'
  | 'train'
  | 'cruise'
  | 'car'
  | 'bus'
  | 'taxi'
  | 'bicycle'
  | 'ferry'
  | 'cable_car'
  | 'transit'
  | 'transport_other';
const TRANSPORT_TYPES: TransportType[] = [
  'flight',
  'train',
  'cruise',
  'car',
  'bus',
  'taxi',
  'bicycle',
  'ferry',
  'cable_car',
  'transit',
  'transport_other',
];

export const TRANSPORT_COLOR = '#3b82f6';

export const TRANSPORT_META: Record<TransportType, { icon: typeof Plane; geodesic: boolean }> = {
  flight: { icon: Plane, geodesic: true },
  train: { icon: Train, geodesic: false },
  cruise: { icon: Ship, geodesic: true },
  car: { icon: Car, geodesic: false },
  bus: { icon: Bus, geodesic: false },
  taxi: { icon: CarTaxiFront, geodesic: false },
  bicycle: { icon: Bike, geodesic: false },
  ferry: { icon: Sailboat, geodesic: true },
  // Valley to mountain station as the rope runs: a straight line, never a road (#2535).
  cable_car: { icon: CableCar, geodesic: false },
  transit: { icon: TramFront, geodesic: false },
  transport_other: { icon: Route, geodesic: false },
};

function parseInTz(isoLocal: string, tz: string): number {
  const [datePart, timePart] = isoLocal.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = (timePart || '00:00').split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // A malformed date/time (e.g. an imported booking whose time is missing its
  // minutes) makes Date.UTC NaN; bail before formatToParts, which throws on a
  // non-finite date and would blank the whole trip. computeDuration's finiteness
  // check then drops the duration cleanly.
  if (!Number.isFinite(guess)) return Number.NaN;
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(new Date(guess))
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return guess - (asUtc - guess);
}

/** "2h 5m" between the two ends, read in their own time zones; null when it cannot be told. */
function computeDuration(
  from: ReservationEndpoint,
  to: ReservationEndpoint,
  fallbackStart: string | null,
  fallbackEnd: string | null
): string | null {
  let start = from.local_date && from.local_time ? `${from.local_date}T${from.local_time}` : fallbackStart;
  let end = to.local_date && to.local_time ? `${to.local_date}T${to.local_time}` : fallbackEnd;
  if (!start || !end) return null;

  if (!start.includes('T') && end.includes('T')) start = `${end.split('T')[0]}T${start}`;
  if (!end.includes('T') && start.includes('T')) end = `${start.split('T')[0]}T${end}`;
  if (!start.includes('T') || !end.includes('T')) return null;

  const fromTz = from.timezone || to.timezone;
  const toTz = to.timezone || fromTz;

  let startMs: number, endMs: number;
  if (fromTz && toTz) {
    startMs = parseInTz(start, fromTz);
    endMs = parseInTz(end, toTz);
  } else {
    startMs = new Date(start).getTime();
    endMs = new Date(end).getTime();
  }
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  if (endMs <= startMs) endMs += 24 * 60 * 60000;
  const minutes = Math.round((endMs - startMs) / 60000);
  if (minutes <= 0 || minutes > 48 * 60) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export interface TransportHop {
  res: Reservation;
  from: ReservationEndpoint;
  to: ReservationEndpoint;
  waypoints: ReservationEndpoint[];
  type: TransportType;
  arcs: [number, number][][];
  // Route ("VIE → LHR") and duration/distance line. Computed on every update but
  // not drawn since the stats badge was dropped; computeDuration still guards the
  // non-finite date that used to blank the trip (#1620).
  mainLabel: string | null;
  subLabel: string | null;
}

/**
 * The hop a booking draws, or null when it is no transport or has fewer than two
 * places to connect. wrapArcs says whether a great-circle arc that crosses the
 * antimeridian also gets a copy shifted by 360 degrees: Leaflet needs that, while a
 * GL map repeats features across world copies itself, so there one continuous arc
 * is enough (a shifted duplicate would sit on the wrapped copy and double the opacity).
 */
export function transportHop(r: Reservation, wrapArcs: boolean): TransportHop | null {
  if (!TRANSPORT_TYPES.includes(r.type as TransportType)) return null;
  // Ordered waypoints (from · stops · to). A single-leg booking has exactly two.
  const waypoints = (r.endpoints || [])
    .filter((e) => e.role === 'from' || e.role === 'to' || e.role === 'stop')
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  if (waypoints.length < 2) return null;
  const from = waypoints[0];
  const to = waypoints[waypoints.length - 1];
  const type = r.type as TransportType;
  const isGeo = TRANSPORT_META[type].geodesic;
  // One arc per leg (between consecutive waypoints), concatenated.
  const arcs: [number, number][][] = [];
  let distanceKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segArcs = isGeo
      ? geodesicArcs([a.lat, a.lng], [b.lat, b.lng], wrapArcs)
      : [
          [
            [a.lat, a.lng],
            [b.lat, b.lng],
          ] as [number, number][],
        ];
    arcs.push(...segArcs);
    distanceKm += haversineKm(a, b);
  }
  const duration = computeDuration(from, to, r.reservation_time || null, r.reservation_end_time || null);
  const distance = `${Math.round(distanceKm)} km`;
  // Show the full route (FRA → BER → HND) when every waypoint has a code.
  const mainLabel = waypoints.every((w) => w.code)
    ? waypoints.map((w) => w.code).join(' → ')
    : from.code && to.code
      ? `${from.code} → ${to.code}`
      : null;
  const subParts = [duration, distance].filter(Boolean) as string[];
  const subLabel = subParts.length > 0 ? subParts.join(' · ') : null;
  return { res: r, from, to, waypoints, type, arcs, mainLabel, subLabel };
}
