import { DOCUMENT_PROVIDERS, DOCUMENT_PROVIDER_FIELDS } from '../document-provider-seed';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

/**
 * Seeds the document providers.
 *
 * The rows come from `document-provider-seed.ts`, the same constants the
 * migration that introduces the tables uses, so a fresh install and an upgraded
 * one end up with identical rows.
 */
export class DocumentProviderSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();

    for (const p of DOCUMENT_PROVIDERS) {
      await connection.execute(
        'INSERT OR IGNORE INTO document_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
        [p.id, p.name, p.description, p.icon, p.sort_order],
      );
    }

    for (const f of DOCUMENT_PROVIDER_FIELDS) {
      await connection.execute(
        `INSERT OR IGNORE INTO document_provider_fields
           (provider_id, field_key, label, input_type, placeholder, hint, required, secret, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.provider_id, f.field_key, f.label, f.input_type, f.placeholder, f.hint, f.required, f.secret, f.sort_order],
      );
    }
  }
}
