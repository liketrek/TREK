# CLAUDE.md

Guidance for Claude Code in this repository. This file holds the commands, the invariants, the gates and the philosophy. Inventories (file lists, counts, history) deliberately live in the code and its READMEs, not here — when this file disagrees with the code, the code wins; fix the doc.

## What TREK is

A self-hosted, real-time collaborative travel planner. npm-workspaces monorepo:

- **`shared/`** (`@trek/shared`) — Zod schemas, the **single source of truth** for API contracts, plus all i18n locales. Must be built before server/client typecheck or run.
- **`server/`** (`@trek/server`) — NestJS API (Express adapter), SQLite via `better-sqlite3`, WebSocket sync, built-in MCP server, sandboxed plugin runtime.
- **`client/`** (`@trek/client`) — React 19 + Vite + Zustand + Tailwind PWA, offline-first via Dexie/IndexedDB.
- **`plugin-sdk/`** (`trek-plugin-sdk`) — **not a root workspace**: own lockfile, published to npm independently, must ship standalone. Run its commands from `plugin-sdk/`.

Each package has its own `CLAUDE.md`; this file covers the monorepo picture.

## Commands

Run from the repo root unless noted. **Use `npm run ... --workspace=<pkg>`, not `npm -w <pkg>`**.

```bash
npm run dev                       # build shared, then watch shared + server + client concurrently
npm run build                     # build shared → server → client (order matters)
npm run lint                      # lint all three workspaces, check-only (npm run lint:fix applies the fixes in shared and server)
npm run format                    # prettier --write all three
npm run lint:knip                 # knip over client/server/shared (knip.jsonc): unused files, exports, types, deps may only shrink against scripts/ci/knip-baseline.json (CI gate; --update lowers it)
```

Tests:

```bash
npm run test                                       # all workspaces
npm run test --workspace=server                    # vitest run (server); also test:unit / test:integration / test:ws
npm run test:e2e                                   # server e2e (boots Nest against a temp SQLite)
npm run test:cov                                   # coverage (lcov) for all four packages incl. plugin-sdk
cd client && npm run test                          # client vitest run
cd client && npm run e2e                           # Playwright (CI runs the public and app projects; the screenshot and help-media ones are local)
cd client && npm run lint:pages                    # enforce the Page pattern (CI gate)
cd client && npm run lint:rtl                      # physical left/right sides may only shrink per file (CI gate)
cd client && npm run lint:dup                      # lines in copied code may only shrink per file, at SonarCloud's thresholds (CI gate)
cd client && npm run lint:pairs                    # desktop and phone views of a feature import its shared hook; every phone screen is listed (CI gate)
cd client && npm run lint:size                     # no source file past 1000 lines, longer ones only shrink (CI gate; server has the same)
cd client && npm run lint:strict                   # strictNullChecks + noImplicitAny errors may only shrink per file; new files start at zero (CI gate)
cd client && npm run lint:warnings                 # eslint (typed) errors fail, warnings per rule may only shrink, new rules start frozen (CI gate)
cd server && npm run lint:warnings                 # the same for the server, against server/scripts/eslint-baseline.json (CI gate)
cd server && npm run lint:format                   # Prettier outside the baseline list (CI gate; shared has the same in lint-prettier.yml)
cd server && npm run lint:strict                   # strict type errors per file may only shrink, a new file has none (CI gate)
cd client && npm run lint:format                   # Prettier outside the baseline list (CI gate)
cd client && npm run lint:layers                   # components never import pages/ or mobile/ (CI gate)
cd client && npm run lint:offline                  # views may not import src/api/ beyond the baseline (CI gate)
cd client && npm run lint:skips                    # no .only; skipped tests may only shrink (CI gate)
cd client && npm run lint:i18n-keys                # every key the client names exists in en (CI gate)
cd server && npm run lint:boundaries               # no new import cycles or cross-domain reach-ins (CI gate)
cd server && npm run lint:dialect                  # SQLite-only SQL spellings may only shrink (CI gate; rules in server/CLAUDE.md)
cd server && npm run probe:pg                      # dialect helpers + the repository statements it reaches against Postgres (CI job; needs TREK_PG_PROBE_URL)
cd server && npm run lint:tx                       # no new method writing twice outside one transaction (CI gate)
cd server && npm run lint:test-sql                 # raw SQL fixtures in tests/ may only shrink; seed through tests/helpers/factories (CI gate)
cd server && npm run lint:test-mocks               # vi.mock of config, realtime and db modules in tests/ may only shrink (CI gate)
cd server && npm run lint:test-new-service         # hand-built services and repositories in tests/ may only shrink (CI gate)
cd server && npm run lint:query-api                # MikroORM QueryBuilder calls in the repositories may only shrink (CI gate)
cd server && npm run lint:mcp-zod                  # inline zod in the MCP tool files may only shrink; fields derive from @trek/shared (CI gate)
cd server && npm run lint:service-http             # { error, status } results and their caller-side branches may only shrink; services throw DomainError (CI gate)
cd server && npm run lint:response-contracts        # route handlers without @ResponseContract may only shrink (CI gate)
cd client && npm run theme:lint                    # styling that bypasses appearance tokens may only shrink per file (CI gate)
npm run typecheck --workspace=server               # tsc --noEmit (also client/shared; server also has typecheck:tests)
```

Run a single test file or test:

```bash
npx vitest run tests/unit/nest/weather.controller.test.ts   # (from server/ or client/)
npx vitest run -t "name of the test"                        # by test-name pattern
```

i18n parity (CI gate — every non-`en` locale must have the identical file set and top-level keys):

```bash
npm run i18n:parity --workspace=shared            # audit (exit 0)
npm run i18n:parity:strict --workspace=shared     # CI gate (exit 1 on drift)
```

Dev ports: the server listens on **3001**; the Vite dev server proxies the API, websocket, uploads, MCP and OAuth paths to it (see `client/vite.config.js`). `.nvmrc` pins the Node major the Docker image runs and every CI job reads; `engines` in each package.json states the range that installs (npm only warns outside it). `server/.env.example` is the env-var reference.

## Server invariants

Nest owns everything: every domain is a DI module under `server/src/nest/<domain>/` (`controller` + `service` + `module`, registered in `app.module.ts`), and ESLint refuses imports of the deleted legacy `services/` layer. `server/src/nest/README.md` is the module blueprint; **`weather/` is the reference implementation** — copy its shape. The domain's Zod contract lives in `shared/src/<domain>/`.

- **`bootstrap.ts` — `buildApp()`** is the single builder for production and the test harness. **Composition order is load-bearing**: everything registered on the raw Express instance must come **before `app.init()`**, because Nest's router throws `NotFoundException` on unmatched routes and nothing registered after init is reachable. Don't add routes to that pre-init shell — it bypasses every global guard, interceptor and filter.
- **`/mcp` bodies are raw by design** — the parser wrappers exempt `/mcp` so the MCP SDK reads the untouched stream; never `@Body()` a `/mcp` route.
- **Auth is default-deny**: global guards run as `APP_GUARD`s; public routes opt out with `@Public()`, and a boot-time ratchet (`validate-route-guards.ts`) refuses any public route not on its allow-list.
- **Trip-scoped routes** verify trip access (404) and the permission (403) — `@UseGuards(JwtAuthGuard, TripAccessGuard)` + `@RequirePermission('<action>')` per handler — and forward `X-Socket-Id` to the broadcast so the originating client doesn't echo its own change. **Never gate a multipart upload with a guard** (the client sees ECONNRESET instead of 403 — check in the handler).
- **DB** (`server/src/db/`): `better-sqlite3`, WAL, FK on. MikroORM's migrations (`db/migrations/`) are the only schema source, **including for tests** — the hand-kept `schema.ts`/`migrations.ts`/`seeds.ts` test builders are gone. Seeding is MikroORM's too (`db/seeders/`), applied at boot from `buildApp()`; the ORM shares the one better-sqlite3 connection (bound in `server/src/db/orm-driver.ts`) rather than opening its own. Queries go through repositories (`server/src/db/repositories/`) and `UnitOfWork` (`server/src/nest/database/unit-of-work.ts`) for transactions — there is no `DatabaseService`. `better-sqlite3` itself is ESLint-restricted to `src/db/` plus a short, named allow-list (`server/eslint.config.mjs`), so a domain reaching for the driver directly fails lint. `NODE_ENV=test` gives each vitest worker an isolated `:memory:` DB.
- **Realtime**: `/ws` is a Nest gateway in `server/src/nest/realtime/` — inject `RealtimeService`. Tests observe broadcasts through a `FakeRealtimeService` (`server/tests/helpers/fake-realtime.ts`), never by mocking the transport module.
- **MCP**: tools are declared in `<domain>.mcp.ts` files beside each module, on the `server/src/nest-mcp/` decorator layer. A validation or permission change on a REST route must land in the parallel MCP tool in the same change. See `MCP.md`.
- **Addons** are admin-toggleable feature modules keyed by `ADDON_IDS` in `server/src/addons.ts`.
- **Plugins** (`server/src/nest/plugins/`): one forked child process per plugin, permission-gated RPC (a handler is registered only if the plugin holds the unlocking permission), install-time manifest/signature/egress/version-range gates. The protocol tables are **generated** into `plugin-sdk/` and `shared/` by `gen:plugin-facts`; `check:plugin-facts` is the CI gate. Author tooling is `plugin-sdk/`; the `trek-plugin-dev` skill covers authoring.
- **Storage**: uploads go through the driver abstraction in `server/src/nest/storage/` (local / S3 / mirror). Never touch the filesystem or the S3 SDK from a domain service.
- **Crons** go through `server/src/nest/scheduling/` only — never a `@Cron` decorator (it bypasses the test-time gate).

## Client invariants

Offline-first, with a layered data flow. A Page never owns state directly:

- **Page pattern** (enforced by `lint:pages`, spec in `client/src/pages/PATTERN.md`): a `*Page.tsx` is a **wiring container** composing a co-located `use<Page>()` hook; it must not call React state/effect/memo hooks itself.
- **Data flow**: `store (Zustand, client/src/store/) → repo (client/src/repo/) → api (client/src/api/) | Dexie (client/src/db/offlineDb.ts)`. Writes go through `client/src/sync/mutationQueue.ts`: optimistic Dexie write, then a replay with an `X-Idempotency-Key` header on reconnect. `client/src/store/slices/remoteEventHandler.ts` applies incoming WebSocket events. Components never call the API directly.
- **Styling**: semantic Tailwind tokens (`bg-surface*`, `text-content*`, `border-edge*`, `bg-accent*`) or the underlying `var(--token)` variables — never color literals, arbitrary-value color classes or numeric inline `fontSize`, so user-chosen scheme/transparency/text-size keep working. `theme:lint` holds the bypasses per file to a baseline that only shrinks (CI gate); mark intentional exceptions (map/PDF/brand) with a `theme-lint-disable` line comment, which is counted too.
- **Reading direction**: Arabic runs the app right to left, so spacing, insets and alignment that follow the text use the logical forms (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`/`border-s`/`rounded-s`, `marginInlineStart`, `insetInlineEnd`, `textAlign: 'start'`). `lint:rtl` counts the physical ones per file against `client/scripts/rtl-baseline.json`, which may only shrink; geometry that is physical on purpose in new code (maps, measured positions, time axes) carries an `rtl-lint-disable` comment.
- **PWA**: `vite-plugin-pwa` + Workbox cache tiles, API and uploads; `prebuild` generates icons.

## Shared contracts & i18n

- A route is "done" only once its contract lives in `shared/` and both sides import the inferred types. Edit the Zod schema, rebuild shared, then server (validation + DTO types) and client (typed requests) pick it up.
- Locale files live in `shared/src/i18n/<locale>/`, one file per domain; `en/` is canonical. When you add or change a key, **add a real translation to every locale** — parity fails CI on missing keys, and an English placeholder is not acceptable in a non-`en` locale.
- Count-bearing strings are plural groups: the key holds the general form and `key.one`, `.few` … the forms the language's `Intl.PluralRules` selects. Pass `{ count }` as a number and never choose between two keys with `count === 1`; details in `shared/CLAUDE.md`.

## Project direction

These principles come out of a full-repo audit and shape all new code:

- **Protect the crown jewels.** The client's offline-first data core (repos + mutation queue + Dexie), the out-of-process plugin sandbox, the Zod contract layer, and the auth primitives are production-grade. Extend them; never route around them or rewrite them in anger.
- **No "modern shell over legacy core."** The debt pattern is a modern frame delegating to the old approach underneath (on the client: feature components calling the raw API past the offline core). New code goes all-in on the target architecture; when touching a legacy seam, migrate it rather than adding another wrapper.
- **Single source of truth over manual synchronization.** Never add a hand-mirrored copy of state, schema, or contract (server↔Dexie↔Zustand, schema↔SQL, the plugin contract). Derive from one source, or guard the copy with a parity test that cannot silently skip — the server entities are the precedent: `npm run gen:entities`/`check:entities --workspace=server` (`server/scripts/generate-entities.ts`) regenerate them from the live migrated schema instead of hand-editing, and a parity test (PARITY-009) pins entity-vs-DB drift (delete rules, index names) at zero skips. The Kysely table types the repositories query through are generated the same way (`gen:db-types`/`check:db-types`, `server/scripts/generate-db-types.ts`).
- **DI over global mutable module state.** New server code injects its dependencies; new client code avoids `window`-global buses and mutable module state.
- **Use the runtime's native idioms.** Prefer React 19 features (`useOptimistic`, Actions, `use()`/Suspense) and Nest subsystems (providers, pipes, guards, `@nestjs/schedule`) over hand-rolled equivalents.
- **Fail closed, gates stay on.** Security switches default to safe; misconfiguration must refuse, not degrade. Never lower a quality gate to land a change — no new `any`, no new `eslint-disable`, no downgrading rules to `warn`, no lowered coverage thresholds.

## Conventions (from CONTRIBUTING.md)

- **Target the `dev` branch** for PRs, not `main` (exception: `wiki/`-only changes).
- **Discuss first**: outside contributions are pitched in the `#github-pr` Discord channel before any code is written.
- **PRs follow `.github/PULL_REQUEST_TEMPLATE.md`** and need a linked issue (`Closes #N`) for fixes or an approved feature discussion for features.
- **Conventional commits** (`fix(maps): ...`, `feat(budget): ...`). **No Co-Authored-By or other tool-attribution trailers.**
- One focused change per PR; no breaking changes; no unrelated reformatting. Tests ship in the same change — the project holds 80%+ coverage.
- **Parity is law** when touching a route: same URL, method, query/body, HTTP status, `Set-Cookie` and JSON body, including bespoke error strings. Nest defaults POST to 201 — add `@HttpCode(200)` where the contract returns 200. Declare static sub-routes (`/reorder`) **before** `:id` param routes.

## Quality gates in CI

`.github/workflows/test.yml` runs, per package: typecheck (server also `typecheck:tests`, client also the strict-mode ratchet `lint:strict`), lint (client and server through `lint:warnings`, which also holds the warning count per rule), `lint:pages`, `lint:rtl`, `lint:size` (client and server), the server's `lint:strict`, `lint:boundaries`, `lint:tx`, `lint:dialect`, `lint:test-sql`, `lint:test-mocks`, `lint:test-new-service`, `lint:query-api`, `lint:mcp-zod`, `lint:service-http` and `lint:response-contracts`, the client's and server's `lint:format`, `lint:layers`, `lint:offline`, `lint:dup`, `lint:pairs`, `lint:skips`, `lint:i18n-keys` and `theme:lint`, shared's `contracts:open`, the repo-wide `lint:knip` (in server-quality), `check:plugin-facts`, `i18n:parity:strict` (with the untranslated-strings ratchet), the S3 contract suite, the Postgres probe (`postgres-probe`: every dialect helper on SQLite and Postgres, and the statements every repository method reaches with sample arguments against a Postgres service; the SQL errors per method and the list of methods it cannot measure are held to a baseline that only shrinks and fails while it is still unmeasured; see `server/CLAUDE.md`), the browser end-to-end flows (Chromium and WebKit), a client build with `check:gl-split`, coverage for all four packages, then a SonarCloud scan. It also builds the Docker image and boots it until `/api/health/ready` answers (`docker-image`), and lints and renders the Helm chart against the Kubernetes schemas and runs `docker compose config` on every compose file (`deploy-manifests`). `lint-prettier.yml` additionally runs `lint` + `lint:format` on `shared/`, both check-only. `plugin-sdk` has no lint script and is outside the eslint gates. **Not in CI**: the screenshot and help-media Playwright projects; run them locally. There are no git hooks; nothing runs before a commit except you. Other workflows build Docker images, scan them, and publish `trek-plugin-sdk` on `plugin-sdk-v*` tags.

- **`ci-ok` is the required check.** The branch ruleset requires `ci-ok` (plus `lint` and `check-target` from their own workflows), and `ci-ok` needs every job above except the scan. It fails if any of them failed or was cancelled and passes if they passed or were skipped. A new gate job counts only once it is listed in `ci-ok`'s `needs:`.
- **Guides name paths that exist**: the `changes` job runs `scripts/ci/doc-paths.mjs`, which resolves every backtick path in the CLAUDE.md files, `README.md`, `server/src/nest/README.md` and the wiki against the tracked files; the missing ones are listed in `scripts/ci/doc-paths-baseline.json`, which only shrinks (`--update` after a fix).
- **What runs is decided by `changes`, not by `on.paths`**: `scripts/ci/changed-areas.mjs` maps the changed files to the `code`, `image` and `deploy` areas (tests: `npm run test:ci-scripts`). A path filter on the workflow would leave `ci-ok` unreported on a docs-only PR and block it. Add a new top-level file the build reads to the right area there.
- **Runners and Node**: jobs run on `ubuntu-24.04`, not `ubuntu-latest`, and every `setup-node` reads `.nvmrc`. Third-party actions (anything outside `actions/*`) are pinned by commit SHA with the tag in a comment; Dependabot keeps both current.
- **Security scans are advisory.** `security.yml` runs `npm audit` (what the image installs, plus `plugin-sdk`) on every PR and push into dev and main, and Docker Scout on the built image for main. Neither is required: a newly published advisory would turn every open PR red at once. Fixes are held as floors in the root `package.json` `overrides`; npm ignores an `overrides` block in a workspace `package.json`, so never put one there.
- **Releases** are dispatched by hand and refuse a commit whose `ci-ok` is not green. `docker-dev.yml` (any branch, usually dev) is the canary: it builds the dispatched commit as the next minor or major `-pre.N` and moves only `:latest-pre` and `:<major>-pre`. `docker.yml` (main only) bumps the version, commits and tags it, builds both platforms from exactly that commit and moves `:latest`, `:<major>`, `:<major>.<minor>` and `:<version>`. Its `bump=auto` only finalizes a prerelease in flight; without one it stops and asks for patch, minor or major. Ship a release that migrates or changes a lot as a prerelease first, and as a minor, so installs pinned to `:<major>.<minor>` can wait it out.

**SonarCloud** (project `liketrek_TREK`, the built-in Sonar way gate; the run takes 20–25 min, so get it right before pushing) measures **new code only** on a PR; any failing condition blocks it:

| Condition (new code) | Must be |
|---|---|
| Coverage | ≥ 80% |
| Duplicated lines | ≤ 3% |
| Security / reliability / maintainability rating | A |
| Security hotspots reviewed | 100% |

- **Duplication is the one that bites.** Desktop and phone shells (`client/src/components/<X>` ↔ `client/src/mobile/screens/.../M<X>`) are deliberate mirrors of each other's markup; their logic lives in one shared hook per feature. Every line added identically to both counts against the 3% budget, so a feature touching both shells fails on its own. Put the logic in ONE hook/module (precedents: `useInstanceSettings`, `useRangeBypass` under `client/src/components/Admin/`) and leave only markup in each shell. `lint:dup` finds the same copies in `client/src` before the push and holds every file to `client/scripts/dup-baseline.json`; `lint:pairs` holds each pair in `client/scripts/feature-pairs.json` to its shared hook and makes every new phone screen either join a pair or say why it has no twin. Locale files are excluded from duplication, so i18n additions are free.
- **Coverage is per new line across all four packages.** A new file without tests drags the PR under 80%. Files in `sonar.coverage.exclusions` don't count either way.
- **Ratings are about new issues.** One new bug drops reliability; one new vulnerability drops security. Don't introduce hotspot patterns (`Math.random` in anything security-adjacent, `child_process` through PATH, backtracking regexes, secret-looking strings). Path-wide suppressions live only in `sonar-project.properties` with a written justification; one-off findings are resolved on SonarCloud, never with an inline `// NOSONAR`.
- **Check it yourself.** The `sonarqube` MCP is connected: `list_pull_requests` → `get_project_quality_gate_status` shows each condition's value; `search_duplicated_files` + `get_duplications` show what tripped duplication; `search_sonar_issues_in_projects` lists new issues. Test files are excluded from analysis — when duplication fires, the source is the problem.

## Reference docs

- `MCP.md` (MCP server, tools, scopes) · `README.md` (deployment, env vars, reverse proxy) · `server/src/nest/README.md` (module blueprint, test layout) · `server/src/app-config/README.md` (env parsing quirks) · `plugin-sdk/README.md` (plugin author guide).
- `wiki/` — end-user documentation. `Dockerfile` / `docker-compose*.yml` — the deployment path and the local S3 test stack.
