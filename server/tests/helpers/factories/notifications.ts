import { NotificationChannelPreferences } from '../../../src/db/entities/NotificationChannelPreferences.entity';
import { Notifications } from '../../../src/db/entities/Notifications.entity';
import type { FactoryOrm } from './context';
import { createRow, upsertRow } from './rows';
import { setAppSetting } from './settings';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type NotificationRow = EntityDTO<Notifications>;

/** An unread in-app notification of the simple kind for `recipientId`. */
export function makeNotification(
  orm: FactoryOrm,
  recipientId: number,
  overrides: EntityData<Notifications> = {},
): Promise<NotificationRow> {
  return createRow(orm, Notifications, {
    recipient: recipientId,
    type: 'simple',
    scope: 'user',
    target: recipientId,
    title_key: 'notifications.test.title',
    text_key: 'notifications.test.text',
    is_read: 0,
    ...overrides,
  });
}

/** Sets the instance's active notification channels ('email', 'webhook', 'email,webhook', 'none'). */
export function setNotificationChannels(orm: FactoryOrm, channels: string): Promise<void> {
  return setAppSetting(orm, 'notification_channels', channels);
}

/** Turns one event on one channel off for the user. */
export async function disableNotificationPref(
  orm: FactoryOrm,
  userId: number,
  eventType: string,
  channel: string,
): Promise<void> {
  await upsertRow(orm, NotificationChannelPreferences, { user: userId, event_type: eventType, channel, enabled: 0 });
}
