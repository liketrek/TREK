import { Injectable } from '@nestjs/common';
import semver from 'semver';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../../../db/database';
import type { PluginDependency } from '../install/manifest';
import { pluginCodeDir, pluginsCodeRoot, pluginsDataRoot } from '../paths';
import { safeDownload, sha256Matches } from '../install/safe-fetch';
import { verifyAuthorSignature } from '../install/verify-signature';
import { extractArchive } from '../install/safe-extract';
import { scanForNativeBinaries } from '../install/native-scan';
import { parseJsonText, parseManifest } from '../install/manifest';
import { discoverPlugins } from '../install/discovery';

/**
 * TREK-side of the plugin registry (#plugins, M5). Fetches the single aggregated
 * dist/index.json (never per-plugin GitHub API calls — the HACS rate-limit
 * lesson), caches it briefly + soft-fails, and installs a pinned version through
 * the M4 pipeline: SSRF-safe download -> sha256 verify -> zip/tar-slip-safe
 * extract -> manifest re-validate -> native re-scan -> atomic move -> discover
 * (registers INACTIVE). Nothing executes on install; activation is separate.
 */

const REGISTRY_URL =
  process.env.TREK_PLUGIN_REGISTRY_URL ||
  'https://raw.githubusercontent.com/mauriceboe/TREK-Plugins/main/dist/index.json';
const CACHE_TTL = 30 * 60 * 1000;
const MANIFEST_MAX_BYTES = 256 * 1024;
// Sideload upload ceiling — matches the SDK `pack` limit (50 MB) plus zip overhead.
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 + 4096;

interface RegistryVersion {
  version: string;
  gitTag: string;
  commitSha: string;
  downloadUrl: string;
  sha256: string;
  minTrekVersion: string;
  maxTrekVersion?: string | null;
  size?: number;
  apiVersion?: number;
  nativeModules?: boolean;
  publishedAt?: string;
  /** base64 minisign signature (.minisig payload) over the artifact bytes. */
  signature?: string;
  /** Addon ids this version requires enabled (mirrors the manifest; #plugins deps). */
  requiredAddons?: string[];
  /** Other plugins this version depends on (mirrors the manifest). */
  pluginDependencies?: PluginDependency[];
}
export interface RegistryEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  repo: string;
  homepage?: string;
  tags?: string[];
  type: string;
  reviewedAt?: string | null;
  /** base64 minisign author public key — stable across versions, TOFU-pinned. */
  authorPublicKey?: string;
  /** Release-asset downloads across all versions, aggregated by the registry's stats cron. */
  downloadCount?: number | null;
  versions: RegistryVersion[];
}
interface Registry {
  schemaVersion: number;
  generatedAt?: string;
  plugins: RegistryEntry[];
}

/** Anzeige-only preview of a plugin's live manifest (fetched at the reviewed commit). */
export interface ManifestPreview {
  permissions: string[];
  egress: string[];
  /**
   * The plugin talks to a service only the OPERATOR can name (a self-hosted Gotify/ntfy),
   * so its `egress` can't be the whole story — an admin adds the real hosts after install.
   * Surfaced pre-install so the reviewer knows the network reach is not fully described by
   * the hosts listed above.
   */
  operatorEgress: boolean;
  settings: Array<{ key: string; label: string; inputType: string; scope: string; required: boolean }>;
  license: string | null;
  icon: string | null;
  requiredAddons: string[];
  pluginDependencies: PluginDependency[];
}

let _cache: { data: Registry; expiresAt: number } | null = null;
const _detailCache = new Map<string, { data: unknown; expiresAt: number }>();

/** Test hook: drop the in-memory registry cache. */
export function __clearRegistryCacheForTests(): void {
  _cache = null;
  _detailCache.clear();
}

export class RegistryError extends Error {}

@Injectable()
export class PluginRegistryService {
  /**
   * Fetch the aggregated registry (cached, soft-fail, stale-serve). Pass
   * force=true (the admin "rescan" button) to bypass the 30-min cache and also
   * bust GitHub's raw CDN edge cache (max-age=300), so a just-merged registry
   * entry shows up right away instead of up to ~35 min later.
   */
  async fetchRegistry(force = false): Promise<Registry> {
    if (!force && _cache && Date.now() < _cache.expiresAt) return _cache.data;
    if (force) _detailCache.clear();
    try {
      const url = force ? `${REGISTRY_URL}${REGISTRY_URL.includes('?') ? '&' : '?'}_=${Date.now()}` : REGISTRY_URL;
      const headers: Record<string, string> = { 'User-Agent': 'TREK-Server' };
      if (force) { headers['Cache-Control'] = 'no-cache'; headers.Pragma = 'no-cache'; }
      const resp = await fetch(url, { headers });
      if (!resp.ok) throw new Error(`registry ${resp.status}`);
      const data = (await resp.json()) as Registry;
      if (!data || !Array.isArray(data.plugins)) throw new Error('malformed registry');
      _cache = { data, expiresAt: Date.now() + CACHE_TTL };
      return data;
    } catch {
      return _cache?.data ?? { schemaVersion: 1, plugins: [] };
    }
  }

  /** The browse list the admin UI renders (metadata only, no code). */
  async browse(force = false): Promise<Array<Omit<RegistryEntry, 'versions'> & { latest: string | null; minTrekVersion: string | null; requiredAddons: string[]; pluginDependencies: PluginDependency[]; screenshotUrl: string | null }>> {
    const reg = await this.fetchRegistry(force);
    return reg.plugins.map((p) => {
      const latest = p.versions[0] ?? null;
      return {
        id: p.id, name: p.name, author: p.author, description: p.description, repo: p.repo,
        homepage: p.homepage, tags: p.tags, type: p.type, reviewedAt: p.reviewedAt ?? null,
        downloadCount: p.downloadCount ?? null,
        latest: latest?.version ?? null, minTrekVersion: latest?.minTrekVersion ?? null,
        requiredAddons: latest?.requiredAddons ?? [], pluginDependencies: latest?.pluginDependencies ?? [],
        screenshotUrl: latest ? rawFileUrl(p.repo, latest.commitSha, 'docs/screenshot.png') : null,
      };
    });
  }

  /**
   * Everything the browse detail view shows for one plugin: the registry entry
   * plus a preview of its live manifest (permissions, egress, settings) fetched
   * from the author repo at the pinned/reviewed commit. Display-only — the
   * install pipeline re-validates the manifest inside the downloaded artifact.
   * Cached per plugin (30 min) and only fetched when a detail view opens, never
   * for the whole grid (the HACS rate-limit lesson).
   */
  async detail(id: string): Promise<Record<string, unknown>> {
    const hit = _detailCache.get(id);
    if (hit && Date.now() < hit.expiresAt) return hit.data as Record<string, unknown>;

    const reg = await this.fetchRegistry();
    const entry = reg.plugins.find((p) => p.id === id);
    if (!entry) throw new RegistryError(`plugin ${id} not in registry`);
    const latest = entry.versions[0] ?? null;

    let manifest: ManifestPreview | null = null;
    if (latest) {
      try {
        const { bytes } = await safeDownload(rawFileUrl(entry.repo, latest.commitSha, 'trek-plugin.json'), MANIFEST_MAX_BYTES);
        manifest = previewManifest(parseJsonText(bytes.toString('utf8')));
      } catch {
        // Soft-fail: the detail view still renders from registry metadata alone.
      }
    }

    const data = {
      id: entry.id, name: entry.name, author: entry.author, description: entry.description,
      repo: entry.repo, homepage: entry.homepage ?? null, tags: entry.tags ?? [], type: entry.type,
      reviewedAt: entry.reviewedAt ?? null, downloadCount: entry.downloadCount ?? null,
      latest: latest?.version ?? null, minTrekVersion: latest?.minTrekVersion ?? null,
      size: latest?.size ?? null, publishedAt: latest?.publishedAt ?? null,
      requiredAddons: latest?.requiredAddons ?? [], pluginDependencies: latest?.pluginDependencies ?? [],
      screenshotUrl: latest ? rawFileUrl(entry.repo, latest.commitSha, 'docs/screenshot.png') : null,
      manifest,
    };
    // Don't negative-cache a transiently failed manifest fetch — the next
    // detail open should retry instead of hiding the preview for 30 minutes.
    if (manifest || !latest) _detailCache.set(id, { data, expiresAt: Date.now() + CACHE_TTL });
    return data;
  }

  /**
   * Resolve which registry version of `id` to install: the highest that satisfies
   * `constraint` (any version if omitted) AND is compatible with the running TREK
   * version (`minTrekVersion`/`maxTrekVersion`). Throws if the plugin isn't in the
   * registry or nothing qualifies. Backs "download the latest compatible version".
   */
  async resolveVersion(id: string, constraint?: string): Promise<RegistryVersion> {
    const reg = await this.fetchRegistry();
    const entry = reg.plugins.find((p) => p.id === id);
    if (!entry) throw new RegistryError(`plugin ${id} not in registry`);
    const host = hostVersion();
    const candidates = entry.versions.filter((v) => {
      if (constraint && !semver.satisfies(v.version, constraint, { includePrerelease: true })) return false;
      return hostCompatible(v, host);
    });
    if (!candidates.length) {
      throw new RegistryError(
        constraint
          ? `no version of ${id} satisfies "${constraint}" and this TREK version`
          : `no compatible version of ${id} for this TREK version`,
      );
    }
    return [...candidates].sort((a, b) => semver.rcompare(a.version, b.version))[0];
  }

  /** Install a version from the registry. Returns the installed plugin id + version. */
  async install(id: string, opts?: { version?: string; constraint?: string }): Promise<{ id: string; version: string }> {
    const reg = await this.fetchRegistry();
    const entry = reg.plugins.find((p) => p.id === id);
    if (!entry) throw new RegistryError(`plugin ${id} not in registry`);
    const ver = opts?.version
      ? entry.versions.find((v) => v.version === opts.version)
      : opts?.constraint
        ? await this.resolveVersion(id, opts.constraint)
        : entry.versions[0];
    if (!ver) throw new RegistryError(`version ${opts?.version ?? opts?.constraint ?? 'latest'} not found for ${id}`);

    // 1. SSRF-safe download + 2. sha256 verify
    const { bytes, sha256 } = await safeDownload(ver.downloadUrl, (ver.size ?? 50 * 1024 * 1024) + 4096);
    if (!sha256Matches(sha256, ver.sha256)) throw new RegistryError('integrity check failed (sha256 mismatch)');

    // 2b. author signature (opt-in) + TOFU key pin. Unsigned plugins skip this
    // and install on sha256 alone (unchanged behaviour); a signed plugin must
    // verify, and its author key must match the one pinned on first install.
    this.verifySignatureAndTofu(id, bytes, entry, ver);

    // 3. zip/tar-slip-safe extract to staging
    const staging = path.join(pluginsDataRoot(), '.staging', `${id}-${ver.version}-${Date.now()}`);
    try {
      extractArchive(bytes, staging);
      const pluginRoot = locateManifestDir(staging);
      if (!pluginRoot) throw new RegistryError('archive contains no trek-plugin.json');

      // 4. re-validate the bundled manifest + 5. native re-scan
      const manifest = parseManifest(parseJsonText(fs.readFileSync(path.join(pluginRoot, 'trek-plugin.json'), 'utf8')));
      if (manifest.id !== id) throw new RegistryError(`manifest id "${manifest.id}" != "${id}"`);
      if (scanForNativeBinaries(pluginRoot).length) throw new RegistryError('artifact contains native binaries');

      // 6. atomic move into place
      const dest = pluginCodeDir(id);
      fs.mkdirSync(pluginsCodeRoot(), { recursive: true });
      fs.rmSync(dest, { recursive: true, force: true });
      fs.renameSync(pluginRoot, dest);

      // 7. register INACTIVE (record provenance)
      discoverPlugins(db);
      db.prepare('UPDATE plugins SET source_repo = ?, source_commit = ?, sha256 = ?, reviewed_at = ? WHERE id = ?').run(
        entry.repo, ver.commitSha, ver.sha256, entry.reviewedAt ?? null, id,
      );
      // Pin the author key on first successful install of a signed plugin (TOFU).
      if (entry.authorPublicKey) {
        db.prepare('UPDATE plugins SET author_pubkey = ? WHERE id = ?').run(entry.authorPublicKey, id);
      }
      return { id, version: ver.version };
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  }

  /**
   * Install `id` (latest-compatible, or the newest matching `constraint`) together
   * with any of its declared plugin dependencies that aren't installed yet — each
   * resolved to the newest version satisfying its declared range. Required addons
   * can't be installed; they're collected and returned so the caller can prompt the
   * admin to enable them. Cycle-safe. Already-installed plugins are left untouched.
   */
  async installWithDependencies(id: string, constraint?: string): Promise<{ installed: string[]; requiredAddons: string[] }> {
    const installedNow = new Set((db.prepare('SELECT id FROM plugins').all() as Array<{ id: string }>).map((r) => r.id));
    const done = new Set<string>();
    const installed: string[] = [];
    const requiredAddons = new Set<string>();

    const visit = async (pid: string, range: string | undefined, stack: string[]): Promise<void> => {
      if (done.has(pid)) return;
      if (stack.includes(pid)) throw new RegistryError(`plugin dependency cycle: ${[...stack, pid].join(' -> ')}`);
      const ver = await this.resolveVersion(pid, range); // throws if not in registry / unsatisfiable
      if (!installedNow.has(pid)) {
        await this.install(pid, range ? { constraint: range } : undefined);
        installed.push(pid);
        installedNow.add(pid);
      }
      done.add(pid);
      for (const a of ver.requiredAddons ?? []) requiredAddons.add(a);
      for (const dep of ver.pluginDependencies ?? []) await visit(dep.id, dep.version, [...stack, pid]);
    };
    await visit(id, constraint, []);
    return { installed, requiredAddons: [...requiredAddons] };
  }

  /**
   * Sideload step 1: extract + validate an uploaded archive into a staging dir,
   * WITHOUT touching the live plugin. Returns the manifest id/version + the staged
   * path so the caller can stop a running child before the swap. Same hard guards
   * as a registry install (slip/bomb-safe extract, strict manifest, no native
   * binaries) — only the registry sha256/signature checks are absent, because a
   * sideload has no registry entry. Throws (and self-cleans staging) on failure.
   */
  stageUpload(bytes: Buffer): { id: string; version: string; root: string; stagingDir: string } {
    if (bytes.length > MAX_UPLOAD_BYTES) throw new RegistryError('archive exceeds the 50MB limit');
    const stagingDir = path.join(pluginsDataRoot(), '.staging', `upload-${Date.now()}`);
    try {
      extractArchive(bytes, stagingDir);
      const root = locateManifestDir(stagingDir);
      if (!root) throw new RegistryError('archive contains no trek-plugin.json');
      const manifest = parseManifest(parseJsonText(fs.readFileSync(path.join(root, 'trek-plugin.json'), 'utf8')));
      if (scanForNativeBinaries(root).length) throw new RegistryError('artifact contains native binaries');
      return { id: manifest.id, version: manifest.version, root, stagingDir };
    } catch (e) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      throw e;
    }
  }

  /**
   * Sideload step 2: move a staged upload into place and register it INACTIVE as a
   * sideloaded plugin — source "local:upload", unsigned, not registry-reviewed, so
   * the UI flags it and offers no auto-update. The caller MUST have stopped any
   * running child of this id first (the code dir is replaced).
   */
  commitUpload(staged: { id: string; root: string; stagingDir: string }): void {
    try {
      const dest = pluginCodeDir(staged.id);
      fs.mkdirSync(pluginsCodeRoot(), { recursive: true });
      fs.rmSync(dest, { recursive: true, force: true });
      fs.renameSync(staged.root, dest);
      discoverPlugins(db);
      // Provenance for a sideload, plus a hard INACTIVE floor: discoverPlugins keeps
      // an existing row's status, so replacing a plugin that was active must not
      // leave the new code marked active — the admin re-activates (and re-consents
      // to permissions) explicitly.
      db.prepare("UPDATE plugins SET source_repo = ?, source_commit = ?, sha256 = ?, reviewed_at = ?, author_pubkey = NULL, status = 'inactive', enabled = 0 WHERE id = ?").run(
        'local:upload', null, null, null, staged.id,
      );
    } finally {
      fs.rmSync(staged.stagingDir, { recursive: true, force: true });
    }
  }

  /**
   * Verify the author signature (if the entry declares a key + the version a
   * signature) and enforce Trust-On-First-Use on the author key.
   *
   * - Neither key nor signature → unsigned plugin, skip (opt-in).
   * - Key present but no signature (or vice versa) → hard stop; a half-signed
   *   entry is a misconfiguration we refuse rather than silently downgrade.
   * - Signature invalid → hard stop.
   * - Registry key differs from the key pinned on a prior install → hard stop
   *   (author change / rotation / attack; needs an explicit admin re-trust).
   */
  private verifySignatureAndTofu(id: string, bytes: Buffer, entry: RegistryEntry, ver: RegistryVersion): void {
    const pinned = (db.prepare('SELECT author_pubkey FROM plugins WHERE id = ?').get(id) as { author_pubkey?: string } | undefined)?.author_pubkey ?? null;

    if (!entry.authorPublicKey && !ver.signature) {
      if (pinned) throw new RegistryError('this plugin was signed before but the update is unsigned — refusing');
      return; // unsigned throughout: sha256 is the only pin
    }
    if (!entry.authorPublicKey || !ver.signature) {
      throw new RegistryError('incomplete signature: an author key and a version signature must both be present');
    }
    if (pinned && pinned !== entry.authorPublicKey) {
      throw new RegistryError("the plugin's author signing key changed since it was installed — re-trust it explicitly to continue");
    }
    if (!verifyAuthorSignature(bytes, ver.signature, entry.authorPublicKey)) {
      throw new RegistryError('author signature verification failed');
    }
  }
}

function rawFileUrl(repo: string, commitSha: string, file: string): string {
  return `https://raw.githubusercontent.com/${repo}/${commitSha}/${file}`;
}

/** The running TREK version (same source as the rest of the app). */
function hostVersion(): string {
  return process.env.APP_VERSION || (require('../../../../package.json') as { version: string }).version;
}

/** Whether a registry version's host-version bounds admit the running TREK. */
function hostCompatible(v: RegistryVersion, host: string): boolean {
  const h = semver.coerce(host)?.version ?? host;
  if (!semver.valid(h)) return true; // unparseable host — don't block on compat
  if (v.minTrekVersion && semver.valid(v.minTrekVersion) && semver.lt(h, v.minTrekVersion)) return false;
  if (v.maxTrekVersion && semver.valid(v.maxTrekVersion) && semver.gt(h, v.maxTrekVersion)) return false;
  return true;
}

/**
 * Tolerant projection of a live manifest for display. Unknown shapes degrade to
 * empty lists instead of throwing — a future manifest field must never break
 * browsing (strict validation happens against the downloaded artifact instead).
 */
function previewManifest(raw: unknown): ManifestPreview {
  const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const operatorEgress = m.operatorEgress === true;
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const settings = Array.isArray(m.settings)
    ? m.settings
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          key: typeof s.key === 'string' ? s.key : '',
          label: typeof s.label === 'string' ? s.label : typeof s.key === 'string' ? s.key : '',
          inputType: typeof s.input_type === 'string' ? s.input_type : 'text',
          scope: s.scope === 'user' ? 'user' : 'instance',
          required: s.required === true,
        }))
        .filter((s) => s.key)
    : [];
  const pluginDependencies = Array.isArray(m.pluginDependencies)
    ? m.pluginDependencies
        .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
        .map((d) => ({ id: typeof d.id === 'string' ? d.id : '', version: typeof d.version === 'string' ? d.version : '' }))
        .filter((d) => d.id && d.version)
    : [];
  return {
    permissions: strings(m.permissions),
    egress: strings(m.egress),
    operatorEgress,
    settings,
    license: typeof m.license === 'string' ? m.license : null,
    icon: typeof m.icon === 'string' ? m.icon : null,
    requiredAddons: strings(m.requiredAddons),
    pluginDependencies,
  };
}

/** The extracted plugin root: staging itself, or its single wrapper subdir (codeload archives wrap in {repo}-{sha}/). */
function locateManifestDir(staging: string): string | null {
  if (fs.existsSync(path.join(staging, 'trek-plugin.json'))) return staging;
  const subs = fs.existsSync(staging)
    ? fs.readdirSync(staging, { withFileTypes: true }).filter((d) => d.isDirectory())
    : [];
  for (const s of subs) {
    const p = path.join(staging, s.name);
    if (fs.existsSync(path.join(p, 'trek-plugin.json'))) return p;
  }
  return null;
}
