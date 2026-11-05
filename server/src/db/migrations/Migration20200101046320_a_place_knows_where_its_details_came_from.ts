import { Migration } from '@mikro-orm/migrations';

/**
 * A place remembers where each of its shareable details came from, and an
 * installation whose admin agreed can send the ones its users typed in to the
 * TREK Places API (community enrichment).
 *
 * `place_field_origin` holds one row per place and field (website, phone,
 * email, opening_hours, description, image): who set the value (`user`, a
 * provider, the assistant, a plugin, an import, an attachment, or `unknown`)
 * and the hash of the value the row describes. Only `user` rows whose hash
 * still matches the column are ever sent, so every value that existed before
 * this migration stays home: it has no row. The rows go with their place.
 *
 * `place_contrib_outbox` queues what waits to be sent, one row per place key
 * and field (the newest value replaces a queued one); its place going takes
 * the row with it. `place_contrib_log` is what the admin sees of what was
 * sent and what became of it, by day, without user, trip or row ids; a job
 * keeps 90 days of it.
 */
export class Migration20200101046320_a_place_knows_where_its_details_came_from extends Migration {
  override name = 'Migration20200101046320_a_place_knows_where_its_details_came_from';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_field_origin (
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        field TEXT NOT NULL CHECK(field IN ('website', 'phone', 'email', 'opening_hours', 'description', 'image')),
        origin TEXT NOT NULL CHECK(origin IN ('user', 'attachment', 'agent', 'plugin', 'import', 'google', 'amap',
          'osm', 'trek', 'wikimedia', 'website', 'unsplash', 'enrichment', 'unknown')),
        value_hash TEXT NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (place_id, field)
      )
    `);
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_contrib_outbox (
        id INTEGER PRIMARY KEY,
        contrib_key TEXT NOT NULL,
        field TEXT NOT NULL CHECK(field IN ('website', 'phone', 'email', 'opening_hours', 'description', 'image')),
        value TEXT NOT NULL,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        place_name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        country TEXT,
        cid TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        eligible_at DATETIME NOT NULL,
        next_attempt_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contrib_key, field)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_place_contrib_outbox_place ON place_contrib_outbox(place_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_place_contrib_outbox_due ON place_contrib_outbox(next_attempt_at)');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_contrib_log (
        id INTEGER PRIMARY KEY,
        day TEXT NOT NULL,
        contrib_key TEXT NOT NULL,
        place_name TEXT NOT NULL,
        field TEXT NOT NULL CHECK(field IN ('website', 'phone', 'email', 'opening_hours', 'description', 'image')),
        value_summary TEXT,
        result TEXT NOT NULL CHECK(result IN ('accepted', 'duplicate', 'rejected', 'withheld', 'retracted')),
        reason TEXT
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_place_contrib_log_day ON place_contrib_log(day)');
  }
}
