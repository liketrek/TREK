import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { FactoryOrm } from './context';
import { findRow, insertRow, insertRows } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type TourRow = EntityDTO<Tours>;

/**
 * Turns the place into a tour. A tour is keyed by its place, so it has no id
 * of its own; its type defaults to 'hike', the one the tours migration seeds.
 */
export async function makeTour(orm: FactoryOrm, placeId: number, overrides: EntityData<Tours> = {}): Promise<TourRow> {
  await insertRow(orm, Tours, { place: placeId, tourTypeRef: 'hike', ...overrides });
  const tour = await findRow(orm, Tours, { place: placeId });
  if (!tour) throw new Error(`makeTour: no tour for place ${placeId} after its insert`);
  return tour;
}

type WaypointRole = 'start' | 'via' | 'end';

/**
 * The tour's waypoints, in the order given and numbered from 0. Without a
 * role the first is the start, the last the end and the rest are vias.
 */
export async function addTourWaypoints(
  orm: FactoryOrm,
  placeId: number,
  points: Array<{ lat: number; lng: number; role?: WaypointRole }>,
): Promise<void> {
  const roleAt = (i: number): WaypointRole => (i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'via');
  await insertRows(
    orm,
    TourWaypoints,
    points.map((p, sequence) => ({
      place: placeId,
      lat: p.lat,
      lng: p.lng,
      role: p.role ?? roleAt(sequence),
      sequence,
    })),
  );
}
