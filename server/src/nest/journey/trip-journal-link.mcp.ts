import { ADDON_IDS } from '../../addons';
import {
  McpController,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  Tool,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripJournalLinkService, type TripJournalActor } from './trip-journal-link.service';
import { idSchema, tripJournalLinkRequestSchema } from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

/**
 * The trip's linked journal over MCP: the same service, the same permission and
 * journal-owner rules as `/api/trips/:tripId/journal`, behind the Journey addon.
 */
@McpController()
export class TripJournalLinkMcp {
  constructor(
    private readonly links: TripJournalLinkService,
    private readonly guards: McpToolGuardsService,
    readonly addons: AddonsService,
  ) {}

  private async actor(tripId: number, userId: number): Promise<TripJournalActor> {
    const { role } = await this.guards.tripWriter(tripId, userId);
    return { id: userId, role };
  }

  @Tool({
    name: 'get_trip_journal',
    description:
      'The journal from the Journey addon a trip shows as its own, if any: its id and title, your access to it, and whether you may link, unlink or change who it is open to. Open the journal itself with get_journey.',
    inputSchema: { tripId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async getTripJournal({ tripId }: { tripId: number }, ctx: McpContext) {
    return ok(await this.links.get(tripId, await this.actor(tripId, ctx.userId)));
  }

  @Tool({
    name: 'link_trip_journal',
    description:
      'Show one of your own journals in a trip, replacing the journal it showed. The trip members listed get into the journal as viewers or editors and see it in their own journal list; members left out do not. Needs the journal to be yours and the trip permission to link journals.',
    inputSchema: { tripId: idSchema, journey_id: idSchema, members: tripJournalLinkRequestSchema.shape.members },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async linkTripJournal(
    {
      tripId,
      journey_id,
      members,
    }: { tripId: number; journey_id: number; members: { user_id: number; role: 'viewer' | 'editor' }[] },
    ctx: McpContext,
  ) {
    return ok(await this.links.link(tripId, await this.actor(tripId, ctx.userId), journey_id, members));
  }

  @Tool({
    name: 'set_trip_journal_members',
    description:
      "Change which trip members the trip's linked journal is open to, and as viewer or editor. The list replaces the one before; anyone left out loses the access the link gave them. Only the journal's owner can do this.",
    inputSchema: { tripId: idSchema, members: tripJournalLinkRequestSchema.shape.members },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async setTripJournalMembers(
    { tripId, members }: { tripId: number; members: { user_id: number; role: 'viewer' | 'editor' }[] },
    ctx: McpContext,
  ) {
    return ok(await this.links.setMembers(tripId, await this.actor(tripId, ctx.userId), members));
  }

  @Tool({
    name: 'unlink_trip_journal',
    description:
      'Take the linked journal off a trip. The journal itself stays; the members the link let in lose that access, while its owner and direct contributors keep theirs.',
    inputSchema: { tripId: idSchema },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async unlinkTripJournal({ tripId }: { tripId: number }, ctx: McpContext) {
    return ok(await this.links.unlink(tripId, await this.actor(tripId, ctx.userId)));
  }
}
