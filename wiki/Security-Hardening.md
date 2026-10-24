# Security Hardening

A production TREK deployment checklist. All items reference actual TREK configuration options.

## Encryption & Secrets

- [ ] Set a strong `ENCRYPTION_KEY` (generate with `openssl rand -hex 32`). See [Encryption-Key-Rotation](Encryption-Key-Rotation).
- [ ] Back up `ENCRYPTION_KEY` separately from the database backup ZIP — losing it makes all stored API keys and secrets unreadable. Stored secrets use AES-256-GCM encryption derived from this key.
- [ ] Rotate `ENCRYPTION_KEY` if it may have been exposed. See [Encryption-Key-Rotation](Encryption-Key-Rotation).

## HTTPS & Network

- [ ] Run TREK behind a TLS-terminating reverse proxy (nginx, Caddy, Traefik). See [Reverse-Proxy](Reverse-Proxy).
- [ ] Set `TRUST_PROXY=1` so client IPs are captured correctly in the audit log. In `NODE_ENV=production` this defaults to `1` automatically, but set it explicitly if you use a non-standard proxy hop count.
- [ ] Set `FORCE_HTTPS=true` to 301-redirect HTTP to HTTPS and add `upgrade-insecure-requests` to the CSP. Your proxy must send `X-Forwarded-Proto: https` (or terminate TLS on the same connection), otherwise the redirect fires on every request and loops.
- [ ] Know that HSTS (`max-age=31536000`) does not depend on `FORCE_HTTPS`: it is sent whenever `FORCE_HTTPS=true` **or** `NODE_ENV=production`, which the Docker image sets by default — so an instance behind Traefik, Caddy or a Cloudflare Tunnel advertises HSTS without setting `FORCE_HTTPS` at all. Set `HSTS_INCLUDE_SUBDOMAINS=true` to add `includeSubDomains`; it is off by default so an install on an apex domain does not force HTTPS onto sibling subdomains you may still serve over plain HTTP.
- [ ] Keep `ALLOW_INTERNAL_NETWORK=false` unless a strict-guard integration — Immich, Synology Photos, AirTrail, Dawarich, a document store bound through [Document-Sync](Document-Sync) (Paperless-ngx, Papra, Nextcloud, OpenCloud, Synology Drive), a notification webhook or ntfy — is on your LAN. See [Internal-Network-Access](Internal-Network-Access). Note: loopback (`127.x`, `::1`) addresses are always blocked regardless of this setting, and so are link-local (`169.254.x`) addresses, apart from a single one you name in `ALLOW_LINK_LOCAL_IPS`, which the strict guard then treats as internal. See [A link-local address you need](Internal-Network-Access#a-link-local-address-you-need).

## Authentication

- [ ] Enable two-factor authentication for your admin account. See [Two-Factor-Authentication](Two-Factor-Authentication).
- [ ] Require MFA for all users if your use case demands it: Admin Panel → Settings → **Require two-factor authentication (2FA)**. Note: you must secure your own admin account first, with either TOTP or a registered passkey — the server refuses the toggle otherwise. A passkey satisfies the policy for everyone else too, so nobody is forced onto TOTP specifically.
- [ ] Disable open registration if you control who can access the instance. See [Admin-Users-and-Invites](Admin-Users-and-Invites).
- [ ] If one account's session may have been leaked, end that account's sessions rather than everyone's: the user signs out the other sessions (`POST /api/auth/sessions/revoke-others`) or changes the password, or an admin sets a new password for them. See [Ending sessions](#ending-sessions) below.
- [ ] Rotate the JWT signing secret if the secret itself may have been leaked: Admin Panel → Settings → Danger Zone → **Rotate** (`POST /api/admin/rotate-jwt-secret`). This invalidates all active sessions immediately, including your own.

## Session Security

TREK stores sessions as JWTs in an httpOnly `trek_session` cookie (SameSite=Lax). A normal login expires after `SESSION_DURATION` (default 24 hours) and rides in a browser-session cookie that the browser drops when it closes; ticking **Remember me** issues a persistent cookie whose lifetime and JWT expiry are `SESSION_DURATION_REMEMBER` (default 30 days) — shorten it if a 30-day window is too wide for your threat model. The `secure` flag is set automatically when `NODE_ENV=production`, when `FORCE_HTTPS=true`, or when Express sees that the request arrived over TLS (`X-Forwarded-Proto: https`) — the last of those needs `trust proxy` active, which is automatic in production and otherwise means setting `TRUST_PROXY` yourself. Tokens are also accepted via `Authorization: Bearer` header for MCP and API clients.

- [ ] Ensure `FORCE_HTTPS=true` (or `NODE_ENV=production`) so the `trek_session` cookie carries the `secure` flag and is never sent over plain HTTP.
- [ ] Set `COOKIE_SECURE=false` only as a temporary escape hatch for LAN testing without TLS — do not use in production.

### Ending sessions

Every sign-in (password, MFA, passkey, SSO, registration, the demo button) is also recorded on the server as a session: the JWT carries a session id, and the server refuses a token whose session has ended, even though its signature and expiry are still good. A copy of the cookie that ended up somewhere else (a proxy log, a debugging tool, a stolen laptop) therefore stops working the moment its session ends, rather than living out its 24 hours or 30 days.

A session ends when:

| Action | Sessions ended |
|---|---|
| **Log out** (`POST /api/auth/logout`) | The one it is called with. Clearing the cookie alone used to leave the token valid. |
| `DELETE /api/auth/sessions/{id}` | That one session of your own account. |
| `POST /api/auth/sessions/revoke-others` | Every session of your account but the current one. |
| Password change | Every session. A browser that made the change with its session cookie gets a new one; an API client calling it with a Bearer token gets none, since it would never receive it. |
| Password reset by email | Every session. |
| Admin sets a new password for a user | Every session of that user. |
| Recovery script `reset-admin.js` | Every session of the account it resets. |
| Disabling two-factor authentication | Every other session; the one that proved the password and code stays. |
| Admin clears a user's two-factor authentication | Every session of that user. |
| Account deletion | Every session, with the account. |

`GET /api/auth/sessions` lists the active sessions of your account, most recently used first, with when each started, when it was last used (refreshed at most every few minutes), when it expires, the browser's User-Agent at sign-in (cut to 256 characters) and which one is the current one. No IP address is stored. The settings screen does not show this list yet; the routes are there for it and for API clients. On a demo instance the shared demo account sees only its own session in the list and cannot end sessions (403), since its sessions are other visitors' browsers.

Sessions issued before this was introduced carry no session id. They keep working until they expire (or until the password changes, which ends them through the password version), are not listed, and are not ended by **revoke-others**. Once such a session passes half its lifetime, the sliding renewal replaces it with a tracked one. That session's id is derived from the old token, so the many requests a page load sends at once all renew it into the same single session instead of listing the browser several times. A nightly job removes the session rows that have expired. An ended session's row stays until its own expiry, so a session renewed from such an old token cannot be brought back by that token once it was ended.

A backup restore and the hourly demo reset replace the whole database file. Both carry the sessions that are active at that moment into the new file, for every account it holds under the same id and email, so neither signs anybody out by itself.

> **Deprecated:** the login, registration, demo-login, MFA and passkey sign-in responses and the SSO code exchange (`GET /api/auth/oidc/exchange`) still carry the session JWT as `token` in the JSON body, for API clients that read it. The web app does not use it; the session is the httpOnly cookie the same response sets, and the SSO exchange also answers `success: true`, which is what the web app checks. The field will be removed in a future major version.

## Password Policy

TREK enforces a minimum password policy on all registrations and password changes:

- Minimum 8 characters
- Must contain uppercase, lowercase, digit, and special character
- Common passwords and fully-repetitive strings are rejected
- Passwords are hashed with bcrypt (cost factor 12)

Every form that sets a password (registration, including through an invite link, the new password asked for on first login, the password reset, a password change in **Settings > Account**, and the admin's **Create User** and **Edit User** dialogs) lists these rules as a checklist under the field and ticks each one off while you type, using the server's own policy.

No configuration is required; this policy is always active.

## Rate Limiting

Built-in in-memory rate limits protect authentication endpoints:

| Endpoint | Limit | Window |
|---|---|---|
| Login / Register / Invite | 10 attempts | 15 minutes |
| MFA verify-login / enable | 5 attempts | 15 minutes |
| Password change | 5 attempts | 15 minutes |
| MCP token creation | 5 attempts | 15 minutes |

These limits are per source IP. If TREK is behind a reverse proxy, set `TRUST_PROXY` so the real client IP is used rather than the proxy's IP.

## Content Security Policy

Helmet applies a strict CSP on all responses. Key directives:

- `default-src 'self'`
- `script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'` (no `unsafe-inline`; `'unsafe-eval'` is required by the in-browser HEIC converter, which initialises through `new Function()`)
- `object-src 'self'` (so same-origin file previews can embed PDFs via `<object>`/`<embed>`)
- `frame-src 'self'` (for the sandboxed plugin frames at `/plugin-frame/*`, which run at an opaque origin under their own CSP)
- `frameAncestors 'self'` (prevents clickjacking from external frames)
- `upgrade-insecure-requests` (added automatically when `FORCE_HTTPS=true`)

## Plugin Runtime Hardening

Installed plugins run **untrusted third-party code**. TREK contains a plugin in several independent layers so a hostile or buggy plugin can neither read TREK's data nor take the instance down. Nothing here needs configuration — it is all on by default — but the escape hatches below exist for tuning.

- [ ] Leave the plugin system's defaults in place. It is **on by default** but installed plugins still have to be **activated one by one**, so no third-party code runs until an admin turns a specific plugin on. Set `TREK_PLUGINS_ENABLED=false` (accepts `false`/`0`/`off`/`no`) to switch the whole system off — installed plugins stay on disk, deactivated, and the runtime is idle.
- [ ] Keep the **OS permission jail** enabled (the default). In production each plugin runs in an isolated child process launched with Node's `--permission` model: filesystem **writes**, `child_process`, worker threads and native addons are denied outright, and reads are scoped to just the plugin's own code — so a plugin cannot read `trek.db` or the secret files, or shell out. The child's environment is scrubbed (no `JWT_SECRET`, no DB credentials). Setting `TREK_PLUGIN_PERMISSIONS=off` disables this jail (isolation then falls back to crash-only) and logs a loud warning — only ever do this on a machine you fully trust.
- [ ] Rely on the **private-egress block** (SSRF backstop). Even a plugin that declared an outbound host cannot reach a destination that resolves to a loopback, private, link-local, ULA, carrier-grade-NAT, cloud-metadata (`169.254.169.254`), multicast or reserved address — the guard re-checks the resolved IP, so a plugin can't pivot to internal services or DNS-rebind to them. This is independent of `ALLOW_INTERNAL_NETWORK` (which governs the core integrations reached through the strict guard — Immich, Synology Photos, AirTrail, Dawarich, the Document-Sync stores, notification webhooks and ntfy — not plugin egress). The one escape hatch is `TREK_PLUGIN_ALLOW_PRIVATE_EGRESS=on`, for a plugin that has to reach a service on your LAN (a Gotify, an ntfy, an Ollama). It is instance-wide rather than per plugin, and it lifts the block entirely rather than narrowing it: a declared host may then resolve to any address, the `169.254.169.254` metadata IP included, and unix-socket or named-pipe connects (`docker.sock`, a local database socket) are permitted without even being declared, since the OS jail does not gate socket connects. Leave it unset unless a specific plugin genuinely needs a LAN target.
- [ ] The supervisor caps each plugin's **resident memory** (default 300 MB, `TREK_PLUGIN_MAX_RSS_MB`) — measured host-side from the OS, never the plugin's self-report — and kills a plugin that blows the ceiling or stops sending heartbeats; repeat offenders auto-disable. Every `ctx.*` capability call is also **rate-limited** at the dispatch boundary (a token bucket: ~60-call burst, 20 calls/sec sustained, 16 concurrent; `TREK_PLUGIN_RPC_BURST` / `TREK_PLUGIN_RPC_PER_SEC` / `TREK_PLUGIN_RPC_INFLIGHT`), so one plugin in a tight loop gets throttled instead of freezing the instance.
- [ ] Review the **capability audit** if you grant plugins broad data access. Every host-mediated core-data read and broadcast a plugin makes is recorded at the RPC boundary against the real acting user (not a value the plugin supplies) in a per-plugin, hash-chained, tamper-evident log. Admins see it per plugin; each user can see "what have plugins done in my name?". Retention is capped per plugin (default 20 000 rows, `TREK_PLUGIN_AUDIT_MAX_ROWS`).

> The developer **dev-link** feature (`TREK_PLUGINS_DEV_LINK=1`) loads unsigned local code and, under `npm run dev`, runs with the OS jail off — keep it off on any instance that isn't a throwaway dev box you control. See [Plugins](Plugins) and [Plugin Permissions](Plugin-Permissions).
>
> Likewise leave `TREK_PLUGINS_IGNORE_TREK_RANGE` unset. It turns the plugin TREK-version gate into a warning so a plugin whose author has not updated its `trek` range can still be installed and activated — the admin panel warns at every step, but a plugin running on a TREK it was never tested against can misbehave and, in rare cases, corrupt data. Set it only for a specific plugin you need, and remove it once the author ships a release that admits your TREK.

## Backups

- [ ] Enable auto-backup with an appropriate retention window. See [Backups](Backups).
- [ ] Store backups off-site — copy backup ZIPs to a separate location outside the TREK host.

## Monitoring

- [ ] Review the audit log periodically for unexpected logins or admin changes. See [Audit-Log](Audit-Log).
- [ ] Check for TREK updates regularly. See [Admin-GitHub-Releases](Admin-GitHub-Releases) and [Updating](Updating).

## See also

- [Encryption-Key-Rotation](Encryption-Key-Rotation)
- [Reverse-Proxy](Reverse-Proxy)
- [Internal-Network-Access](Internal-Network-Access)
- [Two-Factor-Authentication](Two-Factor-Authentication)
- [Admin-Permissions](Admin-Permissions)
- [Admin-Users-and-Invites](Admin-Users-and-Invites)
- [Backups](Backups)
- [Audit-Log](Audit-Log)
- [Admin-GitHub-Releases](Admin-GitHub-Releases)
- [Updating](Updating)
- [Environment-Variables](Environment-Variables)
