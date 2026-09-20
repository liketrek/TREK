import { Days } from './Days.entity';
import { Places } from './Places.entity';
import { defineEntity, EntityRepository, p, PrimaryKeyProp, type Ref } from '@mikro-orm/core';

export class RoadtripDayTracks {
  [PrimaryKeyProp]?: 'day';
  day?: Ref<Days> | null;
  place!: Ref<Places>;
  strayKm?: unknown | null;
  createdAt?: string | null;
}

export class RoadtripDayTracksRepository extends EntityRepository<RoadtripDayTracks> {}

export const RoadtripDayTracksSchema = defineEntity({
  class: RoadtripDayTracks,
  repository: () => RoadtripDayTracksRepository,
  properties: {
    day: () => p.oneToOne(Days).primary().ref().nullable(),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').index('idx_roadtrip_day_tracks_place'),
    strayKm: p.double().nullable(),
    createdAt: p
      .text()
      .nullable()
      .onCreate(() => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')),
  },
});
