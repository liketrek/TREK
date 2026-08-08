import { DatabaseService } from '../../src/nest/database/database.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { NotificationPreferencesService } from '../../src/nest/notifications/notification-preferences.service';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { NtfyService } from '../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../src/nest/notifications/transports/webhook.service';

/**
 * A NotificationsService wired the way Nest wires it.
 *
 * The domain takes six providers since the fold, and eight places used to build
 * it by hand — every added constructor parameter was an eight-file diff. One
 * helper keeps that at one.
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
  );
}

/** The preferences half on its own, over the same connection. */
export function makeNotificationPreferencesService(dbs: DatabaseService): NotificationPreferencesService {
  return new NotificationPreferencesService(dbs, new MailerService(dbs));
}
