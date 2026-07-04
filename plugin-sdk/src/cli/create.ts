#!/usr/bin/env node
/**
 * create-trek-plugin <name> [--type integration|page|widget] (#plugins, M6).
 * Scaffolds a working plugin: manifest, an isolated server entry using
 * definePlugin, a README you must fill in, and (page/widget) a starter iframe.
 */
import fs from 'node:fs';
import path from 'node:path';

export function scaffold(name: string, type: string, targetDir: string): void {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(name)) throw new Error(`invalid plugin id "${name}" (lowercase slug, 3–40 chars)`);
  if (!['integration', 'page', 'widget'].includes(type)) throw new Error(`invalid type "${type}"`);

  const root = path.join(targetDir, name);
  if (fs.existsSync(root)) throw new Error(`${root} already exists`);
  fs.mkdirSync(path.join(root, 'server'), { recursive: true });

  const manifest: Record<string, unknown> = {
    id: name,
    name: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    version: '1.0.0',
    apiVersion: 1,
    author: 'Your Name',
    description: 'Describe what your plugin does.',
    type,
    trek: '>=3.2.0 <4.0.0',
    nativeModules: false,
    permissions: ['db:own'],
    routes: [{ method: 'GET', path: '/hello', auth: true }],
  };
  if (type === 'page') manifest.capabilities = { nav: { label: manifest.name, icon: 'Blocks', position: 'main' } };
  if (type === 'widget') manifest.capabilities = { widget: { title: manifest.name, defaultSize: 'medium' } };

  fs.writeFileSync(path.join(root, 'trek-plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'server', 'index.js'), SERVER_JS);
  fs.writeFileSync(path.join(root, 'README.md'), readme(name));
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
    console.log(`Created ${name}/ — fill in the README, build server/index.js, then \`npx trek-plugin validate ${name}\`.`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
