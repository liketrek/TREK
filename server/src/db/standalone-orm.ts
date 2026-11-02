import mikroOrmConfig from '../mikro-orm.config';
import type { AnyOrm } from './orm';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';

/**
 * An ORM instance outside Nest, for the vitest global setup that builds the
 * schema snapshot. Production uses the container-owned one from
 * `MikroOrmModule.forRoot()` instead of creating a second.
 */
export function createStandaloneOrm(): Promise<AnyOrm> {
  return SqliteMikroORM.init({
    ...mikroOrmConfig,
    // Entity discovery is skipped deliberately. Migrations and seeders are raw
    // SQL and need no metadata, and the global setup that calls this runs as ESM
    // in vitest's main process, where discovering `*.entity.ts` fails on Node's
    // extensionless import resolution.
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    // The migrator's per-migration progress log is production boot output; the
    // global setup already reports the snapshot in one line of its own, and a
    // failing migration still throws.
    migrations: { ...mikroOrmConfig.migrations, silent: true },
  });
}
