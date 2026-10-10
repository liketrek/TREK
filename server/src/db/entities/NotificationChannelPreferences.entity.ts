import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { NotificationChannelPreferencesRepository } from '../repositories/NotificationChannelPreferences.repository';
import { Users } from './Users.entity';

export class NotificationChannelPreferences {
  [EntityRepositoryType]?: NotificationChannelPreferencesRepository;
  [PrimaryKeyProp]?: ['user', 'event_type', 'channel'];
  user!: Ref<Users>;
  user_id!: number;
  event_type!: string;
  channel!: string;
  enabled: number & Opt = 1;
}

export const NotificationChannelPreferencesSchema = defineEntity({
  class: NotificationChannelPreferences,
  repository: () => NotificationChannelPreferencesRepository,
  uniques: [{ properties: ['user', 'event_type', 'channel'] }],
  properties: {
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade').hidden().index('idx_ncp_user'),
    user_id: p.integer().persist(false).index('idx_ncp_user'),
    event_type: p.text().primary(),
    channel: p.text().primary(),
    enabled: p.integer().default(1),
  },
});
