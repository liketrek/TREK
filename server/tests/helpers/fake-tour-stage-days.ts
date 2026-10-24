/**
 * The part of AssignmentsService that ToursService asks when a saved change
 * takes stages of a multi-day tour off their days (MDT-02), for suites that
 * build ToursService by hand. Given the tours repository it takes
 * the rows off for real, so a suite on the test database sees them go;
 * without one there is nothing to take off. The journey refresh after it is
 * left out: the assignments suites cover it.
 */
import type { ToursRepository } from '../../src/db/repositories/Tours.repository';
import type { AssignmentsService } from '../../src/nest/assignments/assignments.service';

export function tourStageDays(tours?: ToursRepository): AssignmentsService {
  const stages = {
    dropStaleTourStages: async (placeId: number, keys: readonly string[]) =>
      tours ? await tours.deleteTourStagesNotIn(placeId, keys) : [],
    reconcile: async () => undefined,
  };
  return stages as unknown as AssignmentsService;
}
