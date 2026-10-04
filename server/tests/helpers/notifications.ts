import type Database from 'better-sqlite3';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { NotificationPreferencesService } from '../../src/nest/notifications/notification-preferences.service';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { NtfyService } from '../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../src/nest/notifications/transports/webhook.service';
import { WebPushService } from '../../src/nest/notifications/transports/web-push.service';
import { PushSubscriptionsService } from '../../src/nest/notifications/push/push-subscriptions.service';
import { VapidKeysService } from '../../src/nest/notifications/push/vapid-keys.service';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestSettingsRepo, createTestUsersRepo, sharedTestOrm } from './test-uow';
import {
  createTestNotificationsRepo,
  createTestNotificationChannelPreferencesRepo,
  createTestPushSubscriptionsRepo,
} from './notifications-repos';

/**
 * A NotificationsService wired the way Nest wires it.
 *
 * The domain takes seven providers since Web Push joined, and eight places used
 * to build it by hand: every added constructor parameter was an eight-file
 * diff. One helper keeps that at one.
 *
 * Plan 3f Task 3: `NotificationsService`/`NotificationPreferencesService` no
 * longer take a `DatabaseService` — both now take repositories, resolved
 * through `notifications-repos.ts`/`test-uow.ts`'s `sharedTestOrm`-memoised
 * factories, bound to the raw better-sqlite3 handle the same way every other
 * converted domain's test helper does. The helper's own OUTER signature
 * (`db`, `realtime`) is unchanged in shape, so every caller that only goes
 * through this function (`mcp-test-controllers.ts`, `plugin-host.ts`, both
 * test-only) needs no edit of its own beyond passing the raw handle (Plan 4
 * Task 4 dropped the `DatabaseService` wrapper — the handle was always all
 * this helper read off it).
 *
 * Plan 3f Task 4: `MailerService`/`WebhookService`/`NtfyService` no longer
 * take a `DatabaseService` either — `MailerService` takes
 * `UsersRepository`/`SettingsRepository`/`AppSettingsRepository`,
 * `WebhookService`/`NtfyService` take `SettingsRepository`/
 * `AppSettingsRepository`, all resolved through the same memoised
 * `test-uow.ts` factories bound to the same handle.
 */
export async function makeNotificationsService(db: Database.Database, realtime = new RealtimeService()): Promise<NotificationsService> {
  const usersRepo = await createTestUsersRepo(db);
  const settingsRepo = await createTestSettingsRepo(db);
  const appSettings = await createTestAppSettingsRepo(db);
  const mailer = new MailerService(usersRepo, settingsRepo, appSettings);
  const uow = await createTestUnitOfWork(db);
  const channelPrefsRepo = await createTestNotificationChannelPreferencesRepo(db);
  const notificationsRepo = await createTestNotificationsRepo(db);
  return new NotificationsService(
    realtime,
    mailer,
    new WebhookService(settingsRepo, appSettings),
    new NtfyService(settingsRepo, appSettings),
    new NotificationPreferencesService(mailer, uow, appSettings, channelPrefsRepo),
    uow,
    notificationsRepo,
    await makeWebPushService(db),
  );
}

/** The VAPID key pair holder, on the suite's own handle (repository, UoW and ORM all from `sharedTestOrm`). */
export async function makeVapidKeysService(db: Database.Database): Promise<VapidKeysService> {
  const t = await sharedTestOrm(db);
  return new VapidKeysService(await createTestAppSettingsRepo(db), await createTestUnitOfWork(db), t.orm);
}

/** The push_subscriptions table, on the suite's own handle. */
export async function makePushSubscriptionsService(db: Database.Database): Promise<PushSubscriptionsService> {
  return new PushSubscriptionsService(await createTestPushSubscriptionsRepo(db), await createTestUnitOfWork(db));
}

/** The Web Push transport over its two providers, on the same connection. */
export async function makeWebPushService(db: Database.Database): Promise<WebPushService> {
  return new WebPushService(await makeVapidKeysService(db), await makePushSubscriptionsService(db));
}

/** The preferences half on its own, over the same connection. */
export async function makeNotificationPreferencesService(db: Database.Database): Promise<NotificationPreferencesService> {
  const usersRepo = await createTestUsersRepo(db);
  const settingsRepo = await createTestSettingsRepo(db);
  const appSettings = await createTestAppSettingsRepo(db);
  const channelPrefsRepo = await createTestNotificationChannelPreferencesRepo(db);
  return new NotificationPreferencesService(new MailerService(usersRepo, settingsRepo, appSettings), await createTestUnitOfWork(db), appSettings, channelPrefsRepo);
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
