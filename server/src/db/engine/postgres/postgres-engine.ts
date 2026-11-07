import type { DbEngineSettings } from '../../../app-config/db-settings';
import { NO_SAFETY_NET } from '../../legacy-baseline';
import { finishSchemaBootstrap, type AnyOrm } from '../../orm';
import type { DatabaseEngine } from '../engine';
import { redactUrl } from '../redact-url';
import { TrekPostgreSqlDriver } from './postgres-driver';
import { bootstrapPostgresSchema, defaultPostgresBootstrapDeps, type PostgresBootstrapDeps } from './schema-bootstrap';
import { sslOptionFor } from './ssl';
import type { EntityManager } from '@mikro-orm/core';

/** What `TREK_DB_URL` and `TREK_DB_POOL_MAX` resolve to, when they name a Postgres database. */
type PostgresSettings = Extract<DbEngineSettings, { engine: 'postgres' }>;

/** The advisory lock key every write transaction takes: "TREK" in ASCII. */
const TREK_WRITE_LOCK = 0x5452454b;

/**
 * The Postgres engine: MikroORM's own `pg` driver on `TREK_DB_URL`, with a
 * pool of at most `TREK_DB_POOL_MAX` connections that keeps none open while
 * idle. The pool belongs to the ORM, which the Nest container closes; the
 * schema comes from the baseline plus the migrations after it
 * (`schema-bootstrap.ts`).
 */
export class PostgresEngine implements DatabaseEngine {
  readonly id = 'postgres';

  constructor(
    private readonly settings: PostgresSettings,
    private readonly bootstrapDeps: (url: string) => PostgresBootstrapDeps = defaultPostgresBootstrapDeps,
  ) {}

  private onReopened: (() => Promise<void>) | null = null;

  /**
   * Nothing of its own to open: the ORM connects the pool. Keeps what a reopen
   * runs. A reopen replaces the database's contents, which the pool's own
   * connections keep reaching, so the ORM is not pointed at anything new and
   * the pool is never closed (ending a pool waits for every connection it has
   * lent out, and one lent to a job during the restore would never come back).
   */
  open(_orm: AnyOrm, onReopened: () => Promise<void>): void {
    this.onReopened = onReopened;
  }

  close(): void {
    // Nothing of its own to close: the pool goes with the ORM.
  }

  /**
   * After `pg_restore` replaced the database's contents: the restored
   * database is migrated forward on the same pool (`onReopened`, which
   * `DatabaseLifecycle` hands to `open`).
   */
  async reopen(): Promise<void> {
    if (!this.onReopened) throw new Error('The Postgres engine was reopened before it was opened.');
    await this.onReopened();
  }

  /**
   * `pg_advisory_xact_lock` on one key for the whole database: held until the
   * transaction commits or rolls back, taken again by a savepoint in the same
   * session without waiting, and shared by every process on the database.
   */
  async serializeWrites(em: EntityManager): Promise<void> {
    await em
      .getConnection()
      .execute('select pg_advisory_xact_lock(?)', [TREK_WRITE_LOCK], 'run', em.getTransactionContext());
  }

  /** `snapshot: false` (a restore, whose archive is the copy) migrates without a pg_dump first. */
  async schemaBootstrap(orm: AnyOrm, options: { snapshot: boolean }): Promise<void> {
    const deps = this.bootstrapDeps(this.settings.url);
    await bootstrapPostgresSchema(orm, options.snapshot ? deps : { ...deps, safetyNet: NO_SAFETY_NET });
    await finishSchemaBootstrap(orm);
  }

  describe(): string {
    return `Postgres ${redactUrl(this.settings.url)}`;
  }

  ormOptions() {
    const ssl = sslOptionFor(this.settings.url);
    return {
      driver: TrekPostgreSqlDriver,
      clientUrl: this.settings.url,
      pool: { min: 0, max: this.settings.poolMax },
      driverOptions: ssl === undefined ? {} : { ssl },
    };
  }
}
