# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: the **`@trek/server`** workspace. See the repo-root `CLAUDE.md` for the monorepo-wide picture (shared contracts, client, conventions). This file covers server internals only.

## Commands (run from `server/`)

```bash
npm run dev               # scripts/dev.mjs: tsc -w then node --watch dist/index.js (server on :3001)
npm run build             # scripts/build.mjs — see "emit-anyway" note below
npm run typecheck         # tsc --noEmit (the real type gate; build does NOT fail on type errors)
npm run typecheck:tests   # tsc over tests/ — CI runs this too; vitest green does NOT mean typed mocks compile
npm run lint              # eslint --fix on src/apps/libs/test
npm run lint:check        # eslint, no fix
npm run test              # vitest run (all of tests/**)
npm run test:unit         # tests/unit
npm run test:integration  # tests/integration
npm run test:ws           # tests/websocket
npm run test:e2e          # tests/e2e (boots Nest modules against a temp in-memory SQLite)
npm run test:coverage     # istanbul coverage; per-domain ratchet over src/nest/** (floor ≥80%)
npm run gen:plugin-facts  # regenerate the plugin-protocol tables into plugin-sdk/ + shared/
npm run check:plugin-facts # CI gate — fails if the generated copies drifted from envelope.ts
```

Single test:

```bash
npx vitest run tests/unit/nest/weather.controller.test.ts
npx vitest run -t "returns 401 without cookie"
npx vitest watch tests/unit/nest/auth-guard.test.ts
```

**Build emits even with type errors** (`scripts/build.mjs` catches `tsc` failures and warns). So `npm run build` succeeding does **not** mean the code typechecks — always run `npm run typecheck` to gate types.

## Architecture

Nest owns everything: the strangler migration **completed 2026-08-10**, and the last seam — the pre-`app.init()` MCP/OAuth mount — moved behind the container 2026-08-11, taking the final five `*.bridge.ts` files with it (**zero bridges remain**). Legacy `src/services/` is **deleted** — `eslint.config.mjs` errors on any import of it — and every domain is a DI module under `src/nest/<domain>/`. `src/nest/README.md` is the per-module blueprint and records the migration's design decisions. What still runs pre-init is path-prefixed plumbing only: global middleware, /uploads static+guarded routes, the DI-built discovery metadata middleware, production statics, api-docs, and the named body-parser wrappers. The websocket seam is gone: `/ws` is a Nest gateway (`src/nest/realtime/`), and `src/websocket.ts` is a re-export stub. The scheduler seam is gone: every cron is a domain provider on `@nestjs/schedule` (see `src/nest/scheduling/` below).

- **`src/index.ts`** — process entry: creates upload/data dirs, builds the app via `bootstrap.ts`, wires the WebSocket server onto the same HTTP server, prints the startup banner. Default port **3001**.
- **`src/bootstrap.ts` — `buildApp()`** — the single shared app builder for both prod and the test harness. **Registration order is load-bearing**: `applyGlobalMiddleware` → `applyPlatformUploads` → the discovery metadata middleware → `applyPlatformStatic` → the named body-parser wrappers all run on the raw Express instance **before `app.init()`**, because Nest throws `NotFoundException` on unmatched routes and won't fall through to anything registered after init. **`/mcp` bodies are raw by design**: the parser wrappers (`jsonParser`/`urlencodedParser` — the names suppress Nest's own init-time parsers) exempt `/mcp` so the MCP SDK reads the untouched stream. Never `@Body()` a `/mcp` route.
- **Domain modules** live in `src/nest/<domain>/` as `controller` + `service` + `module`, registered in `src/nest/app.module.ts`. **`weather/` is the reference implementation** — copy its shape. The Zod contract is in `shared/src/<domain>/`.
- **`src/services/` no longer exists** — deleted 2026-08-10 after the last fold; ESLint walls off any new import. Business logic lives in each domain's injectable `.service.ts`, with pure halves split into `.helpers.ts` plain modules and, in newer folds, SQL into a repository (`trek_photos` pattern).
- **`src/db/`** — `better-sqlite3` (WAL, FK on). `database.ts` boots and runs `schema.ts` → `migrations.ts` → `seeds.ts`. `NODE_ENV=test` ⇒ isolated `:memory:` DB per vitest worker; `TREK_DB_FILE` ⇒ explicit file DB (Playwright harness).
- **`src/websocket.ts`** — JWT-authed `ws` server on `/ws`, room-per-trip, heartbeat, per-connection rate limiting. Trip mutations forward `X-Socket-Id` so the originating client doesn't echo its own change.
- **`src/mcp/`** — process-wide MCP state (scopes, sessionManager, tuning knobs, rate-limit map, `nest-mcp-policy.ts` boot gate). The HTTP transport is `src/nest/mcp-transport/` (a `@Public` controller + service); the tools/resources/prompts live in decorator-driven `<domain>.mcp.ts` files under `src/nest/` — `src/mcp/tools.ts` is registry-attach-only. Every tool invocation writes an `mcp.tool_call` audit row (user, OAuth client, tool name, ip) via the nest-mcp `onInvoke` seam.
- **`src/nest-mcp/`** — the decorator/registry layer itself (`@McpController`/`@Tool`/`@Resource`/`@Prompt`, `McpRegistry`, `McpModule`, result helpers) that the `<domain>.mcp.ts` files build on. Formerly the standalone `@trek/nest-mcp` workspace, folded in 2026-08-22; see its `README.md` for the API and invariants (self-contained apart from a type-only `../mcp/scopes` import; no scope semantics of its own). Tests: `tests/unit/nest-mcp/`.
- **`src/nest/scheduling/`** — `CronRegistrarService`, the one way TREK schedules a cron (`@nestjs/schedule` + the `cron` package). Every job is a `*.job.ts` provider in its owning domain, registered from `onApplicationBootstrap`; the registrar refuses to schedule under `NODE_ENV=test` (the shared `buildApp()` harness must never tick — `tests/integration/scheduler-gate.test.ts` pins it) and stops everything on `nestApp.close()`. Never use a `@Cron` decorator — decorator jobs bypass the gate.
- **`src/nest/plugins/`** — sandboxed plugin runtime in three layers: `supervisor/` + `runtime/plugin-host-entry.ts` + `protocol/envelope.ts` (forked child per plugin, IPC envelopes, rate/RSS policing — **intentionally not Nest**, it's the security boundary); `host/rpc-host.ts` (enforcement: a method is registered at spawn only if the plugin holds the unlocking permission — registration = authorization); `host/plugin-host-deps.factory.ts` (dependency wiring — an `@Injectable()` factory injecting the domain services; the RPC surface is decorator-driven since 2026-08-09, with `PluginsModule` split into four and per-domain coverage gates) + `host/plugin-host-state.ts` (process-wide data-DB/budget maps, module-level on purpose). Install-time gates in `install/` (manifest, safe-extract, Ed25519 signature verify, egress). ⚠️ The protocol tables — permissions, RPC methods, hooks, and the core-event catalog — live in `protocol/envelope.ts` (+ `src/plugin-event-sink.ts` for the event families) and are **generated** into `plugin-sdk/src/generated/host-facts.ts` and `shared/src/plugin-permissions.ts` by `npm run gen:plugin-facts`; `check:plugin-facts` is the CI gate, so run it after touching any of them and commit the regenerated files. `runtime/egress-policy.ts` is still a hand-kept **byte-identical** mirror into `plugin-sdk/`, guarded by parity tests there — keep both sides in sync when touching either.

## Direction (post-migration guardrails, from the 2026 audit)

**Nest is the destination — and as of 2026-08-10 the code is there.** These rules now guard against regression rather than describe a migration in flight:

- **Follow the Nest philosophy, don't work against it.** New surfaces are real Nest modules: thin controller (HTTP shaping, guards, status codes) → injectable provider (business logic, DI-injected deps). The migration to this shape is complete — never resurrect a plain function-module service, and don't grow god services: when a domain outgrows one class, split it (the trips domain became `trips`/`trip-members`/`trip-membership`/`trip-invite`/`trip-read-model`/`calendar`; auth split into `auth` + profile + `tokens`).
- **Inject, don't reach for module globals.** No new imports of the global `db` proxy from `nest/` layers; no new code depending on the `ws` singleton or event-sink globals. Write new code so it can move to DI (`DatabaseModule`, injectable realtime/config/scheduler) without rework. New modules must be importable without side effects (no disk/DB access at module evaluation).
- **Don't add routes to the pre-`app.init()` Express shell** — it bypasses every global Nest guard/interceptor/filter. New routes go through Nest so cross-cutting controls actually apply.
- **Transactions are not optional.** Any multi-statement write goes in `db.transaction()`; never hand-roll `BEGIN`/`COMMIT` via `db.exec`. Bind values with `?`; identifiers only via a literal allow-list.
- **Migrations are append-only.** Identity is positional (array index == `schema_version`) — never reorder, insert mid-list, or delete; no env interpolation in SQL.
- **Every write endpoint validates.** `@Body()` must go through the Zod pipe with a schema from `@trek/shared` — no `Record<string, unknown>` + ad-hoc checks. Validating the caller's permission isn't enough: verify every referenced id (place/day/user) exists and belongs to the same trip.
- **Every outbound `fetch` gets a timeout (`AbortSignal`), a response-size cap, and boundary validation** — no `as`-casting provider responses, no silent `catch → null`. User-influenced URLs go through the SSRF guard. Never silently fall back to another user's API key.
- **Fail closed.** Unrecognized flag values mean OFF; sandbox/permission opt-outs must refuse in production; never select a less-safe code path based on the *absence* of a file. GET handlers must not write to the DB.
- **Don't fork the canonical paths.** Auth verification is `verifyJwtAndLoadUser` (with the `password_version` gate) — reuse it, never reimplement. MCP tools are adapters over the same services/`canAccessTrip`/`checkPermission`; a validation or permission change on a REST route must land in the parallel MCP tool in the same change.
- **Money rules**: integer-cent arithmetic; largest-remainder splits (`budgetService.splitEqualShares` is the reference); FX frozen at entry; explicit flags, never sentinel values (`rate === 1`, `scopes: null`); custom splits must reconcile (`Σ balances = 0`) before persisting.
- **Reference controllers**: `collections.controller.ts` (Zod pipe on every body + enumeration-safe owner checks) alongside `weather/` for module shape.

## Configuration (app-config)

**Never read `process.env` directly in `src/**`** — ESLint errors on it. All env
access goes through `src/app-config/`:

- **Nest DI classes**: inject a boot-stable namespace token
  (`@Inject(mcpConfig.KEY) private mcp: ConfigType<typeof mcpConfig>` from
  `src/nest/app-config/`) for values frozen per app build, or use
  `RuntimeEnvService` / `readEnv()` for runtime-toggled values (DEMO_MODE,
  NODE_ENV, OIDC_*, …) that ~60 tests mutate mid-lifetime.
- **Everything else** (services, mcp, websocket, scheduler, db, middleware):
  `readEnv()` from `src/app-config` — live, uncached, per call. Modules that
  froze env in module-top consts keep that timing (read `readEnv()` at module
  top, marked "frozen on purpose").
- **Validation is fail-fast at boot only** (`boot-validate.ts`, imported by
  `index.ts` right after dotenv): present-but-malformed values abort startup;
  unset/blank always defaults. Never wire validation into `buildApp()` or
  `ConfigModule.forRoot` — and never enable `cache: true` or `load`-snapshot a
  runtime-toggled value (breaks the env-mutating tests).
- **Booleans are unified**: every switch accepts true/1/on/yes vs false/0/off/no
  (any casing) via `parseBool`. Everything else pins its exact legacy coercion —
  parity quirks are documented in `src/app-config/README.md`, including the
  exemption list for the ESLint ban (plugin child process, dynamic keys,
  `config.ts` key material, scripts, tests).

## Cross-cutting Nest pieces

- **`src/nest/common/`**: `trek-exception.filter.ts` (global error envelope, `APP_FILTER`), `zod-validation.pipe.ts` (validates against `@trek/shared` schemas), `idempotency.interceptor.ts` (global `APP_INTERCEPTOR` replaying `X-Idempotency-Key` on mutations).
- **Auth is default-deny**: `src/nest/auth/global-auth.guard.ts` + `mfa-policy.guard.ts` run as `APP_GUARD`s; routes opt out with `@Public()`/`@OptionalAuth()` (`public.decorator.ts`), and `src/nest/common/validate-route-guards.ts` refuses at boot any public route not on `PUBLIC_ROUTE_ALLOW_LIST`. The global guard stands down for routes that declare their own guard chain (still resolving `req.user` for MFA), so per-controller `@UseGuards(JwtAuthGuard, ...)` stacks keep working. Other guards: `admin.guard.ts`, `addons/addon.guard.ts` (`@RequireAddon`), `permissions/trip-access.guard.ts` (`@RequirePermission` + `@Trip()` — the standard trip-scoped shape), `permissions/trip-owner.guard.ts`. Auth is cookie-based (`trek_session`); `@CurrentUser()` decorator. **Never gate a multipart upload with a guard** — guards run before the parser, so the client sees ECONNRESET instead of your 403; check in the handler (PROFILE-015).
- **`src/middleware/`** — only `globalMiddleware.ts` remains (helmet/CSP, CORS, HSTS, forced-HTTPS, logging, cookie-parser), applied in `bootstrap`. The old `mfaPolicy`/`tripAccess`/`idempotency`/`validate` middlewares are deleted — their jobs moved into the guards above and the Nest pipe/interceptor layer.

## Tests

`tests/` is split into `unit/` (mirrors `src/`, incl. `unit/nest/<domain>.controller.test.ts` and `auth-guard.test.ts`), `integration/`, `e2e/` (one `<domain>.e2e.test.ts` per module, booting the real `JwtAuthGuard` against a temp DB via `tests/e2e/harness.ts` — `createTempDb`/`seedUser`/`sessionCookie`), and `websocket/`. Shared helpers in `tests/helpers/`, fixtures in `tests/fixtures/`, global setup in `tests/setup.ts`.

- **vitest uses the SWC plugin** (`vitest.config.ts`), not esbuild, because Nest's type-based DI needs emitted decorator metadata — esbuild drops it. Keep that config when touching test tooling. Pool is `forks` (isolated DBs per worker).
- **Coverage gate is a per-domain ratchet over `src/nest/**`** (statements/branches/functions/lines; ≥80% floor, most domains pinned higher — see `vitest.config.ts`); legacy code is intentionally ungated.
- The config also aliases `@modelcontextprotocol/sdk/*` to CJS dist files because the SDK's exports map uses unresolvable extension-less wildcards.

## Parity discipline (when adding/changing routes)

Routes must be **byte-identical** for the client: same URL, method, query/body, HTTP status, `Set-Cookie`, and JSON body — including bespoke error strings. Nest defaults POST to **201**; add `@HttpCode(200)` where the contract returns 200. Declare static sub-routes (e.g. `/reorder`, `/in-app/all`) **before** `:id` param routes. Trip-scoped handlers verify trip access (404) and permission (403) per handler.
