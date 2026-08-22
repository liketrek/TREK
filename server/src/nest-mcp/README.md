# nest-mcp

Decorator-driven MCP registration for NestJS. Domains declare MCP tools, resources and prompts as decorated methods on ordinary Nest providers; a discovery-backed registry collects them at boot and attaches them — filtered by the access policy — onto each per-session `McpServer`.

Formerly the standalone `@trek/nest-mcp` workspace package; folded into the server 2026-08-22. Two invariants survive the fold:

- **Self-contained**: this directory imports nothing from the rest of `server/` except the type-only `../mcp/scopes` import in `types.ts` (which types `access.group`/`mode` against the real scope unions). Keep it that way — new TREK semantics belong in the host layer, not here.
- **No scope semantics of its own**: access *meaning* comes entirely from the `accessPolicy`/`validateAccess` given at `McpModule.forRoot(...)` — TREK's live in `src/mcp/nest-mcp-policy.ts`.

Tests live in `server/tests/unit/nest-mcp/` and run with the normal server suite; coverage is gated at ≥80% in `server/vitest.config.ts`.

## API

### Decorators

```ts
import { McpController, Tool, Resource, ResourceTemplate, Prompt } from '../../nest-mcp';
import { z } from 'zod';

@McpController() // implies @Injectable(); register the class in a module's providers: []
export class ThingsMcp {
  constructor(private readonly things: ThingsService) {}

  @Tool({
    name: 'list_things',
    description: 'List all things.',
    inputSchema: {},                             // ZodRawShape, passed straight to the SDK
    annotations: { readOnlyHint: true },
    access: { group: 'things', mode: 'read' },   // resolved by the accessPolicy
  })
  async listThings(_args: Record<string, never>, ctx: McpContext) {
    return { content: [{ type: 'text', text: JSON.stringify(this.things.list(ctx.userId)) }] };
  }
}
```

- `@Tool(options)` — mirrors `server.registerTool` (`name`, `title`, `description`, `inputSchema`, `outputSchema`, `annotations`, `_meta`). Handler: `(args, ctx)`; `args` is `{}` when no `inputSchema` was declared.
- `@Resource(options)` — fixed URI (`uri`, `mimeType`, …). Handler: `(uri: URL, ctx)`.
- `@ResourceTemplate(options)` — `uriTemplate` (RFC 6570). Handler: `(uri: URL, variables, ctx)`. (No `list`/`complete` template callbacks yet — extend when a domain needs them.)
- `@Prompt(options)` — mirrors `registerPrompt` (`argsSchema` entries must be string-valued Zod schemas). Handler: `(args, ctx)`.

`ctx` always takes the SDK `extra` slot — the last handler argument.

### Access control

Every decorator accepts `access` and `when`:

- **Declarative** — `access: { group: 'things', mode: 'read' | 'write' }`, resolved by the `accessPolicy` given once at `McpModule.forRoot(...)`. `group` and `mode` are typed against the scope-derived unions in `types.ts`, so a typo'd group is a compile error in `.mcp.ts` files.
- **Predicate** — `access: (ctx) => boolean`, bypasses the policy.
- **Availability gate** — `when: (ctx, self) => boolean`, evaluated *before* `access` (both must pass). Use it for feature/addon toggles so scope markers stay declarative: `when: (_ctx, self: PackingMcp) => self.addons.isAddonEnabled(...)`, `access: { group: 'packing', mode: 'read' }`. `self` is the `@McpController()` instance, handed in at attach time — the options object is built when the class is defined, so without it a gate can only reach a module-level singleton, and hosts end up constructing a second copy of a service outside their own container to answer a toggle.
- **Omitted `access`** — the entry is always registered (subject to `when`).

### Result helpers & annotation presets

Handler-side conveniences, exported from the barrel so decorated domains need nothing from the legacy MCP layer:

```ts
import { ok, errorResult, demoDenied, TOOL_ANNOTATIONS_READONLY } from '../../nest-mcp';

ok({ tags })                 // { content: [{ type: 'text', text: <pretty JSON> }] }
errorResult('Tag not found.') // { content: [...], isError: true } — message verbatim
demoDenied()                  // canned demo-mode write refusal
```

Six `TOOL_ANNOTATIONS_*` presets cover the read/write/delete/idempotency matrix (plus `OPEN_WORLD` variants). TREK-specific canned errors (permission wording, RBAC lookups) belong in the host layer, built on `errorResult` — see `server/src/mcp/tools/_shared.ts`, which re-exports the generic helpers from here.

### Fail-fast validation

`McpRegistryService` runs `registry.validate()` at boot (`onModuleInit`), and `createTestRegistry` runs it on construction, so misconfiguration breaks startup instead of MCP session creation:

- duplicate names per kind (fixed resources: duplicate URIs);
- declarative `access` without a configured `accessPolicy`;
- declarative `access` rejected by the optional `validateAccess` hook.

All problems are aggregated into one `Invalid MCP registry: ...` error, so a single boot failure reports every misconfiguration.

`validateAccess?: (access, entry) => string | null | undefined` (on both `McpModule.forRoot(...)` and `createTestRegistry(...)` options) is called once per entry with declarative access — predicates are opaque and skipped. Return a problem description to fail boot, null/undefined to accept:

```ts
McpModule.forRoot({
  accessPolicy,
  validateAccess: ({ group, mode }) =>
    hostKnowsGroupMode(group, mode) ? null : `no '${group}:${mode}' scope`,
})
```

### Context and access typing

`McpContext` (the per-session context handed to every handler, predicate and the policy) and the `McpAccessGroupRegistry`/`McpAccessModeRegistry` interfaces that type `access.group`/`mode` are defined directly in `types.ts`. Before the fold they were empty interfaces the host augmented via `declare module '@trek/nest-mcp'`; the TREK shapes are now baked in, with the lockstep asserts in `src/mcp/nest-mcp-policy.ts` pinning the registries to `scopes.ts` at compile time.

### Wiring

```ts
// AppModule
McpModule.forRoot({ accessPolicy: (access, ctx) => /* scope semantics */ })

// wherever per-session servers are built (may be outside Nest — hand the
// registry over after app.init()):
const registry = app.get(McpRegistryService);
registry.attach(server, { userId, scopes, isStaticToken });
registry.list(); // introspection
```

### Testing without Nest

```ts
import { createTestRegistry } from '../../../src/nest-mcp';

const registry = createTestRegistry([new ThingsMcp(new ThingsService(db))], { accessPolicy });
registry.attach(server, ctx);
```

## Migrating a TREK MCP domain (recipe)

1. Create `server/src/nest/<domain>/<domain>.mcp.ts`: an `@McpController()` class injecting the domain's Nest service. Port each `server.registerTool(...)` from `server/src/mcp/tools/<domain>.ts` to a `@Tool()` method **byte-identically** (names, descriptions, schemas, annotations, error strings, `ok()` payloads).
2. Replace the registrar's `canRead/canWrite` registration-time gates with `access: { group, mode }` (TREK's policy in `server/src/mcp/nest-mcp-policy.ts` implements the `scopes.ts` semantics). Addon gates become `when: (_ctx, self: XMcp) => self.addons.isAddonEnabled(ADDON_IDS.X)` alongside the declarative `access`.
3. Add the class to the domain module's `providers: []`.
4. Delete the legacy registrar file and its call in `server/src/mcp/tools.ts`.
5. Add one line constructing the instance in `server/tests/helpers/mcp-test-controllers.ts` and keep the domain's existing unit tests green — behavior must be indistinguishable to a client.

## Notes

The MCP SDK's exports map uses extension-less wildcards that TypeScript cannot resolve; `server/tsconfig.json` `paths` and `server/vitest.config.ts` aliases point at the CJS dist files. `registry.ts` is the only file here importing the SDK.
