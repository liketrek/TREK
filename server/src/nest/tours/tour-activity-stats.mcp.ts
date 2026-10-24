import { ADDON_IDS } from '../../addons';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { TourActivityStatsService } from './tour-activity-stats.service';
import { NotFoundException } from '@nestjs/common';
import {
  summarizeTourActivities,
  tourActivityExclusionRequestSchema,
  tourActivityStatsQuerySchema,
  type TourActivityExclusionRequest,
  type TourActivityStatsQuery,
  type TourActivityStatsResponse,
} from '@trek/shared';

const query = tourActivityStatsQuerySchema.shape;
const exclusion = tourActivityExclusionRequestSchema.shape;

/** Today as a calendar day in UTC: the assistant has no time zone of the user's to go by. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The sums of the period and type, the tours they are made of, and what of the user's trips cannot count. */
function answer(stats: TourActivityStatsResponse, filter: TourActivityStatsQuery = {}) {
  const today = todayUtc();
  const summary = summarizeTourActivities(stats.entries, { today, ...filter });
  return {
    today,
    totals: summary.totals,
    by_type: summary.types,
    tours: summary.done,
    upcoming: summary.upcoming,
    uncounted: stats.uncounted,
  };
}

/**
 * STA-02: the user's own tour activities and leaving one out of them, over
 * the same service as the Atlas: every trip the user can open, only the
 * user's own part of it, and the user's own exclusions.
 */
@McpController()
export class TourActivityStatsMcp {
  constructor(
    private readonly stats: TourActivityStatsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'get_tour_activity_stats',
    description:
      'The tours the user has done, summed: how many, distance in km, ascent and descent in metres, as a whole and by type, for a period (from and to, YYYY-MM-DD, both included) and one type, or all of them. A tour counts once the last day it is on is over (today is UTC here), and only where the user takes part: a day of the tour names the user among its participants, or names none, which means everyone of the trip. A day naming only others is theirs. basis "plan" means the values come from the planning of the trip, not from a measurement, and must be said so; basis "track" means a recorded track linked to the tour replaced them. A tour on several days counts once; a whole route stays out while a stage planned from it (derived_from_place_id) counts; a paddle tour sums no heights; null means unknown, never zero. Tours the user left out (excluded true) are listed but not summed. uncounted names the tours of the user\'s trips that are on no day or only on the user\'s days without a date.',
    inputSchema: { from: query.from, to: query.to, type: query.type },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async getTourActivityStats(input: TourActivityStatsQuery, ctx: McpContext) {
    return ok(answer(await this.stats.stats(ctx.userId), input));
  }

  @Tool({
    name: 'set_tour_activity_excluded',
    description:
      'Leave a tour out of the activity sums of the user (excluded true), such as a tour that fell through, or count it again (excluded false), once the user asked for it. place_id is the tour as get_tour_activity_stats lists it. Nothing of the tour, its days or its plan changes, and the sums of anybody else stay as they are. Answers the sums of all time as they are then.',
    inputSchema: { place_id: exclusion.place_id, excluded: exclusion.excluded },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async setTourActivityExcluded(input: TourActivityExclusionRequest, ctx: McpContext) {
    try {
      return ok(answer(await this.stats.setExcluded(ctx.userId, input)));
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }
}
