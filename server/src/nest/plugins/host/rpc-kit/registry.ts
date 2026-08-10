import {
  HOOK_PERMISSION,
  KNOWN_METHODS,
  METHOD_PERMISSION,
  UNCONDITIONAL_METHODS,
  isKnownPermission,
} from '../../protocol/envelope';
import { getEntry, isPluginController, type ClassRef } from './metadata';
import type {
  PluginHookContract,
  PluginRpcContext,
  PluginRpcEntry,
  PluginRpcListing,
  PluginRpcRegistryOptions,
} from './types';

interface BoundEntry {
  instance: object;
  className: string;
  entry: PluginRpcEntry;
}

/** The `ClassName.methodName` convention every problem message uses. */
function describeBound(bound: BoundEntry): string {
  return `${bound.className}.${bound.entry.methodName}`;
}

/** Nest's @Controller() path metadata key. Read only to reject a mis-decorated class. */
const NEST_PATH_METADATA = 'path';

/**
 * reflect-metadata is loaded by Nest at boot, but the kit deliberately does not
 * depend on it (see metadata.ts), so a bare vitest worker may not have it. Probing
 * through an optional shape keeps the @Controller guard best-effort instead of a
 * hard prerequisite.
 */
const reflectMaybe = Reflect as typeof Reflect & {
  hasMetadata?: (metadataKey: string, target: object) => boolean;
};

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
 * Holds every decorated plugin RPC entry bound to its provider instance, checks the
 * decorator arguments against protocol/envelope.ts, and fills a per-plugin dispatch
 * map with the subset that plugin was granted.
 *
 * Plain class with no DI so `createTestPluginRegistry` can build one without a Nest
 * app; `PluginRpcRegistryService` is the DI-discovered subclass.
 */
export class PluginRpcRegistry {
  private readonly bound: BoundEntry[] = [];

  constructor(private readonly options: PluginRpcRegistryOptions = {}) {}

  /**
   * Records every decorated method of `instance`. `methodNames` (e.g. from Nest's
   * MetadataScanner) narrows the scan; omitted, the prototype chain is enumerated.
   */
  register(instance: object, methodNames?: readonly string[]): void {
    const ctor = (instance as { constructor: unknown }).constructor;
    if (!isPluginController(ctor)) {
      throw new Error(`${(ctor as ClassRef).name} is not decorated with @PluginController()`);
    }
    if (reflectMaybe.hasMetadata?.(NEST_PATH_METADATA, ctor as object)) {
      throw new Error(
        `${(ctor as ClassRef).name} is a Nest @Controller. @PluginController must go on a provider class, ` +
          'because @Injectable() rewrites the scope metadata @Controller() set',
      );
    }
    const className = (ctor as ClassRef).name;
    const names = methodNames ?? enumerateMethodNames(instance);
    for (const name of new Set(names)) {
      const entry = getEntry(ctor as ClassRef, name);
      if (entry) this.bound.push({ instance, className, entry });
    }
  }

  /**
   * Re-checks every decorator argument against the runtime tables and throws ONCE
   * with all problems listed. The type layer already pins these, but types evaporate
   * under an `as` cast or a hand-emitted JS consumer, so the same invariant is
   * asserted on both paths.
   */
  validate(): void {
    const problems: string[] = [];
    const byMethod = new Map<string, BoundEntry[]>();
    const hookFns = new Set<string>();
    const coveredHooks = new Set<string>();

    for (const bound of this.bound) {
      const entry = bound.entry;
      if (entry.kind === 'method') {
        if (!(KNOWN_METHODS as readonly string[]).includes(entry.method)) {
          problems.push(`method "${entry.method}" (${describeBound(bound)}) is not in KNOWN_METHODS`);
          continue;
        }
        const expected = (METHOD_PERMISSION as Record<string, string>)[entry.method];
        if (entry.permission !== expected) {
          problems.push(
            `method "${entry.method}" (${describeBound(bound)}) declares "${entry.permission}" ` +
              `but METHOD_PERMISSION says "${expected}"`,
          );
        }
        if (!isKnownPermission(entry.permission)) {
          problems.push(
            `method "${entry.method}" (${describeBound(bound)}) declares unknown permission "${entry.permission}"`,
          );
        }
      } else if (entry.kind === 'open') {
        if (!(UNCONDITIONAL_METHODS as readonly string[]).includes(entry.method)) {
          problems.push(`open method "${entry.method}" (${describeBound(bound)}) is not in UNCONDITIONAL_METHODS`);
        }
      } else {
        const expected = (HOOK_PERMISSION as Record<string, string | undefined>)[entry.hook];
        if (!expected) {
          problems.push(`hook "${entry.hook}" (${describeBound(bound)}) is not a HOOK_PERMISSION key`);
        } else if (entry.permission !== expected) {
          problems.push(
            `hook "${entry.hook}" (${describeBound(bound)}) declares "${entry.permission}" ` +
              `but HOOK_PERMISSION says "${expected}"`,
          );
        }
        // Uniqueness is per (hook, fn), NOT one consumer per hook: photoProvider has
        // three call sites and calendarSource two distinct fns.
        const key = `${entry.hook}#${entry.fn}`;
        if (hookFns.has(key)) {
          problems.push(`hook fn "${key}" is declared twice (${describeBound(bound)})`);
        }
        hookFns.add(key);
        coveredHooks.add(entry.hook);
      }

      if (entry.kind !== 'hook') {
        const list = byMethod.get(entry.method) ?? [];
        list.push(bound);
        byMethod.set(entry.method, list);
      }
    }

    for (const [method, list] of byMethod) {
      if (list.length > 1) {
        problems.push(`method "${method}" is handled by ${list.map(describeBound).join(' and ')}`);
      }
    }

    if (this.options.requireTotalCoverage) {
      for (const method of [...KNOWN_METHODS, ...UNCONDITIONAL_METHODS]) {
        if (!byMethod.has(method)) problems.push(`method "${method}" has no handler`);
      }
      for (const hook of Object.keys(HOOK_PERMISSION)) {
        if (!coveredHooks.has(hook)) {
          problems.push(`hook "${hook}" has no host-side consumer (dead grant on the consent screen)`);
        }
      }
    }

    if (problems.length) throw new Error(`Invalid plugin RPC registry: ${problems.join('; ')}`);
  }

  /**
   * Fills `map` with the handlers this plugin's grants unlock. Registration IS
   * authorization, exactly as the legacy router does it: an ungranted method is
   * ABSENT from the map rather than present-and-guarded, so an ungranted call still
   * falls through the untouched miss branch in handle() to PERMISSION_DENIED (known)
   * or UNKNOWN_METHOD (unknown).
   *
   * Per-plugin and per-host, never cached, because grants change on re-consent and
   * the supervisor then rebuilds the host.
   *
   * Throws on a name the caller's map already holds, so a half-migrated method
   * registered BOTH in the legacy constructor and here is a loud boot failure
   * instead of a silent override.
   */
  bindInto(
    map: Map<string, (params: Record<string, unknown>, actingUserId: number | undefined) => unknown>,
    granted: ReadonlySet<string>,
    makeCtx: (actingUserId: number | undefined) => PluginRpcContext,
  ): void {
    for (const bound of this.bound) {
      const entry = bound.entry;
      if (entry.kind === 'hook') continue;
      if (entry.kind === 'method' && !granted.has(entry.permission)) continue;
      if (map.has(entry.method)) {
        throw new Error(
          `plugin RPC method "${entry.method}" is registered twice ` +
            `(${describeBound(bound)} and the legacy router)`,
        );
      }
      const handler = (bound.instance as Record<string, (...args: unknown[]) => unknown>)[entry.methodName].bind(
        bound.instance,
      );
      map.set(entry.method, (params, actingUserId) => handler(params, makeCtx(actingUserId)));
    }
  }

  /** Every declared (hook, fn) contract, keyed `${hook}#${fn}`. */
  hookContracts(): ReadonlyMap<string, PluginHookContract> {
    const contracts = new Map<string, PluginHookContract>();
    for (const bound of this.bound) {
      const entry = bound.entry;
      if (entry.kind !== 'hook') continue;
      contracts.set(`${entry.hook}#${entry.fn}`, {
        hook: entry.hook,
        fn: entry.fn,
        permission: entry.permission,
        timeoutMs: entry.timeoutMs,
        consumer: describeBound(bound),
      });
    }
    return contracts;
  }

  /** The contract a call site relies on, or a throw naming what it asked for. */
  hookContract(hook: string, fn: string): PluginHookContract {
    const contract = this.hookContracts().get(`${hook}#${fn}`);
    if (!contract) throw new Error(`no @PluginHook declaration for "${hook}#${fn}"`);
    return contract;
  }

  /** The wire methods this registry owns, for the coverage ledger test. */
  methodNames(): Set<string> {
    const names = new Set<string>();
    for (const bound of this.bound) {
      if (bound.entry.kind !== 'hook') names.add(bound.entry.method);
    }
    return names;
  }

  list(): PluginRpcListing[] {
    return this.bound.map(({ className, entry }) => ({
      kind: entry.kind,
      name: entry.kind === 'hook' ? `${entry.hook}#${entry.fn}` : entry.method,
      permission: entry.kind === 'open' ? null : entry.permission,
      className,
      methodName: entry.methodName,
    }));
  }
}
