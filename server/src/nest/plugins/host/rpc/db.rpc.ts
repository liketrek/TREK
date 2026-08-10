import { PluginController, PluginMethod, PluginOpenMethod } from '../rpc-kit/decorators';
import { asArgs, asTxOps, str } from '../rpc-params';
import type { PluginRpcContext } from '../rpc-kit/types';
import { PluginUserSettingsService } from '../../plugin-user-settings.service';

/**
 * A plugin's OWN sqlite, plus the three methods the router registers unconditionally.
 *
 * Every method reads `ctx.data` fresh. It must never be captured in a field or a
 * closure: the handle is per plugin, and disable()/re-enable builds a new host while
 * the old one's dispose() may still be closing the previous handle. A captured one
 * would be both a stale-handle bug and, in a singleton like this, a cross-plugin data
 * leak, since one instance serves every plugin.
 */
@PluginController()
export class DbRpc {
  constructor(private readonly settings: PluginUserSettingsService) {}

  @PluginMethod('db.query', { permission: 'db:own' })
  query(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return ctx.data.query(str(params.sql, 'sql'), asArgs(params.args));
  }

  @PluginMethod('db.exec', { permission: 'db:own' })
  exec(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return ctx.data.exec(str(params.sql, 'sql'), asArgs(params.args));
  }

  @PluginMethod('db.migrate', { permission: 'db:own' })
  migrate(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return ctx.data.migrate(str(params.id, 'id'), str(params.sql, 'sql'));
  }

  @PluginMethod('db.tx', { permission: 'db:own' })
  tx(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return ctx.data.tx(asTxOps(params.ops));
  }

  /**
   * Inter-plugin call. No permission of its own: the router authorises it against
   * the declared dependency edge and the target's `provides` allowlist. The acting
   * user is forwarded so the target's export runs as the caller's user.
   */
  @PluginOpenMethod('plugins.call')
  callPlugin(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return ctx.plugins.call(str(params.targetId, 'targetId'), str(params.fn, 'fn'), params.args, ctx.actingUserId);
  }

  /** Same deal: the router checks the emitter's `emits` allowlist. */
  @PluginOpenMethod('events.emit')
  emitEvent(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    ctx.plugins.emit(str(params.event, 'event'), params.payload);
    return { ok: true };
  }

  /**
   * The plugin's OWN per-user settings, decrypted host-side. Unconditional and not
   * cross-tenant: it only ever returns THIS plugin's config for the acting user. A
   * userless context (a job or onLoad) has no user, so it returns undefined and the
   * plugin falls back to ctx.config.
   */
  @PluginOpenMethod('settings.get')
  getSetting(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    if (ctx.actingUserId === undefined) return { value: undefined };
    return { value: this.settings.readOne(ctx.pluginId, ctx.actingUserId, str(params.key, 'key')) };
  }
}
