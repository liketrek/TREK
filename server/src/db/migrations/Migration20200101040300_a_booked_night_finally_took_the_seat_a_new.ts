import { Migration } from '@mikro-orm/migrations';
import type { SqliteConnection } from '@mikro-orm/sqlite';
import { reseatBookedNights } from '../reseat-booked-nights';

/**
 * Legacy migration step 242 (`db/migrations.ts`).
 *
 * Seat every booked night where its check-in says, the way a night booked
 * today is seated (`night-seat.ts`'s `seatAmong`, which
 * `AccommodationsService` applies) — see `reseat-booked-nights.ts`'s own
 * header for the full rule. Every trip planned before that ordering change
 * keeps the old, wrong order until somebody edits its check-in; this brings
 * them forward the same way step 229/230 (`Migration20200101034900`) brought
 * the day stop itself forward for older bookings.
 *
 * Plan 4 Task 5c's finding: unlike ruling 7's assumption, nothing in the
 * numbered chain ever called `reseatBookedNights` — the two migrations near
 * the end that touch booked nights both call `attachStayStopsToCheckInDay`
 * instead (a different legacy step). This is the numbered migration that was
 * missing; an install upgrading through the chain without it never got this
 * one-time reorder.
 *
 * Frozen, called rather than reimplemented (ruling 7's spirit: don't rewrite
 * a step onto the ORM's query builder, since that risks producing a
 * different result than the one already shipped). `reseatBookedNights` wants
 * the synchronous better-sqlite3 API directly, not `this.execute()`, so this
 * reaches it through `getNativeClient()` — the same physical connection/
 * transaction `this.addSql()` would use, so it still runs inside the
 * migration's transaction exactly as the function's own docstring assumes.
 */
export class Migration20200101040300_a_booked_night_finally_took_the_seat_a_new extends Migration {
  override name = 'Migration20200101040300_a_booked_night_finally_took_the_seat_a_new';

  override async up(): Promise<void> {
    const connection = this.driver.getConnection() as SqliteConnection;
    const db = await connection.getNativeClient();
    const seated = reseatBookedNights(db);
    if (seated > 0) console.log(`[DB] Reseated ${seated} booked night(s) to their check-in day`);
  }
}
