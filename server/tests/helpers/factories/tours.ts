import { TourActivities } from '../../../src/db/entities/TourActivities.entity';
import { TourPackingLinks } from '../../../src/db/entities/TourPackingLinks.entity';
import { TourSources } from '../../../src/db/entities/TourSources.entity';
import { TourStationVisits, type TTourStationVisitsStatus } from '../../../src/db/entities/TourStationVisits.entity';
import { TourWaypoints, type TTourWaypointsImportance } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { FactoryOrm } from './context';
import { createRow, findRow, insertRow, insertRows } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type TourRow = EntityDTO<Tours>;

/**
 * Turns the place into a tour. A tour is keyed by its place, so it has no id
 * of its own; its type defaults to 'hike', the one the tours migration seeds.
 */
export async function makeTour(orm: FactoryOrm, placeId: number, overrides: EntityData<Tours> = {}): Promise<TourRow> {
  await insertRow(orm, Tours, { place: placeId, tourTypeRef: 'hike' }, overrides);
  const tour = await findRow(orm, Tours, { place: placeId });
  if (!tour) throw new Error(`makeTour: no tour for place ${placeId} after its insert`);
  return tour;
}

type WaypointRole = 'start' | 'via' | 'end';

/** A city walk station's columns (CW-01 to CW-04), a shaping point's and a stage end's flags and the place a point stands for. */
interface StationColumns {
  station_key?: string | null;
  name?: string | null;
  stay_minutes?: number | null;
  importance?: TTourWaypointsImportance | null;
  /** 1 for a protected station. */
  protected?: number;
  opening_hours?: string | null;
  /** 1 for a shaping point. */
  shaping?: number;
  /** MDT-01: 1 for a stop that ends a stage of a multi-day tour. */
  stage_end?: number;
  /** The id of the place of the trip the point stands for. */
  linkedPlace?: number | null;
  /** The leg to the next point as a fixed line, as its JSON column stores it. */
  fixed_leg?: string | null;
}

/**
 * The tour's waypoints, in the order given and numbered from 0. Without a
 * role the first is the start, the last the end and the rest are vias. A
 * point may carry a station's columns; those it leaves out take their defaults.
 */
export async function addTourWaypoints(
  orm: FactoryOrm,
  placeId: number,
  points: Array<{ lat: number; lng: number; role?: WaypointRole } & StationColumns>,
): Promise<void> {
  const roleAt = (i: number): WaypointRole => (i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'via');
  await insertRows(
    orm,
    TourWaypoints,
    points.map(({ lat, lng, role, ...station }, sequence) => ({
      ...station,
      place: placeId,
      lat,
      lng,
      role: role ?? roleAt(sequence),
      sequence,
    })),
  );
}

/** CW-03: a station of a city walk visited or skipped on the day the assignment puts the walk on. */
export async function markStationVisit(
  orm: FactoryOrm,
  assignmentId: number,
  stationKey: string,
  status: TTourStationVisitsStatus,
): Promise<void> {
  await insertRow(orm, TourStationVisits, { assignment: assignmentId, station_key: stationKey, status });
}

type TourActivityRow = EntityDTO<TourActivities>;

/** ACT-01: the recording `trackPlaceId` assigned to the tour, on no day unless `assignment` names one. */
export function makeTourActivity(
  orm: FactoryOrm,
  placeId: number,
  trackPlaceId: number,
  overrides: EntityData<TourActivities> = {},
): Promise<TourActivityRow> {
  return createRow(orm, TourActivities, { place: placeId, trackPlace: trackPlaceId }, overrides);
}

/** P2D-XD-01: points the tour at its trip's packing list (category null) or at one category of it. */
export async function linkTourPacking(
  orm: FactoryOrm,
  placeId: number,
  category: string | null,
  linkedBy: number | null = null,
): Promise<void> {
  await insertRow(orm, TourPackingLinks, { place: placeId, category, linkedByRef: linkedBy });
}

/**
 * RS-05: the import record of a tour copied in from wanderer, as the import
 * writes it; the content and local fingerprints default to placeholders.
 */
export async function makeTourSource(
  orm: FactoryOrm,
  placeId: number,
  importedBy: number | null,
  overrides: EntityData<TourSources> = {},
): Promise<void> {
  await insertRow(
    orm,
    TourSources,
    {
      place: placeId,
      provider: 'wanderer',
      instance: 'https://wanderer.example.org',
      external_id: 'trail1',
      content_hash: 'n.d.r',
      local_hash: 'n.r',
      importedByRef: importedBy,
    },
    overrides,
  );
}
