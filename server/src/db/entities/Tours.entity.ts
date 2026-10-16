import { Collection, EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ToursRepository } from '../repositories/Tours.repository';
import { Places } from './Places.entity';
import { TourSources } from './TourSources.entity';
import { TourTypes } from './TourTypes.entity';
import { TourWaypoints } from './TourWaypoints.entity';

export class Tours {
  [EntityRepositoryType]?: ToursRepository;
  [PrimaryKeyProp]?: 'place';
  place?: Ref<Places> | null;
  place_id?: number | null;
  tour_type!: string;
  distance?: number | null;
  elevation_gain?: number | null;
  elevation_loss?: number | null;
  duration?: number | null;
  difficulty?: string | null;
  wanderer_ref?: string | null;
  match_confidence?: number | null;
  created_at?: string | null;
  max_hiking_difficulty?: number | null = 2;
  planned_duration_minutes?: number | null;
  break_additional_minutes?: number | null;
  derivedFromPlace?: Ref<Places> | null;
  derived_from_place_id?: number | null;
  recorded_route_geometry?: string | null;
  origin: TToursOrigin & Opt = ToursOrigin.TREK;
  origin_file_name?: string | null;
  boat_type?: TToursBoatType | null;
  water_context?: TToursWaterContext | null;
  paddle_speed_kmh?: number | null;
  tourTypeRef!: Ref<TourTypes>;
  tour_sources: Ref<TourSources> | null = null;
  tour_waypoints_collection = new Collection<TourWaypoints>(this);
}

export const ToursOrigin = {
  TREK: 'trek',
  GPX: 'gpx',
  WANDERER: 'wanderer',
} as const;

export type TToursOrigin = (typeof ToursOrigin)[keyof typeof ToursOrigin];

export const ToursBoatType = {
  KAYAK: 'kayak',
  CANOE: 'canoe',
  SUP: 'sup',
  OTHER: 'other',
} as const;

export type TToursBoatType = (typeof ToursBoatType)[keyof typeof ToursBoatType];

export const ToursWaterContext = {
  RIVER: 'river',
  LAKE: 'lake',
} as const;

export type TToursWaterContext = (typeof ToursWaterContext)[keyof typeof ToursWaterContext];

export const ToursSchema = defineEntity({
  class: Tours,
  repository: () => ToursRepository,
  indexes: [
    {
      name: 'idx_tours_derived_from_place_id',
      where: 'derived_from_place_id IS NOT NULL',
      properties: ['derived_from_place_id'],
    },
  ],
  properties: {
    place: () => p.oneToOne(Places).primary().ref().deleteRule('cascade').nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    tour_type: p.text().persist(false).index('idx_tours_tour_type'),
    distance: p.double().nullable(),
    elevation_gain: p.double().nullable(),
    elevation_loss: p.double().nullable(),
    duration: p.double().nullable(),
    difficulty: p.text().nullable(),
    wanderer_ref: p.text().nullable(),
    match_confidence: p.double().nullable(),
    created_at: p.text().nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    max_hiking_difficulty: p.integer().nullable(),
    planned_duration_minutes: p.integer().nullable(),
    break_additional_minutes: p.integer().nullable(),
    derivedFromPlace: () => p.manyToOne(Places).ref().nullable().hidden(),
    derived_from_place_id: p.integer().nullable().persist(false),
    recorded_route_geometry: p.text().nullable(),
    origin: p.enum(() => ToursOrigin).default('trek'),
    origin_file_name: p.text().nullable(),
    boat_type: p.enum(() => ToursBoatType).nullable(),
    water_context: p.enum(() => ToursWaterContext).nullable(),
    paddle_speed_kmh: p.double().nullable(),
    tourTypeRef: () => p.manyToOne(TourTypes).ref().joinColumn('tour_type').hidden().index('idx_tours_tour_type'),
    tour_sources: () => p.oneToOne(TourSources).ref().mappedBy('place').hidden(),
    tour_waypoints_collection: () => p.oneToMany(TourWaypoints).mappedBy('place').hidden(),
  },
});
