import { Collection, EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ToursRepository } from '../repositories/Tours.repository';
import { Places } from './Places.entity';
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
  max_hiking_difficulty: number & Opt = 2;
  tourTypeRef!: Ref<TourTypes>;
  tour_waypoints_collection = new Collection<TourWaypoints>(this);
}

export const ToursSchema = defineEntity({
  class: Tours,
  repository: () => ToursRepository,
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
    max_hiking_difficulty: p.integer().default(2),
    tourTypeRef: () => p.manyToOne(TourTypes).ref().joinColumn('tour_type').hidden().index('idx_tours_tour_type'),
    tour_waypoints_collection: () => p.oneToMany(TourWaypoints).mappedBy('place').hidden(),
  },
});
