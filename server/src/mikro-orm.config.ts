import { buildOrmConfig, resolveEngine } from './db/engine';

/**
 * The one MikroORM config, for the CLI and the Nest container alike: the
 * engine `TREK_DB_URL` names (the SQLite file by default) and what every
 * engine shares (`db/engine/index.ts`).
 */
export default buildOrmConfig(resolveEngine());
