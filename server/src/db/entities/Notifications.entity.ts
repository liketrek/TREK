import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class Notifications {
  id?: number | null;
  type!: string;
  scope!: string;
  target!: number;
  sender?: Ref<Users> | null;
  recipient!: Ref<Users>;
  titleKey!: string;
  titleParams?: string | null = '{}';
  textKey!: string;
  textParams?: string | null = '{}';
  positiveTextKey?: string | null;
  negativeTextKey?: string | null;
  positiveCallback?: string | null;
  negativeCallback?: string | null;
  response?: string | null;
  navigateTextKey?: string | null;
  navigateTarget?: string | null;
  isRead?: number | null = 0;
  createdAt?: Date | null;
}

export class NotificationsRepository extends EntityRepository<Notifications> {}

export const NotificationsSchema = defineEntity({
  class: Notifications,
  repository: () => NotificationsRepository,
  indexes: [
    { name: 'idx_notifications_target_scope', properties: ['target', 'scope'] },
    {
      name: 'idx_notifications_recipient_created',
      properties: ['recipient', 'createdAt'],
    },
    {
      name: 'idx_notifications_recipient',
      properties: ['recipient', 'isRead', 'createdAt'],
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    type: p.text(),
    scope: p.text(),
    target: p.integer(),
    sender: () => p.manyToOne(Users).ref().nullable(),
    recipient: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    titleKey: p.text(),
    titleParams: p.text().nullable(),
    textKey: p.text(),
    textParams: p.text().nullable(),
    positiveTextKey: p.text().nullable(),
    negativeTextKey: p.text().nullable(),
    positiveCallback: p.text().nullable(),
    negativeCallback: p.text().nullable(),
    response: p.text().nullable(),
    navigateTextKey: p.text().nullable(),
    navigateTarget: p.text().nullable(),
    isRead: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
