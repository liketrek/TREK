# Plugin Cookbook

Short, copy-paste recipes for the things plugins can do. Each one names the
permission it needs (declare it in `trek-plugin.json` → `permissions`) and the
capability it uses. For the full API see [[Plugin Development|Plugin-Development]];
for the permission catalogue see [[Plugin Permissions|Plugin-Permissions]].

> Every trip/place/day operation is **membership-checked by the host** against the
> user bound to the invocation — your plugin never passes a user id. Writes also
> need that user's `*_edit` permission. A read/write you're not allowed to do fails
> loudly; it never silently escalates.

The complete, runnable version of these recipes is the
[`trip-doctor`](https://github.com/liketrek/TREK/tree/main/plugin-sdk/examples/trip-doctor)
example plugin.

---

## Read a trip's places and bookings

**Needs:** `db:read:trips`

```js
async handler(req, ctx) {
  const places = await ctx.trips.getPlaces(Number(req.query.tripId))
  const bookings = await ctx.trips.getReservations(Number(req.query.tripId))
  // …use them; the host already checked req.user can see this trip
}
```

## Read the packing list or files of a trip

**Needs:** `db:read:packing` · `db:read:files` (declare only what you use)

```js
const packing = await ctx.packing.list(tripId)   // hydrated bags/assignees
const files   = await ctx.files.list(tripId)      // trash excluded
```

Both are membership-checked against the current user — same gate as `ctx.trips.*`.

## Add / move something on the itinerary

**Needs:** `db:write:places` · `db:write:days` · `db:write:itinerary` (declare only what you use)

```js
const place = await ctx.places.create(tripId, { name: 'Teamlab', lat: 35.62, lng: 139.78 })
const day   = await ctx.days.create(tripId, { date: '2027-04-02', notes: 'Odaiba' })
await ctx.itinerary.assign(tripId, day.id, place.id, 'buy tickets first')
// days.create accepts { date?, notes?, position? }; set a day title later with ctx.days.update(tripId, day.id, { title: 'Odaiba' }).
```

Updates and deletes mirror the REST app exactly (`ctx.places.update/delete`,
`ctx.days.update/delete`, `ctx.itinerary.unassign`). They broadcast the same live
event, so open web sessions update instantly.

## Tag a core entity — no schema fork

**Needs:** `db:meta`

Store your own JSON-serialisable data on a trip, place or day. Rows are namespaced
to **your plugin id** — no other plugin can read or overwrite them.

```js
await ctx.meta.set('place', placeId, 'lastCheckedAt', Date.now())
const when = await ctx.meta.get('place', placeId, 'lastCheckedAt')
const all  = await ctx.meta.list('place', placeId)   // { lastCheckedAt: 172… }
await ctx.meta.delete('place', placeId, 'lastCheckedAt')
```

Reads need trip access; writes additionally need the entity's edit permission.

## Contribute extra info to a place (rendered natively)

**Needs:** `hook:place-detail-provider`

Return rows and TREK draws them at the foot of the place panel — no iframe.

```js
module.exports = {
  hooks: {
    placeDetailProvider: {
      async getDetails(placeId, ctx) {
        return [
          { label: 'Crowd', value: 'Quiet right now' },
          { label: 'Official site', url: 'https://…' },
        ]
      },
    },
  },
}
```

## Raise validation warnings on a trip

**Needs:** `hook:trip-warning-provider`

Return problems and they show as a non-blocking banner in the planner.

```js
hooks: {
  warningProvider: {
    async getWarnings(tripId, ctx) {
      const places = await ctx.trips.getPlaces(tripId)
      return places
        .filter((p) => p.lat == null)
        .map((p) => ({ level: 'warning', message: `"${p.name}" has no location`, placeId: p.id }))
    },
  },
}
```

`level` is `'info' | 'warning' | 'error'`; `dayId`/`placeId` are optional anchors.

## Push a live update to a trip / a user

**Needs:** `ws:broadcast:trip` and/or `ws:broadcast:user`

```js
ctx.ws.broadcastToTrip(tripId, 'doctor:rechecked', { count })   // → plugin:<id>:doctor:rechecked
ctx.ws.broadcastToUser(userId, 'nudge', { text: '…' })          // (userId, event, data) — only that user
```

Events are automatically namespaced to `plugin:<your-id>:…` so they can't collide
with core events.

## React to core activity

**Needs:** `events:subscribe`

Handlers run with no user and get the event name + tripId only (never the payload).

```js
events: [
  { on: 'file:created', async handler({ tripId }, ctx) {
      await notifySlack(`New file on trip ${tripId}`)   // needs http:outbound
  } },
]
```

Fire-and-forget on a short timeout — never blocks a core write. Trip reads are
refused (no user); use `ctx.db`, `ctx.ws.*`, or an outbound call. Your own
`plugin:*` broadcasts are never re-delivered, so handlers can't loop.

## Depend on another plugin — call it and hear its events

**Needs:** a `pluginDependencies` entry for the other plugin (no permission).

Expose a contract from the **dependency** (declare the names in
`capabilities.provides` / `capabilities.emits`):

```js
// plugin "koffi"  ·  manifest: "capabilities": { "provides": ["convert"], "emits": ["rate.updated"] }
exports: {
  async convert({ amount, from, to }) { return { amount: amount * rate(from, to), to } },
},
async onLoad(ctx) { ctx.events.emit('rate.updated', { pair: 'USD/EUR' }) },
```

Consume it from the **dependent** (declare koffi as a dependency):

```js
// manifest: "pluginDependencies": [{ "id": "koffi", "version": ">=1.0.0 <2.0.0" }]
routes: [
  { method: 'GET', path: '/price', async handler(_req, ctx) {
      const out = await ctx.plugins.call('koffi', 'convert', { amount: 10, from: 'USD', to: 'EUR' })
      return { status: 200, body: JSON.stringify(out) }
  } },
],
subscriptions: [
  { plugin: 'koffi', event: 'rate.updated', async handler(payload, ctx) { ctx.log.info('rates changed', payload) } },
],
```

TREK auto-enables koffi before your plugin, routes the call (as your acting user),
and refuses it if koffi isn't a satisfied dependency or doesn't export `convert`. See
[[Plugin Development#talking-to-other-plugins|Plugin-Development]].

## Match the TREK look

Add `<!-- trek:ui -->` to your widget's `<head>`. The dev server and `pack` inline
TREK's token-driven kit (glass surfaces, buttons, inputs, dark-mode) and a
`window.trek` bridge with the live theme + tokens. See
[[Plugin Development#the-design-kit-recommended|Plugin-Development]]. `window.trek.ui`
gives you bundler-free, kit-styled DOM builders (`ui.el/button/card/chip/input/mount`).

---

## Notify a user or a trip

**Needs:** `notify:send`

The plugin supplies target + plain text; the host owns delivery and the user's notification preferences.

```js
await ctx.notify.send({
  title: 'Trip rechecked',
  body: '3 places still need a location',
  scope: 'trip', targetId: tripId,   // or scope:'user', targetId: the acting user
  link: '/trips/' + tripId,
})
```

The recipient is **forced** by the host: `scope:'user'` can only reach the acting user, `scope:'trip'` only a trip they belong to. You can't notify anyone else.

---

## Become a notification channel (Gotify, Pushover, …)

**Needs:** `hook:notification-channel` + `http:outbound:<host>` (and a matching `egress`)

The recipe above *produces* a notification. This one **delivers** one — your plugin becomes a
channel next to email / webhook / ntfy in the user's notification preferences.

```bash
npx create-trek-plugin my-gotify --type integration --template notification-channel
```

```js
module.exports = definePlugin({
  hooks: {
    notificationChannel: {
      async send(msg, config, ctx) {
        // msg is ALREADY rendered in the recipient's language, deep link included.
        // config is that recipient's own scope:'user' settings, decrypted for you.
        const res = await fetch(`${config.serverUrl}/message`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'X-Gotify-Key': config.appToken },
          body: JSON.stringify({ title: msg.title, message: msg.body }),
        })
        if (!res.ok) throw new Error(`Gotify responded ${res.status}`)  // host logs + isolates
      },
      async test(config) { /* backs the "Send test" button */ },
    },
  },
})
```

```json
"permissions": ["hook:notification-channel", "http:outbound:gotify.example.com"],
"egress": ["gotify.example.com"],
"capabilities": { "notificationChannel": { "title": "Gotify" } },
"settings": [
  { "key": "serverUrl", "scope": "user", "required": true },
  { "key": "appToken",  "scope": "user", "required": true, "secret": true }
]
```

The gotcha worth knowing up front: this hook is **host-initiated for an arbitrary recipient**, so
unlike every other hook it runs with **no acting user**. `ctx.settings.get()` returns `undefined`
and trip reads are refused — the recipient's credentials come in as `config` instead. That's the
whole point: you can be handed someone's push token without being handed their trips.

Targeting a **self-hosted** Gotify? Your manifest can't name the user's hostname, so add
`"operatorEgress": true` and let the admin add the real host after install
(Admin → Plugins → Allowed hosts). See
[Plugin-Development → Operator-supplied egress hosts](Plugin-Development.md#operator-supplied-egress-hosts-operatoregress),
plus [Notification channels](Plugin-Development.md#notification-channels) for the event list, the
"configured" rule, and the `TREK_PLUGIN_ALLOW_PRIVATE_EGRESS` flag you need if the service runs
on your own LAN.

---

## Put a "Test connection" button on your settings page

**Needs:** nothing — an action is your own code, run for the user who clicked it.

Declare the buttons in the manifest, implement them on the definition:

```json
"actions": [
  { "key": "testConnection", "label": "Test connection", "hint": "Pings the API." },
  { "key": "purge",          "label": "Delete my data", "danger": true }
]
```

```js
module.exports = definePlugin({
  actions: {
    async testConnection(ctx) {
      // USER-INITIATED: the acting user is whoever clicked, so ctx.settings.get()
      // returns THEIR value — which is what makes "test MY credentials" possible.
      const token = await ctx.settings.get('appToken')
      const res = await fetch('https://api.example.com/ping', { headers: { authorization: token } })
      return { ok: res.ok, message: res.ok ? 'Connected' : `Failed: ${res.status}` }
    },
  },
})
```

The buttons render under your fields in **Settings → Plugins**, with the result shown
beside them. Return `{ ok, message? }`; throwing is the same as `{ ok: false }` carrying
the error text. `danger: true` asks for confirmation first. The host refuses any key your
manifest didn't declare, and bounds the message it shows (200 chars, emoji stripped).

Contrast with the `notificationChannel` hook, which is **host**-initiated and therefore
has *no* acting user — there, `ctx.settings.get()` returns `undefined` and the recipient's
credentials arrive as an argument instead.

---

## Ask the configured LLM

**Needs:** `ai:invoke`

Uses whatever provider the admin/user set up — your plugin never holds a key.

```js
const { text } = await ctx.ai.complete('Summarise this trip in one line', 'You are a concise travel assistant')

const { results } = await ctx.ai.extract(
  pastedBookingText,
  { type: 'object', properties: { hotel: { type: 'string' }, checkIn: { type: 'string' } } },
)
```

Output is **data**. To store it, push it through a gated write yourself (e.g. `ctx.reservations.create`).

---

## Call a third-party API the user connected

**Needs:** `oauth:client` (and `http:outbound` for the fetch)

The user connects the service under Settings → Plugins → Connect. The host keeps the refresh token and client secret; you only ever get a short-lived access token for the acting user.

```js
const token = await ctx.oauth.getAccessToken()   // null if not connected, or in a userless context
if (token) {
  const res = await fetch('https://api.example.com/me', { headers: { Authorization: `Bearer ${token}` } })
}
```

---

## Convert currencies

**Needs:** `rates:read`

```js
const rates = await ctx.rates.get('EUR')   // { USD: 1.08, GBP: 0.85, … } — or null on an upstream failure
const usd = 100 * rates.USD
```

Tenant-free and cached upstream — no trip access needed.

---

## Run work on a schedule

**Needs:** `jobs:run`

Two flavours: a fixed **cron job** declared in the manifest, or a **dynamic timer** you set at runtime via `ctx.scheduler`.

```js
module.exports = {
  // fixed cron — runs on node-cron
  jobs: [
    { id: 'nightly', schedule: '0 3 * * *', async handler(ctx) { /* … */ } },
  ],

  // dynamic timers fire back into `scheduled`
  scheduled(input, ctx) {
    ctx.log.info('fired', { name: input.name, payload: input.payload })
  },

  routes: [
    { method: 'POST', path: '/remind', async handler(req, ctx) {
        await ctx.scheduler.in(60_000, 'remind', { tripId: 1 })
        // also: .at(epochMs, name, payload) · .every(ms, name, payload) · .cancel(name)
        return { status: 200 }
    } },
  ],
}
```

Both jobs and scheduled tasks run with **no acting user** (trip reads are refused; only your own db + declared egress). `ctx.scheduler.set` is an upsert by name and survives restarts. Caps: ≤100 tasks/plugin, ≤128-char name, ≤8 KB payload, recurring interval ≥60s, ≤1 year out.

---

## Contribute native primitives to core views

Six declarative hooks let a plugin push data into TREK's own screens — the host renders and sanitizes everything, so no iframe and no plugin JS on the canvas. Each needs its own `hook:*` permission, runs with the current user bound on a short timeout, and a slow or failing call is skipped (never fatal). The host caps counts and lengths.

```js
hooks: {
  // hook:table-contributor — cells/buttons on a row. view ∈ reservations|places|day|costs|packing|files
  tableContributor: { async getContributions(view, tripId, ctx) {
    return [{ kind: 'column', entityId: 42, id: 'crowd', label: 'Crowd', value: 'Quiet', tone: 'success' }]
  } },

  // hook:map-marker-provider — pins on the trip map (#587)
  mapMarkerProvider: { async getMarkers(tripId, ctx) {
    return [{ id: 'm1', lat: 35.62, lng: 139.78, label: 'Teamlab', popupText: 'Opens 10:00' }]
  } },

  // hook:pdf-section-provider — text sections appended to the trip PDF export
  pdfSectionProvider: { async getSections(tripId, ctx) {
    return [{ title: 'Notes', paragraphs: ['Bring cash.'], table: { headers: ['Day', 'Plan'], rows: [['1', 'Odaiba']] } }]
  } },

  // hook:atlas-layer-provider — country tint layers on the Atlas map (user-scoped, no target arg)
  atlasLayerProvider: { async getLayers(ctx) {
    return [{ id: 'wishlist', name: 'Wishlist', countries: [{ code: 'JP', tone: 'warn' }] }]
  } },

  // hook:journal-entry-provider — extra rows under a journal entry
  journalEntryProvider: { async getRows(entryId, ctx) {
    return [{ label: 'Weather', value: 'Sunny 22°C' }]
  } },

  // hook:trip-card-provider — badges on dashboard trip cards (tripIds = the cards on screen)
  tripCardProvider: { async getCards(tripIds, ctx) {
    return tripIds.map((id) => ({ tripId: id, id: 'days', label: 'Days left', value: '12' }))
  } },
}
```

`tone` is `'default' | 'success' | 'warn' | 'danger'`; any `url` must be http/https/mailto; `icon` is a lucide icon name. A table `action` (instead of a `column`) is a labelled button whose target opens your sandboxed frame or calls one of your routes.

---

## Honour account deletion and data export (GDPR)

**Needs:** `hook:user-data`

The host calls these when a TREK account is erased or its data is exported. Both are **userless** — you get only a `userId` and act on your OWN db, so the grant leaks no read into core data.

```js
module.exports = {
  // Erasure — called durably (queued, retried until it succeeds), so make it idempotent.
  async deleteUserData({ userId }, ctx) {
    await ctx.db.exec('DELETE FROM my_rows WHERE user_id = ?', userId)
  },
  // Portability — return a JSON-serialisable value the host aggregates into the export.
  async exportUserData({ userId }, ctx) {
    return await ctx.db.query('SELECT * FROM my_rows WHERE user_id = ?', userId)
  },
}
```

---

## Write across every subsystem

Beyond places/days/itinerary, TREK 3.3.0 opens create/update/delete on almost every trip subsystem. Each is membership-checked against the acting user and needs its `db:write:*` scope **plus** the app's edit permission — declare only what you use.

```js
// Bookings & lodging — needs 'reservation_edit' / 'day_edit'
await ctx.reservations.create(tripId, { type: 'flight', title: 'NRT → HND', endpoints: [/* legs */] })
await ctx.accommodations.create(tripId, { place_id, start_day_id, end_day_id, check_in: '15:00' })
// Packing & to-dos — needs 'packing_edit'
await ctx.packing.create(tripId, { name: 'Passport', visibility: 'personal' })
await ctx.todos.create(tripId, { name: 'Buy JR pass', due_date: '2027-04-01' })
// Costs (budget) — needs 'budget_edit' + the Costs addon
await ctx.costs.create(tripId, { title: 'Hotel', amount: 120, currency: 'EUR' })
// Collab notes/polls/chat — needs 'collab_edit' + the Collab addon
await ctx.collab.createNote(tripId, { title: 'Meeting point' })
// Day notes — needs 'day_edit'
await ctx.daynotes.create(tripId, dayId, { content: 'Rainy — swap plans' })
// Tags (the acting user's own)
const tag = await ctx.tags.create({ name: 'foodie', color: '#4F46E5' })
```

The matching reads mirror the app 1:1: `ctx.trips.getReservations/getAccommodations/getDays`, `ctx.packing.list`, `ctx.costs.getByTrip`, `ctx.collab.listNotes/listPolls/listMessages`, `ctx.daynotes.list`, `ctx.todos.list`, `ctx.tags.list`, `ctx.categories.list`.

---

## Write the acting user's own Atlas / Vacay / Journal / Collections

These belong to the **user** (not one trip), each gated on its addon being enabled.

```js
await ctx.atlas.markCountry('JP')                                   // db:write:atlas
await ctx.atlas.createBucketItem({ name: 'See Mt Fuji', country_code: 'JP' })
await ctx.vacay.toggleEntry('2027-04-02')                          // db:write:vacay — toggles one PTO day
const j = await ctx.journal.createJourney({ title: 'Japan 2027' })  // db:write:journal
await ctx.journal.createEntry(j.id, { entry_date: '2027-04-02' })
const c = await ctx.collections.create({ name: 'Tokyo eats' })      // db:write:collections
await ctx.collections.savePlace({ collection_id: c.id, name: 'Ramen shop', lat: 35.6, lng: 139.7 })
```

Reads: `ctx.atlas.visited()/bucketList()`, `ctx.vacay.mine()`, `ctx.journal.listMine()/getEntries()`, `ctx.collections.listMine()/get()`.

---

## Batch writes atomically, and read per-user settings

**Needs:** `db:own` (for `db.tx`); `ctx.settings` needs no permission.

```js
// db.tx — all commit or all roll back, on your OWN db (≤100 statements; reads see the batch's earlier writes)
await ctx.db.tx([
  { sql: 'INSERT INTO cache(k, v) VALUES(?, ?)', args: ['a', 1] },
  { sql: 'UPDATE cache SET v = v + 1 WHERE k = ?', args: ['a'] },
])

// ctx.settings.get — the ACTING USER's own value for a scope:'user' settings field (decrypted host-side)
const apiKey = await ctx.settings.get('apiKey')   // undefined when unset or userless → fall back to ctx.config
```

`ctx.config` is the admin-owned instance settings; `ctx.settings` is that user's private values for the `scope:'user'` fields you declared in the manifest.

---

## Where things run

| Surface | Runs | Gets |
|---|---|---|
| `routes` | forked server child | `ctx` bound to the HTTP request's user |
| `jobs` | forked server child, on a schedule | `ctx` with **no** user (can't read user-scoped data) |
| `hooks` | forked server child, when core asks | `ctx` bound to the user who triggered the read, short timeout |
| `widget` / `page` | sandboxed iframe (no same-origin) | `postMessage` bridge; calls its own routes via `trek:invoke` |
