#!/usr/bin/env node
/**
 * create-trek-plugin <name> [--type integration|page|widget|trip-page] (#plugins, M6).
 * Scaffolds a working plugin: manifest, an isolated server entry using
 * definePlugin, a README you must fill in, and (page/widget) a starter iframe.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  intro, outro, note, logSuccess, logWarn, spinner,
  promptText, promptSelect, promptMultiselect, promptConfirm,
  PERMISSION_CATALOG,
} from './ui.js';
import { KNOWN_ADDONS } from '../manifest.js';

/** This package's own version, for the scaffold's devDependency range. */
function sdkVersionRange(): string {
  try {
    const pkg = createRequire(import.meta.url)('../../package.json') as { version?: string };
    return pkg.version ? `^${pkg.version}` : '^1';
  } catch {
    return '^1';
  }
}

export interface ScaffoldOptions {
  author?: string;
  description?: string;
  permissions?: string[];
  /** External hosts the plugin may call — required by the manifest when `http:outbound` is granted. */
  egress?: string[];
  /** Addon ids that must be enabled for this plugin to activate. */
  requiredAddons?: string[];
  /** Other plugins this one depends on, each pinned by a semver range. */
  pluginDependencies?: Array<{ id: string; version: string }>;
}

export function scaffold(name: string, type: string, targetDir: string, opts: ScaffoldOptions = {}): void {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(name)) throw new Error(`invalid plugin id "${name}" (lowercase slug, 3–40 chars)`);
  if (!['integration', 'page', 'widget', 'trip-page'].includes(type)) throw new Error(`invalid type "${type}"`);

  const root = path.join(targetDir, name);
  if (fs.existsSync(root)) throw new Error(`${root} already exists`);
  fs.mkdirSync(path.join(root, 'server'), { recursive: true });

  const perms = opts.permissions?.length ? opts.permissions : ['db:own'];
  const manifest: Record<string, unknown> = {
    id: name,
    name: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    version: '1.0.0',
    apiVersion: 1,
    author: opts.author || 'Your Name',
    description: opts.description || 'Describe what your plugin does.',
    type,
    trek: '>=3.2.1 <4.0.0',
    nativeModules: false,
    permissions: perms,
    // Dependency declarations (empty by default). `requiredAddons` lists addon ids
    // that must be enabled to activate; `pluginDependencies` lists other plugins
    // ({ id, version-range }) that must be installed + satisfied first.
    requiredAddons: opts.requiredAddons ?? [],
    pluginDependencies: opts.pluginDependencies ?? [],
    routes: [{ method: 'GET', path: '/hello', auth: true }],
  };
  if (opts.egress?.length) manifest.egress = opts.egress;
  if (type === 'page') manifest.capabilities = { nav: { label: manifest.name, icon: 'Blocks', position: 'main' } };
  if (type === 'widget') manifest.capabilities = { widget: { title: manifest.name, defaultSize: 'medium' } };

  fs.writeFileSync(path.join(root, 'trek-plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'server', 'index.js'), SERVER_JS(perms.includes('db:own')));
  fs.writeFileSync(path.join(root, 'README.md'), readme(name, opts.description ?? '> One sentence: what this plugin does.', perms));
  // `type: commonjs` pins how the entry is parsed everywhere (dev, tests, TREK);
  // the SDK is a devDependency ONLY (types + mock host) — at runtime both the
  // dev server and TREK inject it, so it is never vendored into the artifact.
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name,
    version: '1.0.0',
    private: true,
    type: 'commonjs',
    scripts: { dev: 'npx -y trek-plugin-sdk dev', pack: 'npx -y trek-plugin-sdk pack' },
    devDependencies: { 'trek-plugin-sdk': sdkVersionRange() },
  }, null, 2) + '\n');
  if (type !== 'integration') {
    fs.mkdirSync(path.join(root, 'client'), { recursive: true });
    fs.writeFileSync(path.join(root, 'client', 'index.html'), CLIENT_HTML);
  }
}

const SERVER_JS = (has_db: boolean) => `// Built plugin entry — runs in an isolated child process.
const { definePlugin } = require('trek-plugin-sdk');

module.exports = definePlugin({
  async onLoad(ctx) {
    ${has_db ? 'await ctx.db.migrate(\'001_init\', \'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)\');' : ''}
    ctx.log.info('plugin loaded');
  },
  routes: [
    {
      method: 'GET', path: '/hello', auth: true,
      async handler(req, ctx) {
        return { status: 200, headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ hello: req.user && req.user.username }) };
      },
    },
  ],
});
`;

// The `<!-- trek:ui -->` marker is expanded by `dev` and `pack` into the inlined
// design kit (native styles + a `window.trek` bridge). The source stays this one
// line, so the starter is already themed, glassy and wired on first run.
const CLIENT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Plugin</title>
  <!-- trek:ui -->
</head>
<body>
  <div class="trek-glass trek-stack" style="margin: 16px">
    <div class="trek-title">Your plugin</div>
    <p class="trek-muted" id="hello">Click below to call your /hello route.</p>
    <div class="trek-cluster">
      <button class="trek-btn trek-btn--primary" id="ping">Say hello</button>
      <span class="trek-chip trek-chip--accent" id="who">not connected</span>
    </div>
  </div>
  <script>
    // The design kit is inlined above (window.trek + native styles). The frame is
    // sandboxed at an opaque origin — reach TREK only through window.trek.
    trek.onContext(function (ctx) {
      document.getElementById('who').textContent = (ctx.user ? ctx.user.name + ' \\u00b7 ' : '') + ctx.theme;
    });
    document.getElementById('ping').addEventListener('click', async function () {
      try {
        var data = await trek.invoke('/hello');
        document.getElementById('hello').textContent = 'Hello, ' + ((data && data.hello) || 'traveller') + '!';
      } catch (e) {
        trek.notify('error', e.message);
      }
    });
  </script>
</body>
</html>
`;

/** One markdown table row per granted scope, with the catalog's description as the "Why". */
function permissionRows(scopes: string[]): string {
  const rows = (scopes.length ? scopes : ['db:own']).map(
    (s) => `| \`${s}\` | 'Describe why this plugin needs it.' |`,
  );
  return rows.join('\n');
}

function readme(name: string, description: string, scopes: string[]): string {
  return `# ${name}

${description}

![screenshot](./docs/screenshot.png)

## What it does

Describe the feature this plugin adds to TREK.

## Screenshots

Show it in context. Commit a \`docs/screenshot.png\` — it's what the store card
shows. A 16:9 image (e.g. 1600×900) with your plugin centred and some margin
looks best (the card crops the edges).

## Permissions

| Permission | Why |
|---|---|
${permissionRows(scopes)}

## Setup

How to configure it.

## License

Your plugin is your own code — license it however you like; TREK does not impose
one. Replace this line with your license (for example, MIT).
`;
}

const SLUG = /^[a-z][a-z0-9-]{2,39}$/;

/** Resolve a user-typed directory: expand a leading `~`, then make it absolute. */
function resolveDir(input: string): string {
  const raw = (input || '.').trim();
  const expanded = raw === '~' || raw.startsWith('~/') ? path.join(os.homedir(), raw.slice(1)) : raw;
  return path.resolve(expanded);
}

/** True when `dir` sits inside an existing git work tree (so we don't offer to nest a repo). */
function insideGitRepo(dir: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Interactive scaffold: a Clack wizard that collects the details, writes the
 * plugin, and offers to set up git + install deps. Returns the created plugin id.
 * Only ever called when stdout is a TTY (the dispatcher guards this).
 */
export async function interactiveScaffold(defaultDir: string, presetName?: string): Promise<string> {
  intro('create-trek-plugin');

  const id = presetName && SLUG.test(presetName)
    ? presetName
    : await promptText({
        message: 'Plugin id',
        placeholder: 'flight-tracker',
        initialValue: presetName ?? '',
        validate: (v) => (SLUG.test((v ?? '').trim()) ? undefined : 'lowercase slug, 3–40 chars (e.g. flight-tracker)'),
      }).then((v) => v.trim());

  const location = await promptText({
    message: 'Where should the plugin be created?',
    placeholder: `. (creates ./${id}/ here)`,
    defaultValue: defaultDir,
    validate: (v) => (fs.existsSync(path.join(resolveDir(v || defaultDir), id))
      ? `${path.join(v || '.', id)} already exists`
      : undefined),
  });
  const parentDir = resolveDir(location || defaultDir);
  const dest = path.join(parentDir, id);

  const type = await promptSelect<string>({
    message: 'What kind of plugin is this?',
    initialValue: 'integration',
    options: [
      { value: 'integration', label: 'integration', hint: 'server-only: routes, hooks, background work' },
      { value: 'page', label: 'page', hint: 'adds a full navigation page (sandboxed iframe UI)' },
      { value: 'widget', label: 'widget', hint: 'adds a dashboard widget (sandboxed iframe UI)' },
      { value: 'trip-page', label: 'trip-page', hint: 'adds a tab inside every trip (sandboxed iframe UI)' },
    ],
  });

  const author = await promptText({ message: 'Author', placeholder: 'Your Name', defaultValue: 'Your Name' });
  const description = await promptText({
    message: 'One-line description',
    placeholder: 'Describe what your plugin does.',
    defaultValue: 'Describe what your plugin does.',
  });

  const permissions = await promptMultiselect<string>({
    message: 'Which permissions does it need?',
    options: PERMISSION_CATALOG.map((p) => ({ value: p.value, label: p.label, hint: p.hint })),
    initialValues: ['db:own'],
    required: false,
  });

  let egress: string[] | undefined;
  if (permissions.includes('http:outbound')) {
    const raw = await promptText({
      message: 'External hosts it may call (comma-separated)',
      placeholder: 'api.example.com, api.other.com',
      validate: (v) => ((v ?? '').split(',').map((s) => s.trim()).filter(Boolean).length ? undefined : 'list at least one host'),
    });
    egress = raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const requiredAddons = await promptMultiselect<string>({
    message: 'Requires any TREK addons enabled? (optional — the plugin can only activate when these are on)',
    options: KNOWN_ADDONS.map((a) => ({ value: a, label: a })),
    initialValues: [],
    required: false,
  });

  note(
    [
      `id           ${id}`,
      `type         ${type}`,
      `location     ${dest}`,
      `author       ${author}`,
      `permissions  ${permissions.join(', ') || '(none)'}`,
      egress ? `egress       ${egress.join(', ')}` : undefined,
      requiredAddons.length ? `addons       ${requiredAddons.join(', ')}` : undefined,
    ].filter(Boolean).join('\n'),
    'Review',
  );

  const confirmed = await promptConfirm({ message: `Create the plugin at ${dest}?`, initialValue: true });
  if (!confirmed) {
    outro('Cancelled — nothing was written.');
    process.exit(0);
  }

  scaffold(id, type, parentDir, { author, description, permissions, egress, requiredAddons });
  logSuccess(`Created ${dest}`);

  if (!insideGitRepo(parentDir)) {
    const doGit = await promptConfirm({ message: 'Initialize a git repository?', initialValue: true });
    if (doGit) {
      try {
        execFileSync('git', ['init'], { cwd: dest, stdio: 'ignore' });
        logSuccess('Initialized a git repository');
      } catch {
        logWarn('Could not initialize git — run `git init` yourself later.');
      }
    }
  }

  const doInstall = await promptConfirm({ message: 'Install dependencies now?', initialValue: true });
  if (doInstall) {
    const s = spinner();
    s.start('Installing dependencies');
    try {
      execFileSync('npm', ['install'], { cwd: dest, stdio: 'ignore' });
      s.stop('Dependencies installed');
    } catch {
      s.stop('Could not install dependencies');
      logWarn('Run `npm install` in the plugin directory later.');
    }
  }

  const cd = path.relative(process.cwd(), dest) || dest;
  outro(`Next steps:\n  cd ${cd}\n  npx trek-plugin-sdk dev`);
  return id;
}

// CLI entry
if (process.argv[1] && process.argv[1].endsWith('create.js')) {
  const args = process.argv.slice(2);
  const name = args.find((a: string) => !a.startsWith('-'));
  const typeIdx = args.indexOf('--type');
  const type = typeIdx >= 0 ? args[typeIdx + 1] : 'integration';
  if (!name) {
    console.error('usage: create-trek-plugin <name> [--type integration|page|widget|trip-page]');
    process.exit(2);
  }
  try {
    scaffold(name, type, process.cwd());
    console.log(`Created ${name}/ — fill in the README, build server/index.js, then \`npx trek-plugin-sdk validate ${name}\`.`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
