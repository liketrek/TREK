# Admin Panel Overview

The Admin Panel is the central control surface for TREK instance operators. It is only accessible to users with the `admin` role.

## Accessing the Admin Panel

Navigate to the **Admin** link in the top navbar. If you do not see it, your account does not have admin privileges.

![Admin Panel](assets/AdminPanel.png)

## Tabs

The Admin Panel is divided into tabs. Most tabs are always visible; a few appear only under specific conditions.

| Tab | Purpose | Conditional? |
|-----|---------|--------------|
| **Users** | Manage users, invite links, and permissions | No |
| **Personalization** | Packing templates and place categories | No |
| **User Defaults** | Default settings applied to new users | No |
| **Addons** | Enable or disable optional features instance-wide | No |
| **Plugins** | Install, update, and manage plugins; rescan the plugins folder; review each plugin's capability audit. See [Admin-Plugins](Admin-Plugins) | No |
| **Settings** | Authentication methods, MFA, allowed file types, API keys, OIDC/SSO configuration, and JWT secret rotation | No |
| **Notifications** | SMTP, webhook, ntfy, and push notification channel configuration; trip reminder toggle; admin notification preferences | No |
| **Backup** | Manual and scheduled database backups | No |
| **Audit** | Chronological activity log | No |
| **MCP Access** | OAuth sessions and static API tokens | Only when the MCP addon is enabled |
| **GitHub** | Release timeline and support links | No |
| **Dev: Notifications** | Test notification dispatch | Only in development mode (`NODE_ENV=development`) |

![Admin panel on the User Defaults tab, setting instance-wide defaults for colour mode, temperature unit, distance unit, time format, currency and blurred booking codes](assets/AdminUserDefaults.png)

## Plugin activity and audit

Plugins that are granted data-access capabilities have every host-mediated action they take recorded in a tamper-evident, hash-chained log. This log is separate from the instance **Audit** tab described above.

- **Admins** can review the per-plugin capability audit — every core-data read, broadcast, notification, and AI call a plugin made, with the acting user, the resource touched, and the outcome. This is exposed for each installed plugin in the admin plugin management view.
- **Every user** (not just admins) can see the plugin actions taken in their own name under **Settings → Plugins**. This is what keeps a plugin's broad read grants accountable to the person whose data was read.

See [Audit-Log](Audit-Log) for details on the hash chain and how the two logs differ.

## Related pages

- [Admin-Users-and-Invites](Admin-Users-and-Invites)
- [Admin-Addons](Admin-Addons)
- [Admin-Categories](Admin-Categories)
- [Admin-Packing-Templates](Admin-Packing-Templates)
- [Admin-Permissions](Admin-Permissions)
- [Admin-MCP-Tokens](Admin-MCP-Tokens)
- [Admin-GitHub-Releases](Admin-GitHub-Releases)
