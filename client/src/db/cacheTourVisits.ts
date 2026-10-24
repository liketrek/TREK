import type { TourVisit } from '@trek/shared';
import { offlineDb, type CachedTourStationVisit } from './offlineDb';

function rowOf(tripId: number, visit: TourVisit): CachedTourStationVisit {
  return { assignment_id: visit.assignment_id, station_key: visit.station_key, status: visit.status, trip_id: tripId };
}

/**
 * CW-03: a trip's walk visits as the server listed them. The rows it no longer
 * lists go, so a stop taken back on another device does not come back offline.
 */
export async function replaceTripVisits(tripId: number, visits: readonly TourVisit[]): Promise<void> {
  await offlineDb.transaction('rw', offlineDb.tourStationVisits, async () => {
    await offlineDb.tourStationVisits.where('trip_id').equals(tripId).delete();
    await offlineDb.tourStationVisits.bulkPut(visits.map((visit) => rowOf(tripId, visit)));
  });
}

/** One day's visits of a walk as the server answered a mark of it; the other days stay as they are. */
export async function replaceAssignmentVisits(
  tripId: number,
  assignmentId: number,
  visits: readonly TourVisit[]
): Promise<void> {
  const own = visits.filter((visit) => visit.assignment_id === assignmentId);
  await offlineDb.transaction('rw', offlineDb.tourStationVisits, async () => {
    await offlineDb.tourStationVisits.where('assignment_id').equals(assignmentId).delete();
    await offlineDb.tourStationVisits.bulkPut(own.map((visit) => rowOf(tripId, visit)));
  });
}

/** The trip's walk visits as last cached, without the trip they were filed under. */
export async function cachedTripVisits(tripId: number): Promise<TourVisit[]> {
  const rows = await offlineDb.tourStationVisits.where('trip_id').equals(tripId).toArray();
  return rows.map((row) => ({ assignment_id: row.assignment_id, station_key: row.station_key, status: row.status }));
}
