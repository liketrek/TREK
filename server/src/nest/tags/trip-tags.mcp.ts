import {
  McpController,
  Tool,
  type McpContext,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripTagsService } from './trip-tags.service';
import { hexColorSchema, idSchema, tripTagNameSchema } from '@trek/shared';

/**
 * The tags a trip owns, as MCP tools: adapters over TripTagsService, the same
 * use cases the /api/trips/:tripId/tags routes run. The service holds the trip
 * gate and sends `tripTags:changed`, so a refusal reads the same on both
 * surfaces and a tag an assistant adds shows up for every member at once.
 *
 * In the `places` scope group like the personal tag tools, since a tag only
 * ever labels places. The ids go into `tags` on create_place and update_place.
 */
@McpController()
export class TripTagsMcp {
  constructor(
    private readonly tripTags: TripTagsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'list_trip_tags',
    description:
      'List the tags a trip owns: the labels every member of the trip sees, filters its places by and can put on them. Pass their ids as `tags` to create_place, create_and_assign_place and update_place. list_tags answers the personal tags of the current user instead.',
    inputSchema: {
      tripId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async listTripTags({ tripId }: { tripId: number }, ctx: McpContext) {
    return ok({ tags: await this.tripTags.list(tripId, ctx.userId) });
  }

  @Tool({
    name: 'create_trip_tag',
    description:
      "Add a tag to a trip, shared by everybody on it. A name stands once per trip, whatever its case: asking for a name the trip already has answers that tag instead of making a second one, so call this freely before tagging places. Needs the right to edit the trip's places.",
    inputSchema: {
      tripId: idSchema,
      name: tripTagNameSchema,
      color: hexColorSchema.optional().describe('Hex color string e.g. #6366f1'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async createTripTag({ tripId, name, color }: { tripId: number; name: string; color?: string }, ctx: McpContext) {
    const tag = await this.tripTags.create(tripId, { name, color }, await this.guards.tripWriter(tripId, ctx.userId));
    return ok({ tag });
  }

  @Tool({
    name: 'update_trip_tag',
    description:
      "Rename or recolour a tag of a trip. Every place that carries it shows the change, for every member. A name another tag of the trip already has is refused. Needs the right to edit the trip's places.",
    inputSchema: {
      tripId: idSchema,
      tagId: idSchema,
      name: tripTagNameSchema.optional(),
      color: hexColorSchema.optional().describe('Hex color string e.g. #6366f1'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateTripTag(
    { tripId, tagId, name, color }: { tripId: number; tagId: number; name?: string; color?: string },
    ctx: McpContext,
  ) {
    const writer = await this.guards.tripWriter(tripId, ctx.userId);
    return ok({ tag: await this.tripTags.update(tripId, tagId, { name, color }, writer) });
  }

  @Tool({
    name: 'delete_trip_tag',
    description:
      "Delete a tag of a trip. It comes off every place of the trip that carried it, for every member; the places themselves stay. Needs the right to edit the trip's places.",
    inputSchema: {
      tripId: idSchema,
      tagId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async deleteTripTag({ tripId, tagId }: { tripId: number; tagId: number }, ctx: McpContext) {
    await this.tripTags.remove(tripId, tagId, await this.guards.tripWriter(tripId, ctx.userId));
    return ok({ success: true });
  }
}
