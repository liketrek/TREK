import { isMissingTableError } from '../migration-utils';
import type { EntityManager } from '@mikro-orm/core';

/**
 * Raw-connection statements that run on every engine and that no entity can
 * express: the readiness ping and the plugin-table erasure. Not a
 * `TrekRepository<Entity>`, since it backs no entity. The SQLite file's own
 * maintenance (`PRAGMA wal_checkpoint`, `VACUUM INTO`) lives in
 * `SqliteMaintenance`, under `db/engine/sqlite/`.
 *
 * Provided through Nest DI by `MaintenanceModule` (`nest/database/`), a
 * factory over the context-resolving global `EntityManager`; its consumers
 * inject it: the readiness probe and `UserCleanupService`. The class stays
 * free of Nest decorators like every other file under `db/`, so a test can
 * still build one over its own `EntityManager`.
 */
export class MaintenanceRepository {
  constructor(private readonly em: EntityManager) {}

  /**
   * MikroORM's own validating `getContext()` — throws
   * `ValidationError.cannotUseGlobalContext()` outside a request context (the
   * production default), the same fail-closed ratchet `TrekRepository`
   * applies to every entity-bound repository. Called first by every method
   * below, since raw `connection.execute()` has no such guard of its own.
   */
  private validateRequestContext(): void {
    this.em.getContext();
  }

  /** `SELECT 1`: whether the database answers at all, for the readiness probe. */
  async ping(): Promise<void> {
    this.validateRequestContext();
    await this.em.getConnection().execute('SELECT 1');
  }

  /**
   * The per-user erasure of the three plugin-held tables (`plugin_user_config`,
   * `plugin_oauth_tokens`, `plugin_oauth_state`), called inside the erasure's
   * own `UnitOfWork.transactional(...)`.
   *
   * A table that does not exist (a slimmed-down test schema) is skipped; any
   * other failure propagates. Each statement runs in its own savepoint, since
   * on Postgres a failed statement aborts the whole transaction it is in.
   * `em.getTransactionContext()` hands the statement the open transaction's
   * connection, which a bare `execute()` would wait on forever.
   */
  async deletePluginUserData(userId: number): Promise<void> {
    this.validateRequestContext();
    for (const table of ['plugin_user_config', 'plugin_oauth_tokens', 'plugin_oauth_state']) {
      try {
        await this.em.transactional((em) =>
          em
            .getConnection()
            .execute(`DELETE FROM ${table} WHERE user_id = ?`, [userId], 'run', em.getTransactionContext()),
        );
      } catch (err: unknown) {
        if (!isMissingTableError(err)) throw err;
      }
    }
  }
}
