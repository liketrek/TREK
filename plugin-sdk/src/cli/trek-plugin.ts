#!/usr/bin/env node
/**
 * `trek-plugin <command>` — the plugin author CLI (#plugins).
 *
 *   validate [dir]                          check the manifest + layout
 *   pack [dir] [--out plugin.zip] [--json]  build plugin.zip, print sha256 + size
 *   entry --repo o/n --tag vX [--zip z]     print the ready-to-PR registry entry
 *         [--merge entry.json] [--out f]
 *   release [dir] --repo o/n --tag vX       pack -> gh release -> print entry
 *
 * The goal: an author runs `pack` then `entry` (or a single `release`) and never
 * hand-computes sha256/size/commitSha or hand-writes the registry JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validatePluginDir } from './validate.js';
import { packPluginDir } from './pack.js';
import { buildEntry } from './entry.js';

const [cmd, ...args] = process.argv.slice(2);

function parse(a: string[]): { flags: Record<string, string>; pos: string[] } {
  const flags: Record<string, string> = {};
  const pos: string[] = [];
  for (let i = 0; i < a.length; i++) {
    const t = a[i];
    if (t.startsWith('--')) {
      const next = a[i + 1];
      flags[t.slice(2)] = next !== undefined && !next.startsWith('--') ? (i++, next) : 'true';
    } else pos.push(t);
  }
  return { flags, pos };
}

function fail(msg: string): never {
  console.error('error: ' + msg);
  process.exit(1);
}

const { flags, pos } = parse(args);

try {
  if (cmd === 'validate') {
    const r = validatePluginDir(pos[0] || '.');
    for (const w of r.warnings) console.warn('warning: ' + w);
    if (!r.ok) { for (const e of r.errors) console.error('error: ' + e); process.exit(1); }
    console.log('✓ plugin is valid');
  } else if (cmd === 'pack') {
    const r = packPluginDir(pos[0] || '.', flags.out || 'plugin.zip');
    if (flags.json) {
      console.log(JSON.stringify(r, null, 2));
    } else {
      console.log(`Packed ${r.files.length} files -> ${path.relative(process.cwd(), r.artifact) || r.artifact}`);
      for (const f of r.files) console.log('  ' + f);
      console.log(`\nsha256: ${r.sha256}\nsize:   ${r.size}`);
      console.log('\nUpload this plugin.zip to your release, then run `trek-plugin entry` to generate the registry entry.');
    }
  } else if (cmd === 'entry') {
    if (!flags.repo || !flags.tag) fail('entry needs --repo <owner/name> and --tag <vX.Y.Z>');
    const entry = buildEntry({
      dir: flags.dir || pos[0] || '.',
      repo: flags.repo, tag: flags.tag,
      zipPath: flags.zip || 'plugin.zip',
      commit: flags.commit, asset: flags.asset, mergePath: flags.merge,
      now: new Date().toISOString(),
    });
    const json = JSON.stringify(entry, null, 2) + '\n';
    if (flags.out) {
      fs.writeFileSync(flags.out, json);
      console.error(`Wrote ${flags.out} — add it as registry/plugins/${entry.id}.json in a TREK-Plugins PR.`);
    } else {
      process.stdout.write(json);
    }
  } else if (cmd === 'release') {
    if (!flags.repo || !flags.tag) fail('release needs --repo <owner/name> and --tag <vX.Y.Z>');
    const dir = pos[0] || '.';
    const zip = path.resolve(dir, flags.out || 'plugin.zip');
    const packed = packPluginDir(dir, zip);
    console.error(`Packed ${packed.files.length} files (${packed.size} bytes).`);
    console.error(`Creating GitHub release ${flags.tag} on ${flags.repo}…`);
    execFileSync('gh', ['release', 'create', flags.tag, packed.artifact, '--repo', flags.repo, '--title', flags.tag, '--notes', flags.notes || `Release ${flags.tag}`], { stdio: 'inherit' });
    const entry = buildEntry({ dir, repo: flags.repo, tag: flags.tag, zipPath: packed.artifact, commit: flags.commit, mergePath: flags.merge, now: new Date().toISOString() });
    console.error('\nRegistry entry (add as registry/plugins/' + entry.id + '.json in a TREK-Plugins PR):\n');
    process.stdout.write(JSON.stringify(entry, null, 2) + '\n');
  } else {
    console.error('usage: trek-plugin <validate|pack|entry|release> [...]');
    process.exit(2);
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
