import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingItemsRepository } from '../repositories/PackingItems.repository';
import { DbTimestampType } from '../types';
import { PackingBags } from './PackingBags.entity';
import { PackingItemContributors } from './PackingItemContributors.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class PackingItems {
  [EntityRepositoryType]?: PackingItemsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  name!: string;
  checked?: number | null = 0;
  category?: string | null;
  sort_order?: number | null = 0;
  created_at?: string | null;
  weight_grams?: number | null;
  bag?: Ref<PackingBags> | null;
  bag_id?: number | null;
  quantity: number & Opt = 1;
  updated_at?: string | null;
  is_private: number & Opt = 0;
  owner?: Ref<Users> | null;
  owner_id?: number | null;
  packed_quantity?: number | null;
  packing_item_contributors = new Collection<Users>(this);
  packing_item_recipients = new Collection<Users>(this);
  packing_item_contributors_collection = new Collection<PackingItemContributors>(this);
}

export const PackingItemsSchema = defineEntity({
  class: PackingItems,
  repository: () => PackingItemsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_packing_items_trip_id'),
    trip_id: p.integer().persist(false).index('idx_packing_items_trip_id'),
    name: p.text(),
    checked: p.integer().nullable(),
    category: p.text().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    weight_grams: p.integer().nullable(),
    bag: () => p.manyToOne(PackingBags).ref().nullable().hidden(),
    bag_id: p.integer().nullable().persist(false),
    quantity: p.integer().default(1),
    updated_at: p.type(DbTimestampType).nullable(),
    is_private: p.integer().default(0),
    owner: () => p.manyToOne(Users).ref().nullable().hidden(),
    owner_id: p.integer().nullable().persist(false),
    packed_quantity: p.integer().nullable(),
    packing_item_contributors: () => p.manyToMany(Users).pivotTable('packing_item_contributors').pivotEntity(() => PackingItemContributors).joinColumn('item_id').inverseJoinColumn('user_id').hidden(),
    packing_item_recipients: () => p.manyToMany(Users).pivotTable('packing_item_recipients').joinColumn('item_id').inverseJoinColumn('user_id').hidden(),
    packing_item_contributors_collection: () => p.oneToMany(PackingItemContributors).mappedBy('item').hidden(),
  },
});
