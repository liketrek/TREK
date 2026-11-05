import { buildOrmConfig, resolveEngine } from './db/engine';

/**
 * The MikroORM config for the CLI and the Nest container alike: the engine
 * `TREK_DB_URL` names (the SQLite file by default) and what every engine shares
 * (`db/engine/index.ts`).
 *
 * Built at module level, not from `DATABASE_ENGINE`, because the MikroORM CLI
 * loads this file without Nest. Only the engine's options come from it, and
 * those are plain values with no state, so it and the container's engine agree
 * on the database. The state an engine keeps (Postgres's reopen hook) exists
 * only on the container's instance.
 */
export default buildOrmConfig(resolveEngine());
