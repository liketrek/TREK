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
   * The three tables come with the migrations on both engines, so a failure
   * here is a real one and propagates, rolling the erasure back. (A table
   * missing from a slimmed-down test schema used to be skipped in a savepoint
   * of its own; there is no such schema any more, and the savepoint was a
   * transaction outside `UnitOfWork`.) `getTransactionContext()` hands the
   * statement the open transaction's connection, which a bare `execute()`
   * would wait on forever.
   */
  async deletePluginUserData(userId: number): Promise<void> {
    this.validateRequestContext();
    for (const table of ['plugin_user_config', 'plugin_oauth_tokens', 'plugin_oauth_state']) {
      await this.em
        .getConnection()
        .execute(`DELETE FROM ${table} WHERE user_id = ?`, [userId], 'run', this.em.getTransactionContext());
    }
  }

  /**
   * Before a user is deleted: the trip tags they created pass to each trip's
   * owner, so a tag the whole trip uses keeps its place_tags. The user's
   * personal tags are left to the delete.
   */
  async handTripTagsToTripOwners(userId: number): Promise<void> {
    this.validateRequestContext();
    await this.em
      .getConnection()
      .execute(
        'UPDATE tags SET user_id = (SELECT trips.user_id FROM trips WHERE trips.id = tags.trip_id) WHERE user_id = ? AND trip_id IS NOT NULL',
        [userId],
        'run',
        this.em.getTransactionContext(),
      );
  }
}
