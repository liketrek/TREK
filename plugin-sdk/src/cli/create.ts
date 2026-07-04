#!/usr/bin/env node
/**
 * create-trek-plugin <name> [--type integration|page|widget] (#plugins, M6).
 * Scaffolds a working plugin: manifest, an isolated server entry using
 * definePlugin, a README you must fill in, and (page/widget) a starter iframe.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createRequire } from 'node:module';

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
}

export function scaffold(name: string, type: string, targetDir: string, opts: ScaffoldOptions = {}): void {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(name)) throw new Error(`invalid plugin id "${name}" (lowercase slug, 3–40 chars)`);
  if (!['integration', 'page', 'widget'].includes(type)) throw new Error(`invalid type "${type}"`);

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
    trek: '>=3.2.0 <4.0.0',
    nativeModules: false,
    permissions: perms,
    routes: [{ method: 'GET', path: '/hello', auth: true }],
  };
  if (type === 'page') manifest.capabilities = { nav: { label: manifest.name, icon: 'Blocks', position: 'main' } };
  if (type === 'widget') manifest.capabilities = { widget: { title: manifest.name, defaultSize: 'medium' } };

  fs.writeFileSync(path.join(root, 'trek-plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'server', 'index.js'), SERVER_JS);
  fs.writeFileSync(path.join(root, 'README.md'), readme(name));
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

const SERVER_JS = `// Built plugin entry — runs in an isolated child process.
const { definePlugin } = require('trek-plugin-sdk');

module.exports = definePlugin({
  async onLoad(ctx) {
    await ctx.db.migrate('001_init', 'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)');
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

const CLIENT_HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Plugin</title></head>
<body>
  <h1>Hello from your plugin</h1>
  <script>
    // The frame is sandboxed (opaque origin) — talk to TREK only via postMessage.
    window.parent.postMessage({ type: 'trek:ready' }, '*');
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'trek:context') {
        document.body.dataset.theme = e.data.theme;
      }
    });
  </script>
</body></html>
`;

function readme(name: string): string {
  return `# ${name}

> One sentence: what this plugin does.

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
| \`db:own\` | store the plugin's own data |

## Setup

How to configure it.

## License

Your plugin is your own code — license it however you like; TREK does not impose
one. Replace this line with your license (for example, MIT).
`;
}

const KNOWN_PERMISSIONS = [
  'db:own', 'db:read:trips', 'db:read:users', 'ws:broadcast:trip', 'ws:broadcast:user',
  'hook:photo-provider', 'hook:calendar-source', 'http:outbound',
];

/** Interactive scaffold: prompt for the details, then create the plugin. Returns the chosen name. */
export async function interactiveScaffold(targetDir: string, presetName?: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string, def?: string) =>
    new Promise<string>((resolve) => rl.question(def ? `${q} (${def}) ` : `${q} `, (a) => resolve(a.trim() || def || '')));
  try {
    let name = presetName || '';
    while (!/^[a-z][a-z0-9-]{2,39}$/.test(name)) {
      name = await ask('Plugin id (lowercase-slug):');
      if (!/^[a-z][a-z0-9-]{2,39}$/.test(name)) console.log('  → must be a lowercase slug, 3–40 chars (e.g. flight-tracker)');
    }
    let type = '';
    while (!['integration', 'page', 'widget'].includes(type)) {
      type = (await ask('Type — integration | page | widget:', 'integration')).toLowerCase();
    }
    const author = await ask('Author:', 'Your Name');
    const description = await ask('One-line description:', 'Describe what your plugin does.');
    console.log(`\n  Permissions (space/comma separated). Available:\n    ${KNOWN_PERMISSIONS.join(', ')}`);
    const permsRaw = await ask('Permissions:', 'db:own');
    const permissions = permsRaw.split(/[\s,]+/).filter(Boolean).filter((p) => KNOWN_PERMISSIONS.includes(p) || p.startsWith('http:outbound:'));
    scaffold(name, type, targetDir, { author, description, permissions });
    return name;
  } finally {
    rl.close();
  }
}

// CLI entry
if (process.argv[1] && process.argv[1].endsWith('create.js')) {
  const args = process.argv.slice(2);
  const name = args.find((a: string) => !a.startsWith('-'));
  const typeIdx = args.indexOf('--type');
  const type = typeIdx >= 0 ? args[typeIdx + 1] : 'integration';
  if (!name) {
    console.error('usage: create-trek-plugin <name> [--type integration|page|widget]');
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
