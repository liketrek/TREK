import { readEnv, type AppEnv } from './env';

import path from 'node:path';

/**
 * `<server>/`, the directory holding package.json. `src/app-config` and
 * `dist/app-config` both sit two levels below it, so the anchor is the same
 * under vitest, `npm run dev` and the built image.
 */
export const SERVER_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Where TREK keeps what it writes. In the image `data/` and `uploads/` are
 * symlinks into `/app`, which is why every consumer used to anchor on its own
 * `__dirname` and why none of them may use `process.cwd()` instead.
 */
export interface DataPaths {
  /** `<server>/data`: the database, the key files, backups, logs and plugin trees. */
  readonly dataDir: string;
  /** `<server>/uploads`: the local upload categories (files, covers, photos, ...). */
  readonly uploadsDir: string;
  /** `data/backups`: archives written by the manual and the automatic backup. */
  readonly backupsDir: string;
  /** `data/tmp`: driver-agnostic scratch space (restore spool, mirror staging). */
  readonly tmpDir: string;
  /** `data/logs`: the rotating `trek.log`. */
  readonly logsDir: string;
  /** `data/.jwt_secret`: written on first start and by the admin's JWT rotation. */
  readonly jwtSecretFile: string;
  /** `data/.encryption_key`: the at-rest key when ENCRYPTION_KEY does not provide it. */
  readonly encryptionKeyFile: string;
  /**
   * The SQLite file a non-test process opens: TREK_DB_FILE when set, else
   * `data/travel.db`. Under NODE_ENV=test the connection is `:memory:` instead
   * (db/db-path.ts), which is a property of the connection, not of the layout.
   */
  readonly dbFile: string;
}

/**
 * The data layout, derived from the server root and the live environment.
 *
 * The only variable involved is TREK_DB_FILE, read through `readEnv()` like
 * every other live value, so a test that points it somewhere else is seen on
 * the next call. Nothing here touches the disk: creating a directory is the
 * caller's decision.
 */
export function resolveDataPaths(
  env: { db: Pick<AppEnv['db'], 'trekDbFile'> } = readEnv(),
  root: string = SERVER_ROOT,
): DataPaths {
  const dataDir = path.join(root, 'data');
  return {
    dataDir,
    uploadsDir: path.join(root, 'uploads'),
    backupsDir: path.join(dataDir, 'backups'),
    tmpDir: path.join(dataDir, 'tmp'),
    logsDir: path.join(dataDir, 'logs'),
    jwtSecretFile: path.join(dataDir, '.jwt_secret'),
    encryptionKeyFile: path.join(dataDir, '.encryption_key'),
    dbFile: env.db.trekDbFile || path.join(dataDir, 'travel.db'),
  };
}
