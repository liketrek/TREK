import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PackingBags } from './PackingBags.entity';
import { PackingItemContributors } from './PackingItemContributors.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class PackingItems {
  id?: number | null;
  trip!: Ref<Trips>;
  name!: string;
  checked?: number | null = 0;
  category?: string | null;
  sortOrder?: number | null = 0;
  createdAt?: Date | null;
  weightGrams?: number | null;
  bag?: Ref<PackingBags> | null;
  quantity: number & Opt = 1;
  updatedAt?: Date | null;
  isPrivate: number & Opt = 0;
  owner?: Ref<Users> | null;
  packingItemContributors = new Collection<Users>(this);
  packingItemRecipients = new Collection<Users>(this);
  packingItemContributorsCollection = new Collection<PackingItemContributors>(this);
}

export class PackingItemsRepository extends EntityRepository<PackingItems> {}

export const PackingItemsSchema = defineEntity({
  class: PackingItems,
  repository: () => PackingItemsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_packing_items_trip_id'),
    name: p.text(),
    checked: p.integer().nullable(),
    category: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    weightGrams: p.integer().nullable(),
    bag: () => p.manyToOne(PackingBags).ref().nullable(),
    quantity: p.integer(),
    updatedAt: p.datetime().nullable(),
    isPrivate: p.integer(),
    owner: () => p.manyToOne(Users).ref().nullable(),
    packingItemContributors: () => p.manyToMany(Users).pivotTable('packing_item_contributors').pivotEntity(() => PackingItemContributors).joinColumn('item_id').inverseJoinColumn('user_id'),
    packingItemRecipients: () => p.manyToMany(Users).pivotTable('packing_item_recipients').joinColumn('item_id').inverseJoinColumn('user_id'),
    packingItemContributorsCollection: () => p.oneToMany(PackingItemContributors).mappedBy('item'),
  },
});
