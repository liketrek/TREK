import { NotificationsService } from './notifications.service';
import type { NotificationPayload } from './notifications.service';
import { notificationsInstance } from './notifications.instance';

/**
 * Non-Nest entry point for the notifications domain — for code running OUTSIDE
 * the Nest container: the scheduler's trip_reminder/todo_due cron requires and
 * the legacy services/adminService sender. Exports only the legacy
 * services/notificationService name still consumed there, 1:1, so repointing a
 * consumer is an import-path-only diff. Inside the container, inject
 * NotificationsService — every domain service does now.
 *
 * The six fire-and-forget senders that used to reach this file through a lazy
 * `import(...).then(({ send }) => …)` inject instead. The laziness was working
 * around a cycle that no longer exists, and it hid the edge from the module
 * graph while handing the send a service built outside the container.
 *
 * The instance itself lives in notifications.instance.ts, not here: several
 * suites replace this module wholesale with `vi.mock(..., () => ({ send }))`,
 * and a sibling bridge importing the instance from here would break under those
 * mocks. Delete this file when the scheduler and adminService migrate.
 */
const notifications = notificationsInstance();

export function send(payload: NotificationPayload): Promise<void> {
  return notifications.send(payload);
}

