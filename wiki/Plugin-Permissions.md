# Plugin Permissions

A plugin declares the permissions it needs in `trek-plugin.json`. You review that
list **before you install** — on the plugin's card under Discover — and it only
runs once you turn it on. Because plugins run in an isolated process, **an
ungranted capability is physically unreachable**, not just disallowed. See
[[Plugins]] for the isolation model.

## Reference

| Permission | Grants | Notes |
|---|---|---|
| `db:own` | Read/write the plugin's **own** SQLite file via `ctx.db` — `db.query`, `db.exec`, **and `db.migrate`** | A separate file per plugin — never `trek.db`. `db.migrate` runs a keyed, idempotent migration (schema/table creation, e.g. `CREATE TABLE`) once per id. `ATTACH`/`DETACH`/`VACUUM`/`PRAGMA` are refused. |
| `db:read:trips` | Read-only trip data via `ctx.trips` (`getById`, `getPlaces`, `getReservations`) | Every call is **membership-checked** against the acting user — a plugin can't read a trip that user can't see. |
| `db:read:users` | Read-only public profile via `ctx.users.getById` | Returns id, username, display name, avatar only — **never** password hashes, tokens, or secrets. |
| `db:read:packing` | Read-only packing items of a trip via `ctx.packing.list(tripId)` | Membership-checked, and scoped to the acting user's visibility — a plugin never sees another member's private packing items. |
| `db:read:files` | Read-only files of a trip via `ctx.files.list(tripId)` | Membership-checked; trashed files excluded. |
| `db:read:costs` | Read-only costs (budget items) via `ctx.costs` (`getByTrip`, `listMine`) | Membership-checked; needs the Costs addon enabled. |
| `db:write:costs` | Create costs via `ctx.costs.create` | Trip access **+** the `budget_edit` permission **+** the Costs addon. |
| `db:write:places` | Create/update/delete places via `ctx.places` | Trip access **+** the `place_edit` permission. Input validated against TREK's schema; every write audited. |
| `db:write:days` | Create/update/delete days via `ctx.days` | Trip access **+** the `day_edit` permission. |
| `db:write:itinerary` | Assign/remove places on days via `ctx.itinerary` | Trip access **+** the `day_edit` permission (it's a day edit). |
| `db:write:trips` | Update trip details via `ctx.trips.update` | Trip access **+** `trip_edit`. Only schema-writable fields; **archiving** additionally needs `trip_archive` and **cover_image** needs `trip_cover_upload` (same split as the web UI). |
| `db:meta` | Store the plugin's **own** private key/value data on a trip/place/day via `ctx.meta` | Namespaced per plugin (a plugin only sees its own rows). Reads need trip **access**; **writes** additionally need the entity's edit permission (`place_edit`/`day_edit`/`trip_edit`). Quotas: ≤256-char key, ≤64 KB value, ≤100 keys per entity. Purged on uninstall-with-delete-data. |
| `ws:broadcast:trip` | Push a real-time event to a trip room via `ctx.ws.broadcastToTrip` | Event types are force-namespaced `plugin:<id>:<event>` — a plugin can't forge a core event. |
| `ws:broadcast:user` | Push a real-time event to a user's connections | Same namespacing. |
| `events:subscribe` | React to core activity via `events: [{ on, handler }]` on the plugin definition | The handler gets only the **event name + tripId** (never the payload) and runs with **no user** (like a job), so it can't read trip data — it reacts to the fact. Fire-and-forget on a short timeout; `plugin:*` re-broadcasts are never delivered back. |
| `hook:photo-provider` | Register as a photo provider in Memories | Implement the `PhotoProvider` interface. |
| `hook:calendar-source` | Register as a calendar source | Implement the `CalendarSource` interface. |
| `hook:place-detail-provider` | Contribute extra details (reviews, ratings, links) to a place via the `hooks.placeDetailProvider` provider hook | Implement `PlaceDetailProvider` in `hooks` on the plugin definition (not on `ctx`) — shown in the place-detail panel; also exposed at `GET /api/place-details/:placeId`. |
| `hook:trip-warning-provider` | Raise validation warnings on a trip via the `hooks.warningProvider` provider hook | Implement `WarningProvider` in `hooks` on the plugin definition (not on `ctx`) — shown as a non-blocking banner in the planner; also exposed at `GET /api/trip-warnings/:tripId`. |
| `http:outbound` / `http:outbound:<host>` | Make outbound network requests | **Requires** a non-empty `egress[]`. Only a **per-host** `http:outbound:<host>` actually opens a host at runtime — see below. |

## Outbound network — `http:outbound` vs `http:outbound:<host>`

This is the one permission with a subtlety worth reading twice.

Two independent guards restrict a plugin's network, and **both are built from the
`http:outbound:<host>` permissions you grant — not from the `egress[]` array**:

- the **runtime egress guard** inside the sandboxed child (any connect to a host
  that isn't allow-listed is rejected), and
- the plugin iframe's **CSP `connect-src`** (the client can only fetch the same
  hosts).

`egress[]` is a **separate declaration** the manifest validator only checks for
*presence*, not contents. The rule it enforces is narrow:

- Only the permissions above are accepted; an unknown string fails validation.
- If **any** `http:outbound` permission (bare or per-host) is declared, `egress[]`
  must be **non-empty**.
- `egress[]` may not contain a bare `*`.

Because the validator never cross-checks `egress[]` against the granted hosts:

> [!WARNING]
> **A host you list in `egress[]` but forget to grant as `http:outbound:<host>`
> is silently blocked at runtime.** Validation passes, install passes — then every
> request to that host is refused by the egress guard and the iframe CSP, with no
> manifest error to warn you. **List every host you call as *both* an
> `http:outbound:<host>` permission *and* an `egress[]` entry, and keep the two
> identical.**

**Bare `http:outbound`** (no host) satisfies the "non-empty `egress[]`" rule but
contributes **no host** to either guard — on its own it reaches nothing at
runtime. Use it only alongside the specific `http:outbound:<host>` grants for the
hosts you actually call.

A host may be an exact name (`api.example.com`) or a `*.suffix` wildcard
(`*.example.com`, matching the apex and any sub-domain). Even an allow-listed host
is refused if it resolves to a loopback / private / link-local / metadata address
(the SSRF backstop).

## Declaring them

```jsonc
{
  "permissions": ["db:own", "db:read:trips", "http:outbound:api.example.com"],
  "egress": ["api.example.com"]     // mirror every http:outbound:<host> here
}
```

## Publishing — the `trek-plugin` CLI

The `trek-plugin-sdk` package ships a `trek-plugin` CLI that builds the release
artifact and the registry entry for you, so you never hand-compute a sha256,
size, or commit sha. Run it with `npx trek-plugin-sdk <command>`. The full submission
flow is in [[Publishing a Plugin|Plugin-Publishing]].

| Command | What it does |
|---|---|
| `trek-plugin create [name]` | Scaffold a plugin. With no name it runs an interactive wizard (id, type, author, permissions); with a name it takes `--type`/`--author`/`--permissions` flags. |
| `trek-plugin dev [dir]` | Run the plugin locally with a real request loop + hot reload — no full TREK. The injected `ctx` enforces your granted permissions, `db:own` is a real SQLite file, routes serve under `/api/<path>`, and page/widget UI at `/ui`. |
| `trek-plugin validate [dir]` | Manifest + layout checks: parses the manifest with the same rules as install, requires a `README.md` (warns if it has no screenshot or still holds template placeholders) and a built `server/index.js`, and warns if the directory name ≠ the plugin id. This is a **subset** of registry CI — CI additionally verifies the release tag/commit, the artifact's sha256, and the README over the network. A local pass predicts a CI pass. |
| `trek-plugin preflight --repo <o/n> --tag <vX>` | Runs the **full** registry CI checks locally over the network (tag→commit, manifest parity, artifact sha256/size, native scan, README quality gate) against your pushed release — so you catch a CI failure before opening the PR. |
| `trek-plugin submit --repo <o/n> --tag <vX>` | Opens the registry PR for you: forks TREK-Plugins, branches off current main, writes/merges `registry/plugins/<id>.json`, pushes, and creates the PR. Requires `gh`. |
| `trek-plugin publish --repo <o/n> --tag <vX>` | **The one-command release**: pack → tag + GitHub release → preflight → open the registry PR. Stops before submitting if preflight fails. Add `--sign` to sign it. Requires `git` + `gh`. |
| `trek-plugin keygen` / `sign` | `keygen` creates an Ed25519 signing key; `sign` (or `--sign` on `entry`/`release`/`submit`) signs the artifact and fills `authorPublicKey` + `signature` so TREK pins your identity (TOFU). |
| `trek-plugin pack [dir] [--out plugin.zip] [--json]` | Validates, then builds `plugin.zip` in the installer's exact layout (`trek-plugin.json`, `README.md`, `LICENSE`, `package.json` at the root; `server/` and `client/` recursed) and prints its **sha256 + byte size**. Skips `node_modules`, `.git`, `.ts` and `.map` files, and **refuses native binaries** (`.node`, `binding.gyp`, `prebuilds/`) and over-size archives, same as the installer. **`docs/` is intentionally NOT shipped** — the store fetches your screenshot from `docs/screenshot.png` in the repo. |
| `trek-plugin entry --repo <owner/name> --tag <vX.Y.Z> [--zip plugin.zip] [--merge entry.json] [--out file]` | Emits the ready-to-PR registry entry: `commitSha` (resolved from the tag), `downloadUrl`, `sha256` + `size` (from the packed zip), and `minTrekVersion` (derived from the manifest's `trek` range, e.g. `>=3.2.0 <4.0.0` → `3.2.0`). `--merge` prepends this version onto an existing `registry/plugins/<id>.json` for an update, keeping versions newest-first. |
| `trek-plugin release [dir] --repo <owner/name> --tag <vX.Y.Z>` | The one-shot: `pack` → `gh release create` (uploads the zip) → print the registry `entry`. Requires the `gh` CLI authenticated. |

### Registry policy

- **No reserved namespaces.** Any unique lowercase slug id is accepted (3–40
  chars, `[a-z][a-z0-9-]*`). The only refused ids are `registry`, `install`, and
  `rescan`, which would collide with admin API routes.
- **Owner-binding still holds.** An id is bound to its GitHub owner on first
  registration, so nobody can repoint an existing plugin id to a different repo.
- **Optional author signing.** A registry entry may carry an `authorPublicKey`
  (stable across versions) and a per-version `signature`. TREK verifies it offline
  and pins the key trust-on-first-use. Signing is opt-in — an unsigned entry
  installs on `sha256` alone — but once a plugin has shipped signed, an unsigned
  update for it is refused. See [[Publishing a Plugin|Plugin-Publishing]].

## Not a permission — inter-plugin calls & events

Calling another plugin (`ctx.plugins.call`) and exchanging events
(`ctx.events.emit` / `subscriptions`) are **not** gated by a permission. Their grant
is the **dependency declaration**: a plugin may call or subscribe to another only if
it lists it as a satisfied `pluginDependency`, and only for the function/event names
that plugin publicly declares in `capabilities.provides` / `capabilities.emits`.
Calls run mediated by the host, carry the caller's acting user (so trip reads stay
membership-checked), and are recorded in the capability audit log. See
[[Plugin Development|Plugin-Development#talking-to-other-plugins]] and
[[Plugin Development|Plugin-Development#dependencies]].

## What is NOT covered

Isolation bounds *what* a plugin can touch, not its intent within a grant. A
plugin you allow to read trip data **and** reach `api.example.com` could send
that trip data there. So review the permissions and outbound hosts before you
install — grant only what you'd trust the plugin to do with your data. Prefer
**Reviewed** plugins and authors you trust. To build one, see [[Plugin Development|Plugin-Development]].
