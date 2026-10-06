import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingBagsRepository } from '../repositories/PackingBags.repository';
import { DbTimestampType } from '../types';
import { PackingItems } from './PackingItems.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class PackingBags {
  [EntityRepositoryType]?: PackingBagsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  name!: string;
  color: string & Opt = '#6366f1';
  weight_limit_grams?: number | null;
  sort_order?: number | null = 0;
  created_at?: string | null;
  user?: Ref<Users> | null;
  user_id?: number | null;
  packing_bag_members = new Collection<Users>(this);
  packing_items_collection = new Collection<PackingItems>(this);
}

export const PackingBagsSchema = defineEntity({
  class: PackingBags,
  repository: () => PackingBagsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    name: p.text(),
    color: p.text().default('#6366f1'),
    weight_limit_grams: p.integer().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    user: () => p.manyToOne(Users).ref().nullable().hidden().defaultRaw(`NULL`),
    user_id: p.integer().nullable().persist(false).defaultRaw(`NULL`),
    packing_bag_members: () => p.manyToMany(Users).pivotTable('packing_bag_members').joinColumn('bag_id').inverseJoinColumn('user_id').hidden(),
    packing_items_collection: () => p.oneToMany(PackingItems).mappedBy('bag').hidden(),
  },
});
