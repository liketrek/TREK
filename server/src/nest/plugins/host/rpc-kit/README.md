# rpc-kit — the plugin RPC decorator layer

Conceptually this is `trek-plugin-host`: `@PluginController`, `@PluginMethod`,
`@PluginOpenMethod` and `@PluginHook`, plus the registry that binds them into the
per-plugin dispatch map. It lives inside `server/` rather than in its own workspace,
and this file records why, and what extracting it later would cost.

## What the decorators buy

The method-to-permission association used to exist twice: declaratively in
`METHOD_PERMISSION` (`../../protocol/envelope.ts`) and imperatively as the
`if (has('...'))` blocks in `../rpc-host.ts`, with nothing asserting they agree.
`protocol-paths.test.ts` checked that each method had *some* permission, never that it
was *the same* permission the router gates on, and `plugin-audit.ts`'s `isAuditable`
silently inherits any drift.

A `@PluginMethod` declaration is checked against that table twice:

- at compile time, because `MethodPermission<M>` resolves to the single literal the
  table assigns to `M`, so `@PluginMethod('tags.list', { permission: 'db:write:tags' })`
  does not typecheck;
- at boot, in `registry.validate()`, because types evaporate under an `as` cast or a
  hand-emitted JS consumer.

`@PluginHook` gets the same treatment against `HOOK_PERMISSION`.

## The import rule

The kit may import:

- `@nestjs/common` and `@nestjs/core`,
- **type-only** from `../../protocol/envelope` and `../plugin-data.service`.

Nothing else. It must not reach into `rpc-host.ts`, the deps factory, the supervisor,
or any domain service. `registry.ts` is the single exception that imports envelope
values (the tables it validates against), which is deliberate: the kit sits in the same
package as its data source, so it can read it directly.

## If this ever becomes its own package

`nest-mcp` was the worked example of the same layer as a separate workspace (it has
since been folded into `server/src/nest-mcp/`, which retired the machinery below), and
the delta is instructive. Because `nest-mcp` could not import the host, it needed a
`declare module` augmentation for its registries plus two `AssertExact` drift guards in
`src/mcp/nest-mcp-policy.ts`, and a permissive `keyof X extends never ? string`
fallback that silently disables all checking if someone forgets to augment.

`rpc-kit` needs none of that today. Extracting it would mean:

1. `PluginRpcContext.data` becomes a generic parameter instead of importing
   `PluginDataDb`.
2. The four envelope type imports (`KnownMethod`, `MethodPermission`, `HookKey`,
   `HookPermission`) become empty-interface augmentation points, with `AssertExact`
   guards in the server proving the augmentation still matches the tables.
3. Root `package.json` `workspaces`, `server/package.json` deps, the root lockfile, the
   Dockerfile COPY stages and a source alias in `server/vitest.config.ts` all change.

Note that a workspace would *not* let `trek-plugin-sdk` consume it: `nest-mcp` was
`"private": true`, and so would this be. The SDK gets its copy of the permission facts
from the generated `plugin-sdk/src/generated/host-facts.ts` instead.

## Files

| File | What it is |
|---|---|
| `metadata.ts` | WeakSet/WeakMap keyed by constructor. Deliberately not `reflect-metadata`, so a bare vitest worker can build a registry with no Nest app. |
| `types.ts` | `PluginRpcContext`, the entry union, the option shapes. |
| `decorators.ts` | The four decorators. |
| `registry.ts` | `register` / `validate` / `bindInto` / `hookContracts`. Plain class, no DI. |
| `registry.service.ts` | The DI-discovered subclass. Scans providers at boot and validates. |
| `testing.ts` | `createTestPluginRegistry`, same fail-fast contract as the boot path. |

## The failure mode to know about

A `@PluginController()` class that is missing from its module's `providers: []` is
invisible to discovery. Its methods are simply never bound, and every call to them
comes back `PERMISSION_DENIED` with no other symptom. The compiler cannot see this.

`requireTotalCoverage` is now on, so the app refuses to boot instead: `validate()`
names every `KNOWN_METHOD` left without a handler, and every hook left without a
host-side consumer. `server/tests/unit/plugins/rpc-coverage.test.ts` catches the same
gap in CI, before anyone starts the server.
