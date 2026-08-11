/**
 * trek-plugin publish — the whole release in one command:
 *   check → pack → tag + GitHub release → preflight → open the registry PR.
 *
 * THE ORDER IS THE POINT. It used to be pack → release → preflight → submit, which meant the
 * checks that catch an unwritten README or a missing screenshot ran AFTER the GitHub release had
 * been cut. A release is immutable in every way that matters — the registry pins its sha256, so
 * overwriting the bytes breaks the checksum for everyone who already installed it — and so an
 * author who failed preflight was stuck: their v1.0.0 tag was burned, and the fix was to throw it
 * away and cut a v1.0.1 whose only change was the README.
 *
 * Now step 1 runs every gate that can be answered from the working tree, and NOTHING is packed,
 * tagged, pushed or released until they all pass. Preflight still runs (step 4) because the last
 * few gates genuinely need the tag and the release to exist — but by then it is checking things
 * that are true by construction, not discovering that the README was never written.
 *
 * Requires `git` + `gh` (authenticated), same as `release`/`submit`.
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { packPluginDir } from './pack.js';
import { buildEntry } from './entry.js';
import { preflight } from './preflight.js';
import { submitEntry } from './submit.js';
import { loadContext } from './checks/context.js';
import { runOffline } from './checks/index.js';
import { renderPlain } from './checks/report.js';
import { assertSigningAllowed, inspectSigning, type SigningState } from './signing.js';
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
  /** Skip the local gates. An escape hatch for a re-run, never a good idea on a first publish. */
  skipChecks?: boolean;
  /**
   * A signing state the CLI already looked up (it does, to know whether to offer signing). Passed
   * in so a single publish does not hit the registry twice for the same answer.
   */
  signing?: SigningState;
  /** Progress sink. Defaults to the plain console.error lines (CI parity). */
  log?: LogSink;
}): Promise<{ prUrl: string }> {
  const dir = path.resolve(opts.dir);
  const log = opts.log ?? plainLog;
  const step = (n: number, msg: string) => log(`[${n}/5] ${msg}`);

  // 1. The local gates — BEFORE anything is packed, tagged or released.
  if (opts.skipChecks) {
    log('[1/5] Local checks skipped (--no-checks).');
  } else {
    step(1, 'Checking the plugin against the registry gates…');
    const ctx = loadContext(dir);
    const report = runOffline(ctx);
    if (!report.ok) {
      const detail = renderPlain({ ...report, warnings: [] });
      throw new Error(
        `${report.errors.length} check${report.errors.length === 1 ? '' : 's'} would be rejected by the registry.\n\n` +
        detail +
        '\n\nNothing was packed, tagged or released. Fix these and re-run — or `trek-plugin status` for the full picture.',
      );
    }

    // Signing is not just a preference once a plugin has shipped signed: TREK refuses an unsigned
    // update to it, so this publish is doomed. preflight would catch it — at step 4, AFTER the
    // immutable release is cut, which is precisely the trap this command's reorder exists to close.
    // So it belongs here, before anything exists to be wasted.
    const id = typeof ctx.manifest?.id === 'string' ? ctx.manifest.id : '';
    if (id) {
      assertSigningAllowed(opts.signing ?? (await inspectSigning(id, { registry: opts.registry })), opts.signKeyPath);
    }

    log(`      ✓ ${report.outcomes.filter((o) => o.status === 'pass').length} checks passed`);
  }

  // 2. Pack
  step(2, 'Packing the artifact…');
  const zip = path.join(dir, 'plugin.zip');
  const packed = packPluginDir(dir, zip);
  log(`      ✓ ${packed.files.length} files, ${packed.size} bytes`);

  // 3. Tag (if needed) + push + GitHub release with the artifact attached
  step(3, `Tagging ${opts.tag} + creating the GitHub release…`);
  if (!tagExists(dir, opts.tag)) git(dir, ['tag', opts.tag]);
  try { git(dir, ['push', 'origin', opts.tag]); } catch {
    throw new Error(`could not push tag ${opts.tag} — is "origin" your plugin's GitHub repo and are you authenticated? (git push origin ${opts.tag})`);
  }
  // A released artifact is IMMUTABLE: the registry pins its sha256, so overwriting the bytes of a
  // release that is already in the registry breaks the checksum for everyone who has that version
  // — they can no longer install or update it. Refuse by default.
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

  // 4. Build the entry, then run the gates that need the tag and the release to exist
  const entry = buildEntry({ dir, repo: opts.repo, tag: opts.tag, zipPath: packed.artifact, signKeyPath: opts.signKeyPath, now: opts.now });
  if (opts.skipPreflight) {
    log('[4/5] Preflight skipped (--no-preflight).');
  } else {
    step(4, 'Preflight — the gates that need the release to exist…');
    const rep = await preflight(entry, { dir, registry: opts.registry });
    for (const f of rep.failures) log('      ✗ ' + f);
    if (!rep.ok) {
      throw new Error(
        `preflight found ${rep.failures.length} problem(s) — nothing was submitted.\n` +
        `The release is cut, so fix these, commit, and re-run against a NEW tag (or --force if this one was never merged).\n` +
        `Did you push your code to ${opts.repo} before publishing?`,
      );
    }
    log(`      ✓ all ${rep.passed.length} checks passed`);
  }

  // 5. Open the registry PR
  step(5, 'Opening the registry PR…');
  const { prUrl } = submitEntry(entry, { registry: opts.registry, draft: opts.draft });
  log('      ✓ done');
  // Keep the artifact. It is the exact bytes the release and the entry's sha256 pin were computed
  // from — a re-pack on another machine or SDK version can differ (CRLF, walk order), so anyone
  // re-running `entry`/`sign` afterwards must hash THIS file, not a rebuild.
  log(`      artifact kept at ${zip}`);
  return { prUrl };
}
