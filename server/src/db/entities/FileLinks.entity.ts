import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { BudgetItems } from './BudgetItems.entity';
import { DayAssignments } from './DayAssignments.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { TripFiles } from './TripFiles.entity';

export class FileLinks {
  id?: number | null;
  file!: Ref<TripFiles>;
  reservation?: Ref<Reservations> | null;
  assignment?: Ref<DayAssignments> | null;
  place?: Ref<Places> | null;
  createdAt?: Date | null;
  budgetItem?: Ref<BudgetItems> | null;
}

export class FileLinksRepository extends EntityRepository<FileLinks> {}

export const FileLinksSchema = defineEntity({
  class: FileLinks,
  repository: () => FileLinksRepository,
  uniques: [
    { name: 'idx_file_links_file_budget', properties: ['file', 'budgetItem'] },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    file: () => p.manyToOne(TripFiles).ref().deleteRule('cascade'),
    reservation: () => p.manyToOne(Reservations).ref().deleteRule('cascade').nullable(),
    assignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade').nullable(),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    budgetItem: () => p.manyToOne(BudgetItems).ref().nullable().index('idx_file_links_budget_item_id'),
  },
});
