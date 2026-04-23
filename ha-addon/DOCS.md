# TREK — Home Assistant Add-on Documentation

## Requirements

- Home Assistant OS or Home Assistant Supervised, version **2024.6** or newer.
- Supported architectures: `amd64`, `aarch64`, `armv7`.
- First install takes a few minutes while Supervisor builds the add-on
  image from the upstream `mauriceboe/trek` base.

## Options

### `log_level`

`trace` · `debug` · `info` (default) · `warn` · `error`.

`info` logs user-visible actions. `debug` adds verbose details useful when
reporting a bug. The add-on does **not** forward HTTP request logs to the
Supervisor log stream by default — they are available in
`/addon_configs/<slug>_trek/trek/data/logs/trek.log`.

### `tz`

IANA timezone for logs, scheduled reminders and cron jobs.
Example: `Europe/Berlin`, `America/Los_Angeles`. Leave empty to inherit
the host timezone.

### `app_url`

Public base URL of your Home Assistant instance, including the Ingress
path if you plan to share invite links. Example:

```
https://ha.example.com/api/hassio_ingress/<stable-slug>
```

**Required** when you enable OIDC in the TREK admin panel or rely on
email notification links that point back to TREK. Home Assistant
Supervisor cannot auto-detect the outward-facing URL, so you must set
this manually.

### `default_language`

Sets the login page fallback language when the browser/OS language is
not one of TREK's 15 supported locales. Per-user language preferences
are saved after login regardless.

### `admin_email` / `admin_password`

Used **only on first boot**, when no user accounts exist. Once an admin
exists, changes to these options have no effect — create additional
users from the TREK admin panel instead. If both are empty, TREK prints
a randomly generated password to the add-on log on first start.

### `demo_mode`

Wipes all data every hour and re-seeds the demo trip. **Not** for
production — only enable if you're demonstrating TREK to others.

## Data & backups

TREK's database, uploads, logs and backups live at
`/addon_configs/<slug>_trek/trek/` on the HA host. This path is
persistent across:

- Add-on restarts.
- Add-on upgrades (including version bumps).
- Add-on uninstall → reinstall, unless you explicitly tick "delete data".

HA's automatic snapshots include this directory. TREK's own
in-app backup feature writes to the same persistent volume so you
can restore from either mechanism.

## Known limitations

The following issues are accepted trade-offs for the v1 add-on and are
tracked for the next iteration.

### OIDC / OAuth 2.1 flows

External identity providers require a stable, reachable redirect URI.
Under HA Ingress every request carries a rotating session token, which
providers reject. Configure `app_url` manually if you want OIDC and
consult your provider's docs for how to register the exact callback
URL.

### PWA installation

TREK's progressive-web-app features (home-screen install, offline
cache) are disabled when accessed through HA Ingress. The service-worker
scope is pinned to the non-rotating Ingress path, which Supervisor
cannot guarantee across sessions. You can still use TREK as a regular
website in the sidebar — the in-browser experience is identical.

### Admin backup download

The "Download backup" button in the TREK admin panel currently uses an
absolute URL and will 404 under Ingress. Workaround: download backups
via the File Editor add-on directly from
`/addon_configs/<slug>_trek/trek/data/backups/`.

### Email magic-links

TREK generates password-reset and invite links using `app_url`. If you
do not configure `app_url`, emailed links point at relative paths and
fail when opened outside HA. Always set `app_url` when you enable
outbound email.

## Troubleshooting

### Add-on won't start / build fails on armv7

Building `better-sqlite3` and `sharp` on armv7 under QEMU takes several
minutes and occasionally exhausts the Supervisor build timeout. Retry
the install; the layer cache makes subsequent attempts much faster.

### Sidebar icon opens a blank page

Check the add-on log for `Access token required` — this indicates an
Ingress session expiry. Refresh the HA tab.

### `better-sqlite3 ... invalid ELF header`

You moved the `/data/trek/data/*.db` file from an `amd64` host to
`aarch64`/`armv7` or vice-versa. SQLite is portable but native modules
are not; TREK ships its own SQLite driver built for the running arch,
so the database itself is fine — just restart the add-on to let it
re-open on the current architecture.

## Uninstall & data retention

By default HA keeps `/addon_configs/<slug>_trek/trek/` after the add-on
is uninstalled. Your trips, photos and backups are safe. Tick "Delete
add-on data" in the uninstall dialog if you want a clean slate.
