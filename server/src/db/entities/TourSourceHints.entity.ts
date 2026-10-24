import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourSourceHintsRepository } from '../repositories/TourSourceHints.repository';
import { TourSources } from './TourSources.entity';
import { Users } from './Users.entity';

export class TourSourceHints {
  [EntityRepositoryType]?: TourSourceHintsRepository;
  [PrimaryKeyProp]?: 'place';
  place?: Ref<TourSources> | null;
  place_id?: number | null;
  user!: Ref<Users>;
  user_id!: number;
  state?: TTourSourceHintsState | null;
  changes?: string | null;
  reason?: TTourSourceHintsReason | null;
  external_updated?: string | null;
  seen_hash?: string | null;
  seen_updated?: string | null;
  checked_at?: string | null;
}

export const TourSourceHintsState = {
  POSSIBLE_CHANGE: 'possible_change',
  CHANGED: 'changed',
  UNVERIFIABLE: 'unverifiable',
} as const;

export type TTourSourceHintsState = (typeof TourSourceHintsState)[keyof typeof TourSourceHintsState];

export const TourSourceHintsReason = {
  UNAVAILABLE: 'unavailable',
  NO_CHANGE_TIME: 'no_change_time',
} as const;

export type TTourSourceHintsReason = (typeof TourSourceHintsReason)[keyof typeof TourSourceHintsReason];

export const TourSourceHintsSchema = defineEntity({
  class: TourSourceHints,
  repository: () => TourSourceHintsRepository,
  properties: {
    place: () => p.oneToOne(TourSources).primary().ref().name('place_id').deleteRule('cascade').nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_tour_source_hints_user_id'),
    user_id: p.integer().persist(false).index('idx_tour_source_hints_user_id'),
    state: p.enum(() => TourSourceHintsState).nullable(),
    changes: p.text().nullable(),
    reason: p.enum(() => TourSourceHintsReason).nullable(),
    external_updated: p.text().nullable(),
    seen_hash: p.text().nullable(),
    seen_updated: p.text().nullable(),
    checked_at: p.text().nullable(),
  },
});
