import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourObstacleReviewsRepository } from '../repositories/TourObstacleReviews.repository';
import { DbTimestampType } from '../types';
import { Tours } from './Tours.entity';

export class TourObstacleReviews {
  [EntityRepositoryType]?: TourObstacleReviewsRepository;
  [PrimaryKeyProp]?: ['place', 'obstacle_key'];
  place!: Ref<Tours>;
  place_id!: number;
  obstacle_key!: string;
  decision!: TTourObstacleReviewsDecision;
  note?: string | null;
  route_fingerprint!: string;
  source_fingerprint!: string;
  obstacle_snapshot!: string;
  decided_at!: string;
  decided_by?: number | null;
}

export const TourObstacleReviewsDecision = {
  PASS: 'pass',
  PORTAGE: 'portage',
  REROUTE: 'reroute',
  NOT_AFFECTED: 'not_affected',
} as const;

export type TTourObstacleReviewsDecision = (typeof TourObstacleReviewsDecision)[keyof typeof TourObstacleReviewsDecision];

export const TourObstacleReviewsSchema = defineEntity({
  class: TourObstacleReviews,
  repository: () => TourObstacleReviewsRepository,
  uniques: [{ properties: ['place', 'obstacle_key'] }],
  properties: {
    place: () => p.manyToOne(Tours).primary().ref().name('place_id').deleteRule('cascade').hidden(),
    place_id: p.integer().persist(false),
    obstacle_key: p.text().primary(),
    decision: p.enum(() => TourObstacleReviewsDecision),
    note: p.text().nullable(),
    route_fingerprint: p.text(),
    source_fingerprint: p.text(),
    obstacle_snapshot: p.text(),
    decided_at: p.type(DbTimestampType),
    decided_by: p.integer().nullable(),
  },
});
