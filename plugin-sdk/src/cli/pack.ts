#!/usr/bin/env node
/**
 * trek-plugin pack [dir] [--out plugin.zip] [--json]
 *
 * Turns a built plugin directory into the exact plugin.zip the TREK installer
 * expects, and prints its sha256 + byte size — the two values authors otherwise
 * compute by hand for the registry entry. Validates the manifest first, refuses
 * native binaries (same rule as the installer), and enforces the same size
 * limits, so a local pack that succeeds installs cleanly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { makeZip, type ZipInput } from '../zip.js';
import { injectTrekUi } from '../ui/kit.js';
import { loadContext } from './checks/context.js';
import { runOffline } from './checks/index.js';
import { blocking } from './checks/types.js';

const MAX_TOTAL = 50 * 1024 * 1024;
const MAX_FILE = 25 * 1024 * 1024;
const MAX_ENTRIES = 4000;

// Files kept at the archive root; everything the installer needs plus light docs.
const ROOT_FILES = ['trek-plugin.json', 'README.md', 'LICENSE', 'LICENSE.md', 'package.json'];
// Directories walked recursively into the archive.
const DIRS = ['server', 'client'];
// Never shipped: dep trees, VCS, source maps, TypeScript sources, the output zip.
const SKIP_DIR = new Set(['node_modules', '.git']);
const NATIVE_RE = /\.node$|(^|\/)binding\.gyp$|(^|\/)prebuilds?\//i;

export interface PackResult {
  artifact: string;
  sha256: string;
  size: number;
  files: string[];
}

function walk(base: string, rel: string, out: ZipInput[]): void {
  for (const entry of fs.readdirSync(path.join(base, rel), { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      walk(base, childRel, out);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.map') || entry.name.endsWith('.ts')) continue;
      // Expand the `<!-- trek:ui -->` marker into the inlined design kit as the file
      // enters the archive, so the source stays a one-line opt-in. A no-op on HTML
      // without the marker, so it's safe to run over every .html.
      if (entry.name.endsWith('.html')) {
        out.push({ name: childRel, data: Buffer.from(injectTrekUi(fs.readFileSync(path.join(base, childRel), 'utf8')), 'utf8') });
      } else {
        out.push({ name: childRel, data: fs.readFileSync(path.join(base, childRel)) });
      }
    }
    // symlinks and other non-regular entries are skipped (never shipped)
  }
}

export function packPluginDir(dir: string, outPath: string): PackResult {
  // Only the gates that make a plugin UNBUILDABLE — a broken manifest, no server entry, a native
  // binary. Not the registry's publish gates: packing is how you install a plugin into a local
  // TREK to try it, and refusing to build a zip because the README is still a stub would block
  // the dev loop over something that only matters at publish time. `validate`/`status`/`publish`
  // apply the full set; see checks/types.ts, CheckBlocks.
  const report = blocking(runOffline(loadContext(dir)), 'artifact');
  if (!report.ok) {
    throw new Error(
      'plugin is not valid:\n  - ' +
        report.errors.map((e) => (e.detail ? `${e.title} — ${e.detail}` : e.title)).join('\n  - '),
    );
  }

  const outAbs = path.resolve(outPath);
  const files: ZipInput[] = [];
  for (const f of ROOT_FILES) {
    const p = path.join(dir, f);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) files.push({ name: f, data: fs.readFileSync(p) });
  }
  for (const d of DIRS) {
    if (fs.existsSync(path.join(dir, d))) walk(dir, d, files);
  }
  // Drop an existing output zip if it happens to sit in the tree.
  const filtered = files.filter((f) => path.resolve(dir, f.name) !== outAbs);

  // Same gates the installer enforces, surfaced locally.
  let total = 0;
  for (const f of filtered) {
    if (NATIVE_RE.test(f.name)) throw new Error(`native binaries are not allowed: ${f.name}`);
    if (f.data.length > MAX_FILE) throw new Error(`file too large (>25MB): ${f.name}`);
    total += f.data.length;
  }
  if (total > MAX_TOTAL) throw new Error('archive exceeds the 50MB limit');
  if (filtered.length > MAX_ENTRIES) throw new Error('too many files (>4000)');
  if (!filtered.some((f) => f.name === 'trek-plugin.json')) throw new Error('trek-plugin.json must be at the plugin root');

  const buf = makeZip(filtered);
  fs.writeFileSync(outAbs, buf);
  return {
    artifact: outAbs,
    sha256: createHash('sha256').update(buf).digest('hex'),
    size: buf.length,
    files: filtered.map((f) => f.name).sort(),
  };
}
