# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent npm packages — no root `package.json`. Always `cd` into the right one:

- `server/` — Express + TypeScript API (run via `tsx`, no build step). Serves `/api`, `/ws`, `/mcp`, OAuth 2.1 endpoints, and the built client in production.
- `client/` — React 18 + Vite + TypeScript SPA (PWA).
- `charts/` — Helm chart. `wiki/` — user docs (GitHub wiki mirror). `scripts/` — ad-hoc perf profilers.

The Dockerfile builds the client, then copies `client/dist` into `server/public`; in production the server statically serves it and SPA-falls-back to `index.html`.

## Common commands

All commands run from `server/` or `client/`.

### Server (`cd server`)
- `npm run dev` — tsx watch mode. Default port `3001`.
- `npm start` — run with tsx (no compile; this is also what the Dockerfile does).
- `npm test` / `npm run test:unit` / `npm run test:integration` / `npm run test:ws` / `npm run test:coverage`.
- Run a single test file: `npx vitest run tests/integration/auth.test.ts`.
- Reset the local admin: `node reset-admin.js` (creates/resets `admin@admin.com` / `admin123`).
- Rotate encryption key against a running DB: `node --import tsx scripts/migrate-encryption.ts`.

### Client (`cd client`)
- `npm run dev` — Vite on `5173`, proxies `/api`, `/uploads`, `/ws`, `/mcp` → `localhost:3001`.
- `npm run build` — runs `scripts/generate-icons.mjs` then `vite build`.
- `npm test` / `npm run test:unit` / `npm run test:integration` / `npm run test:coverage`.
- Run a single test file: `npx vitest run src/pages/DashboardPage.test.tsx`.

### Local dev loop
Start the server (`cd server && npm run dev`) and the client (`cd client && npm run dev`) in separate shells; open `http://localhost:5173`.

## Architecture

### Data & auth
- **SQLite via `better-sqlite3`**, file at `server/data/travel.db`, WAL mode. Schema lives in `server/src/db/schema.ts`; additive changes go in the `migrations` array in `server/src/db/migrations.ts` (tracked by `schema_version` table). `runSeeds` (`server/src/db/seeds.ts`) seeds addons/categories on boot. `server/src/db/database.ts` exports a `Proxy` around the live connection so `reinitialize()` can swap it during restore without consumers holding a stale handle.
- **At-rest encryption** of API keys, MFA secrets, SMTP/OIDC creds uses `ENCRYPTION_KEY` (see `server/src/config.ts` for fallback resolution: env → `data/.encryption_key` → legacy `data/.jwt_secret` → auto-generate). JWT signing uses a separate, server-managed secret in `data/.jwt_secret` — never pass it via env.
- **Auth surfaces** (all go through `verifyJwtAndLoadUser` in `server/src/middleware/auth.ts` so the `password_version` gate is never bypassed):
  1. Web session: httpOnly `trek_session` JWT cookie.
  2. MCP: Bearer tokens — `trekoa_…` (OAuth 2.1, scoped, audience-checked), `trek_…` (legacy static tokens, full access + deprecation notice), or a raw web JWT.
  3. Share tokens: trip-scoped, used for public trip pages and gated photo URLs.
- **OIDC / OAuth 2.1** endpoints are split in `server/src/app.ts`: RFC 8414/9728 `.well-known/*` discovery docs mount with `cors: *` *before* the main CORS middleware. OAuth client endpoints are in `routes/oauth.ts` (public + API routers); OIDC login in `routes/oidc.ts`.

### Server structure (`server/src`)
- `app.ts` — `createApp()` wires Helmet CSP (includes allowed external APIs like Nominatim, Mapbox, Open-Meteo), CORS, logging with sensitive-field redaction, static uploads with auth rules (avatars/covers/journey: unauth UUID-named; `/uploads/photos/:filename`: JWT or matching share token; `/uploads/files`: blocked — served via `/api/trips/:tripId/files`), and all `/api/*` routes. Addon routes (`/api/addons/vacay`, `/api/addons/atlas`, `/api/journeys`, etc.) check `isAddonEnabled` at request time.
- `index.ts` — bootstraps upload dirs, calls `createApp()`, starts cron jobs via `scheduler.ts` (trip reminders, todo reminders, version check, demo reset, idempotency cleanup, photo cache cleanup), starts ephemeral-token cleanup, and attaches the WebSocket server.
- `websocket.ts` — a single `ws` server on `/ws`. Clients authenticate with a short-lived *ephemeral token* (obtained from `POST /api/auth/ws-token`), never the raw JWT. Channels are rooms keyed by `tripId`; per-socket rate limit 30 msgs / 10 s; `canAccessTrip` gates join.
- `routes/` — thin Express routers. Business logic lives in `services/`, and middleware (JWT auth, trip-access enforcement, MFA policy, idempotency, Zod validation) lives in `middleware/`.
- `mcp/` — MCP server per user session. `index.ts` handles the `/mcp` HTTP endpoint (rate limits, session cap, OAuth audience check). `tools/` + `tools.ts` register tool handlers scoped by OAuth scopes; `resources.ts` registers readable resources. `scopes.ts` defines the 27 scopes / 13 groups. Sessions live in `sessionManager.ts` — invalidated on addon toggles so tool lists stay fresh.
- `addons.ts` — the `ADDON_IDS` const. Every feature-flagged addon gate in the codebase must use these IDs.

### Client structure (`client/src`)
- `main.tsx` → `App.tsx` — `BrowserRouter` with `ProtectedRoute`/`AdminRoute` wrappers that enforce auth, global MFA policy, and per-route addon gates (`addonId` → `addonStore.isEnabled`).
- **Three-layer state per trip:**
  1. **Zustand** (`store/tripStore.ts` + `store/slices/*`) — in-memory, what the UI reads.
  2. **Dexie / IndexedDB** (`db/offlineDb.ts`) — offline cache. Trips with `end_date >= today` (or null) are cached; `end_date < today − 7d` evicts.
  3. **REST + WebSocket** — server is source of truth.
- **Sync flow** (`sync/tripSyncManager.ts`): on login / dashboard load / WS reconnect, fetch the trip bundle, write through to Dexie, then prefetch map tiles via `tilePrefetcher.ts`.
- **Offline writes** (`sync/mutationQueue.ts`): mutations are enqueued with a UUID (used as `X-Idempotency-Key`), repos write optimistically to Dexie with a temporary negative id, and `flush()` replays them when online. Temp ids get rewritten to server ids on flush.
- **Realtime** (`sync/syncTriggers.ts` + `store/slices/remoteEventHandler.ts`): each WS event mutates the Zustand store *and* write-throughs to Dexie. When extending, add the event to both places or offline users see stale data.
- `repo/*` — thin REST wrappers used by the stores/slices. `api/client.ts` is the axios instance with auth/retry.
- `components/` is organized by feature (Planner, Budget, Packing, Journey, Atlas, Vacay, Collab, …) mirroring the addon taxonomy.

### Addons model
Features are addons, toggled per-instance in the Admin panel. IDs in `server/src/addons.ts`; server gates with `isAddonEnabled(ADDON_IDS.X)` in route middleware or MCP tool registration; client gates with `addonStore.isEnabled(id)` in routes and UI. When adding a feature, wire **both** sides plus an MCP scope if it exposes data.

## Testing notes
- Server tests use `vitest` with `pool: 'forks'`. Integration tests build an in-memory SQLite via `tests/helpers/test-db.ts` (`createTestDb` + `buildDbMock`) and `vi.mock('../../src/db/database', …)` — see `tests/integration/auth.test.ts` for the canonical pattern (the mocks must be hoisted via `vi.hoisted`). `tests/setup.ts` sets a fixed `ENCRYPTION_KEY` before any import.
- Client tests use jsdom via a custom environment (`tests/environment/jsdom-native-abort.ts`), MSW for HTTP, `fake-indexeddb` for Dexie. WebSocket module is mocked globally in `tests/setup.ts` so stores never open real connections. Colocated `*.test.tsx` files live next to their component.
- CI (`.github/workflows/test.yml`) runs both suites with coverage on PRs. The project maintains 80%+ coverage (per CONTRIBUTING.md).

## Project conventions
- **PRs target `dev`, never `main`.** CI auto-closes wrong-targeted PRs.
- Conventional commits (`fix(scope): …`, `feat(scope): …`) — enforced socially, not by tooling.
- **No breaking changes**; **no reformats / linter-config changes** in feature PRs.
- Don't add new migrations in the middle of the array — append to the end of `migrations` in `server/src/db/migrations.ts` so `schema_version` stays monotonic.
- Secrets in request bodies/queries are redacted by the request logger via the `SENSITIVE_KEYS` set in `app.ts` — add any new secret field name there.
- Node 22 is required (Dockerfile, CI, and `better-sqlite3` / `sharp` native builds).
