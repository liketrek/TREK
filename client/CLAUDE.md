# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: the **`@trek/client`** workspace (React 19 + Vite + Zustand + Tailwind PWA). See the repo-root `CLAUDE.md` for the monorepo picture and `server/CLAUDE.md` for the API. This file covers client internals only.

## Commands (run from `client/`)

```bash
npm run dev               # Vite dev server; proxies /api,/ws,/uploads,/oauth → http://localhost:3001
npm run build             # prebuild generates PWA icons, then vite build
npm run typecheck         # tsc --noEmit
npm run lint              # eslint .
npm run lint:pages        # enforce the Page pattern (scripts/check-page-pattern.mjs)
npm run test              # vitest run (tests/** + src/**/*.test.{ts,tsx})
npm run test:unit         # tests/unit
npm run test:integration  # tests/integration + co-located src tests
npm run test:coverage     # v8 coverage
npm run e2e               # Playwright
npm run e2e:report        # open last Playwright report
npm run shots             # Playwright screenshots project (shots:promote to accept)
npm run theme:lint        # theme conformance audit (theme:lint:strict exits 1 on findings; not a CI gate)
```

Single test:

```bash
npx vitest run src/store/slices/budgetSlice.test.ts
npx vitest run -t "optimistically adds the place"
npx vitest watch src/pages/DashboardPage.test.tsx
```

The dev server needs the API on **:3001** — run the server (`npm run dev` from root or `server/`) alongside, or `npm run dev` at the repo root to start both.

## Page pattern (enforced — `lint:pages` will fail otherwise)

Every `src/pages/*Page.tsx` is a thin **wiring container**; all state/effects/handlers live in a co-located **`use<Page>()` hook** under `src/pages/<page>/`. The page body must **not** call `useState/useReducer/useEffect/useLayoutEffect/useMemo/useCallback/useRef` — only context hooks like `useTranslation()` are allowed. Optional `<page>Model.ts` holds pure (React-free) types/helpers. Full spec in `src/pages/PATTERN.md`. When extracting, keep rendered JSX byte-identical — it's a refactor of where logic lives.

## Data flow — offline-first

The layering is **store → repo → api | Dexie**, and writes go through a mutation queue:

- **`src/store/`** — Zustand. `tripStore.ts` is composed from **slices** in `store/slices/` (places, days, packing, todo, budget, reservations, files, assignments, dayNotes). Other stores: auth, settings, addon, permissions, inAppNotification, journey, vacay, systemNotice, collection, saveToCollection, plugin, backgroundTasks. `slices/remoteEventHandler.ts` applies inbound WebSocket events to local state.
- **`src/repo/`** — per-entity repositories that mediate between the network and the offline cache. The pattern: if `navigator.onLine`, call the REST API and upsert into Dexie; if offline, read from Dexie. Always go through a repo for trip data, not the API directly.
- **`src/api/client.ts`** — single Axios instance; request/response types imported from `@trek/shared` Zod schemas. `api/websocket.ts` manages the `/ws` connection.
- **`src/db/offlineDb.ts`** — Dexie/IndexedDB schema: cached entities + the `QueuedMutation` table + `SyncMeta` (per-trip last-sync, prefetched-tiles bbox) + a `BlobCache` for offline file/photo access.
- **`src/sync/`** — `mutationQueue.ts`: offline writes do an optimistic Dexie write (with a temporary **negative id** for creates), then on reconnect `flush()` replays REST with the mutation's UUID as the **`X-Idempotency-Key`** header (matching the server interceptor) and reconciles the Dexie row. `tripSyncManager.ts` / `syncTriggers.ts` / `connectivity.ts` drive reconnection sync; `tilePrefetcher.ts` pre-downloads map tiles.

## Direction (from the 2026 audit)

The offline core is flagship work surrounded by a periphery that ignores it. New code must extend the core's discipline, not the periphery's shortcuts:

- **One data path, no layer skips**: component → feature hook → store/slice → `repo/` → `api/` | Dexie. **Never import `api/client` (or raw fetch/axios) from a component or modal** — especially never *write* from one. A long tail of existing files (~190 at last count) bypasses the layering and no lint ratchet holds the line yet; that's debt, not precedent. New API surface goes in a per-domain `api/<domain>.ts`, not the `client.ts` god module.
- **Offline-first is the product promise, not a trip-planner feature.** New domains should get a repo with both read-through and offline writes (temp id → optimistic Dexie write → idempotent queue entry), extending the existing pattern rather than hand-rolling a variant. If a domain is deliberately online-only, mark it so explicitly.
- **No God components or God hooks.** The page pattern is a floor, not a ceiling — a 900-line `use<Page>()` hook that satisfies the linter is still coupling. Decompose hooks by concern, split renders into memoizable sections, and don't pass 50-field prop bags with inline-arrow callbacks (it defeats `React.memo`).
- **Prefer React 19 idioms over hand-rolled machinery**: `useOptimistic` for optimistic updates, `useActionState`/`useFormStatus` for forms, `use()` + Suspense for read paths, `useSyncExternalStore` for external subscriptions (`hooks/useNetworkMode` is the reference implementation).
- **Optimistic writes must reconcile** — rollback + user-visible toast on failure. No `.catch(() => {})`, no bare `catch {}`; silently keeping state the server rejected is a data-integrity bug.
- **WS remote-event handling must match local slice reducers field-for-field.** If a slice reducer preserves embedded fields on update (e.g. `place_time`/`end_time`), the corresponding `remoteEventHandler` branch must apply the identical merge semantics — divergence is silent, cross-user data loss.
- **Subscribe with selectors** (`useShallow` for multi-field reads); never `const s = useStore()` whole-store; no store getters that allocate per call. Use `getState()` for imperative access in effects.
- **Connectivity**: `isEffectivelyOffline()` is the single source of truth — never read `navigator.onLine` directly in feature code.
- **Rendering security**: never interpolate user content into HTML strings (map tooltips/popups included — build via DOM + `textContent`); untrusted or cross-user markdown gets `rehype-sanitize`; never `rehype-raw` near those surfaces.
- **No `window` CustomEvent buses or global mutable `window` state** — use the store or a typed emitter. No `any` at boundaries: WS payloads and map renderer props get real types, validated where they enter.
- **Hygiene**: error boundaries around new shells/routes; every async `.then(setState)` needs a cancelled flag or `AbortController`; no `eslint-disable exhaustive-deps` as a routine tool (a missing memo dep has already shipped wrong money on screen); no sequential-await N+1 fetch loops — batch; search for an existing utility/hook before writing a duplicate.
- **Theming**: use the semantic Tailwind tokens (`bg-surface*`, `text-content`, `border-edge`, `bg-accent`, status colors) — no raw palette classes, hex literals, or invented CSS vars; only `applyAppearance()` mutates `<html>` styling.

## Other big-picture pieces

- **Maps** (`src/components/Map/`): two interchangeable renderers — Leaflet (`MapView.tsx`) and Mapbox GL (`MapViewGL.tsx`), chosen at runtime by `MapViewAuto.tsx` based on the tile-source setting. GL-specific overlay/marker logic lives in the `*Mapbox.ts` siblings. Keep both renderers in sync when changing map features. **Offline maps**: only Leaflet supports full pre-download (raster tiles via `sync/tilePrefetcher.ts`, cached by the Workbox `map-tiles` rule). Mapbox GL is best-effort offline — its vector tiles are cached opportunistically as you browse online (the `mapbox-tiles` SW rule), not prefetched. Tile requests stay `no-cors` so self-hosted/custom tile providers without CORS headers keep working; `navigator.storage.persist()` (called at app init) keeps cached tiles from being evicted under storage pressure.
- **i18n** (`src/i18n/TranslationContext.tsx`): `en` is bundled synchronously as the fallback; every other locale is a **dynamic `import('@trek/shared/i18n/<locale>')`** so Vite code-splits one chunk per locale and only the active one is fetched. `t(key)` resolves top-level keys from `@trek/shared/i18n`. Add new strings to the locale files in **`shared/`**, not here. RTL handled via `isRtlLanguage`.
- **Mobile shell** (`src/mobile/`): below 768px (`useIsPhone`, reactive via matchMedia) `App.tsx` wraps routes in `MobileShell`, and phone-specific screens under `mobile/screens/<domain>/` (trip, dashboard, atlas, vacay, settings, admin, …) take over; the desktop/tablet experience at ≥768px is untouched. UI changes to a domain that has an `M*` screen usually need both the desktop component and the mobile screen updated.
- **Plugins UI** (`src/components/Plugins/`): third-party plugin surfaces render in a sandboxed iframe — `PluginFrame.tsx` owns the postMessage bridge and hands the plugin the current theme's design tokens (live re-sync on theme/accent change). Contribution points: `PluginWidgets.tsx` (dashboard), `PluginDaySchedule.tsx` (itinerary rows), `Map/MapPluginLayers.tsx`/`MapPluginMarkers.tsx` (map). `store/pluginStore.ts` holds installed-plugin state; admin install/manage in `components/Admin/AdminPluginsPanel.tsx`. The server-side runtime is `server/src/nest/plugins/`; plugin authoring is covered by the `trek-plugin-dev` skill.
- **PWA** (`vite.config.js`): `VitePWA` with `registerType: 'autoUpdate'` and Workbox `runtimeCaching` for tiles/API/uploads. `prebuild` (`scripts/generate-icons.mjs`) generates app icons before build.
- **Native shell** (`client/src/platform/`): the Capacitor apps are not served from the same origin as the API, so `getServerOrigin()` is the single source of truth for where the server lives — `''` in the web build (relative URLs stay relative), the user's chosen server in native. Requests go through `apiFetch` / the `apiClient` interceptor, assets through `resolveAssetUrl` / `<ServerImage>`; ESLint blocks bare `fetch('/api…')` and `/uploads` literals so the seam cannot reopen. Native authenticates with `Authorization: Bearer` because the session cookie is `sameSite: 'lax'` and a webview can never send it cross-site. Saved servers are "profiles" (`serverProfiles.ts`, Capacitor Preferences) with tokens in device secure storage (`serverTokens.ts`) and a per-profile Dexie namespace. **The web build must stay byte-identical — especially Dexie names**; see `offlineDb.naming.test.ts`.

## Tests

vitest with `@vitejs/plugin-react`, jsdom (custom `tests/environment/jsdom-native-abort.ts`), `forks` pool. Tests live both in `tests/{unit,integration}/` and co-located as `src/**/*.test.{ts,tsx}`. `msw` mocks HTTP, `fake-indexeddb` backs Dexie in tests. Page tests render JSX against a mocked hook; hook/slice logic is tested in isolation (see `store/slices/budgetSlice.test.ts`). Playwright e2e config separate (`npm run e2e`).
