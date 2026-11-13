import type { MailIngestPrefs } from '../entities/MailIngestPrefs.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** One `mail_ingest_prefs` row as stored: 0/1 flags. */
export interface MailIngestPrefsRow {
  id: number;
  user_id: number;
  enabled: number;
  ai_enabled: number;
  auto_add: number;
}

const _mailIngestPrefsRowKeys: AssertRowKeys<MailIngestPrefsRow, MailIngestPrefs> = true;

/** The switches a write names; the others keep their value. */
export type MailIngestPrefsPatch = Partial<Pick<MailIngestPrefsRow, 'enabled' | 'ai_enabled' | 'auto_add'>>;

type PrefsKyselyDB = Pick<DB, 'mail_ingest_prefs'>;

/**
 * `mail_ingest_prefs`: a person's switches for the mail import. A person
 * without a row has every switch on, the column defaults, so only a change
 * writes one.
 */
export class MailIngestPrefsRepository extends TrekRepository<MailIngestPrefs> {
  private db() {
    return this.kysely<PrefsKyselyDB>();
  }

  async findForUser(userId: number): Promise<MailIngestPrefsRow | null> {
    const row = await this.db().selectFrom('mail_ingest_prefs').selectAll().where('user_id', '=', userId).executeTakeFirst();
    return row ?? null;
  }

  /** Writes the named switches, creating the person's row with the defaults for the rest. */
  async upsertForUser(userId: number, patch: MailIngestPrefsPatch): Promise<void> {
    if (Object.keys(patch).length === 0) return;
    await this.db()
      .insertInto('mail_ingest_prefs')
      .values({ user_id: userId, ...patch })
      .onConflict((oc) => oc.column('user_id').doUpdateSet(patch))
      .execute();
  }
}
