import type { HookKey, HookPermission, KnownMethod, UnconditionalMethod } from '../../protocol/envelope';
import type { PluginDataDb } from '../plugin-data.service';

/**
 * Everything a plugin RPC handler may see. Built PER DISPATCH, never cached.
 *
 * `actingUserId` is HOST-bound: the supervisor resolves it from its invocation map
 * before dispatch, and it is never taken from params. A plugin could otherwise set
 * an `asUserId` field to any id and read another user's trips.
 *
 * `data` is a GETTER, resolved on every access and never captured. The reason is
 * spelled out on `get data()` in plugin-host-deps.factory.ts: disable()/re-enable
 * builds a NEW host while the old one's dispose() may still close the handle, so a
 * captured handle leaves the new host throwing 'database connection is not open'.
 * A constructor-injected DB in a singleton *Rpc class would additionally be a
 * cross-plugin data leak, since these classes are per-app, not per-plugin.
 */
export interface PluginRpcContext {
  readonly pluginId: string;
  readonly actingUserId: number | undefined;
  readonly data: PluginDataDb;
  /**
   * The inter-plugin capabilities. PER HOST, like everything else on this context:
   * the router that backs them is created per plugin and binds THIS plugin as the
   * caller, which is what lets it authorise a call against the declared dependency
   * edge and the target's provides/emits allowlist.
   *
   * Typed structurally rather than imported, so the kit stays free of host imports
   * (see rpc-kit/README.md). The host supplies the real router when it binds.
   */
  readonly plugins: PluginRpcPeers;
}

/** What a plugin may do to its declared dependencies. */
export interface PluginRpcPeers {
  call(targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown>;
  emit(event: string, payload: unknown): void;
}

export type PluginRpcHandler = (params: Record<string, unknown>, ctx: PluginRpcContext) => unknown;

/**
 * What a decorator records. `methodName` is the name of the decorated class method,
 * `method` the wire name it answers to; they are deliberately independent.
 */
export type PluginRpcEntry =
  | { kind: 'method'; methodName: string; method: KnownMethod; permission: string }
  | { kind: 'open'; methodName: string; method: UnconditionalMethod }
  | { kind: 'hook'; methodName: string; hook: HookKey; permission: string; fn: string; timeoutMs: number };

export interface PluginHookOptions<H extends HookKey> {
  /** MUST equal HOOK_PERMISSION[hook]. The compiler enforces it, validate() re-checks it. */
  permission: HookPermission<H>;
  /** The function on the plugin's `hooks.<hook>` object, e.g. 'getWarnings'. */
  fn: string;
  /** Host to plugin budget for this fn. Defaults to 5000 to match the common case. */
  timeoutMs?: number;
}

/** One declared (hook, fn) contract, for the hook call sites and their tests. */
export interface PluginHookContract {
  hook: HookKey;
  fn: string;
  permission: string;
  timeoutMs: number;
  /** `ClassName.methodName` of the host-side consumer that declared it. */
  consumer: string;
}

export interface PluginRpcListing {
  kind: PluginRpcEntry['kind'];
  /** The wire method, or `${hook}#${fn}` for a hook declaration. */
  name: string;
  /** null means unconditional (no grant check). */
  permission: string | null;
  className: string;
  methodName: string;
}

export interface PluginRpcRegistryOptions {
  /**
   * Flip to true once the legacy router map is empty: validate() then also fails when
   * a KNOWN_METHOD has no handler, or a hook has no host-side consumer.
   */
  requireTotalCoverage?: boolean;
}
