import { DOCUMENT_PROVIDERS, DOCUMENT_PROVIDER_FIELDS } from '../document-provider-seed';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 236 (`db/migrations.ts`).
 *
 * Document providers, part 1 of 3: the registry (#214).
 *
 * Deliberately its own pair of tables rather than a `kind` column on
 * `photo_providers`. The client filters on `type === 'photo_provider'`, the
 * Journey cascade runs `UPDATE photo_providers SET enabled = 0` with no WHERE
 * clause, and migrations are append-only. Reusing those tables would change the
 * behaviour of three existing paths, which is exactly what the
 * no-breaking-changes rule forbids. The field columns follow
 * `photo_provider_fields` except for `settings_key` and `payload_key`. Those map
 * a photo field onto a settings key and a request key; a document field is
 * stored under its own `field_key` in one JSON column, and the connect form
 * takes its fields from /docsync/providers rather than from the generic settings
 * form, so nothing would ever read them.
 *
 * The rows come from the same constants `seeds.ts` uses, so a fresh install and
 * an upgraded one agree.
 */
export class Migration20200101035600_document_providers_part_1_of_3_the extends Migration {
  override name = 'Migration20200101035600_document_providers_part_1_of_3_the';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS document_providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'FileText',
        enabled INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0
      )
    `);
    await this.execute(`
      CREATE TABLE IF NOT EXISTS document_provider_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id TEXT NOT NULL REFERENCES document_providers(id) ON DELETE CASCADE,
        field_key TEXT NOT NULL,
        label TEXT NOT NULL,
        input_type TEXT NOT NULL DEFAULT 'text',
        placeholder TEXT,
        hint TEXT,
        required INTEGER DEFAULT 0,
        secret INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        UNIQUE(provider_id, field_key)
      )
    `);

    for (const p of DOCUMENT_PROVIDERS) {
      await this.execute(
        `INSERT OR IGNORE INTO document_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, 0, ?)`,
        [p.id, p.name, p.description, p.icon, p.sort_order],
      );
    }
    for (const f of DOCUMENT_PROVIDER_FIELDS) {
      await this.execute(
        `INSERT OR IGNORE INTO document_provider_fields
           (provider_id, field_key, label, input_type, placeholder, hint, required, secret, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.provider_id, f.field_key, f.label, f.input_type, f.placeholder, f.hint, f.required, f.secret, f.sort_order],
      );
    }
  }
}
