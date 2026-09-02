# Plugins

Plugins let anyone extend a self-hosted TREK instance with new features — a
dashboard widget, a full page, a photo/calendar integration — **without touching
TREK's source code**. They are developed by third parties, distributed from a
public registry, and installed at the instance owner's discretion.

> [!IMPORTANT]
> **Plugins run arbitrary code, isolated but real.** Every plugin runs in its own
> sandboxed child process with only the permissions you approve. TREK does not
> maintain, audit, or take responsibility for community plugins. Grant a plugin
> only the access you'd trust it to have with your data, and prefer plugins
> marked **Reviewed**.

## Plugin types

A plugin declares one `type` in its manifest, which decides where it surfaces:

| Type | Where it shows | Typical use |
|---|---|---|
| **widget** | On the dashboard — in the sidebar, as a boarding-pass style hero overlay (`slot: "hero"`), or docked into a **detail panel** inside the trip planner: the open place (`slot: "place-detail"`), day (`slot: "day-detail"`), or reservation (`slot: "reservation-detail"`) | At-a-glance info like flight status or weather; a detail-panel widget is scoped to just the one place/day/reservation you have open |
| **page** | As its own entry in the top navigation | A full self-contained tool |
| **trip-page** | As a tab **inside every trip planner** (alongside Plan / Transports / Files), scoped to the open trip | A tool that works against one trip at a time |
| **integration** | Nowhere visible — registers into TREK via hooks (e.g. a photo provider, a calendar source, or a **notification channel**) | Feed data into existing TREK features |

### Notification channels

An `integration` plugin can add a whole new **notification channel** — Gotify, Pushover,
Telegram, anything that takes a message — alongside TREK's built-in email, webhook and
ntfy.

Once you install and activate such a plugin, its channel is live — there is no separate
switch for it in **Admin → Notifications**, which only turns the built-in email, webhook
and ntfy channels on. It appears right away as a new column in every user's
**Settings → Notifications** matrix, and each user supplies their own credentials on the
plugin's own settings page and picks per-event what they want pushed — exactly like a
built-in channel.

Two guarantees hold for a plugin channel specifically:

- **It is user-scoped.** Admin-only events (like *version available*) always go out over
  your built-in admin channels, never a plugin's.
- **The plugin never sees anyone's trips.** TREK renders the notification — in the
  recipient's language, deep link already built — *before* handing it over. The plugin
  receives that finished message plus that user's own credentials for its service, and
  nothing else. It is given no acting user, so the trip-reading APIs other plugins use are
  refused to it outright.

### Plugin settings actions

A plugin can put **buttons on its own settings form** — a "Test connection", a "Sync now",
a "Purge cache". Each button declares a `scope`, which decides where it lands and who runs it:

- **`scope: "user"`** (the default) — the button sits under **Settings → Plugins**, beneath
  that plugin's fields, and runs **as the user who clicked it**, so a "Test connection"
  checks *their* credentials and can never see anyone else's.
- **`scope: "instance"`** — the button sits in **Admin → Plugins → ⋯ → Instance settings**,
  next to the instance-wide fields it works on. It runs as the clicking **admin** — surfaced
  in the admin panel, but not admin-privileged — is **disabled until the plugin is active**
  ("Activate the plugin to run its actions"), and saves an edited form before it fires, so
  the action sees the configuration you are looking at.

TREK refuses any action the plugin didn't declare in its manifest, and the scope is fixed by
the route each button posts to: a user-tab action can never be fired from the admin dialog,
and an instance action never appears on anyone's settings page.

### Plugin MCP tools

A plugin (of any type) can publish **tools on TREK's own MCP server**, so an AI
assistant a user has connected to TREK can call into it — declared in the manifest
(`capabilities.mcpTools`) behind the **`mcp:tools`** permission, both part of what
you consent to at install. Three guarantees hold:

- **You see the surface before it exists.** Admin → Plugins shows exactly which
  tools a plugin will advertise (they appear to assistants as
  `plugin_<id>_<name>`), and activating, deactivating, updating, re-trusting or
  uninstalling a plugin — or turning off an addon it requires — closes open assistant
  sessions so the surface is re-read.
- **A tool call runs as the requesting user.** The host binds the user from the
  assistant's session — a plugin can never pick one — so every read is
  membership-checked exactly like the plugin's normal API calls, and the
  `mcp:tools` grant itself unlocks no data: the tool can only do what the
  plugin's *other* granted permissions allow.
- **Assistants must opt in.** An OAuth client only reaches plugin tools with the
  **`plugins:use`** scope, which is never granted by default — the user approves
  it explicitly on the consent screen.

### Trip-page plugins: placement and tab takeover

A **trip-page** plugin normally adds its tab *after* the planner's built-in tabs.
If it needs a more prominent spot — or wants to stand in for a feature it
replaces — its manifest can shape the tab bar via `capabilities.tripPage`:

- **`position`** pins the plugin's tab to a preferred slot (a 0-based index)
  instead of being appended at the end.
- **`replaces`** lists core planner tabs to **hide** while the plugin is active —
  e.g. a plugin that supersedes the built-in bookings or files view can take that
  tab's place rather than sit beside it. The **Plan** tab can never be replaced:
  a trip always keeps its planner view, so a plugin can take over individual
  tabs, never the whole trip.

Hidden tabs come back the moment the plugin is deactivated or removed — the
takeover lasts only as long as the plugin is on.

## Enabling plugins

The plugin system is **on by default** — the runtime and the **Admin → Plugins**
tab are available out of the box. Installed plugins still have to be activated
one by one, so nothing third-party runs until you turn a specific plugin on.

To switch the whole system off, set the environment variable to `false` and
restart:

```yaml
environment:
  - TREK_PLUGINS_ENABLED=false
```

When it's off, the **Admin → Plugins** tab shows a "turned off
(TREK_PLUGINS_ENABLED)" banner and nothing runs. Installed plugins stay on disk,
deactivated and harmless, until you turn the system back on.

## The isolation model — what a plugin can and can't do

Each active plugin runs as a **separate OS process**, started under Node's
permission model (`--permission`) with filesystem reads scoped to just its own
code:

- It has **no** access to `JWT_SECRET`, the database connection, or any TREK
  secret — those are simply not reachable by its process.
- It **cannot** open TREK's own database (`server/data/travel.db`, or
  `/app/data/travel.db` in the container), write files, spawn child processes, use
  worker threads, or load native addons. Its own data lives in a separate SQLite file
  it reaches only through TREK.
- It talks to TREK exclusively over an internal RPC channel, and TREK only
  answers the capabilities the plugin's manifest **declares and you approve**.
  An ungranted call is refused, not merely ignored.
- The RPC channel itself is **sealed off from plugin code**: even though the
  plugin runs in a forked process, its raw IPC primitives (`process.send`,
  `process.on('message')`) are revoked before its code loads — just like
  `process.binding`. So a plugin can neither forge host messages (fake its route
  table, spoof another request's identity) nor eavesdrop on other in-flight
  requests. Every interaction is forced through the capability-checked SDK.
- A page/widget's interface runs in a **sealed browser frame** that can't read
  your session cookie or touch the surrounding TREK page.
- If a plugin crashes, hangs, or runs out of memory, only *its* process dies —
  TREK keeps running and can restart or disable it.

This means the permission list you approve is a **real boundary**, not a label.
It bounds *what* a plugin can touch, not its intent within a grant: a plugin you
let read trips **and** reach a host could send those trips there. See
[[Plugin Permissions|Plugin-Permissions]] for exactly what each permission grants.

## The Admin → Plugins panel

A single panel with a segmented **Installed / Discover** switch at the top left,
plus a toolbar:

- **Search** — filters the current list by name/description (and author, in Discover).
- **Type** filter — All types / Widget / Integration / Page / Trip page.
- **Status** filter (Installed view only) — All / Active / Off / Update available / Error.
- **Sort** — Name / Recently updated, plus **Updates first** in Installed and **Most
  downloads** in Discover. The view-specific option falls back to Name when you switch
  views.
- **Upload** — sideload a plugin from a `.zip`/`.tar.gz` (see [Installing](#installing-a-plugin)).
- **Rescan** — rediscovers the on-disk plugins directory **and** force-pulls the
  remote registry, bypassing the 30-minute server cache and GitHub's CDN so a
  just-published plugin (or update) shows up immediately rather than up to ~35
  minutes later (see [Installing](#installing-a-plugin)).

Each installed row shows an icon tile with a **health dot** (green = active,
blue pulse = starting, red = error, amber = disabled/incompatible, faint = inactive),
the name and version, a **Reviewed** shield if applicable, a **Sideloaded** tag
for manually-uploaded plugins (see [Installing](#installing-a-plugin)), and
**capability chips** derived from its declared permissions — "Reads your trips",
"Reads your costs" / "Adds costs", "Dashboard widget", "Real-time updates",
"Provides photos", outbound hosts, and so on — so a plugin's real reach is
legible without opening anything.

## Reviewing a plugin before install

In **Discover**, click any card to open its **detail modal**. This is where you
review a plugin *before* it touches your instance. It fetches the plugin's live
manifest (at the reviewed commit) and lays out:

- **What it can access** — the permission-derived capabilities in plain language.
- **Connects to** — the outbound hosts it declared (`egress`).
- **Setup** — configuration fields it will ask for, with scope (instance/user) and
  whether each is required.
- **AI tools it publishes** — for a plugin declaring `capabilities.mcpTools`: each tool's
  name, title and the assistant-facing description, so you read what a connected assistant
  will be told about the plugin *before* you grant it.
- **Details** — version, download size, minimum TREK version, review date, plus
  links to the source repo and homepage.
- **Versions** — every published version (listed once a plugin has more than one) with its
  date, a signature shield and a compatibility verdict, each with its own **Install v{X}**
  button. A version this TREK can't run is explained ("needs TREK {range}"), never offered.

A **Reviewed** badge means a TREK maintainer scanned that exact version's source
for malware — **not** that it works well or is harmless. It is not an ongoing
guarantee. Read the access list and outbound hosts, not just the description.

## Installing a plugin

Three ways, all from **Admin → Plugins**:

1. **From the registry.** In **Discover**, open a plugin and click **Install** (also
   available directly on the card), which takes the **newest version this TREK can run**.
   To take a different one, use the per-version **Install v{X}** button in the detail
   modal's **Versions** list — deliberately installing a version that isn't the newest
   compatible one **pauses updates** for that plugin until you resume them (see
   [Updating a plugin](#updating-a-plugin)). Either way TREK downloads that exact version,
   verifies its SHA-256 against the registry (and an author signature if the plugin ships
   one), safely unpacks it, re-validates the manifest, and registers it — **inactive**.
   Nothing runs yet.
2. **By upload (sideload).** Drag a plugin `.zip`/`.tar.gz` onto the panel, or use
   the **Upload** button. TREK extracts it into staging with the same hard guards as
   a registry install (slip/bomb-safe extract, strict manifest, no native binaries —
   only the registry SHA-256/signature checks don't apply, since there's no registry
   entry) and registers it **inactive**. A sideloaded plugin is marked **Sideloaded**,
   is unsigned and not registry-reviewed, has **no auto-update** and no "Source
   repository" link. Uploading over an existing id force-stops and deactivates the old
   code first, so the replacement never keeps running without a fresh activation.
   (Max 50 MB, same ceiling as the SDK's `pack`.)
3. **From disk.** Drop a plugin directory into the plugins code directory
   (`server/data/plugins`, or your `TREK_PLUGINS_DIR` volume) and click **Rescan**
   (or restart). TREK discovers it and registers it inactive.

## Activating a plugin

Activation is the **toggle** on the installed row. Flipping it on grants the
permissions you already reviewed and spawns the isolated process; flipping it off
stops that process immediately while keeping the plugin's data. A page plugin then
appears in the top navigation; a widget appears on the dashboard. There is no
separate "Activate" button or second consent screen — you reviewed the permissions
before installing.

## Dependencies between plugins and addons

A plugin can require **other plugins** or **addons** to be present before it runs.
This is enforced when you **activate** — installing never fails on a dependency, so
you can always install first and resolve after. The installed row shows a plugin's
dependencies as chips (amber when one is missing, out of range, or its addon is off).

- **Requires an addon that's off** — activation is blocked with a message naming the
  addon. Turn it on in **Admin → Addons**, then flip the plugin on. Turning a required
  addon back **off** while the plugin runs disables the plugin automatically.
- **Missing a plugin it depends on** — activation opens a **dependency dialog** listing
  what's missing; each has a **Download** button that fetches the newest compatible
  version from the registry (and its own dependencies) and then enables your plugin. A
  dependency that's installed but the *wrong version* shows an **Update** button instead.
- **Depends on a plugin that's installed but off** — enabling your plugin
  **auto-enables its dependencies first**, in order.
- **Disabling a plugin others depend on disables those dependents too** — a plugin
  can't keep running with a dependency that's gone.

Plugins that declare a dependency can also **call each other's functions and exchange
events** at runtime — always mediated by TREK, and only along a declared dependency (a
plugin can't reach one it didn't declare). See
[[Plugin Development|Plugin-Development#talking-to-other-plugins]].

## Managing a plugin

The **⋯** menu on each row, in order:

- **Restart** — stop and re-spawn the process (shown only while active).
- **Instance settings** — the admin-owned `scope: "instance"` fields, plus the plugin's
  instance-scoped action buttons (shown only when it declares one or the other). Secret
  fields stay masked, only fields the manifest declares are stored, and saving re-spawns a
  running plugin so it picks the new configuration up — the child reads it once, at start.
  See [Plugin settings actions](#plugin-settings-actions).
- **View error log** — the plugin's own crash/failed-request log.
- **Allowed hosts** — add the hosts a plugin may reach, for a plugin that talks to a
  service only *you* can name (shown only for a plugin whose manifest declares
  `operatorEgress`). See [Allowed hosts](#allowed-hosts) below.
- **Change version** — switch to any published version of the plugin (registry installs
  only). See [Pinning and rolling back](#pinning-and-rolling-back).
- **Source repository** — opens the plugin's GitHub repo (registry installs only).
- **Report an issue** — opens that repo's issue tracker (registry installs only).
- **Delete** — uninstalls, after a confirmation: it stops the plugin, removes its code,
  **and deletes all of its data**. This cannot be undone.

## Allowed hosts

A plugin's outbound hosts are normally fixed in its manifest, and you consent to them at
install. But a plugin that talks to a **self-hosted service** — a Gotify, an ntfy, an
Uptime Kuma — cannot know *your* hostname when it is published. Such a plugin declares
`operatorEgress`, and you supply the hosts yourself.

Before install, the detail modal marks such a plugin with a **"+ hosts you add"** pill
under *Connects to*. On the installed row it shows an **Add allowed host** chip
(**{n} allowed host(s)** once you have added some). Open **⋯ → Allowed hosts** and add
the hostname (e.g. `gotify.mydomain.com`). TREK restarts the plugin so it picks up the
new list.

What this does *not* let anyone do:

- **A plugin that never asked for it can never be given a host.** Only a plugin whose
  manifest declares `operatorEgress` is eligible, so the consent you gave at install still
  bounds what is possible.
- **Only you — an admin — can widen egress.** An end user can never add a host, even for
  a plugin whose credentials they supply themselves.
- Hosts are validated like manifest egress: no bare `*`, no whole-TLD wildcard, no scheme.
  Remove a host and the plugin loses it immediately (it restarts again).
- Uninstalling drops the hosts, so a later plugin reusing the id can't inherit them.

If the service runs on the **same machine or LAN** as TREK (a `localhost` or `192.168.x.x`
address), you also need `TREK_PLUGIN_ALLOW_PRIVATE_EGRESS=on` — plugins may not reach
private addresses by default. That relaxes the policy for *every* installed plugin, so
only enable it if you trust them all.

## Reviewing what a plugin did — the activity log

Every user can see exactly what plugins have done **in their name**. Under
**Settings → Plugins**, the **activity log** lists every host-mediated action a
plugin took while acting for you — across all plugins, newest first: each trip or
cost it read, each place it wrote, each outbound call TREK made on its behalf.

This is the user-facing half of TREK's tamper-evident (hash-chained) plugin
audit: the same chain is readable per plugin over the admin API
(`GET /api/admin/plugins/:id/audit`), while this view is
**never admin-gated** — anyone can review what was done with their own data. It's
what keeps a plugin's deliberately broad read grants accountable to the person
whose data is read. See [[Plugin Permissions|Plugin-Permissions]] for what each
grant allows in the first place.

## Updating a plugin

When the registry lists a newer version, an **Update to vX.Y.Z** pill appears on
the row, and an **Update all** bar summarises how many are available — unless one of two
things is true. A newer version whose `trek` range this host can't satisfy shows an
informational **"v{version} available — needs TREK {range}"** line and deliberately never a
button: the fix is a TREK upgrade, not an install that would be refused. And a plugin whose
updates are held shows **"Updates paused at v{version}"** with a **Resume updates** link
instead (see below).

Updating swaps in the new code and, by default, transparently restarts the plugin
on it. But if the new version declares **more permissions or new outbound hosts**,
TREK installs the new code and **leaves the plugin off**, then shows a
**re-consent dialog** listing exactly the new permissions and hosts. The plugin
only runs again once you approve — an update can never silently widen what a
plugin may do. Choosing "Later" keeps the new code installed but inactive.

### Pinning and rolling back

**⋯ → Change version** lists every published version of a registry-installed plugin with
its date, signature shield and compatibility verdict, and switches to the one you pick; an
incompatible version is explained, never offered. Switching **down** to an older version
asks for confirmation first — the plugin's stored data stays behind, and older code may not
understand it.

A deliberate switch to a version that isn't the newest compatible one sets an **update
hold**, so a rollback you meant isn't nagged away by the update pill: the row shows
"Updates paused at v{version}" with a **Resume updates** link, and clicking it puts the
plugin back in the normal update flow. Landing on the newest compatible version again, by
any path, lifts the hold by itself.

## Building your own

Plugins are built with the **plugin SDK** and its `trek-plugin` CLI. The CLI
turns a built plugin directory into a publishable artifact and the ready-to-PR
registry entry, so you never hand-compute a SHA-256 or hand-write registry JSON:

| Command | What it does |
|---|---|
| `trek-plugin validate [dir]` | Runs the manifest + layout checks locally (a subset of registry CI, which additionally verifies the release, the artifact SHA-256, and the README over the network). |
| `trek-plugin pack [dir] [--out plugin.zip] [--json]` | Builds `plugin.zip` in the installer's exact layout and prints its SHA-256 + byte size. Refuses native binaries; `docs/` is intentionally not shipped (the store fetches the screenshot from your repo). |
| `trek-plugin entry --repo <o/n> --tag <vX> [--zip z] [--merge entry.json] [--out f]` | Emits the registry entry — `commitSha`, `downloadUrl`, `sha256`, `size` and the manifest's `trek` range (verbatim) all filled in. `--merge` prepends the new version onto an existing entry for updates. |
| `trek-plugin release [dir] --repo <o/n> --tag <vX>` | The one-shot: `pack` → create the GitHub release → print the entry. |

Run them via `npx trek-plugin-sdk …`. See [[Plugin Development|Plugin-Development]]
for the SDK and manifest, and [[Publishing a Plugin|Plugin-Publishing]] for the
registry PR flow. Any unique slug works — only `registry`, `install` and `rescan`
are refused (they'd collide with admin API routes) — and an `id` stays bound to
the GitHub owner who first registered it, so
nobody can repoint an existing plugin. Entries may optionally carry an author
signing key (`authorPublicKey` + a per-version `signature`) for offline signature
verification on top of the SHA-256 pin. A signed plugin's key changes only through
a maintainer-approved rotation; an instance that already has the plugin then shows
`SIGNATURE_KEY_CHANGED` — with both key fingerprints, so you can check the new one
with the author out of band — and pauses that plugin's updates until you re-trust
the new key.
