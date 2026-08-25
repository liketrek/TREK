# FAQ

## Do I need a Google Maps API key?

No. When no Google Maps key is configured, TREK automatically falls back to OpenStreetMap (Nominatim) for place search — no API key or account required. If you want richer place data (photos, ratings, opening hours), an admin can optionally add a Google Maps key in **Admin Panel → Settings** — see [Admin Panel Overview](Admin-Panel-Overview). A key saved there applies instance-wide to every member; there is no per-user field for it in the UI.

## Can I use TREK offline?

Yes. TREK is a Progressive Web App. After your first visit, the service worker (powered by Workbox) caches map tiles (Carto, OpenStreetMap, Mapbox GL and OpenFreeMap), uploaded covers and avatars, and every page of the app. Subsequent visits work without a network connection for already-cached content. Trip data does not come from that cache: it is stored per user in IndexedDB and read back through TREK's own offline layer, with writes queued and replayed once you reconnect. See [Offline Mode and PWA](Offline-Mode-and-PWA) for installation instructions.

> **Note:** API responses are **never** stored in the service-worker cache. Workbox keys its entries by URL and cannot vary them on the session cookie, so caching them would mean one account's data could be served to the next on a shared device.

## How many MCP tokens can I create?

Each user can create up to **10 static API tokens**. Static tokens are deprecated — migrate to OAuth 2.1 when possible.

For OAuth 2.1, each user can register up to **10 OAuth clients**. The default limit for concurrent MCP sessions is **20 per user** (configurable via `MCP_MAX_SESSION_PER_USER`). See [MCP Setup](MCP-Setup).

> **Admin:** MCP must be enabled in Admin Panel > Addons before any user can access it.

## Where is my data stored?

| Type | Path |
|------|------|
| Database | `./data/travel.db` (SQLite) |
| Uploads | `./uploads/` |
| Logs | `./data/logs/trek.log` (auto-rotated) |
| Backups | `./data/backups/` |

When running in Docker, mount `./data` and `./uploads` as volumes so your data survives container updates. See [Install: Docker Compose](Install-Docker-Compose).

## How do I update TREK?

Pull the new image and recreate the container. Your data is in the mounted volumes and is never modified by the update process. See [Updating](Updating) for the exact commands.

## Can I restrict who can register?

Yes. An admin can disable open registration so that new accounts can only be created via invite links. See [Admin: Users and Invites](Admin-Users-and-Invites).

## Does TREK support single sign-on?

Yes, via OpenID Connect (OIDC). Compatible providers include Google, Authentik, Keycloak, and any standard OIDC-compliant IdP. Set `OIDC_ONLY=true` to disable password login entirely. See [OIDC SSO](OIDC-SSO).

## Can TREK open straight on my trip instead of the dashboard?

Yes. In Settings → General → **Startup**, set the start page to **Active trip** and pick the tab it should open on — Costs, for instance, if you mostly add expenses while travelling. Opening TREK (including the installed PWA or a home-screen shortcut) then goes there in one step instead of three.

If you would rather build the shortcut yourself, or point a wrapper app at it, any trip URL takes a tab directly: `/trips/42?tab=finanzplan`. See [Display-Settings](Display-Settings) for the full list of tab ids.
