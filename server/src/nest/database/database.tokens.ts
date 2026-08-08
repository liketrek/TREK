/**
 * Injection token for the shared better-sqlite3 connection. Provided by
 * DatabaseModule from the existing singleton Proxy in src/db/database.ts,
 * so it stays valid across backup-restore/demo-reset connection swaps.
 */
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');
