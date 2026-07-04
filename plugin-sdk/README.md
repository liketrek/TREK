# trek-plugin-sdk

The SDK for building [TREK](https://github.com/mauriceboe/TREK) plugins.

## Scaffold a plugin

```bash
npx trek-plugin-sdk create my-plugin --type integration|page|widget
cd my-plugin
# build server/index.js, fill in the README
npx trek-plugin-sdk validate .
```

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

## Publish

The SDK does the fiddly parts (zipping, hashing, sizing, writing the registry
entry) so you don't compute anything by hand:

```bash
npx trek-plugin-sdk validate                 # manifest + layout OK?
npx trek-plugin-sdk pack                      # -> plugin.zip, prints sha256 + size
gh release create v1.0.0 plugin.zip       # attach the artifact to your tag
npx trek-plugin-sdk entry --repo you/repo --tag v1.0.0
                                          # -> the ready-to-PR registry entry JSON
```

Or in one step: `npx trek-plugin-sdk release --repo you/repo --tag v1.0.0` packs,
creates the GitHub release, and prints the entry. Then paste the entry into a PR
against [TREK-Plugins](https://github.com/mauriceboe/TREK-Plugins) as
`registry/plugins/<id>.json`.

**Updating** an already-listed plugin: bump `version`, tag, and pass
`--merge registry/plugins/<id>.json` to `entry` — it prepends the new version,
keeping the array newest-first.

## Exports

- `definePlugin(def)` + all the plugin types (`PluginContext`, `PluginRoute`, `PluginJob`, `PhotoProvider`, `CalendarSource`).
- `PLUGIN_API_VERSION` — embed as `apiVersion` in your manifest.
- `validateManifest(json)` — the manifest rules the server loader uses.
- `createMockHost(opts)` (from `trek-plugin-sdk/testing`).

## CLIs

- `create-trek-plugin <name> --type …` — scaffold a working plugin.
- `trek-plugin validate [dir]` — check the manifest + layout locally (the manifest rules the registry CI also runs; CI additionally verifies the release, artifact hash and README over the network).
- `trek-plugin pack [dir] [--out plugin.zip] [--json]` — build the artifact, print `sha256` + `size`.
- `trek-plugin entry --repo o/n --tag vX [--zip z] [--merge entry.json] [--out f]` — emit the registry entry.
- `trek-plugin release [dir] --repo o/n --tag vX` — pack → GitHub release → entry, in one go.

The SDK tooling in this repo is MIT. Your plugin is your own code under your own license.
