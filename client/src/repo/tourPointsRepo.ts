import type { TourWaypoint } from '@trek/shared';
import { tourRepo } from './tourRepo';

/** One read of a tour's saved points, shared by everyone showing that tour at that revision. */
interface SharedRead {
  points: Promise<readonly TourWaypoint[]>;
  controller: AbortController;
  holders: number;
}

const reads = new Map<string, SharedRead>();

/**
 * MDT-02: the saved points of a tour, read once however many views show it at
 * the same time: the fold in the planner's list and every day of the plan
 * holding one of its stages would otherwise each ask for the same tour.
 */
export const tourPointsRepo = {
  /**
   * The points of the tour at this revision, through the tour repo (the cache
   * standing in offline). A view holds the read while it shows the tour and
   * releases it when it stops; once nobody holds it, it is dropped and, while
   * still on its way, aborted. A failed read is dropped at once, so the next
   * view to ask reads again, and a new revision is a read of its own.
   */
  hold(tripId: number | string, placeId: number, revision: string) {
    const key = `${tripId}:${placeId}:${revision}`;
    const read = reads.get(key) ?? start(key, tripId, placeId);
    read.holders += 1;
    let held = true;
    const release = () => {
      if (!held) return;
      held = false;
      read.holders -= 1;
      if (read.holders > 0) return;
      if (reads.get(key) === read) reads.delete(key);
      read.controller.abort();
    };
    return { points: read.points, release };
  },
};

function start(key: string, tripId: number | string, placeId: number): SharedRead {
  const controller = new AbortController();
  const points = tourRepo.detail(tripId, placeId, controller.signal).then((detail) => detail.waypoints);
  const read: SharedRead = { points, controller, holders: 0 };
  points.catch(() => {
    if (reads.get(key) === read) reads.delete(key);
  });
  reads.set(key, read);
  return read;
}
