import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolved from this file rather than cwd, so the directory that gets removed is
// always this package's own dist no matter where the script is invoked from.
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(packageRoot, 'dist');

// tsc only ever adds to dist, so a module deleted or renamed in src leaves its
// compiled twin behind. For most code that is merely stale, but the migrator
// globs dist/db/migrations at boot: an orphan there is a live migration with no
// source, and it runs. Same for dist/db/seeders. Nothing else writes into dist —
// the client bundle goes to server/public and the runtime assets the Dockerfile
// needs are copied in separately — so it is safe to drop wholesale.
rmSync(distDir, { recursive: true, force: true });

let tscExitedNonZero = false;
try {
  execSync('tsc -p tsconfig.build.json', { stdio: 'inherit', cwd: packageRoot });
} catch {
  tscExitedNonZero = true;
}

// `noEmitOnError` is off, so tsc exits non-zero on type errors and still writes
// dist — that case is deliberate, and gated by `npm run typecheck`. A tsc that
// never ran at all (not on PATH, crashed) is indistinguishable from here, and
// now that dist is emptied first it would leave nothing behind while still
// reporting success. Checking for the entry point tells the two apart.
if (!existsSync(join(distDir, 'index.js'))) {
  console.error('[build] tsc emitted nothing — dist is empty. Run via `npm run build` so tsc is on PATH.');
  process.exit(1);
}

if (tscExitedNonZero) {
  console.warn('[build] tsc reported type errors — emitting anyway (gated by `npm run typecheck`).');
}

console.log('[build] dist ready.');
