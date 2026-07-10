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
 * If a prior restore staged plugin trees, swap them into place. Called at boot BEFORE
 * the runtime opens any plugin DB. Same-filesystem renames (staging sits beside the
 * live tree), so each swap is atomic-ish; the pre-restore tree is moved aside first and
 * only removed once the staged tree is in place. Never throws — a reconcile hiccup must
 * not stop the server booting. Returns the ids of trees it applied, for logging.
 */
export function applyStagedPluginTrees(): string[] {
  const applied: string[] = [];
  const pairs: Array<[string, string, string]> = [
    ['plugins-data', pluginsDataRoot(), dataStaging()],
    ['plugins-code', pluginsCodeRoot(), codeStaging()],
  ];
  for (const [label, live, staged] of pairs) {
    if (!fs.existsSync(staged)) continue;
    const aside = live + '.pre-restore';
    try {
      fs.rmSync(aside, { recursive: true, force: true }); // clear any leftover from a previous run
      if (fs.existsSync(live)) fs.renameSync(live, aside); // move the current tree aside (atomic)
      fs.mkdirSync(path.dirname(live), { recursive: true });
      fs.renameSync(staged, live);                         // move the staged tree in (atomic)
      fs.rmSync(aside, { recursive: true, force: true });  // drop the old tree
      applied.push(label);
    } catch (err) {
      // Best-effort recovery: if we moved `live` aside but failed to place `staged`,
      // put the original back so the instance keeps its pre-restore data.
      try { if (!fs.existsSync(live) && fs.existsSync(aside)) fs.renameSync(aside, live); } catch { /* leave for manual recovery */ }
      // eslint-disable-next-line no-console
      console.error(`[plugins] failed to apply staged ${label} restore:`, err);
    }
  }
  return applied;
}
