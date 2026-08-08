import type Database from 'better-sqlite3';
import { readEnv } from '../app-config';
import { synchronousName } from '../app-config/parsers';

export interface ActiveDurability {
  journalMode: string;
  synchronous: string;
}

/**
 * Applies the configured journal_mode / synchronous pragmas to a freshly opened
 * connection and reports back what SQLite actually settled on.
 *
 * journal_mode is stored in the database file header, so it is not a per-process
 * setting: whichever process opened the file last decides the mode for all of
 * them. reset-admin.js and scripts/migrate-encryption.ts open the same file and
 * therefore read the same two variables — they cannot import this module (they
 * are standalone scripts and src/ is not in the image), so keep the three in
 * sync when the defaults change.
 *
 * The returned values are read back from the engine rather than echoed from the
 * config, so a mode SQLite refused shows up as what it really is — an in-memory
 * database stays MEMORY however hard you ask for WAL.
 */
export function applyDurabilityPragmas(db: Database.Database): ActiveDurability {
  const { journalMode, synchronous, durabilityWarnings } = readEnv().db;
  durabilityWarnings.forEach(warning => console.warn(`[DB] ${warning}`));

  db.exec(`PRAGMA journal_mode = ${journalMode}`);
  db.exec(`PRAGMA synchronous = ${synchronous}`);

  return {
    journalMode: String(db.pragma('journal_mode', { simple: true })).toUpperCase(),
    synchronous: synchronousName(db.pragma('synchronous', { simple: true })),
  };
}
