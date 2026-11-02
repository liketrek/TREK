import { buildOrmConfig, resolveEngine } from '../../src/db/engine';
import { MikroORM } from '@mikro-orm/core';

/**
 * Brings the template database TREK_DB_URL names to the current schema, the
 * way a first boot on an empty Postgres database does: the engine's own
 * bootstrap (baseline, the migrations after its cut, seeders), with no
 * pre-migrate copy, since the database is new.
 */
async function main(): Promise<void> {
  const engine = resolveEngine();
  if (engine.id !== 'postgres') throw new Error('build-template.ts runs on the Postgres engine only (TREK_DB_URL).');
  const config = buildOrmConfig(engine);
  const orm = await MikroORM.init({
    ...config,
    // As src/db/standalone-orm.ts: the bootstrap runs SQL and seeders, which
    // need no entity metadata.
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { ...config.migrations, silent: true },
  });
  try {
    await engine.schemaBootstrap(orm, { snapshot: false });
    process.stdout.write(`[test-db] Postgres template ready: ${engine.describe()}\n`);
  } finally {
    await orm.close(true);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(
    `[test-db] failed to build the Postgres template: ${err instanceof Error ? err.stack : String(err)}\n`,
  );
  process.exit(1);
});
