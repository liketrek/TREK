/**
 * trek-plugin rotate-key — move a published plugin to a NEW signing key, without shipping a
 * version.
 *
 * Rotation was always possible on the registry side (a maintainer applies the `allow-key-change`
 * label) and on the TREK side (SIGNATURE_KEY_CHANGED has an admin re-trust override) — but the
 * SDK had no deliberate path to it: every publishing command refused a changed key outright.
 * This command is that path for the no-new-version case (a lost key, a compromised machine, a
 * planned rotation); `publish --allow-key-change` covers rotating as part of a release.
 *
 * What it does: fetch the plugin's published registry entry, re-sign EVERY pinned artifact with
 * the new key (rotate-sign is all-or-nothing — see retro-sign.ts), swap `authorPublicKey`, and
 * open the registry PR flagged as a rotation — or write the rotated entry to a file for a
 * hand-made PR. What it cannot do is the human half, so it says it instead: the PR merges only
 * with a maintainer's `allow-key-change` label, and every admin who has the plugin must re-trust
 * the new key.
 */
import fs from 'node:fs';
import path from 'node:path';
import { rotateSignatures } from './retro-sign.js';
import { submitEntry } from './submit.js';
import { DEFAULT_REGISTRY } from './checks/network.js';
import { readJsonFile } from './json.js';
import { plainLog, type LogSink } from './ui.js';

interface PublishedEntry {
  id: string;
  name?: string;
  authorPublicKey?: string;
  versions: Array<{ version: string; downloadUrl: string; sha256: string; signature?: string }>;
}

export interface RotateKeyResult {
  id: string;
  /** Every version, re-signed with the new key. */
  rotatedVersions: string[];
  /** Set when the rotated entry was written to a file instead of submitted. */
  outPath?: string;
  /** Set when the registry PR was opened. */
  prUrl?: string;
}

export async function rotateKey(opts: {
  /** Plugin directory to read the id from. Ignored when `id` is given. */
  dir?: string;
  /** The plugin id, when not running from the plugin's directory. */
  id?: string;
  /** The NEW Ed25519 private key to rotate to. */
  keyPath: string;
  registry?: string;
  /** Write the rotated entry here (for a hand-made PR) instead of opening the registry PR. */
  out?: string;
  draft?: boolean;
  log?: LogSink;
}): Promise<RotateKeyResult> {
  const log = opts.log ?? plainLog;
  const registry = opts.registry ?? DEFAULT_REGISTRY;

  const id = opts.id || readIdFrom(opts.dir ?? '.');
  if (!id) {
    throw new Error(
      'no plugin id — run rotate-key from the plugin directory (it reads trek-plugin.json), or pass --id <plugin-id>.',
    );
  }

  // The registry's entry is the source of truth for what must be re-signed: the pinned versions,
  // their artifacts, and the key TREK instances currently trust.
  const entry = await fetchPublishedEntry(registry, id);
  if (!entry) {
    throw new Error(
      `"${id}" is not published in ${registry} — there is nothing to rotate. ` +
      '(To sign a plugin for the first time, publish a signed update: `trek-plugin publish --sign`.)',
    );
  }

  log(`Rotating the signing key for "${id}" — re-signing ${entry.versions.length} published version(s)…`);
  const rotatedVersions = await rotateSignatures(entry, opts.keyPath, log);

  if (opts.out) {
    fs.writeFileSync(opts.out, JSON.stringify(entry, null, 2) + '\n');
    log(`Rotated entry written to ${opts.out} — PR it as registry/plugins/${id}.json.`);
    log('Remind the maintainers it needs the allow-key-change label; every admin must then re-trust the plugin.');
    return { id, rotatedVersions, outPath: opts.out };
  }

  const { prUrl } = await submitEntry(entry, { registry, draft: opts.draft, rotateOnly: true });
  return { id, rotatedVersions, prUrl };
}

function readIdFrom(dir: string): string {
  try {
    const m = readJsonFile<{ id?: unknown }>(path.join(path.resolve(dir), 'trek-plugin.json'));
    return typeof m.id === 'string' ? m.id : '';
  } catch {
    return '';
  }
}

async function fetchPublishedEntry(registry: string, id: string): Promise<PublishedEntry | null> {
  const url = `https://raw.githubusercontent.com/${registry}/main/registry/plugins/${id}.json`;
  let text: string;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'trek-plugin' } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    text = await r.text();
  } catch (e) {
    throw new Error(`could not read the published entry from ${registry} (${e instanceof Error ? e.message : String(e)}) — rotation needs the registry to know what to re-sign.`);
  }
  try {
    return JSON.parse(text) as PublishedEntry;
  } catch {
    throw new Error(`the published entry at ${url} is not valid JSON — refusing to rotate over it.`);
  }
}
