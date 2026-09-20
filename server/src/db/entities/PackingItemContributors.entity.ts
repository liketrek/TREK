import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PackingItems } from './PackingItems.entity';
import { Users } from './Users.entity';

export class PackingItemContributors {
  [PrimaryKeyProp]?: ['item', 'user'];
  item!: Ref<PackingItems>;
  user!: Ref<Users>;
  status: string & Opt = 'accepted';
  createdAt?: Date | null;
}

export class PackingItemContributorsRepository extends EntityRepository<PackingItemContributors> {}

export const PackingItemContributorsSchema = defineEntity({
  class: PackingItemContributors,
  repository: () => PackingItemContributorsRepository,
  properties: {
    item: () => p.manyToOne(PackingItems).primary().ref(),
    user: () => p.manyToOne(Users).primary().ref(),
    status: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
