import { DOCUMENT_PROVIDERS, DOCUMENT_PROVIDER_FIELDS } from '../document-provider-seed';
import type { DB } from '../kysely/db';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import type { SqlEntityManager } from '@mikro-orm/sql';

/**
 * Seeds the document providers.
 *
 * The rows come from `document-provider-seed.ts`, the same constants the
 * migration that introduces the tables uses, so a fresh install and an upgraded
 * one end up with identical rows. A row that is already there is left alone
 * (the insert does nothing on conflict), so an operator's edits survive.
 */
export class DocumentProviderSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const db = (em as SqlEntityManager).getKysely<Pick<DB, 'document_providers' | 'document_provider_fields'>>();

    for (const p of DOCUMENT_PROVIDERS) {
      await db
        .insertInto('document_providers')
        .values({
          id: p.id,
          name: p.name,
          description: p.description,
          icon: p.icon,
          enabled: 0,
          sort_order: p.sort_order,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }

    for (const f of DOCUMENT_PROVIDER_FIELDS) {
      await db
        .insertInto('document_provider_fields')
        .values({
          provider_id: f.provider_id,
          field_key: f.field_key,
          label: f.label,
          input_type: f.input_type,
          placeholder: f.placeholder,
          hint: f.hint,
          required: f.required,
          secret: f.secret,
          sort_order: f.sort_order,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }
}
