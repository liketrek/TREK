# TREK — Travel Planner

![Supports amd64 Architecture][amd64-shield]
![Supports aarch64 Architecture][aarch64-shield]
![Supports armv7 Architecture][armv7-shield]

Self-hosted, real-time collaborative travel planner — with maps, budgets,
packing lists, a journal and AI built in. This add-on runs TREK inside your
Home Assistant Supervisor and exposes it through the sidebar via Ingress.

## Install

1. Open Home Assistant → **Settings → Add-ons → Add-on Store**.
2. Click the **⋮** menu (top-right) → **Repositories**.
3. Add:

   ```
   https://github.com/mauriceboe/TREK
   ```

4. Close the dialog, find **TREK — Travel Planner** in the store and click
   **Install**.
5. After the build finishes, set `admin_email` + `admin_password` in the
   add-on configuration, start the add-on, then open the Web UI from the
   sidebar.

## Quick options

| Option | Purpose |
|---|---|
| `log_level` | `info` for concise user actions, `debug` for verbose details. |
| `tz` | Timezone for logs, reminders and scheduled tasks (e.g. `Europe/Berlin`). |
| `app_url` | Public base URL. **Required** for OIDC and email notification links. |
| `default_language` | Login-page fallback when browser language is not supported. |
| `admin_email` / `admin_password` | Initial admin account — applied only on first boot. |
| `demo_mode` | Hourly data resets. **Not** for production installs. |

See [DOCS.md](DOCS.md) for full details and known limitations.

## Data location

TREK stores the SQLite database and user uploads at
`/addon_configs/<slug>_trek/trek/` on the HA host. This directory survives
add-on upgrades and uninstalls. Automatic snapshots include it; the
`backup_to_share` mode additionally mirrors TREK's own backup files
into `/share/trek/`.

## License

TREK is [AGPL v3](https://github.com/mauriceboe/TREK/blob/main/LICENSE).
The add-on wrapper is published under the same license.

[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
