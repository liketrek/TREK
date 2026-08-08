import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { MailerService } from './mailer/mailer.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NtfyService } from './transports/ntfy.service';
import { WebhookService } from './transports/webhook.service';
import { NotificationsService } from './notifications.service';
import type { NotificationPayload } from './notifications.service';

/**
 * Non-Nest entry point for the notifications domain — for code running
 * OUTSIDE the Nest container (the scheduler's trip_reminder/todo_due cron
 * requires, the legacy services/adminService and services/memories/* senders)
 * plus the deliberately-lazy fire-and-forget `import(...).then(({ send }) =>
 * …)` sends in migrated Nest services (collab/collections/packing/
 * reservations/trips/vacay — kept lazy so a notification send can never
 * block or cycle a domain module). Exports only the legacy
 * services/notificationService name still consumed there, 1:1, so repointing
 * a consumer is an import-path-only diff. Inside the container, inject
 * NotificationsService instead (AdminController and the plugin RPC host do).
 * Delete this file when the legacy admin/memories services migrate and the
 * lazy senders inject.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton, and the channel registry is module-scoped
 * on purpose, so this instance and the DI singleton see the same channels — the
 * built-ins it registers in its constructor and the plugin channels the runtime
 * pushes in. A registry that were a provider would leave this instance empty and
 * silence every plugin channel on the scheduler's path.
 */
const dbs = new DatabaseService(db);
const mailer = new MailerService(dbs);
const notifications = new NotificationsService(
  dbs,
  new RealtimeService(),
  mailer,
  new WebhookService(dbs),
  new NtfyService(dbs),
  new NotificationPreferencesService(dbs, mailer),
);

export function send(payload: NotificationPayload): Promise<void> {
  return notifications.send(payload);
}
