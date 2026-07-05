# trek-plugin-sdk

The SDK for building [TREK](https://github.com/mauriceboe/TREK) plugins.

## Scaffold a plugin

```bash
npx trek-plugin-sdk                        # no command? a guided menu of everything below
npx trek-plugin-sdk create                 # interactive wizard (id, location, type, permissions)
npx trek-plugin-sdk create my-plugin --type widget   # or non-interactive
cd my-plugin
```

The wizard also offers to initialize a git repo and install dependencies for you.
In a non-interactive shell (CI, pipes) every command stays flag-driven with plain
output — no prompts, and machine output (`entry` JSON, `pack --json`, PR URLs) stays
on stdout.

## Develop with a live reload loop

`dev` runs your plugin locally — no full TREK needed. It injects a `ctx` that
enforces exactly the permissions your manifest grants (an ungranted call throws
`PERMISSION_DENIED`, so you catch missing grants), backs `db:own` with a real
SQLite file, serves your routes and your page/widget UI, and reloads on save.

```bash
npx trek-plugin-sdk dev        # http://localhost:4317 — dashboard, routes, UI
```

Open **`/preview`** to see a page/widget rendered in a real sandboxed frame with a
theme/accent/appearance toggle (`trek.invoke()` is proxied to your routes). Hit a route
as an unauthenticated request with `?_anon=1`. Drop a `dev-fixtures.json` (trips, users,
config) next to your manifest to feed `ctx.trips` / `ctx.users`.

## Build a native UI (page / widget)

The UI is a sandboxed, opaque-origin iframe that can't load TREK's stylesheet — so the
SDK ships it. Put **one line** in your `client/index.html` `<head>`:

```html
<!-- trek:ui -->
```

`dev` and `pack` expand it into the inlined **design kit**: token-driven styles that
follow the host's theme and accent (glass, cards, `.trek-btn`, `.trek-input`,
`.trek-chip`, `.trek-row`, hover), plus a `window.trek` bridge:

```js
trek.onContext((ctx) => { /* ctx.theme, ctx.tokens, ctx.appearance, ctx.user, ctx.tripId */ })
const data = await trek.invoke('/status')   // calls your own route, host-proxied
trek.notify('success', 'Saved')
```

The kit applies the theme, mirrors the appearance flags (reduced-motion,
no-transparency) and auto-reports your height. See the
[Plugin Development wiki](https://github.com/mauriceboe/TREK/wiki/Plugin-Development)
for the full component + token reference.

## Write a plugin

```js
const { definePlugin } = require('trek-plugin-sdk')

module.exports = definePlugin({
  async onLoad(ctx) {
    await ctx.db.migrate('001', 'CREATE TABLE cache (k TEXT PRIMARY KEY, v TEXT)')
  },
  routes: [
    { method: 'GET', path: '/status', auth: true, async handler(req, ctx) {
      return { status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' }
    }},
  ],
})
```

Your plugin runs in an **isolated child process**. `ctx` is the only way to reach
TREK, and it grants exactly the permissions your `trek-plugin.json` declares — an
ungranted call throws `PERMISSION_DENIED`.

## Test without a running TREK

```js
import { createMockHost } from 'trek-plugin-sdk/testing'

const { ctx, broadcasts } = createMockHost({
  grants: ['db:read:trips', 'ws:broadcast:trip'],
  trips: { 1: { members: [42], data: { id: 1, name: 'Japan' } } },
})
// the mock enforces the SAME permission model, so you can prove your plugin
// degrades gracefully when a permission is missing.
```

## Publish — one command

Commit and push your plugin to its public GitHub repo, then:

```bash
npx trek-plugin-sdk publish --repo you/repo --tag v1.0.0
```

`publish` does the whole release in one go: **pack** → **tag + GitHub release**
→ **preflight** (runs the registry CI checks locally) → **open the registry PR**.
If preflight finds a problem it stops *before* submitting, so a broken entry
never becomes a doomed PR. It prints the PR URL at the end.

**Updating** a listed plugin: bump `version` in the manifest, commit, and run
`publish` again with the new tag — it detects the existing entry and prepends the
new version, newest-first.

Prefer to drive the steps yourself? They still exist individually — `pack`,
`release` (pack → GitHub release → entry), `preflight`, `submit` (opens the PR),
and `entry` (just prints the JSON).

### Sign your releases (optional, recommended)

Give your plugin a stable identity. TREK pins your key on first install
(trust-on-first-use); afterwards an unsigned or wrong-key update is refused.

```bash
npx trek-plugin-sdk keygen                                  # once — writes ~/.trek-plugin/signing.key
npx trek-plugin-sdk publish --repo you/repo --tag v1.1.0 --sign
```

Signing is dependency-free Ed25519 over the artifact bytes. **Back up the key** —
losing it means you can't ship signed updates.

## Exports

- `definePlugin(def)` + all the plugin types (`PluginContext`, `PluginRoute`, `PluginJob`, `PhotoProvider`, `CalendarSource`).
- `PLUGIN_API_VERSION` — embed as `apiVersion` in your manifest.
- `validateManifest(json)` — the manifest rules the server loader uses.
- `createMockHost(opts)` (from `trek-plugin-sdk/testing`).
- `TREK_UI_CSS`, `TREK_THEME_JS`, `TREK_UI_MARKER`, `injectTrekUi(html)` — the design kit, for authors who inline it themselves (a bundler, a custom build). Most plugins just use the `<!-- trek:ui -->` marker instead.

## Commands

Run any of these with `npx trek-plugin-sdk <command>` (or the short `trek-plugin`
bin if you install the package):

- `create [name] [--type t] [--interactive]` — scaffold a plugin; a wizard if you omit the name.
- `dev [dir] [--port 4317]` — run locally with a real request loop, SQLite `db:own`, and hot reload.
- `validate [dir]` — manifest + layout checks (a subset of registry CI, offline).
- `pack [dir] [--out plugin.zip] [--json]` — build the artifact, print `sha256` + `size`.
- `keygen [--key file]` — create an Ed25519 signing key.
- `sign [zip] [--key file]` — print a signature + public key for an artifact.
- `entry --repo o/n --tag vX [--merge f] [--sign [key]] [--out f]` — emit the registry entry JSON.
- `preflight --repo o/n --tag vX` (or `--entry f`) — run the registry CI checks locally, over the network.
- `submit --repo o/n --tag vX [--sign [key]] [--draft]` — open the registry PR for you.
- `release [dir] --repo o/n --tag vX [--sign [key]] [--merge f]` — pack → GitHub release → entry, in one go.
- `publish [dir] --repo o/n --tag vX [--sign [key]] [--no-preflight]` — **the lot**: pack → tag + release → preflight → open the PR.

The SDK tooling in this repo is MIT. Your plugin is your own code under your own license.
