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
[`trip-doctor`](https://github.com/mauriceboe/TREK/tree/main/plugin-sdk/examples/trip-doctor)
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

## Where things run

| Surface | Runs | Gets |
|---|---|---|
| `routes` | forked server child | `ctx` bound to the HTTP request's user |
| `jobs` | forked server child, on a schedule | `ctx` with **no** user (can't read user-scoped data) |
| `hooks` | forked server child, when core asks | `ctx` bound to the user who triggered the read, short timeout |
| `widget` / `page` | sandboxed iframe (no same-origin) | `postMessage` bridge; calls its own routes via `trek:invoke` |
