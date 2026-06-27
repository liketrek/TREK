# Environment Variables

Complete reference for all environment variables TREK reads.

## How to Set Variables

- **Docker Compose** — use the `environment:` block or a `.env` file alongside `docker-compose.yml`
- **Docker run** — pass each variable with `-e VARIABLE=value`
- **Helm** — use `env:` for plain values and `secretEnv:` for sensitive values in `values.yaml`
- **Unraid** — set in the container template editor
- **Proxmox Community Script** — set in `/opt/trek/server/.env`

---

## Core

| Variable                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Default                         |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| `PORT`                      | Server port                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sources: `3001`, Docker: `3000` |
| `HOST`                      | Bind address for the HTTP server (e.g. `127.0.0.1`, `10.0.0.72`). **Source / Proxmox installs only** — do not set this in Docker or any containerized deployment. See note below.                                                                                                                                                                                                                                                                                                                                                 | all interfaces                  |
| `NODE_ENV`                  | Environment (`production` / `development`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `production`                    |
| `ENCRYPTION_KEY`            | At-rest encryption key — see resolution order below                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | auto                            |
| `TZ`                        | Timezone for logs, reminders, and cron jobs (e.g. `Europe/Berlin`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `UTC`                           |
| `LOG_LEVEL`                 | `info` = concise user actions; `debug` = verbose details                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `info`                          |
| `DEFAULT_LANGUAGE`          | Default language on the login page — see supported codes below                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `en`                            |
| `SESSION_DURATION`          | How long a login session stays valid before re-login is required. Used when **"Remember me" is unchecked** on the login form (the default): applies to the `trek_session` JWT `exp` claim, and the cookie is issued as a **browser-session cookie** (no `maxAge`, cleared when the browser closes). Accepts `ms`-style strings: `1h`, `12h`, `7d`, `30d`, `90d`. Invalid values warn at startup and fall back to the default. Does not affect the short-lived MFA challenge token or MCP OAuth tokens (those keep their own TTL). | `24h`                           |
| `SESSION_DURATION_REMEMBER` | Session length used when the user **ticks "Remember me"** on login: a longer-lived JWT `exp` claim plus a **persistent** `trek_session` cookie whose `maxAge` matches, so the session survives browser restarts. Same `ms`-style format and startup-fallback behaviour as `SESSION_DURATION`.                                                                                                                                                                                                                                     | `30d`                           |
| `ALLOWED_ORIGINS`           | Comma-separated origins for CORS and email notification links                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | same-origin                     |
| `ALLOW_INTERNAL_NETWORK`    | Allow outbound requests to private/RFC-1918 IPs. Set `true` if Immich or other integrated services are on your local network. Loopback (`127.x`) and link-local (`169.254.x`) addresses remain blocked regardless.                                                                                                                                                                                                                                                                                                                | `false`                         |
| `APP_URL`                   | Public base URL (e.g. `https://trek.example.com`). Required when OIDC is enabled — must match the redirect URI registered with your IdP. Also used as the base URL for email notification links.                                                                                                                                                                                                                                                                                                                                  | —                               |

### `HOST` — Source and Proxmox installs only

By default TREK binds to all network interfaces (`0.0.0.0`), which is the correct behaviour inside a container because
Docker handles port exposure at the host level. Setting `HOST` overrides the bind address at the Node.js level.

**When to use it:** only when running TREK directly on a host (git sources or
the [Proxmox community script](Install-Proxmox)) and you need to restrict which interface the server listens on — for
example, to expose TREK only on a LAN interface while keeping it off the public-facing one.

**Never set `HOST` in Docker, Docker Compose, Helm, or Unraid deployments.** Use Docker's
`-p <host-ip>:<host-port>:<container-port>` syntax or your orchestrator's port binding instead.

```
# .env — source / Proxmox installs only
HOST=10.0.0.72   # bind only on this LAN interface
PORT=3001
```

When `HOST` is set, the startup banner includes a `Host:` line confirming the bound address.

### `ENCRYPTION_KEY` — Resolution Order

`server/src/config.ts` resolves the encryption key in this order:

1. **`ENCRYPTION_KEY` env var** — explicit value, always takes priority. Persisted to `data/.encryption_key`
   automatically.
2. **`data/.encryption_key` file** — present on any install that has started at least once.
3. **`data/.jwt_secret` file** — one-time fallback for existing installs upgrading without a pre-set key. The value is
   immediately persisted to `data/.encryption_key` so JWT rotation cannot break decryption later.
4. **Auto-generated** — fresh install with none of the above; persisted to `data/.encryption_key`.

Setting `ENCRYPTION_KEY` explicitly is recommended so you can back it up independently of the data volume.

### `DEFAULT_LANGUAGE` — Supported Codes

You can set `DEFAULT_LANGUAGE` to any of the 20 languages TREK ships. The currently supported codes are:

| Code    | Language           |
|---------|--------------------|
| `en`    | English            |
| `de`    | Deutsch            |
| `es`    | Español            |
| `fr`    | Français           |
| `hu`    | Magyar             |
| `nl`    | Nederlands         |
| `br`    | Português (Brasil) |
| `cs`    | Česky              |
| `pl`    | Polski             |
| `ru`    | Русский            |
| `zh`    | 简体中文               |
| `zh-TW` | 繁體中文               |
| `it`    | Italiano           |
| `tr`    | Türkçe             |
| `ar`    | العربية            |
| `id`    | Bahasa Indonesia   |
| `ja`    | 日本語                |
| `ko`    | 한국어                |
| `uk`    | Українська         |
| `gr`    | Ελληνικά           |

If you set a code that isn't supported, TREK falls back to English (`en`). This list grows as new
translations are added to TREK.

---

## HTTPS / Proxy

These three variables work together behind a TLS-terminating reverse proxy. See [Reverse-Proxy](Reverse-Proxy) for the
full explanation.

| Variable                  | Description                                                                                                                                                                                                                                                                             | Default          |
|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|
| `FORCE_HTTPS`             | When `true`: 301-redirects HTTP→HTTPS, sends HSTS (`max-age=31536000`), adds CSP `upgrade-insecure-requests`, forces cookie `secure` flag. Only useful behind a TLS proxy. Requires `TRUST_PROXY`.                                                                                      | `false`          |
| `HSTS_INCLUDE_SUBDOMAINS` | When `true`: adds the `includeSubDomains` directive to the HSTS header, extending HTTPS enforcement to all subdomains. Only effective when HSTS is active (`FORCE_HTTPS=true` or `NODE_ENV=production`). Leave `false` if you run other services on sibling subdomains over plain HTTP. | `false`          |
| `TRUST_PROXY`             | Number of trusted proxy hops. Tells Express to read the real client IP from `X-Forwarded-For` and protocol from `X-Forwarded-Proto`. Defaults to `1` automatically in production. Required for `FORCE_HTTPS` to detect the forwarded protocol.                                          | `1` (production) |
| `COOKIE_SECURE`           | Controls the `secure` flag on the `trek_session` cookie. Auto-derived as `true` when `NODE_ENV=production` or `FORCE_HTTPS=true`. Set to `false` only as an escape hatch for LAN testing without TLS — not recommended in production.                                                   | auto             |

> **Warning:** `FORCE_HTTPS=true` without `TRUST_PROXY` set causes a redirect loop.

---

## OIDC / SSO

For setup instructions, see [OIDC-SSO](OIDC-SSO).

| Variable             | Description                                                                                                                                                                            | Default                |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------|
| `OIDC_ISSUER`        | OpenID Connect provider URL (e.g. `https://auth.example.com`)                                                                                                                          | —                      |
| `OIDC_CLIENT_ID`     | OIDC client ID                                                                                                                                                                         | —                      |
| `OIDC_CLIENT_SECRET` | OIDC client secret                                                                                                                                                                     | —                      |
| `OIDC_DISPLAY_NAME`  | Label shown on the SSO login button                                                                                                                                                    | `SSO`                  |
| `OIDC_ONLY`          | Force SSO-only mode: disables password login and registration, overrides Admin > Settings toggles, cannot be changed at runtime. First SSO login becomes admin on a fresh instance.    | `false`                |
| `OIDC_ADMIN_CLAIM`   | OIDC claim used to identify admin users (e.g. `groups`)                                                                                                                                | —                      |
| `OIDC_ADMIN_VALUE`   | Value of the OIDC claim that grants admin role (e.g. `app-trek-admins`)                                                                                                                | —                      |
| `OIDC_SCOPE`         | Space-separated OIDC scopes to request. **Fully replaces** the default — always include `openid email profile` plus any extra scopes (e.g. add `groups` when using `OIDC_ADMIN_CLAIM`) | `openid email profile` |
| `OIDC_DISCOVERY_URL` | Override the auto-constructed OIDC discovery endpoint. Required for providers with a non-standard path (e.g. Authentik)                                                                | —                      |

---

## WebAuthn / Passkeys

Passkey (WebAuthn) login is configured from the Admin panel, but the two cryptographically
sensitive values can be pinned via environment variables. Env vars take priority over the
corresponding database settings. These values are **only** ever derived from server-side config —
never from request `Host` / `X-Forwarded-Host` headers (mirroring OIDC redirect-URI handling).

| Variable           | Description                                                                                                                                                                                                                                                                                                                                                                   | Default                |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------|
| `WEBAUTHN_RP_ID`   | Relying-Party ID — the registrable domain passkeys are bound to (e.g. `trek.example.com`). Overrides the `webauthn_rp_id` DB setting. When unset, it is derived from the hostname of `APP_URL`. Bare IP literals (IPv4/IPv6) are rejected. If it cannot be resolved, passkeys are disabled.                                                                                   | derived from `APP_URL` |
| `WEBAUTHN_ORIGINS` | Comma-separated list of allowed origins for passkey ceremonies (e.g. `https://trek.example.com`). Overrides the `webauthn_origins` DB setting; trailing slashes are stripped. When unset and the RP ID is not `localhost`, a single origin is derived from `APP_URL`. In dev (RP ID `localhost`) `http://localhost:5173` and `http://localhost:3001` are added automatically. | derived from `APP_URL` |

---

## Email / SMTP

SMTP settings can be configured via the Admin panel or overridden with environment variables. Env vars take priority
over the database values.

| Variable               | Description                                                                                                                             | Default |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|---------|
| `SMTP_HOST`            | SMTP server hostname (e.g. `smtp.example.com`)                                                                                          | —       |
| `SMTP_PORT`            | SMTP server port. Port `465` enables implicit TLS (`secure: true`); all other ports use STARTTLS or plain.                              | —       |
| `SMTP_USER`            | SMTP authentication username                                                                                                            | —       |
| `SMTP_PASS`            | SMTP authentication password                                                                                                            | —       |
| `SMTP_FROM`            | Sender address for outbound emails (e.g. `TREK <noreply@example.com>`)                                                                  | —       |
| `SMTP_SKIP_TLS_VERIFY` | Set `true` to disable TLS certificate validation. Useful for self-signed certs on internal SMTP relays — not recommended in production. | `false` |

`SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` are all required for email delivery to work. `SMTP_USER` and `SMTP_PASS` are
optional (for unauthenticated relays).

---

## Initial Setup

These variables only take effect on first boot, before any user exists.

| Variable         | Description                          | Default            |
|------------------|--------------------------------------|--------------------|
| `ADMIN_EMAIL`    | Email for the first admin account    | `admin@trek.local` |
| `ADMIN_PASSWORD` | Password for the first admin account | random             |

Both variables must be set together. If either is omitted, the account is created with email `admin@trek.local` and a
randomly generated password that is printed to the server log. Once any user exists, these variables have no effect.

---

## MCP

For setup instructions, see [MCP-Overview](MCP-Overview).

| Variable                   | Description                              | Default |
|----------------------------|------------------------------------------|---------|
| `MCP_RATE_LIMIT`           | Max MCP API requests per user per minute | `300`   |
| `MCP_MAX_SESSION_PER_USER` | Max concurrent MCP sessions per user     | `20`    |

---

## Booking Import (KDE Itinerary)

| Variable                    | Description                                                                                                                                                                                             | Default       |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `KITINERARY_EXTRACTOR_PATH` | Full path to the `kitinerary-extractor` binary. When unset, TREK searches `/usr/lib/*/libexec/kf6/kitinerary-extractor` and then `PATH`. Set this if you install the binary to a non-standard location. | auto-detected |

The official TREK Docker image bundles the binary automatically: on amd64 it downloads the static release from
`https://cdn.kde.org/ci-builds/pim/kitinerary/`; on arm64 it installs `libkitinerary-bin` via apt (Debian trixie). When
running TREK from source, install `libkitinerary-bin` (Debian trixie / Ubuntu 25.04+) or download the static binary
directly and place it anywhere on `PATH`. The `GET /api/health/features` endpoint returns `{ "bookingImport": true }`
when the binary is found, and the Import button in the Reservations panel is hidden when it is not.

---

## Storage & Paths

| Variable                 | Description                                                                                                                                                                                                                                            | Default                 |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------|
| `TREK_PLACE_PHOTO_DIR`   | Directory where cached Google place photos are stored. Created recursively on boot. Set this to point photo storage at a dedicated mounted volume.                                                                                                     | `uploads/photos/google` |
| `BACKUP_UPLOAD_LIMIT_MB` | Maximum **compressed** size (in MB) of a restore-backup archive that may be uploaded. Raise it if your backups (which include the `uploads/` directory) exceed the default. Non-positive or invalid values log a warning and fall back to the default. | `500`                   |

---

## Advanced / Tuning

| Variable                  | Description                                                                                                                                                                                                                                                                                                                | Default             |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------|
| `IDEMPOTENCY_TTL_SECONDS` | How long (in seconds) stored idempotency keys are kept before garbage collection. The offline client replays queued mutations with their `X-Idempotency-Key` on reconnect, so this must exceed the longest expected offline window or a replay could create a duplicate. Invalid values silently fall back to the default. | `2592000` (30 days) |
| `OVERPASS_URL`            | Custom [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) endpoint(s) used by the map's POI "explore" search, comma-separated. When set it **replaces** the bundled public mirrors — point it at an internal or self-hosted Overpass instance when the public mirrors are unreachable from your network (e.g. firewalled/locked-down egress in a Kubernetes cluster). Entries that aren't valid `http(s)` URLs are ignored. If you don't run your own Overpass but the public mirrors throttle TREK, first make sure `APP_URL` (or `ALLOWED_ORIGINS`) is set: that alone gives outbound Overpass/Nominatim requests a unique User-Agent, which the public mirrors rate-limit far less. | bundled public mirrors |
| `OVERPASS_TIMEOUT_MS`     | Per-endpoint timeout (in milliseconds) for Overpass POI requests. Endpoints race in parallel and one that hasn't answered within this window is abandoned so a faster mirror can win. Raise it if you run a slow self-hosted Overpass instance. Invalid values fall back to the default. | `12000` |

---

## Demo Mode

Demo mode runs TREK as a public, self-resetting sandbox. Not intended for regular deployments.

| Variable           | Description                                                                                                                                                                                                                                                                 | Default          |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|
| `DEMO_MODE`        | Enable demo mode: seeds example data, resets the database hourly, exposes the demo-login endpoint, and blocks destructive mutations (password change, account deletion, uploads) for demo users. Logs a security warning at startup if combined with `NODE_ENV=production`. | `false`          |
| `DEMO_ADMIN_USER`  | Username of the seeded demo admin account.                                                                                                                                                                                                                                  | `admin`          |
| `DEMO_ADMIN_EMAIL` | Email of the seeded demo admin account.                                                                                                                                                                                                                                     | `admin@trek.app` |
| `DEMO_ADMIN_PASS`  | Initial password for the seeded demo admin (bcrypt-hashed at seed time).                                                                                                                                                                                                    | `admin12345`     |

The `DEMO_ADMIN_*` variables only take effect when `DEMO_MODE=true`, and only at the moment the demo data is first
seeded.

---

## Related Pages

- [Reverse-Proxy](Reverse-Proxy) — HTTPS proxy setup and the `FORCE_HTTPS` / `TRUST_PROXY` / `COOKIE_SECURE` trio
- [OIDC-SSO](OIDC-SSO) — complete OIDC configuration guide
- [MCP-Overview](MCP-Overview) — MCP server setup and rate limiting
- [Encryption-Key-Rotation](Encryption-Key-Rotation) — rotating the `ENCRYPTION_KEY` without losing data
