import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourChangeStepsRepository } from '../repositories/TourChangeSteps.repository';
import { DbTimestampType } from '../types';
import { Tours } from './Tours.entity';

export class TourChangeSteps {
  [EntityRepositoryType]?: TourChangeStepsRepository;
  id!: number & Opt;
  place!: Ref<Tours>;
  place_id!: number;
  proposal_id!: string;
  base_revision!: number;
  revision!: number;
  changes!: string;
  before_state!: string;
  saved_by?: number | null;
  saved_at!: string & Opt;
  undone_revision?: number | null;
  undone_by?: number | null;
  undone_at?: string | null;
}

export const TourChangeStepsSchema = defineEntity({
  class: TourChangeSteps,
  repository: () => TourChangeStepsRepository,
  uniques: [{ properties: ['place', 'revision'] }],
  checks: [
    {
      name: 'tour_change_steps_undone_revision_check',
      expression: 'undone_revision IS NULL OR undone_revision > revision',
    },
    {
      name: 'tour_change_steps_revision_check',
      expression: 'revision = base_revision + 1',
    },
    {
      name: 'tour_change_steps_base_revision_check',
      expression: 'base_revision >= 1',
    },
  ],
  properties: {
    id: p.integer().primary(),
    place: () => p.manyToOne(Tours).ref().name('place_id').deleteRule('cascade').hidden(),
    place_id: p.integer().persist(false),
    proposal_id: p.text(),
    base_revision: p.integer(),
    revision: p.integer(),
    changes: p.text(),
    before_state: p.text(),
    saved_by: p.integer().nullable(),
    saved_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    undone_revision: p.integer().nullable(),
    undone_by: p.integer().nullable(),
    undone_at: p.type(DbTimestampType).nullable(),
  },
});
