<img width="5292" height="1404" alt="Release 2 9 0 (2)" src="https://github.com/user-attachments/assets/6ff67226-3535-444e-991f-0bc0352e22e7" />

# TREK 3.0.0

<video src="https://github.com/mauriceboe/trek-media/raw/main/.github/assets/TREK1.mp4" controls width="100%"></video>

> **The biggest TREK release to date.** A new Journey addon turns your trips into rich travel journals. Mapbox GL joins Leaflet as a first-class renderer. MCP gets a full OAuth 2.1 authorization server. Offline-first PWA, self-service password reset, and a dashboard redesigned from the ground up. Fifteen languages, top to bottom.

---

## Breaking Changes

### Photos moved from Trip Planner to Journey

In previous versions, Immich and Synology Photos were integrated directly into the Trip Planner via a "Photos" tab. **This tab has been removed.** Photos are now part of the new **Journey addon**, which is purpose-built for documenting your travels with stories, photos, and maps.

**What this means for you:**
- **No photos are lost.** The previous integration was read-only — TREK never uploaded to or deleted from your Immich/Synology library. Your photos remain untouched in your photo provider.
- **Previously linked trip photos are no longer displayed in the Trip Planner.** To view and organize your travel photos, enable the Journey addon (Settings > Addons) and create a Journey linked to your trip.
- **Journey brings a much richer photo experience:** upload photos directly to TREK, browse and import from Immich/Synology with duplicate detection, reorder photos, view EXIF metadata, and export everything as a PDF photo book.

### New Immich API Key Permissions Required

Journey introduces **photo upload sync** — when you upload a photo to a Journey entry, TREK can optionally sync it to your Immich library. This requires an additional Immich API permission that was not needed before.

**Previous versions required:**
| Permission | Used for |
|---|---|
| `user.read` | Connection test |
| `asset.read` | Browse photos by date, search |
| `asset.view` | Stream thumbnails |
| `asset.download` | Stream originals |
| `album.read` | List and browse albums |
| `timeline.read` | Browse timeline buckets |

**New in 3.0.0 — additionally required:**
| Permission | Used for |
|---|---|
| `asset.upload` | Sync uploaded Journey photos to Immich |

> **How to update your Immich API key:** Go to your Immich instance > User Settings > API Keys. Edit your existing TREK key (or create a new one) and ensure `asset.upload` is enabled in addition to the existing permissions. If you don't plan to use Journey's upload sync, the old key will continue to work — the upload simply won't sync to Immich.

**No changes needed for Synology Photos** — Synology uses session-based authentication which inherits the user's full permissions.

### OIDC_ONLY deprecated

The `OIDC_ONLY` environment variable is deprecated. Replace with `DISABLE_LOCAL_LOGIN=true` + `DISABLE_LOCAL_REGISTRATION=true` for equivalent behavior. The old variable still works but will be removed in a future release.

---

<img width="5292" height="1404" alt="Release 2 9 0 (3)" src="https://github.com/user-attachments/assets/76976c02-dd81-49ab-83f5-e2221d6b018b" />

## Journey Addon — Travel Journal

The headline feature of 3.0.0. Journey is a new global addon that transforms your trips into magazine-style travel stories.

### Core
- **5-table schema** — journeys, entries, photos, trips, contributors with full relational integrity
- **Trip-to-Journey sync engine** — link one or more trips to a journey; skeleton entries and photos are synced automatically
- **Timeline, Gallery, and Map views** — browse entries chronologically, as a photo grid, or on an interactive map with SVG pin markers
- **Entry editor** — markdown toolbar, custom date picker, location search (Nominatim/Google Maps), mood (Amazing/Good/Neutral/Rough), weather (Sunny to Snowy), and Pros & Cons sections
- **Entry reorder** — move-up / move-down arrows on each entry (desktop), skipped on skeleton suggestions
- **Hide skeletons toggle** — per-contributor setting to focus on the written entries only

### Photos
- **Immich & Synology browser** — browse by trip dates, custom range, or album with duplicate detection
- **Photo upload** — direct upload with drag-and-drop, reorder (Make 1st), and delete
- **EXIF metadata** — displayed in lightbox for Immich photos
- **Thumbnail to original fallback** — seamless resolution upgrade everywhere
- **HEIC rendering fix** — serve fullsize thumbnail for original to fix HEIC rendering on non-Safari browsers
- **Contributor photo access** — invited contributors can view all journey photos even without their own Immich/Synology connection (owner credentials are used for the proxy)
- **Safari gallery picker fix** — repaired grid layout collapse on Safari (#717)

### Sharing & Export
- **Public share links** — token-based access with language picker, no login required
- **Public photo proxy** — validates share token instead of auth for photo streaming
- **Thumbnail size in public gallery** — grid loads thumbnails instead of originals, lightbox keeps originals (cuts bandwidth on shared links significantly)
- **PDF photo book export** — Polarsteps-inspired layout with cover, day chapters, photo grids, and stories

### Collaboration
- **Contributors** — invite users as editors or viewers
- **Trip linking/unlinking** — manage synced trips from Journey Settings and Desktop Sidebar
- **Cover image** — upload or pick from journey photos

### Frontend
- **JourneyPage** — frontpage with hero card, active journey stats, trip suggestions ("Trip just ended — turn it into a Journey")
- **JourneyDetailPage** — full timeline/gallery/map with inline entry editing
- **JourneyPublicPage** — public share view with language picker and read-only timeline

---

## Mapbox GL as a First-Class Renderer

Leaflet gets a sibling. Users can now switch the trip planner map to **Mapbox GL JS** for a proper 3D globe, terrain, and 3D buildings.

- **Settings toggle** — choose between Leaflet and Mapbox GL in Settings > Map
- **Globe projection** — smooth rotating globe when zoomed out, mercator when zoomed in
- **3D terrain and buildings** — enabled on Standard and Satellite styles, with custom 3D buildings in dark/light mode
- **Trip route, GPX geometries, place markers** — full feature parity with the Leaflet renderer
- **Transport reservations overlay** — great-circle arcs for flights/cruises, straight lines for trains/cars, clickable endpoint badges with IATA codes, rotating mid-arc stats label for flights. Honours the per-booking "show route" toggle in DayPlanSidebar
- **Auto-fit on load** — planner map zooms to the trip's places on initial render
- **Booking route label toggle** — separate setting to hide IATA labels on endpoint markers
- **Infrastructure** — WebAssembly allowed in CSP for Mapbox GL's 3D engine, PWA precache limit raised so the mapbox-gl bundle builds, Mapbox endpoints allowed in `connect-src` / `img-src`

---

## MCP: OAuth 2.1 & Granular Scopes

MCP authentication has been completely rebuilt around the OAuth 2.1 specification.

- **OAuth 2.1 authorization server** — full PKCE flow with authorization codes, access tokens, refresh tokens, and token rotation with replay detection
- **Granular scopes** — 24 scopes across 11 groups (trips, places, atlas, packing, todos, budget, reservations, collab, notifications, vacay, geo/weather) with per-scope read/write/delete control
- **Dynamic Client Registration (DCR)** — RFC 7591 endpoint at `POST /oauth/register`, with strict redirect_uri validation (HTTPS / loopback / reverse-DNS private-use schemes only; rejects `javascript:` / `data:` / `file:` / etc.)
- **RFC 9728 Protected Resource Metadata** — `/.well-known/oauth-protected-resource` exposes the MCP endpoint's auth requirements for client auto-discovery
- **RFC 8707 audience binding** — tokens are audience-bound to `<app_url>/mcp` by default and validated on every MCP request
- **Consent screen** — user-facing scope selection with grouped permission display
- **Admin panel** — OAuth sessions management in MCP Access panel with collapsible scope lists
- **Per-client rate limiting** — configurable rate limits per OAuth client
- **Addon gating** — MCP tools are only registered when their corresponding addon is enabled
- **Compound tools** — single-call multi-step workflows (e.g. create day with places in one tool call, fetch full trip context) to reduce MCP round-trips
- **Surface alignment** — MCP tool schemas and responses kept in sync with the current app state (fewer drifted fields, correct enum sets)
- **Static token deprecation** — existing MCP tokens still work but surface deprecation notices; migration path to OAuth is documented
- **Collab sub-feature gating** — MCP tools for chat/notes/polls respect the admin-level collab sub-feature toggles

---

## Self-Service Password Reset

Users can now reset their own password without admin intervention.

- **Email-based flow** — `/forgot-password` issues a single-use reset token delivered via SMTP (or logged to the server console if SMTP is not configured)
- **MFA-aware** — if the user has MFA enabled, the reset endpoint additionally verifies a TOTP code or backup code before rotating the password
- **Session invalidation** — resetting the password bumps `users.password_version`, which kicks every existing JWT, MCP static token, and OAuth bearer token for that user out in one shot
- **Server-side URL building** — the reset link is built from `APP_URL` / `ALLOWED_ORIGINS`, not from request headers, so a spoofed `Host` / `Origin` cannot redirect the link to an attacker-controlled domain
- **Rate limiting + audit** — per-IP rate limit on `/forgot-password`, all requests audited (including "no such user" so abuse is visible)

---

## Dashboard Redesign

The dashboard has been rebuilt with a mobile-first design language.

### Mobile
- **Greeting header** — "Good morning, {username}" with notification bell and avatar
- **Spotlight hero card** — the next upcoming or ongoing trip as a full-width hero with cover image, progress bar (for live trips), stats grid, and frosted-glass action buttons
- **Quick Actions** — New Trip, Currency Converter, Timezone as icon cards
- **Trip cards** — cover image with title overlay, status badge (In X days / Starts today / Ongoing / Completed), bottom stats (starts, duration, places, buddies)

### Desktop
- **Unified header toolbar** — the dashboard, planner, vacay, and journey now share the same toolbar style
- **Unified card design** — desktop grid cards now match the mobile card style (cover + title overlay + stats)
- **Hero card** — SpotlightCard with progress bar for ongoing trips, countdown for upcoming, stats grid
- **Hover actions** — edit/copy/archive/delete buttons appear on hover as frosted-glass icons
- **Status badges** — CircleCheck icon for completed trips, Clock for upcoming, pulsing dot for ongoing

### Both
- **BottomNav profile sheet** — slide-up sheet with user info, settings, admin, and logout
- **Dark mode** — full dark mode support across all new components
- **Shared PageSidebar** — Settings and Admin pages share a single sidebar component for layout consistency

---

## PWA Offline Mode

TREK now works offline as a Progressive Web App with full data synchronization.

- **IndexedDB (Dexie) storage** — trips, places, assignments, categories, tags, accommodations, reservations, budget items, packing items, files, and trip members cached locally
- **Offline mutation queue** — changes made offline are queued with monotonic timestamps and replayed on reconnect (FIFO)
- **Offline dashboard** — trip list loaded from Dexie when network is unavailable
- **Offline trip planner** — full planner functionality with cached data
- **Repo layer** — all data access routed through repository layer that falls back to offline storage
- **Offline banner** — visible indicator with safe-area-inset support for iOS PWA
- **Idempotency keys** — prevents duplicate mutations on replay, scoped by `(key, user_id, method, path)` so the same key on different endpoints can't leak cached bodies
- **Offline document downloads** — document downloads work from the PWA cache when the network is unavailable

---

## Transport Reservations: Multi-Day + Map Visualization

- **Multi-day transport reservations** — flights, trains, cruises, car rentals can span multiple days with a dedicated modal and automatic route segmentation across the affected days (#384, #587)
- **Map visualization** — transport endpoints render on both Leaflet and Mapbox GL maps as clickable badges with IATA codes, great-circle arcs for flights/cruises, straight lines for trains/cars, and a rotating mid-arc stats label (IATA → IATA · distance · duration) on flights
- **Per-booking route toggle** — each booking in DayPlanSidebar has a "Show booking routes" button; connections only render when toggled on
- **Check-in time ranges** — hotel bookings now support a check-in window (e.g. "15:00 -- 22:00") with a new `check_in_end` field (#366)
- **Cascaded delete** — deleting a reservation now cleans up related budget items, file links, and trip_items

---

## Reservations Redesign

The reservations panel has been completely redesigned with a modern, unified layout.

- **Unified toolbar** — title, type filter pills with count badges, and add button in one row with muted background
- **Type filters** — multi-select filter buttons (Flight, Hotel, Restaurant, etc.) with per-type count badges, persisted in sessionStorage
- **Responsive grid** — auto-fill layout with max 3 columns that fills full width
- **Card redesign** — status + type badge in header, labeled fields in rounded boxes, hover shadow
- **Mobile responsive** — filters hidden on mobile, booking code on separate row, weekday hidden in dates, reduced padding

---

## Apple Wallet pkpass Support

- **.pkpass MIME type** — server correctly serves `application/vnd.apple.pkpass` with the right Content-Type
- **Upload + download** — .pkpass files can be attached to bookings or places and opened directly in Apple Wallet on iOS

---

## Todo Due-Date Reminders

- **Scheduler** — a new background scheduler scans todos with upcoming due dates and sends one reminder per item (default lead: 3 days)
- **No spam** — `todo_items.reminded_at` prevents re-sending a reminder for the same item on subsequent scheduler runs
- **Notification channel aware** — reminders respect the user's notification channel preferences (email, webhook, ntfy)

---

## Collab Sub-Feature Toggles

Individual collab sections can now be toggled on/off from the admin addons page (#604).

- **Admin UI** — sub-toggles for Chat, Notes, Polls, and What's Next under the Collab addon, with icons matching the collab panel tabs
- **Dynamic desktop layout** — Chat always stays at fixed 380px width; remaining active panels share space equally
- **Mobile** — disabled tabs are hidden from the tab bar
- **API** — GET/PUT /admin/collab-features endpoints stored in app_settings

---

## Place Import: KMZ/KML + Naver Maps + Selective GPX

Three ways to import places into your trips.

### KMZ/KML Import
- **Unified file import modal** — drag-and-drop or file picker for KML, KMZ, and GPX files
- **KMZ unpacking** — extracts KML from ZIP archive with 50MB decompressed size limit
- **Folder-to-category mapping** — KML folders are automatically matched to TREK categories
- **Place deduplication** — skips places that already exist in the trip (by name + coordinates)

### Naver Maps List Import
- **Always enabled** — no longer requires addon toggle, available alongside Google Maps list import
- **Shortlink resolution** — resolves naver.me shortlinks to full list URLs
- **Pagination support** — handles large Naver Maps lists with automatic pagination

### Selective GPX/KML Element Import
- **Pick what to import** — import modal now lets you choose individual waypoints / tracks / folders instead of an all-or-nothing dump
- **Performance** — larger files (thousands of points) parse and render without freezing the UI

---

## Search Autocomplete

- **Real-time suggestions** — autocomplete suggestions appear as you type in the place search field
- **Google Places API** — primary autocomplete provider with location bias
- **Nominatim fallback** — free fallback when Google API key is not configured
- **Bounding box bias** — search results biased to the current map viewport

---

## ntfy Notification Channel

- **ntfy as first-class channel** — push notifications via any ntfy server (self-hosted or ntfy.sh)
- **Admin configuration** — server URL and topic configuration in admin panel with clear token button
- **Per-user opt-in** — users can enable/disable ntfy in their notification preferences
- **Full i18n** — ntfy strings translated in all 15 languages

---

## Login & Language

- **Language dropdown on login page** — users can select their preferred language before logging in
- **Browser auto-detection** — language is automatically detected from browser settings on first visit
- **DEFAULT_LANGUAGE env var** — configurable default language for the instance, documented across all deployment configs (Docker, Helm, Synology)

---

## Granular Auth Toggles

- **OIDC_ONLY replaced** — split into `DISABLE_LOCAL_LOGIN`, `DISABLE_LOCAL_REGISTRATION`, and `DISABLE_PASSWORD_CHANGE` for fine-grained control over authentication methods
- Allows mixed setups (e.g., OIDC + local admin account, or OIDC-only with no local registration)

---

## Synology Photos: OTP, SSL Skip & Session Management

- **OTP support** — one-time password field for 2FA-enabled Synology NAS
- **Skip SSL verification** — toggle for self-signed certificates
- **Device ID persistence** — prevents repeated 2FA prompts
- **Session-cleared notification** — routed through unified notification system
- **Provider URL hint** — contextual help text for Synology URL format
- **Thumbnail size bump** — default thumbnail size raised from `sm` (240 px) to `m` (320 px) so grids no longer look pixelated on retina
- **Passphrase support** — shared-album links with passphrases work from the browse UI (#689)

---

## Atlas Improvements

- **Scoped region matching** — region name matching is now scoped by country to prevent cross-country false matches
- **Expanded country lookup tables** — more countries and regions recognized correctly, including A3 fallback for invalid ISO_A2 codes
- **Nominatim rate limiting** — shared throttle prevents 429 errors, background region fill, fetch timeout
- **Stadia Maps fix** — resolved 401 errors on journey and atlas maps

---

## i18n: Full 15-Language Coverage

- **Indonesian added** — complete translation with full parity to English, bringing the total to 15 languages (EN, DE, FR, ES, IT, NL, PL, RU, ZH, ZH-TW, BR, CS, HU, AR, ID)
- **Comprehensive audit** — every key translated natively, no English fallbacks
- **OAuth scope labels** — all 24 scopes have localized names and descriptions
- **Journey addon** — complete coverage for all journal, editor, sharing, and PDF export strings
- **Mapbox GL settings** — localized labels for renderer toggle, style picker, 3D / quality switches
- **Ellipsis standardization** — all ellipsis characters normalized to three dots (...)

---

## Vacay Improvements

- **Trip indicator dots** — small blue dots on calendar days where trips are scheduled
- **Configurable week start** — choose Monday or Sunday as first day of the week (#224)
- **Holiday overlap** — vacations can now be placed on public holidays
- **Today marker** — visual indicator for the current day in the calendar
- **Unified toolbar** — same header style as planner/dashboard/journey
- **Bottom padding fix** — toolbar no longer overlaps the last row (#533)

---

## iCal Export Improvements

- **Day activities and notes** — iCal export now includes daily activities and notes, not just the trip dates (#375)

---

## Budget Improvements

- **Drag-and-drop reorder** — budget categories and individual items can be reordered via drag-and-drop (#479)
- **Category legend redesign** — prevents overflow on small screens (#564)
- **Comma decimal support** — pasting numbers with comma separators works correctly
- **Table alignment fix** — budget data rows and the "New Entry" row now share column widths (#759)

---

## Packing List Improvements

- **Bulk import + template apply without full reload** — new items appear in place instead of triggering the trip loading screen (#760)
- **Reservation link cleanup** — packing items linked to deleted reservations stay in the list without the dangling reference
- **Bag tracking** — keep track of which items live in which bag, with optional weight tracking and per-bag totals

---

## Planner & UX Improvements

- **Emil-style polish pass** — consistent transitions/animations across cards, hover states, and drawer sheets; shared components for toolbars and section headers
- **Planner drag-and-drop jank fix** — dragging places across days is smooth again on long trips
- **Unified toolbar header** — dashboard, planner, vacay, and journey share a single toolbar style for visual consistency
- **Places sidebar polish** — filter counts, compact select UI, tooltip component, "No Category" / "Uncategorized" filter (#607)
- **Dayplan toolbar polish** — cleaner alignment, weather archive fallback for past trips
- **Unplanned filter sync** — unplanned filter properly syncs with map markers (#385)
- **Place notes** — notes textarea in place edit form with proper display in inspector (#596)
- **Place deduplication** — Google Maps list re-import skips existing places (#543)
- **File download button** — all file views now include a download button
- **Note modal** — no longer closes on outside click (#480)
- **Google Maps links** — use place name + google_place_id for accurate links (#554)
- **Packing list menu** — no longer cut off by overflow (#557)
- **Trip date change** — preserving day content when date range changes
- **PDF export** — render restaurant, event, tour, and other reservation types

---

## Admin Panel Improvements

- **Collab sub-feature toggles** — individual toggles for Chat, Notes, Polls, What's Next
- **Photo provider icons** — Immich and Synology Photos SVG brand icons in addon manager
- **Bag tracking icon** — Luggage icon for the bag tracking sub-toggle
- **Naver List Import** — now always enabled, removed from addon toggles
- **Shared PageSidebar** — admin pages use the same sidebar layout as Settings

---

## Mobile Improvements

- **Bottom nav fix** — prevent clipping of scrollable content and dialogs
- **Journey mobile** — compact add-entry button, scrollable settings dialog, iOS PWA fixes, drop hero / inline tab-bar, eager map tiles, trimmed picker labels
- **Dashboard mobile** — spotlight trip in hero, smaller badges, check icon for completed
- **Bottom nav dark mode** — consistent dark mode styling
- **Safe area support** — proper insets for iOS PWA

---

## Documentation & Wiki

- **Full GitHub Wiki** — 74 pages covering setup, deployment, addon docs, troubleshooting, API reference, and MCP
- **CI sync workflow** — `./wiki/**` in the main repo is auto-synced to the GitHub Wiki on push to `main`
- **README redesign** — Apple-style hero with animated video, feature tiles, and a screenshot gallery; hero video hosted externally so the repo stays lightweight
- **MCP compound tools doc** — `MCP.md` documents the compound / multi-step tools

---

## Security

Fifth-pass internal audit. Critical + High + Medium findings addressed in one bundled PR:

- **JWT password_version gate** — a single `verifyJwtAndLoadUser` helper is now used by every auth surface (web session, MCP bearer, file download token, photo route, MFA policy). A password reset bumps `password_version` and invalidates every outstanding session/token for the user in one shot.
- **MFA policy via cookie** — `require_mfa` now applies to cookie-authenticated SPA sessions too (previously only the `Authorization` header was checked, so the whole SPA bypassed it).
- **OIDC id_token verification** — full JWKS-based signature verification (iss, aud, exp, nbf) plus `userinfo.sub == id_token.sub` cross-check. `kid` match is strict — no fallback to an arbitrary key.
- **OIDC invite redemption** — invite-token increment and user INSERT run in a single `db.transaction`; concurrent callbacks cannot double-redeem a single-use invite.
- **OAuth 2.1 DCR** — redirect_uri allowlist rejects `javascript:` / `data:` / `vbscript:` / `file:` / `blob:` / `about:` / `chrome:` and requires private-use schemes to be reverse-DNS (RFC 8252 §7.1).
- **OAuth audience binding** — `audience` defaults to the MCP endpoint when no `resource` parameter is sent, so new tokens always carry the correct audience claim.
- **HSTS on in production** — `NODE_ENV=production` is enough to enable HSTS (previously required `FORCE_HTTPS=true`). `includeSubDomains` stays off by default to avoid breaking apex-domain setups; opt in with `HSTS_INCLUDE_SUBDOMAINS=true`.
- **Cookie Secure behind proxies** — `trek_session` Secure flag is now derived from `req.secure` (Express's `trust proxy`-aware field), so instances behind Traefik / Caddy / Cloudflare Tunnel get Secure cookies without `FORCE_HTTPS`.
- **Share-token expiry** — public share tokens default to 90-day TTL. Existing tokens stay NULL (no expiry) so already-distributed links keep working.
- **Photo route scoping** — share tokens can only unlock photos that belong to the same trip as the token.
- **Bcrypt MFA backup codes** — backup codes are now bcrypt-hashed at rest. Legacy SHA-256 codes keep working until the user regenerates.
- **Demo-mode guards** — single `DEMO_EMAILS` registry fixes the drift where `demoUploadBlock` only matched the pre-rename `demo@nomad.app` string.
- **Filesystem safety** — `permanentDeleteFile` / `emptyTrash` / avatar cleanup use async `fs.promises.rm({ force: true })` and only drop the DB row when the on-disk unlink actually succeeded.
- **Idempotency store hardening** — key length capped at 128 chars, response bodies over 256 KiB not cached, primary key widened to `(key, user_id, method, path)` so the same key on a different endpoint does not replay an unrelated response.
- **Permissions cache invalidation** — `restoreFromZip` now drops the permissions cache after a DB swap.
- **Reset-URL source** — password-reset email URL is built from server-side `APP_URL` / `ALLOWED_ORIGINS`, never from request headers.
- **Critical DB indexes** — added `trips(user_id)`, `trips(created_at DESC)`, `photos(day_id/place_id)`, `reservations(day_id)`, `share_tokens(token)` and conditional `day_accommodations` / `notifications` indexes.

Upstream CVEs patched:

- **hono** 4.12.9 to 4.12.12 — directory traversal (CVE-2026-39407, CVE-2026-39408), HTTP response splitting, improper input validation (CVE-2026-39410), IP restriction bypass (CVE-2026-39409)
- **@hono/node-server** 1.19.11 to 1.19.13 — directory traversal (CVE-2026-39406)
- **nodemailer** 8.0.4 to 8.0.5 — CRLF injection

---

## Bug Fixes

- Fixed OIDC-only mode login/logout loop (#491)
- Fixed dayplan duplicate reservation display, date off-by-one, and missing day_id on edit
- Fixed booking date handling and file auth bugs
- Fixed dayplan time-based auto-sort for places and free reorder for untimed
- Fixed streaming response end on client disconnect during asset pipe
- Fixed per-day transport positions for multi-day reservations
- Fixed stale budget category reset when category no longer exists
- Fixed trip redirect to plan tab when active tab addon is disabled
- Fixed reservation price/budget field visibility when budget addon disabled
- Fixed HEIC photo rendering on non-Safari browsers
- Fixed CSP path matching for paths ending in /
- Fixed avatar URLs in notifications, admin panel, and budget
- Fixed budget member avatars lost after updating item fields
- Fixed budget table column alignment broken by `display: flex` on `<td>` (#759)
- Fixed collab notes line break preservation (#608)
- Fixed weather archive date handling for future trips (#599)
- Fixed duplicate skeleton entries for multi-day places (#606)
- Fixed ghost Gallery / `[Trip Photos]` entries in journal timeline and public share (#764)
- Fixed journey reorder arrows rendering on skeleton suggestions (#763)
- Fixed journey map OSM tile warning (#627)
- Fixed journey gallery picker grid collapse on Safari (#717)
- Fixed content divider placement in journal entries (#624)
- Fixed local photos wrong provider label (#625)
- Fixed Synology pagination and album scroll leak (#644)
- Fixed Stadia Maps 401 on journey and atlas maps (#640)
- Fixed Nominatim User-Agent and error diagnostics
- Fixed map tooltips, journey creation, and contributor avatars
- Fixed notifications SMTP error surfacing, webhook button label, backup timestamp (#537)
- Fixed stale accommodation_id on reservation update (#522)
- Fixed hardcoded Immich in toast — now uses provider_name
- Fixed MCP safeBroadcast recursive call bug
- Fixed MCP Zod v4 `z.record()` API compatibility in transport tool schemas
- Fixed Vite module preload polyfill CSP inline script violation
- Fixed PWA offline session redirect and file download auth (#505, #541)
- Fixed `FORCE_HTTPS` redirect applying to `/api/health`, breaking container health-checks
- Fixed journey bugs reported by @roel-de-vries (#722–#736)

---

## Infrastructure

- **Prerelease workflow** — automated prerelease pipeline with major version support, version propagation, and race/orphan tag protection
- **Helm chart** — moved to `charts/trek/`, published via helm-publisher action to `gh-pages`, `appVersion` used as default image tag
- **Docker** — workflow improvements, tag management cleanup, `server/data/airports.json` properly included in image after assets refactor
- **CI** — contributor workflow automation, `npm audit` removal from install steps, manual trigger for prerelease, client test job added alongside server tests with split coverage artifacts

---

## Test Coverage

- **Backend** — expanded to ~87% coverage with comprehensive tests for OAuth, MCP tools, addon gating, services, and session management
- **Frontend** — expanded to ~82% coverage with tests for dashboard, planner, settings, admin panels, and component interactions
- **Journey** — 89.5% new code coverage

---

## Contributors

Thanks to everyone who contributed to this release:

- @mauriceboe
- @jubnl
- @gravitysc
- @luojiyin1987
- @marco783
- @isaiastavares
- @tiquis0290
- @xenocent
- @gfrcsd
- @roel-de-vries

---

## Stats

| Metric | Value |
|--------|-------|
| Commits | 500+ |
| Merged PRs | 130+ |
| Files changed | 700+ |
| Lines added | 120,000+ |
| Contributors | 12+ |

---

## Upgrading

```bash
docker pull mauriceboe/trek:3.0.0
docker compose up -d
```

Migrations run automatically on startup. No manual steps required.

**Checklist:**
1. Update your Immich API key to include `asset.upload` (optional, only needed for Journey upload sync)
2. If using `OIDC_ONLY`, migrate to `DISABLE_LOCAL_LOGIN` + `DISABLE_LOCAL_REGISTRATION`
3. Enable the Journey addon in Settings > Addons to start using the travel journal
4. Try the Mapbox GL renderer in Settings > Map if you want 3D terrain and a proper globe view (requires a free Mapbox access token)
