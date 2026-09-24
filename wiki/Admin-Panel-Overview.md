# Admin Panel Overview

The Admin Panel is the central control surface for TREK instance operators. It is only accessible to users with the `admin` role.

## Accessing the Admin Panel

Open the user menu in the top navigation bar (your avatar), then select **Admin**. If the entry is not there, your account does not have admin privileges.

![Admin Panel](assets/AdminPanel.png)

## Tabs

The Admin Panel is divided into tabs. Most tabs are always visible; a few appear only under specific conditions.

| Tab | Purpose | Conditional? |
|-----|---------|--------------|
| **Users** | Manage users, invite links, and permissions | No |
| **Personalization** | Packing templates, place categories and the manually maintained school holiday catalog (see [Vacay](Vacay#manually-maintained-school-holidays)) | No |
| **User Defaults** | Default settings applied to new users | No |
| **Addons** | Enable or disable optional features instance-wide | No |
| **Plugins** | Install, update, and manage plugins; rescan the plugins folder; view each plugin's error log. See [Admin-Plugins](Admin-Plugins) | No |
| **Storage** | Storage backends, category assignment, replication, health | No |
| **Settings** | Authentication methods, MFA, allowed file types, API keys, OIDC/SSO configuration, and JWT secret rotation | No |
| **Notifications** | SMTP, webhook, ntfy, and push notification channel configuration; trip reminder toggle; admin notification preferences | No |
| **Backup** | Manual and scheduled full-instance backups: database, uploads, plugin data and plugin code. See [Backups](Backups) | No |
| **Audit** | Chronological activity log | No |
| **MCP Access** | OAuth sessions and static API tokens | Only when the MCP addon is enabled |
| **GitHub** | Release timeline and support links | No |
| **Dev: Notifications** | Test notification dispatch | Only in development mode (`NODE_ENV=development`) |

![Admin panel on the User Defaults tab, setting instance-wide defaults for colour mode, temperature unit, distance unit, time format, currency and blurred booking codes](assets/AdminUserDefaults.png)

### Routing services

On desktop and mobile, **User Defaults** includes optional **Own routing engine** and **Own Valhalla instance** fields in the map section. Changes save when you leave the field; **reset** restores the built-in default.

With both fields empty, TREK uses public OSRM servers for routing and the public FOSSGIS Valhalla for avoiding toll roads, motorways and ferries. Configuring only a custom routing instance disables the public Valhalla fallback. After entering a custom server URL, restart TREK and reload the page. See [Road-Trip](Road-Trip#routing-engines).

> **AI / MCP:** These fields configure the routing services the planner and the road trip MCP tools use, and do not change stored trip data.

### Routing usage counters

Every route is calculated in the browser against the routing hosts, so the server never sees a routing request itself. To still know how much routing an instance does, the browser reports its tally in batches and the server keeps **daily counters**: how many requests, of what kind (route, segments, legs, alternatives), for which profile (driving, walking, cycling), how many waypoints, roughly how many kilometres, how many came back without a route, and whether a self-hosted engine answered. Counters only: no query, no coordinate, no route, no user and no trip is stored, and nothing leaves the instance. A day's row is kept for 400 days.

Counting is **on by default** and has no switch in the admin panel. To turn it off, set the `route_usage_enabled` key to `false` in the `app_settings` table; reports are then acknowledged but nothing is written. There is no admin screen for the totals either: an admin reads them at `GET /api/route-usage/summary` and wipes them with `DELETE /api/route-usage`.

### Linking to a tab directly

Every panel is reachable by URL, so a bookmark, an onboarding mail or a support reply can point at the one tab it is about instead of at the top of a page with thirteen of them:

```
/admin?tab=audit
```

Unlike the trip planner's `tab` parameter, this one stays in the address bar and is rewritten as you switch tabs, so the URL always says which panel you are looking at. It replaces the current history entry instead of adding one, so the back button still leaves the admin page rather than walking back through the tabs you visited.

| Tab | Id |
|-----|-----|
| Users | `users` (the default, carries no `?tab=`) |
| Personalization | `config` |
| User Defaults | `defaults` |
| Addons | `addons` |
| Plugins | `plugins` |
| Storage | `storage` |
| Settings | `settings` |
| Notifications | `notifications` |
| Backup | `backup` |
| Audit | `audit` |
| MCP Access | `mcp-tokens` |
| GitHub | `github` |
| Dev: Notifications | `dev-notifications` |

An id with no panel behind it opens **Users**. The two conditional tabs behave differently: `mcp-tokens` and `dev-notifications` open their panel even when the MCP addon is off or the instance is not in development mode, with nothing highlighted in the sidebar, because the entry is missing from it.

## Plugin activity and audit

Plugins that are granted data-access capabilities have every host-mediated action they take recorded in a tamper-evident, hash-chained log. This log is separate from the instance **Audit** tab described above.

- **Admins** can review the per-plugin capability audit: every core-data read, broadcast, notification, and AI call a plugin made, with the acting user, the resource touched, and the outcome. It is served by `GET /api/admin/plugins/<id>/audit`; the admin plugin view itself currently surfaces only each plugin's error log (**View error log**).
- **Every user** (not just admins) can see the plugin actions taken in their own name under **Settings → Plugins**. This is what keeps a plugin's broad read grants accountable to the person whose data was read.

See [Audit-Log](Audit-Log) for details on the hash chain and how the two logs differ.

## Related pages

- [Admin-Users-and-Invites](Admin-Users-and-Invites)
- [Admin-Addons](Admin-Addons)
- [Admin-Categories](Admin-Categories)
- [Admin-Packing-Templates](Admin-Packing-Templates)
- [Admin-Permissions](Admin-Permissions)
- [[Admin: Storage|Admin-Storage]]
- [Admin-MCP-Tokens](Admin-MCP-Tokens)
- [Admin-GitHub-Releases](Admin-GitHub-Releases)
