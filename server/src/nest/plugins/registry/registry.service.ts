import { Injectable } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../../../db/database';
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
  settings: Array<{ key: string; label: string; inputType: string; scope: string; required: boolean }>;
  license: string | null;
  icon: string | null;
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
  /** Fetch the aggregated registry (cached, soft-fail, stale-serve). */
  async fetchRegistry(): Promise<Registry> {
    if (_cache && Date.now() < _cache.expiresAt) return _cache.data;
    try {
      const resp = await fetch(REGISTRY_URL, { headers: { 'User-Agent': 'TREK-Server' } });
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
  async browse(): Promise<Array<Omit<RegistryEntry, 'versions'> & { latest: string | null; minTrekVersion: string | null; screenshotUrl: string | null }>> {
    const reg = await this.fetchRegistry();
    return reg.plugins.map((p) => {
      const latest = p.versions[0] ?? null;
      return {
        id: p.id, name: p.name, author: p.author, description: p.description, repo: p.repo,
        homepage: p.homepage, tags: p.tags, type: p.type, reviewedAt: p.reviewedAt ?? null,
        latest: latest?.version ?? null, minTrekVersion: latest?.minTrekVersion ?? null,
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
      reviewedAt: entry.reviewedAt ?? null,
      latest: latest?.version ?? null, minTrekVersion: latest?.minTrekVersion ?? null,
      size: latest?.size ?? null, publishedAt: latest?.publishedAt ?? null,
      screenshotUrl: latest ? rawFileUrl(entry.repo, latest.commitSha, 'docs/screenshot.png') : null,
      manifest,
    };
    // Don't negative-cache a transiently failed manifest fetch — the next
    // detail open should retry instead of hiding the preview for 30 minutes.
    if (manifest || !latest) _detailCache.set(id, { data, expiresAt: Date.now() + CACHE_TTL });
    return data;
  }

  /** Install a pinned version from the registry. Returns the installed plugin id. */
  async install(id: string, version?: string): Promise<{ id: string; version: string }> {
    const reg = await this.fetchRegistry();
    const entry = reg.plugins.find((p) => p.id === id);
    if (!entry) throw new RegistryError(`plugin ${id} not in registry`);
    const ver = version ? entry.versions.find((v) => v.version === version) : entry.versions[0];
    if (!ver) throw new RegistryError(`version ${version ?? 'latest'} not found for ${id}`);

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

/**
 * Tolerant projection of a live manifest for display. Unknown shapes degrade to
 * empty lists instead of throwing — a future manifest field must never break
 * browsing (strict validation happens against the downloaded artifact instead).
 */
function previewManifest(raw: unknown): ManifestPreview {
  const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
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
  return {
    permissions: strings(m.permissions),
    egress: strings(m.egress),
    settings,
    license: typeof m.license === 'string' ? m.license : null,
    icon: typeof m.icon === 'string' ? m.icon : null,
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
