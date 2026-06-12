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

Add the prefix to `DEFAULT_NEST_PREFIXES` in `strangler.ts` to route it to Nest
(operators can override at runtime via the `NEST_PREFIXES` env var — instant
rollback, no redeploy). Trip-scoped mounts use a pattern prefix with a `:param`
segment (e.g. `/api/trips/:tripId/packing`); the matcher routes only that nested
mount to Nest and leaves the sibling trip routes (days, places, ...) on Express.

## Migrated so far

- **Phase 1 (leaf):** weather, airports, config (public), system-notices, maps,
  categories, tags, notifications, atlas.
- **Phase 2 (trip sub-domains):** vacay (addon), packing, todo.

## Cross-cutting Foundation pieces

- `common/idempotency.interceptor.ts` — global `APP_INTERCEPTOR` replaying the
  client's `X-Idempotency-Key` on mutations, mirroring the legacy
  `applyIdempotency` middleware so retried writes don't double-apply.
- `strangler.ts` — supports both static prefixes and `:param` pattern prefixes.

## Parity gotchas worth remembering

- A POST that answers with `res.json` in Express stays **200**; add `@HttpCode(200)`
  (Nest defaults POST to 201). Creates that Express sends as 201 need nothing.
- Static sub-routes that collide with a `:id` param (e.g. `/in-app/all` vs
  `/in-app/:id`, `/reorder` vs `/:id`) must be declared **before** the param route.
- Reproduce bespoke admin/error wording exactly — e.g. notifications' `test-smtp`
  returns `{ error: 'Admin only' }`, not the AdminGuard's `Admin access required`.
- Trip-scoped routes verify trip access (404) and the relevant permission (403)
  per handler and forward `X-Socket-Id` to the WebSocket broadcast.

## Parity is law

A migrated route must be **byte-identical** for the client: same URL, method,
query/body, HTTP status, `Set-Cookie`, and JSON body — including bespoke error
strings. Where the legacy route returns a hand-written error (e.g. weather's
`{ error: 'Latitude and longitude are required' }`), reproduce that exact body in
the controller rather than relying on the generic `ZodValidationPipe` envelope.

## How to write the tests

Every module ships three kinds of tests; the coverage gate (`vitest.config.ts`,
scoped to `src/nest/**`) requires ≥80%.

1. **Service / controller unit spec** — `tests/unit/nest/<domain>.controller.test.ts`.
   Instantiate the controller with a mocked service; assert status codes, the exact
   `{ error }` bodies, and that inputs are forwarded correctly (defaults, coercion).
   See `weather.controller.test.ts`.

2. **Parity test** — `tests/parity/<domain>.parity.test.ts`. Mock the shared service
   identically for both apps, then fire the same request at the Express route and the
   Nest controller with the `expectParity()` harness (`tests/parity/parity.ts`) and
   assert identical status + body. This is the gate before flipping the toggle.
   See `weather.parity.test.ts`.

3. **e2e** — `tests/e2e/<domain>.e2e.test.ts`. Boot the Nest module against a temp
   in-memory SQLite db via the shared harness (`tests/e2e/harness.ts`:
   `createTempDb`/`seedUser`/`sessionCookie`), exercising the **real** `JwtAuthGuard`
   end-to-end (401 without cookie, 200 with a signed session). Mock external I/O
   (HTTP/etc.). See `weather.e2e.test.ts`.

## Definition of Done (per module)

Contract in `@trek/shared` → service ported 1:1 → controller with identical routes →
validation/error parity → unit + parity + e2e tests over the gate → prefix toggled to
Nest → parity verified on the demo DB → **then** decommission the old Express
route/service (separate step, after the toggle is confirmed in prod) → frontend points
at the typed contract (Frontend Track).
