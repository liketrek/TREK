# CLAUDE.md

Scope: the **`@trek/client`** workspace (React 19 + Vite + Zustand + Tailwind PWA). See the repo-root `CLAUDE.md` for the monorepo picture and the philosophy, `server/CLAUDE.md` for the API. This file holds the client's commands, invariants and pitfalls; `ls` the directories for the inventory.

## Commands (run from `client/`)

```bash
npm run dev               # Vite dev server; proxies the API/ws/uploads/MCP/OAuth paths → http://localhost:3001
npm run build             # prebuild generates PWA icons, then vite build
npm run typecheck         # tsc --noEmit (CI)
npm run lint:strict       # tsc over tsconfig.strict.json (strictNullChecks + noImplicitAny): errors per file may only shrink against scripts/strict-baseline.json, a new file starts at zero (CI gate; --list shows them, --update lowers it)
npm run lint              # eslint .   (CI runs lint:warnings instead, which fails on the same errors)
npm run lint:warnings     # eslint (typed), failing on any error and on any warning count per rule above scripts/eslint-baseline.json and on any entry above its count (app code, tests and eslint-disable'd messages counted apart; a `/* eslint <rule>: ... */` config comment fails outright; --update lowers it). Frozen as warnings: floating/misused promises, `.catch(() => {})` (trek/no-swallowed-catch), react-hooks v7 recommended, complexity/max-depth/max-params/max-lines-per-function (120 per .ts function, 300 per .tsx), `use*Store()` without a selector, `window.__*` and window.dispatchEvent buses (trek/no-window-globals), no-console, no-non-null-assertion; the local rules live in scripts/lib/eslint-rules.mjs
npm run lint:pages        # enforce the Page pattern (CI gate)
npm run lint:rtl          # physical left/right sides and rtl-lint-disable comments may only shrink per file (CI gate; --list shows them, --update lowers both baselines)
npm run lint:size         # no source file or stylesheet past 1000 lines, no test (Playwright specs and fixtures under e2e/ included) past 2000, counted wrapped at 120 columns; longer ones may only shrink (CI gate; --update lowers the baseline)
npm run lint:format       # Prettier: every .ts/.tsx/.mjs/.css file under src/, tests/, e2e/ and scripts/ outside scripts/format-baseline.json must be formatted, the list only shrinks (CI gate; npx prettier --write <file>, then --update)
npm run lint:layers       # imports go downwards: components never import pages/ or mobile/, nothing under the views imports a view; per-file counts may only shrink (CI gate; --list, --update)
npm run lint:offline      # no view file (components/mobile/pages/hooks) imports src/api/ beyond scripts/offline-baseline.json, which only shrinks (CI gate; --list, --update)
npm run lint:pairs        # each desktop/phone pair in scripts/feature-pairs.json imports its shared hooks, and every file under src/mobile/screens is listed there, in a pair or under mobileOnly with a reason (CI gate; --list prints the pairs)
npm run lint:dup          # copied code: the lines of a file inside a block that repeats elsewhere (100 tokens over 10 lines, SonarCloud's thresholds; .ts and .tsx read as one language) may only shrink against scripts/dup-baseline.json (CI gate; --list shows each block with its other side, --update lowers it)
npm run lint:skips        # no .only anywhere; skipped/todo/fixme tests per file may only shrink against scripts/skip-baseline.json (CI gate; skipIf/runIf and Playwright's test.skip(condition, 'why') are fine, but skipIf(true) and runIf(false) count as skips)
npm run lint:i18n-keys    # every translation key src/ names exists in shared en, and en keys nothing in src/, server/src or plugin-sdk/src reaches may only shrink per en file against scripts/i18n-unused-baseline.json (CI gate; --unused lists them, --update lowers the baseline)
npm run test              # vitest run (tests/** + co-located src/**/*.test.{ts,tsx}); also test:unit / test:integration / test:coverage
npm run e2e               # Playwright (CI runs --project=public --project=app; e2e:report opens the last report)
npm run shots             # Playwright screenshot project (shots:promote to accept)
npm run theme:lint        # colour literals, palette classes, raw text sizes, z-index literals above z-50 and dark_mode reads may only shrink per file, theme-lint-disable markers too (CI gate; --list shows them, --update lowers both baselines)
npm run check:gl-split    # after build: fails if one chunk bundles both mapbox-gl and maplibre-gl (CI gate)
```

Every baseline ratchet above also fails on an entry that allows more than the tree holds: a count above what its file or rule has now, or a file that is gone. Run the check with `--update` in the change that made it smaller, so a fixed file cannot grow back to its old entry and a new file at a deleted path does not inherit one.

Single test: `npx vitest run src/store/slices/budgetSlice.test.ts`, or `npx vitest run -t "optimistically adds the place"`.

The dev server needs the API on **:3001** — run `npm run dev` at the repo root to start both.

## Page pattern (enforced — `lint:pages` fails otherwise)

Every `src/pages/*Page.tsx` is a thin **wiring container**; all state/effects/handlers live in a co-located **`use<Page>()` hook** under `src/pages/<page>/`. The page body must **not** call React state/effect/memo/ref hooks — only context hooks like `useTranslation()`. An optional `<page>Model.ts` holds pure, React-free types and helpers. Full spec in `src/pages/PATTERN.md`. When extracting, keep the rendered JSX byte-identical — it is a refactor of where logic lives.

## Data flow — offline-first

The layering is **component → feature hook → store/slice → `repo/` → `api/` | Dexie**, and writes go through a mutation queue:

- **`src/store/`** — Zustand. `tripStore.ts` is composed from slices in `store/slices/`; `slices/remoteEventHandler.ts` applies inbound WebSocket events to local state.
- **`src/repo/`** — per-entity repositories mediating between the network and the offline cache: online, call REST and upsert into Dexie; offline, read Dexie. Always go through a repo for trip data.
- **`src/api/client.ts`** — the single Axios instance, typed from `@trek/shared`. New API surface goes in a per-domain `api/<domain>.ts`, not the god module.
- **`src/db/offlineDb.ts`** — the Dexie schema. Database and table names are the on-device contract — renaming one orphans every user's cache. Versions are append-only: a new `this.version(N)` adds its stores to `HISTORY` and a case to `UPGRADE_CASES` in `tests/unit/db/offlineDb.upgrade.test.ts`, which opens the previous version with seeded rows in fake-indexeddb and upgrades it to the current one; a guard there fails on a declared version without both. Never edit a shipped version's stores or `upgrade()`.
- **`src/sync/`**: in `mutationQueue.ts`, offline writes do an optimistic Dexie write (temporary **negative id** for creates), then `flush()` replays REST on reconnect with the mutation's UUID as the **`X-Idempotency-Key`** header (matching the server interceptor) and reconciles the row. Writes to one entity keep their order: a write parked as `failed` or `conflict` holds back the later writes to the same `resource` + entity id until the user retries, resolves or discards it, and only that action deletes a parked row (trip eviction never does). Every row `enqueue()` writes carries `schemaVersion` (`MUTATION_SCHEMA_VERSION` in `offlineDb.ts`) and `buildVersion`; bump the constant when a row's fields or the way the replay reads them change incompatibly. A flush replays its own format and older ones (an unstamped row is format 1) and skips a row from a newer format without sending, marking or dropping it, holding back the later writes to its entity, so a tab still on an older bundle never replays a shape it does not know. The guard exists only from the release that introduced `schemaVersion` on; a bundle older than that replays every row, so the first bump of `MUTATION_SCHEMA_VERSION` must not ship while a rollback target older than the guard is still in play. A skipped row stays `pending` with no retry or discard path, so on a rolled-back install it holds its entity until the user clears the cache. Repos whose writes carry no version token (visits, day clears, tours, driving settings) ask `mutationQueue.mustQueue()` before an online write and queue it while an older write to the entity is still queued, so a retried write cannot land over a newer one made here online; places and packing items send `X-Base-Updated-At`, so the server refuses the stale replay with a 409 instead. `flush()` takes the Web Lock `trek-mutation-flush:<db name>` so only one tab replays at a time; a tab that finds it taken waits for it, and a `flush()` called while this tab's flush runs or waits for the lock gets that same flush back (with one more pass asked for), so `flush()` never resolves while a tab is still replaying and a re-seed chained onto it cannot lay older server rows over those writes (the in-tab flush alone where the API is missing). The rest of the directory drives reconnection sync, the auth gate that stops background loops before logout swaps the DB, offline preferences, and map pre-download (raster and vector prefetchers).

## Rules for new code

The offline core is flagship work surrounded by a periphery that ignores it. New code extends the core's discipline, not the periphery's shortcuts:

- **One data path, no layer skips.** Never import `api/client` (or raw fetch/axios) from a component or modal, and especially never *write* from one. `lint:offline` enforces it: a file under `components/`, `mobile/`, `pages/` or `hooks/` may not import anything from `src/api/` except types. The long tail that already does is listed in `scripts/offline-baseline.json`; the list only shrinks (a file that stops leaves it via `--update`) and is debt, not precedent. A domain that is online-only on purpose (admin, auth) still puts its calls in a store or repo, not in the view.
- **Offline-first is the product promise.** New domains get a repo with read-through and offline writes (temp id → optimistic Dexie write → idempotent queue entry). If a domain is deliberately online-only, say so explicitly.
- **Imports go downwards** (`lint:layers`, rules in `scripts/lib/layers.mjs`). A component never imports `pages/` or `mobile/`, a shared hook no view, and stores, repos, sync, api, db and the helpers no view at all; a file directly in `src/` is the layer of its name, so `src/types.ts` follows the `types/` rules. A model or helper both sides need moves down (`utils/`, `hooks/`, `types/`); the counts in `scripts/layers-baseline.json` are debt, not precedent.
- **No god components or god hooks.** The page pattern is a floor, not a ceiling. Decompose hooks by concern, split renders into memoizable sections, and don't pass huge prop bags with inline-arrow callbacks.
- **Prefer React 19 idioms**: `useOptimistic`, `useActionState`/`useFormStatus`, `use()` + Suspense, `useSyncExternalStore` for external subscriptions (`hooks/useNetworkMode` is the reference).
- **Optimistic writes must reconcile** — rollback + user-visible toast on failure. No `.catch(() => {})`, no bare `catch {}`.
- **WS remote-event handling must match local slice reducers field-for-field.** Divergence is silent, cross-user data loss.
- **Subscribe with selectors** (`useShallow` for multi-field reads); never whole-store subscriptions; `getState()` for imperative access in effects.
- **Connectivity**: `isEffectivelyOffline()` is the single source of truth — never read `navigator.onLine` in feature code.
- **Rendering security**: never interpolate user content into HTML strings (map popups included — build via DOM + `textContent`, or `escapeHtml` from `@trek/shared`); untrusted markdown gets `rehype-sanitize`; never `rehype-raw` near it.
- **No `window` event buses or global mutable `window` state.** No `any` at boundaries: WS payloads and map renderer props get real types.
- **Hygiene**: error boundaries around new shells/routes (`components/shared/ErrorBoundary.tsx`); every async `.then(setState)` needs a cancelled flag or `AbortController`; no routine `eslint-disable exhaustive-deps` (a missing dep has already shipped wrong money on screen); no sequential-await N+1 fetch loops; search for an existing utility before writing a duplicate.
- **Theming**: use the semantic Tailwind tokens defined in `tailwind.config.js` (`bg-surface*`, `text-content*`, `border-edge*`, `bg-accent*`, status colors) — no palette classes, hex literals, arbitrary-value color classes, or invented CSS vars. Only `applyAppearance()` in `src/theme/` mutates `<html>` styling (see `src/theme/README.md`). `theme:lint` counts literals, `bg-[#...]`-style and palette classes, raw `text-sm`- and `text-[13px]`-style sizes, z-index literals and `dark_mode` reads per file against `scripts/theme-baseline.json`.

## Big-picture pieces

- **Maps** (`src/components/Map/`): two interchangeable renderers — Leaflet and Mapbox/MapLibre GL — chosen at runtime by `MapViewAuto.tsx`. Keep both in sync when changing map features, and keep `mapbox-gl` and `maplibre-gl` in separate chunks (`check:gl-split`). The raster prefetcher fetches tiles `no-cors` so custom tile providers without CORS headers keep working; the vector prefetcher deliberately uses `cors` because it has to read the responses — don't "align" one with the other.
- **i18n** (`src/i18n/TranslationContext.tsx`): `en` is bundled; every other locale is a dynamic `import('@trek/shared/i18n/<locale>')` so Vite emits one chunk per locale. Strings live in `shared/`, never here. `t()` returns an unknown key unchanged, so `lint:i18n-keys` (`scripts/i18n-keys.mjs`) resolves every literal key in `t()`, `tHtml()`, `tr()`, `<TransHtml html>`, `translateApiError` and `*Key` props against `shared/src/i18n/en`; a template whose interpolations only choose between string literals is expanded and each branch checked as a key; any other template key is read with each interpolation as one key segment and passes by itself only when it reaches between 1 and `MAX_IMPLICIT_MATCHES` (30) en keys; a wider one, or one with no fixed dotted prefix, needs a `DYNAMIC_ALLOWED` entry keyed by file and template that says what bounds the value, and an entry the check no longer needs fails. Pass counts as numbers, and let a plural group pick the wording instead of switching keys on the count.
- **Mobile shell** (`src/mobile/`): below the phone breakpoint (`useIsPhone`) `App.tsx` wraps routes in `MobileShell` and the `M*` screens under `mobile/screens/` take over. A UI change to a domain with an `M*` twin usually needs both, and the logic change goes into the shared hook (see "Desktop and phone views" below).
- **Plugins UI** (`src/components/Plugins/`): third-party surfaces render only inside the sandboxed `PluginFrame` iframe (postMessage bridge, live theme-token sync). Host-rendered contribution points (widgets, schedule rows, map layers, planner columns/actions) render server-normalized primitives only — plugin markup never runs inline. Authoring is covered by the `trek-plugin-dev` skill.
- **Managed installs** (`src/managed/index.tsx`): the attachment point for screens that only exist on a centrally administered install. Empty here by design — an operator replaces it at build time. Don't put features there.

## Desktop and phone views

Most features have a desktop view (`components/`, `pages/`) and a phone view (`mobile/screens/`). They share one hook or model per feature that holds the logic (state, effects, loading, handlers, validation, derived values, store and repo calls); each view keeps only its own markup, layout and dialogs or sheets. `useInstanceSettings` and `useRangeBypass` under `components/Admin/` show the shape. `scripts/feature-pairs.json` lists every pair with its hooks.

- **Changing a feature:** change the shared hook, not one view. A behaviour that really differs between the two views is a parameter of the hook, so both stay visible in one place and its test covers both.
- **A new feature with both views:** write the hook first under `components/<Feature>/` (or `hooks/`/`utils/` when it is not bound to one feature; a page's own logic stays in its `use<Page>` hook and models in `pages/<page>/`, which the phone shell imports too), give it its own test, build both views on it and add the pair to `scripts/feature-pairs.json`.
- **A new phone screen:** list it in `scripts/feature-pairs.json`, as a view of the pair whose hook it runs on or under `mobileOnly` with the reason it has no twin. A file under `mobile/screens/` that is in neither fails `lint:pairs`.

Two CI gates hold this: `lint:pairs` fails when a listed view stops importing its pair's hook or a phone screen is not listed, and `lint:dup` holds the lines inside copied blocks to `scripts/dup-baseline.json`, so a copy that looks alike fails too. SonarCloud allows **≤ 3% duplicated lines on the PR's new code**, so the same lines added to both views fail a PR by themselves. Full gate rules in the root `CLAUDE.md`.

## Tests

vitest with `@vitejs/plugin-react`, a custom jsdom environment (`tests/environment/`), `forks` pool. Tests live in `tests/{unit,integration}/` and co-located as `src/**/*.test.{ts,tsx}`. `msw` mocks HTTP, `fake-indexeddb` backs Dexie. Page tests render JSX against a mocked hook; hook/slice logic is tested in isolation (see `store/slices/budgetSlice.test.ts`).
