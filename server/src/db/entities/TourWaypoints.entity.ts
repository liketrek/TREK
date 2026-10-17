import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourWaypointsRepository } from '../repositories/TourWaypoints.repository';
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
}

export const TourWaypointsSchema = defineEntity({
  class: TourWaypoints,
  repository: () => TourWaypointsRepository,
  uniques: [{ properties: ['place', 'sequence'] }],
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
  },
});
