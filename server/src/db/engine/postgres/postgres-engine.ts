import { finishSchemaBootstrap, type AnyOrm } from '../../orm';
import type { DatabaseEngine } from '../engine';
import { redactUrl } from '../redact-url';
import { TrekPostgreSqlDriver } from './postgres-driver';
import { bootstrapPostgresSchema, defaultPostgresBootstrapDeps, type PostgresBootstrapDeps } from './schema-bootstrap';

import { readFileSync } from 'node:fs';

/** What `TREK_DB_URL` and `TREK_DB_POOL_MAX` resolve to (`readEnv().db`). */
export interface PostgresSettings {
  url: string;
  poolMax: number;
}

/** The `ssl` option of a `pg` pool, as `sslOptionFor` builds it. */
export type PgSslOption = false | { rejectUnauthorized: true; ca?: string };

/** The sslmode values that verify the server, read the way the `pg` driver reads them. */
const VERIFYING_MODES = new Set(['require', 'verify-ca', 'verify-full']);

/**
 * The `ssl` option for the pool, from the URL's `sslmode` and `sslrootcert`.
 *
 * MikroORM builds the pool from the URL's host, port, user, password and
 * database alone and drops the rest of the query, so an `sslmode` in
 * `TREK_DB_URL` would be ignored without this. `require`, `verify-ca` and
 * `verify-full` all verify the server's certificate, as the `pg` driver itself
 * treats them; `disable` turns SSL off, and no `sslmode` leaves the driver's
 * default (no SSL). A mode that would connect without verifying (`prefer`,
 * `allow`, `no-verify`) or that is misspelt refuses, rather than quietly
 * connecting with less than was asked. `sslrootcert` names the CA file a host
 * that signs its own certificates needs (Supabase's, say).
 */
export function sslOptionFor(url: string): PgSslOption | undefined {
  const params = new URL(url).searchParams;
  const mode = params.get('sslmode');
  const rootCert = params.get('sslrootcert');
  if (mode === null) {
    if (rootCert !== null) throw new Error('TREK_DB_URL names an sslrootcert without sslmode=verify-full.');
    return undefined;
  }
  if (mode === 'disable') return false;
  if (!VERIFYING_MODES.has(mode)) {
    throw new Error(
      `TREK_DB_URL has sslmode "${mode}"; use disable, require, verify-ca or verify-full (all but disable verify the server).`,
    );
  }
  if (rootCert === null) return { rejectUnauthorized: true };
  try {
    return { rejectUnauthorized: true, ca: readFileSync(rootCert, 'utf8') };
  } catch (error) {
    throw new Error(`TREK_DB_URL names sslrootcert ${rootCert}, which cannot be read.`, { cause: error });
  }
}

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
    private readonly bootstrapDeps: () => PostgresBootstrapDeps = defaultPostgresBootstrapDeps,
  ) {}

  open(): void {
    // Nothing of its own to open: the ORM connects the pool.
  }

  close(): void {
    // Nothing of its own to close: the pool goes with the ORM.
  }

  reopen(): Promise<void> {
    return Promise.reject(new Error('Restoring a backup into a Postgres database is not available in this release.'));
  }

  async schemaBootstrap(orm: AnyOrm): Promise<void> {
    await bootstrapPostgresSchema(orm, this.bootstrapDeps());
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
