/**
 * A TourPaddleCheckService for suites that build ToursService by hand and are
 * not about paddle checks: the list and the detail pass through as they are.
 * It takes nothing in its constructor, so lint:test-new-service does not count
 * it; the paddle checks have their own suites over the real service. Beside it
 * the recorded tracks (ACT-01) of a trip that has none, for the same suites.
 */
import type { TourActivitiesRepository } from '../../src/db/repositories/TourActivities.repository';
import type { TourPaddleCheckService } from '../../src/nest/tours/tour-paddle-check.service';
import type { TourListItem } from '@trek/shared';

export class NoPaddleChecks {
  async forTrip(_tripId: number, items: TourListItem[]): Promise<TourListItem[]> {
    return items;
  }

  async forTour(item: TourListItem): Promise<{ item: TourListItem }> {
    return { item };
  }
}

/** The pass-through as the service ToursService takes. */
export function noPaddleChecks(): TourPaddleCheckService {
  return new NoPaddleChecks() as unknown as TourPaddleCheckService;
}

/** The reads of a trip without recorded tracks, as the repository ToursService takes. */
export function noActivities(): TourActivitiesRepository {
  return {
    listForTrip: async () => [],
    listForPlace: async () => [],
    findByTrack: async () => undefined,
  } as unknown as TourActivitiesRepository;
}
