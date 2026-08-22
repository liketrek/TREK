import { getEntry, isMcpController, type ClassRef } from './metadata';
import type {
  McpAccessPolicy,
  McpAccessValidator,
  McpAttachOptions,
  McpContext,
  McpEntry,
  McpRegistryListing,
  PromptOptions,
  ResourceOptions,
  ResourceTemplateOptions,
  ToolOptions,
} from './types';
import { ResourceTemplate as SdkResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

import type { ZodRawShape } from 'zod';

interface BoundEntry {
  entry: McpEntry;
  instance: object;
}

export interface McpRegistryOptions {
  accessPolicy?: McpAccessPolicy;
  validateAccess?: McpAccessValidator;
}

type AnyHandler = (this: unknown, ...handlerArgs: unknown[]) => unknown;

/**
 * Structural view of the SDK registration surface. The SDK's real signatures
 * are generic over the Zod shapes; the registry passes schemas straight
 * through and binds `ctx` where the SDK would pass `extra`, so it needs (and
 * exposes) none of that type-level machinery.
 */
interface LooseRegistrar {
  registerTool(name: string, config: Record<string, unknown>, cb: (...cbArgs: unknown[]) => unknown): unknown;
  registerResource(
    name: string,
    uriOrTemplate: string | SdkResourceTemplate,
    config: Record<string, unknown>,
    cb: (...cbArgs: unknown[]) => unknown,
  ): unknown;
  registerPrompt(name: string, config: Record<string, unknown>, cb: (...cbArgs: unknown[]) => unknown): unknown;
}

function describeBound({ entry, instance }: BoundEntry): string {
  return `${(instance as { constructor: { name: string } }).constructor.name}.${entry.methodName}`;
}

/** Own + inherited method names, excluding constructor and Object.prototype. */
function enumerateMethodNames(instance: object): string[] {
  const names = new Set<string>();
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      if (typeof descriptor?.value === 'function') names.add(name);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names];
}

/**
 * Holds every decorated MCP entry bound to its provider instance and attaches
 * them, filtered by access, onto a per-session `McpServer`. Plain class with
 * no DI so `createTestRegistry` can build one without a Nest app;
 * `McpRegistryService` is the DI-discovered subclass.
 */
export class McpRegistry {
  private readonly bound: BoundEntry[] = [];
  private readonly accessPolicy?: McpAccessPolicy;
  private readonly validateAccess?: McpAccessValidator;

  constructor(options: McpRegistryOptions = {}) {
    this.accessPolicy = options.accessPolicy;
    this.validateAccess = options.validateAccess;
  }

  /**
   * Records every decorated method of `instance`. `methodNames` (e.g. from
   * Nest's MetadataScanner) narrows the scan; omitted, the instance's
   * prototype chain is enumerated directly.
   */
  register(instance: object, methodNames?: readonly string[]): void {
    const ctor = (instance as { constructor: unknown }).constructor;
    if (!isMcpController(ctor)) {
      throw new Error(`${(ctor as ClassRef).name} is not decorated with @McpController()`);
    }
    const names = methodNames ?? enumerateMethodNames(instance);
    for (const name of new Set(names)) {
      const entry = getEntry(ctor, name);
      if (entry) this.bound.push({ entry, instance });
    }
  }

  /**
   * Registers every entry passing its access check onto `server`, binding
   * `ctx` as the handler's last argument (in the SDK `extra` slot). `opts`
   * carries per-session hooks — see `McpAttachOptions`.
   */
  attach(server: McpServer, ctx: McpContext, opts?: McpAttachOptions): void {
    const registrar = server as unknown as LooseRegistrar;
    for (const { entry, instance } of this.bound) {
      if (!this.allowed(entry, ctx, instance)) continue;
      const handler = (instance as unknown as Record<string, AnyHandler>)[entry.methodName];
      switch (entry.kind) {
        case 'tool':
          this.attachTool(registrar, entry.options, instance, handler, ctx, opts);
          break;
        case 'resource':
          this.attachResource(registrar, entry.options, instance, handler, ctx, opts);
          break;
        case 'resourceTemplate':
          this.attachResourceTemplate(registrar, entry.options, instance, handler, ctx, opts);
          break;
        case 'prompt':
          this.attachPrompt(registrar, entry.options, instance, handler, ctx, opts);
          break;
      }
    }
  }

  /**
   * Fail-fast configuration check — call once after all instances are
   * registered (McpRegistryService runs it at boot, createTestRegistry on
   * construction) so misconfiguration breaks app startup instead of MCP
   * session creation:
   * - duplicate names per kind (fixed resources: duplicate URIs), which the
   *   SDK would otherwise reject per-session at attach();
   * - declarative access without a configured accessPolicy;
   * - declarative access the host-supplied `validateAccess` hook rejects
   *   (predicates are opaque to the host and never passed to it).
   * All problems are aggregated into one error so a single boot failure
   * reports every misconfiguration.
   */
  validate(): void {
    const seen = new Map<string, BoundEntry>();
    const duplicates: string[] = [];
    const unresolvable: string[] = [];
    const invalidAccess: string[] = [];
    for (const bound of this.bound) {
      const { entry } = bound;
      const key =
        entry.kind === 'resource' ? `resource uri "${entry.options.uri}"` : `${entry.kind} "${entry.options.name}"`;
      const prior = seen.get(key);
      if (prior) duplicates.push(`${key} (${describeBound(prior)} and ${describeBound(bound)})`);
      else seen.set(key, bound);
      const access = entry.options.access;
      if (access === undefined || typeof access === 'function') continue;
      if (!this.accessPolicy) unresolvable.push(`${key} (${describeBound(bound)})`);
      const problem = this.validateAccess?.(access, this.toListing(bound));
      if (problem) invalidAccess.push(`${key} (${describeBound(bound)}): ${problem}`);
    }
    const problems: string[] = [];
    if (duplicates.length) problems.push(`duplicate MCP registrations: ${duplicates.join(', ')}`);
    if (unresolvable.length) {
      problems.push(
        `entries declare declarative access but no accessPolicy was configured ` +
          `(McpModule.forRoot({ accessPolicy })): ${unresolvable.join(', ')}`,
      );
    }
    if (invalidAccess.length) problems.push(`invalid access declarations: ${invalidAccess.join(', ')}`);
    if (problems.length) throw new Error(`Invalid MCP registry: ${problems.join('; ')}`);
  }

  /** Introspection: every recorded entry, regardless of access. */
  list(): McpRegistryListing[] {
    return this.bound.map((bound) => this.toListing(bound));
  }

  private toListing({ entry, instance }: BoundEntry): McpRegistryListing {
    return {
      kind: entry.kind,
      name: entry.options.name,
      className: (instance as { constructor: { name: string } }).constructor.name,
      methodName: entry.methodName,
      access: entry.options.access,
    };
  }

  private allowed(entry: McpEntry, ctx: McpContext, instance: object): boolean {
    // The declaring instance goes in so the gate can read an injected
    // collaborator. It is resolved here, at attach, rather than captured when
    // the options object was built — the class body runs long before the
    // container exists.
    if (entry.options.when && !entry.options.when(ctx, instance)) return false;
    const access = entry.options.access;
    if (access === undefined) return true;
    if (typeof access === 'function') return access(ctx);
    if (!this.accessPolicy) {
      // Fail loud: silently registering would leak a gated entry, silently
      // skipping would be undebuggable.
      throw new Error(
        `MCP ${entry.kind} "${entry.options.name}" declares declarative access ` +
          `but no accessPolicy was configured (McpModule.forRoot({ accessPolicy }))`,
      );
    }
    return this.accessPolicy(access, ctx);
  }

  private attachTool(
    registrar: LooseRegistrar,
    options: ToolOptions,
    instance: object,
    handler: AnyHandler,
    ctx: McpContext,
    opts?: McpAttachOptions,
  ): void {
    const config: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      inputSchema: options.inputSchema as ZodRawShape | undefined,
      outputSchema: options.outputSchema,
      annotations: options.annotations,
      _meta: options._meta,
    };
    // The SDK invokes the callback as (args, extra) when inputSchema is
    // present (even an empty shape) and as (extra) otherwise — normalize so
    // the decorated method always receives (args, ctx).
    const cb =
      options.inputSchema !== undefined
        ? (args: unknown, _extra: unknown) => {
            opts?.onInvoke?.({ kind: 'tool', name: options.name });
            return handler.call(instance, args, ctx);
          }
        : (_extra: unknown) => {
            opts?.onInvoke?.({ kind: 'tool', name: options.name });
            return handler.call(instance, {}, ctx);
          };
    registrar.registerTool(options.name, config, cb);
  }

  private attachResource(
    registrar: LooseRegistrar,
    options: ResourceOptions,
    instance: object,
    handler: AnyHandler,
    ctx: McpContext,
    opts?: McpAttachOptions,
  ): void {
    const metadata: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      mimeType: options.mimeType,
      _meta: options._meta,
    };
    registrar.registerResource(options.name, options.uri, metadata, (uri: unknown, _extra: unknown) => {
      opts?.onInvoke?.({ kind: 'resource', name: options.name });
      return handler.call(instance, uri, ctx);
    });
  }

  private attachResourceTemplate(
    registrar: LooseRegistrar,
    options: ResourceTemplateOptions,
    instance: object,
    handler: AnyHandler,
    ctx: McpContext,
    opts?: McpAttachOptions,
  ): void {
    const metadata: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      mimeType: options.mimeType,
      _meta: options._meta,
    };
    registrar.registerResource(
      options.name,
      new SdkResourceTemplate(options.uriTemplate, { list: undefined }),
      metadata,
      (uri: unknown, variables: unknown, _extra: unknown) => {
        opts?.onInvoke?.({ kind: 'resourceTemplate', name: options.name });
        return handler.call(instance, uri, variables, ctx);
      },
    );
  }

  private attachPrompt(
    registrar: LooseRegistrar,
    options: PromptOptions,
    instance: object,
    handler: AnyHandler,
    ctx: McpContext,
    opts?: McpAttachOptions,
  ): void {
    const config: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      argsSchema: options.argsSchema,
    };
    const cb =
      options.argsSchema !== undefined
        ? (args: unknown, _extra: unknown) => {
            opts?.onInvoke?.({ kind: 'prompt', name: options.name });
            return handler.call(instance, args, ctx);
          }
        : (_extra: unknown) => {
            opts?.onInvoke?.({ kind: 'prompt', name: options.name });
            return handler.call(instance, {}, ctx);
          };
    registrar.registerPrompt(options.name, config, cb);
  }
}
