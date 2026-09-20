import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Collections } from './Collections.entity';
import { Users } from './Users.entity';

export class CollectionMembers {
  id?: number | null;
  collection!: Ref<Collections>;
  user!: Ref<Users>;
  status: string & Opt = 'pending';
  role: string & Opt = 'editor';
  createdAt?: Date | null;
}

export class CollectionMembersRepository extends EntityRepository<CollectionMembers> {}

export const CollectionMembersSchema = defineEntity({
  class: CollectionMembers,
  repository: () => CollectionMembersRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_collection_members_user'),
    status: p.text(),
    role: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
