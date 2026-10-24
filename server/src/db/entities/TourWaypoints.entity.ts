import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourWaypointsRepository } from '../repositories/TourWaypoints.repository';
import { Places } from './Places.entity';
import { Tours } from './Tours.entity';

export class TourWaypoints {
  [EntityRepositoryType]?: TourWaypointsRepository;
  id!: number & Opt;
  place!: Ref<Tours>;
  place_id!: number;
  lat!: number;
  lng!: number;
  role!: string;
  sequence!: number;
  fixed_leg?: string | null;
  lock?: string | null;
  shaping: number & Opt = 0;
  linkedPlace?: Ref<Places> | null;
  linked_place_id?: number | null;
  station_key?: string | null;
  name?: string | null;
  stay_minutes?: number | null;
  importance?: TTourWaypointsImportance | null;
  protected: number & Opt = 0;
  opening_hours?: string | null;
  poi_category?: string | null;
  stage_end: number & Opt = 0;
}

export const TourWaypointsImportance = {
  OPTIONAL: 'optional',
  MUST: 'must',
} as const;

export type TTourWaypointsImportance = (typeof TourWaypointsImportance)[keyof typeof TourWaypointsImportance];

export const TourWaypointsSchema = defineEntity({
  class: TourWaypoints,
  repository: () => TourWaypointsRepository,
  indexes: [
    {
      name: 'idx_tour_waypoints_linked_place',
      where: 'linked_place_id IS NOT NULL',
      properties: ['linked_place_id'],
    },
  ],
  uniques: [{ properties: ['place', 'sequence'] }],
  checks: [
    { name: 'tour_waypoints_stage_end_check', expression: 'stage_end IN (0, 1)' },
    { name: 'tour_waypoints_protected_check', expression: 'protected IN (0, 1)' },
    {
      name: 'tour_waypoints_stay_minutes_check',
      expression: 'stay_minutes IS NULL OR (stay_minutes >= 0 AND stay_minutes <= 1440)',
    },
    { name: 'tour_waypoints_shaping_check', expression: 'shaping IN (0, 1)' },
  ],
  properties: {
    id: p.integer().primary(),
    place: () => p.manyToOne(Tours).ref().name('place_id').deleteRule('cascade').hidden(),
    place_id: p.integer().persist(false),
    lat: p.double(),
    lng: p.double(),
    role: p.text(),
    sequence: p.integer(),
    fixed_leg: p.text().nullable(),
    lock: p.text().nullable(),
    shaping: p.integer().default(0),
    linkedPlace: () => p.manyToOne(Places).ref().nullable().hidden(),
    linked_place_id: p.integer().nullable().persist(false),
    station_key: p.text().nullable(),
    name: p.text().nullable(),
    stay_minutes: p.integer().nullable(),
    importance: p.enum(() => TourWaypointsImportance).nullable(),
    protected: p.integer().default(0),
    opening_hours: p.text().nullable(),
    poi_category: p.text().nullable(),
    stage_end: p.integer().default(0),
  },
});
