import { resolveDataPaths } from '../../app-config/data-paths';

import path from 'node:path';

/**
 * The storage domain's view of the data layout. Both roots come from
 * `resolveDataPaths()` (src/app-config/data-paths.ts), the one place the server
 * anchors `data/` and `uploads/`, so this file no longer counts `..` hops of
 * its own. In Docker both are symlinks (`/app/server/uploads -> /app/uploads`,
 * `/app/server/data -> /app/data`), which is why LocalDriver realpaths its root
 * at init. storage-keys.test.ts pins the resolved values.
 */
const LAYOUT = resolveDataPaths();
export const DEFAULT_UPLOADS_ROOT = LAYOUT.uploadsDir;
export const DATA_ROOT = LAYOUT.dataDir;
export const DEFAULT_BACKUPS_ROOT = LAYOUT.backupsDir;
/** Driver-agnostic global scratch space (`data/tmp`) — see StorageService.tempDir(). */
export const GLOBAL_TEMP_DIR = LAYOUT.tmpDir;
/** Seed-once boot provisioning file — imported only when no storage.* row exists. */
const DEFAULT_SEED_CONFIG_PATH = path.join(DATA_ROOT, 'storage-config.json');

/**
 * Test-only override for the seed-config path (Plan 3i, R5 defect 1 — the
 * `storage-config.json` test-harness race, 3c's deferred L13). Production
 * never calls the setter, so `getSeedConfigPath()` always resolves to the
 * real source-tree default there.
 *
 * Why a seam here rather than an env var read through `src/app-config`: this
 * repo's env-config layer (`src/app-config/env.schema.ts` + the
 * `no-restricted-syntax` ESLint ban on raw `process.env` outside its
 * documented exemption list) would need a new schema entry and an ESLint
 * exemption-list edit for a value that is NEVER read from a real environment
 * variable in production — it only exists to redirect one test suite away
 * from the real file. A DI/constructor parameter on `StorageRegistryService`
 * was the brief's other named option; it was rejected too, because
 * `storage-admin.service.ts#state()` also reads this path (for
 * `seedFilePresent`) and is a SIBLING service, not a consumer of
 * `StorageRegistryService` — giving the registry alone a constructor
 * override would still leave the admin service reading the real path,
 * reintroducing the same race for that one read. A plain module-level seam
 * in this file (the one place both services already import the path from)
 * covers both call sites with the smallest, most local change, and needs no
 * new provider/token wiring in `storage.module.ts`.
 */
let seedConfigPathOverride: string | null = null;

/** Test-only — see `seedConfigPathOverride`'s doc comment. Pass `null` to restore the production default. */
export function setSeedConfigPathForTests(overridePath: string | null): void {
  seedConfigPathOverride = overridePath;
}

/** The effective seed-config path: the test override when one is set, else the real source-tree default. */
export function getSeedConfigPath(): string {
  return seedConfigPathOverride ?? DEFAULT_SEED_CONFIG_PATH;
}
