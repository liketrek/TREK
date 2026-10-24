import { ADDON_IDS } from '../../addons';
import {
  McpController,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  Tool,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate, type HasAddons } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyDayImportService } from './journey-day-import.service';
import {
  idSchema,
  journeyDayImportRequestSchema,
  journeyRecordingDateSchema,
  type JourneyDayImportRequest,
} from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);
const dawarichAddonOn = addonGate(ADDON_IDS.DAWARICH);

const bothAddonsOn = async (ctx: McpContext, self: HasAddons): Promise<boolean> =>
  (await journeyAddonOn(ctx, self)) && (await dawarichAddonOn(ctx, self));

/**
 * A recorded day taken into a journey with its stays (JRN-02) over MCP: the
 * same service, refusals and journey access as
 * `/api/journeys/:id/recordings/:date/stays`.
 */
@McpController()
export class JourneyDayImportMcp {
  constructor(
    private readonly dayImport: JourneyDayImportService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'review_journey_day_stays',
    description:
      "The stays Dawarich found on one local day, from the caller's own connection, as a journey would take them over: each with its suggestionId, name, place, arrival and departure, whether Dawarich only guessed it, and its status for this journey (open, skipped before, here with the entry holding it, or taken over elsewhere), plus the entries the journey has on the day. When Dawarich does not answer, the stays of the last sync are shown with fresh: false and the reason. Reading the day again refreshes the caller's own stored stays of it, nothing in the journey. Needs edit access to the journey.",
    inputSchema: { journeyId: idSchema, date: journeyRecordingDateSchema },
    // Reaches the caller's own Dawarich instance and refreshes their stored stays of the day, like the
    // recording preview; nothing of the journey changes, so it reads as a read.
    annotations: { ...TOOL_ANNOTATIONS_READONLY, openWorldHint: true },
    when: bothAddonsOn,
    access: { group: 'journey', mode: 'read' },
  })
  async reviewDayStays({ journeyId, date }: { journeyId: number; date: string }, ctx: McpContext) {
    return ok(await this.dayImport.review(ctx.userId, journeyId, date));
  }

  @Tool({
    name: 'take_over_journey_day_stays',
    description:
      'Take stays of one local day into a journey as draft entries, after the traveller chose them in review_journey_day_stays. Each group becomes one draft: kind single (one stay), merged (stays of one place, pinned at anchorSuggestionId or the longest stay) or report (a day report listing its stays with their times, at anchorSuggestionId or, with null, without a map position). merged and report need a title; a stay may carry a corrected name. skipSuggestionIds are open stays left out on purpose; they are dismissed and can be restored. Every stay keeps its own place and times on the entry. Stays the journey holds already are reported in alreadyTaken and never written twice. Drafts never appear on shared pages, and nothing written before is changed.',
    inputSchema: { journeyId: idSchema, date: journeyRecordingDateSchema, ...journeyDayImportRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: bothAddonsOn,
    access: { group: 'journey', mode: 'write' },
  })
  async takeOverDayStays(
    { journeyId, date, ...request }: { journeyId: number; date: string } & JourneyDayImportRequest,
    ctx: McpContext,
  ) {
    return ok(await this.dayImport.takeOver(ctx.userId, journeyId, date, request));
  }
}
