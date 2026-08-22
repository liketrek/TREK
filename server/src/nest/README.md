# NestJS migration layer — module & test guide

This folder holds the co-hosted NestJS app that incrementally strangles the legacy
Express API (see the "Brownfield Rewrite" board). Until a prefix is migrated, the
top-level dispatcher in `src/index.ts` routes it to the legacy app; migrated
prefixes go to Nest. **Weather (`weather/`) is the reference implementation** — copy
its shape when migrating a new domain.

## Module layout (per domain)

```
shared/src/<domain>/<domain>.schema.ts(.spec.ts)   # Zod contract — single source of truth
server/src/nest/<domain>/<domain>.service.ts        # business logic (ported 1:1 from the Express service)
server/src/nest/<domain>/<domain>.controller.ts     # same routes/verbs/params/status codes as Express
server/src/nest/<domain>/<domain>.module.ts         # registered in app.module.ts
```

Register the module in `app.module.ts` and it is live. There is no routing gate to
flip any more: **every request goes through Nest**. The `strangler.ts` matcher and
its `DEFAULT_NEST_PREFIXES` / `NEST_PREFIXES` escape hatch are gone — Express only
remains as the platform underneath `@nestjs/platform-express`.

## Migrated so far

- **Phase 1 (leaf):** weather, airports, config (public), system-notices, maps,
  categories, tags, notifications, atlas.
- **Phase 2 (trip sub-domains):** vacay (addon), packing, todo.
- **DI-native services (legacy `src/services/*` deleted):** tags, categories,
  todo, packing, day-notes, trip-invite, assignments, share, settings, files,
  collab, vacay, reservations, day, permissions, audit, budget, trip, maps,
  transit, place, transit-itinerary, collections, atlas, auth, oidc, passkey,
  notifications, admin, webauthn-config, user-cleanup, oauth, wiki, mailer,
  notification transports, notification preferences, memories (immich, synology,
  unified, photo-resolver, thumbnails, trek-photo cache), journey, journeyShare
  — see the migration recipe below.
- **Foundation (BE-Phase 1, complete):** the eight stateless helpers moved to
  `common/`; every trip-access check routes through `DatabaseService`
  (`services/tripAccess.ts` and the dead `middleware/tripAccess.ts` are gone);
  `queryHelpers` and `tripMembership` are providers; every cron is a domain
  `*.job.ts` provider on `scheduling/CronRegistrarService` (`src/scheduler.ts`
  is deleted).
- **Plugin RPC surface (BE-7, complete):** all 113 wire methods are
  `@PluginMethod` / `@PluginOpenMethod` handlers on `@PluginController()` providers
  in their own domains (`<domain>/<domain>.rpc.ts`; the three that belong to no
  domain live in `plugins/host/rpc/`), and all 18 host-to-plugin hook contracts are
  `@PluginHook` declarations on `PluginHooks`. `PluginRpcHost` no longer holds a
  handler: it builds the granted subset of the dispatch map from the registry,
  dispatches, audits and maps errors. `PluginHostDepsFactory` — the 26-argument
  wiring sheet named throughout the log below — is now
  `PluginRpcHostFactory` and injects two things. See
  `plugins/host/rpc-kit/README.md`.
- **Plugin module split (complete):** `PluginsModule` was 21 controllers, 24 domain
  imports and 10 providers in one class, so `AdminModule` importing it for one
  cascade-disable call inherited the whole graph. It is now `PluginsRuntimeModule`
  (supervisor, capability router, hook contracts — the half with the domain imports),
  `PluginContributionsModule` (the 14 read-only hook controllers, in
  `plugins/contributions/`), `PluginOAuthModule` (`plugins/oauth/`) and a composition
  root holding the install and delivery controllers. `AdminModule` imports the runtime
  alone. Note the invariant the boot-time coverage check now depends on: importing
  `PluginsRuntimeModule` must pull in EVERY domain that owns part of the wire surface,
  which is why `WeatherModule` sits in its import list.
- **Guards (BE-Phase 2, done):** the JWT verify lives in `auth/`, and
  `middleware/auth.ts`, `validate.ts`, `idempotency.ts` and `mfaPolicy.ts` are
  deleted; the three addon guards are one `AddonGuard` + `@RequireAddon`; the
  demo-mode block is one condition. `TripAccessGuard` and `TripOwnerGuard` cover
  the trip-scoped and owner-only routes.

  **Authentication is default-deny.** `GlobalAuthGuard` is an `APP_GUARD`: a route
  is authenticated unless it carries `@Public(reason)` or `@OptionalAuth(reason)`,
  or declares its own `@UseGuards` chain. A controller that declares a chain keeps
  it — global guards run before route guards, so an addon-gated controller has to
  stay in charge of answering 404 before anything answers 401, or the response
  leaks which addons are installed. The global guard still *resolves* the user in
  that case, without refusing, because `MfaPolicyGuard` runs behind it and reads
  `req.user`.

  Adding a `@Public()` route is not a local decision: `validateRouteGuards` runs in
  `buildApp()` and refuses to boot unless the route is also in
  `PUBLIC_ROUTE_ALLOW_LIST` in `common/validate-route-guards.ts`. That list is the
  whole anonymous surface of the server, in one reviewable place. Stale entries
  fail too.

**`src/services/` is gone.** It was the legacy layer this whole migration existed
to empty, and the last of it — `airtrail/`, 1305 lines of plain functions over the
better-sqlite3 singleton — folded into `integrations/`. An ESLint
`no-restricted-imports` rule now refuses any import of a `services/` path, because
the directory disappearing is not what keeps it gone: it grew one reasonable file
at a time. Backup made the same trip earlier: `services/backupService.ts` is
`nest/backup/backup.impl.ts`, imported only by its own domain, and it stays a
module of free functions rather than becoming methods because the restore path
closes and reinitializes the core DB handle — rewriting that shape in the same
step as the move would make a regression there impossible to bisect.

Note that the trip-access and `canEdit` methods on the domain services are **not**
dead weight waiting for a guard: their callers are overwhelmingly the `*.mcp.ts`
tools, which never pass through an HTTP guard. In the five domains piloted for
`TripAccessGuard`, 40 of the 46 callers are MCP; only 6 sit in controllers.

## Cross-cutting Foundation pieces

- `common/idempotency.interceptor.ts` — global `APP_INTERCEPTOR` replaying the
  client's `X-Idempotency-Key` on mutations. It replaced the `applyIdempotency`
  middleware, which is deleted; this is the only implementation.
- `common/` — the stateless helpers (`avatarUrl`, `conflictResult`, `demo`,
  `passwordPolicy`, `timezoneService`, `cookie`, `rowShape`, `geo`, `crypto/`).
  Free functions, not providers: `db/migrations.ts` imports them from outside the
  container and could not inject one. `geo.ts` holds the two haversines; there
  were three implementations of the metre variant, differing by one clamp, and
  the clamped form is the one kept — `asin` of a value a hair over 1 is NaN, and
  a NaN distance silently fails every comparison it feeds instead of throwing.
  `maps.helpers.ts` re-exports `haversineMetres` rather than defining it, because
  callers and a test import it from there.
- `auth/jwt-verify.ts` — `extractToken` + `verifyJwtAndLoadUser`, the canonical
  session check behind the four guards, the MCP bearer path and the file-download
  query token. Free functions for the same reason.
  `JWT_SECRET` stays a live binding from `src/config` and must NOT move to
  `app-config`: the admin panel rotates it at runtime, and a `registerAs` token
  would freeze the boot value.
- `query-helpers/` — the batch loaders that keep list endpoints off N+1 queries.
- `trip-membership/` — `joinTripAsMember`. Its own module rather than folded into
  auth or trip-invite, because both call it (as do oidc and the plugin host) and
  either home would put `AuthModule` and `TripInviteModule` in a cycle.
- `addons/addon.guard.ts` + `@RequireAddon(addonId, label)` — the addon route
  gate. Declare `AddonGuard` **before** `JwtAuthGuard`: a disabled addon has to
  answer 404 to anonymous callers, so the addon check must beat the 401.
- `common/demo-write.ts` — `isDemoWriteBlocked`, the demo-mode upload block. A
  function and not a guard on purpose; see the gotcha below.
- `storage/` — the storage abstraction and its admin surface. `storage.types.ts`
  defines the driver contract (opaque keys, no rename/append — S3 constraints
  baked in) plus the `ServedCategory` seam: `STORAGE_CATEGORIES` (shared, 8,
  configurable) + the legacy `photos` directory that is served and backed up
  but not configurable. `drivers/` (local, s3, mirror) all pass one contract
  suite (`tests/unit/nest/storage/storage-driver.contract.ts`).
  `storage-registry.service.ts` merges built-ins ← env (`place-photos-local`)
  ← `app_settings` rows, validates semantics (references, no mirror nesting),
  falls back to last-good/defaults at boot but NEVER on admin writes
  (`preview()` runs the real build first), seeds once from
  `data/storage-config.json`, and hot-swaps on `reload()`.
  `storage.service.ts` is the facade every byte-path uses.
  `storage-admin.{controller,service}.ts` (+ `storage-secrets.ts`,
  `storage-probe.ts`) carry `api/admin/storage`: masked GET of the effective
  world, full-document PUT (unmask → preview → encrypt → one transaction →
  reload → audit), and per-target test probes with ephemeral drivers. Secrets
  live `enc:v1:`-encrypted inside the `storage.backends` JSON (the implicit
  key covers installs without an explicit `ENCRYPTION_KEY`). The client
  presents mirrors as replicas-on-primary; the wire keeps explicit mirror
  backends. `storage-jobs.service.ts` runs backfill and category-migration
  jobs (one at a time, TTL'd statuses).
- `memories/photo-provider.ts` + `providers/` — the PhotoProvider seam (#584).
  Dispatch to a photo backend was a `switch (photo.provider)` in three places
  (`photo-resolver.service.ts` twice, `journey-public.controller.ts` once, where
  anything that was not Immich got handed to Synology). It is
  `PhotoProviderRegistry.get(id)` now, over adapters registered under the
  `PHOTO_PROVIDERS` multi-provider token in `memories.module.ts` — adding a
  backend is one registration.
  - Adapters, not `implements` on the services: ImmichService and
    SynologyService are also the album/browse surfaces, with their own argument
    orders and return shapes. The mapping lives in the adapter.
  - `PhotoAssetRef` exists because the two services took the same three values
    in different orders — `(userId, assetId, ownerId)` against
    `(userId, targetUserId, photoId)`. A transposition compiled cleanly and
    served another user's photo.
  - `local` is deliberately NOT a provider. It is storage on this disk, it has
    no row in `photo_providers`, and its "asset info" comes from the DB row
    rather than from a backend. Both dispatch sites branch on it explicitly.
  - The rename `memories/` → `media/` was considered and dropped: it is 275
    files of import churn, and `scripts/coverage-thresholds.mjs` buckets on one
    path segment, so merging `photos/` into it would collapse two ratchet
    entries into one and drop the stricter of the two.
- `realtime/` — the /ws transport, as a Nest gateway.
  - `realtime.gateway.ts` owns the connection lifecycle and the handshake, with
    `DatabaseService` and `EphemeralTokenService` injected instead of imported.
    It replaced `setupWebSocket(server)`, which index.ts kicked off with a
    dynamic import after listen().
  - `ws-state.ts` holds the socket registry, and that is **module state on
    purpose**. The no-Nest test harnesses build `new RealtimeService()`
    outside the container and 115 test files `vi.mock` the `src/websocket`
    stub; rooms on a provider instance would leave their broadcasts going to
    an empty map, with no error and no log. Same reasoning as the geo
    throttle cursor.
  - `trek-ws.adapter.ts` exists because the stock `WsAdapter` dispatches on
    `{ event, data }` and every deployed client sends `{ type, tripId }`. It
    also builds the ws server itself rather than delegating: the base's port-0
    branch uses `noServer: true` and performs the upgrade from its own registry,
    which never consults `verifyClient`, so delegating would silently drop the
    origin check. The per-socket `error` listener is attached FIRST, because an
    unhandled one kills the process (#1576), and the flood guard counts every
    inbound frame before parsing, because malformed frames are the ones worth
    limiting.
  - The socket id stays a **monotonic integer**. The client echoes it as
    `X-Socket-Id` and `broadcast` excludes the originator with
    `Number(excludeSid)`; a uuid is `NaN`, `NaN === NaN` is false, and every
    client would receive its own writes back. It shows up as drag-and-drop that
    jumps, not as an error.
  - `RealtimeGatewayModule` is imported by AppModule alone. RealtimeModule is
    @Global, so a gateway there follows into every hand-assembled TestingModule,
    and Nest's SocketModule then loads an adapter none of them set: it reaches
    for `@nestjs/platform-socket.io` and calls `process.exit(1)` when it is
    absent.
  - `buildApp()` creates the http server and binds the adapter to it BEFORE
    `app.init()`, and callers take it from `getHttpServer()`. Nest binds gateways
    during init, so an adapter registered later binds nothing, and one given the
    app instead of the server binds to Nest's internal server, which this process
    never listens on. Either way the boot is green and no browser can connect.
  - `src/websocket.ts` survives as a re-export. 115 test files `vi.mock` that
    path to assert on broadcasts; repointing them all would be a large diff that
    proves nothing.

- `geo/` — the ONE Nominatim client (#576). There used to be two: atlas
  throttled to the published 1.1s and cached its answers, maps did neither, so
  five interactive routes fired straight at the service while the atlas loops
  politely waited and OSM saw a single instance ignoring its rate limit. Both
  domains now go through `nominatimFetch`.
  - The throttle cursor and the cache are **module state, not provider state**,
    for the permissions-cache reason: the no-Nest test harnesses build their
    collaborators with `new`, outside the container, and a second copy of the
    cursor is the very bug the fold removes. `GeoModule` is registered straight in AppModule and neither
    `MapsModule` nor `AtlasModule` imports it — an import would claim an
    injection edge that does not exist.
  - `GeocodingService` owns exactly one thing: the cache-cleanup timer's
    lifecycle, via `OnModuleInit`/`OnModuleDestroy`. Atlas used to start that
    interval as an import-time side effect, documented as a parity exception. It
    is not one any more.
  - Two lanes over one cursor. Interactive calls (`/api/maps/search`,
    `/autocomplete`, `/details`, `/reverse`, `/resolve-url`) take the next slot;
    background calls (the atlas enrichment loops, which walk every uncached
    place) yield to anything queued on a request path.
  - The cache key carries the **query shape**, not coordinates alone. Atlas asks
    at zoom 3 and zoom 8, maps at zoom 18; a coordinate-only key answered a
    street lookup with a country.
  - `AbortSignal.timeout` is built **after** the throttle wait. Built up front,
    the 1.1s spent queueing would eat nearly half of the identity lookup's 2.5s
    budget before the socket opens.
  - `setGeoThrottleInterval(ms)` is a test seam, and `tests/setup.ts` zeroes it.
    Nineteen maps cases drive these paths back to back with real timers; at the
    real interval they slept nineteen seconds and covered nothing extra. A
    function rather than a `NODE_ENV` check, for the reason app-config exists.

### Reaching the container from outside it

Two shapes, and the choice is settled:

**Prefer handing the dependency in.** `bootstrap.ts` hands the `/mcp` handler
its registry via `setMcpRegistry(app.get(...))` after `buildApp()` — the
outside code names the capability it needs, structurally, never the provider
class, so no module cycle can close through it. (The retired `src/scheduler.ts`
was the fullest example — a structural `SchedulerDeps` interface filled by
`index.ts` — until every cron became an in-container `*.job.ts` provider and
the seam disappeared entirely, which is the real endgame for this shape.)

**`<domain>.bridge.ts` is a retired shape** — zero bridge files remain since
the MCP/OAuth mount moved behind the container (2026-08-11). It served code
that ran before `app.init()` and so could not inject; its cost was real: a
bridge rebuilt its services with `new`, so adding one constructor parameter to
a service meant hand-editing every bridge that constructed it — five of them in
one PR, at the worst. If a pre-init consumer ever reappears, prefer the
`bootstrap.ts` pattern instead: resolve the container singleton with
`app.get(...)` before init (the `httpConfig.KEY` / discovery-metadata
precedent) rather than minting a second instance.

**Express middleware with DI has two honest mounts** (first used by the mount
migration): `consumer.apply(...).forRoutes('<concrete path>')` in a module's
`configure()` — an Express prefix mount, exactly the legacy `app.use('/path')`
semantics, which is how `OauthModule` mounts the MCP SDK's authorize/register
routers and `PlatformModule` the consent-COOP override — and, for middleware
that must see the ORIGINAL `req.url` (a wildcard `forRoutes()` is a pattern
mount that strips the matched prefix), a pathless `app.use` in `bootstrap.ts`
over a container-resolved factory provider (`MCP_METADATA_MIDDLEWARE`).
`nest/mcp-transport/` (the /mcp controller + service over injected services)
and `nest/mcp-shared/` (`McpToolGuardsService` for the `*.mcp.ts` classes) are
the module shapes that replaced the last bridges.

**A bridge imported from INSIDE the container hides an edge from the module
graph**, which is a different problem from serving a genuine outside consumer.
Nine `*.mcp.ts` files did that with `addons.bridge` for one boolean each, and
not by preference: a decorator's options object is built while the class is
being defined, so the `when:` closure had no `this` to reach an injected service
through. `src/nest-mcp/` hands the gate its declaring instance now, and
`addons/addon-gate.ts` turns that into `addonGate(ADDON_IDS.X)` over an injected
`AddonsService`. `reservations.mcp.ts` (assignments) and `atlas.mcp.ts` /
`journey.mcp.ts` (auth) went the same way.

No in-container bridge uses are left. The last four folded 2026-08-11, and
their folds are the playbook for any edge that reappears — plain injection
would have closed a real cycle in every case, so each cut the knot with a
finer-grained module instead:

- `budget.mcp.ts` / `packing.mcp.ts` / `costs.rpc.ts` → `trips.bridge`:
  everything that owns the hydrated trip reads (TripsService,
  TripReadModelService, TripMembersService) lives in modules importing the
  budget/packing domains, so the consumers moved instead — the id-level
  membership reads went to the dependency-free `TripMembershipModule`
  (`getOwnerId` / `listMemberUserIds` / `listAccessibleTripIds`) and the two
  cross-domain prompts moved above the read model onto
  `trips/trip-prompts.mcp.ts`. `trips.bridge` (102 lines, ~25 hand-built
  services) is deleted.
- `places.mcp.ts` → `assignments.bridge`: the cycle `DaysModule →
  PlacesModule → AssignmentsModule → DaysModule` is real, but only
  AssignmentsMcp needs DaysService — the service itself does not, so it moved
  to a leaf `AssignmentsDomainModule` (the journey-domain split) that
  PlacesModule imports. `assignments.bridge` is deleted.
- `reservations.controller.ts` → `airtrail.bridge`: the pull genuinely needs
  ReservationsService, so `AirtrailModule` keeps it — but the write-back push
  only needs the hydrated reservation READ. That read became
  `ReservationsReadRepository` (leaf, the trek_photos pattern), the link
  lifecycle + push became `AirtrailLinkService` in `AirtrailCoreModule`, and
  the controller injects it. `airtrail.bridge` is deleted, and
  `notifications.instance.ts` — whose last consumer it was — died with it.

Two more were on this list and folded 2026-08-11:

- `auth/user-cleanup.service.ts` → `budget.bridge` died when `BudgetModule`
  dropped its `AuthModule` import (BudgetMcp's demo guard reads
  `RuntimeEnvService` + the users table via `isDemoUserId`, not
  `AuthService`), which let `AuthModule` import `BudgetModule` and
  `UserCleanupService` inject `BudgetService`. `budget.bridge` is deleted.
- `backup/backup.impl.ts` → `permissions.bridge`: the restore path is free
  functions, not a provider, so there is nothing for an injected service to
  hang off — but the thing it needs is the cache, not the service. The cache
  moved to `permissions/permissions-cache.ts` (the `oauth.pending-codes.ts`
  precedent) and `backup.impl` imports the plain `invalidatePermissionsCache`
  from there.

`files.bridge` used to be on the list and is gone, resolved 2026-08-10 exactly
as predicted: `MulterModule.registerAsync` over an `AllowedFileTypesService`
leaf, and `files.controller.ts` / `journey.controller.ts` build their multer
options from that. `systemNotices/conditions.ts` similarly stopped importing
`addons.bridge`: the enablement check is threaded in through
`ConditionContext.addonEnabled` by the DI-native `SystemNoticesService`.

`days`, `packing`, `photos` and `reservations` had no production consumer left
and are deleted. Each still built a service outside the container at module load
for nobody, and three domain docblocks were still sending readers to them. The
cases that exercised them kept their assertions and point at the service.
`journey.bridge` died 2026-08-11 with `src/mcp/resources.ts`, when the last
four legacy resources became `@Resource`/`@ResourceTemplate` methods on
`journey.mcp.ts`.

Five bridges remain, all pinned by the one pre-`app.init()` MCP/OAuth mount
(`addons`, `audit`, `auth`, `oauth`, `permissions` — shrunk to the exports that
seam consumes) and all dying together if that mount ever moves behind the
container. When one loses its last outside-container consumer, delete it in
the same change rather than leaving it as a courtesy: an unused bridge reads
as a supported entry point.

The nine fire-and-forget notification senders inject too. They were lazy
`import('../notifications/notifications.bridge').then(({ send }) => …)` calls
working around a cycle that no longer exists, and the laziness hid the edge
while handing each send a NotificationsService built outside the container.

That sweep needed a method, because `tests/` sits outside `tsconfig`'s `include`:
a missed constructor argument does not fail to compile, it arrives as
`undefined`. Adding `tests` to a throwaway `tsconfig` and diffing the errors
before and after named all **46** hand-wired `new` sites exactly; a grep would
have been a guess. Worth repeating for any change that widens a service
constructor — and worth knowing that such a config reports **288 pre-existing
errors** in the suites, almost all deliberate partial constructions in the
harnesses (`new AuthService(db, permissions, atlas)` where the class takes six).
That is why `tests/` is not in the build's `include`, and cleaning it up is its
own piece of work.

`notifications.instance.ts` held the out-of-container `NotificationsService`
for the cycle-dodge bridges and died 2026-08-11 with the last of them
(`airtrail.bridge`) — every production consumer injects the container
singleton now. The module-scoped channel registry it leaned on stays (the
no-Nest test harnesses still construct instances; CHOVR-015 pins the
sharing).
- `app-config/` — the `@nestjs/config` binding (`AppConfigModule`, global). Never
  read `process.env` in a module (ESLint enforces this): inject a boot-stable
  namespace via its `registerAs` token (`@Inject(mcpConfig.KEY) … ConfigType<…>`)
  or read runtime-toggled values live through `RuntimeEnvService` / `readEnv()`
  from `src/app-config`. The classification and invariants live in
  `src/app-config/README.md`.

## Parity gotchas worth remembering

- A POST that answers with `res.json` in Express stays **200**; add `@HttpCode(200)`
  (Nest defaults POST to 201). Creates that Express sends as 201 need nothing.
- Static sub-routes that collide with a `:id` param (e.g. `/in-app/all` vs
  `/in-app/:id`, `/reorder` vs `/:id`) must be declared **before** the param route.
- Reproduce bespoke admin/error wording exactly — e.g. notifications' `test-smtp`
  returns `{ error: 'Admin only' }`, not the AdminGuard's `Admin access required`.
- Trip-scoped routes verify trip access (404) and the relevant permission (403)
  per handler and forward `X-Socket-Id` to the WebSocket broadcast.
- **Never gate a multipart upload with a guard.** Guards run before the parser,
  so throwing from one leaves the request body unread and Node resets the
  connection — the client sees `ECONNRESET`, not your 403. Check inside the
  handler, after the interceptor has drained the upload. `PROFILE-015` is the
  regression test.
- **`@Global()` only applies to modules that are in the graph.** An e2e
  `TestingModule` built around one domain module does not get `AppConfigModule`
  for free just because it is global: a provider injecting `RuntimeEnvService`
  fails to resolve and takes every suite importing that module down with it.
  Import it explicitly, the way `PermissionsModule` is handled.
- **A module-scoped registry that outside code writes into must stay a module,
  not a provider.** The notification channel registry is the live example:
  `PluginRuntimeService` pushes its channel getter in at `onModuleInit`, and
  `notifications.instance.ts` builds its own `NotificationsService` for the
  surviving cycle-dodge bridges. As a provider that instance would get a second,
  empty registry and every plugin channel would go quiet — with no error
  anywhere. `CHOVR-015` is the regression test. Same reasoning as
  `oauth/oauth.pending-codes.ts`.
- **Self-registration by side-effect import is a trap.** The built-in channels
  used to register because `notificationPreferencesService` happened to `import
  './notifications/builtins'`. Dropping that one line would have silenced email,
  webhook and ntfy without a failure. They are built from injected transports and
  registered in `NotificationsService`'s constructor now, so every path that can
  dispatch has them.
- **The coverage gate reads `src/nest/**` and nothing else.** Moving code in from
  `src/mcp/` or `src/services/` does not just relocate it — it starts being
  measured. PR #1844 landed `airports.mcp.ts` at 0% branches because
  `search_airports`/`get_airport` had never had a test in either world, and the
  aggregate fell to 79.86% with every suite green. Before pushing anything that
  moves files into this tree, run `npm run test:coverage`, not just `npm test`.
- A guard with a constructor dependency has to be a registered provider
  everywhere it is used. The three auth guards are dependency-free on purpose —
  38 directories apply them and 21 do not import `AuthModule`, so giving them a
  dependency is its own migration, not a side effect of another change.

## Parity is law

A migrated route must be **byte-identical** for the client: same URL, method,
query/body, HTTP status, `Set-Cookie`, and JSON body — including bespoke error
strings. Where the legacy route returns a hand-written error (e.g. weather's
`{ error: 'Latitude and longitude are required' }`), reproduce that exact body in
the controller rather than relying on the generic `ZodValidationPipe` envelope.

## TripAccessGuard and TripOwnerGuard, and where they do not fit

`permissions/trip-access.guard.ts` resolves `:tripId` once per request, answers 404
"Trip not found" for anything the user cannot reach (never 403 — that would confirm the
id exists), and hands the row to the handler through `@Trip()`. `@RequirePermission`
carries the same action string the domain services pass to `checkPermission`.

Two limits are worth knowing before rolling it onto another controller, because both
were found the expensive way:

- **A guard runs before the body pipe.** Any route whose DTO validation is expected to
  answer 400 *ahead of* the trip 404 cannot use it. `places` is exactly that case — its
  e2e suite documents the pipe-first ordering as a deliberate parity shift — so its
  create/update/import routes keep their in-handler `requireTrip`, and that is not an
  oversight. Its five body-free routes (list, get, unrate, image, delete) do carry
  the guard; the split runs along "does this handler take a DTO-typed body", not
  along the domain.
- **A guard also runs before interceptors.** On a multipart upload route, a 404 sent
  while the client is still streaming destroys the socket, so the caller sees
  ECONNRESET instead of the 404. The three upload routes (files, collab note files,
  places) keep their own check for that reason; their controllers apply the guard per
  handler instead of on the class.

`permissions/trip-owner.guard.ts` is the stricter sibling: `@RequireTripOwner(message)`
demands that the caller *owns* the trip, not merely that they may edit it. Handing a
trip over and creating or deleting guests are the two things a collaborator must never
do however generous the trip's permission settings are.

It deliberately does **not** inject `PermissionsService`. `checkPermission` returns true
for every admin, and the trip actions are admin-lowerable, so routing ownership through
it would quietly hand any admin the ability to transfer other people's trips. The check
is the literal one the routes did by hand: `trip.user_id === user.id`. The message
travels in the metadata because the two call sites answer with different strings and
both are asserted.

The services keep `verifyTripAccess`/`canEdit` regardless: most of their callers are
`*.mcp.ts` tools, which never pass through an HTTP guard.

## Coverage is gated per domain, as a ratchet

`server/vitest.config.ts` carries one threshold entry per `src/nest/<domain>/`, set at
that domain's measured coverage minus one point. The single repo-wide 80% it replaced
let a well-covered domain subsidise a thin one — `booking-import` sits at 50% and
`integrations` at 20%, and the aggregate still cleared the bar, so either could have
lost another ten points with the build staying green.

Regenerate the block with `node scripts/coverage-thresholds.mjs` after a run that
RAISED coverage. Raise an entry when you improve a domain; never lower one to make a
build pass. The script reads `coverage/coverage-summary.json` rather than the text
reporter on purpose: the text reporter prints one row per DIRECTORY, so a domain with
subdirectories reads several points higher there than it actually is.

## How to write the tests

Every module ships two kinds of tests. The coverage gate (`vitest.config.ts`)
requires ≥80% over `src/nest/**` — note that it is an **average across the whole
tree**, not a per-file floor, so a large untested module can hide behind the
well-covered small ones.

1. **Service / controller unit spec** — `tests/unit/nest/<domain>.controller.test.ts`.
   Instantiate the controller with a mocked service; assert status codes, the exact
   `{ error }` bodies, and that inputs are forwarded correctly (defaults, coercion).
   See `weather.controller.test.ts`.

   Parity against the behaviour being replaced belongs here too — assert the exact
   status codes and bodies the old path produced. There is no separate
   `tests/parity/` directory; it was removed along with the routing toggle.

2. **e2e** — `tests/e2e/<domain>.e2e.test.ts`. Boot the Nest module against a temp
   in-memory SQLite db via the shared harness (`tests/e2e/harness.ts`:
   `createTempDb`/`seedUser`/`sessionCookie`), exercising the **real** `JwtAuthGuard`
   end-to-end (401 without cookie, 200 with a signed session). Mock external I/O
   (HTTP/etc.). See `weather.e2e.test.ts`.

## Definition of Done (per module)

Contract in `@trek/shared` → service ported 1:1 → controller with identical routes →
validation/error parity → unit + e2e tests, with the old behaviour asserted in the
unit test → module registered in `app.module.ts` → **then** decommission the legacy
service (separate step) → frontend points at the typed contract (Frontend Track).

## Migrating a legacy `src/services/*` service into its Nest module (recipe)

Pilot: **tags** (`services/tagService.ts` → `nest/tags/tags.service.ts` +
`nest/tags/tags.bridge.ts`); categories followed the same shape (and piloted the
first `@Resource` in `categories.mcp.ts`); todo followed too (and piloted the
first `@ResourceTemplate` plus the `when` addon gate in `todo.mcp.ts`, and the
first in-container consumer wiring: `TripsService` injects `TodoService` via
`exports: [TodoService]` instead of using the bridge); packing followed (the
largest port so far: a 17-tool + 2-resource `packing.mcp.ts` with inline admin
gates, and the first `PluginHostDepsFactory` swap done as part of a service
migration — no bridge entry for the plugin host); day-notes followed (the first
migration needing **no bridge at all**: after its three tools + resource moved
to `day-notes.mcp.ts` and the plugin host injection, nothing outside the
container consumed it); trip-invite followed (the smallest port: no MCP
surface, no plugin-host import and no bridge — the SQL folded straight into
`trip-invite.service.ts`); assignments followed (a 7-tool `assignments.mcp.ts`,
the plugin-host swap, and a bridge kept only for the two legacy registrars —
places and reservations — that borrow its existence checks; the batch loaders
stay in `services/queryHelpers.ts`, shared with the unmigrated place
service); share followed (never imported by the plugin host, and its three MCP
tools stay in the legacy trips registrar — their `trips:share` scope gate has
no declarative `access: { group, mode }` equivalent — so the port is the SQL
fold plus a 3-export `share.bridge.ts` for `mcp/tools/trips.ts`); settings
followed (no MCP surface, no bridge, and the first migration that converted an
in-container plain-function consumer into a provider instead of bridging it:
`llm-parse/llm-config.resolver.ts` became the injectable `LlmConfigResolver`,
injected by `LlmParseService` and `PluginHostDepsFactory`); files followed (no
MCP surface and no addon gate; the load-time constants + pure helpers consumed
by three controllers' module-scope multer configs moved to
`files.constants.ts`, and `files.bridge.ts` survives with a single export —
the request-time `getAllowedExtensions` app_settings read those configs need
outside DI — while every function consumer, including the plugin host and
`TripsService`, injects `FilesService`); collab followed (a 12-tool +
3-resource `collab.mcp.ts` that piloted **composite `when` gates** — the collab
addon AND the per-sub-feature `getCollabFeatures()` flags (notes/polls/chat)
that the legacy registrar and resources checked at registration time — plus
the plugin-host swap and a 3-export `collab.bridge.ts` for the two remaining
legacy consumers, `tripService`'s trip summary and `mcp/tools/trips.ts`);
vacay followed (the largest MCP port yet — a 26-tool + 3-resource
`vacay.mcp.ts`, including the first fixed-URI `@Resource` behind a `when`
addon gate — plus the plugin-host swap and a 1-export `vacay.bridge.ts` for
`tripService`'s trip-window entry shift; the DTO ratchet for its 13
grandfathered body contracts landed as a sibling commit); reservations
followed (the residue fold: the wrapper `ReservationsService` was already
DI-native at the edge, so the 626-line legacy module folded into it — a 5-tool
+ 1-resource `reservations.mcp.ts`, the plugin host's last plain-function
reservation import (`notifyBookingChange`) swapped for the injected service,
`TripsService` and `BookingImportService` converted from function imports to
injection, and a 9-export + 3-type `reservations.bridge.ts` for the legacy
`tripService`, the airtrail import/sync pair and the still-legacy transports
registrar (the transit registrar has since migrated to `transit.mcp.ts`); the
DTO ratchet for its 4 grandfathered body contracts
landed as a sibling commit, which also loosened the shared positions schema to
the real wire contract — `day_plan_position` optional, pinned by RESV-006);
day followed (the 592-line legacy `dayService` folded into the existing
wrapper `DaysService` — including the accommodation SQL that
`nest/reservations/accommodations.service.ts` now reaches via an injected
`DaysService` — with the hand-rolled `BEGIN`/`COMMIT` blocks in
reorder/insert converted to `db.transaction()`; a 7-tool + 2-resource
`days.mcp.ts`, the plugin host's 11-symbol import swapped for the injected
service, `TripsService` + the assignments/reservations MCP controllers
converted to injection, and a 6-export `days.bridge.ts` for the legacy
`tripService` and the still-legacy transports registrar (transit has since
migrated); the DTO
ratchet for its 4 day + 2 accommodation grandfathered body contracts landed
as a sibling commit);
permissions followed (the first Wave-2 **cross-cutting** migration and the
first greenfield module in the series — no prior wrapper, controller, MCP
surface or DTO of its own: a new `nest/permissions/` whose
`PermissionsService` is injected by 16 domain services, the airtrail-import
controller and `PluginHostDepsFactory` (its 16th constructor dep) in one move,
plus a 5-function `permissions.bridge.ts` for `mcp/tools/_shared.ts` — one
repoint covering every `hasTripPermission` call site — and the four legacy
consumers adminService/authService/backupService/collectionsService; the
permissions **cache stays module-scoped** in `permissions.service.ts` on
purpose, so the bridge instance and the container singleton share one cache
and backup-restore's bridge-side `invalidatePermissionsCache()` flushes what
request handlers serve; the domain e2e suites swapped their path mocks for a
`vi.spyOn(app.get(PermissionsService), 'checkPermission')` instance spy);
auditLog followed (the other Wave-2 half, split into five files: the
injectable `AuditService` (`writeAudit` over `DatabaseService`), the pure
`client-ip.ts` (files.constants precedent — the four getClientIp-only
controllers stay plain imports), the deliberately side-effectful plain
`audit-log.logger.ts` — frozen-at-import `LOG_LEVEL` and the import-time
`data/logs` mkdir are a documented parity exception to the no-side-effects
rule because `index.ts` lazy-requires it pre-container and tests/setup.ts
sets the level pre-import — plus `audit.module.ts` and a full-surface
`audit.bridge.ts` for `mcp/index.ts`, `mcp/oauthProvider.ts` and the legacy
airtrail/immich/oauth services, while log*-only consumers (index.ts's lazy
require strings, scheduler, globalMiddleware, notifications) point at the
logger directly; 8 controllers + `PluginRuntimeService` inject `AuditService`,
and the domain e2e suites dropped the audit mock entirely — writeAudit runs
for real against an `audit_log` table in their temp DBs).
The exchangeRateService fold followed (the pure-infra FX helper — Frankfurter
fetch + module-scoped 6h cache, no SQL, no controller, no MCP registrar of its
own — folded into `nest/budget/` as a dep-free `ExchangeRatesService`, injected
by `BudgetService` and `PluginHostDepsFactory` (its 17th constructor dep); the
rate **cache stays module-scoped** like the permissions cache, so any
out-of-container instance and the container singleton share one cached
upstream feed).
budgetService followed (the 755-line Wave-4 money core folded into the wrapper
`BudgetService`: items/members/payers CRUD, the FX freeze + rebase paths and
the settlement maths with `splitEqualShares` gone private; the freeze-then-write
composites kept their wrapper names while the raw settlement writes became
`insertSettlement`/`applySettlementUpdate` so the MCP paths keep skipping the
freeze; the 11-tool `mcp/tools/budget.ts` registrar + 3 `resources.ts` budget
resources moved to `budget.mcp.ts`; TripsService, ReservationsService (+ its
MCP class) and BookingImportService inject `BudgetService`; a 4-export
`budget.bridge.ts` served the legacy tripService/userCleanupService and the
trips/transports registrars (deleted 2026-08-11: BudgetMcp's demo guard moved
off AuthService onto `isDemoUserId`, BudgetModule dropped AuthModule, and
`UserCleanupService` injects `BudgetService` now);
`exchange-rates.bridge.ts` was deleted with its
last consumers, and the controller adopted `budget.dto.ts` — all nine
allow-list entries removed).
tripService followed (the 1121-line Wave-4 hub — the biggest fold — moved into
the wrapper `TripsService`: TRIP_SELECT + list/create/get, the
`generateDays` two-phase renumber engine, the updateTrip date-shift
transaction, the member/guest lifecycle (#973/#1362), the ICS export with its
module-scoped tz-validity cache, `copyTripById` and `getTripSummary`; its six
bridge imports became injected services (CollabService + VacayService joined
the constructor); the 10-tool trips registrar + 3 `resources.ts` trip
resources + the trip-summary prompt moved to `trips.mcp.ts` — the first
`@Prompt` use, with the fire-once static-token deprecation notice now riding
the `registry.attach` ctx — and the 3 share-link tools it carried moved to
`share.mcp.ts` on the `canShareTrips` predicate (delete_trip and the
canReadTrips reads are predicates too — the broadened legacy gates have no
declarative equivalent); FeedsService and the plugin host inject
`TripsService` (its 20th constructor dep); a 4-export `trips.bridge.ts`
serves budget.mcp.ts / packing.mcp.ts / costs.rpc.ts (verified-permanent
2026-08-11: the trip read-model/members modules import the budget and packing
domains, so injecting any backing service there closes a real cycle; the
prompts registrar it also served is long migrated);
`todo.bridge.ts`, `share.bridge.ts`, `collab.bridge.ts` and `vacay.bridge.ts`
were deleted with their last consumers and the unused days/budget bridge
exports pruned; the controller adopted `trips.dto.ts` — all seven allow-list
entries removed).
mapsService followed (the 1429-line geo core — Google Places, Nominatim,
Overpass mirror racing, Wikimedia photos, Maps-URL resolution — folded into the
wrapper `MapsService`; the pure parser/UA/POI-category helpers moved to
`maps.helpers.ts` as plain exports (files.constants/client-ip precedent —
the DI-native TransitService's User-Agent imports from there, not a bridge), the module-scoped
POI cache / photo-fetch semaphore / frozen Overpass mirrors stayed module-scoped
on purpose (permissions-cache precedent: any out-of-container instance and the
DI singleton share them); the 3 geo tools left the mixed `mcp/tools/mapsWeather.ts`
registrar for the decorator-driven `maps.mcp.ts` (the registrar file survives —
its weather + airport tools await their own migrations); BookingImportService
injects `MapsService` for its Nominatim geocoding, and a 3-export
`maps.bridge.ts` served the legacy placeEnrichment helper and the places
registrar — both absorbed by the 2026-07 place fold, which deleted the bridge).
transitService followed (the first fully SQL-free domain fold — the 333-line
Transitous/MOTIS proxy became a dep-free `TransitService` (no
`DatabaseService`; the ExchangeRatesService precedent), its response cache,
frozen-at-import `TRANSIT_API_BASE` and lazy User-Agent memo staying
module-scoped on purpose; the pure `deriveTransitStats` + mode whitelist +
itinerary types moved to `transit.helpers.ts` (maps.helpers precedent) so the
downstream legacy `transitItineraryService` needed no bridge (since relocated
into the domain as `transit-itinerary.helpers.ts`); the whole 3-tool
`mcp/tools/transit.ts` registrar moved to `transit.mcp.ts` — the two geo
search tools on `access: { group: 'geo', mode: 'read' }` and
`create_transit_journey` on `reservations:write`, with its days/reservations
bridge imports becoming injected `DaysService`/`ReservationsService` (+
`DatabaseService` for `canAccessTrip`) — leaving **zero bridge files** and the
transports registrar as `days.bridge.ts`'s last consumer).
placeService followed (the step-4 tail: the 1029-line place core — the
CRUD + ratings SQL, the GPX/KML/KMZ importers and the Google/Naver list
importers — folded into the wrapper `PlacesService`, with the pure pieces
(frozen XML parsers, the KMZ unpacker, the dedup predicates, the Google
hex-id parsers, `reclaimPhotoCache`) moving to `places.helpers.ts` on the
maps.helpers precedent; the 10-tool `mcp/tools/places.ts` registrar + the
`trek://trips/{tripId}/places` resource moved to `places.mcp.ts` —
`search_place` came along because its gate is `places:read`, not the geo
group, and now injects `MapsService`; TripsService, DaysMcp,
BookingImportService and the plugin host (its 21st constructor dep) inject
`PlacesService`, leaving **zero bridge files** for the domain; the two
`assignments.bridge` imports stay in `places.mcp.ts` on purpose —
AssignmentsModule imports DaysModule and DaysModule now imports
PlacesModule, so injecting would close a
DaysModule → PlacesModule → AssignmentsModule → DaysModule cycle
(reservations.mcp.ts uses the same seam for the same reason). The sibling
`placeEnrichment` fold went further than the recipe's minimum: the 168-line
helper's DB/websocket/Maps half became `PlacesService` methods over the
injected `DatabaseService`/`RealtimeService`/`MapsService` and its pure
match selector joined `places.helpers.ts`, which retired **`maps.bridge.ts`**
with its last consumer. The DTO ratchet for its 7 grandfathered body
contracts landed as a third commit, which also loosened
`placeBulkUpdateRequestSchema.ids` (`.min(1)` dropped) so the endpoint's
empty-list short-circuit stays reachable, and retired three bespoke 400
strings — 'Place name is required', 'ids must be an array of numbers' and
'URL is required' — in favour of the pipe envelope, accepting that a
malformed body now 400s ahead of the trip-access 404 (the todo/trips trade).
transitItineraryService followed (the first pure-helpers relocation with no
service fold at all — the 287-line module is 100% pure, so the recipe's SQL /
bridge / DTO / plugin-host steps were all no-ops: the Zod itinerary schemas +
endpoint/metadata builders moved byte-identical to
`transit-itinerary.helpers.ts`, next to `transit.helpers.ts`; the schemas
**must** stay module-level plain exports because `transit.mcp.ts` consumes
them inside `@Tool({ inputSchema })` decorators, which evaluate at module load
before any container exists; the sole consumer — the in-container
`transit.mcp.ts` — was a one-import repoint, closing step 4 of the
dependency-honest order; the legacy module had no direct suite, so a new
21-case `TRANSIT-ITIN-*` characterization suite now pins all 12 superRefine
error strings, the `??` time fallbacks, the coordinate tolerances and the
reservation endpoint/metadata builder).
collectionsService followed (the biggest single fold yet — 1024 lines / 28
exports into `CollectionsService` over DatabaseService + PermissionsService +
RealtimeService, with the `deleteOldCollectionCover` path re-anchored one
directory deeper and the `sendInvite` lazy notificationService `import()`
kept, collab precedent; the 25-tool legacy registrar `mcp/tools/collections.ts`
moved to `collections.mcp.ts` — at relocation time deliberately with NO
`when:` addon gate, since the legacy registrar registered unconditionally
while REST/plugin-host gate on the addon; the trailing `fix(server)` quirk
commit then gated all 25 tools (the addon ships disabled by default, so the
ungated surface was live on fresh installs) alongside wrapping every
multi-statement write in `db.transaction()`, making the bulk ops
all-or-nothing, and forwarding `X-Socket-Id` on the from-trip saves — each
pinned by a new 23-case `tools-collections` characterization suite plus the
`COLLECTIONS-SVC-090…092` band (the legacy registrar had no tool-level tests
at all);
the plugin host swapped its 7 collections imports for the injected service —
its 22nd constructor dep — and NO bridge was needed anywhere; the dead
`buildDedupSet` module helper was dropped in the move, the only line that
didn't relocate verbatim).
atlasService followed (1612 lines split two ways, places precedent: the DB
half — stats aggregation, visited countries/regions with the #1490
tombstone/cascade logic, bucket-list CRUD — folded into `AtlasService` over
DatabaseService alone, while the ~750-line pure-geo half — the bundled
admin0/admin1 stores and their #1576 OOM-shaped streaming builders, the
point-in-polygon indexes, Nominatim geocoding with its shared ≥1.1s throttle,
the 50k geocode cache with its import-time unref'd cleanup interval, and the
`geocodingInFlight` dedup set — moved to the plain module `atlas-geo.ts` so
those caches stay process-global across the container instance, the bridge
instance and test helpers; `assetPath` re-anchored one directory deeper, the
only non-verbatim line. The 10-tool legacy registrar `mcp/tools/atlas.ts`
plus all four atlas resources in `mcp/resources.ts` (`trek://bucket-list`,
`trek://visited-countries`, `trek://atlas/stats`, `trek://atlas/regions`)
moved to `atlas.mcp.ts` — here the `when:` atlas-addon gate IS parity, since
the legacy registrar and resources both gated on the addon while the REST
controller deliberately does not; the mark_region_visited /
get_country_atlas_places no-uppercase divergence from REST relocated
untouched. The plugin host swapped its 9 atlas imports for the injected
service — its 23rd constructor dep — and a minimal 2-export `atlas.bridge.ts`
existed solely for the legacy `authService.getTravelStats` edge
(`getCountryFromCoords` re-exported straight from atlas-geo,
`getHiddenCountries` over the bridge instance); it died with the auth fold, as
predicted. resources.test.ts retired with its last two cases — every resource
it covered now lives in the domain suites. The trailing `fix(server)` quirk
commit then wrapped the four multi-statement mark/unmark writes in
`db.transaction()` (the region cascade nests as a savepoint), made the
trip-less `countryPlaces` early return honour `manually_marked`, fixed the
`|| null` bindings that dropped `lat: 0`/`lng: 0`/`notes: ''` on bucket
update, user-scoped the mutating bucket SQL, and uppercased the MCP
region/country-places codes to match REST — each pinned by
`ATLAS-SVC-031…036` plus two MCP casing cases; see migration-graph.md's
"Quirks fixed after the atlas fold".)
authService followed (1497 lines, the biggest fold and the head of the
auth → admin → oauth chain: the pure crypto half — backup-code
hash/match/generate, `stripUserForClient`, key masking, the import-time
`DUMMY_PASSWORD_HASH` timing equaliser and the `avatarDir` mkdir (both
documented parity exceptions) — moved to the plain module `auth.helpers.ts`,
while the DB half — toggles/app-config, register/login with the CWE-208
dummy-hash path, MFA setup/enable/disable/verify, the password-reset
throttle+token flows with their two `db.transaction()` revocation blocks,
API keys/settings, travel stats, MCP/ws/resource tokens, `isDemoUser` and
the two token verifiers — folded into `AuthService` over DatabaseService +
injected PermissionsService (ex `permissions.bridge`) and AtlasService (ex
`atlas.bridge`, which died on schedule). The `mfaSetupPending` and
per-email reset-throttle maps stay module-scoped (with the unref'd cleanup
interval) so the bridge instance and the container singleton share them; the
otplib `window: 1` mutation runs at module top; `require('../../../package.json')`
and `avatarDir` re-anchored one directory deeper — the only non-verbatim
lines besides the two injection swaps. No MCP registrar existed and the
plugin host never imported authService, so neither surface changed; the 15
in-container `*.mcp.ts` demo guards now inject AuthService (their modules
import AuthModule) — except `atlas.mcp.ts`, which keeps a bridge import
because AuthService injects AtlasService and the reverse module edge would
close a cycle (places.mcp precedent). The 8-export `auth.bridge.ts` serves
`mcp/index.ts` token verification, the three legacy tool registrars'
`isDemoUser`, and the un-migrated adminService.
Tests moved with IDs preserved: authService.test.ts → auth.helpers.test.ts,
authServiceDb.test.ts → auth.service.test.ts (+ AUTH-BR-001…007 bridge
delegation); auth.e2e converted DI-native — the 30-method whole-module mock
died, login now runs real bcrypt and real audit rows; oidc.e2e switched its
dead path-mock for a `vi.spyOn(app.get(AuthService), …)` instance stub.)
oidcService followed (the frontier cash-in the auth fold predicted: a pure
fold of the 508-line module into the existing wrapper `OidcService` over
DatabaseService + injected AuthService — the `resolveAuthToggles`
`auth.bridge` import became the injection, the first repoint-consumer of that
bridge to migrate. No MCP registrar, no plugin-host import, and **no bridge
at all**: nothing outside the container consumes the domain (day-notes/
trip-invite class), so the `pendingStates`/`authCodes` maps, their two sweep
`setInterval`s, the single-slot discovery cache and the JWKS cache became
**instance state** — the module-scope precedent (permissions/atlas-geo/auth
maps) applies only where a bridge instance must share state, and none exists
here; the sweepers start in the constructor and are cleared in
`onModuleDestroy`, the one wire-invisible deviation. The `uuid`/`bcryptjs`
lazy requires, the `invite_exhausted` reference-sentinel transaction (reshaped
one line for `DatabaseService.transaction`) and every SQL string relocated
verbatim; controller and its unit suite needed zero edits. Tests moved with
IDs preserved: oidcService.test.ts → oidc.service.test.ts (OIDC-SVC-001…045,
superseding the 18-case delegation-shim suite; 046–048 carry its wrapper
cases); oidc.e2e swapped its whole-module path mock for
`vi.spyOn(app.get(OidcService), …)` instance spies; the integration suite
spies the four HTTP methods on the container instance while driving the real
state maps on that same instance.)
passkeyService followed (the last frontier member of the auth stack: the
364-line WebAuthn module folded into a new `nest/auth/passkey.service.ts`
`PasskeyService` over DatabaseService + injected AuthService — its three
`auth.bridge` imports resolved to `this.auth.generateToken` plus plain
`stripUserForClient`/`avatarUrl` helper imports, and `resolveWebauthnConfig`
stayed a plain `services/webauthnConfig` import at the time (it has since
become the injected `WebauthnConfigService`, which also feeds auth.service's
`passkey_configured`). No MCP registrar, no plugin-host
import, and **no bridge at all** — both consumers were already in-container:
`PasskeyController` swapped its `import *` shim for the injection, and
`AdminService` swapped its `adminResetPasskeys` function import for the
injected service (`AuthModule` now exports PasskeyService and `AdminModule`
imports AuthModule — the todo→TripsService in-container precedent). No
module-level mutable state existed to preserve: the challenge store is
DB-backed (`webauthn_challenges`, single-use `DELETE … RETURNING` claim,
5-min TTL), so the fold is a plain stateless injectable — every SQL string,
error string and the counter/login-bookkeeping transaction relocated
verbatim. Tests: the legacy module had **no service-level suite**, so
PASSKEY-SVC-001…030 were written fresh with the fold (characterization over a
real `:memory:` DB, `@simplewebauthn/server` mocked at the ceremony-verdict
boundary — the repo's first such mock); auth-guard.test.ts's PasskeyController
block swapped its path mock for a constructor stub.)
notificationService followed (the notifications fan-in, step 3 of the
dependency-honest order: the `send()` dispatcher **and** the
`inAppNotifications.ts` store folded together into the existing
`NotificationsService` over DatabaseService + RealtimeService — the wrapper's
in-app delegation became the real SQL, while the prefs matrix, the smtp/
webhook/ntfy transports, the channel registry and `inAppNotificationActions`
stay plain-module imports (graph-classified infra helpers, complete with
their registry⇄prefs cycle). A one-export `notifications.bridge.ts` (`send`)
covered the outside-container consumers — scheduler's two cron `require`s,
legacy adminService and memories/{unified,synology} (that bridge died
2026-08-10 with the scheduler migration; `notifications.instance.ts` carries
the surviving cycle-dodge bridges) — **and** the six
deliberately-lazy fire-and-forget `import().then(({ send }) => …)` sends in
migrated Nest services (collab/collections/packing/reservations/trips/vacay,
path-only repoints; kept lazy so a send can never block or cycle a domain
module). In-container static consumers inject instead: `AdminController`'s
dev test send (AdminModule → NotificationsModule) and the plugin host
(`NotificationsService` = `PluginHostDepsFactory`'s 24th dep). The 5-tool
legacy registrar + the `notifications-in-app` resource moved 1:1 to
`notifications.mcp.ts` (no `when:` — the domain is core, not addon-gated).
Tests moved with IDs preserved: notificationService.test.ts →
notifications.service.test.ts (NSVC-001…019/NTFY-SVCB-*/NSVC-PLUG-001…007,
plus the NSVC-020 bridge pin), inAppNotificationPrefs.test.ts →
notifications.inapp-prefs.test.ts (INOTIF-*); ~18 suites repointed their
path mocks/warm-ups to the bridge; admin.controller.test and the plugin-host
suite converted theirs to constructor stubs; the module e2e went DI-native
(real notifications DDL, prefs/transports still path-mocked).)
adminService followed (the last Wave-5 god file and the first fold where recipe
steps 2-4 were all no-ops or near-no-ops: **no `src/mcp/tools/admin.ts` has ever
existed** — the "11 MCP consumers" figure carried in `migrate.md` /
`migration-graph.md` predated the Phase-0 addons extraction, so no registrar
moved, `mcp/tools.ts` / `mcp/resources.ts` / `mcp-test-controllers.ts` were
untouched — and `plugin-host-deps.factory.ts` never imported the domain either
(its addon reads already went through the DI-native `AddonsService`). The
851-line module folded into the wrapper `AdminService` over `DatabaseService`
plus injected Settings/Addons/Passkey/Packing/Auth/Permissions/Notifications
services: the `auth.bridge` (`resolveAuthToggles`), `notifications.bridge`
(`send`) and `permissions.bridge` (`getAllPermissions`/`savePermissions`)
imports all became injections, while `PERMISSION_ACTIONS` stayed a plain const
import and the `mcp/sessionManager` deep import kept its anti-cycle comment.
The pure + module-scoped half moved to `admin.helpers.ts` — `compareVersions`,
`utcSuffix`, `BCRYPT_COST`, the import-time `isDocker` probe (a documented
parity exception, auth.helpers precedent) and the 5-minute version cache, which
stays module-scoped so the bridge instance and the container singleton share it.
Ahead of the fold the 11 packing-template functions relocated to
`PackingService`, which already owned all three template tables
(`saveAsTemplate` writes every one of them) — that also resolved the `admin-2`
residual without a bridge, since `packing.mcp.ts` already injects the service;
`AdminModule` gained PackingModule and PermissionsModule, both cycle-free.
A 1-export `admin.bridge.ts` (`checkAndNotifyVersion`) served the only
out-of-container consumer, `scheduler.ts`'s daily cron (both died 2026-08-10
with the scheduler migration — `VersionCheckJob` injects `AdminService`).
Four lines are
non-verbatim, all path re-anchoring one directory deeper for `nest/admin/`
(`rotateJwtSecret`'s data dir, the `package.json` version require, the
websocket/demo-reset lazy requires) — both resolved paths verified against the
emitted `dist/` layout. Tests moved with IDs preserved (adminService.test.ts →
`nest/admin.service.test.ts`, ADMIN-SVC-001…069 incl. the pre-existing 029/030
gap and duplicated 069, + ADMIN-BR-001 pinning the bridge and the shared version
cache; versionNotification.test.ts → `nest/admin.version-notification.test.ts`,
VNOTIF-001…007; the template cases rode along to `packing.service.test.ts`), and
the module e2e went DI-native — its 3-method whole-module mock died, 6 cases
became 15 over real SQL. A sibling DTO ratchet cleared all twenty
`AdminController` allow-list entries — the largest single block — trading the
three `'enabled must be a boolean'` checks plus `'permissions object required'`
and `'Object body required'` for the pipe envelope; the schemas are
deliberately permissive wherever the service owns a bespoke 400 of its own.)
Repeat these steps per
service (next up: **backupService** / **airtrail** —
per the dependency-honest order in
`migration-graph.md`). This is a
**pure relocation** — byte-identical
SQL, statuses, bodies, and error strings. The plugin RPC host is **no longer a
bridge consumer**: since Option A of `src/nest/plugins/DI-MIGRATION.md` it
injects domain services via `PluginHostDepsFactory`, so a migrated domain adds
`exports: [XService]` + a `PluginsModule` import instead of a bridge entry.
Only the pre-`app.init()` MCP/OAuth mount still needs bridges — the module-
cycle seams are folded, nothing on the websocket path imports one, and the
crons all inject now (`*.job.ts` providers on `scheduling/CronRegistrarService`).

1. **Move the SQL** into `<domain>.service.ts` as methods over an injected
   `DatabaseService` (`this.db.all<T>/get<T>/run/prepare/transaction`; strict
   constructor injection, no `@Optional()`). Preserve every quirk: falsy-coercion
   defaults (`x || fallback`, never `??`), post-insert/post-update re-selects (no
   RETURNING), `COALESCE` semantics. If a controller already wraps the legacy
   functions, do not change the service's method surface. The module needs no
   `imports: [DatabaseModule]` — it's `@Global`.
2. **Add `<domain>.bridge.ts`** next to the service **only if non-Nest consumers
   exist** (legacy MCP tool registrars, websocket — the plugin RPC host and the
   crons now inject instead, see above). It builds a module-level instance over
   the shared connection Proxy — `new XService(new DatabaseService(db))`,
   reinitialize-proof, same pattern as `nest/todo/todo.bridge.ts` — and exports
   the legacy function names 1:1.
   Container code injects the service; only outside-container code imports the
   bridge. When porting an MCP registrar, note the `access: { group, mode }`
   markers are typed against the scope-derived `ScopeGroup` union and
   boot-validated by `trekMcpValidateAccess` (`src/mcp/nest-mcp-policy.ts`) —
   an unknown group, or `mode: 'write'` on a read-only group (`geo`,
   `weather`), fails app boot. **`mode` is typed the same way**: it is the mode
   half of `Scope` (`read | write | delete | share`), fed into
   `src/nest-mcp/types.ts` through `McpAccessModeRegistry` exactly like the
   group registry. A scope that is neither read nor write — `journey:share` is the
   one today — gets a real marker, *not* a `(ctx) => canX(ctx.scopes)`
   predicate: predicates bypass the policy entirely and are invisible to the
   boot gate, so a scope typo in one would ship as a silent full-access tool.
   Reach for a predicate only when the gate genuinely is not a scope. *(Design decision, settled with the tags pilot:
   MCP tools stay outside the container and use the bridge. The alternative — handing the Nest app to the
   MCP layer via `app.get(XService)` — was rejected: it would thread the container
   through `mcpHandler` + every tool registrar and force a Nest bootstrap into the
   container-less `tests/helpers/mcp-harness.ts` used by ~25 MCP suites.)*
3. **Repoint non-Nest consumers** — import-path-only diffs from
   `services/<x>Service` to `nest/<domain>/<domain>.bridge`; call sites unchanged.
4. **Delete the legacy service** once `grep -rn "services/<x>Service" src tests`
   only hits the tests you're rewriting.
5. **Tests:**
   - Move `tests/unit/services/<x>Service.test.ts` →
     `tests/unit/nest/<domain>.service.test.ts`, preserving case IDs. Construct the
     service directly — `new XService(new DatabaseService(testDb))` — no
     TestingModule, no `overrideProvider` (repo convention). Add one delegation
     case per bridge export: the bridge sits under `src/nest/**`, inside the ≥80%
     coverage gate, and these cases pin it deterministically.
   - Convert the module e2e to the DI-native pattern (exemplar
     `tests/e2e/trips.e2e.test.ts`): temp-db DDL for the domain's tables,
     `imports: [DatabaseModule, <Domain>Module]`, real SQL assertions. Keep only
     the `vi.mock('../../src/db/database', …)` — the auth guard still reads users
     through the singleton, and `DatabaseModule`'s factory picks up the same
     mocked db. Drop the legacy-service mock entirely.
   - Suites that mocked the legacy module mock the bridge path instead — same
     factory shape, path-only change. (For the plugin host suite,
     `plugin-host-deps.factory.test.ts`, the domain becomes a constructor stub
     instead of a path mock.)
6. **Verify** (from `server/`): `npm run typecheck`, `test:unit`,
   `test:integration`, `test:e2e`, `lint:check`, `test:coverage`.
