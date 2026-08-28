import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { AddonsService } from './addons.service';

/**
 * Instance-capability MCP surface, reading through the same AddonsService.list()
 * that GET /api/addons returns.
 *
 * Why it exists: the registry drops an entry when either its addon gate or its
 * scope gate says no, one filter with one outcome, so a session that finds no
 * budget tools cannot tell "the admin switched budget off" from "this token was
 * never granted budget:read". The session instructions tell the model to check
 * availability before assuming a tool exists, which until now it had nothing to
 * check with.
 *
 * No `access` marker, so it is registered for every session. The REST route is
 * gated by JwtAuthGuard and nothing else, so there is no scope to mirror; the
 * payload is instance configuration rather than anybody's data; and a scope gate
 * would withhold the availability answer from exactly the sessions whose thin
 * tool list needs explaining. settings:read is not the honest fit either, it
 * covers a user's own preferences.
 */
@McpController()
export class AddonsMcp {
  constructor(private readonly addons: AddonsService) {}

  @Tool({
    name: 'list_addons',
    description:
      'Report which optional add-ons are enabled on this TREK instance, which collab sub-features (chat, notes, polls, whatsnext) are switched on, and whether packing bag tracking is on. Only enabled entries are listed, so anything absent is off here. Tools belonging to a disabled add-on are never registered, so call this to tell "the feature is off on this instance" apart from "the tool call failed", and before promising a user that budget, packing, collab, atlas, vacay, journey or collections will work.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  listAddons(_args: Record<string, never>, _ctx: McpContext) {
    const { addons, collabFeatures, bagTracking } = this.addons.list();
    // icon, config and fields are admin-panel chrome: an icon name and the
    // photo-provider settings form say nothing about what a tool can do.
    return ok({
      addons: addons.map(({ id, name, type, enabled }) => ({ id, name, type, enabled })),
      collabFeatures,
      bagTracking,
    });
  }
}
