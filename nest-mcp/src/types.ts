import type { ZodRawShape } from 'zod';

/**
 * The per-session context handed to `McpRegistry.attach(server, ctx)` and
 * forwarded to every handler (last argument) and access predicate/policy.
 *
 * The package defines NO context fields of its own — the host application
 * augments this interface once:
 *
 *   declare module '@trek/nest-mcp' {
 *     interface McpContext { userId: number; scopes: string[] | null }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface McpContext {}

/**
 * Host-augmentable registry of valid `access.group` values — the `McpContext`
 * augmentation trick applied to groups. Augment once:
 *
 *   declare module '@trek/nest-mcp' {
 *     interface McpAccessGroupRegistry extends Record<MyGroupUnion, true> {}
 *   }
 *
 * Unaugmented, `McpAccessGroup` stays `string` — the package attaches no
 * semantics to groups, same contract as `McpContext`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface McpAccessGroupRegistry {}

export type McpAccessGroup = keyof McpAccessGroupRegistry extends never
  ? string
  : keyof McpAccessGroupRegistry & string;

/**
 * Host augmentation point for the access *mode*, mirroring
 * `McpAccessGroupRegistry`:
 *
 *   declare module '@trek/nest-mcp' {
 *     interface McpAccessModeRegistry extends Record<MyModeUnion, true> {}
 *   }
 *
 * Unaugmented, `McpAccessMode` falls back to `'read' | 'write'` — the two
 * modes every host had before this was augmentable, so leaving the registry
 * empty keeps the previous contract exactly.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface McpAccessModeRegistry {}

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
