import type { Scope, ScopeGroup } from '../mcp/scopes';

import type { ZodRawShape } from 'zod';

/**
 * The mode half of every scope: 'read' | 'write' | 'delete' | 'share'.
 * Mirrors `ScopeMode` in `src/mcp/nest-mcp-policy.ts`, which stays the
 * exported one (its only consumer is that file's own lockstep assert).
 */
type ScopeMode = Scope extends `${string}:${infer M}` ? M : never;

/**
 * The per-session context handed to `McpRegistry.attach(server, ctx)` and
 * forwarded to every handler (last argument) and access predicate/policy —
 * mirrors what registerTools() receives per session.
 *
 * Historically this was an empty interface augmented by the host (nest-mcp
 * was a separate extraction-clean workspace); since the fold into the server
 * the TREK shape lives here directly. The type-only `../mcp/scopes` import
 * above is the one deliberate coupling to the rest of the server.
 */
export interface McpContext {
  userId: number;
  scopes: string[] | null;
  isStaticToken: boolean;
  /**
   * Fire-once static-token deprecation notice closure (built per session in
   * src/nest/mcp-transport/mcp-transport.service.ts and threaded through
   * registerTools → registry.attach).
   * Optional so direct createTestRegistry ctxs without it keep working —
   * consumers (list_trips / get_trip_summary) treat absence as "no notice".
   */
  getDeprecationNotice?: () => string | null;
}

/**
 * Registry of valid `access.group` values, keyed by the scope-derived union
 * so a typo'd group is a compile error in `.mcp.ts` files. The semantics of
 * a group come from the access policy in `src/mcp/nest-mcp-policy.ts`, not
 * from here.
 */
// A plain alias, not an empty interface: the empty single-extends form only
// existed so an external host could augment the union, and since the fold into
// the server there is no such host. `keyof` resolves the same either way.
export type McpAccessGroupRegistry = Record<ScopeGroup, true>;

export type McpAccessGroup = keyof McpAccessGroupRegistry extends never
  ? string
  : keyof McpAccessGroupRegistry & string;

/**
 * Same registry pattern for the access *mode* half. Without the full mode
 * union `mode` would be 'read' | 'write' only, and journey's share tools
 * could only be expressed as opaque predicates, which the boot gate in
 * `src/mcp/nest-mcp-policy.ts` cannot check.
 */
export type McpAccessModeRegistry = Record<ScopeMode, true>;

export type McpAccessMode = keyof McpAccessModeRegistry extends never
  ? 'read' | 'write'
  : keyof McpAccessModeRegistry & string;

/**
 * Declarative access marker resolved by the host-supplied `accessPolicy`.
 * The package attaches no semantics to `group`/`mode` — the policy does.
 */
export interface McpDeclarativeAccess {
  group: McpAccessGroup;
  mode: McpAccessMode;
}

/** Predicate escape hatch — bypasses the policy entirely. */
export type McpAccessPredicate = (ctx: McpContext) => boolean;

export type McpAccess = McpDeclarativeAccess | McpAccessPredicate;

/**
 * Host-supplied resolver for declarative access, given once at
 * `McpModule.forRoot({ accessPolicy })`. Return true to register the entry
 * on the session's server.
 */
export type McpAccessPolicy = (access: McpDeclarativeAccess, ctx: McpContext) => boolean;

interface McpEntryOptionsBase {
  name: string;
  title?: string;
  description?: string;
  /**
   * Availability gate evaluated BEFORE `access` (short-circuits it) — for
   * "is this feature on at all" checks like addon toggles. Keeps `access`
   * purely about permissions, so declarative scope markers still compose
   * with runtime feature gates instead of being replaced by predicates.
   *
   * `self` is the `@McpController()` instance the entry was declared on,
   * handed in at attach time. Without it the gate could only reach a
   * module-level singleton, because the options object is built when the class
   * is defined and there is no `this` yet — which is how a host ends up
   * constructing a second copy of a service outside its own container just to
   * answer "is this addon on". With it, the predicate reads an injected
   * collaborator and the dependency is visible in the module graph.
   *
   * Declared with method syntax on purpose: that makes the parameter bivariant,
   * so a predicate written against its own controller class stays assignable
   * here. The registry always passes the instance that declared the entry.
   */
  when?(ctx: McpContext, self: object): boolean;
  /** Omitted ⇒ the entry is always registered (subject to `when`). */
  access?: McpAccess;
}

/**
 * Mirrors the SDK's `registerTool` config. `inputSchema` is a ZodRawShape
 * passed straight through — the SDK does the parsing/validation.
 * `annotations`/`_meta` are kept structural so the package's public d.ts
 * never imports deep SDK subpaths.
 */
export interface ToolOptions extends McpEntryOptionsBase {
  inputSchema?: ZodRawShape;
  outputSchema?: ZodRawShape;
  annotations?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

/** Mirrors `registerResource(name, uri, metadata, cb)` for a fixed URI. */
export interface ResourceOptions extends McpEntryOptionsBase {
  uri: string;
  mimeType?: string;
  _meta?: Record<string, unknown>;
}

/** Mirrors `registerResource(name, new ResourceTemplate(uriTemplate), metadata, cb)`. */
export interface ResourceTemplateOptions extends McpEntryOptionsBase {
  uriTemplate: string;
  mimeType?: string;
  _meta?: Record<string, unknown>;
}

/** Mirrors the SDK's `registerPrompt` config (argsSchema entries must be string-valued Zod schemas). */
export interface PromptOptions extends McpEntryOptionsBase {
  argsSchema?: ZodRawShape;
}

export type McpEntryKind = 'tool' | 'resource' | 'resourceTemplate' | 'prompt';

/** Per-session options for `McpRegistry.attach()`. */
export interface McpAttachOptions {
  /**
   * Called immediately before every attached handler runs, with the entry's
   * kind and registered name. This is the host's observability seam (e.g. a
   * tool-call audit trail) — nest-mcp itself attaches no semantics to it.
   * Contract: the hook MUST NOT throw; nest-mcp does not catch, so a throwing
   * hook fails the very invocation it is observing. Hosts wrap their own
   * failure handling.
   */
  onInvoke?: (info: { kind: McpEntryKind; name: string }) => void;
}

export type McpEntry =
  | { kind: 'tool'; methodName: string; options: ToolOptions }
  | { kind: 'resource'; methodName: string; options: ResourceOptions }
  | { kind: 'resourceTemplate'; methodName: string; options: ResourceTemplateOptions }
  | { kind: 'prompt'; methodName: string; options: PromptOptions };

/** Introspection view of one recorded entry (see `McpRegistry.list()`). */
export interface McpRegistryListing {
  kind: McpEntryKind;
  name: string;
  className: string;
  methodName: string;
  access?: McpAccess;
}

/**
 * Host-supplied per-entry check run by `validate()`. Return a problem
 * description to fail boot, null/undefined to accept. Only called for
 * entries with DECLARATIVE access (predicates are opaque to the host).
 */
export type McpAccessValidator = (access: McpDeclarativeAccess, entry: McpRegistryListing) => string | null | undefined;

export interface McpModuleOptions {
  accessPolicy?: McpAccessPolicy;
  validateAccess?: McpAccessValidator;
}

/** Injection token for the options object given to `McpModule.forRoot()`. */
export const MCP_MODULE_OPTIONS = Symbol('MCP_MODULE_OPTIONS');
