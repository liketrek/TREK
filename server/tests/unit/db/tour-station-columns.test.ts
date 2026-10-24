import { TourStationVisitsStatus } from '../../../src/db/entities/TourStationVisits.entity';
import { TourWaypointsImportance } from '../../../src/db/entities/TourWaypoints.entity';
import { STATION_IMPORTANCES, TOUR_VISIT_STATUSES } from '@trek/shared';

import { describe, expect, it } from 'vitest';

/**
 * CW-03: a station's importance and a visit's status are CHECK lists
 * (migration 045300) the entities carry as enums, and the contract holds its
 * own. A value one side knows and the other refuses would be a station the
 * planner can save and the database cannot store.
 */
describe('city walk columns match the contract', () => {
  it('knows the same importances as the station contract', () => {
    expect(Object.values(TourWaypointsImportance).sort()).toEqual([...STATION_IMPORTANCES].sort());
  });

  it('knows the same visit statuses as the visit contract', () => {
    expect(Object.values(TourStationVisitsStatus).sort()).toEqual([...TOUR_VISIT_STATUSES].sort());
  });
});
