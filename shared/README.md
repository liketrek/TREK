# @trek/shared

Single source of truth for TREK's API contracts, expressed as [Zod](https://zod.dev) schemas
and consumed by **both** the server (request validation + inferred DTO types) and the client
(typed requests/responses).

This package is part of the incremental NestJS + React 19 migration
(see the "Brownfield Rewrite" board). It is intentionally **dormant** until modules start
importing it — adding it changes nothing for users.

## Rules

- **One folder per domain**: `src/<domain>/<domain>.schema.ts` (+ `.spec.ts`).
- Domain-agnostic building blocks live in `src/common/`.
- A route is only considered **migrated** once its contract lives here.
- Schemas are the source of truth; server DTOs and client types are *inferred* from them
  (`z.infer<typeof schema>`), never hand-duplicated.

## Consumption (dev)

Both apps resolve `@trek/shared` to this package's TypeScript source:

- **Server** (`tsx`): via `paths` in `server/tsconfig.json`.
- **Client** (`vite`): via `resolve.alias` in `client/vite.config.ts` (+ `paths` for the type-checker).

> Production packaging (Docker / workspace wiring) is introduced in card **F2**, when the
> server first depends on this package at runtime. Until then prod builds are untouched.

## Not yet here

The canonical **error envelope** is finalised in card **F5** (it must match TREK's current
Express error responses byte-for-byte), so it is deliberately not invented in F1.
