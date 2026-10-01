import { DatabaseService } from '../../src/nest/database/database.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { NotificationPreferencesService } from '../../src/nest/notifications/notification-preferences.service';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { NtfyService } from '../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../src/nest/notifications/transports/webhook.service';
import { WebPushService } from '../../src/nest/notifications/transports/web-push.service';
import { PushSubscriptionsService } from '../../src/nest/notifications/push/push-subscriptions.service';
import { VapidKeysService } from '../../src/nest/notifications/push/vapid-keys.service';

/**
 * A NotificationsService wired the way Nest wires it.
 *
 * The domain takes seven providers since Web Push joined, and eight places used
 * to build it by hand: every added constructor parameter was an eight-file
 * diff. One helper keeps that at one.
 */
export function makeNotificationsService(dbs: DatabaseService, realtime = new RealtimeService()): NotificationsService {
  const mailer = new MailerService(dbs);
  return new NotificationsService(
    dbs,
    realtime,
    mailer,
    new WebhookService(dbs),
    new NtfyService(dbs),
    new NotificationPreferencesService(dbs, mailer),
    makeWebPushService(dbs),
  );
}

/** The Web Push transport over its two providers, on the same connection. */
export function makeWebPushService(dbs: DatabaseService): WebPushService {
  return new WebPushService(new VapidKeysService(dbs), new PushSubscriptionsService(dbs));
}

/** The preferences half on its own, over the same connection. */
export function makeNotificationPreferencesService(dbs: DatabaseService): NotificationPreferencesService {
  return new NotificationPreferencesService(dbs, new MailerService(dbs));
}

/**
 * A send that records instead of delivering.
 *
 * For the six services that took NotificationsService as a constructor
 * parameter when their fire-and-forget sends stopped being lazy imports. Most
 * suites do not care that a notification went out, only that the write around
 * it succeeded — but the parameter is required, and `tests/` is outside
 * `tsconfig`'s `include`, so leaving it off would not fail to compile. It would
 * land as `undefined` and throw inside the send.
 */
export function notificationsStub(send: NotificationSend = async () => {}): NotificationsService {
  return { send } as unknown as NotificationsService;
}

type NotificationSend = (payload: Parameters<NotificationsService['send']>[0]) => Promise<void>;
