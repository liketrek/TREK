import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { RoadtripDayTracksRepository } from '../repositories/RoadtripDayTracks.repository';
import { Days } from './Days.entity';
import { Places } from './Places.entity';

export class RoadtripDayTracks {
  [EntityRepositoryType]?: RoadtripDayTracksRepository;
  [PrimaryKeyProp]?: 'day';
  day?: Ref<Days> | null;
  day_id?: number | null;
  place!: Ref<Places>;
  place_id!: number;
  stray_km?: number | null;
  created_at?: string | null;
}

export const RoadtripDayTracksSchema = defineEntity({
  class: RoadtripDayTracks,
  repository: () => RoadtripDayTracksRepository,
  properties: {
    day: () => p.oneToOne(Days).primary().ref().deleteRule('cascade').nullable().hidden(),
    day_id: p.integer().nullable().persist(false),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').hidden().index('idx_roadtrip_day_tracks_place'),
    place_id: p.integer().persist(false).index('idx_roadtrip_day_tracks_place'),
    stray_km: p.double().nullable(),
    created_at: p.text().nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
