import { addColumnIfMissing, bestEffort, columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 117 (`db/migrations.ts`).
 *
 * Security audit batch 1 — columns + indexes required by several fixes bundled
 * into one PR.
 *
 * - `share_tokens.expires_at`: public share links now get a 90-day TTL by
 *   default; existing rows stay NULL (= no expiry) so already-published links
 *   are not silently broken.
 * - Missing indexes on high-cardinality query paths (PERF-H1 in the audit):
 *   every `listTrips()` used to full-scan trips on user_id, and
 *   notifications/photos/reservations had similar gaps.
 */
export class Migration20200101015700_security_audit_batch_1 extends Migration {
  override name = 'Migration20200101015700_security_audit_batch_1';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'share_tokens', 'expires_at', `expires_at TEXT`);

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_photos_day_id ON photos(day_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_photos_place_id ON photos(place_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_reservations_day_id ON reservations(day_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token)`);

    // day_accommodations may have either start_day_id/end_day_id or a single
    // day_id depending on how far the schema has evolved; build whichever index
    // makes sense for the live columns. Non-fatal: the table may not exist on
    // very old installs.
    await bestEffort(async () => {
      const names = await columnNames(this, 'day_accommodations');
      if (names.has('start_day_id')) {
        await this.execute(
          `CREATE INDEX IF NOT EXISTS idx_day_accommodations_start_day_id ON day_accommodations(start_day_id)`,
        );
      }
      if (names.has('end_day_id')) {
        await this.execute(
          `CREATE INDEX IF NOT EXISTS idx_day_accommodations_end_day_id ON day_accommodations(end_day_id)`,
        );
      }
    });

    // The notifications schema has varied; probe before indexing.
    await bestEffort(async () => {
      const names = await columnNames(this, 'notifications');
      if (names.has('target') && names.has('scope')) {
        await this.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_target_scope ON notifications(target, scope)`);
      }
    });
  }
}
