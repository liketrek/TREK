import fs from 'node:fs';
import path from 'node:path';
import { pluginsCodeRoot, pluginsDataRoot } from './paths';

/**
 * Backup/restore of the plugin trees (#plugins). A TREK backup archives travel.db +
 * uploads + the encryption key, but a plugin's per-plugin SQLite file (its ONLY copy
 * of the user data it holds) and its installed code live in separate trees — without
 * these, a restored instance has the `plugins` rows but none of their data or code.
 *
 * The tricky half is restore: the HOST holds each plugin DB open (better-sqlite3), so
 * overwriting those files live is unsafe (and on Windows, locked). Instead restore
 * STAGES the extracted trees next to the live ones, and this module swaps them in at
 * the next boot BEFORE the runtime opens anything — the same "applies on restart" model
 * the bundled encryption key already uses. No plugin quiesce, no swap under open
 * handles, no new admin setup.
 */

const STAGE_SUFFIX = '.restore';

function dataStaging(): string { return pluginsDataRoot() + STAGE_SUFFIX; }
function codeStaging(): string { return pluginsCodeRoot() + STAGE_SUFFIX; }

/**
 * Copy the plugin trees an archive extracted (under `extractDir/plugins-data` and
 * `.../plugins-code`) into staging dirs beside the live trees. cpSync (not rename) so
 * it works even when the plugin volumes sit on a different filesystem than the extract
 * dir. A no-op for a backup that carries no plugin trees (older archives). Returns true
 * if anything was staged (so restore can tell the admin a restart is needed to finish).
 */
export function stageExtractedPluginTrees(extractDir: string): boolean {
  let staged = false;
  const pairs: Array<[string, string]> = [
    [path.join(extractDir, 'plugins-data'), dataStaging()],
    [path.join(extractDir, 'plugins-code'), codeStaging()],
  ];
  for (const [from, to] of pairs) {
    if (!fs.existsSync(from)) continue;
    fs.rmSync(to, { recursive: true, force: true }); // drop a stale staging from an aborted prior restore
    fs.cpSync(from, to, { recursive: true });
    staged = true;
  }
  return staged;
}

/**
 * Replace the CONTENTS of `live` with `staged`, entry by entry — never renaming the
 * root itself, because a root that is a bind/volume mount point can't be renamed
 * (EBUSY) or moved across a filesystem (EXDEV). Existing DEV-LINK entries in `live`
 * (a plugin dir symlinked/junctioned to an author's source, which the backup deliberately
 * excluded) are preserved, so a same-instance backup→restore round trip doesn't destroy
 * them. Same-fs renames where possible, copy+remove for the cross-fs case.
 */
function swapContents(live: string, staged: string): void {
  fs.mkdirSync(live, { recursive: true });
  const realLive = fs.realpathSync(live);
  // Clear the current entries, but KEEP dev-links (realpath points outside the root).
  for (const name of fs.readdirSync(live)) {
    const p = path.join(live, name);
    let real: string;
    try { real = fs.realpathSync(p); } catch { real = p; }
    if (real !== p && !real.startsWith(realLive + path.sep)) continue; // dev-link → keep
    fs.rmSync(p, { recursive: true, force: true });
  }
  // Move the staged entries in.
  for (const name of fs.readdirSync(staged)) {
    const from = path.join(staged, name);
    const to = path.join(live, name);
    fs.rmSync(to, { recursive: true, force: true });
    try {
      fs.renameSync(from, to);
    } catch {
      fs.cpSync(from, to, { recursive: true });
      fs.rmSync(from, { recursive: true, force: true });
    }
  }
  fs.rmSync(staged, { recursive: true, force: true });
}

/**
 * If a prior restore staged plugin trees, swap them into place. Applied ONCE — either
 * immediately by the restore (via the applier below, after it quiesces the plugins so
 * their DB handles are closed) or, if the runtime wasn't up, at the next boot BEFORE the
 * runtime opens any plugin DB. Content-level swap (see swapContents) so a volume-mounted
 * root is safe and dev-links survive. Never throws — a reconcile hiccup must not stop the
 * server booting. Returns the labels of trees it applied, for logging.
 */
export function applyStagedPluginTrees(): string[] {
  const applied: string[] = [];
  const pairs: Array<[string, string, string]> = [
    ['plugins-data', pluginsDataRoot(), dataStaging()],
    ['plugins-code', pluginsCodeRoot(), codeStaging()],
  ];
  for (const [label, live, staged] of pairs) {
    if (!fs.existsSync(staged)) continue;
    try {
      swapContents(live, staged);
      applied.push(label);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[plugins] failed to apply staged ${label} restore:`, err);
    }
  }
  return applied;
}

// A restore can't swap the plugin trees while the runtime holds their DB handles open,
// and it must NOT leave the swap for an arbitrary future boot (by then the live data has
// diverged, so applying stale staged data would silently revert it and resurrect erased
// rows). So the runtime registers an applier here that QUIESCES the plugins (closing the
// handles) and applies the swap right away; the restore calls it the moment it finishes
// staging. If the runtime isn't up, staging simply waits for the boot reconcile — with no
// running plugins, there is nothing to diverge.
let applier: (() => void | Promise<void>) | null = null;
export function setStagedRestoreApplier(fn: (() => void | Promise<void>) | null): void {
  applier = fn;
}
export async function applyStagedRestoreNow(): Promise<boolean> {
  if (!applier) return false;
  try {
    await applier();
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[plugins] immediate staged-restore apply failed; will retry on next boot:', err);
    return false;
  }
}
