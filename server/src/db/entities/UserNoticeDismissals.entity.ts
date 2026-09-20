import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class UserNoticeDismissals {
  [PrimaryKeyProp]?: ['user', 'noticeId'];
  user!: Ref<Users>;
  noticeId!: string;
  dismissedAt!: number;
  dismissedAppVersion?: string | null;
}

export class UserNoticeDismissalsRepository extends EntityRepository<UserNoticeDismissals> {}

export const UserNoticeDismissalsSchema = defineEntity({
  class: UserNoticeDismissals,
  repository: () => UserNoticeDismissalsRepository,
  properties: {
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade'),
    noticeId: p.text().primary(),
    dismissedAt: p.integer(),
    dismissedAppVersion: p.text().nullable(),
  },
});
