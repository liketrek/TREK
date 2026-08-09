import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PluginRpcHost } from './rpc-host';
import type { PluginRpcRegistry } from './rpc-kit/registry';
import { PluginRpcRegistryService } from './rpc-kit/registry.service';
import { appendAudit } from './plugin-audit';
import { getPluginDataDb } from './plugin-host-state';

/** Routes inter-plugin calls/events; supplied by PluginRuntimeService (owns the supervisor). */
export interface PluginCallRouter {
  callPlugin(callerId: string, targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown>;
  emitPluginEvent(sourceId: string, event: string, payload: unknown): void;
}

/**
 * Builds a plugin's capability host (#plugins, M1).
 *
 * This used to be a 900-line wiring sheet: every privileged domain service was
 * injected here and handed to the router as a closure. The domains now own their own
 * plugin surface — one `@PluginController()` provider per domain, discovered at boot
 * by PluginRpcRegistryService — so all that is left is the three things that are
 * genuinely per-plugin and belong to nobody else: the plugin's own sqlite handle, the
 * inter-plugin router bound with this plugin as the caller, and the audit sink.
 */
@Injectable()
export class PluginRpcHostFactory {
  constructor(
    private readonly db: DatabaseService,
    // Injected by its concrete token, held as the base class: a no-Nest test can then
    // hand in a createTestPluginRegistry() built from the instances it cares about.
    @Inject(PluginRpcRegistryService) private readonly registry: PluginRpcRegistry,
  ) {}

  create(id: string, granted: ReadonlySet<string>, router: PluginCallRouter): PluginRpcHost {
    return new PluginRpcHost(
      id,
      granted,
      {
        // Resolve the data handle lazily on every access rather than capturing it once.
        // disable()/uninstall() drop the entry from `running` BEFORE awaiting the kill
        // grace and calling dispose(), so a re-enable in that window builds a NEW host.
        // A captured handle would let the OLD host's dispose() close the DB out from
        // under the NEW one (every db.* call then throws 'database connection is not
        // open'). Resolving per call means the new host always uses the current, open
        // handle — getPluginDataDb recreates one the moment a stale dispose closes it.
        // Safe because db.* is synchronous, so no call is ever mid-flight when a dispose
        // from another tick closes the handle.
        get data() {
          return getPluginDataDb(id);
        },
        // The router binds this host's plugin id as the caller/source.
        callPlugin: (targetId, fn, args, actingUserId) => router.callPlugin(id, targetId, fn, args, actingUserId),
        emitPluginEvent: (event, payload) => router.emitPluginEvent(id, event, payload),
        audit: (entry) => appendAudit(this.db.connection, entry),
      },
      this.registry,
    );
  }
}
