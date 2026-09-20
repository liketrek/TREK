import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class NotificationChannelPreferences {
  [PrimaryKeyProp]?: ['user', 'eventType', 'channel'];
  user!: Ref<Users>;
  eventType!: string;
  channel!: string;
  enabled: number & Opt = 1;
}

export class NotificationChannelPreferencesRepository extends EntityRepository<NotificationChannelPreferences> {}

export const NotificationChannelPreferencesSchema = defineEntity({
  class: NotificationChannelPreferences,
  repository: () => NotificationChannelPreferencesRepository,
  properties: {
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade').index('idx_ncp_user'),
    eventType: p.text().primary(),
    channel: p.text().primary(),
    enabled: p.integer(),
  },
});
