/**
 * "Your SDK is out of date" — the advisory update notice (#plugins).
 *
 * A stale SDK is not cosmetic: the registry-entry format, the manifest validator and
 * the permission catalog all move with the host, so an author on an old SDK can `pack`
 * and `submit` an entry that today's registry CI rejects.
 *
 * This is a thin wrapper over `update-notifier` (the de-facto standard for npm CLIs):
 * a detached background process checks the registry at most once a day, the notice is
 * printed from cache on stderr, and CI / non-TTY / `NO_UPDATE_NOTIFIER` all silence it.
 * We hand it off rather than hand-roll the same detached-child + cache dance ourselves.
 */
import updateNotifier from 'update-notifier';
import { createRequire } from 'node:module';

export function notifySdkUpdate(): void {
  try {
    // `../../package.json` resolves to the package root from dist/cli/ (prod) and
    // src/cli/ (tests) alike. createRequire keeps it working on every Node >=18,
    // unlike `import ... with { type: 'json' }`, which Node 18 does not accept.
    const pkg = createRequire(import.meta.url)('../../package.json') as { name: string; version: string };
    updateNotifier({ pkg }).notify();
  } catch {
    // An update notice is never worth disturbing a command over.
  }
}
