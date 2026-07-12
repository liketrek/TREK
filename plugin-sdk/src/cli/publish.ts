/**
 * trek-plugin publish — the whole release in one command: pack → tag + GitHub
 * release → preflight (the registry CI checks, locally) → open the registry PR.
 * If preflight fails it stops before submitting, so a broken entry never becomes
 * a doomed PR. This is the short path; the individual commands still exist for
 * when you want a step by hand.
 *
 * Requires `git` + `gh` (authenticated), same as `release`/`submit`.
 */
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
function releaseExists(repo: string, tag: string): boolean {
  try { execFileSync('gh', ['release', 'view', tag, '--repo', repo], { stdio: 'pipe' }); return true; } catch { return false; }
}

export async function publishPlugin(opts: {
  dir: string; repo: string; tag: string; now: string;
  signKeyPath?: string; registry?: string; draft?: boolean; notes?: string; skipPreflight?: boolean;
  /** Overwrite the artifact on an existing release. Only safe if it was never merged. */
  force?: boolean;
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
  // A released artifact is IMMUTABLE: the registry pins its sha256, so overwriting the
  // bytes of a release that is already in the registry breaks the checksum for everyone
  // who has that version — they can no longer install or update it. Refuse by default.
  // (The old code blanket-caught every `gh release create` failure — auth, network, a bad
  // repo — and turned it into a --clobber upload.)
  if (releaseExists(opts.repo, opts.tag)) {
    if (!opts.force) {
      throw new Error(
        `release ${opts.tag} already exists on ${opts.repo}.\n` +
        `Overwriting a released artifact breaks the sha256 pin for everyone who already installed it.\n` +
        `Cut a new version, or pass --force if this release was never merged into the registry.`,
      );
    }
    log(`      ! release ${opts.tag} exists — overwriting the artifact (--force)`);
    execFileSync('gh', ['release', 'upload', opts.tag, packed.artifact, '--repo', opts.repo, '--clobber'], { stdio: 'pipe' });
  } else {
    execFileSync('gh', ['release', 'create', opts.tag, packed.artifact, '--repo', opts.repo, '--title', opts.tag, '--notes', opts.notes || `Release ${opts.tag}`], { stdio: 'pipe' });
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
  // Keep the artifact. It is the exact bytes the release and the entry's sha256 pin were
  // computed from — a re-pack on another machine or SDK version can differ (CRLF, walk
  // order), so anyone re-running `entry`/`sign` afterwards must hash THIS file, not a rebuild.
  log(`      artifact kept at ${zip}`);
  return { prUrl };
}
