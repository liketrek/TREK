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
 *
 * Staging is made atomic with a `.tmp` sibling: the (interruptible) copy lands in
 * `<root>.restore.tmp`, and only a fully-copied tree is renamed to `<root>.restore`.
 * The rename is same-directory (same filesystem), so it's atomic. Without this a copy
 * that dies partway — disk full, OOM, a crash — would leave a PARTIAL `.restore`, and
 * the next boot's swap deletes every live plugin dir not present in it: data loss, even
 * though the restore reported success. A leftover `.tmp` is inert (the apply path only
 * looks for `.restore`) and is cleared on the next staging.
 */
export function stageExtractedPluginTrees(extractDir: string): boolean {
  let staged = false;
  const pairs: Array<[string, string]> = [
    [path.join(extractDir, 'plugins-data'), dataStaging()],
    [path.join(extractDir, 'plugins-code'), codeStaging()],
  ];
  for (const [from, to] of pairs) {
    if (!fs.existsSync(from)) continue;
    const tmp = to + '.tmp';
    fs.rmSync(to, { recursive: true, force: true });  // drop a stale completed staging
    fs.rmSync(tmp, { recursive: true, force: true }); // drop a stale partial staging
    fs.cpSync(from, tmp, { recursive: true });        // may die partway → only .tmp is left, never .restore
    fs.renameSync(tmp, to);                            // atomic: publishes a COMPLETE staging
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
  const stagedNames = new Set(fs.readdirSync(staged));
  // COPY (not move) each staged entry over the live one, leaving `staged` intact until the
  // very end. This is the key to crash-safety: `staged` stays the complete source of truth
  // for the whole operation, so if the process dies mid-swap (power loss, OOM, an exit-hook
  // throw) the next boot re-runs swapContents and re-copies everything correctly — nothing
  // is ever left half-deleted. (A move/rename would empty `staged` as it went, so a retry
  // could no longer restore an already-moved entry it had just deleted from `live`.)
  for (const name of stagedNames) {
    const to = path.join(live, name);
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(path.join(staged, name), to, { recursive: true });
  }
  // Remove live entries NOT in the backup (plugins uninstalled since it was taken), keeping
  // dev-links (realpath points outside the root). Safe now that every backup entry is in place.
  for (const name of fs.readdirSync(live)) {
    if (stagedNames.has(name)) continue;
    const p = path.join(live, name);
    let real: string;
    try { real = fs.realpathSync(p); } catch { real = p; }
    if (real !== p && !real.startsWith(realLive + path.sep)) continue; // dev-link → keep
    fs.rmSync(p, { recursive: true, force: true });
  }
  // Only NOW drop staging — the single point of no return, after `live` is fully correct.
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
    console.error('[plugins] immediate staged-restore apply failed; will retry on next boot:', err);
    return false;
  }
}
