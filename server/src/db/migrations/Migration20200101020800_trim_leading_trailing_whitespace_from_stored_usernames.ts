import { Migration } from '@mikro-orm/migrations';

/** A user row with whitespace around its username or email. */
interface DirtyRow {
  id: number;
  username?: string;
  email?: string;
}

/**
 * Legacy migration step 128 (`db/migrations.ts`).
 *
 * Trim leading/trailing whitespace from stored usernames and emails.
 *
 * A trimmed value can collide with an existing account, and the unique indexes
 * would reject the UPDATE. Rather than fail the boot, the colliding row is
 * suffixed with `__migrated_<id>` and a flag is written to `app_settings` so the
 * admin UI can surface that a manual review is needed. A renamed email means
 * that user cannot sign in with it until an operator fixes it — which is the
 * behaviour the original chose, deliberately, over refusing to start.
 */
export class Migration20200101020800_trim_leading_trailing_whitespace_from_stored_usernames extends Migration {
  override name = 'Migration20200101020800_trim_leading_trailing_whitespace_from_stored_usernames';

  override async up(): Promise<void> {
    let hadCollision = false;

    const dirtyUsernames = (await this.execute(
      `SELECT id, username FROM users WHERE username != TRIM(username)`,
    )) as DirtyRow[];

    for (const row of dirtyUsernames) {
      const trimmed = row.username!.trim();
      const collisions = (await this.execute(`SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?`, [
        trimmed,
        row.id,
      ])) as { id: number }[];
      const collision = collisions[0];

      const final = collision ? `${trimmed}__migrated_${row.id}` : trimmed;
      if (collision) {
        hadCollision = true;
        console.warn(
          `[migration] WHITESPACE COLLISION username: user id=${row.id} ` +
            `original=${JSON.stringify(row.username)} trimmed="${trimmed}" ` +
            `collides with user id=${collision.id}. Renamed to "${final}". ` +
            `Manual review required.`,
        );
      } else {
        console.warn(
          `[migration] Trimmed username for user id=${row.id}: ` + `${JSON.stringify(row.username)} → "${final}"`,
        );
      }
      await this.execute(`UPDATE users SET username = ? WHERE id = ?`, [final, row.id]);
    }

    const dirtyEmails = (await this.execute(`SELECT id, email FROM users WHERE email != TRIM(email)`)) as DirtyRow[];

    for (const row of dirtyEmails) {
      const trimmed = row.email!.trim();
      const collisions = (await this.execute(`SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?`, [
        trimmed,
        row.id,
      ])) as { id: number }[];
      const collision = collisions[0];

      let final = trimmed;
      if (collision) {
        hadCollision = true;
        const at = trimmed.lastIndexOf('@');
        final =
          at > 0 ? `${trimmed.slice(0, at)}__migrated_${row.id}${trimmed.slice(at)}` : `${trimmed}__migrated_${row.id}`;
        console.warn(
          `[migration] WHITESPACE COLLISION email: user id=${row.id} ` +
            `original=${JSON.stringify(row.email)} trimmed="${trimmed}" ` +
            `collides with user id=${collision.id}. Renamed to "${final}". ` +
            `User cannot sign in with this email until manually corrected.`,
        );
      } else {
        console.warn(`[migration] Trimmed email for user id=${row.id}: ` + `${JSON.stringify(row.email)} → "${final}"`);
      }
      await this.execute(`UPDATE users SET email = ? WHERE id = ?`, [final, row.id]);
    }

    if (hadCollision) {
      await this.execute(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'true')`,
      );
    }
  }
}
