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

const DEFAULT_REGISTRY = 'liketrek/TREK-Plugins';

interface EntryLike {
  id: string; name?: string; authorPublicKey?: string;
  versions: { version: string }[];
}

function git(cwd: string, ...a: string[]): string {
  return execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8' }).trim();
}
function gh(...a: string[]): string {
  return execFileSync('gh', a, { encoding: 'utf8' }).trim();
}

/** Merge a freshly-built single-version entry onto an existing registry file (update case). */
function mergeOnto(existing: EntryLike, fresh: EntryLike): EntryLike {
  const v = fresh.versions[0];
  if (existing.authorPublicKey && fresh.authorPublicKey && existing.authorPublicKey !== fresh.authorPublicKey) {
    throw new Error('the signing key differs from the one already published for this plugin — TREK would reject the update. Use the original key.');
  }
  if (existing.authorPublicKey && !fresh.authorPublicKey) {
    throw new Error('this plugin was published signed — sign the update too (pass --sign) or TREK will refuse it.');
  }
  const versions = [v, ...existing.versions.filter((x) => x.version !== v.version)];
  const merged: EntryLike = { ...existing, ...fresh, versions };
  merged.authorPublicKey = fresh.authorPublicKey ?? existing.authorPublicKey;
  if (merged.authorPublicKey === undefined) delete merged.authorPublicKey;
  return merged;
}

export function submitEntry(entry: EntryLike, opts: { registry?: string; branch?: string; draft?: boolean; keep?: boolean } = {}): { prUrl: string } {
  const registry = opts.registry || DEFAULT_REGISTRY;
  const name = registry.split('/')[1];
  const login = gh('api', 'user', '--jq', '.login');
  const branch = opts.branch || `plugin-${entry.id}-${entry.versions[0].version}`;

  // Ensure the fork exists (idempotent — prints "already exists" if it does).
  try { gh('repo', 'fork', registry, '--clone=false'); } catch { /* already forked */ }

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
    if (fs.existsSync(abs)) {
      const existing = readJsonFile<EntryLike>(abs);
      toWrite = mergeOnto(existing, entry);
      action = 'update';
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(toWrite, null, 2) + '\n');

    const title = action === 'add'
      ? `Add ${entry.name || entry.id} (${entry.versions[0].version})`
      : `Update ${entry.name || entry.id} to ${entry.versions[0].version}`;
    git(tmp, 'add', rel);
    git(tmp, 'commit', '-m', title);
    git(tmp, 'push', '--force-with-lease', 'origin', branch);

    const body = [
      `${action === 'add' ? 'New plugin' : 'Plugin update'}: **${entry.name || entry.id}** \`${entry.id}\` ${entry.versions[0].version}.`,
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
