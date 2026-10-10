# Nest modules: blueprint and test guide

Every request goes through Nest; Express is only the platform underneath
`@nestjs/platform-express`. Each domain is a DI module in this folder.
**Weather (`weather/`) is the reference implementation**: copy its shape for a
new domain. The rules every module follows (repositories, transactions,
config, outbound fetch, money) are in `server/CLAUDE.md`; this file is the
shape and the reasoning behind it. How the code got here, from the legacy
services layer and its bridges, is in `server/docs/nest-migration-history.md`.

## Module layout (per domain)

```
shared/src/<domain>/<domain>.schema.ts      # Zod contract, the single source of truth
server/src/nest/<domain>/<domain>.service.ts     # business logic, an injectable provider
server/src/nest/<domain>/<domain>.controller.ts  # REST routes, thin: validate, call the service, shape the reply
server/src/nest/<domain>/<domain>.module.ts      # registered in app.module.ts
server/src/nest/<domain>/<domain>.mcp.ts         # MCP tools/resources/prompts (@Tool, @Resource, @Prompt)
server/src/nest/<domain>/<domain>.rpc.ts         # plugin RPC methods (@PluginMethod), see src/nest-rpc/rpc-kit/README.md
server/src/nest/<domain>/<name>.job.ts           # a cron, registered on scheduling/CronRegistrarService
server/src/nest/<domain>/<domain>.helpers.ts     # pure functions the service and its tests share
```

`weather/` has every piece: `weather.controller.ts`, `weather.service.ts`,
`weather.module.ts`, `weather.mcp.ts`, `weather.rpc.ts`, and `weather.impl.ts`
for the outbound client with its deadline and size cap.

- Register the module in `app.module.ts` and it is live.
- SQL lives in repositories under `src/db/repositories/`, injected into the
  service; multi-statement writes go through `UnitOfWork.transactional(...)`
  (`database/unit-of-work.ts`). Outside an HTTP request (MCP, RPC, WS, cron)
  open a context with `withRequestContext()` (`database/request-context.ts`).
- A domain that outgrows one class is split into modules, never grown: trips is
  trips, trip-members, trip-membership, trip-invite, trip-read-model and
  calendar.
- The MCP tool and the REST route are adapters over the same service method and
  the same permission check. A validation or permission change lands on both in
  the same change.
- The legacy services layer under src/ is deleted, and ESLint refuses any
  import of a `services/` path. There are no `*.bridge.ts` files either; do not
  add one.

## Reaching the container from outside it

Code that runs outside the container never builds a second instance of a
provider with `new`. `bootstrap.ts` resolves the singleton with `app.get(...)`
before `app.init()` and hands it in: the `httpConfig.KEY` namespace, the
`DatabaseLifecycle` that opens the connection, and the `StorageService` the
platform upload routes write through.

Express middleware that needs DI has two mounts:
`consumer.apply(...).forRoutes('<concrete path>')` in a module's `configure()`
(an Express prefix mount; `OauthModule` mounts the MCP SDK's authorize and
register routers that way), or, for middleware that must see the original
`req.url`, a pathless `app.use` in `bootstrap.ts` over a container-resolved
factory provider (`MCP_METADATA_MIDDLEWARE`). `mcp-transport/` (the `/mcp`
controller and service) and `mcp-shared/` (`McpToolGuardsService` for the
`*.mcp.ts` classes) are the module shapes for MCP.

A decorator's options are built while the class is defined, so an MCP `when:`
gate cannot reach `this`. `src/nest-mcp/` hands the gate its declaring
instance, and `addons/addon-gate.ts` turns that into `addonGate(ADDON_IDS.X)`
over an injected `AddonsService`.

## Cross-cutting pieces

- `common/`: the exception filter, the Zod validation pipe, the idempotency
  interceptor (`X-Idempotency-Key` replay), `validate-route-guards.ts`, and
  stateless helpers (`avatarUrl`, `conflictResult`, `demo`, `passwordPolicy`,
  `timezoneService`, `cookie`, `rowShape`, `geo`, `crypto/`). The helpers are
  free functions on purpose: numbered migrations and `src/demo/demo-seed.ts`
  import them from outside the container. `geo.ts` keeps the clamped haversine,
  since `asin` of a value a hair over 1 is NaN and a NaN distance fails every
  comparison silently.
- `auth-core/`: the request-auth kernel every controller imports: the guards
  (`JwtAuthGuard`, `OptionalJwtAuthGuard`, `CookieAuthGuard`, `AdminGuard`, the
  global `GlobalAuthGuard` and `MfaPolicyGuard`), `@CurrentUser()`, `@Public()`/
  `@OptionalAuth()`, JWT verification and the ephemeral download/ws tokens. It
  imports no domain, so `lint:boundaries` treats it as shared kernel like
  `common/`; `auth/` keeps the account flows (login, MFA, passkeys, sessions).
- `auth-core/jwt-verify.ts`: `extractToken` and `verifyJwtAndLoadUser`, the one
  session check behind the guards, the MCP bearer path and the download token.
  `JWT_SECRET` stays a live binding from `src/config.ts`, because the admin panel
  rotates it at runtime and a `registerAs` token would freeze the boot value.
- `addons/addon.guard.ts` with `@RequireAddon(addonId, label)`: declare
  `AddonGuard` before `JwtAuthGuard`, so a disabled addon answers 404 to an
  anonymous caller instead of revealing itself with a 401.
- `trip-membership/` (`joinTripAsMember` and the id-level membership reads) is a
  leaf module because auth, trip-invite, oidc and the plugin host all need it.
  `query-helpers/` holds the batch loaders that keep list endpoints off N+1.
- `storage/`: the driver contract in `storage.types.ts` (opaque keys, no rename
  or append), the local, S3 and mirror drivers in `drivers/` behind one contract
  suite (`tests/unit/nest/storage/storage-driver.contract.ts`), the registry in
  `storage-registry.service.ts`, and the admin surface. Domain services never
  touch the filesystem or the S3 SDK.
- `memories/photo-provider.ts` and `providers/`: photo backends behind
  `PhotoProviderRegistry.get(id)`. `PhotoAssetRef` exists because two services
  took the same three ids in different orders. `local` is not a provider; both
  dispatch sites branch on it.
- `realtime/`: `/ws` as a Nest gateway. `ws-state.ts` is module state on purpose
  (test harnesses build `RealtimeService` outside the container). The socket id
  stays a monotonic integer, because `broadcast` excludes the originator with
  `Number(excludeSid)`. `trek-ws.adapter.ts` builds the ws server itself so
  `verifyClient` keeps the origin check, and attaches the per-socket `error`
  listener first. `buildApp()` binds the adapter to the http server before
  `app.init()`.
- `geo/`: the one Nominatim client (`nominatimFetch` in `nominatim.client.ts`),
  with the throttle cursor and the cache as module state, two lanes
  (interactive ahead of background), a cache key that carries the query shape,
  and the `AbortSignal.timeout` built after the throttle wait.
  `setGeoThrottleInterval(ms)` is the test seam.
- `scheduling/`: `CronRegistrarService` is the only way to schedule. Never a
  `@Cron` decorator; it bypasses the test-time gate and the lease.
- `app-config/`: the `@nestjs/config` binding. Inject a boot-stable namespace
  through its `registerAs` token, or read runtime-toggled values through
  `RuntimeEnvService` / `readEnv()`; never `process.env`. The classification is
  in `src/app-config/README.md`.

## Guards

Authentication is default-deny: `GlobalAuthGuard` is an `APP_GUARD`, and a
route is authenticated unless it carries `@Public(reason)` or
`@OptionalAuth(reason)`, or declares its own `@UseGuards` chain. Adding a
`@Public()` route is not a local decision: `validateRouteGuards` refuses to
boot unless the route is also in `PUBLIC_ROUTE_ALLOW_LIST`
(`common/validate-route-guards.ts`), and stale entries fail too.

`permissions/trip-access.guard.ts` resolves `:tripId` once, answers 404
"Trip not found" for anything the user cannot reach (never 403, which would
confirm the id exists) and hands the row to the handler through `@Trip()`;
`@RequirePermission` carries the action string. Two limits:

- A guard runs before the body pipe, so a route whose validation must answer
  400 ahead of the trip 404 keeps an in-handler check (places' create, update
  and import routes).
- A guard runs before interceptors, so a multipart upload checks in the handler:
  a 404 sent while the client still streams resets the socket (ECONNRESET).

`permissions/trip-owner.guard.ts` (`@RequireTripOwner(message)`) demands
ownership, `trip.user_id === user.id`, and deliberately does not go through
`PermissionsService`, which says yes to every admin. The services keep
`verifyTripAccess`/`canEdit` anyway: most callers are `*.mcp.ts` tools, which
never pass an HTTP guard.

## Parity is law

A route is byte-identical for the client: same URL, method, query/body, HTTP
status, `Set-Cookie` and JSON body, bespoke error strings included. Where a
route answers with a hand-written error (weather's
`{ error: 'Latitude and longitude are required' }`), the controller reproduces
it instead of leaning on the generic pipe envelope.

- Nest defaults POST to 201; add `@HttpCode(200)` where the contract says 200.
- Declare static sub-routes (`/reorder`, `/in-app/all`) before `:id` routes.
- Reproduce bespoke wording exactly: notifications' `test-smtp` answers
  `{ error: 'Admin only' }`, not the AdminGuard's `Admin access required`.
- Trip-scoped routes forward `X-Socket-Id` to the broadcast.
- `@Global()` only reaches modules in the graph: a `TestingModule` built around
  one domain imports `AppConfigModule` explicitly if a provider needs
  `RuntimeEnvService`.
- A module-scoped registry that outside code writes into stays a module, not a
  provider (the notification channel registry, `oauth/oauth.pending-codes.ts`);
  a second provider instance would hold a second, empty registry.
- No self-registration by side-effect import: the built-in notification
  channels are built from injected transports in `NotificationsService`'s
  constructor.
- A guard with a constructor dependency has to be a registered provider
  wherever it is used, which is why the three auth guards stay dependency-free.

## Refusals: one error, both channels

A service refuses by throwing a `DomainError` (`common/domain-error.ts`) with
the status and the exact text the client sees, `throw forbidden('Admin access
required')`, never by returning `{ error, status }` for each caller to
translate. The global filter writes it as `{ error, ...details }` at its status,
and the MCP registry's error mapper (`trekMcpErrorMapper` in
`src/mcp/nest-mcp-policy.ts`) answers the tool call with `errorResult` of the
same text, so the controller and the tool need no branch of their own. A caller
that has to act on a refusal before passing it on (an audit row, a timing pad)
uses `catchDomainError`. `npm run lint:service-http` holds the old idioms
(`status: 4xx` in a service, `new HttpException` in a service, `if (result.error)`
in a controller or tool) to a count that only shrinks.

A trip-scoped write that both surfaces offer is one service method per use
case (`AccommodationsService.createStay`, `PackingWritesService.updateItem`):
the trip gate (`requireTripWrite` in `common/trip-writer.ts`), the reference
checks, the transaction and every event. The controller hands it a REST
writer, the tool `McpToolGuardsService.tripWriter`; the writer says how the
events travel, the use case which ones go out, so a client sees the same
events whichever surface made the change.

## Tests

Every module ships two kinds of tests.

1. **Unit**: `tests/unit/nest/<domain>.controller.test.ts` and
   `<domain>.service.test.ts`. Build the class directly with its collaborators
   (no `overrideProvider`); assert status codes, the exact `{ error }` bodies and
   how inputs are forwarded. Parity assertions live here; there is no separate
   parity directory. See `tests/unit/nest/weather.controller.test.ts`.
2. **e2e**: `tests/e2e/<domain>.e2e.test.ts` boots the module against a temp
   SQLite through `tests/e2e/harness.ts` (`createTempDb`, `seedUser`,
   `sessionCookie`) and runs the real `JwtAuthGuard`: 401 without a cookie, 200
   with a signed session. Mock external I/O only. See
   `tests/e2e/weather.e2e.test.ts`.

Seed and read rows through the ORM factories in `tests/helpers/factories/`;
raw `.prepare()` fixtures are legacy that `lint:test-sql` only lets shrink.

`tests/` is outside the build's `include`, so a constructor that grows a
parameter does not break a hand-wired `new` in a test at build time;
`npm run typecheck:tests` is the gate that catches it.

**Coverage is a ratchet per domain.** `server/vitest.config.ts` holds one
threshold entry per `src/nest/<domain>/` (floor 80 %, most pinned higher), and
`tests/unit/coverage-thresholds.test.ts` fails on a folder without one. After
a run that raised coverage, regenerate the block with
`node scripts/coverage-thresholds.mjs` (it reads the JSON coverage summary,
not the per-directory text report); never lower an entry. Only `src/nest/**`
is measured, so moving code into this tree starts measuring it: run
`npm run test:coverage` before pushing such a move.

## Definition of done (per module)

Contract in `@trek/shared` → service over injected repositories → controller
with the routes, statuses and bodies of the contract → the parallel MCP tool on
the same service and permission → unit and e2e tests → module registered in
`app.module.ts` → the client calls it through the typed contract.
