#!/usr/bin/env node
/**
 * `trek-plugin <command>` — the plugin author CLI (#plugins).
 *
 * This file is the ROUTER, and nothing more: it parses flags, decides interactive vs not, and
 * hands off. The per-command help lives in ./help.ts (single source of truth, so `--help` and the
 * docs cannot drift), and the rules every command is judged by live in ./checks/.
 *
 * The path is four commands — create → dev → status → publish. The other nine are steps one of
 * those already does, and are listed under "Also" rather than presented as things you must learn.
 *
 * The goal: never hand-compute sha256/size/commitSha, never hand-write the registry JSON, and
 * never discover a problem after the release that pins it has been cut.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { packPluginDir } from './pack.js';
import { buildEntry } from './entry.js';
import { scaffold, interactiveScaffold, nextStepsAfterCreate, type WidgetSlot } from './create.js';
import { runDev } from './dev.js';
import { runStatus } from './status.js';
import { runShot } from './shot.js';
import { preflight } from './preflight.js';
import { submitEntry } from './submit.js';
import { publishPlugin } from './publish.js';
import { loadContext } from './checks/context.js';
import { runOffline } from './checks/index.js';
import { renderPlain } from './checks/report.js';
import { topLevelHelp, commandHelp, VERSION_LINE } from './help.js';
import { inspectSigning, proposeSigning, type SigningState } from './signing.js';
import { generateKeypair, loadPrivateKey, signArtifact, publicKeyBase64, defaultKeyPath } from './sign.js';
import { readJsonFile } from './json.js';
import {
  isInteractive, intro, outro, note, logInfo, logSuccess, logWarn, logError, spinner,
  promptText, promptConfirm, clackLogSink, missingArgs,
} from './ui.js';
import { runMenu } from './menu.js';
import { notifySdkUpdate } from './update-notice.js';

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

/**
 * Every flag each command reads. `parse()` accepts any `--x`, so a flag a command
 * does NOT read used to be silently dropped — `create --template notification-channel`
 * cheerfully scaffolded a blank plugin. Silently ignoring an author's explicit
 * instruction is worse than refusing it, so unknown flags are now an error.
 */
const COMMAND_FLAGS: Record<string, readonly string[]> = {
  create: ['type', 'interactive', 'author', 'description', 'permissions', 'template', 'egress', 'required-addons', 'icon', 'slot'],
  dev: ['port'],
  status: [],
  shot: ['port', 'out', 'dark', 'no-serve'],
  validate: [],
  pack: ['out', 'json'],
  keygen: ['key'],
  sign: ['key'],
  entry: ['repo', 'tag', 'dir', 'zip', 'commit', 'asset', 'merge', 'sign', 'key', 'out'],
  preflight: ['repo', 'tag', 'entry', 'zip', 'commit', 'sign', 'key', 'all', 'registry'],
  submit: ['repo', 'tag', 'zip', 'commit', 'sign', 'key', 'registry', 'branch', 'draft', 'keep'],
  release: ['repo', 'tag', 'out', 'notes', 'commit', 'merge', 'sign', 'key'],
  publish: ['repo', 'tag', 'sign', 'key', 'registry', 'draft', 'notes', 'no-preflight', 'no-checks', 'force'],
};

function assertKnownFlags(command: string, f: Flags): void {
  const known = COMMAND_FLAGS[command];
  if (!known) return;
  const unknown = Object.keys(f).filter((k) => !known.includes(k));
  if (unknown.length) {
    const list = unknown.map((u) => `--${u}`).join(', ');
    fail(`unknown flag${unknown.length > 1 ? 's' : ''} for \`${command}\`: ${list}\n       ${command} accepts: ${known.map((k) => '--' + k).join(', ') || '(none)'}`);
  }
}

/** `--egress a,b` / `--permissions "a b"` → a string[]. */
function listFlag(v: string | undefined): string[] | undefined {
  if (!v || v === 'true') return undefined;
  const parts = v.split(/[\s,]+/).filter(Boolean);
  return parts.length ? parts : undefined;
}

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

const USAGE = 'usage: trek-plugin <create|dev|status|publish|...>   (`trek-plugin help` for the full list)';

/** The SDK's own version, for `--version` and the help banner. */
function sdkVersion(): string {
  try {
    const pkg = readJsonFile<{ version?: string }>(path.join(import.meta.dirname, '..', '..', 'package.json'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function main(): Promise<void> {
  // Advisory only (update-notifier): prints from cache on stderr, refreshes in the
  // background, never blocks. `dev` never returns, so this runs up front.
  notifySdkUpdate();

  // `--version` used to fall through to the `else` branch and print the usage line with exit 2,
  // which is a strange way to answer a question every CLI is expected to answer.
  if (cmd === 'version' || cmd === '--version' || cmd === '-v') {
    console.log(VERSION_LINE(sdkVersion()));
    return;
  }

  // Handled before dispatch, so assertKnownFlags never sees `--help` and rejects it as unknown.
  // Help is not an error: it goes to stdout and exits 0.
  //   trek-plugin help            the path, plus where to find everything else
  //   trek-plugin help <cmd>      that command's own page
  //   trek-plugin <cmd> --help    the same page — this is what people actually type
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    const topic = pos[0];
    if (topic) {
      const page = commandHelp(topic);
      if (!page) fail(`no such command: ${topic}\n       ${USAGE}`);
      console.log(page);
      return;
    }
    console.log(topLevelHelp(sdkVersion()));
    return;
  }
  if (cmd && flags.help) {
    const page = commandHelp(cmd);
    if (!page) fail(`no such command: ${cmd}\n       ${USAGE}`);
    console.log(page);
    return;
  }

  if (!cmd) {
    // Bare invocation: a menu in a terminal, the usage line for scripts.
    if (!isInteractive()) { console.error(USAGE); process.exit(2); }
    const chosen = await runMenu();
    if (chosen) {
      // The menu used to dispatch with EMPTY positionals, so picking "Validate" or "Pack"
      // silently ran against the cwd — which is very often not a plugin at all. Ask.
      const dir = await promptPluginDir(chosen);
      await dispatch(chosen, {}, dir ? [dir] : []);
    }
    return;
  }
  await dispatch(cmd, flags, pos);
}

/** The plugin's id, or '' if this isn't a plugin directory. Never throws — the caller has better errors. */
function readPluginId(dir: string): string {
  try {
    const m = readJsonFile<{ id?: unknown }>(path.join(path.resolve(dir), 'trek-plugin.json'));
    return typeof m.id === 'string' ? m.id : '';
  } catch {
    return '';
  }
}

/** Commands that operate on a plugin directory, and so need one when the menu launched them. */
const DIR_COMMANDS = new Set(['dev', 'status', 'validate', 'pack', 'shot', 'publish', 'preflight', 'submit', 'release']);

async function promptPluginDir(command: string): Promise<string | undefined> {
  if (!DIR_COMMANDS.has(command)) return undefined;
  // If the cwd IS a plugin, that is overwhelmingly what was meant — don't make them type a dot.
  if (fs.existsSync(path.join(process.cwd(), 'trek-plugin.json'))) return undefined;
  const dir = await promptText({
    message: 'Which plugin directory?',
    placeholder: './my-plugin',
    defaultValue: '.',
    validate: (v) => {
      const d = (v || '.').trim();
      if (!fs.existsSync(d)) return `${d} does not exist`;
      if (!fs.existsSync(path.join(d, 'trek-plugin.json'))) return `${d} has no trek-plugin.json`;
      return undefined;
    },
  });
  return dir.trim() || '.';
}

async function dispatch(command: string, f: Flags, positional: string[]): Promise<void> {
  const tui = isInteractive();
  assertKnownFlags(command, f);
  if (command === 'create') {
    const name = positional[0];
    if (!name || f.interactive) {
      if (!tui) fail('create needs a plugin name in non-interactive mode: create <name> [--type integration|page|widget|trip-page]');
      await interactiveScaffold(process.cwd(), name);
      return;
    }
    scaffold(name, f.type || 'integration', process.cwd(), {
      author: f.author, description: f.description,
      permissions: listFlag(f.permissions),
      egress: listFlag(f.egress),
      requiredAddons: listFlag(f['required-addons']),
      template: f.template as 'blank' | 'notification-channel' | undefined,
      icon: f.icon,
      slot: f.slot as WidgetSlot | undefined,
    });
    // The SAME text the wizard and the `create-trek-plugin` bin print. These three used to
    // name three different next commands.
    console.log(nextStepsAfterCreate(path.join(process.cwd(), name)));
  } else if (command === 'dev') {
    if (tui) intro(`trek-plugin dev — ${positional[0] || '.'}`);
    await runDev(positional[0] || '.', { port: f.port ? Number(f.port) : undefined });
  } else if (command === 'status') {
    // Never exits non-zero: `status` is for orientation, not gating. A command you are afraid
    // to run because it might fail your build is not one you reach for when you are stuck.
    const r = runStatus(positional[0] || '.', { colour: tui });
    console.log(r.text);
  } else if (command === 'shot') {
    const dir = positional[0] || '.';
    if (tui) {
      const s = spinner();
      s.start('Rendering your plugin');
      try {
        const r = await runShot(dir, { port: f.port ? Number(f.port) : undefined, out: f.out, dark: !!f.dark, noServe: !!f['no-serve'] });
        s.stop(`Wrote ${path.relative(process.cwd(), r.out) || r.out} (${r.width}×${r.height})`);
        outro('next →  trek-plugin status');
      } catch (e) {
        s.stop('Could not take the screenshot');
        throw e;
      }
    } else {
      const r = await runShot(dir, { port: f.port ? Number(f.port) : undefined, out: f.out, dark: !!f.dark, noServe: !!f['no-serve'] });
      console.log(`Wrote ${r.out} (${r.width}×${r.height})`);
    }
  } else if (command === 'validate') {
    const report = runOffline(loadContext(positional[0] || '.'));
    const text = renderPlain(report);
    if (text) console.error(text);
    if (!report.ok) {
      // Don't just fail — say where to see the whole picture.
      console.error(`\n${report.errors.length} of these would be rejected by the registry. \`trek-plugin status\` shows the full checklist.`);
      process.exit(1);
    }
    if (tui) outro('✓ plugin is valid'); else console.log('✓ plugin is valid');
  } else if (command === 'pack') {
    const r = packPluginDir(positional[0] || '.', f.out || 'plugin.zip');
    const rel = path.relative(process.cwd(), r.artifact) || r.artifact;
    if (f.json) {
      console.log(JSON.stringify(r, null, 2)); // machine output — never decorated
    } else if (tui) {
      note([...r.files, '', `sha256: ${r.sha256}`, `size:   ${r.size}`].join('\n'), `Packed ${r.files.length} files → ${rel}`);
      // This used to point at `entry` — the low-level, assemble-the-PR-by-hand path — rather than
      // at `publish`, which does the release, the entry and the PR and gets the ORDER right.
      logInfo('Install this into a local TREK to try it. To ship it: `trek-plugin publish`.');
    } else {
      console.log(`Packed ${r.files.length} files -> ${rel}`);
      for (const file of r.files) console.log('  ' + file);
      console.log(`\nsha256: ${r.sha256}\nsize:   ${r.size}`);
      console.log('\nInstall this into a local TREK to try it. To ship it: `trek-plugin publish --repo <owner/name> --tag <vX.Y.Z>`.');
    }
  } else if (command === 'keygen') {
    const keyPath = f.key || defaultKeyPath();
    const { publicKey } = generateKeypair(keyPath);
    if (tui) {
      note(`Signing key written to ${keyPath}\nKeep it safe + BACK IT UP — losing it means you can't ship signed updates.\n\nauthorPublicKey (goes in your registry entry):\n${publicKey}`, 'Signing key');
      logInfo('`trek-plugin publish` will now offer to sign with this key — you do not need to pass --sign.');
    } else {
      console.log(`Signing key written to ${keyPath} (keep it safe + BACK IT UP — losing it means you can't ship signed updates).`);
      console.log(`\nauthorPublicKey (goes in your registry entry): ${publicKey}`);
      console.log('\nPass --sign to `trek-plugin publish` to sign a release with it (interactively, publish offers).');
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
    const dir = positional[0] || '.';

    // Signing used to be a flag you had to already know about, with `keygen` buried under
    // "Advanced…" — so the default path shipped unsigned and never mentioned that signing existed.
    // Offer it, once, at the moment it is actually a decision. A script that did not pass --sign
    // gets exactly the behaviour it always got: prompting a pipeline is how you hang a pipeline.
    let signKeyPath = signKey(f);
    let signing: SigningState | undefined;
    if (tui && !signKeyPath) {
      const id = readPluginId(dir);
      if (id) {
        signing = await inspectSigning(id, { registry: f.registry, keyPath: f.key });
        signKeyPath = await proposeSigning(signing);
      }
    }

    if (tui) {
      note(
        `repo   ${repo}\ntag    ${tag}\ndir    ${dir}\nsign   ${signKeyPath ? `yes (${signKeyPath})` : 'no — unsigned'}`,
        'Publish',
      );
      const ok = await promptConfirm({ message: 'Create the GitHub release and open the registry PR?', initialValue: true });
      if (!ok) { outro('Cancelled — nothing was published.'); return; }
    }
    const { prUrl } = await publishPlugin({
      dir, repo, tag,
      signKeyPath, signing, registry: f.registry, draft: !!f.draft,
      notes: f.notes, skipPreflight: !!f['no-preflight'], skipChecks: !!f['no-checks'], force: !!f.force,
      now: new Date().toISOString(),
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
    console.error(`unknown command: ${command}\n${USAGE}`);
    process.exit(2);
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
