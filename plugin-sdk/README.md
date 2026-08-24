# trek-plugin-sdk

The SDK for building [TREK](https://github.com/liketrek/TREK) plugins.

The path is four commands: **`create` → `dev` → `status` → `publish`**. Everything
else the CLI can do is a step one of those already does for you.

## Scaffold a plugin

```bash
npx trek-plugin-sdk                        # no command? a guided menu of everything below
npx trek-plugin-sdk create                 # interactive wizard (id, type, icon, permissions, egress)
npx trek-plugin-sdk create my-plugin --type widget   # or non-interactive
cd my-plugin
```

The wizard asks for the id, type, icon (validated against lucide), permissions,
egress hosts and required addons, and offers to initialize a git repo and install
dependencies for you. In a non-interactive shell (CI, pipes) every command stays
flag-driven with plain output — no prompts, and machine output (`entry` JSON,
`pack --json`, PR URLs) stays on stdout.

What you get **runs and packs immediately** — but it is not publishable yet: the
README is a template and there is no screenshot. That is deliberate. Writing those
is your job, and `status` tells you exactly what is left.

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

## Know where you are

```bash
npx trek-plugin-sdk status        # never fails — it's a map, not a gate
```

`status` runs every check the TREK-Plugins registry enforces that can be answered
without a network — which is nearly all of them — and prints the whole journey as a
checklist grouped by stage (Manifest, Code, Docs, Release, Repo): what passes, what
does not, and the **one** command to run next. Run it whenever you are not sure what
to do; it deliberately never exits non-zero.

`validate` is the same checks with an exit code. It is the form for scripts and CI;
`status` is the form for humans. A plugin that passes `validate` will pass every
registry gate that does not require the tag and the release to exist — those four
run in `preflight`, which `publish` does for you.

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

### Keep UI state for this browser tab

The opaque frame cannot use browser storage directly. The bridge provides
host-managed, JSON-only session state instead. It survives an iframe remount and
page reload in the same browser tab, but is not durable data. Do not use it to
store secrets.

```js
// Default: this user + this plugin + this browser tab.
await trek.session.set('dismissed-onboarding', true)
const dismissed = await trek.session.get('dismissed-onboarding')

// Explicitly partition state by the trip in view (fails without a trip context).
await trek.session.set('filters', ['flight', 'hotel'], { scope: 'trip' })
```

`get()` returns `undefined` for a missing key. `set`, `get`, `remove`, and
`clear` accept `{ scope: 'plugin' | 'trip' }`; `plugin` is the default. Use your
plugin's own logical key (for example `reservation:88:expanded`) for any finer
partitioning. Each plugin or individual trip scope is limited to 32 keys,
64 characters per key, and 1 KiB per JSON value.

The kit applies the theme, mirrors the appearance flags (reduced-motion,
no-transparency) and auto-reports your height. It also upgrades any native
`<select>` into a host-styled, keyboard-accessible dropdown that matches TREK —
the OS-drawn popup never could. Write a plain `<select>` and it just works; add
`data-trek-native` to opt a field out. See the
[Plugin Development wiki](https://github.com/liketrek/TREK/wiki/Plugin-Development)
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

## Runtime limits

The host enforces these limits on every ctx call and hook invocation. They are generous
for a legitimate plugin and only bite a runaway or abusive one — build against them so
`dev`/`mock-host` behavior matches production.

| Area | Limit |
|---|---|
| `ctx.ai` | 200 calls/day per plugin (UTC midnight rollover); past it throws `"daily AI budget exhausted (resets at UTC midnight)"` |
| `ctx.notify` | 100 calls/day per plugin (UTC midnight rollover); past it throws `"daily notification budget exhausted (resets at UTC midnight)"` |
| RPC (every `ctx.*` call) | burst 60, sustained 20/s, 16 in-flight per plugin; a throttled call is refused with `HOST_ERROR: rate limit exceeded — slow down ctx.* calls` |
| `ctx.db` (your own sqlite) | 256 MB per plugin |
| `ctx.meta` | 64 KB per value, 256 chars per key, 100 keys per (plugin, entity) |
| Plugin process | 300 MB RSS ceiling; auto-disabled after 5 crashes in 5 minutes |
| Event redelivery buffer | 200 events held per plugin, dropped unreplayed after 15 minutes |

Hook contribution caps (declarative content the host renders — a slow/failing call is
skipped, never fatal):

| Hook | Cap |
|---|---|
| `pdfSectionProvider` | ≤5 sections per provider |
| `atlasLayerProvider` | ≤3 layers per provider |
| `mapMarkerProvider` | ≤200 markers per provider |
| `warningProvider` | ≤20 warnings per provider, each message ≤300 chars |
| `placeDetailProvider` | ≤12 items per provider |
| `photoProvider` | ≤60 photos per page |
| `calendarSource` | ≤500 events per source per request |
| `tableContributor` | ≤20 columns / ≤10 actions per entity |
| `tripCardProvider` | ≤4 badges per trip, ≤240 total per provider |

## OAuth broker

`ctx.oauth.getAccessToken()` is host-brokered outbound OAuth: the plugin never becomes a
direct OAuth client. The host runs the whole flow (authorize → callback → token exchange
→ refresh) with PKCE and a 10-minute state TTL, and holds the refresh token + client
secret — a plugin only ever sees a short-lived access token for the ACTING USER, or
`null` when they haven't connected (or in a userless context).

Provider config is the plugin's admin-owned INSTANCE settings — declare `scope:'instance'`
manifest fields named `oauth_authorize_url`, `oauth_token_url`, `oauth_scopes` (optional),
`oauth_client_id`, `oauth_client_secret`, and the admin fills them in from Settings →
Plugins → Connect. Both endpoint URLs must be `https` and may not point at loopback,
`.local`/`.internal` names, or private/metadata addresses — the host refuses to start a
flow against them. The host exposes
`/api/plugin-oauth/:id/status|connect|callback|disconnect` to drive the connect UI;
plugin code itself only ever calls `getAccessToken()`.

## Capture the screenshot

The registry requires a screenshot that resolves to a real image, and the store card
shows it. `shot` boots the dev server, renders your plugin in the same themed frame
TREK uses, and writes a 1600×900 `docs/screenshot.png`:

```bash
npm i -D playwright && npx playwright install chromium   # once
npx trek-plugin-sdk shot                                 # --dark for the dark theme
```

Playwright is deliberately **not** a dependency of this SDK — it ships a browser, and
most authors never need one. An `integration` plugin has no UI to render, so `shot`
cannot help; screenshot the TREK surface your plugin changes instead.

## Publish — one command

Commit and push your plugin to its public GitHub repo, then:

```bash
npx trek-plugin-sdk publish --repo you/repo --tag v1.0.0
```

`publish` is the whole release, in five steps and in this order:

1. **check** — every registry gate that can be checked locally
2. **pack** — build `plugin.zip`
3. **release** — git tag, push, and cut the GitHub release with the artifact
4. **preflight** — the gates that need the tag and the release to exist
5. **submit** — open the PR against the TREK-Plugins registry

Step 1 comes first for a reason: a GitHub release is effectively immutable, because
the registry pins its sha256. If a check fails, **nothing is packed, tagged, pushed
or released** — so you can fix it and re-run against the same version. (`--no-checks`
skips step 1; it is an escape hatch for a re-run, never right on a first publish.)

Needs `git` and an authenticated `gh`. It prints the PR URL at the end.

**Updating** a listed plugin: bump `version` in the manifest, commit, and run
`publish` again with the new tag — it detects the existing entry and prepends the
new version, newest-first. Your TREK-Plugins fork is fast-forwarded automatically
before the PR branch is cut, so a fork left behind doesn't break the submit (a
*diverged* fork gets a warning and the `gh repo sync --force` command to fix it).

### When a publish fails

A failure **after** the release is cut (a preflight or PR problem) rolls back
exactly what that run created — the GitHub release, the pushed tag, the local
tag — so the same tag is free to re-run against once you've fixed the problem.
Nothing that existed before the run is ever touched. Pass `--keep-release` to
keep the release instead; the error then prints the manual cleanup commands.

Two related conveniences:

- A leftover tag from an earlier failed run (it has no release and doesn't point
  at `HEAD`) is recognised as debris and **moved to your current commit** instead
  of silently releasing the stale one.
- `trek-plugin unrelease <vX.Y.Z> --repo you/repo` deletes a stranded release +
  remote tag + local tag in one go. It checks the published registry index first
  and **refuses to touch a version that is actually published** — those artifacts
  are immutable (the registry pins their sha256), so the only way forward there is
  a new version.

Prefer to drive the steps yourself? They still exist individually — `pack`,
`release` (pack → GitHub release → entry), `preflight`, `submit` (opens the PR),
and `entry` (just prints the JSON).

### Signing (recommended — `publish` offers it)

In a terminal, `publish` **asks** whether to sign, and creates the key for you if you
have none — you don't have to know `--sign` or `keygen` exist. Scripts and CI are never
prompted: pass `--sign`.

A signature proves the artifact came from **you**, not just that its bytes match what
the registry saw. Signing is dependency-free Ed25519 over the artifact bytes.

It is a one-way door you may walk through **late**:

- Unsigned throughout is fine — the sha256 pin is the only guarantee, and TREK accepts it.
- **Unsigned → signed later breaks nobody.** Nothing is pinned until a signed version
  installs, so adding a key at v1.4.0 is a real option, not a lost cause. The registry
  does require every version signed once your key appears in the entry — your first
  signed update **retro-signs the older versions for you** (each pinned artifact is
  downloaded, verified against its sha256, and signed with the same key).
- **Signed → unsigned is refused forever**, on every instance that already has the plugin.
  `publish` refuses that at step 1, before anything is tagged or released.

So **back the key up** (`~/.trek-plugin/signing.key`). Losing it means you cannot ship an
update to your own plugin without a registry maintainer override.

```bash
npx trek-plugin-sdk publish --repo you/repo --tag v1.1.0 --sign   # or just answer the prompt
```

## Exports

- `definePlugin(def)` + all the plugin types (`PluginContext`, `PluginRoute`, `PluginJob`, `PhotoProvider`, `CalendarSource`).
- `PLUGIN_API_VERSION` — embed as `apiVersion` in your manifest.
- `validateManifest(json)` — the manifest rules the server loader uses.
- `createMockHost(opts)` (from `trek-plugin-sdk/testing`).
- `TREK_UI_CSS`, `TREK_THEME_JS`, `TREK_UI_MARKER`, `injectTrekUi(html)` — the design kit, for authors who inline it themselves (a bundler, a custom build). Most plugins just use the `<!-- trek:ui -->` marker instead.

## Commands

Run any of these with `npx trek-plugin-sdk <command>` (or the short `trek-plugin`
bin if you install the package). `trek-plugin help <command>` — or
`trek-plugin <command> --help` — prints a full page for any of them.

**The path:**

- `create [name] [--type t] [--template blank|notification-channel] [--interactive]` — scaffold a plugin; a wizard if you omit the name.
- `dev [dir] [--port 4317]` — run locally with a real request loop, SQLite `db:own`, and hot reload.
- `status [dir]` — where am I? what's left? Every offline registry gate as a checklist, plus the next command. Never fails.
- `publish [dir] --repo o/n --tag vX [--sign [key]] [--no-checks] [--no-preflight]` — **the lot**: check → pack → release → preflight → open the PR. In a terminal it offers to sign (and makes you a key); scripts pass `--sign`.

**Also:**

- `validate [dir]` — the gate: the same checks as `status`, but it exits non-zero.
- `pack [dir] [--out plugin.zip] [--json]` — build the artifact, print `sha256` + `size`. Refuses a plugin that could not *load*; does not enforce the publish gates, because packing is how you sideload a plugin to try it.
- `shot [dir] [--port 4317] [--out docs/screenshot.png] [--dark] [--no-serve]` — capture `docs/screenshot.png`. Needs Playwright.
- `keygen [--key file]` — create an Ed25519 signing key.
- `sign [zip] [--key file]` — print a signature + public key for an artifact.
- `entry --repo o/n --tag vX [--merge f] [--sign [key]] [--out f]` — emit the registry entry JSON.
- `preflight [dir] --repo o/n --tag vX [--entry f] [--all]` — the registry checks that need the network: the tag resolves to the pinned commit, the released artifact downloads and hashes, the id is not bound to another owner, and an update does not drop or rotate a published signing key.
- `submit [dir] --repo o/n --tag vX [--registry o/n] [--draft]` — open the registry PR for you.
- `release [dir] --repo o/n --tag vX [--sign [key]] [--merge f]` — pack → GitHub release → entry, without opening the PR.
- `unrelease <vX.Y.Z> [dir] --repo o/n [--yes]` — delete a stranded release + remote tag + local tag. Refuses a version that is published in the registry (immutable); `--yes` consents when the registry index can't be checked.

## Update notice

Both CLIs (`trek-plugin` and `create-trek-plugin`) tell you when a newer SDK has been
published. This matters more than the usual "you're on an old version" nag: the
registry entry format, the manifest rules and the permission catalog all move with the
TREK host, so a stale SDK can `pack` and `submit` an entry that today's registry CI
rejects.

It is powered by [`update-notifier`](https://github.com/sindresorhus/update-notifier),
the standard for npm CLIs:

- At most **once every 24 hours**, a detached background process asks
  `registry.npmjs.org` for this package's `latest` version and caches the answer under
  `$XDG_CONFIG_HOME/configstore/` (or `~/.config/…`).
- Your command **never waits for it** — the notice is printed from that cache, so a
  fresh install learns about an update on a later run.
- The notice goes to **stderr**, so `pack --json` and `entry` keep piping clean JSON.

The request is an unauthenticated GET for a public package — the same one `npm install`
makes (npm's servers see your IP, as for any download). TREK has no telemetry, and this
isn't any. To turn it off:

```bash
export NO_UPDATE_NOTIFIER=1
```

It is already silent in CI (any `CI` env var), under `NODE_ENV=test`, and whenever
stdout isn't a terminal (i.e. when piped or redirected).

The SDK tooling in this repo is MIT. Your plugin is your own code under your own license.
