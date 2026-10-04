import type Database from 'better-sqlite3';
import { sharedTestOrm } from './test-uow';
import { Notifications } from '../../src/db/entities/Notifications.entity';
import type { NotificationsRepository } from '../../src/db/repositories/Notifications.repository';
import { NotificationChannelPreferences } from '../../src/db/entities/NotificationChannelPreferences.entity';
import type { NotificationChannelPreferencesRepository } from '../../src/db/repositories/NotificationChannelPreferences.repository';
import { PushSubscriptions } from '../../src/db/entities/PushSubscriptions.entity';
import type { PushSubscriptionsRepository } from '../../src/db/repositories/PushSubscriptions.repository';

/**
 * Plan 3f Task 3 (`NotificationsService`/`NotificationPreferencesService`)
 * test-only repository factories, bound to a suite's own better-sqlite3
 * handle via the SAME memoised `sharedTestOrm` `test-uow.ts` exports — the
 * `todo-repos.ts`/`packing-repos.ts` precedent (a repository from a SECOND,
 * independent ORM instance would resolve a different transaction fork than
 * the `UnitOfWork`/`AppSettingsRepository` a hand-built service also needs).
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning those
 * two files give for themselves: avoids colliding with a concurrently
 * in-flight task's edits to that shared file.
 */
export function createTestNotificationsRepo(db: Database.Database): Promise<NotificationsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(Notifications));
}

export function createTestNotificationChannelPreferencesRepo(db: Database.Database): Promise<NotificationChannelPreferencesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(NotificationChannelPreferences));
}

/** Web Push (#894): the `push_subscriptions` table behind `PushSubscriptionsService`. */
export function createTestPushSubscriptionsRepo(db: Database.Database): Promise<PushSubscriptionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PushSubscriptions));
}
