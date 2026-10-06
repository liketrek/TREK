import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { NotificationsRepository } from '../repositories/Notifications.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class Notifications {
  [EntityRepositoryType]?: NotificationsRepository;
  id!: number & Opt;
  type!: string;
  scope!: string;
  target!: number;
  sender?: Ref<Users> | null;
  sender_id?: number | null;
  recipient!: Ref<Users>;
  recipient_id!: number;
  title_key!: string;
  title_params?: string | null = '{}';
  text_key!: string;
  text_params?: string | null = '{}';
  positive_text_key?: string | null;
  negative_text_key?: string | null;
  positive_callback?: string | null;
  negative_callback?: string | null;
  response?: string | null;
  navigate_text_key?: string | null;
  navigate_target?: string | null;
  is_read?: number | null = 0;
  created_at?: string | null;
}

export const NotificationsSchema = defineEntity({
  class: Notifications,
  repository: () => NotificationsRepository,
  indexes: [
    { name: 'idx_notifications_target_scope', properties: ['target', 'scope'] },
    {
      name: 'idx_notifications_recipient_created',
      properties: ['recipient_id', 'created_at'],
    },
    {
      name: 'idx_notifications_recipient',
      properties: ['recipient_id', 'is_read', 'created_at'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    type: p.text(),
    scope: p.text(),
    target: p.integer(),
    sender: () => p.manyToOne(Users).ref().nullable().hidden(),
    sender_id: p.integer().nullable().persist(false),
    recipient: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    recipient_id: p.integer().persist(false),
    title_key: p.text(),
    title_params: p.text().nullable(),
    text_key: p.text(),
    text_params: p.text().nullable(),
    positive_text_key: p.text().nullable(),
    negative_text_key: p.text().nullable(),
    positive_callback: p.text().nullable(),
    negative_callback: p.text().nullable(),
    response: p.text().nullable(),
    navigate_text_key: p.text().nullable(),
    navigate_target: p.text().nullable(),
    is_read: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
