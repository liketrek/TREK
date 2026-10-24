import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollectionToursRepository } from '../repositories/CollectionTours.repository';
import { DbTimestampType } from '../types';
import { Collections } from './Collections.entity';
import { TourTypes } from './TourTypes.entity';
import { Users } from './Users.entity';

export class CollectionTours {
  [EntityRepositoryType]?: CollectionToursRepository;
  id!: number & Opt;
  collection!: Ref<Collections>;
  collection_id!: number;
  saved_by?: number | null;
  name!: string;
  description?: string | null;
  website?: string | null;
  route_geometry?: string | null;
  waypoints!: string;
  tour_type!: string;
  distance?: number | null;
  elevation_gain?: number | null;
  elevation_loss?: number | null;
  duration?: number | null;
  planned_duration_minutes?: number | null;
  break_additional_minutes?: number | null;
  difficulty?: string | null;
  wanderer_ref?: string | null;
  match_confidence?: number | null;
  max_hiking_difficulty?: number | null;
  bike_profile?: string | null;
  run_profile?: string | null;
  run_pace_seconds_per_km?: number | null;
  ski_discipline?: string | null;
  ski_technique?: string | null;
  boat_type?: string | null;
  water_context?: string | null;
  paddle_speed_kmh?: number | null;
  portage_speed_kmh?: number | null;
  paddle_lake_style?: string | null;
  track_marks?: string | null;
  hiking_preferences?: string | null;
  origin!: string;
  origin_file_name?: string | null;
  track_started_at?: string | null;
  track_ended_at?: string | null;
  source_trip_title!: string;
  source_tour_name!: string;
  created_at!: string & Opt;
  ski_options?: string | null;
  tourTypeRef!: Ref<TourTypes>;
  savedByRef?: Ref<Users> | null;
}

export const CollectionToursSchema = defineEntity({
  class: CollectionTours,
  repository: () => CollectionToursRepository,
  properties: {
    id: p.integer().primary(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade').hidden().index('idx_collection_tours_collection'),
    collection_id: p.integer().persist(false).index('idx_collection_tours_collection'),
    saved_by: p.integer().nullable().persist(false).index('idx_collection_tours_saved_by'),
    name: p.text(),
    description: p.text().nullable(),
    website: p.text().nullable(),
    route_geometry: p.text().nullable(),
    waypoints: p.text(),
    tour_type: p.text().persist(false).index('idx_collection_tours_tour_type'),
    distance: p.double().nullable(),
    elevation_gain: p.double().nullable(),
    elevation_loss: p.double().nullable(),
    duration: p.double().nullable(),
    planned_duration_minutes: p.integer().nullable(),
    break_additional_minutes: p.integer().nullable(),
    difficulty: p.text().nullable(),
    wanderer_ref: p.text().nullable(),
    match_confidence: p.double().nullable(),
    max_hiking_difficulty: p.integer().nullable(),
    bike_profile: p.text().nullable(),
    run_profile: p.text().nullable(),
    run_pace_seconds_per_km: p.integer().nullable(),
    ski_discipline: p.text().nullable(),
    ski_technique: p.text().nullable(),
    boat_type: p.text().nullable(),
    water_context: p.text().nullable(),
    paddle_speed_kmh: p.double().nullable(),
    portage_speed_kmh: p.double().nullable(),
    paddle_lake_style: p.text().nullable(),
    track_marks: p.text().nullable(),
    hiking_preferences: p.text().nullable(),
    origin: p.text(),
    origin_file_name: p.text().nullable(),
    track_started_at: p.type(DbTimestampType).nullable(),
    track_ended_at: p.type(DbTimestampType).nullable(),
    source_trip_title: p.text(),
    source_tour_name: p.text(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    ski_options: p.text().nullable(),
    tourTypeRef: () => p.manyToOne(TourTypes).ref().joinColumn('tour_type').hidden().index('idx_collection_tours_tour_type'),
    savedByRef: () => p.manyToOne(Users).ref().joinColumn('saved_by').nullable().hidden().index('idx_collection_tours_saved_by'),
  },
});
