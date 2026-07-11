# Security Hardening

A production TREK deployment checklist. All items reference actual TREK configuration options.

## Encryption & Secrets

- [ ] Set a strong `ENCRYPTION_KEY` (generate with `openssl rand -hex 32`). See [Encryption-Key-Rotation](Encryption-Key-Rotation).
- [ ] Back up `ENCRYPTION_KEY` separately from the database backup ZIP — losing it makes all stored API keys and secrets unreadable. Stored secrets use AES-256-GCM encryption derived from this key.
- [ ] Rotate `ENCRYPTION_KEY` if it may have been exposed. See [Encryption-Key-Rotation](Encryption-Key-Rotation).

## HTTPS & Network

- [ ] Run TREK behind a TLS-terminating reverse proxy (nginx, Caddy, Traefik). See [Reverse-Proxy](Reverse-Proxy).
- [ ] Set `TRUST_PROXY=1` so client IPs are captured correctly in the audit log. In `NODE_ENV=production` this defaults to `1` automatically, but set it explicitly if you use a non-standard proxy hop count.
- [ ] Set `FORCE_HTTPS=true` to enable HSTS (`max-age=31536000`), redirect HTTP to HTTPS, and add `upgrade-insecure-requests` to the CSP. Requires `TRUST_PROXY` — omitting it causes a redirect loop.
- [ ] Keep `ALLOW_INTERNAL_NETWORK=false` unless Immich or Synology is on your LAN. See [Internal-Network-Access](Internal-Network-Access). Note: loopback (`127.x`, `::1`) and link-local (`169.254.x`) addresses are always blocked regardless of this setting.

## Authentication

- [ ] Enable two-factor authentication for your admin account. See [Two-Factor-Authentication](Two-Factor-Authentication).
- [ ] Require MFA for all users via [Admin-Permissions](Admin-Permissions) if your use case demands it. Note: you must have MFA enabled on your own admin account before you can enforce it globally.
- [ ] Disable open registration if you control who can access the instance. See [Admin-Users-and-Invites](Admin-Users-and-Invites).
- [ ] Rotate the JWT signing secret if a session may have been leaked: Admin Panel → Admin → Rotate JWT Secret (`POST /api/admin/rotate-jwt-secret`). This invalidates all active sessions immediately.

## Session Security

TREK stores sessions as JWTs in an httpOnly `trek_session` cookie (SameSite=Lax, 24-hour expiry). The `secure` flag is set automatically when `NODE_ENV=production` or `FORCE_HTTPS=true`. Tokens are also accepted via `Authorization: Bearer` header for MCP and API clients.

- [ ] Ensure `FORCE_HTTPS=true` (or `NODE_ENV=production`) so the `trek_session` cookie carries the `secure` flag and is never sent over plain HTTP.
- [ ] Set `COOKIE_SECURE=false` only as a temporary escape hatch for LAN testing without TLS — do not use in production.

## Password Policy

TREK enforces a minimum password policy on all registrations and password changes:

- Minimum 8 characters
- Must contain uppercase, lowercase, digit, and special character
- Common passwords and fully-repetitive strings are rejected
- Passwords are hashed with bcrypt (cost factor 12)

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
- `script-src 'self' 'wasm-unsafe-eval'` (no `unsafe-inline`)
- `object-src 'none'`
- `frame-src 'none'`
- `frameAncestors 'self'` (prevents clickjacking from external frames)
- `upgrade-insecure-requests` (added automatically when `FORCE_HTTPS=true`)

## Plugin Runtime Hardening

Installed plugins run **untrusted third-party code**. TREK contains a plugin in several independent layers so a hostile or buggy plugin can neither read TREK's data nor take the instance down. Nothing here needs configuration — it is all on by default — but the escape hatches below exist for tuning.

- [ ] Leave the plugin system's defaults in place. It is **on by default** but installed plugins still have to be **activated one by one**, so no third-party code runs until an admin turns a specific plugin on. Set `TREK_PLUGINS_ENABLED=false` (accepts `false`/`0`/`off`/`no`) to switch the whole system off — installed plugins stay on disk, deactivated, and the runtime is idle.
- [ ] Keep the **OS permission jail** enabled (the default). In production each plugin runs in an isolated child process launched with Node's `--permission` model: filesystem **writes**, `child_process`, worker threads and native addons are denied outright, and reads are scoped to just the plugin's own code — so a plugin cannot read `trek.db` or the secret files, or shell out. The child's environment is scrubbed (no `JWT_SECRET`, no DB credentials). Setting `TREK_PLUGIN_PERMISSIONS=off` disables this jail (isolation then falls back to crash-only) and logs a loud warning — only ever do this on a machine you fully trust.
- [ ] Rely on the **private-egress block** (SSRF backstop). Even a plugin that declared an outbound host cannot reach a destination that resolves to a loopback, private, link-local, ULA, carrier-grade-NAT, cloud-metadata (`169.254.169.254`), multicast or reserved address — the guard re-checks the resolved IP, so a plugin can't pivot to internal services or DNS-rebind to them. This is independent of `ALLOW_INTERNAL_NETWORK` (which only governs core Immich/Synology features).
- [ ] The supervisor caps each plugin's **resident memory** (default 300 MB, `TREK_PLUGIN_MAX_RSS_MB`) — measured host-side from the OS, never the plugin's self-report — and kills a plugin that blows the ceiling or stops sending heartbeats; repeat offenders auto-disable. Every `ctx.*` capability call is also **rate-limited** at the dispatch boundary (a token bucket: ~60-call burst, 20 calls/sec sustained, 16 concurrent; `TREK_PLUGIN_RPC_BURST` / `TREK_PLUGIN_RPC_PER_SEC` / `TREK_PLUGIN_RPC_INFLIGHT`), so one plugin in a tight loop gets throttled instead of freezing the instance.
- [ ] Review the **capability audit** if you grant plugins broad data access. Every host-mediated core-data read and broadcast a plugin makes is recorded at the RPC boundary against the real acting user (not a value the plugin supplies) in a per-plugin, hash-chained, tamper-evident log. Admins see it per plugin; each user can see "what have plugins done in my name?". Retention is capped per plugin (default 20 000 rows, `TREK_PLUGIN_AUDIT_MAX_ROWS`).

> The developer **dev-link** feature (`TREK_PLUGINS_DEV_LINK=1`) loads unsigned local code and, under `npm run dev`, runs with the OS jail off — keep it off on any instance that isn't a throwaway dev box you control. See [Plugins](Plugins) and [Plugin Permissions](Plugin-Permissions).

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
