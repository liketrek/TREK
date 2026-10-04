/**
 * The two narrowing options of a public share link (#1712), as pure functions over
 * the snapshot the service has already read, so they can be tested apart from SQL.
 */

/** Getting there and sleeping there: every transport type, and the hotel. */
const TRAVEL_BOOKING_TYPES = new Set([
  'flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'cable_car', 'transit', 'transport_other',
  'hotel',
]);

export function isTravelBooking(type: unknown): boolean {
  return typeof type === 'string' && TRAVEL_BOOKING_TYPES.has(type);
}

interface ShareSnapshot {
  assignments: Record<number, Array<{ accommodation_id?: number | null; place?: { id: number; image_url?: string | null } }>>;
  dayNotes: Record<number, unknown[]>;
  places: Array<{ id: number; image_url?: string | null }>;
  reservations: Array<{ type?: unknown }>;
}

/**
 * "Only travel and stays": what family or an emergency contact needs to know,
 * without the museum and the restaurant. A day keeps only the stop its night's
 * booking wrote, the notes go, the place pool shrinks to where the trip sleeps,
 * and the bookings to transport and hotels.
 */
export function travelOnly<T extends ShareSnapshot>(data: T, stayPlaceIds: ReadonlySet<number>): T {
  const assignments: T['assignments'] = {};
  for (const [dayId, rows] of Object.entries(data.assignments)) {
    const kept = rows.filter(a => a.accommodation_id != null);
    if (kept.length) assignments[Number(dayId)] = kept;
  }
  return {
    ...data,
    assignments,
    dayNotes: {},
    places: data.places.filter(p => stayPlaceIds.has(p.id)),
    reservations: data.reservations.filter(r => isTravelBooking(r.type)),
  };
}

/** Without the place photos: a link to pass around without the preview images. */
export function withoutImages<T extends ShareSnapshot>(data: T): T {
  const assignments: T['assignments'] = {};
  for (const [dayId, rows] of Object.entries(data.assignments)) {
    assignments[Number(dayId)] = rows.map(a => (a.place ? { ...a, place: { ...a.place, image_url: null } } : a));
  }
  return { ...data, assignments, places: data.places.map(p => ({ ...p, image_url: null })) };
}
