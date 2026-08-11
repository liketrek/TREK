#!/usr/bin/env node
/**
 * trek-plugin entry --repo <owner/name> --tag <vX.Y.Z> [--zip plugin.zip]
 *                   [--merge registry/plugins/<id>.json] [--out file]
 *
 * Generates the ready-to-PR TREK-Plugins registry entry from the manifest + the
 * packed plugin.zip + the git tag — so the sha256, size, commitSha and downloadUrl
 * an author would compute by hand all come out of one command.
 * With --merge it prepends the new version onto an existing entry (the update
 * case), keeping versions newest-first.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { minVersion, validRange } from 'semver';
import { loadPrivateKey, signArtifact, publicKeyBase64 } from './sign.js';
import { readJsonFile } from './json.js';

interface Version {
  version: string; gitTag: string; commitSha: string; downloadUrl: string;
  sha256: string;
  /**
   * The manifest's `trek` range, verbatim — the ONE compatibility field an entry carries.
   * It is what TREK gates installs and activation on, and the only field that can express
   * an exclusive upper bound.
   *
   * There is deliberately no `minTrekVersion` here any more. It said the same thing (the
   * range's lower bound) in a weaker form, and a second field restating a derived fact is a
   * second field that can be wrong. The registry still ACCEPTS one on entries published
   * before `trek` existed — and checks it agrees with the range — but nothing emits one now.
   */
  trek: string;
  size: number; apiVersion: number;
  nativeModules: false; operatorEgress?: boolean; publishedAt: string; signature?: string;
  /**
   * The manifest's dependency fields, mirrored.
   *
   * These are NOT optional decoration. TREK resolves requiredAddons and pluginDependencies from
   * the registry INDEX, before it ever downloads the artifact — so an entry that omits them
   * resolves against a dependency set the code does not actually have. Both the registry's CI
   * (validate-entry.mjs) and `preflight` parity-check them against the manifest at the pinned
   * commit, which means an entry built without them fails for any plugin that declares one.
   *
   * They were missing here until now, so `requiredAddons: ["budget"]` in a manifest produced an
   * entry CI rejected with "manifest requiredAddons != entry requiredAddons" — after the release
   * had been cut and its bytes pinned. Emitted only when non-empty, so ordinary entries are
   * byte-identical to before.
   */
  requiredAddons?: string[]; pluginDependencies?: PluginDependency[];
}
interface PluginDependency { id: string; version: string }
interface Entry {
  id: string; name: string; author: string; description: string; repo: string;
  homepage?: string; tags?: string[]; type: string; icon?: string; authorPublicKey?: string; versions: Version[];
}

/**
 * Lower bound of a `trek` range like ">=3.2.0 <4.0.0" -> "3.2.0" (matches the server).
 *
 * Read off the range with semver rather than by finding the first version-shaped substring:
 * for "<4.0.0" the first such substring is 4.0.0, which is the range's *upper* bound and
 * would have been published as the minimum — the precise inverse of what the plugin says.
 */
function minTrekFrom(trek: unknown): string | null {
  if (typeof trek !== 'string' || validRange(trek) === null) return null;
  try {
    return minVersion(trek)?.version ?? null;
  } catch {
    return null;
  }
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
  /** Optional Ed25519 private-key file — signs the artifact and pins the author key. */
  signKeyPath?: string;
}): Entry {
  const manifest = readJsonFile<Record<string, unknown>>(path.join(opts.dir, 'trek-plugin.json'));
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(opts.repo)) throw new Error(`--repo must be "owner/name", got "${opts.repo}"`);
  // minVersion() is null for a range nothing can satisfy (">=4.0.0 <3.0.0" parses fine), so
  // this doubles as the satisfiability check — TREK would refuse to install such a plugin.
  if (!minTrekFrom(manifest.trek)) throw new Error('manifest has no valid "trek" version range (e.g. "trek": ">=3.2.0 <4.0.0")');
  if (!fs.existsSync(opts.zipPath)) throw new Error(`artifact not found: ${opts.zipPath} — run \`trek-plugin pack\` first`);

  const buf = fs.readFileSync(opts.zipPath);
  const asset = opts.asset || path.basename(opts.zipPath);
  const version: Version = {
    version: String(manifest.version),
    gitTag: opts.tag,
    commitSha: resolveCommit(opts.dir, opts.tag, opts.commit),
    downloadUrl: `https://github.com/${opts.repo}/releases/download/${opts.tag}/${asset}`,
    sha256: createHash('sha256').update(buf).digest('hex'),
    trek: String(manifest.trek),
    size: buf.length,
    apiVersion: typeof manifest.apiVersion === 'number' ? manifest.apiVersion : 1,
    nativeModules: false,
    publishedAt: opts.now,
  };
  // Mirror the manifest's operatorEgress onto the entry — CI parity-checks it, because the
  // flag says the egress[] list is NOT the plugin's full network reach (an admin may add
  // hosts after install). Only emitted when true, so ordinary entries stay unchanged.
  if (manifest.operatorEgress === true) version.operatorEgress = true;

  // Mirror the dependency fields. See the Version interface for why omitting these was a bug:
  // TREK resolves them from the index before downloading, and CI refuses an entry that
  // disagrees with the manifest. Only emitted when non-empty — an empty array and an absent
  // one normalise identically on both sides of the parity check.
  const requiredAddons = Array.isArray(manifest.requiredAddons) ? manifest.requiredAddons.map(String) : [];
  if (requiredAddons.length) version.requiredAddons = requiredAddons;
  const pluginDependencies = Array.isArray(manifest.pluginDependencies)
    ? (manifest.pluginDependencies as PluginDependency[]).map((d) => ({ id: String(d?.id), version: String(d?.version) }))
    : [];
  if (pluginDependencies.length) version.pluginDependencies = pluginDependencies;

  // Optional author signature over the exact artifact bytes.
  let authorPublicKey: string | undefined;
  if (opts.signKeyPath) {
    const key = loadPrivateKey(opts.signKeyPath);
    version.signature = signArtifact(buf, key);
    authorPublicKey = publicKeyBase64(key);
  }

  if (opts.mergePath) {
    const existing = readJsonFile<Entry>(opts.mergePath);
    if (authorPublicKey && existing.authorPublicKey && existing.authorPublicKey !== authorPublicKey) {
      throw new Error('this signing key differs from the one already published for this plugin — TREK would reject the update. Use the original key.');
    }
    if (existing.authorPublicKey && !authorPublicKey) {
      throw new Error('this plugin was published signed — sign the update too (pass --sign) or TREK will refuse it.');
    }
    const versions = [version, ...existing.versions.filter((v) => v.version !== version.version)];
    // Refresh the icon from the manifest when this release declares one (an author who adds
    // or changes it should see it in the store), but never wipe an icon the entry already
    // carries just because the manifest omits it.
    const icon = typeof manifest.icon === 'string' && manifest.icon ? manifest.icon : existing.icon;
    return { ...existing, icon, authorPublicKey: authorPublicKey ?? existing.authorPublicKey, versions };
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
  if (typeof manifest.icon === 'string' && manifest.icon) entry.icon = manifest.icon;
  if (typeof manifest.homepage === 'string') entry.homepage = manifest.homepage;
  if (Array.isArray(manifest.tags)) entry.tags = manifest.tags.map(String).slice(0, 8);
  if (authorPublicKey) entry.authorPublicKey = authorPublicKey;
  return entry;
}
