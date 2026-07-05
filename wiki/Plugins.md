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
| **widget** | On the dashboard — in the sidebar, or (with `slot: "hero"`) as a boarding-pass style hero overlay | At-a-glance info like flight status or weather |
| **page** | As its own entry in the top navigation | A full self-contained tool |
| **trip-page** | As a tab **inside every trip planner** (alongside Plan / Transports / Files), scoped to the open trip | A tool that works against one trip at a time |
| **integration** | Nowhere visible — registers into TREK via hooks (e.g. a photo provider or calendar source) | Feed data into existing TREK features |

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
- It **cannot** open `trek.db`, write files, spawn child processes, use worker
  threads, or load native addons. Its own data lives in a separate SQLite file it
  reaches only through TREK.
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
- **Type** filter — All / Widget / Integration / Page.
- **Status** filter (Installed view only) — All / Active / Off / Update available / Error.
- **Sort** — Name / Recently updated / Updates first.
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
"Reads costs" / "Writes costs", "Dashboard widget", "Real-time updates",
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
- **Details** — version, download size, minimum TREK version, review date, plus
  links to the source repo and homepage.

A **Reviewed** badge means a TREK maintainer scanned that exact version's source
for malware — **not** that it works well or is harmless. It is not an ongoing
guarantee. Read the access list and outbound hosts, not just the description.

## Installing a plugin

Three ways, all from **Admin → Plugins**:

1. **From the registry.** In **Discover**, open a plugin and click **Install**
   (also available directly on the card). TREK downloads the pinned version, verifies
   its SHA-256 against the registry (and an author signature if the plugin ships one),
   safely unpacks it, re-validates the manifest, and registers it — **inactive**.
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

The **⋯** menu on each row:

- **Restart** — stop and re-spawn the process (shown only while active).
- **View error log** — the plugin's own crash/failed-request log.
- **Source repository** — opens the plugin's GitHub repo (registry installs only).
- **Delete** — uninstalls: removes the code and lets you keep or delete its data.

## Updating a plugin

When the registry lists a newer version, an **Update to vX.Y.Z** pill appears on
the row, and an **Update all** bar summarises how many are available.

Updating swaps in the new code and, by default, transparently restarts the plugin
on it. But if the new version declares **more permissions or new outbound hosts**,
TREK installs the new code and **leaves the plugin off**, then shows a
**re-consent dialog** listing exactly the new permissions and hosts. The plugin
only runs again once you approve — an update can never silently widen what a
plugin may do. Choosing "Later" keeps the new code installed but inactive.

## Building your own

Plugins are built with the **plugin SDK** and its `trek-plugin` CLI. The CLI
turns a built plugin directory into a publishable artifact and the ready-to-PR
registry entry, so you never hand-compute a SHA-256 or hand-write registry JSON:

| Command | What it does |
|---|---|
| `trek-plugin validate [dir]` | Runs the manifest + layout checks locally (a subset of registry CI, which additionally verifies the release, the artifact SHA-256, and the README over the network). |
| `trek-plugin pack [dir] [--out plugin.zip] [--json]` | Builds `plugin.zip` in the installer's exact layout and prints its SHA-256 + byte size. Refuses native binaries; `docs/` is intentionally not shipped (the store fetches the screenshot from your repo). |
| `trek-plugin entry --repo <o/n> --tag <vX> [--zip z] [--merge entry.json] [--out f]` | Emits the registry entry — `commitSha`, `downloadUrl`, `sha256`, `size` and `minTrekVersion` (derived from the manifest `trek` range) all filled in. `--merge` prepends the new version onto an existing entry for updates. |
| `trek-plugin release [dir] --repo <o/n> --tag <vX>` | The one-shot: `pack` → create the GitHub release → print the entry. |

Run them via `npx trek-plugin-sdk …`. See [[Plugin Development|Plugin-Development]]
for the SDK and manifest, and [[Publishing a Plugin|Plugin-Publishing]] for the
registry PR flow. Any unique slug works — only `registry`, `install` and `rescan`
are refused (they'd collide with admin API routes) — and an `id` stays bound to
the GitHub owner who first registered it, so
nobody can repoint an existing plugin. Entries may optionally carry an author
signing key (`authorPublicKey` + a per-version `signature`) for offline signature
verification on top of the SHA-256 pin.
