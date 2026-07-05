# Plugin Development

Build a plugin with the `trek-plugin-sdk` package. A plugin is a directory with a
manifest (`trek-plugin.json`), a built server entry, and — for page/widget
plugins — a static client bundle. TREK runs your server code in an **isolated
child process** and reaches it only over RPC; the browser part runs in a
**sandboxed, opaque-origin iframe**. There is no other way in or out.

## Scaffold

```bash
npx trek-plugin-sdk create                # interactive wizard
npx trek-plugin-sdk create my-plugin --type integration|page|widget|trip-page   # or direct
cd my-plugin
```

The wizard (run `create` with no name) asks for the id, type, author and
permissions; the direct form takes them as flags.

This emits:

```
my-plugin/
  trek-plugin.json      # manifest
  package.json          # CommonJS marker + the SDK as a devDependency
  server/index.js       # your plugin code (built, plain JS)
  client/index.html     # native UI via the design kit (page / widget / trip-page only)
  README.md             # fill this in — the registry requires a screenshot
```

## Run it locally with hot reload

```bash
npx trek-plugin-sdk dev        # http://localhost:4317
```

`dev` works straight after `create` — no `npm install` needed, because it
injects `require('trek-plugin-sdk')` from the CLI itself, exactly like TREK
injects it in production. It loads your `server/index.js` through the same
`definePlugin` contract the host uses and gives you a **real request loop
without a full TREK**: a dashboard
listing your routes, the routes served under `/api/<path>`, your page/widget UI
at `/ui`, a **themed host preview at `/preview`** (a real sandboxed frame with a
theme/accent/appearance toggle, `trek.invoke()` proxied to your routes), and a reload
on every save. The injected `ctx` **enforces exactly the
permissions your manifest grants** — an ungranted call throws `PERMISSION_DENIED`,
so you catch a missing grant here rather than after install. `db:own` is backed
by a real SQLite file (`.trek-dev/db.sqlite`) when the runtime has `node:sqlite`.

- Hit a route as an unauthenticated request with `?_anon=1` (an `auth: true`
  route then returns 401, mirroring the host).
- Feed `ctx.trips` / `ctx.users` by dropping a `dev-fixtures.json` next to the
  manifest: `{ "trips": { "1": { "members": [1], "data": { … } } }, "users": {} }`.

## The plugin types

- **integration** — background logic (jobs, routes) with no UI of its own. Photo-
  provider / calendar-source hook types exist in the SDK but are **not yet wired
  into the host** — see [Provider hooks](#provider-hooks). The `placeDetailProvider`
  hook IS wired.
- **page** — adds a nav entry that opens a full-page sandboxed iframe.
- **widget** — adds a card to the dashboard (`sidebar` slot), a hero-bar overlay
  (`hero` slot), or a panel inside the trip planner's **place-detail** view
  (`place-detail` slot — the frame also receives the open `placeId` in
  `trek:context`, so it can show place-specific info like reviews or ratings). Set
  the slot in `capabilities.widget.slot`.
- **trip-page** — adds a tab **inside every trip planner**, so your UI lives in the
  trip alongside Plan / Transports / Files. The frame is the same sandboxed iframe as
  a `page`, but it receives the current `tripId` in `trek:context` (so you can scope
  data to the open trip) and it has no dashboard nav entry. The tab shows on desktop
  and mobile.

## The SDK package

`trek-plugin-sdk` is **injected at runtime** — the host makes
`require('trek-plugin-sdk')` resolve inside the child, so **do not vendor it**
into your artifact. Add it as a **devDependency** only, so you get types,
`createMockHost` for tests, and the `trek-plugin` CLI:

```bash
npm i -D trek-plugin-sdk
```

## Writing the server

Your `server/index.js` exports a `definePlugin(...)` object. Everything reaches
TREK through the `ctx` argument.

```js
const { definePlugin } = require('trek-plugin-sdk')

module.exports = definePlugin({
  // Runs once when the plugin is activated. NOTE: onLoad has no user context —
  // ctx.trips.* is refused here (see the ctx table).
  async onLoad(ctx) {
    await ctx.db.migrate('001_init', 'CREATE TABLE IF NOT EXISTS cache (k TEXT PRIMARY KEY, v TEXT)')
    ctx.log.info('loaded')
  },

  // Runs once on deactivation/stop. Use it to flush or release resources.
  async onUnload(ctx) {
    ctx.log.info('unloading')
  },

  // HTTP routes, mounted at /api/plugins/<id><path>.
  routes: [
    { method: 'GET', path: '/status', auth: true, async handler(req, ctx) {
      const rows = await ctx.db.query('SELECT COUNT(*) AS n FROM cache')
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ n: rows[0].n, user: req.user?.username }),
      }
    }},
  ],

  // Scheduled jobs — TREK owns the cron and calls your handler (no user context).
  jobs: [
    { id: 'refresh', schedule: '*/15 * * * *', async handler(ctx) { /* … */ } },
  ],
})
```

The routes and job ids you declare here are the **authoritative** ones: the host
reads them off your loaded definition (a route's array index is its internal id).
The `routes` block the scaffold writes into `trek-plugin.json` is only a
declaration for readers — the manifest parser does not consume it.

### The `ctx` object

| Area | Methods | Requires |
|---|---|---|
| `ctx.db` | `query(sql, …args)` / `exec(sql, …args)` / `migrate(id, sql)` against your **own** SQLite file | `db:own` |
| `ctx.trips` | `getById` / `getPlaces` / `getReservations` (membership-checked) | `db:read:trips` |
| `ctx.trips.update(tripId, fields)` | update trip fields (title/dates/currency/reminder_days/…) | `db:write:trips` |
| `ctx.places` | `create(tripId, fields)` / `update(tripId, placeId, fields)` / `delete(tripId, placeId)` | `db:write:places` |
| `ctx.days` | `create(tripId, {date?, notes?})` / `update(tripId, dayId, {notes?, title?})` / `delete(tripId, dayId)` | `db:write:days` |
| `ctx.itinerary` | `assign(tripId, dayId, placeId, notes?)` / `unassign(tripId, assignmentId)` — place↔day | `db:write:itinerary` |
| `ctx.meta` | `get` / `set` / `list` / `delete` your **own** namespaced data on a `trip`/`place`/`day` (enrich core entities without forking the schema) | `db:meta` |
| `ctx.packing` | `list(tripId)` — a trip's packing items (membership-checked, respects private-item visibility) | `db:read:packing` |
| `ctx.files` | `list(tripId)` — a trip's files, trash excluded (membership-checked) | `db:read:files` |
| `ctx.costs` | `getByTrip(tripId)` / `listMine()` — read budget items (membership-checked) | `db:read:costs` |
| `ctx.costs` (write) | `create(tripId, input)` / `update(tripId, itemId, input)` / `delete(tripId, itemId)` — broadcasts `budget:*` | `db:write:costs` |
| `ctx.users` | `getById(id)` — public profile only (`id, username, display_name, avatar`) | `db:read:users` |
| `ctx.ws.broadcastToTrip(tripId, event, data)` | broadcast to a trip's members (event forced to `plugin:<id>:<event>`) | `ws:broadcast:trip` |
| `ctx.ws.broadcastToUser(userId, event, data)` | broadcast to one user | `ws:broadcast:user` |
| `ctx.plugins.call(id, fn, args?)` | call a function another plugin **exposes** and get its result — `id` must be a declared, satisfied `pluginDependency` that lists `fn` in its `capabilities.provides` | a plugin dependency (no permission) |
| `ctx.events.emit(name, payload?)` | publish an event to dependents that subscribed — `name` must be in your `capabilities.emits` | — (no permission) |
| `ctx.config` | your resolved settings (secrets delivered decrypted) | — |
| `ctx.log` | `info` / `warn` / `error` → your error log | — |
| `ctx.id` | your plugin id (string) | — |

Calling a method your manifest didn't grant returns `PERMISSION_DENIED`; a method
the host doesn't expose at all returns `UNKNOWN_METHOD`.

**`ctx.trips` only works inside a route handler.** The host binds the acting user
from the authenticated request and membership-checks every trip read against it.
`onLoad` and `jobs` have **no user**, so their trip reads are refused with
`RESOURCE_FORBIDDEN`. The SDK's `getById(tripId, asUserId?)` signature keeps an
`asUserId` parameter for source compatibility, but **the host ignores it** — you
cannot read another user's trips by passing an id.

**Writes (`ctx.trips.update` / `ctx.places` / `ctx.days` / `ctx.itinerary` /
`ctx.costs.create`) are route-context only too, and doubly gated:** the host checks
the acting user can **access** the trip AND holds the app's edit permission for that
entity (`place_edit` / `day_edit` / `trip_edit`), exactly like the web UI. They run
through the same services and broadcast the same events, so open sessions update
live. Input is validated against TREK's own schemas (a bad payload is `BAD_PARAMS`),
and every write is recorded in the tamper-evident capability audit log against the
acting user. A plugin can only change what its user could change by hand.

**`ctx.costs` ("costs" = budget items)** behaves exactly like `ctx.trips`: reads are
membership-checked against the request's user and only work **inside a route handler**
(`onLoad`/`jobs` have no user → `RESOURCE_FORBIDDEN`). `getByTrip(tripId)` returns one
trip's budget items (hydrated with members/payers); `listMine()` aggregates budget items
across every trip the acting user can access. `create/update/delete(tripId, …)` mutate a
trip's budget items — gated exactly like a normal budget write (the same model the planner
write scopes `db:write:places`/`days`/`itinerary`/`trips` use): the acting user needs the
**`budget_edit`** permission on that trip, the input is
validated against TREK's budget schema, and a successful create broadcasts the same
`budget:created` event the app emits. **Every `ctx.costs.*` call also requires the Costs
(budget) addon to be enabled** — if the admin has turned it off, the call is refused with
`RESOURCE_FORBIDDEN`.

### Route auth

Routes are authenticated by default (`req.user` is the logged-in user). Set
`auth: false` for OAuth callbacks or webhooks that can't carry a session. The
proxy forwards only `{ method, path, query, body, user }` — your code never sees
raw headers or the session cookie.

## Writing the client (page / widget)

The iframe is served same-origin from `/plugin-frame/<id>/…` but sandboxed
**without `allow-same-origin`**, so it runs at an **opaque origin**: it can't read
cookies or the parent DOM, and the CSP forbids external `<link>`/`<script src>` — so
**everything must be inlined** into your `index.html`. It talks to TREK only via
`postMessage` (target origin must be `'*'` — an opaque frame has no nameable origin).

### The design kit (recommended)

Because the frame can't load TREK's stylesheet, we ship it. Drop **one line** in your
`client/index.html` `<head>`:

```html
<!-- trek:ui -->
```

`dev` and `pack` expand that marker into the inlined **TREK design kit** — a
token-driven stylesheet plus a `window.trek` bridge. It costs nothing to keep the
source a one-liner, and a rebuild always ships the current kit. The kit:

- gives you native components — **glass panels, cards, buttons, inputs, chips, list
  rows, hover** — that swap correctly between light and dark;
- follows the user's live **accent scheme, custom accent and high-contrast** (it
  applies the tokens TREK sends);
- mirrors the host's **appearance flags** (reduced-motion, no-transparency, density);
- **auto-reports your height** (widgets/pages self-size — no manual `trek:resize`);
- installs `window.trek` so you never hand-roll `postMessage`.

`window.trek` also carries **`trek.ui`** — tiny DOM builders that emit kit-styled
elements, so you can build UI with no bundler and no CSS:

```js
const { ui } = trek
ui.mount(ui.card([
  ui.el('div', { class: 'trek-title', text: 'Nearby' }),
  ui.button('Refresh', { variant: 'primary', onClick: refresh }),
  ui.chip('open now', 'success'),
]))
// ui.el(tag, props, children) is the general builder; props take class/text/html/on:{event}.
```

The scaffold seeds a working example. A minimal client:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- trek:ui -->
</head>
<body>
  <div class="trek-glass trek-stack" style="margin:16px">
    <div class="trek-title">Your plugin</div>
    <p class="trek-muted" id="hello">…</p>
    <button class="trek-btn trek-btn--primary" id="go">Say hello</button>
  </div>
  <script>
    trek.onContext((ctx) => { document.getElementById('hello').textContent = 'theme: ' + ctx.theme })
    document.getElementById('go').addEventListener('click', async () => {
      try { const data = await trek.invoke('/hello'); document.getElementById('hello').textContent = 'Hello ' + data.hello }
      catch (e) { trek.notify('error', e.message) }
    })
  </script>
</body>
</html>
```

**Component classes** (the bootstrap adds `trek-ui` to `<body>`):

| Class | What |
|---|---|
| `.trek-glass` | the signature frosted-glass surface |
| `.trek-card` | a solid card |
| `.trek-interactive` | add to a glass/card for the native hover-lift |
| `.trek-btn` + `--primary` / `--secondary` / `--ghost` / `--danger` | buttons |
| `.trek-input` / `.trek-textarea` / `.trek-select` / `.trek-label` | form controls |
| `.trek-chip` + `--accent` / `--success` / `--danger` / `--warning` / `--info` | chips / badges |
| `.trek-row` | a hover-highlight list row |
| `.trek-title` / `.trek-muted` / `.trek-faint` | text helpers |
| `.trek-stack` / `.trek-cluster` | vertical / horizontal flex with gap |

**The `window.trek` bridge:**

| Call | Does |
|---|---|
| `trek.onContext(cb)` | run `cb(context)` now (if already received) and on every update; returns an unsubscribe fn |
| `trek.context` | the last context (or `null`) |
| `trek.invoke(sub, { method, body })` | call your own route; returns a `Promise` (rejects with an `Error`, `.code` = HTTP status) |
| `trek.notify(level, message)` | toast (`info`/`success`/`warning`/`error`) |
| `trek.navigate(to)` | in-app navigation (relative paths only) |
| `trek.resize(px)` | override the auto height |
| `trek.ready()` / `trek.requestContext()` | re-handshake / re-request the context |

**Preview it:** `npx trek-plugin-sdk dev`, then open **`/preview`** — it renders your UI
in a real sandboxed frame with a theme/accent/appearance toggle and proxies
`trek.invoke()` to your routes.

### The raw bridge (without the kit)

If you'd rather not use the kit, talk to the frame yourself. Announce readiness and
handle messages:

```js
window.parent.postMessage({ type: 'trek:ready' }, '*') // TREK replies with trek:context
window.addEventListener('message', (e) => {
  if (e.source !== window.parent) return          // opaque frame: trust the parent window
  const m = e.data
  if (m.type === 'trek:context') { /* m.theme, m.tokens, m.appearance, … (below) */ }
  if (m.type === 'trek:response') { /* m.requestId, m.data */ }
  if (m.type === 'trek:error')    { /* m.requestId, m.code, m.message */ }
})
window.parent.postMessage({ type: 'trek:invoke', requestId: '1', sub: '/status', method: 'GET' }, '*')
```

**Messages you send to TREK:**

| Message | Payload | Effect |
|---|---|---|
| `trek:ready` | — | TREK replies with `trek:context` |
| `trek:context:request` | — | re-request the context |
| `trek:navigate` | `{ to }` | in-app navigation (relative paths only) |
| `trek:notify` | `{ level, message }` | toast; `level` = `info`/`success`/`warning`/`error` |
| `trek:resize` | `{ height }` | set the iframe height (capped at 2000px) |
| `trek:invoke` | `{ requestId, sub, method, body }` | call your own route; resolves as `trek:response` or `trek:error` |

**Messages TREK sends you:**

| Message | Payload |
|---|---|
| `trek:context` | `{ tripId, userId, theme, locale, hostOrigin, user, formats, tokens, appearance }` (see below) — re-sent whenever the theme **or appearance** changes |
| `trek:response` | `{ requestId, data }` — a successful `trek:invoke` |
| `trek:error` | `{ requestId, code, message }` — a failed `trek:invoke` (`code` is the HTTP status or `"error"`) |

The frame's CSP is locked down per plugin: `default-src 'none'`, own inline
scripts/styles only, `connect-src` limited to the hosts you were **granted** via
`http:outbound:<host>` permissions (not merely the `egress[]` you declared), no popups.

### The context payload

| Field | Type |
|---|---|
| `tripId` | `number \| null` — the trip in view (a `trip-page` tab, or a widget on a trip), else `null` |
| `placeId` | `number \| null` — the place in view (a `place-detail` slot), else `null` |
| `userId` | `string \| null` |
| `theme` | `'light' \| 'dark'` |
| `locale` | e.g. `'en'` |
| `hostOrigin` | the app origin |
| `user` | `{ name, avatar, isAdmin } \| null` — **never** an email; role only as a boolean |
| `formats` | `{ locale, currency, timeFormat, distanceUnit, temperatureUnit, timezone }` |
| `tokens` | TREK's resolved CSS design tokens for the current theme (see below) |
| `appearance` | `{ scheme, density: 'comfortable'\|'compact', reducedMotion, noTransparency }` |

### Matching the TREK look by hand (`m.tokens`)

`tokens` is the whole global palette resolved for the **current** theme — surfaces
(`--bg-card`, `--bg-hover`, …), text (`--text-primary`/`-secondary`/`-muted`/`-faint`),
borders, the **accent family** (`--accent`, `--accent-text`, `--accent-hover`,
`--accent-subtle`), semantic + soft fills (`--success`/`--danger`/`--warning`/`--info`
`-soft`), shadows (`--shadow-*`), radii (`--radius-*`) and fonts (`--font-system`).
Apply them as CSS variables and your UI matches the host exactly — in both themes and
under a custom accent or high-contrast — instead of hard-coding a palette that drifts:

```js
function applyContext(m) {
  document.documentElement.dataset.theme = m.theme                 // for your dark rules
  for (const k in m.tokens) document.documentElement.style.setProperty(k, m.tokens[k])
  const a = m.appearance || {}
  document.documentElement.toggleAttribute('data-reduce-motion', !!a.reducedMotion)
  document.documentElement.toggleAttribute('data-no-transparency', !!a.noTransparency)
}
// in your trek:context handler: applyContext(m)
```

`tokens`/`appearance` are non-secret display values only, re-sent on every theme or
appearance change so plugins feel native rather than bolted-on. (The glassy tokens the
dashboard uses — `--glass-*`, `--r-*`, `--sh-*` — aren't in `tokens`; the design kit
bakes those, since they only change with light/dark, not the accent.) Honour
`appearance.reducedMotion` / `noTransparency`, and the frame also inherits the OS
`prefers-reduced-motion`. Dashboard widgets are wrapped in the native glassy tool card
and auto-size to the height you report via `trek:resize`, so render flush and
transparent — the design kit reports your height for you.

## Settings

Declare settings in the manifest; TREK renders the form (you write no settings
UI). `scope: "instance"` settings are set once by the admin; `scope: "user"`
settings are per-user. `secret: true` fields are stored encrypted and delivered
decrypted through `ctx.config` (server-side only) — never to the iframe. Resolved
values arrive in `ctx.config`.

## Provider hooks

A hook is core calling **into** your plugin for data (host→plugin). Declare it on
the plugin definition and grant the matching `hook:*` permission:

```js
module.exports = definePlugin({
  hooks: {
    placeDetailProvider: {
      // Return extra rows TREK renders natively on a place. Runs with the current
      // user bound, on a short timeout — a slow/failing call is skipped, never fatal.
      async getDetails(placeId, ctx) {
        return [{ label: 'Crowd', value: 'Quiet now' }, { label: 'Guide', url: 'https://…' }]
      },
    },
  },
})
```

| Hook | Permission | Status |
|---|---|---|
| `placeDetailProvider.getDetails(placeId, ctx)` → `{ label, value?, url? }[]` | `hook:place-detail-provider` | **live** — shown in the place-detail panel; also `GET /api/place-details/:placeId` |
| `warningProvider.getWarnings(tripId, ctx)` → `{ level, message, dayId?, placeId? }[]` | `hook:trip-warning-provider` | **live** — validation warnings shown as a non-blocking banner in the trip planner; also `GET /api/trip-warnings/:tripId` |
| `photoProvider` / `calendarSource` | `hook:photo-provider` / `hook:calendar-source` | reserved — declared + the `invoke.hook` transport exists, but no core consumer calls them yet |

Each hook method receives its args plus the per-invocation `ctx`, so any `ctx.trips.*`
read it makes is membership-checked against the current user (like a route handler).

## Event subscriptions

React to core activity with `events` + the `events:subscribe` permission. Handlers
fire **without a user** (like a job) and receive only the **event name + tripId** —
never the payload — so a plugin can react to activity without seeing content:

```js
module.exports = definePlugin({
  events: [
    { on: 'place:created', async handler({ event, tripId }, ctx) {
        await ctx.db.exec('INSERT INTO activity (trip, evt) VALUES (?, ?)', tripId, event)
    } },
    { on: '*', handler(e) { /* firehose: every core event */ } },
  ],
})
```

Delivery is fire-and-forget on a short timeout, so a slow subscriber never blocks a
core write. Because there's no user, trip reads (`ctx.trips.*`) are refused inside a
handler — use the plugin's own `ctx.db`, `ctx.ws.*`, or an outbound call. A plugin's
own `plugin:*` broadcasts are never delivered back, so handlers can't loop. Common
events: `place:*`, `day:*`, `assignment:*`, `budget:*`, `file:*`, `accommodation:*`.

## Dependencies

A plugin can declare that it needs certain **addons** enabled, or other **plugins**
installed, before it will run. Both are top-level manifest arrays, and both are
enforced at **activation** — installing always succeeds, so a missing dependency is a
fixable state, never a broken download.

### `requiredAddons`

```json
"requiredAddons": ["budget", "journey"]
```

Addon ids (see [[Addons Overview|Addons-Overview]]) that must be **enabled** for the
plugin to activate. If one is off, enabling the plugin is refused and the admin panel
names the addon to turn on. Turning a required addon **off** while the plugin is
running **auto-disables the plugin** (and anything that depends on it) — a plugin
never runs against a disabled addon. Ids are validated for shape only, so a plugin may
name an addon a given TREK build doesn't have; it just stays un-activatable there.

### `pluginDependencies`

```json
"pluginDependencies": [
  { "id": "koffi", "version": ">=1.2.0 <2.0.0" }
]
```

Other plugins that must be **installed and version-satisfied** (a standard semver
range) before this one activates. That range is the real contract for anything you
call on the dependency (see [Talking to other plugins](#talking-to-other-plugins)).

Enforcement, all at activation time:

- **Missing** dependency → activation is blocked and the panel offers a one-click
  **download** that fetches the newest registry version satisfying your range (pulling
  *its* own dependencies too), then retries.
- **Installed but out of range** → same block; the panel offers to update it.
- **Installed but disabled** → enabling your plugin **auto-enables the dependency
  first**, transitively (deepest dependency first).
- **Disabling a dependency** cascades: every plugin that (transitively) depends on it
  is disabled too.
- A dependency **cycle** (A → B → A) is refused with a clear error.

Dependencies are also resolved deps-first at boot, so a plugin's dependencies are
already up before it starts.

## Talking to other plugins

Isolation is the default — plugins can't see each other. To let a plugin be *used* by
the plugins that depend on it, it opts in by declaring a surface in its manifest
`capabilities`, and the host routes calls/events between the two child processes.
There is **no permission** for this: authorization is the dependency edge itself —
plugin A may call or subscribe to plugin B only if A declares B as a satisfied
`pluginDependency`, and only for the names B publicly declares.

### Exports — request / response

The **dependency** (B) exposes named functions and lists them in `capabilities.provides`:

```js
// plugin "koffi"
module.exports = definePlugin({
  exports: {
    // `args` is whatever the caller passed; `ctx` is a per-call context.
    async convert({ amount, from, to }, ctx) {
      return { amount: amount * rate(from, to), to }
    },
  },
})
// manifest: "capabilities": { "provides": ["convert"] }
```

The **dependent** (A) declares koffi as a dependency and calls it:

```js
// manifest: "pluginDependencies": [{ "id": "koffi", "version": ">=1.0.0 <2.0.0" }]
const out = await ctx.plugins.call('koffi', 'convert', { amount: 10, from: 'USD', to: 'EUR' })
```

- A call is refused (`RESOURCE_FORBIDDEN`) if the target isn't a satisfied dependency,
  isn't currently active, or the function isn't in the target's `provides`.
- **The acting user is propagated:** B's export runs as A's current user, so any
  `ctx.trips.*` read B makes is membership-checked against that user — B can't be
  tricked into reading data the calling user couldn't see.
- The call is bounded by a timeout and recorded in the capability audit log
  (`plugin:<target>#<fn>`), attributed to A and the acting user.
- B owns its contract: only functions in `provides` are reachable — routes, jobs and
  helpers stay private. Because your `pluginDependencies` range pins B's version, B can
  refactor internals freely and only breaks you on a major bump.

### Events — publish / subscribe

The **emitter** (B) declares event names in `capabilities.emits` and publishes them:

```js
// manifest: "capabilities": { "emits": ["rate.updated"] }
ctx.events.emit('rate.updated', { pair: 'USD/EUR', rate: 0.92 })   // fire-and-forget
```

A **dependent** (A) subscribes by naming the source plugin + event:

```js
module.exports = definePlugin({
  subscriptions: [
    { plugin: 'koffi', event: 'rate.updated', async handler(payload, ctx) {
        await ctx.db.exec('UPDATE cache SET rate = ?', payload.rate)
    } },
  ],
})
```

- An event reaches A only if A declares `koffi` as a satisfied dependency **and**
  subscribed to that `(plugin, event)`. Emitting an event not in your `emits` is refused.
- Like core [event subscriptions](#event-subscriptions), handlers run **without a
  user** — but unlike them they **do** receive the emitter's payload. Delivery is
  fire-and-forget on a short timeout; a slow subscriber never blocks the emitter.

## Testing without a running TREK

`createMockHost` gives you a `ctx` that enforces the **same** permission model, so
a test can prove your plugin degrades gracefully when a grant is missing:

```js
import { createMockHost } from 'trek-plugin-sdk/testing'

const { ctx, broadcasts } = createMockHost({
  grants: ['db:read:trips'],
  trips: { 1: { members: [42], data: { id: 1, name: 'Japan' } } },
})
await ctx.trips.getById(1, 42)                        // ok — member
await expect(ctx.trips.getById(1, 99)).rejects…       // RESOURCE_FORBIDDEN
await expect(ctx.db.query('SELECT 1')).rejects…       // PERMISSION_DENIED (no db:own)
```

The mock db is a recorder — set `queryResults` for canned rows, or use an
integration test for real SQL. To test inter-plugin calls, pass
`pluginExports: { koffi: { convert: (args) => … } }` and assert on `mock.emitted`
for anything your plugin publishes via `ctx.events.emit`.

## Rules

- **No native modules** (`.node`, `binding.gyp`, `prebuilds/`) — rejected at pack
  and install time.
- **Don't vendor `trek-plugin-sdk`** — it's injected at runtime (devDependency
  only). Vendor any *other* runtime deps: TREK never runs `npm install` on a plugin.
- **Ship built JS** in `server/index.js` and pre-built static files in `client/`.
  `.ts` and `.map` files are stripped by `pack`.
- Declare every outbound host in `egress[]` whenever you use `http:outbound`.

## Manifest reference (`trek-plugin.json`)

| Field | Type | Notes |
|---|---|---|
| `id` | string, **required** | lowercase slug, `^[a-z][a-z0-9-]{2,39}$` (3–40 chars). Must match the directory name. |
| `name` | string, **required** | display name; also the page nav label. |
| `version` | string, **required** | semver (`1.2.3`, optional pre-release). |
| `apiVersion` | number | plugin API version (currently `1`; `PLUGIN_API_VERSION`). Defaults to `1`. |
| `type` | string, **required** | `integration` \| `page` \| `widget` \| `trip-page`. |
| `trek` | string | supported TREK range, e.g. `">=3.2.0 <4.0.0"`. Its lower bound becomes `minTrekVersion` in the registry entry. |
| `author` | string | shown in the store. |
| `description` | string | one-line summary for the store. |
| `icon` | string | lucide-react icon name (default `Blocks`); used for the page nav entry. |
| `homepage` | string | project URL. |
| `license` | string | shown in the store detail (read from the manifest, not enforced). |
| `nativeModules` | boolean | must be `false`/absent — `true` is rejected. |
| `permissions` | string[] | see below. |
| `egress` | string[] | allowed outbound hosts; required (non-empty, no bare `*`) when any `http:outbound` permission is present. |
| `capabilities.widget` | object | `{ title, slot, defaultSize }` — `slot` is `sidebar` (default), `hero`, or `place-detail`. |
| `capabilities.provides` | string[] | function names this plugin exposes to its dependents via `ctx.plugins.call` (see [Talking to other plugins](#talking-to-other-plugins)). |
| `capabilities.emits` | string[] | event names this plugin publishes to its dependents via `ctx.events.emit`. |
| `requiredAddons` | string[] | addon ids that must be **enabled** for the plugin to activate (see [Dependencies](#dependencies)). |
| `pluginDependencies` | `{ id, version }[]` | other plugins (semver range) that must be installed + version-satisfied to activate. |
| `settings` | array | setting fields (below). |

**Permissions** (unknown values are rejected):

| Permission | Grants |
|---|---|
| `db:own` | `ctx.db` — your own SQLite file |
| `db:read:trips` | `ctx.trips.*` (membership-checked, route handlers only) |
| `db:read:packing` | `ctx.packing.list(tripId)` — a trip's packing items (membership-checked) |
| `db:read:files` | `ctx.files.list(tripId)` — a trip's files, trash excluded (membership-checked) |
| `db:read:costs` | `ctx.costs.getByTrip` / `ctx.costs.listMine` (Costs addon, route handlers only) |
| `db:write:costs` | `ctx.costs.create/update/delete` (Costs addon + acting user's `budget_edit`) |
| `db:write:places` | `ctx.places.create/update/delete` (acting user's `place_edit`) |
| `db:write:days` | `ctx.days.create/update/delete` (acting user's `day_edit`) |
| `db:write:itinerary` | `ctx.itinerary.assign/unassign` (acting user's `day_edit`) |
| `db:write:trips` | `ctx.trips.update` (acting user's `trip_edit`) |
| `db:meta` | `ctx.meta.*` — your own namespaced data on a trip/place/day |
| `db:read:users` | `ctx.users.getById` |
| `events:subscribe` | receive core activity events via `events: [...]` (name + tripId only) |
| `ws:broadcast:trip` | `ctx.ws.broadcastToTrip` |
| `ws:broadcast:user` | `ctx.ws.broadcastToUser` |
| `http:outbound` or `http:outbound:<host>` | outbound HTTP to `egress[]` hosts |
| `hook:place-detail-provider` | `hooks.placeDetailProvider` — extra place rows TREK renders (see [Provider hooks](#provider-hooks)) |
| `hook:trip-warning-provider` | `hooks.warningProvider` — validation warnings in the planner (see [Provider hooks](#provider-hooks)) |
| `hook:photo-provider` / `hook:calendar-source` | reserved (see [Provider hooks](#provider-hooks)) |

> There is **no `ws:broadcast:*`** — use `ws:broadcast:trip` and/or
> `ws:broadcast:user` explicitly.

**Settings field** (`settings[]`):

| Key | Notes |
|---|---|
| `key` | **required** identifier; empty-key entries are dropped. |
| `label` | form label. |
| `input_type` | **snake_case**; e.g. `text` (default), `password`, `number`, `select`. |
| `scope` | `instance` (default) or `user`. |
| `required` | boolean. |
| `secret` | boolean — encrypted at rest, decrypted only into `ctx.config`. |
| `placeholder`, `hint` | form hints. |
| `options` | `[{ value, label }]` for select inputs. |
| `oauth` | `{ initPath, callbackPath }` for OAuth flows. |

**Page nav:** the host builds a page plugin's nav entry from the top-level `name`
and `icon`. `create-trek-plugin` also scaffolds a `capabilities.nav` block, but the
installed-manifest parser only consumes `capabilities.widget` — set `name`/`icon`
to control the nav entry.

See [[Plugin Permissions|Plugin-Permissions]] for the full permission model.

## The `trek-plugin` CLI

Run `npx trek-plugin-sdk` **with no command** in a terminal and you get an
interactive menu (create / dev / validate / pack / publish, with signing and
registry-entry commands under **Advanced…**); it just picks which command to run,
then that command prompts for whatever it needs. Pass a command explicitly to skip
the menu (and for scripts/CI).

Author commands (from `trek-plugin-sdk`):

```bash
# 1. Manifest + layout checks (a subset of the registry CI — CI additionally
#    verifies the GitHub release exists, the artifact sha256, and the README
#    over the network).
trek-plugin validate [dir]

# 2. Build plugin.zip in the installer's exact layout. Prints sha256 + byte size,
#    refuses native binaries, enforces the same size limits (25MB/file, 50MB total).
#    Ships trek-plugin.json, README.md, LICENSE(.md), package.json + server/ + client/.
#    docs/ is intentionally NOT shipped — the store fetches docs/screenshot.png
#    from your repo. --json prints a machine-readable result.
trek-plugin pack [dir] [--out plugin.zip] [--json]

# 3. Emit the ready-to-PR registry entry: commitSha (resolved from the git tag),
#    downloadUrl, sha256, size and minTrekVersion (derived from the manifest
#    'trek' range) all computed for you. --merge prepends a new version onto an
#    existing entry (the update case, kept newest-first).
trek-plugin entry --repo owner/name --tag vX.Y.Z [--zip plugin.zip] [--merge entry.json] [--out file]

# 4. One shot: pack -> create the GitHub release (via gh) -> print the entry.
trek-plugin release [dir] --repo owner/name --tag vX.Y.Z
```

To publish, open a PR that adds the emitted JSON as
`registry/plugins/<id>.json` in the TREK-Plugins registry.

## Registry & publishing

- **No reserved namespaces** — any unique slug id is accepted. (A tiny set of ids
  like `registry`/`install`/`rescan` is blocked only because they'd collide with
  admin API routes.)
- **Owner-binding** still prevents anyone but the original author from repointing
  an existing id to a different repo.
- **Optional author signing:** an entry may carry `authorPublicKey` (stable,
  TOFU-pinned on first install) and each version a `signature` over the artifact
  bytes. Unsigned plugins install on sha256 alone; a plugin that was signed can't
  later go unsigned or swap its key without an explicit admin re-trust.

Full walkthrough: [[Publishing a Plugin|Plugin-Publishing]]. Overview:
[[Plugins|Plugins]].
