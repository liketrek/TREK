import { db } from '../db/database';

// Great-circle distance between two points in kilometres.
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Total flight distance a user has covered, summed across every non-cancelled
 * flight reservation in their trips. Each flight stores its waypoints in
 * reservation_endpoints (from → stops → to, ordered by sequence); we add up the
 * legs between consecutive points so multi-stop flights count correctly.
 */
export function getFlightDistanceKm(userId: number): number {
  const rows = db.prepare(`
    SELECT re.reservation_id, re.lat, re.lng
    FROM reservation_endpoints re
    JOIN reservations r ON r.id = re.reservation_id
    JOIN trips t ON t.id = r.trip_id
    LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = ?
    WHERE (t.user_id = ? OR tm.user_id IS NOT NULL)
      AND r.type = 'flight'
      AND r.status != 'cancelled'
    ORDER BY re.reservation_id, re.sequence
  `).all(userId, userId) as { reservation_id: number; lat: number; lng: number }[];

  let total = 0;
  let prev: { id: number; lat: number; lng: number } | null = null;
  for (const point of rows) {
    if (prev && prev.id === point.reservation_id) {
      total += haversineKm(prev.lat, prev.lng, point.lat, point.lng);
    }
    prev = { id: point.reservation_id, lat: point.lat, lng: point.lng };
  }
  return Math.round(total);
}
