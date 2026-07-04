#!/usr/bin/env node
/**
 * trek-plugin entry --repo <owner/name> --tag <vX.Y.Z> [--zip plugin.zip]
 *                   [--merge registry/plugins/<id>.json] [--out file]
 *
 * Generates the ready-to-PR TREK-Plugins registry entry from the manifest + the
 * packed plugin.zip + the git tag — so the sha256, size, commitSha, downloadUrl
 * and minTrekVersion an author would compute by hand all come out of one command.
 * With --merge it prepends the new version onto an existing entry (the update
 * case), keeping versions newest-first.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

interface Version {
  version: string; gitTag: string; commitSha: string; downloadUrl: string;
  sha256: string; minTrekVersion: string; size: number; apiVersion: number;
  nativeModules: false; publishedAt: string;
}
interface Entry {
  id: string; name: string; author: string; description: string; repo: string;
  homepage?: string; tags?: string[]; type: string; versions: Version[];
}

/** Lower bound of a `trek` range like ">=3.2.0 <4.0.0" -> "3.2.0" (matches the server). */
function minTrekFrom(trek: unknown): string | null {
  if (typeof trek !== 'string') return null;
  return trek.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null;
}

function resolveCommit(dir: string, tag: string, override?: string): string {
  if (override) return override;
  try {
    // ^{commit} dereferences an annotated tag to its commit.
    return execFileSync('git', ['-C', dir, 'rev-parse', `${tag}^{commit}`], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(`could not resolve the commit for tag "${tag}" (is it pushed?). Pass --commit <sha> to override.`);
  }
}

export function buildEntry(opts: {
  dir: string; repo: string; tag: string; zipPath: string;
  commit?: string; asset?: string; mergePath?: string; now: string;
}): Entry {
  const manifest = JSON.parse(fs.readFileSync(path.join(opts.dir, 'trek-plugin.json'), 'utf8')) as Record<string, unknown>;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(opts.repo)) throw new Error(`--repo must be "owner/name", got "${opts.repo}"`);
  const minTrek = minTrekFrom(manifest.trek);
  if (!minTrek) throw new Error('manifest has no "trek" version range to derive minTrekVersion from (e.g. "trek": ">=3.2.0 <4.0.0")');
  if (!fs.existsSync(opts.zipPath)) throw new Error(`artifact not found: ${opts.zipPath} — run \`trek-plugin pack\` first`);

  const buf = fs.readFileSync(opts.zipPath);
  const asset = opts.asset || path.basename(opts.zipPath);
  const version: Version = {
    version: String(manifest.version),
    gitTag: opts.tag,
    commitSha: resolveCommit(opts.dir, opts.tag, opts.commit),
    downloadUrl: `https://github.com/${opts.repo}/releases/download/${opts.tag}/${asset}`,
    sha256: createHash('sha256').update(buf).digest('hex'),
    minTrekVersion: minTrek,
    size: buf.length,
    apiVersion: typeof manifest.apiVersion === 'number' ? manifest.apiVersion : 1,
    nativeModules: false,
    publishedAt: opts.now,
  };

  if (opts.mergePath) {
    const existing = JSON.parse(fs.readFileSync(opts.mergePath, 'utf8')) as Entry;
    const versions = [version, ...existing.versions.filter((v) => v.version !== version.version)];
    return { ...existing, versions };
  }

  const entry: Entry = {
    id: String(manifest.id),
    name: String(manifest.name),
    author: typeof manifest.author === 'string' ? manifest.author : 'Unknown',
    description: typeof manifest.description === 'string' ? manifest.description : '',
    repo: opts.repo,
    type: String(manifest.type),
    versions: [version],
  };
  if (typeof manifest.homepage === 'string') entry.homepage = manifest.homepage;
  if (Array.isArray(manifest.tags)) entry.tags = manifest.tags.map(String).slice(0, 8);
  return entry;
}
