import { readEnv } from '../app-config';
import { resolveDataPaths } from '../app-config/data-paths';

import fs from 'fs';
import path from 'path';

/**
 * The SQLite file this process talks to.
 *
 * Shared by `database.ts` (which opens the connection) and `mikro-orm.config.ts`
 * (which needs the same target for the CLI and for the Nest-owned ORM). Kept in
 * one place because a config that names a different file than the connection is
 * the kind of mistake that only shows up as an empty database.
 *
 * Creates the containing directory as a side effect, exactly as the original
 * inline block in `database.ts` did.
 */
export function resolveDbPath(): string {
  // In test mode each vitest worker gets an isolated in-memory DB so that
  // parallel forks can't race on the same file or share migration state.
  if (readEnv().app.isTest) return ':memory:';

  // TREK_DB_FILE (the Playwright E2E harness runs against a throwaway file this
  // way) or data/travel.db, both resolved by the one data layout.
  const file = resolveDataPaths().dbFile;
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return file;
}
