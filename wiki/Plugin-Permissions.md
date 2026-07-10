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
| `db:read:trips` | Read-only trip data via `ctx.trips` (`getById`, `getPlaces`, `getReservations`, `getDays`, `getAccommodations`, `listMine`, `members`) | Every call is **membership-checked** against the acting user — a plugin can't read a trip that user can't see. `getDays` returns each day with its `assignments` + `notes_items`; `getReservations` rows carry `endpoints` + `day_positions` like the REST list. `members` returns the roster (id + display fields only). |
| `db:read:users` | Read-only public profile via `ctx.users.getById` | Returns id, username, display name, avatar only — **never** password hashes, tokens, or secrets. |
| `db:read:packing` | Read-only packing items of a trip via `ctx.packing.list(tripId)` | Membership-checked, and scoped to the acting user's visibility — a plugin never sees another member's private packing items. |
| `db:read:files` | Read-only files of a trip via `ctx.files.list(tripId)` | Membership-checked; trashed files excluded. |
| `db:read:files:content` | Read a file's **byte content** (base64) via `ctx.files.getContent(tripId, fileId)` | Membership-checked; 10MB cap, trashed files refused. Deliberately split from `db:read:files` — listing metadata never exposes contents. |
| `db:read:costs` | Read-only costs (budget items) via `ctx.costs` (`getByTrip`, `listMine`) | Membership-checked; needs the Costs addon enabled. |
| `db:read:collab` | Read a trip's collab notes, polls and chat via `ctx.collab` (`listNotes`, `listPolls`, `listMessages`) | Membership-checked; needs the Collab addon. `listMessages` returns the newest 100 (oldest first), `before` pages back. |
| `db:read:journal` | The acting user's own travel journals via `ctx.journal.listMine` | User-scoped (across all their trips); needs the Journey addon. |
| `db:read:atlas` | The acting user's visited countries + regions via `ctx.atlas.visited` | User-scoped; needs the Atlas addon. |
| `db:read:vacay` | The acting user's vacation plan via `ctx.vacay.mine` | User-scoped; needs the Vacay addon. |
| `db:read:daynotes` | A trip day's notes via `ctx.daynotes.list(tripId, dayId)` | Membership-checked (trip-scoped). |
| `db:read:collections` | The acting user's saved-place collections via `ctx.collections` (`listMine`, `get`) | User-scoped; needs the Collections addon. |
| `db:read:categories` | The global place-category list via `ctx.categories.list()` | Read-only reference; no tenant data. |
| `db:read:tags` | The acting user's own tags via `ctx.tags.list()` | User-scoped (not trip-scoped); refuses a userless context. |
| `db:read:todos` | A trip's to-dos via `ctx.todos.list(tripId)` | Membership-checked (trip-scoped). |
| `weather:read` | The host's cached forecast via `ctx.weather.get(lat, lng, date?)` | Tenant-free read over the host's cache; no user needed. |
| `rates:read` | The host's cached currency exchange rates via `ctx.rates.get(base)` | Tenant-free read over the host's cache (a quote → rate map relative to `base`); `null` on an upstream failure. |
| `db:write:costs` | Create/update/delete costs via `ctx.costs.create` / `update` / `delete` | Trip access **+** the `budget_edit` permission **+** the Costs addon. |
| `db:write:places` | Create/update/delete places via `ctx.places` | Trip access **+** the `place_edit` permission. Input validated against TREK's schema; every write audited. |
| `db:write:days` | Create/update/delete days via `ctx.days` | Trip access **+** the `day_edit` permission. |
| `db:write:itinerary` | Assign/remove places on days via `ctx.itinerary` | Trip access **+** the `day_edit` permission (it's a day edit). |
| `db:write:trips` | Update trip details via `ctx.trips.update` | Trip access **+** `trip_edit`. Only schema-writable fields; **archiving** additionally needs `trip_archive` and **cover_image** needs `trip_cover_upload` (same split as the web UI). |
| `db:create:trips` | Create a **new trip owned by the acting user** via `ctx.trips.create(input)` | The acting user needs the app's `trip_create` right, and a bound user is required (a job can't create one). `title` required; input validated against TREK's trip schema. Unlocks importers (Google MyMaps, booking dumps, calendar sync). |
| `db:write:reservations` | Create/update/delete bookings via `ctx.reservations` | Trip access **+** `reservation_edit`. Full parity with the app — accommodation, budget-sync, booking notifications and `reservation:*` broadcasts all fire as they do in the web UI. Transport bookings take an `endpoints` array (from/to/stop legs with name + coordinates); on update, omitting the field keeps them, `[]` deletes them all. |
| `db:write:accommodations` | Create/update/delete lodging blocks (`day_accommodations`) via `ctx.accommodations` | Trip access **+** `day_edit` (accommodations live in the day service — same gate as the REST path, *not* `reservation_edit`). Creating one auto-creates its partner hotel reservation; deleting cascades the linked reservation/budget row, broadcasts included. |
| `db:write:daynotes` | Create/update/delete day notes via `ctx.daynotes` | Trip access **+** `day_edit`; broadcasts `dayNote:*`. |
| `db:write:packing` | Create/update/delete packing items **+ bags** via `ctx.packing` (items + `listBags`/`createBag`/`updateBag`/`deleteBag`/`setBagMembers`) | Trip access **+** `packing_edit`. Reproduces the #858 privacy model for items: a **private** item's events reach only its owner (+ recipients), never the whole trip room. Bags carry no privacy. |
| `db:write:tags` | Create/edit/delete the acting user's own tags via `ctx.tags` | User-scoped; ownership re-checked before each write. |
| `db:write:atlas` | Mark/unmark visited countries + regions and manage the bucket list via `ctx.atlas` | All rows are the **acting user's own** — no trip scoping, no cross-tenant surface. Needs the Atlas addon; unblocks e.g. AirTrail-style two-way sync. |
| `db:write:vacay` | Toggle PTO days + company holidays via `ctx.vacay` | The plan is resolved **host-side from the acting user's active plan** — a plugin can never name another plan; `toggleEntry` only toggles the acting user's own day. Needs the Vacay addon. |
| `db:write:journal` | Create/edit/delete journal entries via `ctx.journal` | Gated by `journeyService.canEdit` (owner/contributor) against the acting user. Needs the Journey addon. |
| `db:write:collections` | Create/edit collections, save places, copy to a trip via `ctx.collections` | The service enforces the acting user's **per-collection role** (owner/admin/editor) itself. Needs the Collections addon. |
| `db:write:files` | Attach files + manage links via `ctx.files` (`create`, `createLink`, `update`, `softDelete`) | Trip access **+** the app's `file_upload`/`file_edit`/`file_delete` rights respectively. Content arrives as base64 (10MB cap); the extension is validated against the central blocklist before touching disk; link targets must live on the same trip. |
| `db:write:collab` | Post notes, polls and chat messages via `ctx.collab` | Trip access **+** `collab_edit`; needs the Collab addon. Broadcasts the same `collab:*` events as the app. |
| `db:write:members` | Add a user to a trip via `ctx.trips.addMember` | **Grants trip access** — deliberately its own permission behind the app's `member_manage` right (default: trip owner only), never bundled with a lower-risk write. The acting user is recorded as the inviter. |
| `db:write:todos` | Create/edit/delete a trip's to-dos via `ctx.todos` | Trip access **+** `packing_edit` (the app gates to-dos with the same right). |
| `db:meta` | Store the plugin's **own** private key/value data on a trip/place/day/**reservation**/**accommodation** via `ctx.meta` | Namespaced per plugin (a plugin only sees its own rows). Reads need trip **access**; **writes** additionally need the entity's edit permission (`trip_edit`/`place_edit`/`day_edit`; reservations use `reservation_edit`, accommodations use `day_edit`). The natural home for an external-id mapping (AirTrail/calendar/booking-import sync) without forking the schema. Quotas: ≤256-char key, ≤64 KB value, ≤100 keys per entity. Purged on uninstall-with-delete-data. |
| `ws:broadcast:trip` | Push a real-time event to a trip room via `ctx.ws.broadcastToTrip` | Event types are force-namespaced `plugin:<id>:<event>` — a plugin can't forge a core event. |
| `ws:broadcast:user` | Push a real-time event to a user's connections | Same namespacing. |
| `notify:send` | Send a persisted notification (bell inbox + email/ntfy/webhook fan-out) via `ctx.notify.send` | Host-mediated: the host owns recipient resolution, channel fan-out and per-user preferences. Recipients are **forced** to the acting user (`scope:'user'`, `targetId` = the acting user) or a trip they belong to (`scope:'trip'`); `scope:'admin'` is refused. The plugin supplies only a plain-text title/body (caps 200/1000) + an optional in-app `link` (must be a relative `/…` path — open-redirect-safe). No arbitrary recipient, no impersonation. |
| `oauth:client` | Become an OAuth *client* of a third-party service via `ctx.oauth.getAccessToken()` | Host-brokered: the host runs the whole flow (authorize→callback→token→refresh) with **PKCE + state** and **holds the tokens** — client secret + refresh token never leave the host. Provider config (`oauth_authorize_url`/`oauth_token_url`/`oauth_scopes` + the secrets `oauth_client_id`/`oauth_client_secret`) is the plugin's **admin-owned instance settings**; endpoints must be **https** (SSRF backstop). Each user connects under **Settings → Plugins**; tokens are per-user + encrypted at rest. The plugin only ever gets a **short-lived access token** for the acting user. |
| `ai:invoke` | Run the admin/user-configured LLM via `ctx.ai.complete` / `ctx.ai.extract` | Host-mediated: the host holds the (encrypted) credential and runs the call under the acting user's resolved provider — the plugin never sees a key. Refused when no provider is configured; prompt/text capped at 20 000 chars. Output is **DATA** — `complete` returns `{ text }`, `extract` returns `{ results }` for your JSON schema — and is never auto-written, so prompt-injection can't reach a write without your own gated call. |
| `events:subscribe` | React to core activity via `events: [{ on, handler }]` on the plugin definition | The handler gets the **event name + tripId + a `{ entity, entityId }` hint**, plus a **whitelisted `snapshot` of the changed entity when the plugin also holds the family's `db:read:*` grant** (per-plugin filtered at deliver time — no grant, no fields). It runs with **no user** (like a job), so nothing beyond the snapshot is readable. The whitelist never carries user ids, private packing items (#858) or secrets; deletes/bulk/reorder events carry no snapshot, a non-entity id (e.g. a userId) never surfaces. Fire-and-forget on a short timeout; `plugin:*` re-broadcasts are never delivered back. |
| `jobs:run` | Run the plugin's declared background `jobs` on their cron schedule **and** its runtime timers via `ctx.scheduler` (`at`/`in`/`every`/`cancel`) | **Opt-in.** Scheduled work runs with **no user** (its trip reads are refused), so a job can only touch its own `ctx.db` and declared egress. Invalid cron expressions are skipped; jobs stop when the plugin is deactivated. `ctx.scheduler` tasks are persisted (survive restarts), capped at 100/plugin with an 8 KB payload and a 60 s minimum recurring interval, and removed on uninstall. |
| `hook:photo-provider` | Register as a photo provider in Memories | Implement the `PhotoProvider` interface. |
| `hook:calendar-source` | Register as a calendar source | Implement the `CalendarSource` interface. |
| `hook:place-detail-provider` | Contribute extra details (reviews, ratings, links) to a place via the `hooks.placeDetailProvider` provider hook | Implement `PlaceDetailProvider` in `hooks` on the plugin definition (not on `ctx`) — shown in the place-detail panel; also exposed at `GET /api/place-details/:placeId`. |
| `hook:trip-warning-provider` | Raise validation warnings on a trip via the `hooks.warningProvider` provider hook | Implement `WarningProvider` in `hooks` on the plugin definition (not on `ctx`) — shown as a non-blocking banner in the planner; also exposed at `GET /api/trip-warnings/:tripId`. |
| `hook:map-marker-provider` | Overlay bounded **markers** on the trip map via the `hooks.mapMarkerProvider` provider hook | Implement `MapMarkerProvider` in `hooks` — returns `{id, lat, lng, label?, popupText?, url?, icon?, tone?}[]` (#587 "show bookings on map"). **Declarative only** — plugin JS never runs on the map canvas. The host range-checks coordinates (−90..90 / −180..180), String-coerces + length-caps text, allowlists the popup url (http/https/mailto), and caps the marker count (≤200) per plugin; a failing provider is skipped. Exposed at `GET /api/map-markers/:tripId`. |
| `hook:table-contributor` | Contribute host-rendered **columns/actions** into a native planner view via the `hooks.tableContributor` provider hook | Implement `TableContributor` in `hooks` — returns declarative column/action leaves keyed by `entityId` (never markup). The host normalizes + bounds every field (length caps, `http`/`https`/`mailto`-only urls, enum tone/target) and renders them in the reservations, places, day, costs, packing and files views; an action opens your sandboxed frame or calls one of your routes. Also exposed at `GET /api/view-contributions/:view/:tripId`. |
| `hook:pdf-section-provider` | Append text-only **sections** to the trip PDF export via the `hooks.pdfSectionProvider` provider hook | Implement `PdfSectionProvider` in `hooks` — returns `{title, paragraphs?, table?}[]` of plain strings the export escapes and lays out itself; no markup ever reaches the document. The host caps the section/paragraph/header/row counts (≤5/≤20/≤8/≤50) and every string length, and clips table rows to the header width; a failing provider is skipped. Exposed at `GET /api/pdf-sections/:tripId`. |
| `hook:atlas-layer-provider` | Draw country **tint layers** over the Atlas world map via the `hooks.atlasLayerProvider` provider hook | Implement `AtlasLayerProvider` in `hooks` — returns `{id, name?, countries: [{code, tone?, label?}]}[]` for the **acting user** (the hook takes no target parameter, so a plugin can't ask for anyone else's map). Codes must be ISO-3166 alpha-2 (uppercase-coerced, anything else dropped), tone is enum-whitelisted, counts capped (≤3 layers, ≤300 countries each). **Declarative only** — plugin JS never runs on the map canvas. Exposed at `GET /api/atlas-layers`. |
| `hook:journal-entry-provider` | Contribute extra **rows** under a journal entry via the `hooks.journalEntryProvider` provider hook | Implement `JournalEntryProvider` in `hooks` — returns `{label, value?, url?}[]` per entry, rendered under the entry card. The entry's journey is access-checked against the acting user (owner/contributor, like the journal detail routes) and the Journey addon must be on. The host caps the row count (≤12) + lengths (label 60, value 200) and allowlists the url (http/https/mailto); a failing provider is skipped. Exposed at `GET /api/journal-entry-rows/:entryId`. |
| `hook:trip-card-provider` | Add small **badges** to the dashboard trip cards via the `hooks.tripCardProvider` provider hook | Implement `TripCardProvider` in `hooks` — `getCards(tripIds, ctx)` is called ONCE with all the trip cards currently on the user's dashboard (each already access-checked for the acting user), returns `{tripId, id, label, value?, icon?, tone?, url?}[]`. **Declarative only** — plugin JS never runs on the dashboard. The host String-coerces + length-caps every field, enum-whitelists the tone, allowlists the url (http/https/mailto), caps the count (≤40/plugin) and drops any badge whose `tripId` the dashboard didn't ask about; a failing provider is skipped. Exposed at `GET /api/trip-card-contributions?tripIds=…`. |
| `hook:user-data` | Honour GDPR **data-subject rights** — erase and export the data the plugin stores about a user — via the `deleteUserData` / `exportUserData` handlers | Implement `deleteUserData({userId}, ctx)` and/or `exportUserData({userId}, ctx)` on the plugin definition (not on `ctx`). Both are **userless** (no acting user; the plugin only learns the `userId` and touches its OWN db). When a TREK account is deleted, the host queues an erasure for every plugin holding this grant and retries it **durably** until the plugin ACKs — even across restarts — so implement `deleteUserData` idempotently. `exportUserData` returns a JSON-serialisable value the host aggregates for an admin at `GET /api/admin/plugins/user-data/:userId/export`. |
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
