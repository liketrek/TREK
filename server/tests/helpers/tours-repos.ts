import { TourTypes } from '../../src/db/entities/TourTypes.entity';
import { TourWaypoints } from '../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import type { TourTypesRepository } from '../../src/db/repositories/TourTypes.repository';
import type { TourWaypointsRepository } from '../../src/db/repositories/TourWaypoints.repository';
import type { ToursRepository } from '../../src/db/repositories/Tours.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Tours test-only repository factories, bound to a suite's own better-sqlite3
 * handle through the same memoised `sharedTestOrm` `test-uow.ts` exports, so
 * a repository built here and a `UnitOfWork` from `createTestUnitOfWork`
 * resolve the same `EntityManager` (the `todo-repos.ts` precedent).
 */
export function createTestToursRepo(db: Database.Database): Promise<ToursRepository> {
  return sharedTestOrm(db).then((t) => t.repo(Tours));
}

export function createTestTourTypesRepo(db: Database.Database): Promise<TourTypesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(TourTypes));
}

export function createTestTourWaypointsRepo(db: Database.Database): Promise<TourWaypointsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(TourWaypoints));
}

/** A `tours` row for an existing place, with the defaults a GPX import writes. */
export function createTour(
  db: Database.Database,
  placeId: number,
  overrides: Partial<{
    distance: number | null;
    match_confidence: number | null;
    max_hiking_difficulty: number;
    created_at: string;
  }> = {},
): void {
  db.prepare(
    `INSERT INTO tours (place_id, tour_type, distance, match_confidence, max_hiking_difficulty, created_at)
     VALUES (?, 'hike', ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
  ).run(
    placeId,
    overrides.distance ?? null,
    overrides.match_confidence ?? null,
    overrides.max_hiking_difficulty ?? 2,
    overrides.created_at ?? null,
  );
}
