import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingItemContributorsRepository } from '../repositories/PackingItemContributors.repository';
import { DbTimestampType } from '../types';
import { PackingItems } from './PackingItems.entity';
import { Users } from './Users.entity';

export class PackingItemContributors {
  [EntityRepositoryType]?: PackingItemContributorsRepository;
  [PrimaryKeyProp]?: ['item', 'user'];
  item!: Ref<PackingItems>;
  item_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  status: string & Opt = 'accepted';
  created_at?: string | null;
}

export const PackingItemContributorsSchema = defineEntity({
  class: PackingItemContributors,
  repository: () => PackingItemContributorsRepository,
  uniques: [{ properties: ['item', 'user'] }],
  properties: {
    item: () => p.manyToOne(PackingItems).primary().ref().hidden(),
    item_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).primary().ref().hidden(),
    user_id: p.integer().persist(false),
    status: p.text().default('accepted'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
