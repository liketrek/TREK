/** The databases TREK can run on. MySQL and MariaDB are out of scope (server/CLAUDE.md). */
export type EngineId = 'sqlite' | 'postgres';

/**
 * Which database this process runs on, as `deriveDb` reads it from
 * `TREK_DB_URL`. The Postgres arm carries what its pool needs, so nothing
 * downstream has to check the URL again.
 */
export type DbEngineSettings = { engine: 'sqlite' } | { engine: 'postgres'; url: string; poolMax: number };

/** The most connections the Postgres pool opens (`TREK_DB_POOL_MAX` is refused above it). */
export const DB_POOL_MAX_CEILING = 100;
/** The pool size when `TREK_DB_POOL_MAX` is unset. */
export const DB_POOL_MAX_DEFAULT = 10;
