#!/usr/bin/env node
/**
 * `trek-plugin <command>` — the plugin author CLI (#plugins).
 *
 *   create [name] [--type t] [--interactive]   scaffold a plugin (wizard if no name)
 *   dev [dir] [--port 4317]                     run locally with hot reload
 *   validate [dir]                              check the manifest + layout
 *   pack [dir] [--out plugin.zip] [--json]      build plugin.zip, print sha256 + size
 *   keygen [--key file]                         create an Ed25519 signing key
 *   sign [zip] [--key file]                      print a signature + public key for an artifact
 *   entry --repo o/n --tag vX [--zip z]         print the ready-to-PR registry entry
 *         [--merge entry.json] [--sign [key]] [--out f]
 *   preflight [dir] --repo o/n --tag vX         run the registry CI checks locally
 *   submit [dir] --repo o/n --tag vX            open the registry PR for you
 *         [--sign [key]] [--registry o/n] [--draft]
 *   release [dir] --repo o/n --tag vX           pack -> gh release -> print entry
 *         [--sign [key]] [--merge entry.json]
 *   publish [dir] --repo o/n --tag vX           the lot: pack -> tag+release ->
 *         [--sign [key]] [--no-preflight]        preflight -> open the registry PR
 *
 * The goal: create -> dev -> publish, and never hand-compute sha256/size/commitSha
 * or hand-write the registry JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validatePluginDir } from './validate.js';
import { packPluginDir } from './pack.js';
import { buildEntry } from './entry.js';
import { scaffold, interactiveScaffold } from './create.js';
import { runDev } from './dev.js';
import { preflight } from './preflight.js';
import { submitEntry } from './submit.js';
import { publishPlugin } from './publish.js';
import { generateKeypair, loadPrivateKey, signArtifact, publicKeyBase64, defaultKeyPath } from './sign.js';
import { readJsonFile } from './json.js';

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

/** --sign, --sign <keyfile>, or absent → the key path to sign with (or undefined). */
function signKey(): string | undefined {
  if (!flags.sign) return undefined;
  return flags.sign === 'true' ? (flags.key || defaultKeyPath()) : flags.sign;
}

async function main(): Promise<void> {
  if (cmd === 'create') {
    const name = pos[0];
    if (!name || flags.interactive) {
      const created = await interactiveScaffold(process.cwd(), name);
      console.log(`\nCreated ${created}/ — build server/index.js, add docs/screenshot.png, then \`npx trek-plugin-sdk dev ${created}\`.`);
      return;
    }
    scaffold(name, flags.type || 'integration', process.cwd(), {
      author: flags.author, description: flags.description,
      permissions: flags.permissions ? flags.permissions.split(/[\s,]+/).filter(Boolean) : undefined,
    });
    console.log(`Created ${name}/ — build server/index.js, add docs/screenshot.png, then \`npx trek-plugin-sdk dev ${name}\`.`);
  } else if (cmd === 'dev') {
    await runDev(pos[0] || '.', { port: flags.port ? Number(flags.port) : undefined });
  } else if (cmd === 'validate') {
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
      console.log('\nUpload this plugin.zip to your release, then run `npx trek-plugin-sdk entry` to generate the registry entry.');
    }
  } else if (cmd === 'keygen') {
    const keyPath = flags.key || defaultKeyPath();
    const { publicKey } = generateKeypair(keyPath);
    console.log(`Signing key written to ${keyPath} (keep it safe + BACK IT UP — losing it means you can't ship signed updates).`);
    console.log(`\nauthorPublicKey (goes in your registry entry): ${publicKey}`);
    console.log('\nSign releases with `npx trek-plugin-sdk release --sign` (or `entry --sign`).');
  } else if (cmd === 'sign') {
    const zip = pos[0] || 'plugin.zip';
    if (!fs.existsSync(zip)) fail(`artifact not found: ${zip} — run \`npx trek-plugin-sdk pack\` first`);
    const key = loadPrivateKey(flags.key || defaultKeyPath());
    const buf = fs.readFileSync(zip);
    console.log(`signature:        ${signArtifact(buf, key)}`);
    console.log(`authorPublicKey:  ${publicKeyBase64(key)}`);
  } else if (cmd === 'entry') {
    if (!flags.repo || !flags.tag) fail('entry needs --repo <owner/name> and --tag <vX.Y.Z>');
    const entry = buildEntry({
      dir: flags.dir || pos[0] || '.',
      repo: flags.repo, tag: flags.tag,
      zipPath: flags.zip || 'plugin.zip',
      commit: flags.commit, asset: flags.asset, mergePath: flags.merge,
      signKeyPath: signKey(),
      now: new Date().toISOString(),
    });
    const json = JSON.stringify(entry, null, 2) + '\n';
    if (flags.out) {
      fs.writeFileSync(flags.out, json);
      console.error(`Wrote ${flags.out} — add it as registry/plugins/${entry.id}.json in a TREK-Plugins PR.`);
    } else {
      process.stdout.write(json);
    }
  } else if (cmd === 'preflight') {
    const entry = flags.entry
      ? readJsonFile<ReturnType<typeof buildEntry>>(flags.entry)
      : (flags.repo && flags.tag
        ? buildEntry({ dir: pos[0] || '.', repo: flags.repo, tag: flags.tag, zipPath: flags.zip || 'plugin.zip', commit: flags.commit, signKeyPath: signKey(), now: new Date().toISOString() })
        : fail('preflight needs --repo <owner/name> --tag <vX>, or --entry <file.json>'));
    console.error('Running registry CI checks over the network…\n');
    const rep = await preflight(entry, { all: !!flags.all });
    for (const p of rep.passed) console.error('  ✓ ' + p);
    for (const f of rep.failures) console.error('  ✗ ' + f);
    if (!rep.ok) { console.error(`\n${rep.failures.length} check(s) would fail CI — fix these before submitting.`); process.exit(1); }
    console.error('\n✓ all checks passed — this entry should sail through CI.');
  } else if (cmd === 'publish') {
    if (!flags.repo || !flags.tag) fail('publish needs --repo <owner/name> and --tag <vX.Y.Z>');
    const { prUrl } = await publishPlugin({
      dir: pos[0] || '.', repo: flags.repo, tag: flags.tag,
      signKeyPath: signKey(), registry: flags.registry, draft: !!flags.draft,
      notes: flags.notes, skipPreflight: !!flags['no-preflight'], now: new Date().toISOString(),
    });
    console.error('\n✓ published — registry PR:');
    console.log(prUrl);
  } else if (cmd === 'submit') {
    if (!flags.repo || !flags.tag) fail('submit needs --repo <owner/name> and --tag <vX.Y.Z>');
    const entry = buildEntry({
      dir: pos[0] || '.', repo: flags.repo, tag: flags.tag,
      zipPath: flags.zip || 'plugin.zip', commit: flags.commit, signKeyPath: signKey(),
      now: new Date().toISOString(),
    });
    console.error(`Opening a registry PR for ${entry.id} ${entry.versions[0].version}…`);
    const { prUrl } = submitEntry(entry, { registry: flags.registry, branch: flags.branch, draft: !!flags.draft, keep: !!flags.keep });
    console.log(prUrl);
  } else if (cmd === 'release') {
    if (!flags.repo || !flags.tag) fail('release needs --repo <owner/name> and --tag <vX.Y.Z>');
    const dir = pos[0] || '.';
    const zip = path.resolve(dir, flags.out || 'plugin.zip');
    const packed = packPluginDir(dir, zip);
    console.error(`Packed ${packed.files.length} files (${packed.size} bytes).`);
    console.error(`Creating GitHub release ${flags.tag} on ${flags.repo}…`);
    execFileSync('gh', ['release', 'create', flags.tag, packed.artifact, '--repo', flags.repo, '--title', flags.tag, '--notes', flags.notes || `Release ${flags.tag}`], { stdio: 'inherit' });
    const entry = buildEntry({ dir, repo: flags.repo, tag: flags.tag, zipPath: packed.artifact, commit: flags.commit, mergePath: flags.merge, signKeyPath: signKey(), now: new Date().toISOString() });
    console.error('\nRegistry entry (add as registry/plugins/' + entry.id + '.json in a TREK-Plugins PR, or run `npx trek-plugin-sdk submit`):\n');
    process.stdout.write(JSON.stringify(entry, null, 2) + '\n');
  } else {
    console.error('usage: trek-plugin <create|dev|validate|pack|keygen|sign|entry|preflight|submit|release|publish> [...]');
    process.exit(2);
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
