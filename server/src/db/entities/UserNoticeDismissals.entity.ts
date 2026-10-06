import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { UserNoticeDismissalsRepository } from '../repositories/UserNoticeDismissals.repository';
import { Users } from './Users.entity';

export class UserNoticeDismissals {
  [EntityRepositoryType]?: UserNoticeDismissalsRepository;
  [PrimaryKeyProp]?: ['user', 'notice_id'];
  user!: Ref<Users>;
  user_id!: number;
  notice_id!: string;
  dismissed_at!: number;
  dismissed_app_version?: string | null;
}

export const UserNoticeDismissalsSchema = defineEntity({
  class: UserNoticeDismissals,
  repository: () => UserNoticeDismissalsRepository,
  uniques: [{ properties: ['user', 'notice_id'] }],
  properties: {
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    notice_id: p.text().primary(),
    dismissed_at: p.integer(),
    dismissed_app_version: p.text().nullable(),
  },
});
