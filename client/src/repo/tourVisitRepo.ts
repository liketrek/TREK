import {
  stationKeySchema,
  tourVisitUpdateRequestSchema,
  type TourVisit,
  type TourVisitListResponse,
  type TourVisitUpdateRequest,
} from '@trek/shared';
import { tourVisitPath, tourVisitsApi } from '../api/tourVisits';
import { cachedTripVisits, replaceAssignmentVisits, replaceTripVisits } from '../db/cacheTourVisits';
import { offlineDb, type QueuedMutation } from '../db/offlineDb';
import { generateUUID, mutationQueue } from '../sync/mutationQueue';
import { cacheAfterWrite } from './dayRepo';
import { onlineThenCache } from './withOfflineFallback';

/** The Dexie table of the cached visits and the queue's resource of a mark, one name as everywhere else. */
const RESOURCE = 'tourStationVisits';

interface QueuedMark {
  assignmentId: number;
  stationKey: string;
  status: TourVisitUpdateRequest['status'];
}

/**
 * A mark still waiting in the queue, or null for any other row. One that failed
 * or waits as a conflict is not laid over: the server did not take it, and the
 * day shows what the server has until the user tries it again. The body names
 * only the status, so the station comes from the path it is sent to.
 */
function queuedMark(m: QueuedMutation): QueuedMark | null {
  if (m.resource !== RESOURCE || m.entityId === undefined) return null;
  if (m.status !== 'pending' && m.status !== 'syncing') return null;
  const key = stationKeySchema.safeParse(m.url.slice(m.url.lastIndexOf('/') + 1));
  const body = tourVisitUpdateRequestSchema.safeParse(m.body);
  if (!key.success || !body.success) return null;
  return { assignmentId: m.entityId, stationKey: key.data, status: body.data.status };
}

/** The visits with the trip's queued marks laid over them in the order they were made. */
async function withQueuedMarks(tripId: number, base: readonly TourVisit[]): Promise<TourVisit[]> {
  const queue = await offlineDb.mutationQueue.where('tripId').equals(tripId).sortBy('createdAt');
  const visits = new Map(base.map((visit) => [`${visit.assignment_id}:${visit.station_key}`, visit]));
  for (const mark of queue.map(queuedMark)) {
    if (!mark) continue;
    const id = `${mark.assignmentId}:${mark.stationKey}`;
    if (mark.status === 'planned') visits.delete(id);
    else visits.set(id, { assignment_id: mark.assignmentId, station_key: mark.stationKey, status: mark.status });
  }
  return [...visits.values()];
}

function ofDay(visits: readonly TourVisit[], assignmentId: number): TourVisitListResponse {
  return { visits: visits.filter((visit) => visit.assignment_id === assignmentId) };
}

/**
 * CW-03 through the offline core. Dexie holds the visits as the server last
 * said them, and a mark made offline, or online behind an older one still
 * queued, waits in the mutation queue as the only copy of it; every read lays
 * those marks over the cached rows, so a read from the server cannot hide one.
 * Marks carry no version: the last one to reach the server wins.
 */
export const tourVisitRepo = {
  async list(tripId: number | string): Promise<TourVisitListResponse> {
    const id = Number(tripId);
    return onlineThenCache(
      async () => {
        const { visits } = await tourVisitsApi.list(tripId);
        cacheAfterWrite(replaceTripVisits(id, visits), 'reading the visits of the city walks');
        return { visits: await withQueuedMarks(id, visits) };
      },
      async () => ({ visits: await withQueuedMarks(id, await cachedTripVisits(id)) })
    );
  },

  /**
   * Marks one station for one day. Offline, and online while an older mark of
   * that day still waits, it joins the queue and the day reads with it at once.
   * A day put on the plan offline has no id the server knows yet, so it cannot
   * be marked before it synced.
   */
  async update(
    tripId: number | string,
    assignmentId: number,
    stationKey: string,
    body: TourVisitUpdateRequest
  ): Promise<TourVisitListResponse> {
    if (assignmentId < 0) throw new Error('This day has not synced yet.');
    const id = Number(tripId);
    if (await mutationQueue.mustQueue(RESOURCE, assignmentId)) {
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: id,
        method: 'PUT',
        url: tourVisitPath(tripId, assignmentId, stationKey),
        body,
        resource: RESOURCE,
        entityId: assignmentId,
      });
      mutationQueue.sendSoon();
      return ofDay(await withQueuedMarks(id, await cachedTripVisits(id)), assignmentId);
    }
    const answer = await tourVisitsApi.update(tripId, assignmentId, stationKey, body);
    cacheAfterWrite(replaceAssignmentVisits(id, assignmentId, answer.visits), 'checking off a stop of a city walk');
    return answer;
  },

  /** A day's visits another traveller changed, as the trip's socket told them, with this device's queued marks on top. */
  async received(
    tripId: number | string,
    assignmentId: number,
    visits: readonly TourVisit[]
  ): Promise<TourVisitListResponse> {
    const id = Number(tripId);
    cacheAfterWrite(replaceAssignmentVisits(id, assignmentId, visits), 'a city walk was checked off elsewhere');
    return ofDay(await withQueuedMarks(id, visits), assignmentId);
  },
};
