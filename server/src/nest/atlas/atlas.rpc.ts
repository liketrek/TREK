import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { ADDON_IDS } from '../../addons';
import { AtlasService, BucketItemExistsError } from './atlas.service';

/**
 * The atlas surface a plugin may reach (#plugins): visited countries and regions plus
 * the bucket list.
 *
 * Every row is the acting user's own, so there is no trip scoping and no cross-tenant
 * surface at all; what each method does need is a host-bound acting user and the
 * Atlas addon. The addon gate used to sit in the deps factory closure, so it is
 * repeated on every method here rather than assumed.
 */
@PluginController()
export class AtlasRpc {
  constructor(
    private readonly atlas: AtlasService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('atlas.visited', { permission: 'db:read:atlas' })
  visited(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'reads');
    this.requireAtlasAddon();
    return {
      countries: this.atlas.listVisitedCountries(userId),
      regions: this.atlas.listManuallyVisitedRegions(userId),
    };
  }

  @PluginMethod('atlas.bucketList', { permission: 'db:read:atlas' })
  bucketList(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'reads');
    this.requireAtlasAddon();
    return this.atlas.bucketList(userId) as unknown[];
  }

  @PluginMethod('atlas.markCountry', { permission: 'db:write:atlas' })
  markCountry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'writes');
    const code = this.code(params.code, 'code');
    this.requireAtlasAddon();
    this.atlas.markCountry(userId, code);
    return { visited: true };
  }

  @PluginMethod('atlas.unmarkCountry', { permission: 'db:write:atlas' })
  unmarkCountry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'writes');
    const code = this.code(params.code, 'code');
    this.requireAtlasAddon();
    this.atlas.unmarkCountry(userId, code);
    return { visited: false };
  }

  @PluginMethod('atlas.markRegion', { permission: 'db:write:atlas' })
  markRegion(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'writes');
    // A missing name falls back to the code, so the row is never nameless.
    const regionName = typeof params.regionName === 'string' && params.regionName
      ? params.regionName.slice(0, 128)
      : String(params.regionCode ?? '');
    const regionCode = this.code(params.regionCode, 'regionCode');
    const countryCode = this.code(params.countryCode, 'countryCode');
    this.requireAtlasAddon();
    this.atlas.markRegion(userId, regionCode, regionName, countryCode);
    return { visited: true };
  }

  @PluginMethod('atlas.unmarkRegion', { permission: 'db:write:atlas' })
  unmarkRegion(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'writes');
    const regionCode = this.code(params.regionCode, 'regionCode');
    this.requireAtlasAddon();
    this.atlas.unmarkRegion(userId, regionCode);
    return { visited: false };
  }

  @PluginMethod('atlas.createBucketItem', { permission: 'db:write:atlas' })
  createBucketItem(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'writes');
    const input = asPayload(params.input);
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('bucket item name is required');
    this.requireAtlasAddon();
    try {
      return this.atlas.createBucketItem(userId, input as never);
    } catch (err) {
      // #1898: a repeated wish is the caller's mistake, not ours. Without this the
      // plugin sees a generic internal error and cannot tell the two apart.
      if (err instanceof BucketItemExistsError) throw new BadParams('bucket item already exists');
      throw err;
    }
  }

  @PluginMethod('atlas.deleteBucketItem', { permission: 'db:write:atlas' })
  deleteBucketItem(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireAtlasUser(ctx, 'writes');
    const itemId = num(params.itemId, 'itemId');
    this.requireAtlasAddon();
    if (!this.atlas.deleteBucketItem(userId, itemId)) {
      throw new ForbiddenResource(`no bucket item ${itemId} for this user`);
    }
    return { deleted: true };
  }

  /**
   * A bound acting user. Reads and writes word the refusal differently.
   *
   * Deliberately does NOT check the addon: on the write paths the router evaluated
   * its params (and so the code validation) before the addon gate inside the deps
   * closure, so a malformed code still reports BAD_PARAMS rather than the addon.
   */
  private requireAtlasUser(ctx: PluginRpcContext, kind: 'reads' | 'writes'): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource(`atlas ${kind} require an authenticated user context`);
    }
    return ctx.actingUserId;
  }

  private requireAtlasAddon(): void {
    this.guards.requireAddon(ADDON_IDS.ATLAS, 'atlas');
  }

  /** Country and region codes are short and stored upper-cased. */
  private code(value: unknown, name: string): string {
    if (typeof value !== 'string' || value.trim() === '' || value.length > 8) {
      throw new BadParams(`${name} must be a short code`);
    }
    return value.trim().toUpperCase();
  }
}
