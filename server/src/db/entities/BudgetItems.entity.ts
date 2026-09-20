import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { BudgetItemMembers } from './BudgetItemMembers.entity';
import { BudgetItemPayers } from './BudgetItemPayers.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class BudgetItems {
  id?: number | null;
  trip!: Ref<Trips>;
  category: string & Opt = 'Other';
  name!: string;
  totalPrice!: number & Opt;
  persons?: number | null = NaN;
  days?: number | null = NaN;
  note?: string | null;
  sortOrder?: number | null = 0;
  createdAt?: Date | null;
  paidByUser?: Ref<Users> | null;
  expenseDate?: string | null;
  reservation?: Ref<Reservations> | null;
  currency?: string | null;
  exchangeRate!: number & Opt;
  ticketJson?: string | null;
  place?: Ref<Places> | null;
  budgetItemMembersCollection = new Collection<BudgetItemMembers>(this);
  budgetItemPayersCollection = new Collection<BudgetItemPayers>(this);
  fileLinksCollection = new Collection<FileLinks>(this);
}

export class BudgetItemsRepository extends EntityRepository<BudgetItems> {}

export const BudgetItemsSchema = defineEntity({
  class: BudgetItems,
  repository: () => BudgetItemsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_budget_items_trip_id'),
    category: p.text(),
    name: p.text(),
    totalPrice: p.double().default(0),
    persons: p.integer().nullable(),
    days: p.integer().nullable(),
    note: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    paidByUser: () => p.manyToOne(Users).ref().nullable(),
    expenseDate: p.text().nullable(),
    reservation: () => p.manyToOne(Reservations).ref().nullable(),
    currency: p.text().nullable(),
    exchangeRate: p.double().default(1),
    ticketJson: p.text().nullable(),
    place: () => p.manyToOne(Places).ref().nullable(),
    budgetItemMembersCollection: () => p.oneToMany(BudgetItemMembers).mappedBy('budgetItem'),
    budgetItemPayersCollection: () => p.oneToMany(BudgetItemPayers).mappedBy('budgetItem'),
    fileLinksCollection: () => p.oneToMany(FileLinks).mappedBy('budgetItem'),
  },
});
