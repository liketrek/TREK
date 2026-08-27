/**
 * trek-plugin submit — open the TREK-Plugins registry PR for you. Forks the
 * registry (once), branches off the current upstream main, writes (or merges
 * into) registry/plugins/<id>.json, commits, pushes, and opens the PR — so the
 * last manual step of publishing (fork, paste JSON, open PR by hand) is gone.
 *
 * Requires `gh` (authenticated) and `git`, same as `release`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readJsonFile } from './json.js';
import { needsRetroSign, retroSignVersions } from './retro-sign.js';

const DEFAULT_REGISTRY = 'liketrek/TREK-Plugins';

interface EntryLike {
  id: string; name?: string; authorPublicKey?: string;
  versions: { version: string; downloadUrl: string; sha256: string; signature?: string }[];
}

function git(cwd: string, ...a: string[]): string {
  return execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8' }).trim();
}
function gh(...a: string[]): string {
  return execFileSync('gh', a, { encoding: 'utf8' }).trim();
}

/** Merge a freshly-built single-version entry onto an existing registry file (update case). */
function mergeOnto(existing: EntryLike, fresh: EntryLike, allowKeyChange = false): { merged: EntryLike; rotated: boolean } {
  const v = fresh.versions[0];
  const keyChanged = !!existing.authorPublicKey && !!fresh.authorPublicKey && existing.authorPublicKey !== fresh.authorPublicKey;
  if (keyChanged && !allowKeyChange) {
    throw new Error(
      'the signing key differs from the one already published for this plugin — TREK would reject the update. Use the original key.\n' +
      'If you MEAN to rotate the key, re-run with --allow-key-change (the PR then needs a maintainer\'s allow-key-change label, and every admin must re-trust the plugin).',
    );
  }
  if (existing.authorPublicKey && !fresh.authorPublicKey) {
    throw new Error('this plugin was published signed — sign the update too (pass --sign) or TREK will refuse it.');
  }
  let older = existing.versions.filter((x) => x.version !== v.version);
  if (keyChanged) {
    // Deliberate rotation: the older versions' signatures were made with the OLD key and no
    // longer verify against the entry's new authorPublicKey. Strip them so the retro-sign pass
    // below re-signs each pinned artifact with the new key — a rotated entry must have EVERY
    // version signed with the key it declares.
    older = older.map(({ signature: _dropped, ...x }) => x);
  }
  const versions = [v, ...older];
  const merged: EntryLike = { ...existing, ...fresh, versions };
  merged.authorPublicKey = fresh.authorPublicKey ?? existing.authorPublicKey;
  if (merged.authorPublicKey === undefined) delete merged.authorPublicKey;
  return { merged, rotated: keyChanged };
}

/** The PR paragraph a key rotation always carries — maintainers gate on it, admins live with it. */
const ROTATION_BODY =
  '**This update rotates the author signing key** (`authorPublicKey` changes, and every version is re-signed with the new key).\n' +
  'Merging needs a maintainer to apply the **allow-key-change** label — CI refuses the key change without it.\n' +
  'After merge, every instance that already has this plugin will show `SIGNATURE_KEY_CHANGED` until its admin re-trusts the new key.';

export async function submitEntry(entry: EntryLike, opts: {
  registry?: string; branch?: string; draft?: boolean; keep?: boolean; signKeyPath?: string;
  /** Accept a deliberately CHANGED signing key on the update path (see mergeOnto). */
  allowKeyChange?: boolean;
  /**
   * `rotate-key`: the entry IS the registry's current entry with its key rotated — no new
   * version. Write it wholesale instead of merging, and open a rotation PR.
   */
  rotateOnly?: boolean;
} = {}): Promise<{ prUrl: string }> {
  const registry = opts.registry || DEFAULT_REGISTRY;
  const name = registry.split('/')[1];
  const login = gh('api', 'user', '--jq', '.login');
  const branch = opts.branch || (opts.rotateOnly ? `plugin-${entry.id}-rotate-key` : `plugin-${entry.id}-${entry.versions[0].version}`);

  // Ensure the fork exists (idempotent — prints "already exists" if it does).
  try { gh('repo', 'fork', registry, '--clone=false'); } catch { /* already forked */ }

  // Fast-forward the fork from the registry. The PR branch is based on upstream/main either
  // way, but a fork left far behind has broken pushes and PRs in the wild — and costs nothing
  // to keep current. Best-effort: a diverged fork can't be fast-forwarded, and that alone
  // must not sink the submit.
  try { gh('repo', 'sync', `${login}/${name}`, '--source', registry); } catch {
    console.error(
      `! could not fast-forward your fork ${login}/${name} (diverged?) — continuing, the PR branch is based on the registry's main.\n` +
      `  If the push or PR fails, reset the fork with: gh repo sync ${login}/${name} --force`,
    );
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-submit-'));
  try {
    // Clone the fork (pushable via gh auth), then base a branch on the CURRENT upstream main.
    let cloned = false;
    for (let i = 0; i < 3 && !cloned; i++) {
      try { gh('repo', 'clone', `${login}/${name}`, tmp, '--', '--depth=1'); cloned = true; }
      catch { /* fork may not be ready yet; retry */ }
    }
    if (!cloned) throw new Error(`could not clone your fork ${login}/${name} (is the fork ready on GitHub?)`);

    // `gh repo clone` of a fork may already have wired an `upstream` remote, in which case a
    // bare `remote add` exits non-zero and takes the whole submit down. Set it either way.
    try { git(tmp, 'remote', 'add', 'upstream', `https://github.com/${registry}.git`); }
    catch { git(tmp, 'remote', 'set-url', 'upstream', `https://github.com/${registry}.git`); }
    git(tmp, 'fetch', '--depth=1', 'upstream', 'main');
    git(tmp, 'checkout', '-B', branch, 'upstream/main');

    const rel = path.join('registry', 'plugins', `${entry.id}.json`);
    const abs = path.join(tmp, rel);
    let toWrite = entry;
    let action = 'add';
    let rotated = !!opts.rotateOnly;
    if (opts.rotateOnly) {
      if (!fs.existsSync(abs)) throw new Error(`no registry entry to rotate — ${rel} does not exist in ${registry}.`);
      action = 'update';
    } else if (fs.existsSync(abs)) {
      const m = mergeOnto(readJsonFile<EntryLike>(abs), entry, opts.allowKeyChange);
      toWrite = m.merged;
      rotated = m.rotated;
      action = 'update';
    }
    // First signed update onto an unsigned history: the registry refuses a mixed entry (key
    // present, older versions unsigned) — see retro-sign.ts for why. Sign the older versions
    // with the same key, or say exactly what is missing.
    if (needsRetroSign(toWrite)) {
      if (!opts.signKeyPath) {
        throw new Error(
          `this update adds your signing key, but ${toWrite.versions.filter((v) => !v.signature).length} older version(s) are unsigned — ` +
          'the registry requires every version signed once a key is present. Re-run with --sign so they can be signed for you.',
        );
      }
      console.error('      older versions are unsigned — signing them with your key so the registry accepts the update');
      await retroSignVersions(toWrite, opts.signKeyPath, (line) => console.error(line));
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(toWrite, null, 2) + '\n');

    const title = opts.rotateOnly
      ? `Rotate signing key for ${entry.name || entry.id}`
      : action === 'add'
        ? `Add ${entry.name || entry.id} (${entry.versions[0].version})`
        : `Update ${entry.name || entry.id} to ${entry.versions[0].version}${rotated ? ' (key rotation)' : ''}`;
    git(tmp, 'add', rel);
    git(tmp, 'commit', '-m', title);
    git(tmp, 'push', '--force-with-lease', 'origin', branch);

    const body = [
      opts.rotateOnly
        ? `Key rotation for **${entry.name || entry.id}** \`${entry.id}\` — no new version.`
        : `${action === 'add' ? 'New plugin' : 'Plugin update'}: **${entry.name || entry.id}** \`${entry.id}\` ${entry.versions[0].version}.`,
      ...(rotated ? ['', ROTATION_BODY] : []),
      '',
      'Generated with `trek-plugin submit`. CI validates the tag, artifact hash, manifest parity and README.',
    ].join('\n');
    const args = ['pr', 'create', '--repo', registry, '--head', `${login}:${branch}`, '--title', title, '--body', body];
    if (opts.draft) args.push('--draft');
    const prUrl = gh(...args);
    return { prUrl };
  } finally {
    if (!opts.keep) fs.rmSync(tmp, { recursive: true, force: true });
  }
}
