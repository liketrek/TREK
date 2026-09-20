import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PackingItems } from './PackingItems.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class PackingBags {
  id?: number | null;
  trip!: Ref<Trips>;
  name!: string;
  color: string & Opt = '#6366f1';
  weightLimitGrams?: number | null;
  sortOrder?: number | null = 0;
  createdAt?: Date | null;
  user?: Ref<Users> | null;
  packingBagMembers = new Collection<Users>(this);
  packingItemsCollection = new Collection<PackingItems>(this);
}

export class PackingBagsRepository extends EntityRepository<PackingBags> {}

export const PackingBagsSchema = defineEntity({
  class: PackingBags,
  repository: () => PackingBagsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade'),
    name: p.text(),
    color: p.text(),
    weightLimitGrams: p.integer().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    user: () => p.manyToOne(Users).ref().nullable(),
    packingBagMembers: () => p.manyToMany(Users).pivotTable('packing_bag_members').joinColumn('bag_id').inverseJoinColumn('user_id'),
    packingItemsCollection: () => p.oneToMany(PackingItems).mappedBy('bag'),
  },
});
