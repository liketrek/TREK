/**
 * trek-plugin publish — the whole release in one command: pack → tag + GitHub
 * release → preflight (the registry CI checks, locally) → open the registry PR.
 * If preflight fails it stops before submitting, so a broken entry never becomes
 * a doomed PR. This is the short path; the individual commands still exist for
 * when you want a step by hand.
 *
 * Requires `git` + `gh` (authenticated), same as `release`/`submit`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { packPluginDir } from './pack.js';
import { buildEntry } from './entry.js';
import { preflight } from './preflight.js';
import { submitEntry } from './submit.js';
import { plainLog, type LogSink } from './ui.js';

function git(dir: string, args: string[], quiet = true): string {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: quiet ? 'pipe' : 'inherit' }).toString().trim();
}
function tagExists(dir: string, tag: string): boolean {
  try { git(dir, ['rev-parse', `${tag}^{commit}`]); return true; } catch { return false; }
}

export async function publishPlugin(opts: {
  dir: string; repo: string; tag: string; now: string;
  signKeyPath?: string; registry?: string; draft?: boolean; notes?: string; skipPreflight?: boolean;
  /** Progress sink. Defaults to the plain console.error lines (CI parity). */
  log?: LogSink;
}): Promise<{ prUrl: string }> {
  const dir = path.resolve(opts.dir);
  const log = opts.log ?? plainLog;
  const step = (n: number, msg: string) => log(`[${n}/4] ${msg}`);

  // 1. Pack
  step(1, 'Packing the artifact…');
  const zip = path.join(dir, 'plugin.zip');
  const packed = packPluginDir(dir, zip);
  log(`      ✓ ${packed.files.length} files, ${packed.size} bytes`);

  // 2. Tag (if needed) + push + GitHub release with the artifact attached
  step(2, `Tagging ${opts.tag} + creating the GitHub release…`);
  if (!tagExists(dir, opts.tag)) git(dir, ['tag', opts.tag]);
  try { git(dir, ['push', 'origin', opts.tag]); } catch {
    throw new Error(`could not push tag ${opts.tag} — is "origin" your plugin's GitHub repo and are you authenticated? (git push origin ${opts.tag})`);
  }
  try {
    execFileSync('gh', ['release', 'create', opts.tag, packed.artifact, '--repo', opts.repo, '--title', opts.tag, '--notes', opts.notes || `Release ${opts.tag}`], { stdio: 'pipe' });
  } catch {
    // Release already exists — (re)upload the packed artifact so its bytes match the pin.
    execFileSync('gh', ['release', 'upload', opts.tag, packed.artifact, '--repo', opts.repo, '--clobber'], { stdio: 'pipe' });
  }
  log(`      ✓ release ${opts.tag} on ${opts.repo}`);

  // 3. Build the entry, then run the registry CI checks locally
  const entry = buildEntry({ dir, repo: opts.repo, tag: opts.tag, zipPath: packed.artifact, signKeyPath: opts.signKeyPath, now: opts.now });
  if (opts.skipPreflight) {
    log('[3/4] Preflight skipped (--no-preflight).');
  } else {
    step(3, 'Preflight — running the registry CI checks…');
    const rep = await preflight(entry);
    for (const f of rep.failures) log('      ✗ ' + f);
    if (!rep.ok) throw new Error(`preflight found ${rep.failures.length} problem(s) — fix these and re-run (nothing was submitted). Did you push your code to ${opts.repo} before publishing?`);
    log(`      ✓ all ${rep.passed.length} checks passed`);
  }

  // 4. Open the registry PR
  step(4, 'Opening the registry PR…');
  const { prUrl } = submitEntry(entry, { registry: opts.registry, draft: opts.draft });
  log('      ✓ done');
  fs.rmSync(zip, { force: true });
  return { prUrl };
}
