import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 150 (`db/migrations.ts`).
 *
 * Collections addon — personal place library (#1081). Multi-list + per-place
 * status (idea/want/visited) + fusion sharing.
 */
export class Migration20200101023000_collections_addon extends Migration {
  override name = 'Migration20200101023000_collections_addon';

  override up(): void {
    this.addSql(`
      INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, config, sort_order)
      VALUES ('collections', 'Collections', 'Personal place library — save places across trips into named lists, copy into any trip, share with others', 'global', 'Bookmark', 0, '{}', 16)
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6366f1',
        icon TEXT DEFAULT 'Bookmark',
        cover_image TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(collection_id, user_id)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        saved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT,
        lat REAL,
        lng REAL,
        address TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        price REAL,
        currency TEXT,
        notes TEXT,
        image_url TEXT,
        google_place_id TEXT,
        google_ftid TEXT,
        osm_id TEXT,
        website TEXT,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'idea',
        source_trip_id INTEGER,
        source_place_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_place_tags (
        collection_place_id INTEGER NOT NULL REFERENCES collection_places(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (collection_place_id, tag_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collection_places_collection ON collection_places(collection_id)`);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collection_members_user ON collection_members(user_id)`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_collection_place_tags_place ON collection_place_tags(collection_place_id)`,
    );
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collection_place_tags_tag ON collection_place_tags(tag_id)`);
  }
}
