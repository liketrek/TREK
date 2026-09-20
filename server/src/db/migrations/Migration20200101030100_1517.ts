import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 181 (`db/migrations.ts`).
 *
 * #1517 — assign trip members / named guests to a reservation (mirrors budget_item_members).
 */
export class Migration20200101030100_1517 extends Migration {
  override name = 'Migration20200101030100_1517';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS reservation_travelers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(reservation_id, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_reservation_travelers_res ON reservation_travelers(reservation_id)`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_reservation_travelers_user ON reservation_travelers(user_id)`);
  }
}
