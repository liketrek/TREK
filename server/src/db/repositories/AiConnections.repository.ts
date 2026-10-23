import { currentTimestampKysely } from '../dialect/kysely-functions';
import type { AiConnections } from '../entities/AiConnections.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * One `ai_connections` row as stored. `secrets` is the still-encrypted blob and
 * `account` the JSON text of AI_CONNECTION_ACCOUNT; the service opens both.
 */
export interface AiConnectionRow {
  id: number;
  scope: string;
  user_id: number | null;
  kind: string;
  model: string;
  base_url: string | null;
  secrets: string | null;
  secrets_version: number;
  hint: string | null;
  account: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const _aiConnectionRowKeys: AssertRowKeys<AiConnectionRow, AiConnections> = true;

/** What a save writes; the row's scope and owner are fixed by the call. */
interface AiConnectionWrite {
  kind: string;
  model: string;
  baseUrl: string | null;
  secrets: string | null;
  hint: string | null;
  account: string | null;
}

type AiConnectionsKyselyDB = Pick<DB, 'ai_connections'>;

const COLUMNS = [
  'id',
  'scope',
  'user_id',
  'kind',
  'model',
  'base_url',
  'secrets',
  'secrets_version',
  'hint',
  'account',
  'status',
  'created_at',
  'updated_at',
] as const;

/**
 * `ai_connections`: the instance's connection (no user) and one per user. A
 * save replaces the row of its owner, so the partial unique indexes never see
 * a second one; every write of `secrets` counts up `secrets_version`, which is
 * what a token refresh compares against before it writes.
 */
export class AiConnectionsRepository extends TrekRepository<AiConnections> {
  private db() {
    return this.kysely<AiConnectionsKyselyDB>();
  }

  private now() {
    return currentTimestampKysely(this.getEntityManager().getPlatform());
  }

  async findForUser(userId: number): Promise<AiConnectionRow | null> {
    const row = await this.db()
      .selectFrom('ai_connections')
      .select(COLUMNS)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findInstance(): Promise<AiConnectionRow | null> {
    const row = await this.db()
      .selectFrom('ai_connections')
      .select(COLUMNS)
      .where('scope', '=', 'instance')
      .where('user_id', 'is', null)
      .executeTakeFirst();
    return row ?? null;
  }

  async findById(id: number): Promise<AiConnectionRow | null> {
    const row = await this.db().selectFrom('ai_connections').select(COLUMNS).where('id', '=', id).executeTakeFirst();
    return row ?? null;
  }

  /**
   * Writes the connection of a user (`userId`) or of the instance (`null`):
   * the first one is inserted, a later one replaces it in place (one statement,
   * on the partial unique index that keeps it single) and is usable again.
   */
  async save(userId: number | null, data: AiConnectionWrite): Promise<void> {
    const columns = {
      kind: data.kind,
      model: data.model,
      base_url: data.baseUrl,
      secrets: data.secrets,
      hint: data.hint,
      account: data.account,
    };
    await this.db()
      .insertInto('ai_connections')
      .values({ scope: userId === null ? 'instance' : 'user', user_id: userId, ...columns })
      .onConflict((oc) => {
        const target =
          userId === null
            ? oc.column('scope').where('user_id', 'is', null)
            : oc.column('user_id').where('user_id', 'is not', null);
        return target.doUpdateSet({
          ...columns,
          secrets_version: (eb) => eb('ai_connections.secrets_version', '+', 1),
          status: 'ok',
          updated_at: () => this.now(),
        });
      })
      .execute();
  }

  /**
   * Writes refreshed secrets only if nobody wrote them since `expectedVersion`
   * was read; false when somebody did, and the caller reads the row again.
   */
  async replaceSecretsIfUnchanged(
    id: number,
    expectedVersion: number,
    secrets: string | null,
    account: string | null,
  ): Promise<boolean> {
    const result = await this.db()
      .updateTable('ai_connections')
      .set({
        secrets,
        secrets_version: expectedVersion + 1,
        account,
        status: 'ok',
        updated_at: this.now(),
      })
      .where('id', '=', id)
      .where('secrets_version', '=', expectedVersion)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /** Drops the secrets and leaves the connection in `status` (signed out, or waiting for a new sign-in). */
  async clearSecrets(id: number, status: string): Promise<void> {
    await this.db()
      .updateTable('ai_connections')
      .set((eb) => ({
        secrets: null,
        secrets_version: eb('secrets_version', '+', 1),
        status,
        updated_at: this.now(),
      }))
      .where('id', '=', id)
      .execute();
  }

  async setModel(id: number, model: string): Promise<void> {
    await this.nativeUpdate({ id }, { model });
  }

  async setStatus(id: number, status: string): Promise<void> {
    await this.nativeUpdate({ id }, { status });
  }

  async deleteById(id: number): Promise<number> {
    return this.nativeDelete({ id });
  }
}
