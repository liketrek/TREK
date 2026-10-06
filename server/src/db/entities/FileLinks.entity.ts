import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { FileLinksRepository } from '../repositories/FileLinks.repository';
import { DbTimestampType } from '../types';
import { BudgetItems } from './BudgetItems.entity';
import { DayAssignments } from './DayAssignments.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { TripFiles } from './TripFiles.entity';

export class FileLinks {
  [EntityRepositoryType]?: FileLinksRepository;
  id!: number & Opt;
  file!: Ref<TripFiles>;
  file_id!: number;
  reservation?: Ref<Reservations> | null;
  reservation_id?: number | null;
  assignment?: Ref<DayAssignments> | null;
  assignment_id?: number | null;
  place?: Ref<Places> | null;
  place_id?: number | null;
  created_at?: string | null;
  budgetItem?: Ref<BudgetItems> | null;
  budget_item_id?: number | null;
}

export const FileLinksSchema = defineEntity({
  class: FileLinks,
  repository: () => FileLinksRepository,
  uniques: [
    {
      name: 'idx_file_links_file_budget',
      properties: ['file_id', 'budget_item_id'],
    },
    { properties: ['file', 'place'] },
    { properties: ['file', 'assignment'] },
    { properties: ['file', 'reservation'] },
  ],
  properties: {
    id: p.integer().primary(),
    file: () => p.manyToOne(TripFiles).ref().deleteRule('cascade').hidden(),
    file_id: p.integer().persist(false),
    reservation: () => p.manyToOne(Reservations).ref().deleteRule('cascade').nullable().hidden(),
    reservation_id: p.integer().nullable().persist(false),
    assignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade').nullable().hidden(),
    assignment_id: p.integer().nullable().persist(false),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    budgetItem: () => p.manyToOne(BudgetItems).ref().nullable().hidden().index('idx_file_links_budget_item_id'),
    budget_item_id: p.integer().nullable().persist(false).index('idx_file_links_budget_item_id'),
  },
});
