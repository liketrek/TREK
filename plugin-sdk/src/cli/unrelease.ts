/**
 * trek-plugin unrelease <tag> — undo a release that never made it into the registry.
 *
 * A failed publish (or a change of heart before the PR merges) leaves up to three things
 * behind: the GitHub release, the remote tag, and the local tag. Cleaning them up by hand
 * is three commands in the right order; this is that, with one hard safety rail:
 *
 * A version that IS published in the registry is immutable — the registry pins the
 * artifact's sha256, so deleting or re-cutting its release breaks install/update for
 * everyone who already has it. unrelease refuses those outright, with no override.
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readJsonFile } from './json.js';
import { DEFAULT_REGISTRY } from './checks/network.js';
import { plainLog, type LogSink } from './ui.js';

function git(dir: string, args: string[]): string {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: 'pipe' }).toString().trim();
}

interface PublishedIndex { plugins?: Array<{ id?: string; versions?: Array<{ version?: string }> }> }

/**
 * The published registry index, or null when it cannot be read (offline, mirror down).
 * Null is the dangerous answer — the caller must then have explicit consent (--yes).
 */
async function publishedIndex(registry: string): Promise<PublishedIndex | null> {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${registry}/main/dist/index.json`, {
      headers: { 'User-Agent': 'trek-plugin' },
    });
    if (!r.ok) return null;
    return (await r.json()) as PublishedIndex;
  } catch {
    return null;
  }
}

export async function unrelease(opts: {
  dir: string; tag: string; repo: string; registry?: string;
  /** Consent to delete when the registry index cannot be verified. */
  yes?: boolean;
  log?: LogSink;
}): Promise<{ deleted: string[] }> {
  const log = opts.log ?? plainLog;
  const dir = path.resolve(opts.dir);
  const { tag, repo } = opts;
  const registry = opts.registry || DEFAULT_REGISTRY;
  const manifest = readJsonFile<{ id?: unknown }>(path.join(dir, 'trek-plugin.json'));
  const id = String(manifest.id ?? '');
  const version = tag.replace(/^v/, '');

  const index = await publishedIndex(registry);
  if (index === null) {
    if (!opts.yes) {
      throw new Error(
        `could not read the registry index (${registry}) to verify ${id} ${version} is not published.\n` +
        `Deleting a PUBLISHED version's release breaks its sha256 pin for everyone who installed it.\n` +
        `If you are sure this version never merged into the registry, re-run with --yes.`,
      );
    }
    log(`      ! registry unreachable — proceeding on --yes`);
  } else {
    const mine = index.plugins?.find((p) => p.id === id);
    if (mine?.versions?.some((v) => v.version === version)) {
      throw new Error(
        `${id} ${version} is PUBLISHED in the registry (${registry}) — its release is immutable.\n` +
        `The registry pins this artifact's sha256; deleting the release would break install/update\n` +
        `for everyone who has it. Ship a new version instead. (There is deliberately no override.)`,
      );
    }
  }

  // Delete in blast-radius order: release, remote tag, local tag. Each is best-effort and
  // reported, so a partial previous cleanup doesn't stop the rest.
  const deleted: string[] = [];

  let hasRelease = false;
  try { execFileSync('gh', ['release', 'view', tag, '--repo', repo], { stdio: 'pipe' }); hasRelease = true; } catch { /* absent */ }
  if (hasRelease) {
    execFileSync('gh', ['release', 'delete', tag, '--repo', repo, '--yes'], { stdio: 'pipe' });
    deleted.push('release');
    log(`      ✓ deleted release ${tag} on ${repo}`);
  } else {
    log(`      - no release ${tag} on ${repo}`);
  }

  let hasRemoteTag = false;
  try { hasRemoteTag = git(dir, ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]) !== ''; } catch { /* no origin — nothing to delete */ }
  if (hasRemoteTag) {
    git(dir, ['push', 'origin', `:refs/tags/${tag}`]);
    deleted.push('remote tag');
    log(`      ✓ deleted remote tag ${tag}`);
  } else {
    log(`      - no tag ${tag} on origin`);
  }

  let hasLocalTag = false;
  try { git(dir, ['rev-parse', `${tag}^{commit}`]); hasLocalTag = true; } catch { /* absent */ }
  if (hasLocalTag) {
    git(dir, ['tag', '-d', tag]);
    deleted.push('local tag');
    log(`      ✓ deleted local tag ${tag}`);
  } else {
    log(`      - no local tag ${tag}`);
  }

  return { deleted };
}
