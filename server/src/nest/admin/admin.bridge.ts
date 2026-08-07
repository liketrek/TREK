import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AddonsService } from '../addons/addons.service';
import { SettingsService } from '../settings/settings.service';
import { AuthService } from '../auth/auth.service';
import { PasskeyService } from '../auth/passkey.service';
import { AtlasService } from '../atlas/atlas.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { PackingService } from '../packing/packing.service';
import { PermissionsService } from '../permissions/permissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminService } from './admin.service';

/**
 * Non-Nest entry point for the admin domain — for code running OUTSIDE the Nest
 * container. Exactly one consumer: the daily version-check cron in
 * scheduler.ts, which lazy-requires this instead of the retired
 * services/adminService. Exports the legacy name 1:1 so the repoint was an
 * import-path-only diff. Inside the container, inject AdminService instead.
 * Delete this file if the scheduler ever moves into Nest's @nestjs/schedule.
 *
 * The 5-minute version cache is module-scoped in admin.helpers.ts, so this
 * instance and the container singleton share it — the cron and
 * GET /api/admin/version-check hit GitHub once between them, as they did before
 * the fold.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const dbs = new DatabaseService(db);
const realtime = new RealtimeService();
const permissions = new PermissionsService(dbs);
const auth = new AuthService(dbs, permissions, new AtlasService(dbs), new TripMembershipService(dbs));
const admin = new AdminService(
  dbs,
  new SettingsService(dbs),
  new AddonsService(dbs),
  new PasskeyService(dbs, auth),
  new PackingService(dbs, permissions, realtime),
  auth,
  permissions,
  new NotificationsService(dbs, realtime),
);

export function checkAndNotifyVersion(): Promise<void> {
  return admin.checkAndNotifyVersion();
}
