import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollectionMembersRepository } from '../repositories/CollectionMembers.repository';
import { DbTimestampType } from '../types';
import { Collections } from './Collections.entity';
import { Users } from './Users.entity';

export class CollectionMembers {
  [EntityRepositoryType]?: CollectionMembersRepository;
  id!: number & Opt;
  collection!: Ref<Collections>;
  collection_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  status: string & Opt = 'pending';
  role: string & Opt = 'editor';
  created_at?: string | null;
}

export const CollectionMembersSchema = defineEntity({
  class: CollectionMembers,
  repository: () => CollectionMembersRepository,
  uniques: [{ properties: ['collection', 'user'] }],
  properties: {
    id: p.integer().primary(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade').hidden(),
    collection_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_collection_members_user'),
    user_id: p.integer().persist(false).index('idx_collection_members_user'),
    status: p.text().default('pending'),
    role: p.text().default('editor'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
