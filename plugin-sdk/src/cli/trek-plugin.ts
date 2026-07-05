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
import {
  isInteractive, intro, outro, note, logInfo, logSuccess, logWarn, logError, spinner,
  promptText, promptConfirm, clackLogSink, missingArgs,
} from './ui.js';
import { runMenu } from './menu.js';

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

type Flags = Record<string, string>;

/** --sign, --sign <keyfile>, or absent → the key path to sign with (or undefined). */
function signKey(f: Flags): string | undefined {
  if (!f.sign) return undefined;
  return f.sign === 'true' ? (f.key || defaultKeyPath()) : f.sign;
}

/**
 * Resolve the repo + tag every publishing command needs. Interactive: prompt for
 * whatever is missing. Non-interactive: reproduce the command's exact error so
 * scripts/CI behave exactly as before.
 */
async function ensureRepoTag(f: Flags, failMsg: string): Promise<{ repo: string; tag: string }> {
  if (missingArgs(f, ['repo', 'tag']).length === 0) return { repo: f.repo, tag: f.tag };
  if (!isInteractive()) fail(failMsg);
  const repo = f.repo || await promptText({
    message: 'GitHub repo (owner/name)', placeholder: 'you/trek-plugin-thing',
    validate: (v) => (/^[^/\s]+\/[^/\s]+$/.test((v ?? '').trim()) ? undefined : 'format: owner/name'),
  });
  const tag = f.tag || await promptText({
    message: 'Release tag', placeholder: 'v1.0.0',
    validate: (v) => (/^v\d+\.\d+\.\d+/.test((v ?? '').trim()) ? undefined : 'format: vX.Y.Z'),
  });
  return { repo: repo.trim(), tag: tag.trim() };
}

const USAGE = 'usage: trek-plugin <create|dev|validate|pack|keygen|sign|entry|preflight|submit|release|publish> [...]';

async function main(): Promise<void> {
  if (!cmd) {
    // Bare invocation: a menu in a terminal, the usage line for scripts.
    if (!isInteractive()) { console.error(USAGE); process.exit(2); }
    const chosen = await runMenu();
    if (chosen) await dispatch(chosen, {}, []);
    return;
  }
  await dispatch(cmd, flags, pos);
}

async function dispatch(command: string, f: Flags, positional: string[]): Promise<void> {
  const tui = isInteractive();
  if (command === 'create') {
    const name = positional[0];
    if (!name || f.interactive) {
      if (!tui) fail('create needs a plugin name in non-interactive mode: create <name> [--type integration|page|widget]');
      await interactiveScaffold(process.cwd(), name);
      return;
    }
    scaffold(name, f.type || 'integration', process.cwd(), {
      author: f.author, description: f.description,
      permissions: f.permissions ? f.permissions.split(/[\s,]+/).filter(Boolean) : undefined,
    });
    console.log(`Created ${name}/ — build server/index.js, add docs/screenshot.png, then \`npx trek-plugin-sdk dev ${name}\`.`);
  } else if (command === 'dev') {
    if (tui) intro(`trek-plugin dev — ${positional[0] || '.'}`);
    await runDev(positional[0] || '.', { port: f.port ? Number(f.port) : undefined });
  } else if (command === 'validate') {
    const r = validatePluginDir(positional[0] || '.');
    if (tui) {
      for (const w of r.warnings) logWarn(w);
      if (!r.ok) { for (const e of r.errors) logError(e); outro('✗ plugin has errors'); process.exit(1); }
      outro('✓ plugin is valid');
    } else {
      for (const w of r.warnings) console.warn('warning: ' + w);
      if (!r.ok) { for (const e of r.errors) console.error('error: ' + e); process.exit(1); }
      console.log('✓ plugin is valid');
    }
  } else if (command === 'pack') {
    const r = packPluginDir(positional[0] || '.', f.out || 'plugin.zip');
    const rel = path.relative(process.cwd(), r.artifact) || r.artifact;
    if (f.json) {
      console.log(JSON.stringify(r, null, 2)); // machine output — never decorated
    } else if (tui) {
      note([...r.files, '', `sha256: ${r.sha256}`, `size:   ${r.size}`].join('\n'), `Packed ${r.files.length} files → ${rel}`);
      logInfo('Upload plugin.zip to your release, then run `npx trek-plugin-sdk entry`.');
    } else {
      console.log(`Packed ${r.files.length} files -> ${rel}`);
      for (const file of r.files) console.log('  ' + file);
      console.log(`\nsha256: ${r.sha256}\nsize:   ${r.size}`);
      console.log('\nUpload this plugin.zip to your release, then run `npx trek-plugin-sdk entry` to generate the registry entry.');
    }
  } else if (command === 'keygen') {
    const keyPath = f.key || defaultKeyPath();
    const { publicKey } = generateKeypair(keyPath);
    if (tui) {
      note(`Signing key written to ${keyPath}\nKeep it safe + BACK IT UP — losing it means you can't ship signed updates.\n\nauthorPublicKey (goes in your registry entry):\n${publicKey}`, 'Signing key');
      logInfo('Sign releases with `npx trek-plugin-sdk release --sign` (or `entry --sign`).');
    } else {
      console.log(`Signing key written to ${keyPath} (keep it safe + BACK IT UP — losing it means you can't ship signed updates).`);
      console.log(`\nauthorPublicKey (goes in your registry entry): ${publicKey}`);
      console.log('\nSign releases with `npx trek-plugin-sdk release --sign` (or `entry --sign`).');
    }
  } else if (command === 'sign') {
    const zip = positional[0] || 'plugin.zip';
    if (!fs.existsSync(zip)) fail(`artifact not found: ${zip} — run \`npx trek-plugin-sdk pack\` first`);
    const key = loadPrivateKey(f.key || defaultKeyPath());
    const buf = fs.readFileSync(zip);
    if (tui) {
      note(`signature:        ${signArtifact(buf, key)}\nauthorPublicKey:  ${publicKeyBase64(key)}`, `Signed ${zip}`);
    } else {
      console.log(`signature:        ${signArtifact(buf, key)}`);
      console.log(`authorPublicKey:  ${publicKeyBase64(key)}`);
    }
  } else if (command === 'entry') {
    const { repo, tag } = await ensureRepoTag(f, 'entry needs --repo <owner/name> and --tag <vX.Y.Z>');
    const entry = buildEntry({
      dir: f.dir || positional[0] || '.', repo, tag,
      zipPath: f.zip || 'plugin.zip',
      commit: f.commit, asset: f.asset, mergePath: f.merge,
      signKeyPath: signKey(f), now: new Date().toISOString(),
    });
    const json = JSON.stringify(entry, null, 2) + '\n';
    if (f.out) {
      fs.writeFileSync(f.out, json);
      const msg = `Wrote ${f.out} — add it as registry/plugins/${entry.id}.json in a TREK-Plugins PR.`;
      if (tui) logSuccess(msg); else console.error(msg);
    } else {
      process.stdout.write(json); // machine output on stdout — never decorated
    }
  } else if (command === 'preflight') {
    let entry: ReturnType<typeof buildEntry>;
    if (f.entry) {
      entry = readJsonFile<ReturnType<typeof buildEntry>>(f.entry);
    } else {
      const { repo, tag } = await ensureRepoTag(f, 'preflight needs --repo <owner/name> --tag <vX>, or --entry <file.json>');
      entry = buildEntry({ dir: positional[0] || '.', repo, tag, zipPath: f.zip || 'plugin.zip', commit: f.commit, signKeyPath: signKey(f), now: new Date().toISOString() });
    }
    if (tui) {
      const s = spinner(); s.start('Running the registry CI checks over the network');
      const rep = await preflight(entry, { all: !!f.all });
      s.stop('Checks complete');
      for (const p of rep.passed) logSuccess(p);
      for (const fa of rep.failures) logError(fa);
      if (!rep.ok) { outro(`${rep.failures.length} check(s) would fail CI — fix these before submitting.`); process.exit(1); }
      outro('✓ all checks passed — this entry should sail through CI.');
    } else {
      console.error('Running registry CI checks over the network…\n');
      const rep = await preflight(entry, { all: !!f.all });
      for (const p of rep.passed) console.error('  ✓ ' + p);
      for (const fa of rep.failures) console.error('  ✗ ' + fa);
      if (!rep.ok) { console.error(`\n${rep.failures.length} check(s) would fail CI — fix these before submitting.`); process.exit(1); }
      console.error('\n✓ all checks passed — this entry should sail through CI.');
    }
  } else if (command === 'publish') {
    const { repo, tag } = await ensureRepoTag(f, 'publish needs --repo <owner/name> and --tag <vX.Y.Z>');
    if (tui) {
      note(`repo   ${repo}\ntag    ${tag}\ndir    ${positional[0] || '.'}`, 'Publish');
      const ok = await promptConfirm({ message: 'Create the GitHub release and open the registry PR?', initialValue: true });
      if (!ok) { outro('Cancelled — nothing was published.'); return; }
    }
    const { prUrl } = await publishPlugin({
      dir: positional[0] || '.', repo, tag,
      signKeyPath: signKey(f), registry: f.registry, draft: !!f.draft,
      notes: f.notes, skipPreflight: !!f['no-preflight'], now: new Date().toISOString(),
      log: tui ? clackLogSink : undefined,
    });
    if (tui) logSuccess('Published — registry PR:'); else console.error('\n✓ published — registry PR:');
    console.log(prUrl); // machine output on stdout
  } else if (command === 'submit') {
    const { repo, tag } = await ensureRepoTag(f, 'submit needs --repo <owner/name> and --tag <vX.Y.Z>');
    const entry = buildEntry({
      dir: positional[0] || '.', repo, tag,
      zipPath: f.zip || 'plugin.zip', commit: f.commit, signKeyPath: signKey(f), now: new Date().toISOString(),
    });
    if (tui) {
      note(`${entry.id} ${entry.versions[0].version}\nrepo ${repo}`, 'Submit registry PR');
      const ok = await promptConfirm({ message: 'Open the registry PR now?', initialValue: true });
      if (!ok) { outro('Cancelled — no PR opened.'); return; }
      const s = spinner(); s.start('Opening the registry PR');
      const { prUrl } = submitEntry(entry, { registry: f.registry, branch: f.branch, draft: !!f.draft, keep: !!f.keep });
      s.stop('Registry PR opened');
      console.log(prUrl);
    } else {
      console.error(`Opening a registry PR for ${entry.id} ${entry.versions[0].version}…`);
      const { prUrl } = submitEntry(entry, { registry: f.registry, branch: f.branch, draft: !!f.draft, keep: !!f.keep });
      console.log(prUrl);
    }
  } else if (command === 'release') {
    const { repo, tag } = await ensureRepoTag(f, 'release needs --repo <owner/name> and --tag <vX.Y.Z>');
    const dir = positional[0] || '.';
    const zip = path.resolve(dir, f.out || 'plugin.zip');
    if (tui) {
      const packed = packPluginDir(dir, zip);
      note(`packed ${packed.files.length} files (${packed.size} bytes)\nrepo ${repo}\ntag  ${tag}`, 'Release');
      const ok = await promptConfirm({ message: `Create GitHub release ${tag} on ${repo}?`, initialValue: true });
      if (!ok) { outro('Cancelled — no release created.'); return; }
      const s = spinner(); s.start(`Creating GitHub release ${tag}`);
      execFileSync('gh', ['release', 'create', tag, packed.artifact, '--repo', repo, '--title', tag, '--notes', f.notes || `Release ${tag}`], { stdio: 'pipe' });
      s.stop(`Released ${tag} on ${repo}`);
      const entry = buildEntry({ dir, repo, tag, zipPath: packed.artifact, commit: f.commit, mergePath: f.merge, signKeyPath: signKey(f), now: new Date().toISOString() });
      logInfo(`Registry entry (add as registry/plugins/${entry.id}.json, or run \`npx trek-plugin-sdk submit\`):`);
      process.stdout.write(JSON.stringify(entry, null, 2) + '\n');
    } else {
      const packed = packPluginDir(dir, zip);
      console.error(`Packed ${packed.files.length} files (${packed.size} bytes).`);
      console.error(`Creating GitHub release ${tag} on ${repo}…`);
      execFileSync('gh', ['release', 'create', tag, packed.artifact, '--repo', repo, '--title', tag, '--notes', f.notes || `Release ${tag}`], { stdio: 'inherit' });
      const entry = buildEntry({ dir, repo, tag, zipPath: packed.artifact, commit: f.commit, mergePath: f.merge, signKeyPath: signKey(f), now: new Date().toISOString() });
      console.error('\nRegistry entry (add as registry/plugins/' + entry.id + '.json in a TREK-Plugins PR, or run `npx trek-plugin-sdk submit`):\n');
      process.stdout.write(JSON.stringify(entry, null, 2) + '\n');
    }
  } else {
    console.error(USAGE);
    process.exit(2);
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
