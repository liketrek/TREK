import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { BudgetItemsRepository } from '../repositories/BudgetItems.repository';
import { DbTimestampType } from '../types';
import { BudgetItemMembers } from './BudgetItemMembers.entity';
import { BudgetItemPayers } from './BudgetItemPayers.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class BudgetItems {
  [EntityRepositoryType]?: BudgetItemsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  category: string & Opt = 'Other';
  name!: string;
  total_price!: number & Opt;
  persons?: number | null;
  days?: number | null;
  note?: string | null;
  sort_order?: number | null = 0;
  created_at?: string | null;
  paidByUser?: Ref<Users> | null;
  paid_by_user_id?: number | null;
  expense_date?: string | null;
  reservation?: Ref<Reservations> | null;
  reservation_id?: number | null;
  currency?: string | null;
  exchange_rate!: number & Opt;
  ticket_json?: string | null;
  place?: Ref<Places> | null;
  place_id?: number | null;
  budget_item_members_collection = new Collection<BudgetItemMembers>(this);
  budget_item_payers_collection = new Collection<BudgetItemPayers>(this);
  file_links_collection = new Collection<FileLinks>(this);
}

export const BudgetItemsSchema = defineEntity({
  class: BudgetItems,
  repository: () => BudgetItemsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_budget_items_trip_id'),
    trip_id: p.integer().persist(false).index('idx_budget_items_trip_id'),
    category: p.text().default('Other'),
    name: p.text(),
    total_price: p.double().defaultRaw(`0`),
    persons: p.integer().nullable().defaultRaw(`NULL`),
    days: p.integer().nullable().defaultRaw(`NULL`),
    note: p.text().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    paidByUser: () => p.manyToOne(Users).ref().deleteRule('no action').nullable().hidden(),
    paid_by_user_id: p.integer().nullable().persist(false),
    expense_date: p.text().nullable().defaultRaw(`NULL`),
    reservation: () => p.manyToOne(Reservations).ref().nullable().hidden().defaultRaw(`NULL`),
    reservation_id: p.integer().nullable().persist(false).defaultRaw(`NULL`),
    currency: p.text().nullable(),
    exchange_rate: p.double().defaultRaw(`1`),
    ticket_json: p.text().nullable(),
    place: () => p.manyToOne(Places).ref().nullable().hidden().defaultRaw(`NULL`),
    place_id: p.integer().nullable().persist(false).defaultRaw(`NULL`),
    budget_item_members_collection: () => p.oneToMany(BudgetItemMembers).mappedBy('budgetItem').hidden(),
    budget_item_payers_collection: () => p.oneToMany(BudgetItemPayers).mappedBy('budgetItem').hidden(),
    file_links_collection: () => p.oneToMany(FileLinks).mappedBy('budgetItem').hidden(),
  },
});
