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
  intro, outro, note, logInfo, logSuccess, logWarn, spinner,
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
  /**
   * External hosts the plugin may call — required by the manifest when `http:outbound` is
   * granted, UNLESS the plugin is an operatorEgress one (below), whose hosts an admin adds
   * after install because the author cannot know them (a self-hosted Gotify, an ntfy).
   */
  egress?: string[];
  /** The admin supplies the hosts post-install. Defaults on for a channel, and whenever `http:outbound` is wanted with no `egress`. */
  operatorEgress?: boolean;
  /** Addon ids that must be enabled for this plugin to activate. */
  requiredAddons?: string[];
  /** Other plugins this one depends on, each pinned by a semver range. */
  pluginDependencies?: Array<{ id: string; version: string }>;
  /**
   * Which starter to generate. This is NOT the manifest `type` — a notification
   * channel is a plain `integration` that implements the `notificationChannel` hook.
   */
  template?: 'blank' | 'notification-channel';
}

export const TEMPLATES = ['blank', 'notification-channel'] as const;

export function scaffold(name: string, type: string, targetDir: string, opts: ScaffoldOptions = {}): void {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(name)) throw new Error(`invalid plugin id "${name}" (lowercase slug, 3–40 chars)`);
  if (!['integration', 'page', 'widget', 'trip-page'].includes(type)) throw new Error(`invalid type "${type}"`);

  const template = opts.template ?? 'blank';
  if (!TEMPLATES.includes(template)) throw new Error(`invalid template "${template}"`);
  const isChannel = template === 'notification-channel';
  // A notification channel is server-only by construction: it takes a rendered
  // message and pushes it somewhere. Nothing else makes sense.
  if (isChannel && type !== 'integration') throw new Error('the notification-channel template requires type "integration"');

  const root = path.join(targetDir, name);
  if (fs.existsSync(root)) throw new Error(`${root} already exists`);
  fs.mkdirSync(path.join(root, 'server'), { recursive: true });

  const displayName = name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  let perms = opts.permissions?.length ? opts.permissions : ['db:own'];
  const egress = opts.egress ?? [];
  if (isChannel) {
    // The grants a channel cannot work without. With known hosts it gets a per-host grant
    // each; with none — the usual case for a self-hosted target — it gets the bare
    // `http:outbound` and relies on operatorEgress below, rather than a fake placeholder
    // host that would otherwise ship in the published manifest.
    const outbound = egress.length ? egress.map((h) => `http:outbound:${h}`) : ['http:outbound'];
    const required = ['hook:notification-channel', ...outbound];
    perms = [...new Set([...perms.filter((p) => p !== 'db:own'), ...required])];
  }
  // A plugin that wants outbound but names no host is only valid as an operatorEgress
  // plugin — the admin supplies the hosts after install.
  const wantsOutbound = perms.some((p) => p === 'http:outbound' || p.startsWith('http:outbound:'));
  const operatorEgress = opts.operatorEgress ?? (isChannel || (wantsOutbound && egress.length === 0));

  const manifest: Record<string, unknown> = {
    id: name,
    name: displayName,
    version: '1.0.0',
    apiVersion: 1,
    author: opts.author || 'Your Name',
    description: opts.description || (isChannel ? `Deliver TREK notifications over ${displayName}.` : 'Describe what your plugin does.'),
    type,
    trek: '>=3.3.0 <4.0.0',
    nativeModules: false,
    permissions: perms,
    // Dependency declarations (empty by default). `requiredAddons` lists addon ids
    // that must be enabled to activate; `pluginDependencies` lists other plugins
    // ({ id, version-range }) that must be installed + satisfied first.
    requiredAddons: opts.requiredAddons ?? [],
    pluginDependencies: opts.pluginDependencies ?? [],
  };
  if (egress.length) manifest.egress = egress;
  // A notification channel usually targets a SELF-HOSTED service, whose hostname the
  // author cannot know at publish time. Declaring operatorEgress lets the admin add the
  // real host after install; without it the plugin only ever reaches the hosts above.
  if (operatorEgress) manifest.operatorEgress = true;
  // A settings-page button so the user can verify their credentials without waiting for
  // a real notification. Actions are USER-INITIATED, so ctx.settings.get() works inside.
  if (isChannel) manifest.actions = [{ key: 'testConnection', label: 'Test connection' }];
  // Routes are declared in server/index.js (definePlugin), NOT the manifest — the
  // host ignores a manifest `routes`. A `page` plugin gets its nav entry
  // automatically, so there's no `capabilities.nav` either; only `widget` carries a
  // capability worth scaffolding.
  if (type === 'widget') manifest.capabilities = { widget: { title: displayName, defaultSize: 'medium' } };
  if (isChannel) {
    manifest.capabilities = { notificationChannel: { title: displayName } };
    // The recipient's own credential. `scope: 'user'` is what makes it per-user, and
    // the host hands the decrypted value to your hook as `config` at send time.
    manifest.settings = [
      {
        key: 'serverUrl',
        label: 'Server URL',
        input_type: 'text',
        placeholder: 'https://gotify.example.com',
        hint: egress.length
          ? 'Your Gotify server. Must match an entry in the manifest `egress` list.'
          : 'Your Gotify server. Its host must be allowed by an admin (Admin → Plugins → Allowed hosts).',
        required: true,
        scope: 'user',
      },
      {
        key: 'appToken',
        label: 'App token',
        input_type: 'text',
        hint: 'Create an application in Gotify and paste its token here.',
        required: true,
        secret: true,
        scope: 'user',
      },
    ];
  }

  fs.writeFileSync(path.join(root, 'trek-plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'server', 'index.js'), isChannel ? CHANNEL_JS : SERVER_JS(perms.includes('db:own')));
  fs.writeFileSync(path.join(root, 'README.md'), readme(name, opts.description ?? (isChannel ? `> Deliver your TREK notifications to ${displayName}.` : '> One sentence: what this plugin does.'), perms));
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

const CHANNEL_JS = `// A TREK notification channel — runs in an isolated child process.
//
// TREK renders every notification into the recipient's language and hands it to you
// ready to send. You never touch i18n, and you never pick a recipient: the host does
// that, then calls you once per recipient who has this channel switched on.
//
// This hook is HOST-initiated, so there is NO acting user while it runs:
//   - ctx.settings.get() returns undefined here (it resolves against the acting user)
//   - trip reads are refused
// The recipient's own settings — the fields you declared with scope: 'user' in
// trek-plugin.json — arrive DECRYPTED as the \`config\` argument. That is the only way
// to reach them, and it is why a channel plugin cannot enumerate anyone's trips.
const { definePlugin } = require('trek-plugin-sdk');

async function push(config, title, message) {
  // Every host you call must be listed in the manifest's \`egress\` array AND granted
  // via http:outbound:<host>, or the child's network guard blocks the request.
  const res = await fetch(String(config.serverUrl).replace(/\\/+$/, '') + '/message', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Gotify-Key': String(config.appToken),
    },
    body: JSON.stringify({ title, message, priority: 5 }),
  });
  // Throw on failure: the host logs it and isolates it, so one dead channel can never
  // stop the others (or the in-app notification) from being delivered.
  if (!res.ok) throw new Error('Gotify responded ' + res.status + ' ' + (await res.text().catch(() => '')));
}

module.exports = definePlugin({
  // A button on your settings page. USER-INITIATED, so unlike the channel hook there IS
  // an acting user (whoever clicked) — ctx.settings.get() returns THEIR values, which is
  // what makes "test my credentials" possible.
  actions: {
    async testConnection(ctx) {
      const config = {
        serverUrl: await ctx.settings.get('serverUrl'),
        appToken: await ctx.settings.get('appToken'),
      };
      await push(config, 'TREK', 'Test notification. If you can read this, your channel works.');
      return { ok: true, message: 'Connected.' };
    },
  },

  hooks: {
    notificationChannel: {
      async send(msg, config, ctx) {
        // msg = { event, title, body, url?, tripName? } — already localized.
        const body = msg.url ? msg.body + '\\n\\n' + msg.url : msg.body;
        await push(config, msg.title, body);
        ctx.log.info('delivered ' + msg.event);
      },

      // Optional — backs the "Send test" button in the user's notification settings.
      async test(config) {
        await push(config, 'TREK', 'Test notification. If you can read this, your channel works.');
      },
    },
  },
});
`;

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

  // A starter, not a manifest type — a notification channel is a plain `integration`
  // that implements the notificationChannel hook, so it only makes sense to offer here.
  let template: 'blank' | 'notification-channel' = 'blank';
  if (type === 'integration') {
    template = await promptSelect<'blank' | 'notification-channel'>({
      message: 'Start from a template?',
      initialValue: 'blank',
      options: [
        { value: 'blank', label: 'blank', hint: 'an empty plugin with one example route' },
        { value: 'notification-channel', label: 'notification channel', hint: 'deliver TREK notifications to Gotify/Pushover/…' },
      ],
    });
  }

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
  // The scaffold turns each host into a matching http:outbound:<host> grant. Leaving it
  // blank is legitimate — a plugin for a service that is only ever SELF-HOSTED has no host
  // to name, so it ships as an operatorEgress plugin and the admin adds the real host.
  if (permissions.includes('http:outbound') || template === 'notification-channel') {
    const raw = await promptText({
      message: template === 'notification-channel'
        ? 'Which host does your notification service live on? (blank if it is always self-hosted)'
        : 'External hosts it may call (comma-separated; blank if only the admin can know them)',
      placeholder: template === 'notification-channel' ? 'gotify.example.com' : 'api.example.com, api.other.com',
    });
    egress = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!egress.length) {
      logInfo('No hosts named — the plugin will declare operatorEgress, and the TREK admin adds the real hosts after installing it.');
    }
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
      template !== 'blank' ? `template     ${template}` : undefined,
      `location     ${dest}`,
      `author       ${author}`,
      `permissions  ${permissions.join(', ') || '(none)'}`,
      egress?.length ? `egress       ${egress.join(', ')}` : undefined,
      egress && !egress.length ? 'egress       (admin-supplied — operatorEgress)' : undefined,
      requiredAddons.length ? `addons       ${requiredAddons.join(', ')}` : undefined,
    ].filter(Boolean).join('\n'),
    'Review',
  );

  const confirmed = await promptConfirm({ message: `Create the plugin at ${dest}?`, initialValue: true });
  if (!confirmed) {
    outro('Cancelled — nothing was written.');
    process.exit(0);
  }

  scaffold(id, type, parentDir, { author, description, permissions, egress, requiredAddons, template });
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
  const tplIdx = args.indexOf('--template');
  const template = (tplIdx >= 0 ? args[tplIdx + 1] : 'blank') as ScaffoldOptions['template'];
  if (!name) {
    console.error('usage: create-trek-plugin <name> [--type integration|page|widget|trip-page] [--template blank|notification-channel]');
    process.exit(2);
  }
  try {
    scaffold(name, type, process.cwd(), { template });
    console.log(`Created ${name}/ — fill in the README, build server/index.js, then \`npx trek-plugin-sdk validate ${name}\`.`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
