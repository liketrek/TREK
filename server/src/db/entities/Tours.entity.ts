import { Collection, EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ToursRepository } from '../repositories/Tours.repository';
import { DbTimestampType } from '../types';
import { Places } from './Places.entity';
import { TourActivities } from './TourActivities.entity';
import { TourActivityExclusions } from './TourActivityExclusions.entity';
import { TourChangeSteps } from './TourChangeSteps.entity';
import { TourObstacleReviews } from './TourObstacleReviews.entity';
import { TourPackingLinks } from './TourPackingLinks.entity';
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
  portage_speed_kmh?: number | null;
  track_marks?: string | null;
  paddle_lake_style?: TToursPaddleLakeStyle | null;
  revision: number & Opt = 1;
  hiking_preferences?: string | null;
  taken_over_from_trip_title?: string | null;
  taken_over_from_tour_name?: string | null;
  bike_profile?: TToursBikeProfile | null;
  run_profile?: TToursRunProfile | null;
  run_pace_seconds_per_km?: number | null;
  ski_technique?: TToursSkiTechnique | null;
  track_started_at?: string | null;
  track_ended_at?: string | null;
  ski_discipline?: TToursSkiDiscipline | null;
  ski_options?: string | null;
  tourTypeRef!: Ref<TourTypes>;
  tour_activities_collection = new Collection<TourActivities>(this);
  tour_activities_collection1 = new Collection<TourActivities>(this);
  tour_activity_exclusions_collection = new Collection<TourActivityExclusions>(this);
  tour_change_steps_collection = new Collection<TourChangeSteps>(this);
  tour_obstacle_reviews_collection = new Collection<TourObstacleReviews>(this);
  tour_packing_links: Ref<TourPackingLinks> | null = null;
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

export const ToursPaddleLakeStyle = {
  DIRECT: 'direct',
  SHORE: 'shore',
} as const;

export type TToursPaddleLakeStyle = (typeof ToursPaddleLakeStyle)[keyof typeof ToursPaddleLakeStyle];

export const ToursBikeProfile = {
  TOURING: 'touring',
  ROAD: 'road',
  GRAVEL: 'gravel',
  MTB: 'mtb',
} as const;

export type TToursBikeProfile = (typeof ToursBikeProfile)[keyof typeof ToursBikeProfile];

export const ToursRunProfile = {
  RUNNING: 'running',
  TRAIL: 'trail',
} as const;

export type TToursRunProfile = (typeof ToursRunProfile)[keyof typeof ToursRunProfile];

export const ToursSkiTechnique = {
  CLASSIC: 'classic',
  SKATING: 'skating',
  UNKNOWN: 'unknown',
} as const;

export type TToursSkiTechnique = (typeof ToursSkiTechnique)[keyof typeof ToursSkiTechnique];

export const ToursSkiDiscipline = {
  ALPINE: 'alpine',
  SNOWBOARD: 'snowboard',
  CROSS_COUNTRY: 'cross_country',
  TOURING: 'touring',
  SNOWSHOE: 'snowshoe',
  WINTER_HIKE: 'winter_hike',
} as const;

export type TToursSkiDiscipline = (typeof ToursSkiDiscipline)[keyof typeof ToursSkiDiscipline];

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
  checks: [
    {
      name: 'tours_run_pace_seconds_per_km_check',
      expression: 'run_pace_seconds_per_km IS NULL OR (run_pace_seconds_per_km >= 120 AND run_pace_seconds_per_km <= 1200)',
    },
    { name: 'tours_revision_check', expression: 'revision >= 1' },
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
    portage_speed_kmh: p.double().nullable(),
    track_marks: p.text().nullable(),
    paddle_lake_style: p.enum(() => ToursPaddleLakeStyle).nullable(),
    revision: p.integer().default(1),
    hiking_preferences: p.text().nullable(),
    taken_over_from_trip_title: p.text().nullable(),
    taken_over_from_tour_name: p.text().nullable(),
    bike_profile: p.enum(() => ToursBikeProfile).nullable(),
    run_profile: p.enum(() => ToursRunProfile).nullable(),
    run_pace_seconds_per_km: p.integer().nullable(),
    ski_technique: p.enum(() => ToursSkiTechnique).nullable(),
    track_started_at: p.type(DbTimestampType).nullable(),
    track_ended_at: p.type(DbTimestampType).nullable(),
    ski_discipline: p.enum(() => ToursSkiDiscipline).nullable(),
    ski_options: p.text().nullable(),
    tourTypeRef: () => p.manyToOne(TourTypes).ref().joinColumn('tour_type').hidden().index('idx_tours_tour_type'),
    tour_activities_collection: () => p.oneToMany(TourActivities).mappedBy('place').hidden(),
    tour_activities_collection1: () => p.oneToMany(TourActivities).mappedBy('trackPlace').hidden(),
    tour_activity_exclusions_collection: () => p.oneToMany(TourActivityExclusions).mappedBy('place').hidden(),
    tour_change_steps_collection: () => p.oneToMany(TourChangeSteps).mappedBy('place').hidden(),
    tour_obstacle_reviews_collection: () => p.oneToMany(TourObstacleReviews).mappedBy('place').hidden(),
    tour_packing_links: () => p.oneToOne(TourPackingLinks).ref().mappedBy('place').hidden(),
    tour_sources: () => p.oneToOne(TourSources).ref().mappedBy('place').hidden(),
    tour_waypoints_collection: () => p.oneToMany(TourWaypoints).mappedBy('place').hidden(),
  },
});
