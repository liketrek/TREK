<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/logo-trek-light.svg" />
  <source media="(prefers-color-scheme: light)" srcset="docs/logo-trek-dark.svg" />
  <img src="docs/logo-trek-dark.svg" alt="TREK" height="96" />
</picture>

<br />
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/subtitle-light.png" />
  <source media="(prefers-color-scheme: light)" srcset="docs/subtitle-dark.png" />
  <img src="docs/subtitle-dark.png" alt="your trip. your plan." height="28" />
</picture>

A self-hosted, real-time collaborative travel planner — with maps, budgets, packing lists, a journal, and AI built in.

<br />

<a href="https://demo.liketrek.com"><img alt="Demo" src="https://img.shields.io/badge/Demo-try-111827?style=for-the-badge" /></a>
&nbsp;
<a href="https://hub.docker.com/r/mauriceboe/trek"><img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge" /></a>
&nbsp;
<a href="https://sonarcloud.io/project/overview?id=liketrek_TREK"><img alt="Sonar Quality Gate" src="https://img.shields.io/sonar/quality_gate/liketrek_TREK?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge" /></a>
&nbsp;
<a href="https://discord.gg/NhZBDSd4qW"><img alt="Discord" src="https://img.shields.io/badge/Discord-join-5865F2?style=for-the-badge" /></a>
&nbsp;
<a href="https://kanban.pakulat.org/shared/I4wxF6inOOMB0C6hH6kQm3efyNxFjwyI"><img alt="Roadmap" src="https://img.shields.io/badge/Roadmap-view-0EA5E9?style=for-the-badge" /></a>
<br />
<a href="https://ko-fi.com/mauriceboe"><img alt="Ko-fi" src="https://img.shields.io/badge/Ko--fi-support-FF5E5B?style=for-the-badge" /></a>
&nbsp;
<a href="https://www.buymeacoffee.com/mauriceboe"><img alt="BMAC" src="https://img.shields.io/badge/BMAC-support-FFDD00?style=for-the-badge" /></a>
<br />
<a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-AGPL_v3-6B7280?style=flat-square" /></a>
<a href="https://github.com/liketrek/TREK/releases"><img alt="Latest Release" src="https://img.shields.io/github/v/release/liketrek/trek?include_prereleases&style=flat-square&color=6B7280" /></a>
<a href="https://hub.docker.com/r/mauriceboe/trek"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/mauriceboe/trek?style=flat-square&color=6B7280" /></a>
<a href="https://github.com/liketrek/TREK"><img alt="Stars" src="https://img.shields.io/github/stars/liketrek/trek?style=flat-square&color=6B7280" /></a>
</div>

---

<div align="center">

<img src="https://github.com/mauriceboe/trek-media/releases/download/readme-assets/TREK1.webp" alt="TREK, a tour of the app" width="100%" />

</div>

<br />

## What you get

<picture>
  <source media="(max-width: 700px)" srcset="docs/tiles/grid-mobile.svg" />
  <source media="(prefers-color-scheme: dark)" srcset="docs/tiles/grid-desktop-dark.svg" />
  <img src="docs/tiles/grid-desktop.svg" alt="Plan, track, share" width="100%" />
</picture>

<details>
<summary><b>See all features</b></summary>

<br />

Most of what follows is an addon an admin switches on or off. Lists, Costs, Documents, Collab, Vacay and Atlas ship on; Journey, Collections, MCP, AI Parsing and AirTrail ship off and are marked below.

<table>
<tr>
<td width="50%" valign="top">

#### 🧭 Planning

- **Day plans**: drag places between days and reorder inside a day, with undo. Notes and bookings drag the same way, and a map marker drops straight onto a day
- **Maps**: Leaflet, Mapbox GL or MapLibre GL (OpenFreeMap, no token), with clustering, photo markers and route lines. 3D buildings and terrain are Mapbox only
- **Place search**: Google Places when a key is set (photos, ratings, opening hours), otherwise OpenStreetMap with no key
- **Place enrichment**: descriptions, facts, hours and photo candidates from OpenStreetMap, Wikipedia, Wikidata and Wikimedia Commons
- **POI explore**: pull OpenStreetMap POIs by category for the current viewport over Overpass
- **Import**: shared Google Maps and Naver Maps lists, plus GPX, KML and KMZ files
- **Export**: GPX of a trip's places and tracks, and an ICS feed per trip or across all of them
- **Routes**: auto-sort a day (nearest neighbour then 2-opt, locked stops and hotel anchors stay put), driving, walking or cycling profiles over OSRM, then open it in Google Maps or CoMaps
- **Public transport**: door-to-door itineraries over Transitous
- **Weather**: 16-day forecast from Open-Meteo, no key. Dates outside that window read the archive for the same date instead
- **Day notes**: markdown body with an icon and a colour, reordered by drag and drop or moved to another day
- **Trip dates**: move a trip and the days re-date themselves, either dragging the bookings along or re-anchoring them. Trips also copy and archive

</td>
<td width="50%" valign="top">

#### 🧳 Bookings and money

- **Reservations**: 16 booking types with status, confirmation code, travellers and attached files
- **Flights and trains**: several legs with stopovers, per-leg times and endpoint timezones, against 4,045 bundled airports so local times resolve without a key
- **Accommodation**: a stay spans a range of days with a check-in window, and shows on every night it covers
- **Booking import**: EML, PDF, PKPass, HTML and TXT confirmations through [KItinerary](https://invent.kde.org/pim/kitinerary). Needs the `kitinerary-extractor` binary, which ships in the Docker image
- **AirTrail** (off by default): link a self-hosted AirTrail instance to import flights as reservations and keep them in sync
- **Costs**: split expenses in integer cents with equal or custom shares, several payers per expense, settle-up suggestions, a settlement log, and CSV export
- **Currencies**: a currency per expense with the rate frozen at entry. Rates come from Frankfurter, no key
- **Packing lists**: categories, admin-managed templates, assignees, three visibility tiers, and a packed-of-total line. Bags with weight roll-up are a separate admin switch, off by default
- **To-dos**: assignee, due date, priority, and a reminder before one falls due
- **Files**: attach to a trip, place, day entry or reservation. 50 MB each, 500 MB for video, with trash and restore
- **PDF export**: cover page, place photos, day notes, bookings and costs, with an optional page break per day

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 👥 Collaboration

- **Real-time sync** (WebSocket): edits land live for everyone who has that trip open
- **Members**: add by email or username, hand ownership to someone else, or add guests who have no login at all
- **Permissions**: an admin maps each of 16 trip actions to admin, trip owner, trip member or everybody
- **Invite links**: one reusable link per trip with an optional expiry. Admins can also issue signup invites with a use limit that drop the new account straight into a trip
- **Public share**: a read-only trip page anyone can open without an account
- **Collab**: group chat with replies, reactions and link previews, shared notes with attachments, polls, and a What's Next list of upcoming activities. Each of the four switches on its own

#### 📔 Journal, Atlas and Vacay

- **Journey** (off by default): dated entries with story, mood, weather and tags, photos and video from uploads or a linked [Immich](https://immich.app) or Synology Photos library, map views, co-authors, and a public share link
- **Atlas**: mark countries and sub-national regions visited on [geoBoundaries](https://www.geoboundaries.org/) outlines, plus a bucket list, travel stats and a consecutive-years-travelled count
- **Vacay**: leave calendar with half days, public holidays from date.nager.at, school holiday overlays for 16 European countries, carry-over between years, and joint or read-only sharing of a plan
- **Collections** (off by default): a place library outside any trip, with labels, ratings, a custom image per place, copy-into-a-trip, and sharing by invite

</td>
<td width="50%" valign="top">

#### 🧩 Plugins

- **Third-party plugins**: install from the TREK registry or sideload a zip, switch on per instance, with their own pages under `/plugins/<id>`
- **Sandboxed**: one child process per plugin, 63 grantable permissions, an admin-edited outbound host allowlist, memory and RPC caps, and daily caps on AI and notification calls
- **Trust**: registry downloads are pinned by sha256 and checked against the author's minisign key. A sideloaded zip is marked unverified, and `TREK_PLUGINS_ENABLED=false` turns the whole system off
- **Extension points**: map markers and layers, place details, day schedules, PDF sections, Atlas layers, journal rows, trip warnings, calendar sources, route profiles and notification channels. Plugin pages run in an opaque-origin iframe
- **SDK**: [`trek-plugin-sdk`](https://www.npmjs.com/package/trek-plugin-sdk) on npm, with a manifest validator, a mock host, and a dev-link mode that runs a local build against real data

#### 🤖 AI and MCP

- **MCP server** (off by default): OAuth 2.1 with mandatory PKCE and dynamic client registration. 199 tools, 30 resources, 4 prompts
- **Scopes**: 29 scopes in 14 groups, each one tickable on the consent screen. Tokens are bound to the `/mcp` resource, and every tool call lands in the audit log
- **Reach**: create trips and days, edit places, packing lists, to-dos, costs, reservations, collections and journeys, mark countries visited, all inside the scopes the token holds
- **Prompts**: `trip-summary`, plus `packing-list` and `budget-overview` when those addons are on
- **Addon-aware**: seven addon gates decide which tools and resources a session sees. Flipping one drops live sessions so the surface re-registers
- **Booking extraction** (off by default): read a confirmation with a local Ollama server, any OpenAI-compatible endpoint, or Anthropic, configured instance-wide or per user

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 📱 Mobile and offline

- **Installable**: iOS and Android straight from the browser, no App Store. Runs standalone without browser chrome, with the status bar tinted per theme
- **Phone layouts**: a separate shell below 768px with its own tokens, a bottom bar and safe-area insets. Which items sit in that bar is up to the user
- **Offline reads**: the app shell and every route chunk are precached, and trips, places and file blobs live in a per-user IndexedDB store, so a trip opens with no network
- **Offline writes**: mutations queue and replay with an `X-Idempotency-Key`, so a reconnect cannot double-apply. A stale edit is parked for a keep-mine or keep-theirs choice
- **Offline maps**: pre-download a trip's raster tiles, and clear them again
- **API responses are never cached** by the service worker. They vary per session, so they always come from the network

</td>
<td width="50%" valign="top">

#### ⚙️ Admin, accounts and security

- **Login methods**: password login, password registration, OIDC login, OIDC registration and passkey login each switch on and off on their own. `OIDC_ONLY` leaves SSO as the only way in
- **SSO (OIDC)**: one provider by discovery, with PKCE and `id_token` verification (Authentik, Keycloak, Google and the like)
- **2FA**: TOTP with ten single-use backup codes, and an admin can require it instance-wide
- **Passkeys**: WebAuthn login by fingerprint, face, PIN or security key, off until an admin enables it. A passkey also satisfies the 2FA requirement
- **Hardening**: per-IP limits on login, password reset and 2FA attempts, a password policy, secrets encrypted at rest and masked on read, and an SSRF guard on every URL you configure
- **Admin panel**: users and invites, the permission matrix, packing templates, categories, addons, plugins, API keys, MCP tokens and OAuth sessions, backups, storage, audit log, and GitHub releases
- **Backups**: manual or scheduled hourly, daily, weekly or monthly, with retention in days. The zip carries the at-rest key, so a restore can decrypt its own secrets
- **Storage**: pluggable storage backends per content category — keep everything on local disk, or add S3-compatible backends and replicate any category to them, configured entirely from the admin panel
- **Notifications**: a per-user matrix of events against in-app, email (SMTP), webhook and ntfy, plus any channel a plugin registers
- **Appearance**: light, dark or follow the OS, seven colour schemes plus a custom accent, transparency, compact density, reduce motion, and text size per tier
- **23 languages**: en, de, es, fr, it, nl, hu, ru, zh, zh-TW, pl, cs, ar (right to left), br, id, tr, ja, ko, uk, gr, sv, vi, ca
- **In-app help**: the wiki ships inside the image and is served from disk at `/help`, so the docs match the version you are running

</td>
</tr>
</table>

</details>

<br />

<div align="center">
  <a href="docs/screenshots/showcase-desktop-1.webp"><img src="docs/screenshots/showcase-desktop-1.webp" alt="Atlas · dashboard · trip planner" width="100%" /></a>
  <a href="docs/screenshots/showcase-mobile.webp"><img src="docs/screenshots/showcase-mobile.webp" alt="Mobile PWA · dashboard, day plan, map, costs" width="100%" /></a>
  <a href="docs/screenshots/showcase-desktop-2.webp"><img src="docs/screenshots/showcase-desktop-2.webp" alt="Collections · journey journal · costs" width="100%" /></a>
</div>

<br />

## AI usage

We use LLM-assisted coding tools across parts of this codebase. Nothing ships that a
maintainer has not read and understood: every change goes through a pull request, is
reviewed and tested, and has a human who can answer for it. "The AI wrote that" is not
an answer any of us would accept from ourselves.

See [**How we use AI in TREK**](https://github.com/liketrek/TREK/discussions/1851) for
the details.

<br />

## Get started in 30 seconds

```bash
ENCRYPTION_KEY=$(openssl rand -hex 32) docker run -d -p 3000:3000 \
  -e ENCRYPTION_KEY=$ENCRYPTION_KEY \
  -v ./data:/app/data -v ./uploads:/app/uploads mauriceboe/trek
```

Open `http://localhost:3000`. On first boot TREK seeds an admin account — if you set `ADMIN_EMAIL`/`ADMIN_PASSWORD` those are used, otherwise the credentials are printed to the container log (`docker logs trek`).

<div align="center">

<a href="#docker-compose-production">Docker Compose</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#helm-kubernetes">Helm / Kubernetes</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#install-as-app-pwa">Install as PWA</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#reverse-proxy">Reverse Proxy</a>

</div>

<br />

## Tech stack

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=flat-square&logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>

Real-time sync via WebSocket (`ws`). Backend on NestJS 11. State with Zustand. Auth via JWT + OAuth 2.1 + OIDC + Passkeys (WebAuthn) + TOTP MFA. Weather via Open-Meteo (no key required). Maps with Leaflet and Mapbox GL.

<br />

<h2 id="docker-compose-production">Docker Compose (production)</h2>

<details>
<summary>Full compose example with secure defaults</summary>

```yaml
services:
  app:
    image: mauriceboe/trek:latest
    container_name: trek
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
    tmpfs:
      - /tmp:noexec,nosuid,size=64m
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:-}   # generate with: openssl rand -hex 32
      - TZ=${TZ:-UTC}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-}
      - APP_URL=${APP_URL:-}                 # required for OIDC + email links
      # - FORCE_HTTPS=true                   # behind a TLS-terminating proxy
      # - TRUST_PROXY=1
      # - OIDC_ISSUER=https://auth.example.com
      # - OIDC_CLIENT_ID=trek
      # - OIDC_CLIENT_SECRET=supersecret
      # - OIDC_DISPLAY_NAME=SSO
      # - OIDC_ADMIN_CLAIM=groups
      # - OIDC_ADMIN_VALUE=app-trek-admins
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

Then:

```bash
docker compose up -d
```

**HTTPS notes:** `FORCE_HTTPS=true` is optional — it adds a 301 redirect, HSTS, CSP upgrade-insecure-requests, and forces the `secure` cookie flag. Only use it behind a TLS-terminating reverse proxy. `TRUST_PROXY=1` tells the server how many proxies sit in front so real client IPs and `X-Forwarded-Proto` work.

</details>

<br />

<h2 id="helm-kubernetes">Helm (Kubernetes)</h2>

```bash
helm repo add trek https://chart.liketrek.com
helm repo update
helm install trek trek/trek
```

See [`charts/README.md`](https://github.com/liketrek/TREK/blob/main/charts/README.md) for values.

<h2 id="install-as-app-pwa">Install as App (PWA)</h2>

TREK works as a Progressive Web App — no App Store needed.

1. Open TREK in the browser (HTTPS required)
2. **iOS**: Share ▸ *Add to Home Screen*
3. **Android**: Menu ▸ *Install app* (or *Add to Home Screen*)

TREK then launches fullscreen with its own icon, just like a native app.

<br />

## Updating

**Docker Compose:**

```bash
docker compose pull && docker compose up -d
```

**Docker run** — reuse the original volume paths:

```bash
docker pull mauriceboe/trek
docker rm -f trek
docker run -d --name trek -p 3000:3000 -v ./data:/app/data -v ./uploads:/app/uploads --restart unless-stopped mauriceboe/trek
```

> Not sure which paths you used? `docker inspect trek --format '{{json .Mounts}}'` before removing the container.

Your data stays in the mounted `data` and `uploads` volumes — updates never touch it.

> [!IMPORTANT]
> Mount **only** the data and uploads directories — `-v ./data:/app/data -v ./uploads:/app/uploads`. **Never mount a volume at `/app`.** Doing so hides the application code shipped in the image and the container fails to start with `Cannot find module 'tsconfig-paths/register'`. If you previously mounted `/app`, switch to the two mounts above; your data in `data/` and `uploads/` is preserved.

<h3>Rotating the Encryption Key</h3>

If you need to rotate `ENCRYPTION_KEY` (e.g. upgrading from a version that derived encryption from `JWT_SECRET`):

```bash
docker exec -it trek node --import tsx scripts/migrate-encryption.ts
```

The script creates a timestamped DB backup before making changes and prompts for old + new keys (input is not echoed).

<h2 id="reverse-proxy">Reverse Proxy</h2>

For production, put TREK behind a TLS-terminating reverse proxy. TREK uses WebSockets for real-time sync, so the proxy **must** support WebSocket upgrades on `/ws`.

If you use the MCP addon, the proxy must also pass the `Mcp-Session-Id` header through in both directions on `/mcp` — Nginx and Caddy do this by default, but a proxy that strips it makes every tool call open a new session instead of reusing one. See the [Reverse Proxy wiki page](https://github.com/liketrek/TREK/wiki/Reverse-Proxy) for details.

<details>
<summary>Nginx</summary>

```nginx
server {
    listen 80;
    server_name trek.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name trek.yourdomain.com;

    ssl_certificate     /etc/ssl/fullchain.pem;
    ssl_certificate_key /etc/ssl/privkey.pem;

    # 500 MB covers backup-restore uploads (capped at 500 MB server-side).
    client_max_body_size 500m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Only needed if you use the MCP addon. Responses are Server-Sent Events,
    # so buffering must be off or tool results arrive late.
    location /mcp {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }
}
```

</details>

<details>
<summary>Caddy</summary>

```caddy
trek.yourdomain.com {
    reverse_proxy localhost:3000
}
```

Caddy handles TLS and WebSockets automatically.

</details>

<br />

## Environment variables

> [!NOTE]
> Variables are validated at startup (fail-fast). An unset or blank variable
> always falls back to its default, but a variable set to a malformed value
> (e.g. `PORT=abc`, `SESSION_DURATION=bogus`, `DEMO_MODE=maybe`) aborts boot
> with a report listing every offending variable. Boolean switches accept
> `true`/`false`, `1`/`0`, `on`/`off` and `yes`/`no` (any casing).

<details>
<summary><b>Full reference</b></summary>

<br />

| Variable | Description | Default |
|----------|-------------|---------|
| **Core** | | |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`production` / `development`) | `production` |
| `ENCRYPTION_KEY` | At-rest encryption key for stored secrets (API keys, MFA, SMTP, OIDC). Recommended: generate with `openssl rand -hex 32`. If unset, falls back to `data/.jwt_secret` (existing installs) or auto-generates a key (fresh installs). | Auto |
| `TZ` | Timezone for logs, reminders and cron jobs (e.g. `Europe/Berlin`) | `UTC` |
| `LOG_LEVEL` | `info` = concise user actions, `debug` = verbose details | `info` |
| `TREK_WIKI_DIR` | Where the in-app Help pages (`/help`) read their content from. TREK ships its wiki and serves it from disk, so Help always matches the version you are running — you should not need to set this. Point it at your own directory to serve custom docs. If the path does not exist, Help falls back to fetching the public GitHub wiki (needs outbound network, and tracks the latest release). | bundled `wiki/` |
| `DEFAULT_LANGUAGE` | Default language on the login page for users with no saved preference. Browser/OS language is auto-detected first; this is the fallback. Supported: `de`, `en`, `es`, `fr`, `hu`, `nl`, `br`, `cs`, `pl`, `ru`, `zh`, `zh-TW`, `it`, `ar`, `id`, `tr`, `ja`, `ko`, `uk`, `gr` | `en` |
| `ALLOWED_ORIGINS` | Comma-separated origins for CORS and email links | same-origin |
| `FORCE_HTTPS` | Optional. When `true`: 301-redirects HTTP to HTTPS, sends HSTS, adds CSP `upgrade-insecure-requests`, forces the session cookie `secure` flag. Useful behind a TLS-terminating reverse proxy. Requires `TRUST_PROXY`. | `false` |
| `HSTS_INCLUDE_SUBDOMAINS` | When `true`: adds the `includeSubDomains` directive to the HSTS header, extending HTTPS enforcement to all subdomains. Only effective when HSTS is active (`FORCE_HTTPS=true` or `NODE_ENV=production`). Leave `false` if you run other services on sibling subdomains over plain HTTP. | `false` |
| `COOKIE_SECURE` | Controls the `secure` flag on the `trek_session` cookie. Auto-derived: on when `NODE_ENV=production` or `FORCE_HTTPS=true`. Escape hatch: set `false` to allow session cookies over plain HTTP. Not recommended in production. | auto |
| `SESSION_DURATION` | How long a login session stays valid when **"Remember me" is unchecked** (the default): sets the `trek_session` JWT `exp` and issues a browser-session cookie (cleared when the browser closes). Accepts `ms`-style strings: `1h`, `12h`, `7d`, `30d`, `90d`. Invalid values warn at startup and fall back to the default. | `24h` |
| `SESSION_DURATION_REMEMBER` | Session length when **"Remember me" is ticked** at login: a longer-lived JWT plus a persistent `trek_session` cookie that survives browser restarts. Same format and startup-fallback behaviour as `SESSION_DURATION`. | `30d` |
| `TRUST_PROXY` | Number of trusted reverse proxies. Tells the server to read client IP from `X-Forwarded-For` and protocol from `X-Forwarded-Proto`. Defaults to `1` in production; off in dev unless set. | `1` |
| `ALLOW_INTERNAL_NETWORK` | Allow outbound requests to private/RFC-1918 IPs (e.g. Immich on your LAN). Loopback and link-local addresses remain blocked. | `false` |
| `APP_URL` | Public base URL of this instance (e.g. `https://trek.example.com`). Required when OIDC is enabled; used as base for email notification links. | — |
| **OIDC / SSO** | | |
| `OIDC_ISSUER` | OpenID Connect provider URL | — |
| `OIDC_CLIENT_ID` | OIDC client ID | — |
| `OIDC_CLIENT_SECRET` | OIDC client secret | — |
| `OIDC_DISPLAY_NAME` | Label shown on the SSO login button | `SSO` |
| `OIDC_ONLY` | Force SSO-only mode: disables password login + registration, regardless of Admin > Settings. The first SSO login becomes admin. | `false` |
| `OIDC_ADMIN_CLAIM` | OIDC claim used to identify admin users | — |
| `OIDC_ADMIN_VALUE` | Value of the OIDC claim that grants admin role | — |
| `OIDC_SCOPE` | Space-separated OIDC scopes. **Fully replaces** the default — always include `openid email profile`. | `openid email profile` |
| `OIDC_DISCOVERY_URL` | Override the auto-constructed OIDC discovery endpoint (e.g. Authentik: `.../application/o/trek/.well-known/openid-configuration`) | — |
| **Initial setup** | | |
| `ADMIN_EMAIL` | Email for the first admin on initial boot. Must be set together with `ADMIN_PASSWORD`. If either is omitted a random password is printed to the server log. No effect once a user exists. | `admin@trek.local` |
| `ADMIN_PASSWORD` | Password for the first admin on initial boot. Pairs with `ADMIN_EMAIL`. | random |
| **Other** | | |
| `TREK_MANAGED` | Marks the install as centrally administered: the operator owns the configuration, credentials and upgrades, so the instance admin is not offered settings the operator sets. Leave unset when you run TREK yourself. | `false` |
| `PLACES_API_KEY` | Places credential supplied by whoever operates the install. When set, it is used for every lookup and the per-user keys in Admin > Settings are ignored. Leave unset to keep the stored keys. | — |
| `PLACES_API_BASE` | Send the Places calls to this origin instead of `https://places.googleapis.com` (an egress proxy, a cache, a gateway holding the key). Path and query are unchanged, so it has to speak the same API. | — |
| `DEMO_MODE` | Enable demo mode (hourly data resets) | `false` |
| `UNSPLASH_ACCESS_KEY` | Optional Unsplash Access Key for trip-cover and place-image search. Without one, TREK uses Unsplash's unauthenticated endpoint, which some datacenter/VPS IPs are blocked from. Get a free key at [unsplash.com/developers](https://unsplash.com/developers). Overrides any per-admin key set in Admin > Settings (where it can also be configured instead). | — |
| `MCP_RATE_LIMIT` | Max MCP API requests per user per minute | `300` |
| `MCP_MAX_SESSION_PER_USER` | Max concurrent MCP sessions per user. At the cap, the least-recently-active session is closed to make room | `20` |

</details>

<br />

<h2 id="storage">Storage</h2>

TREK separates *what* it stores (eight content categories — trip documents,
journey photos, cover images, profile pictures, place images, the two photo
caches, and backups) from *where* it stores it (named backends). Out of the
box everything lives on local disk (`uploads/` and `data/backups`). From
**Admin → Storage** you can:

- **Add S3-compatible backends** (AWS S3, Cloudflare R2, Backblaze B2, Garage,
  MinIO/AIStor) and assign any category to them.
- **Replicate a backend**: edit it and pick **Mirror targets** — every write is
  then also copied to each target. The classic off-site backup setup is:
  add an S3 backend, edit `backups-local`, tick the S3 backend as a mirror
  target, save. Replica writes happen one after another during each upload, so
  a slow or unreachable target slows every upload of every category on that
  backend — fine for backups, worth weighing for hot categories. Existing
  objects are not replicated when you add a target — press **Sync now** on
  the backend to copy them (one sync at a time; progress and cancel in the
  panel).
- **Watch the Health strip**: replica failures never fail the original
  request; they are recorded and shown there instead. All-clear means every
  replicated write landed. Failures also notify admins over the configured
  notification channels (first failure immediately, then hourly summaries) —
  tune it under Admin → Notifications.
- **Test** any backend from its row (for a replicated backend it probes the
  primary and each target individually). Targets must be saved before Test
  can probe them.
- **Usage**: per-category and per-backend object counts and sizes, scanned
  nightly and on demand.

Backend credentials are encrypted at rest. Without an explicit
`ENCRYPTION_KEY` the implicit key from the data directory is used — that
works, but the implicit key rides inside backups, so setting `ENCRYPTION_KEY`
explicitly is recommended for credentialed backends. On an existing install
that has been running without an explicit key, do not just set a new one —
that would orphan already-stored secrets; use the key-rotation procedure (see
*Rotating the Encryption Key* under Updating) to move to an explicit key.

Notes and limits: reassigning a populated category prompts to move its
existing objects — accepting copies everything to the new backend, flips the
category, then sweeps any writes that raced the copy; source objects are kept
(not deleted) and reported as reclaimable (count + size) to reclaim manually;
declining routes only new writes to the new backend, leaving old objects in
place as before. Only one storage job (a mirror sync or a category migration)
runs at a time, cancelling before the flip is always safe, and a failed copy
never flips the category; media categories on S3 work but every served byte
proxies through the server — the proxy answers conditional GETs (ETag /
Last-Modified) and a single `Range` request, while a multi-range request is
answered with the full object; AWS buckets
with Object-Lock or checksum-requiring policies
reject the server's uploads; self-hosted endpoints (MinIO/Garage) should be
addressed by IP or `localhost` unless configured for virtual-hosted buckets.
The legacy `/uploads/photos` directory from older TREK versions is still
served and included in backups, but it is not a configurable category.
Running the storage contract suite against a live MinIO/AIStor is a
license-gated procedure — CI runs it automatically for same-repo pull
requests (fork PRs skip it, since they have no access to the license
secret); to run it yourself locally, see `docker-compose.minio-test.yml`'s
header for the manual procedure.

### Provisioning at first boot (seed file)

For infrastructure-as-code setups, mount a `storage-config.json` into the
data directory — it is imported **once**, on the first boot that has no
stored storage configuration, and loudly ignored afterwards:

```jsonc
// storage-config.json — secrets may be plaintext (encrypted on import)
// or already-encrypted enc:v1: values.
{
  "backends": [
    { "name": "off-site", "type": "s3", "options": {
      "endpoint": "https://s3.example.com", "bucket": "trek",
      "accessKeyId": "…", "secretAccessKey": "…" } },
    { "name": "backups-mirror", "type": "mirror", "options": {
      "primary": "backups-local", "replicas": ["off-site"] } }
  ],
  "categories": { "backups": "backups-mirror" }
}
```

(The panel presents this exact setup as **Mirror targets** on `backups-local`.)

```yaml
# docker-compose: add under the trek service's volumes
      - ./storage-config.json:/app/data/storage-config.json:ro
```

An invalid seed file aborts boot with the exact validation error — an
actively-provisioning operator sees the problem instead of a silent default.

### Recovery and restore

To reset storage configuration to the built-in defaults (or to re-import a
seed file): stop the server, run
`sqlite3 data/travel.db "DELETE FROM app_settings WHERE key LIKE 'storage.%';"`,
and start it again.

Backups include the storage configuration (it lives in the database). If your
only backup sits on S3 and the credentials for it sit inside that backup:
start a fresh instance, enter the S3 credentials in **Admin → Storage** (or
mount a seed file), then restore the backup from the Backup panel.

## Data & Backups

- **Database** — SQLite, stored in `./data/travel.db`
- **Uploads** — stored in `./uploads/` by default; every content category can be reassigned to another backend in **Admin → Storage**
- **Logs** — `./data/logs/trek.log` (auto-rotated)
- **Backups** — create and restore via Admin Panel
- **Auto-Backups** — configurable schedule and retention in Admin Panel

<br />

## Data sources

The Atlas map's country and sub-national (province/county) boundaries come from
[**geoBoundaries**](https://www.geoboundaries.org/) (Runfola et al., 2020), licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [NOTICE.md](NOTICE.md)
for full third-party attributions.

## License

TREK is [AGPL v3](LICENSE). Self-host freely for personal or internal company use. If you modify and offer TREK as a network service to third parties, your modifications must be open-sourced under the same licence.
