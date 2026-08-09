import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { TagsService } from './tags.service';

/**
 * The tags surface a plugin may reach (#plugins). Tags are the acting user's own and
 * are not trip-scoped, so there is no membership gate here; what every handler does
 * need is a HOST-bound acting user, and a write additionally re-checks that the tag
 * belongs to that user.
 *
 * Moved verbatim out of the router and the deps factory. The messages differ by one
 * word between the read and the writes ("tag reads" vs "tag writes"), which is why
 * the read throws inline instead of going through PluginGuards.requireActor.
 */
@PluginController()
export class TagsRpc {
  constructor(private readonly tags: TagsService) {}

  @PluginMethod('tags.list', { permission: 'db:read:tags' })
  list(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown[] {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('tag reads require an authenticated user context');
    }
    return this.tags.list(ctx.actingUserId) as unknown[];
  }

  @PluginMethod('tags.create', { permission: 'db:write:tags' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('tag writes require an authenticated user context');
    }
    const input = asPayload(params.input);
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('tag name is required');
    return this.tags.create(ctx.actingUserId, input.name, typeof input.color === 'string' ? input.color : undefined);
  }

  @PluginMethod('tags.update', { permission: 'db:write:tags' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('tag writes require an authenticated user context');
    }
    const input = asPayload(params.input);
    const tagId = num(params.tagId, 'tagId');
    this.requireOwnTag(tagId, ctx.actingUserId);
    return this.tags.update(
      tagId,
      typeof input.name === 'string' ? input.name : undefined,
      typeof input.color === 'string' ? input.color : undefined,
    );
  }

  @PluginMethod('tags.delete', { permission: 'db:write:tags' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('tag writes require an authenticated user context');
    }
    const tagId = num(params.tagId, 'tagId');
    this.requireOwnTag(tagId, ctx.actingUserId);
    this.tags.remove(tagId);
    return { deleted: true };
  }

  /** Ownership is re-checked per write, so a plugin cannot edit another user's tag. */
  private requireOwnTag(tagId: number, userId: number): void {
    if (!this.tags.getByIdAndUser(tagId, userId)) {
      throw new ForbiddenResource(`no tag ${tagId} for this user`);
    }
  }
}
