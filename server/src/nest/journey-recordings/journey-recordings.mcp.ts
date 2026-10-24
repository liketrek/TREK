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
import { addonGate, type HasAddons } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyRecordingsService } from './journey-recordings.service';
import {
  idSchema,
  journeyRecordingDateSchema,
  journeyRecordingPreviewRequestSchema,
  journeyRecordingSaveRequestSchema,
  type JourneyRecordedDay,
  type JourneyRecordingPreviewRequest,
  type JourneyRecordingSaveRequest,
} from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);
const dawarichAddonOn = addonGate(ADDON_IDS.DAWARICH);

/** Taking a day over reads Dawarich into a journey, so both addons have to be on. */
const bothAddonsOn = async (ctx: McpContext, self: HasAddons): Promise<boolean> =>
  (await journeyAddonOn(ctx, self)) && (await dawarichAddonOn(ctx, self));

/**
 * The recorded days a journey keeps (JRN-01) over MCP: the same service and
 * the same journey access as `/api/journeys/:id/recordings`. The lines stay
 * on the map; a tool answers with what a day covers, never its geometry.
 */
@McpController()
export class JourneyRecordingsMcp {
  constructor(
    private readonly recordings: JourneyRecordingsService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_journey_recorded_days',
    description:
      'The days of route recorded in Dawarich that a journey keeps, one per local day: the zone the day was cut in, what it covers (distance, pieces, gaps without recording, modes, first and last time), whether the source was incomplete or the day still running when it was taken over, and whose recording it is. Kept days stay readable when Dawarich is unreachable.',
    inputSchema: { journeyId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async listRecordedDays({ journeyId }: { journeyId: number }, ctx: McpContext) {
    return ok({ days: (await this.recordings.list(ctx.userId, journeyId)).map(summary) });
  }

  @Tool({
    name: 'get_journey_recording_prep',
    description:
      "Whether a journey prepares its recorded days from Dawarich in the background (its owner's switch, update_journey auto_prepare_recordings) and how the caller's own last runs over its linked trip periods went: when the last one was tried, when one last came through (the stays waiting at the journey's days are as new as that) and why the last one failed, plus whether the caller's connection can prepare anything at all (ready, sync_off, not_connected) and, while the switch is on, the linked trip periods those runs reach (a trip that ended more than 400 days ago is not prepared; review_journey_day_stays still reads its days by hand). Prepared stays are reviewed and taken over with review_journey_day_stays and take_over_journey_day_stays; nothing is ever written into the journey on its own. Needs edit access to the journey.",
    inputSchema: { journeyId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: bothAddonsOn,
    access: { group: 'journey', mode: 'read' },
  })
  async getRecordingPrep({ journeyId }: { journeyId: number }, ctx: McpContext) {
    return ok(await this.recordings.prepStatus(ctx.userId, journeyId));
  }

  @Tool({
    name: 'preview_journey_recorded_day',
    description:
      "Read one local day of the route recorded in the caller's own Dawarich and show what a journey would keep, without keeping anything: the window the day runs in, what it covers, whether the journey already keeps that day and if it is the same, how many other people would see it, and the contentHash save_journey_recorded_day needs. utcOffsetMinutes is the zone to cut the day in; useSourceOffset cuts it in Dawarich's own zone where its answer shows one. Needs edit access to the journey.",
    inputSchema: { journeyId: idSchema, ...journeyRecordingPreviewRequestSchema.shape },
    // Reaches the caller's own Dawarich instance rather than TREK's database.
    annotations: { ...TOOL_ANNOTATIONS_READONLY, openWorldHint: true },
    when: bothAddonsOn,
    access: { group: 'journey', mode: 'read' },
  })
  async previewRecordedDay(
    { journeyId, ...request }: { journeyId: number } & JourneyRecordingPreviewRequest,
    ctx: McpContext,
  ) {
    const preview = await this.recordings.preview(ctx.userId, journeyId, request);
    const { segments: _segments, stored, ...rest } = preview;
    return ok({ ...rest, stored: stored ? summary(stored) : null });
  }

  @Tool({
    name: 'save_journey_recorded_day',
    description:
      "Keep one local day of the route recorded in the caller's Dawarich in a journey, after the traveller confirmed the preview. Send the utcOffsetMinutes and contentHash (as expectedHash) of preview_journey_recorded_day: when the recording changed since, nothing is kept and the answer says so. A day kept already exactly so is left as it is; a different version is replaced only with replace: true. Never changes an entry or a text of the journey. Everyone who can open the journey sees the route on its map.",
    inputSchema: { journeyId: idSchema, date: journeyRecordingDateSchema, ...journeyRecordingSaveRequestSchema.shape },
    annotations: { ...TOOL_ANNOTATIONS_WRITE, openWorldHint: true },
    when: bothAddonsOn,
    access: { group: 'journey', mode: 'write' },
  })
  async saveRecordedDay(
    { journeyId, date, ...request }: { journeyId: number; date: string } & JourneyRecordingSaveRequest,
    ctx: McpContext,
  ) {
    const { day, outcome } = await this.recordings.save(ctx.userId, journeyId, date, request);
    return ok({ outcome, day: summary(day) });
  }

  @Tool({
    name: 'delete_journey_recorded_day',
    description:
      'Drop the recorded route a journey keeps for one local day. Its entries and texts stay as they are, and Dawarich keeps its own recording. Needs edit access to the journey.',
    inputSchema: { journeyId: idSchema, date: journeyRecordingDateSchema },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async deleteRecordedDay({ journeyId, date }: { journeyId: number; date: string }, ctx: McpContext) {
    await this.recordings.remove(ctx.userId, journeyId, date);
    return ok({ success: true });
  }
}

/** A kept day without its geometry, which is the whole payload and belongs on a map. */
function summary(day: JourneyRecordedDay) {
  const { segments: _segments, ...rest } = day;
  return rest;
}
