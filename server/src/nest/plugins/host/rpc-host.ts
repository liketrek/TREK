import {
  KNOWN_METHODS,
  METHOD_PERMISSION,
  type KnownMethod,
  type RpcError,
  type RpcRequest,
  type RpcResponse,
} from '../protocol/envelope';
import type { PluginDataDb } from './plugin-data.service';
import { auditResource, isAuditable } from './plugin-audit';
import { BadParams, ForbiddenResource } from './rpc-errors';
import type { PluginRpcRegistry } from './rpc-kit/registry';

// Both used to be declared here. They now live in rpc-errors.ts so decorated
// *.rpc.ts handlers can throw them without importing the router, and are re-exported
// so every existing importer keeps working unchanged.
export { BadParams, ForbiddenResource };

/**
 * The per-plugin capability router (#plugins, M1) — the ENFORCEMENT POINT.
 *
 * Built from the plugin's GRANTED permission set. Only the methods a permission
 * unlocks are registered; an ungranted method is simply never in the map, so the
 * plugin cannot "call it anyway" — there is no shared object, only messages, and
 * the host is the sole holder of the trek.db handle and the broadcast fns.
 *
 * The handlers themselves no longer live here. Every one of the 113 wire methods is
 * a `@PluginMethod` / `@PluginOpenMethod` on a `@PluginController()` provider in its
 * own domain, and the registry binds the granted subset into the map below. What is
 * left is the part that was never domain-specific: build the map, dispatch into it,
 * audit the call, and map a thrown error onto a wire code.
 *
 * Runs in the HOST (parent) process.
 */

/** What the router needs that is neither a domain service nor a permission check. */
export interface HostDeps {
  /**
   * The plugin's own sqlite (db:own). A GETTER on the factory side, resolved per
   * access: disable()/re-enable builds a NEW host while the old one's dispose() may
   * still be closing the handle, so a captured one leaves the new host throwing
   * 'database connection is not open'.
   */
  data: PluginDataDb;
  /** Call an export on another plugin (this host's plugin is the caller). Authorizes
   * the dependency edge + the target's `provides` allowlist, forwards the acting user. */
  callPlugin(targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown>;
  /** Publish an event from this host's plugin to its subscribed dependents. */
  emitPluginEvent(event: string, payload: unknown): void;
  /** Optional sink for the capability audit log (host-side, hash-chained). */
  audit?(entry: { pluginId: string; actingUserId?: number; method: string; resource: string | null; code: string }): void;
}

type Handler = (params: Record<string, unknown>, actingUserId: number | undefined) => unknown;

export class PluginRpcHost {
  private methods = new Map<string, Handler>();

  constructor(
    private readonly pluginId: string,
    granted: ReadonlySet<string>,
    private readonly deps: HostDeps,
    registry: PluginRpcRegistry,
  ) {
    // `deps.data` is the lazy per-access getter the factory supplies, so passing it
    // through a getter here preserves the disable/re-enable semantics exactly and the
    // kit never needs to know about plugin-host-state.
    registry.bindInto(this.methods, granted, (actingUserId) => ({
      pluginId,
      actingUserId,
      get data() {
        return deps.data;
      },
      // Per host, like everything else on the context: the router behind these binds
      // THIS plugin as the caller, which is what lets it authorise a call against the
      // declared dependency edge and the target's provides/emits allowlist.
      plugins: {
        call: (targetId, fn, args, uid) => deps.callPlugin(targetId, fn, args, uid),
        emit: (event, payload) => deps.emitPluginEvent(event, payload),
      },
    }));
  }

  async dispatch(req: RpcRequest, actingUserId?: number): Promise<RpcResponse | RpcError> {
    // Anything but an object is treated as no params at all. The envelope comes
    // off an IPC channel a plugin can write to, and `'_inv' in raw` below throws a
    // TypeError on a primitive — outside handle()'s try/catch, so it escapes as a
    // rejection rather than an error envelope.
    const raw = (typeof req.params === 'object' && req.params !== null ? req.params : {}) as Record<string, unknown>;
    // The supervisor resolves the acting user from `_inv` BEFORE dispatch and passes
    // the request on untouched, so `_inv` is visible to every handler today and is in
    // effect a reserved param name. Strip it here: no handler and no audit reads
    // anything but named fields, and dropping it keeps a future strict schema parse
    // from rejecting calls every shipped plugin makes.
    const { _inv, ...stripped } = raw;
    const params = '_inv' in raw ? stripped : raw;
    const res = await this.handle(req, params, actingUserId);
    // Audit the core-data / broadcast surface (incl. denials) at the boundary.
    if (this.deps.audit && isAuditable(req.method)) {
      try {
        this.deps.audit({
          pluginId: this.pluginId,
          actingUserId,
          method: req.method,
          resource: auditResource(req.method, params),
          code: res.ok ? 'ok' : (res as RpcError).error.code,
        });
      } catch {
        /* auditing must never break a call */
      }
    }
    return res;
  }

  private async handle(
    req: RpcRequest,
    params: Record<string, unknown>,
    actingUserId?: number,
  ): Promise<RpcResponse | RpcError> {
    const handler = this.methods.get(req.method);
    if (!handler) {
      const known = (KNOWN_METHODS as readonly string[]).includes(req.method as KnownMethod);
      return this.err(
        req.id,
        known ? 'PERMISSION_DENIED' : 'UNKNOWN_METHOD',
        known
          ? `${req.method} requires the "${(METHOD_PERMISSION as Record<string, string>)[req.method]}" permission, which was not granted to plugin "${this.pluginId}"`
          : `unknown method ${req.method}`,
      );
    }
    try {
      const result = await handler(params, actingUserId);
      return { k: 'res', id: req.id, ok: true, result };
    } catch (e) {
      if (e instanceof BadParams) return this.err(req.id, 'BAD_PARAMS', e.message);
      if (e instanceof ForbiddenResource) return this.err(req.id, 'RESOURCE_FORBIDDEN', e.message);
      return this.err(req.id, 'HOST_ERROR', e instanceof Error ? e.message : 'internal error');
    }
  }

  private err(id: string, code: RpcError['error']['code'], message: string): RpcError {
    return { k: 'res', id, ok: false, error: { code, message } };
  }

  /** Release host-held resources (the plugin's own db handle) on terminal stop. */
  dispose(): void {
    try {
      this.deps.data.close();
    } catch {
      /* already closed */
    }
  }
}
