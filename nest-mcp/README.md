# @trek/nest-mcp

Decorator-driven MCP registration for NestJS. Domains declare MCP tools, resources and prompts as decorated methods on ordinary Nest providers; a discovery-backed registry collects them at boot and attaches them — filtered by a host-defined access policy — onto each per-session `McpServer`.

The package is **extraction-clean**: it imports nothing from `@trek/server` or `@trek/shared` and only peer-depends on `@nestjs/common`, `@nestjs/core`, `@modelcontextprotocol/sdk` and `zod`. It defines **no scope semantics** of its own — access meaning comes entirely from the host's `accessPolicy`.

## API

### Decorators

```ts
import { McpController, Tool, Resource, ResourceTemplate, Prompt } from '@trek/nest-mcp';
import { z } from 'zod';

@McpController() // implies @Injectable(); register the class in a module's providers: []
export class ThingsMcp {
  constructor(private readonly things: ThingsService) {}

  @Tool({
    name: 'list_things',
    description: 'List all things.',
    inputSchema: {},                             // ZodRawShape, passed straight to the SDK
    annotations: { readOnlyHint: true },
    access: { group: 'things', mode: 'read' },   // resolved by the host accessPolicy
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

- **Declarative** — `access: { group: 'things', mode: 'read' | 'write' }`, resolved by the `accessPolicy` given once at `McpModule.forRoot(...)`. `group` is typed as `McpAccessGroup` — plain `string` until the host augments `McpAccessGroupRegistry` (see below), after which only the host's registered groups compile.
- **Predicate** — `access: (ctx) => boolean`, bypasses the policy.
- **Availability gate** — `when: (ctx, self) => boolean`, evaluated *before* `access` (both must pass). Use it for feature/addon toggles so scope markers stay declarative: `when: (_ctx, self: PackingMcp) => self.addons.isAddonEnabled(...)`, `access: { group: 'packing', mode: 'read' }`. `self` is the `@McpController()` instance, handed in at attach time — the options object is built when the class is defined, so without it a gate can only reach a module-level singleton, and hosts end up constructing a second copy of a service outside their own container to answer a toggle.
- **Omitted `access`** — the entry is always registered (subject to `when`).

### Result helpers & annotation presets

Handler-side conveniences, exported from the package root so decorated domains need nothing from the legacy MCP layer:

```ts
import { ok, errorResult, demoDenied, TOOL_ANNOTATIONS_READONLY } from '@trek/nest-mcp';

ok({ tags })                 // { content: [{ type: 'text', text: <pretty JSON> }] }
errorResult('Tag not found.') // { content: [...], isError: true } — message verbatim
demoDenied()                  // canned demo-mode write refusal
```

Six `TOOL_ANNOTATIONS_*` presets cover the read/write/delete/idempotency matrix (plus `OPEN_WORLD` variants). Host-specific canned errors (permission wording, RBAC lookups) belong in the host, built on `errorResult` — see TREK's `server/src/mcp/tools/_shared.ts`, which re-exports the generic helpers from here.

### Fail-fast validation

`McpRegistryService` runs `registry.validate()` at boot (`onModuleInit`), and `createTestRegistry` runs it on construction, so misconfiguration breaks startup instead of MCP session creation:

- duplicate names per kind (fixed resources: duplicate URIs);
- declarative `access` without a configured `accessPolicy`;
- declarative `access` rejected by the optional host-supplied `validateAccess` hook.

All problems are aggregated into one `Invalid MCP registry: ...` error, so a single boot failure reports every misconfiguration.

`validateAccess?: (access, entry) => string | null | undefined` (on both `McpModule.forRoot(...)` and `createTestRegistry(...)` options) is called once per entry with declarative access — predicates are opaque to the host and skipped. Return a problem description to fail boot, null/undefined to accept:

```ts
McpModule.forRoot({
  accessPolicy,
  validateAccess: ({ group, mode }) =>
    hostKnowsGroupMode(group, mode) ? null : `no '${group}:${mode}' scope`,
})
```

### Context typing

The package exports an empty `McpContext` interface; the host augments it once:

```ts
declare module '@trek/nest-mcp' {
  interface McpContext {
    userId: number;
    scopes: string[] | null;
    isStaticToken: boolean;
  }
}
```

### Access-group typing

Same trick for `access.group`: the package exports an empty `McpAccessGroupRegistry` interface, and `McpAccessGroup` (the type of `group`) is `string` until the host augments it — after which every decorator's `group` is checked against the host's union at compile time:

```ts
declare module '@trek/nest-mcp' {
  interface McpAccessGroupRegistry extends Record<MyGroupUnion, true> {}
}
```

### Wiring

```ts
// AppModule
McpModule.forRoot({ accessPolicy: (access, ctx) => /* host semantics */ })

// wherever per-session servers are built (may be outside Nest — hand the
// registry over after app.init()):
const registry = app.get(McpRegistryService);
registry.attach(server, { userId, scopes, isStaticToken });
registry.list(); // introspection
```

### Testing without Nest

```ts
import { createTestRegistry } from '@trek/nest-mcp';

const registry = createTestRegistry([new ThingsMcp(new ThingsService(db))], { accessPolicy });
registry.attach(server, ctx);
```

## Migrating a TREK MCP domain (recipe)

1. Create `server/src/nest/<domain>/<domain>.mcp.ts`: an `@McpController()` class injecting the domain's Nest service. Port each `server.registerTool(...)` from `server/src/mcp/tools/<domain>.ts` to a `@Tool()` method **byte-identically** (names, descriptions, schemas, annotations, error strings, `ok()` payloads).
2. Replace the registrar's `canRead/canWrite` registration-time gates with `access: { group, mode }` (TREK's policy in `server/src/mcp/nest-mcp-policy.ts` implements the `scopes.ts` semantics). Addon gates become `when: (_ctx, self: XMcp) => self.addons.isAddonEnabled(ADDON_IDS.X)` alongside the declarative `access`.
3. Add the class to the domain module's `providers: []`.
4. Delete the legacy registrar file and its call in `server/src/mcp/tools.ts`.
5. Add one line constructing the instance in `server/tests/helpers/mcp-test-controllers.ts` and keep the domain's existing unit tests green — behavior must be indistinguishable to a client.

## Development

```bash
npm run build --workspace=nest-mcp     # tsc → dist/ (CJS + d.ts)
npm run test --workspace=nest-mcp      # vitest (SWC transform for decorator metadata)
npm run typecheck --workspace=nest-mcp
npm run lint:check --workspace=nest-mcp
```

Note: the MCP SDK's exports map uses extension-less wildcards that TypeScript cannot resolve; `tsconfig.json` `paths` and `vitest.config.ts` aliases point at the CJS dist files (same workaround as `server/`).
